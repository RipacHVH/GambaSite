import {
  decimalToImpliedProb,
  devigOutcomes,
  consensusProbability,
  calculateEV,
} from "../shared/oddsMath.mjs";

const MIN_BOOKS_FOR_CONSENSUS = 3;
const MAX_PLAUSIBLE_EV = 25;

function groupH2H(bookmakers) {
  // Outcome order is whatever the book returns (Home, Away, Draw) — keep a
  // stable key per name so books can be compared on the same outcome.
  const byOutcome = new Map(); // name -> [{ bookmaker, decimal }]

  for (const book of bookmakers) {
    const market = book.markets?.find((m) => m.key === "h2h");
    if (!market || market.outcomes.length < 2) continue;

    const fair = devigOutcomes(market.outcomes.map((o) => o.price));
    if (!fair) continue;

    market.outcomes.forEach((o, i) => {
      if (!byOutcome.has(o.name)) byOutcome.set(o.name, []);
      byOutcome.get(o.name).push({ bookmaker: book.title, decimal: o.price, fairProb: fair[i] });
    });
  }

  return [{ point: null, byOutcome }];
}

function groupByPoint(bookmakers, marketKey) {
  // totals: outcomes "Over"/"Under" sharing a point. spreads: outcomes are team
  // names sharing a point (the handicap line). Group same-point offerings
  // together so different bookmakers' identical lines can be compared.
  const groups = new Map(); // point -> { byOutcome: Map<name, [{bookmaker, decimal}]> }

  for (const book of bookmakers) {
    const market = book.markets?.find((m) => m.key === marketKey);
    if (!market) continue;

    const byPoint = new Map();
    for (const o of market.outcomes) {
      const point = o.point ?? 0;
      if (!byPoint.has(point)) byPoint.set(point, []);
      byPoint.get(point).push(o);
    }

    for (const [point, outcomes] of byPoint) {
      if (outcomes.length < 2) continue;
      const fair = devigOutcomes(outcomes.map((o) => o.price));
      if (!fair) continue;

      if (!groups.has(point)) groups.set(point, new Map());
      const byOutcome = groups.get(point);

      outcomes.forEach((o, i) => {
        if (!byOutcome.has(o.name)) byOutcome.set(o.name, []);
        byOutcome.get(o.name).push({ bookmaker: book.title, decimal: o.price, fairProb: fair[i] });
      });
    }
  }

  return Array.from(groups.entries()).map(([point, byOutcome]) => ({ point, byOutcome }));
}

function bestBetsFromGroup({ point, byOutcome }, marketKey, homeTeam, awayTeam) {
  const bets = [];

  for (const [name, entries] of byOutcome) {
    // Require at least 3 books pricing this outcome's full market before
    // trusting the consensus — with 1-2 books, a single stale/soft line can
    // masquerade as a huge "edge" that's really just bad data.
    if (entries.length < MIN_BOOKS_FOR_CONSENSUS) continue;

    const trueProb = consensusProbability(entries.map((e) => e.fairProb));
    if (!Number.isFinite(trueProb)) continue;

    const best = entries.reduce((a, b) => (b.decimal > a.decimal ? b : a));
    const ev = calculateEV(best.decimal, trueProb);
    if (ev === null) continue;

    // Anything beyond this is far more likely to be a pricing error on the
    // "best" book than a genuine inefficiency — cap it out rather than
    // surface a number nobody should actually bet on.
    if (ev > MAX_PLAUSIBLE_EV) continue;

    bets.push({
      market: marketKey,
      selection: name,
      label: buildLabel(marketKey, name, point, homeTeam, awayTeam),
      point,
      bookmaker: best.bookmaker,
      decimalOdds: Number(best.decimal.toFixed(3)),
      impliedProb: Number((decimalToImpliedProb(best.decimal) * 100).toFixed(2)),
      trueProb: Number((trueProb * 100).toFixed(2)),
      ev: Number(ev.toFixed(2)),
    });
  }

  return bets;
}

function buildLabel(marketKey, name, point, homeTeam, awayTeam) {
  if (marketKey === "h2h") {
    if (name === "Draw") return "Draw (Match Result)";
    return `${name} to Win (Match Result)`;
  }
  if (marketKey === "totals") {
    return `${name} ${point} Goals (Total)`;
  }
  if (marketKey === "spreads") {
    const sign = point > 0 ? `+${point}` : `${point}`;
    return `${name} ${sign} (Asian Handicap)`;
  }
  return name;
}

/**
 * Turn one raw event from The Odds API into our { match, kickoff, league,
 * bets[] } shape, with bets ranked by EV (best first).
 */
export function analyzeEvent(event, leagueName) {
  const bookmakers = event.bookmakers ?? [];
  if (bookmakers.length === 0) return null;

  const h2hGroups = groupH2H(bookmakers);
  const totalsGroups = groupByPoint(bookmakers, "totals");
  const spreadsGroups = groupByPoint(bookmakers, "spreads");

  const allBets = [
    ...h2hGroups.flatMap((g) => bestBetsFromGroup(g, "h2h", event.home_team, event.away_team)),
    ...totalsGroups.flatMap((g) => bestBetsFromGroup(g, "totals", event.home_team, event.away_team)),
    ...spreadsGroups.flatMap((g) => bestBetsFromGroup(g, "spreads", event.home_team, event.away_team)),
  ].sort((a, b) => b.ev - a.ev);

  if (allBets.length === 0) return null;

  return {
    eventId: event.id,
    league: leagueName,
    match: `${event.home_team} vs ${event.away_team}`,
    homeTeam: event.home_team,
    awayTeam: event.away_team,
    kickoff: event.commence_time,
    bets: allBets,
  };
}

/**
 * Build the full picks payload: the single best free pick of the day across
 * everything, and the pro board grouped by league with the top 3 bets per match.
 */
export function buildPicksPayload(leagueResults) {
  const analyzedByLeague = leagueResults.map(({ league, events }) => ({
    league,
    matches: events.map((e) => analyzeEvent(e, league.name)).filter(Boolean),
  }));

  const allMatches = analyzedByLeague.flatMap((l) => l.matches);
  const allBetsFlat = allMatches.flatMap((m) =>
    m.bets.map((b) => ({ ...b, match: m.match, league: m.league, kickoff: m.kickoff }))
  );
  allBetsFlat.sort((a, b) => b.ev - a.ev);

  const freePick = allBetsFlat[0] ?? null;

  const proBoard = analyzedByLeague
    .filter((l) => l.matches.length > 0)
    .map((l) => ({
      league: l.league.name,
      matches: l.matches
        .map((m) => ({
          match: m.match,
          kickoff: m.kickoff,
          bets: m.bets.slice(0, 3),
        }))
        .sort((a, b) => (b.bets[0]?.ev ?? -999) - (a.bets[0]?.ev ?? -999)),
    }));

  return {
    generatedAt: new Date().toISOString(),
    freePick,
    proBoard,
  };
}
