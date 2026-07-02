import {
  decimalToImpliedProb,
  devigOutcomes,
  weightedConsensusProbability,
  isSharpBook,
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
  const byOutcome = new Map();
  for (const book of bookmakers) {
    const market = book.markets?.find((m) => m.key === "h2h");
    // Soccer match result is a 3-way market (home/draw/away). De-vigging a
    // partial 2-outcome quote spreads the missing outcome's probability across
    // the other two, corrupting the fair probs — require the full market.
    if (!market || market.outcomes.length < 3) continue;
    const fair = devigOutcomes(market.outcomes.map((o) => o.price));
    if (!fair) continue;
    const sharp = isSharpBook(book.title);
    market.outcomes.forEach((o, i) => {
      if (!byOutcome.has(o.name)) byOutcome.set(o.name, []);
      byOutcome.get(o.name).push({ bookmaker: book.title, decimal: o.price, fairProb: fair[i], sharp });
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

      const sharp = isSharpBook(book.title);
      outcomes.forEach((o, i) => {
        if (!byOutcome.has(o.name)) byOutcome.set(o.name, []);
        byOutcome.get(o.name).push({ bookmaker: book.title, decimal: o.price, fairProb: fair[i], sharp });
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

    // Sharp-weighted median: Pinnacle/exchange prices anchor the consensus
    // (they run the thinnest margins and move first), soft books still vote.
    const trueProb = weightedConsensusProbability(entries);
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
      books: entries.length,                       // consensus sample size
      sharpBooks: entries.filter(e => e.sharp).length, // how many sharp books priced it
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

  // Combined EV is multiplicative: every extra leg with EV ≤ 0 strictly LOWERS
  // the parlay's expected value. So: rank purely by EV (league priority only as
  // a tiebreak), take positive-EV legs first, and only pad with the
  // least-negative legs when we don't have the 2 minimum — never to "fill" 4.
  candidates.sort((a, b) =>
    b.ev !== a.ev ? b.ev - a.ev : a._priority - b._priority
  );

  const positive = candidates.filter(c => c.ev > 0);
  let chosen;
  if (positive.length >= 2) {
    chosen = positive.slice(0, maxLegs);           // only +EV legs, up to maxLegs
  } else {
    chosen = candidates.slice(0, 2);               // minimum viable parlay
  }

  const legs = chosen.map(({ _priority, ...rest }) => rest);
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

  const strongConsensus = (b) => b.books >= MIN_BOOKS_PRO_BOARD; // ≥4 books priced it
  const odds       = (min, max) => (b) => b.decimalOdds >= min && b.decimalOdds <= max && b.ev > 0;
  const highProb   = (b) => b.trueProb > 50 && b.decimalOdds >= 1.5 && b.ev > 0;
  const highProbStrong  = (b) => highProb(b) && strongConsensus(b);
  const highProbRelaxed = (b) => b.trueProb > 50 && b.decimalOdds >= 1.5; // drop EV > 0 requirement
  const minOdds    = (b) => b.decimalOdds >= 1.5; // absolute last resort: just highest probability

  // Within the safety constraints (prob > 50%, odds ≥ 1.5, +EV) rank by EV —
  // that maximises long-run profit; ranking by probability inside a +EV pool
  // just picks the shortest price. Lower tiers (no +EV available) still rank
  // by probability, because when every bet is -EV the least-bad daily pick is
  // the most likely winner, not the least-negative edge.
  const freePick =
    // Tier 1-2: >50% prob + 1.50+ odds + +EV + strong consensus (≥4 books)
    pickBest(buildCandidates(analyzedByLeague.filter(eliteOnly), isToday, highProbStrong)) ??
    pickBest(buildCandidates(analyzedByLeague,                   isToday, highProbStrong)) ??
    // Tier 2b: same but accept thinner consensus (3 books)
    pickBest(buildCandidates(analyzedByLeague,                   isToday, highProb)) ??
    // Tier 3: >50% true prob + 1.50+ odds (relax EV requirement)
    pickBest(buildCandidates(analyzedByLeague,                   isToday, highProbRelaxed), "prob") ??
    // Tier 4: any +EV today, 1.50-6.00 odds (no prob filter — fallback)
    pickBest(buildCandidates(analyzedByLeague.filter(eliteOnly), isToday, odds(1.5, 6.0))) ??
    pickBest(buildCandidates(analyzedByLeague,                   isToday, odds(1.5, 6.0))) ??
    // Tier 5: look 48h ahead, still prefer high prob
    pickBest(buildCandidates(analyzedByLeague.filter(eliteOnly), is48h,   highProb)) ??
    pickBest(buildCandidates(analyzedByLeague,                   is48h,   highProb)) ??
    // Tier 6: absolute last resort — highest prob bet with 1.50+ odds
    pickBest(buildCandidates(analyzedByLeague,                   isToday, minOdds), "prob") ??
    pickBest(buildCandidates(analyzedByLeague,                   is48h,   minOdds), "prob") ??
    null;

  const now = Date.now();
  const fortyEightHours = now + 48 * 60 * 60 * 1000;

  // Pro board — same pool as parlay (1.40–3.50 odds) but shows multiple matches
  // and multiple bets per match. Priority: best EV first, but never two bets that
  // contradict each other (e.g. Over 3 AND Under 2.5) or are redundant (e.g. Over 3
  // AND Over 3.5). Also never shows the exact same selection as the free pick.
  function isSameAsFreePick(matchName, bet) {
    if (!freePick) return false;
    return freePick.match === matchName &&
           freePick.market === bet.market &&
           freePick.selection === bet.selection;
  }

  // Does this bet win for a given final score?
  function betWins(bet, home, away, hg, ag) {
    const total = hg + ag;
    if (bet.market === "h2h") {
      if (bet.selection === "Draw") return hg === ag;
      if (bet.selection === home)   return hg > ag;
      if (bet.selection === away)   return ag > hg;
      return false;
    }
    if (bet.market === "totals") {
      const pt = bet.point ?? 2.5;
      if (bet.selection === "Over")  return total > pt;
      if (bet.selection === "Under") return total < pt;
      return false;
    }
    if (bet.market === "spreads") {
      const pt = bet.point ?? 0; // handicap applies to the selected team
      if (bet.selection === home) return hg + pt > ag;
      if (bet.selection === away) return ag + pt > hg;
      return false;
    }
    return false;
  }

  // Two bets are "compatible" if there's at least one realistic final score where
  // BOTH win. If no such score exists they contradict (e.g. Over 3 vs Under 2.5,
  // or Draw vs France -1.5). Scan a 0–8 goal grid — covers any real soccer match.
  function compatible(a, b, home, away) {
    for (let hg = 0; hg <= 8; hg++)
      for (let ag = 0; ag <= 8; ag++)
        if (betWins(a, home, away, hg, ag) && betWins(b, home, away, hg, ag)) return true;
    return false;
  }

  // Same market + same selection (e.g. Over 3 and Over 3.5) = same directional
  // view on the match — redundant, no value in showing both.
  function redundant(a, b) {
    return a.market === b.market && a.selection === b.selection;
  }

  const proBoard = analyzedByLeague
    .flatMap(({ league, matches }) =>
      matches
        .filter(m => {
          const t = new Date(m.kickoff).getTime();
          return t >= now && t <= fortyEightHours;
        })
        .map(m => {
          // Same odds window as the parlay so picks are realistic. Prefer bets
          // priced by ≥4 books (stricter consensus for Pro), fall back to the
          // base 3-book pool if that filter empties the match.
          const inWindow = m.bets.filter(b =>
            b.decimalOdds >= 1.4 &&
            b.decimalOdds <= 3.5 &&
            !isSameAsFreePick(m.match, b)
          );
          const strong = inWindow.filter(b => b.books >= MIN_BOOKS_PRO_BOARD);
          const candidates = strong.length > 0 ? strong : inWindow;

          if (candidates.length === 0) return null;

          // Best EV first, then highest prob as tiebreak
          candidates.sort((a, b) => b.ev - a.ev || b.trueProb - a.trueProb);

          const [home, away] = (m.homeTeam && m.awayTeam)
            ? [m.homeTeam, m.awayTeam]
            : m.match.split(" vs ").map(s => s.trim());

          // This is an EDGE ledger: surface genuine +EV bets (up to 3). When a
          // match has no positive edge, show only its single best bet — never a
          // stack of negative-EV entries dressed up as edges.
          const pool = candidates.some(b => b.ev > 0)
            ? candidates.filter(b => b.ev > 0)
            : candidates.slice(0, 1);

          // Skip any that contradict (can't co-win) or are redundant (same
          // directional view) with an already-selected bet.
          const selected = [];
          for (const bet of pool) {
            const ok = selected.every(s => compatible(s, bet, home, away) && !redundant(s, bet));
            if (ok) selected.push(bet);
            if (selected.length >= 3) break;
          }

          return selected.length > 0
            ? { league: m.league ?? league.name, match: m.match, kickoff: m.kickoff, bets: selected }
            : null;
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
