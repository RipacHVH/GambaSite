import {
  decimalToImpliedProb,
  devigOutcomes,
  consensusProbability,
  calculateEV,
} from "../shared/oddsMath.mjs";

const MIN_BOOKS_FOR_CONSENSUS = 3;
const MIN_BOOKS_PRO_BOARD = 4;   // stricter consensus for Pro picks
const MAX_PLAUSIBLE_EV = 25;

// Bookmaker display priority — we always show odds from the highest-ranked
// available book so the displayed bookmaker is consistent and well-known.
const BOOK_PRIORITY = [
  "Bet365", "bet365",
  "Pinnacle",
  "William Hill",
  "Betfair",
  "Unibet",
  "Ladbrokes",
  "Coral",
  "Bwin",
  "DraftKings",
  "FanDuel",
];

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

    // Pick the preferred known bookmaker; fall back to best odds if none match
    const preferred = BOOK_PRIORITY.map((name) =>
      entries.find((e) => e.bookmaker.toLowerCase().includes(name.toLowerCase()))
    ).find(Boolean);
    const best = preferred ?? entries.reduce((a, b) => (b.decimal > a.decimal ? b : a));
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
  if (marketKey === "btts") {
    return `Both Teams to Score: ${name}`;
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

  const bttsGroups = groupH2H(bookmakers.map(b => ({
    ...b,
    markets: b.markets?.map(m => m.key === "btts" ? { ...m, key: "h2h" } : m),
  }))).map(g => ({ ...g, _market: "btts" }));

  const allBets = [
    ...h2hGroups.flatMap((g) => bestBetsFromGroup(g, "h2h",    event.home_team, event.away_team)),
    ...totalsGroups.flatMap((g) => bestBetsFromGroup(g, "totals", event.home_team, event.away_team)),
    ...bttsGroups.flatMap((g) => bestBetsFromGroup({ ...g, _market: undefined }, "btts", event.home_team, event.away_team)),
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

function isTodayUTC(isoString) {
  const today = new Date().toISOString().slice(0, 10);
  return isoString?.slice(0, 10) === today;
}

function isTomorrowUTC(isoString) {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return isoString?.slice(0, 10) === tomorrow;
}

/**
 * Build a parlay from events matching dateFilter.
 * Picks the best +EV bet from each match (one leg per match), up to maxLegs.
 * Legs selected for reasonable odds (1.4–3.5) so the parlay stays playable.
 */
export function buildParlay(analyzedByLeague, dateFilter, maxLegs = 4) {
  const candidates = [];

  for (const { league, matches } of analyzedByLeague) {
    for (const match of matches) {
      if (!dateFilter(match)) continue;
      // Best bet in an accessible odds window — one leg per match only.
      // Prefer +EV, but fall back to lowest-negative-EV when no +EV bets exist.
      const inWindow = match.bets.filter(b => b.decimalOdds >= 1.4 && b.decimalOdds <= 3.5);
      if (!inWindow.length) continue;
      const bet = inWindow.reduce((best, b) => b.ev > best.ev ? b : best);
      candidates.push({
        ...bet,
        match: match.match,
        league: match.league ?? league.name,
        kickoff: match.kickoff,
        eventId: match.eventId,
        _priority: league.priority ?? 99,
      });
    }
  }

  if (candidates.length < 2) return null;

  // Higher-priority leagues first, then by EV
  candidates.sort((a, b) =>
    a._priority !== b._priority ? a._priority - b._priority : b.ev - a.ev
  );

  const legs = candidates.slice(0, maxLegs).map(({ _priority, ...rest }) => rest);
  if (legs.length < 2) return null;

  const combinedOdds    = legs.reduce((acc, l) => acc * l.decimalOdds, 1);
  const combinedTrueProb = legs.reduce((acc, l) => acc * (l.trueProb / 100), 1) * 100;
  const combinedEV      = (combinedOdds * (combinedTrueProb / 100) - 1) * 100;

  return {
    legs,
    legCount: legs.length,
    combinedOdds:     Number(combinedOdds.toFixed(2)),
    combinedTrueProb: Number(combinedTrueProb.toFixed(2)),
    combinedEV:       Number(combinedEV.toFixed(2)),
  };
}

// Minimum decimal odds for the free pick — filters out chalk bets where even a
// real edge produces a trivial return (e.g. 1.05 at true prob 0.99).
const MIN_FREE_PICK_ODDS = 1.5;
// Cap at 6.00 — beyond this the implied probability is <17% and even genuine
// edges carry too much variance to serve as a reliable daily recommendation.
const MAX_FREE_PICK_ODDS = 6.0;

function pickBest(betsFlat, sortBy = "ev") {
  if (betsFlat.length === 0) return null;
  betsFlat.sort((a, b) =>
    a._priority !== b._priority
      ? a._priority - b._priority
      : sortBy === "prob"
        ? b.trueProb - a.trueProb
        : b.ev - a.ev
  );
  const { _priority, ...rest } = betsFlat[0];
  return rest;
}

function buildCandidates(analyzedByLeague, matchFilter, betFilter) {
  return analyzedByLeague.flatMap(({ league, matches }) =>
    matches
      .filter(matchFilter)
      .flatMap((m) =>
        m.bets
          .filter(betFilter)
          .map((b) => ({
            ...b,
            match: m.match,
            league: m.league ?? league,
            kickoff: m.kickoff,
            _priority: league.priority ?? 99,
          }))
      )
  );
}

/**
 * Free pick waterfall — tries each tier in order, returns the first non-empty result:
 *   1. Today + elite leagues (p1)  + 1.50–6.00 odds + EV > 0   ← ideal
 *   2. Today + all leagues         + 1.50–6.00 odds + EV > 0   ← broaden league scope
 *   3. Today + all leagues         + 1.30–8.00 odds + EV > 0   ← relax odds window
 *   4. Today + all leagues         + any odds        + EV > 0   ← any +EV bet today
 *   5. Next 48h + elite leagues    + 1.50–6.00 odds + EV > 0   ← no games today, look ahead
 *   6. Next 48h + all leagues      + 1.50–6.00 odds + EV > 0   ← last resort
 */
export function analyzeAllLeagues(leagueResults) {
  return leagueResults.map(({ league, events }) => ({
    league,
    matches: (events ?? []).map((e) => analyzeEvent(e, league.name)).filter(Boolean),
  }));
}

export function buildPicksPayload(leagueResults) {
  const analyzedByLeague = leagueResults.map(({ league, events }) => ({
    league,
    matches: events.map((e) => analyzeEvent(e, league.name)).filter(Boolean),
  }));

  const isToday   = (m) => isTodayUTC(m.kickoff);
  const is48h     = (m) => {
    const t = new Date(m.kickoff).getTime();
    return t >= Date.now() && t <= Date.now() + 48 * 60 * 60 * 1000;
  };
  const eliteOnly = (l) => l.league.priority === 1;

  const odds       = (min, max) => (b) => b.decimalOdds >= min && b.decimalOdds <= max && b.ev > 0;
  const highProb   = (b) => b.trueProb > 50 && b.decimalOdds >= 1.5 && b.ev > 0;
  const highProbRelaxed = (b) => b.trueProb > 50 && b.decimalOdds >= 1.5; // drop EV > 0 requirement
  const anyPosEV   = (b) => b.ev > 0;
  const minOdds    = (b) => b.decimalOdds >= 1.5; // absolute last resort: just highest probability

  const freePick =
    // Tier 1-2: >50% true prob + 1.50+ odds + +EV  (preferred)
    pickBest(buildCandidates(analyzedByLeague.filter(eliteOnly), isToday, highProb), "prob") ??
    pickBest(buildCandidates(analyzedByLeague,                   isToday, highProb), "prob") ??
    // Tier 3: >50% true prob + 1.50+ odds (relax EV requirement)
    pickBest(buildCandidates(analyzedByLeague,                   isToday, highProbRelaxed), "prob") ??
    // Tier 4: any +EV today, 1.50-6.00 odds (no prob filter — fallback)
    pickBest(buildCandidates(analyzedByLeague.filter(eliteOnly), isToday, odds(1.5, 6.0))) ??
    pickBest(buildCandidates(analyzedByLeague,                   isToday, odds(1.5, 6.0))) ??
    // Tier 5: look 48h ahead, still prefer high prob
    pickBest(buildCandidates(analyzedByLeague.filter(eliteOnly), is48h,   highProb), "prob") ??
    pickBest(buildCandidates(analyzedByLeague,                   is48h,   highProb), "prob") ??
    // Tier 6: absolute last resort — highest prob bet with 1.50+ odds
    pickBest(buildCandidates(analyzedByLeague,                   isToday, minOdds), "prob") ??
    pickBest(buildCandidates(analyzedByLeague,                   is48h,   minOdds), "prob") ??
    null;

  const now = Date.now();
  const sevenDays = now + 7 * 24 * 60 * 60 * 1000;

  // Market display order: h2h → btts → totals → spreads
  function marketRank(m) { return m === "h2h" ? 0 : m === "btts" ? 1 : m === "totals" ? 2 : 3; }

  // Show every match that has any +EV bet. Per match, prefer common markets
  // (h2h, btts, totals) and sort within market by EV descending.
  const proBoard = analyzedByLeague
    .flatMap(({ league, matches }) =>
      matches
        .filter((m) => {
          const t = new Date(m.kickoff).getTime();
          return t >= now && t <= sevenDays;
        })
        .map((m) => {
          const bets = m.bets
            .filter((b) => b.ev > 0)
            .sort((a, b) => {
              const mDiff = marketRank(a.market) - marketRank(b.market);
              return mDiff !== 0 ? mDiff : b.ev - a.ev;
            })
            .slice(0, 3);
          return bets.length > 0 ? { league: league.name, match: m.match, kickoff: m.kickoff, bets } : null;
        })
        .filter(Boolean)
    )
    .sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));

  return {
    generatedAt: new Date().toISOString(),
    freePick,
    proBoard,
  };
}
