import "dotenv/config";
import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import { fetchAllLeagues, fetchScores, fetchInPlayOdds } from "./oddsApi.mjs";
import { buildPicksPayload, analyzeAllLeagues, buildParlay } from "./analysis.mjs";
import { LEAGUES } from "./leagues.mjs";
import { router as authRouter, requireAuth, requirePro } from "./authRouter.mjs";
import { router as stripeRouter, stripeWebhookHandler } from "./stripeRouter.mjs";
import db from "./db.mjs";

const app = express();
const PORT = process.env.PORT || 8787;
const API_KEY = process.env.ODDS_API_KEY;

const allowedOrigin = process.env.ALLOWED_ORIGIN;
app.use(cors(allowedOrigin ? { origin: allowedOrigin } : {}));

app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), stripeWebhookHandler);
app.use(express.json());
app.use("/api/auth", authRouter);
app.use("/api/stripe", stripeRouter);

// ── Odds + score cache ──────────────────────────────────────
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 h — 6 leagues × 4 refreshes/day × 30 days ≈ 720 req/month
let cache = { payload: null, fetchedAt: 0 };

// Score cache — keyed by eventId, value: { homeScore, awayScore, completed }
let scoreCache = {};

// In-play odds cache — refreshed at most every 2 minutes to conserve API credits
const INPLAY_TTL_MS = 2 * 60 * 1000;
let inPlayCache = { events: [], fetchedAt: 0 };

async function getInPlayEvents() {
  if (Date.now() - inPlayCache.fetchedAt < INPLAY_TTL_MS) return inPlayCache.events;
  if (!API_KEY) return [];
  try {
    const results = await Promise.allSettled(
      LEAGUES.map(l => fetchInPlayOdds(l.key, API_KEY).then(evs => evs.map(e => ({ ...e, _league: l.name }))))
    );
    const events = results.flatMap(r => r.status === "fulfilled" ? r.value : []);
    inPlayCache = { events, fetchedAt: Date.now() };
    return events;
  } catch {
    return inPlayCache.events;
  }
}

// Daily free pick store — keyed by client local date "YYYY-MM-DD".
// Each timezone gets its own entry so the pick resets at local midnight.
// Entries older than 2 days are pruned on each request.
const dailyFreePickStore = new Map();

function leagueNameToKey(name) {
  return LEAGUES.find((l) => l.name === name)?.key ?? null;
}

/**
 * Determine if a bet won, lost or is void based on final scores.
 * Returns { won: bool, homeScore, awayScore, scoreStr }
 */
function resolveBet(freePick, homeScore, awayScore) {
  const { market, selection, point, homeTeam } = freePick;
  const total = homeScore + awayScore;
  let won = null;

  if (market === "h2h") {
    const winner = homeScore > awayScore ? freePick.match.split(" vs ")[0]
                 : awayScore > homeScore ? freePick.match.split(" vs ")[1]
                 : "Draw";
    if (selection === "Draw") won = homeScore === awayScore;
    else won = selection === winner || selection === freePick.match.split(" vs ")[0] && homeScore > awayScore
                                    || selection === freePick.match.split(" vs ")[1] && awayScore > homeScore;
    // Simpler: check by team name
    if (homeScore > awayScore) won = selection === freePick.match.split(" vs ")[0];
    else if (awayScore > homeScore) won = selection === freePick.match.split(" vs ")[1];
    else won = selection === "Draw";
  } else if (market === "totals") {
    const line = point ?? 2.5;
    if (selection === "Over")  won = total > line;
    if (selection === "Under") won = total < line;
    // Exact line = push (void) — treat as null
    if (total === line) won = null;
  } else if (market === "spreads") {
    // Asian handicap: home team score + point vs away
    const line = point ?? 0;
    const adjustedHome = homeScore + line;
    if (selection === freePick.match.split(" vs ")[0]) won = adjustedHome > awayScore;
    else won = awayScore > adjustedHome;
    if (adjustedHome === awayScore) won = null; // push
  }

  return {
    won,
    homeScore,
    awayScore,
    scoreStr: `${freePick.match.split(" vs ")[0]} ${homeScore} – ${awayScore} ${freePick.match.split(" vs ")[1]}`,
  };
}

// ── Email notifications ─────────────────────────────────────
function getMailer() {
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) return null;
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT ?? "587"),
    secure: process.env.EMAIL_SECURE === "true",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });
}

async function sendResultEmails(freePick) {
  if (!freePick?.result || !freePick.eventId) return;
  const pending = db.prepare(
    "SELECT id, email FROM bet_trackers WHERE event_id = ? AND notified = 0"
  ).all(freePick.eventId);
  if (!pending.length) return;

  const mailer = getMailer();
  if (!mailer) return;

  const { scoreStr, won } = freePick.result;
  const outcome = won === true ? "WON" : won === false ? "LOST" : "VOID";
  const emoji = won === true ? "✅" : won === false ? "❌" : "➖";
  const fromName = process.env.EMAIL_FROM_NAME ?? "CalcoBet";
  const from = `"${fromName}" <${process.env.EMAIL_USER}>`;

  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#F8FAFC;border-radius:16px">
      <h2 style="color:#0F172A;margin:0 0 4px">Match Result - ${freePick.match}</h2>
      <p style="color:#64748B;font-size:14px;margin:0 0 24px">${freePick.league}</p>
      <div style="background:white;border-radius:12px;padding:20px;border:1px solid #E2E8F0;margin-bottom:20px">
        <p style="font-size:24px;font-weight:900;color:#0F172A;margin:0 0 8px">${emoji} Your bet ${outcome}</p>
        <p style="color:#475569;font-size:15px;margin:0 0 16px">Final score: <strong>${scoreStr}</strong></p>
        <p style="color:#475569;font-size:13px;margin:0">Your pick: <strong>${freePick.label}</strong> at <strong>${freePick.decimalOdds}x</strong> (${freePick.ev >= 0 ? "+" : ""}${freePick.ev}% edge)</p>
      </div>
      <p style="color:#94A3B8;font-size:12px;text-align:center;margin:0">
        CalcoBet Analytics - Statistical analysis only. Not a bookmaker.<br>
        <a href="https://calcobet.com" style="color:#F59E0B">calcobet.com</a>
      </p>
    </div>`;

  const markNotified = db.prepare("UPDATE bet_trackers SET notified = 1 WHERE id = ?");
  for (const row of pending) {
    try {
      await mailer.sendMail({ from, to: row.email, subject: `${emoji} Match Result: ${freePick.match} - Bet ${outcome}`, html });
      markNotified.run(row.id);
    } catch { /* don't block picks API on mail failure */ }
  }
}

async function attachScoreToFreePick(freePick) {
  if (!freePick?.kickoff) return freePick;

  const kickoffMs = new Date(freePick.kickoff).getTime();
  const finishedAt = kickoffMs + 115 * 60 * 1000; // 105 min match + 10 min buffer
  if (Date.now() < finishedAt) return freePick; // not finished yet

  // Already cached?
  if (scoreCache[freePick.eventId]) {
    return { ...freePick, result: scoreCache[freePick.eventId] };
  }

  const sportKey = leagueNameToKey(freePick.league);
  if (!sportKey) return freePick;

  try {
    const scores = await fetchScores(sportKey, API_KEY, 3);
    const event = scores.find(
      (s) => s.id === freePick.eventId ||
             (s.home_team === freePick.match.split(" vs ")[0] &&
              s.away_team === freePick.match.split(" vs ")[1])
    );

    if (!event?.completed || !event.scores) return freePick;

    const homeScore = parseInt(event.scores.find((s) => s.name === event.home_team)?.score ?? 0);
    const awayScore = parseInt(event.scores.find((s) => s.name === event.away_team)?.score ?? 0);

    const result = resolveBet(freePick, homeScore, awayScore);
    scoreCache[freePick.eventId] = result;

    const resolved = { ...freePick, result };
    // Fire-and-forget email notifications
    sendResultEmails(resolved).catch(() => {});
    return resolved;
  } catch {
    return freePick;
  }
}

async function refreshCache() {
  if (!API_KEY) return null;
  const results = await fetchAllLeagues(LEAGUES.map((l) => l.key), API_KEY);
  const leagueResults = results.map((r, i) => ({ league: LEAGUES[i], events: r.events, error: r.error }));
  const payload = buildPicksPayload(leagueResults);

  // If today's free pick was already published (from a previous cache cycle or server restart),
  // lock in the original match+label and only refresh its odds fields.
  const todayStr = new Date().toISOString().slice(0, 10);
  const savedPick = db.prepare("SELECT * FROM pick_history WHERE date = ?").get(todayStr);
  if (savedPick && payload.freePick) {
    // Keep original match+label; odds fields can update naturally
    if (savedPick.event_id !== payload.freePick.eventId) {
      // The analysis picked a different match today — lock in the saved one instead
      const savedOdds = payload.freePick; // use fresh odds structure as fallback
      payload.freePick = {
        ...payload.freePick,
        eventId:     savedPick.event_id,
        match:       savedPick.match,
        league:      savedPick.league,
        label:       savedPick.label,
        kickoff:     savedPick.kickoff,
      };
    }
  }

  const erroredLeagues = leagueResults.filter((l) => l.error).map((l) => l.league.name);
  cache = { payload: { ...payload, erroredLeagues, _leagueResults: leagueResults }, fetchedAt: Date.now() };
  return cache.payload;
}

async function getCachedPayload() {
  if (cache.payload && Date.now() - cache.fetchedAt < CACHE_TTL_MS) return cache.payload;
  return refreshCache();
}

app.get("/api/health", (req, res) => res.json({ ok: true, hasApiKey: Boolean(API_KEY) }));

app.get("/api/picks", async (req, res) => {
  if (!API_KEY) {
    return res.status(503).json({
      error: "ODDS_API_KEY is not configured on the server.",
      hint: "Get a free key at https://the-odds-api.com and set it in server/.env",
    });
  }

  try {
    const payload = await getCachedPayload();
    const { proBoard, ...rest } = payload;

    const totalMatches = (proBoard ?? []).length;
    const totalEdges   = (proBoard ?? []).reduce((s, m) => s + (m.bets?.length ?? 0), 0);

    // Client sends its local date so the pick resets at local midnight per timezone.
    const localDate = req.query.localDate || new Date().toISOString().slice(0, 10);

    // Prune entries older than 2 days to avoid unbounded growth.
    const cutoff = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    for (const key of dailyFreePickStore.keys()) {
      if (key < cutoff) dailyFreePickStore.delete(key);
    }

    // Persist today's free pick — once selected it survives kickoff (the Odds
    // API stops returning odds for live matches, so freePick goes null).
    if (rest.freePick) {
      dailyFreePickStore.set(localDate, rest.freePick);
    }
    const resolvedPick = rest.freePick ?? dailyFreePickStore.get(localDate) ?? null;

    // Attach score + win/loss result if match is finished
    const freePick = await attachScoreToFreePick(resolvedPick);

    // Persist to pick_history (upsert by date) — saves pick when first seen, updates result when available
    if (freePick) {
      const result = freePick.result;
      db.prepare(`
        INSERT INTO pick_history (date, event_id, match, league, label, ev, decimal_odds, true_prob, implied_prob, kickoff, bookmaker, result_won, home_score, away_score, score_str)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(date) DO UPDATE SET
          result_won  = COALESCE(excluded.result_won,  result_won),
          home_score  = COALESCE(excluded.home_score,  home_score),
          away_score  = COALESCE(excluded.away_score,  away_score),
          score_str   = COALESCE(excluded.score_str,   score_str)
      `).run(
        localDate, freePick.eventId ?? null, freePick.match, freePick.league ?? null,
        freePick.label ?? null, freePick.ev ?? null, freePick.decimalOdds ?? null,
        freePick.trueProb ?? null, freePick.impliedProb ?? null, freePick.kickoff ?? null,
        freePick.bookmaker ?? null,
        result ? (result.won === true ? 1 : result.won === false ? 0 : null) : null,
        result?.homeScore ?? null, result?.awayScore ?? null, result?.scoreStr ?? null
      );
    }

    // Teaser: real league + kickoff only, no match names or bet details
    const teaserBoard = (proBoard ?? []).map(m => ({ league: m.league, kickoff: m.kickoff }));

    res.json({ ...rest, freePick, proBoard: null, teaserBoard, proStats: { totalMatches, totalEdges }, cached: cache.fetchedAt > 0 });
  } catch (err) {
    res.status(502).json({ error: "Failed to fetch odds data", detail: err.message });
  }
});

app.get("/api/pro/picks", requireAuth, requirePro, async (req, res) => {
  if (!API_KEY) return res.status(503).json({ error: "ODDS_API_KEY not configured" });
  try {
    const payload = await getCachedPayload();
    res.json({ proBoard: payload.proBoard ?? [], cached: cache.fetchedAt > 0 });
  } catch (err) {
    res.status(502).json({ error: "Failed to fetch odds data", detail: err.message });
  }
});

async function attachScoresToLegs(legs) {
  if (!legs?.length) return legs;
  const byKey = {};
  for (const leg of legs) {
    const key = leagueNameToKey(leg.league);
    if (!key) continue;
    if (!byKey[key]) byKey[key] = [];
    byKey[key].push(leg);
  }
  const resultMap = {};
  await Promise.all(Object.entries(byKey).map(async ([sportKey, leagueLegs]) => {
    try {
      const scores = await fetchScores(sportKey, API_KEY, 3);
      for (const leg of leagueLegs) {
        if (Date.now() < new Date(leg.kickoff).getTime() + 115 * 60 * 1000) continue;
        if (scoreCache[leg.eventId]) { resultMap[leg.eventId] = scoreCache[leg.eventId]; continue; }
        const event = scores.find(s => s.id === leg.eventId ||
          (s.home_team === leg.match.split(" vs ")[0] && s.away_team === leg.match.split(" vs ")[1]));
        if (!event?.completed || !event.scores) continue;
        const homeScore = parseInt(event.scores.find(s => s.name === event.home_team)?.score ?? 0);
        const awayScore = parseInt(event.scores.find(s => s.name === event.away_team)?.score ?? 0);
        const result = resolveBet({ market: leg.market, selection: leg.selection, point: leg.point, match: leg.match }, homeScore, awayScore);
        scoreCache[leg.eventId] = result;
        resultMap[leg.eventId] = result;
      }
    } catch { /* don't fail parlay on score errors */ }
  }));
  return legs.map(leg => resultMap[leg.eventId] ? { ...leg, result: resultMap[leg.eventId] } : leg);
}

// Refresh live odds/EV for frozen legs without changing their match or label.
function refreshLegOdds(frozenLegs, leagueResults) {
  // Build a flat lookup: eventId -> bets[]
  const betsByEvent = {};
  for (const { events } of leagueResults) {
    for (const event of (events ?? [])) {
      betsByEvent[event.id] = event._analyzedBets ?? [];
    }
  }

  // Build the same lookup from analyzed data so we can find fresh numbers
  const analyzed = analyzeAllLeagues(leagueResults);
  const freshMap = {};
  for (const { matches } of analyzed) {
    for (const m of matches) {
      freshMap[m.eventId] = m.bets;
    }
  }

  return frozenLegs.map(leg => {
    const freshBets = freshMap[leg.eventId];
    if (!freshBets) return leg; // event not in current odds — keep frozen
    const match = freshBets.find(b => b.market === leg.market && b.selection === leg.selection &&
      (leg.point == null ? b.point == null : b.point === leg.point));
    if (!match) return leg; // specific bet no longer priced — keep frozen
    return { ...leg, decimalOdds: match.decimalOdds, trueProb: match.trueProb, ev: match.ev, impliedProb: match.impliedProb, bookmaker: match.bookmaker };
  });
}

app.get("/api/pro/parlay", requireAuth, requirePro, async (req, res) => {
  if (!API_KEY) return res.status(503).json({ error: "ODDS_API_KEY not configured" });
  try {
    const payload = await getCachedPayload();
    const leagueResults = payload._leagueResults ?? [];
    const analyzed = analyzeAllLeagues(leagueResults);
    const todayStr    = new Date().toISOString().slice(0, 10);
    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const isToday     = (m) => new Date(m.kickoff).toISOString().slice(0, 10) === todayStr;
    const isTomorrow  = (m) => new Date(m.kickoff).toISOString().slice(0, 10) === tomorrowStr;

    // Load or create today's frozen parlay
    const savedRow = db.prepare("SELECT legs_json FROM daily_parlay WHERE date = ?").get(todayStr);
    let frozenLegs = savedRow ? JSON.parse(savedRow.legs_json) : null;

    let todayParlay;
    if (frozenLegs) {
      // Refresh live odds/EV on frozen legs without changing match or label
      const refreshedLegs = refreshLegOdds(frozenLegs, leagueResults);
      const combinedOdds     = refreshedLegs.reduce((acc, l) => acc * l.decimalOdds, 1);
      const combinedTrueProb = refreshedLegs.reduce((acc, l) => acc * (l.trueProb / 100), 1) * 100;
      todayParlay = {
        legs: refreshedLegs,
        legCount: refreshedLegs.length,
        combinedOdds:     Number(combinedOdds.toFixed(2)),
        combinedTrueProb: Number(combinedTrueProb.toFixed(2)),
        combinedEV:       Number(((combinedOdds * combinedTrueProb / 100 - 1) * 100).toFixed(2)),
      };
    } else {
      todayParlay = buildParlay(analyzed, isToday);
      if (todayParlay?.legs) {
        // Freeze the identity fields (match + label) in DB
        const toFreeze = todayParlay.legs.map(l => ({
          eventId: l.eventId, match: l.match, league: l.league, kickoff: l.kickoff,
          market: l.market, selection: l.selection, label: l.label, point: l.point ?? null,
          decimalOdds: l.decimalOdds, trueProb: l.trueProb, ev: l.ev, impliedProb: l.impliedProb, bookmaker: l.bookmaker,
        }));
        db.prepare("INSERT OR IGNORE INTO daily_parlay (date, legs_json) VALUES (?, ?)").run(todayStr, JSON.stringify(toFreeze));
      }
    }

    if (todayParlay?.legs) {
      const withScores = await attachScoresToLegs(todayParlay.legs);
      const anyLost = withScores.some(l => l.result?.won === false);
      todayParlay = { ...todayParlay, legs: withScores };
      if (anyLost) {
        const failedIds = new Set(withScores.filter(l => l.result?.won === false).map(l => l.eventId));
        const isUnplayed = (m) => isToday(m) && !failedIds.has(m.eventId) && Date.now() < new Date(m.kickoff).getTime() + 115 * 60 * 1000;
        const replacement = buildParlay(analyzed, isUnplayed);
        if (replacement) todayParlay.replacement = replacement;
      }
    }

    res.json({ today: todayParlay, tomorrow: buildParlay(analyzed, isTomorrow), cached: cache.fetchedAt > 0 });
  } catch (err) {
    res.status(502).json({ error: "Failed to build parlay", detail: err.message });
  }
});

// ── Live Advisor ────────────────────────────────────────────
app.get("/api/pro/live-advisor", requireAuth, requirePro, async (req, res) => {
  if (!API_KEY) return res.status(503).json({ error: "ODDS_API_KEY not configured" });
  try {
    const [payload, inPlayEvents] = await Promise.all([getCachedPayload(), getInPlayEvents()]);
    const leagueResults = payload._leagueResults ?? [];
    const analyzed = analyzeAllLeagues(leagueResults);
    const now = Date.now();
    const in24h = now + 24 * 60 * 60 * 1000;

    // ── In-play picks (currently live) ──────────────────────
    const liveLeagueResults = LEAGUES.map(l => ({
      league: l,
      events: inPlayEvents.filter(e => e._league === l.name),
    }));
    const liveAnalyzed = analyzeAllLeagues(liveLeagueResults);

    const livePicks = [];
    const liveEvents = [];
    for (const { league, matches } of liveAnalyzed) {
      for (const match of matches) {
        if (match.bets.length > 0) {
          liveEvents.push({
            eventId: match.eventId,
            match: match.match,
            league: match.league ?? league.name,
            kickoff: match.kickoff,
            live: true,
            bets: match.bets.map(b => ({
              market: b.market, selection: b.selection, label: b.label,
              point: b.point ?? null, decimalOdds: b.decimalOdds,
              trueProb: b.trueProb, ev: b.ev,
            })),
          });
        }
        for (const bet of match.bets) {
          if (bet.ev <= 0) continue;
          livePicks.push({
            eventId: match.eventId,
            match: match.match,
            league: match.league ?? league.name,
            kickoff: match.kickoff,
            live: true,
            urgency: "LIVE",
            confidence: bet.ev >= 6 ? "STRONG BUY" : bet.ev >= 3 ? "BUY" : "WATCH",
            ...bet,
          });
        }
      }
    }
    livePicks.sort((a, b) => b.ev - a.ev);

    // ── Upcoming picks (next 6h, for when no live games) ────
    const upcomingPicks = [];
    const upcomingEvents = [];
    for (const { league, matches } of analyzed) {
      for (const match of matches) {
        const t = new Date(match.kickoff).getTime();
        if (t < now || t > in24h) continue;

        if (match.bets.length > 0) {
          upcomingEvents.push({
            eventId: match.eventId,
            match: match.match,
            league: match.league ?? league.name,
            kickoff: match.kickoff,
            live: false,
            bets: match.bets.map(b => ({
              market: b.market, selection: b.selection, label: b.label,
              point: b.point ?? null, decimalOdds: b.decimalOdds,
              trueProb: b.trueProb, ev: b.ev,
            })),
          });
        }

        const minsToKickoff = Math.floor((t - now) / 60000);
        const urgency = minsToKickoff < 60 ? "HIGH" : minsToKickoff < 240 ? "MEDIUM" : "LOW";

        for (const bet of match.bets) {
          if (bet.ev <= 0) continue;
          upcomingPicks.push({
            eventId: match.eventId,
            match: match.match,
            league: match.league ?? league.name,
            kickoff: match.kickoff,
            minsToKickoff,
            live: false,
            urgency,
            confidence: bet.ev >= 6 ? "STRONG BUY" : bet.ev >= 3 ? "BUY" : "WATCH",
            ...bet,
          });
        }
      }
    }
    upcomingPicks.sort((a, b) => {
      const uScore = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      const ud = uScore[b.urgency] - uScore[a.urgency];
      return ud !== 0 ? ud : b.ev - a.ev;
    });

    // Live games first, then upcoming to fill up to 7
    const picks = [...livePicks, ...upcomingPicks].slice(0, 7);
    const events = [...liveEvents, ...upcomingEvents];

    res.json({
      picks,
      events,
      liveCount: livePicks.length,
      cachedAt: cache.fetchedAt,
      inPlayCachedAt: inPlayCache.fetchedAt,
    });
  } catch (err) {
    res.status(502).json({ error: "Failed to fetch live advisor", detail: err.message });
  }
});

app.post("/api/pro/cashout-check", requireAuth, requirePro, async (req, res) => {
  if (!API_KEY) return res.status(503).json({ error: "ODDS_API_KEY not configured" });
  try {
    const { eventId, market, selection, point, originalOdds, stake } = req.body ?? {};
    if (!eventId || !market || !selection || !originalOdds || !stake) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const payload = await getCachedPayload();
    const leagueResults = payload._leagueResults ?? [];
    const analyzed = analyzeAllLeagues(leagueResults);

    let currentBet = null;
    for (const { matches } of analyzed) {
      for (const match of matches) {
        if (match.eventId !== eventId) continue;
        currentBet = match.bets.find(b =>
          b.market === market &&
          b.selection === selection &&
          (point == null ? b.point == null : b.point === point)
        );
        break;
      }
    }

    const orig = parseFloat(originalOdds);
    const stakeVal = parseFloat(stake);

    if (!currentBet) {
      return res.json({
        found: false,
        recommendation: "MONITOR",
        reason: "This match is no longer in our pre-match odds feed — it may have kicked off or been suspended.",
        action: "Check your bookmaker app directly for live cash out options.",
      });
    }

    const curr = currentBet.decimalOdds;
    const trueProb = currentBet.trueProb / 100;
    const oddsMovement = curr - orig;

    // EV of letting the bet run to conclusion
    const holdExpectedReturn = (trueProb * orig * stakeVal); // true prob * payout
    // Bookmaker cash out is typically ~87% of mathematical fair value
    const fairCashout = stakeVal * (orig / curr);
    const approxCashout = fairCashout * 0.87;

    let recommendation, reason, action;

    if (oddsMovement < -0.15) {
      // Odds shortened — your selection is now more likely to win
      recommendation = "HOLD";
      reason = `Odds have shortened ${Math.abs(oddsMovement).toFixed(2)} since you bet (${orig} → ${curr}). The market has moved in your favour — your selection is now priced as more likely to win.`;
      action = "Stay in your bet. The bookmaker cash out offer will be poor relative to the true value of your position.";
    } else if (oddsMovement > 0.25) {
      // Odds drifted — selection less likely now
      if (approxCashout >= stakeVal) {
        recommendation = "CASH OUT";
        reason = `Odds have drifted +${oddsMovement.toFixed(2)} since you bet (${orig} → ${curr}). The market now believes your selection is less likely to succeed.`;
        action = `Consider cashing out. Estimated bookmaker offer: ~£${approxCashout.toFixed(2)}. If you hold, expected return is ~£${holdExpectedReturn.toFixed(2)}.`;
      } else {
        recommendation = "HOLD";
        reason = `Odds have drifted but the estimated cash out value (~£${approxCashout.toFixed(2)}) is less than your stake (£${stakeVal}). Holding still has higher expected value.`;
        action = "Hold your position — the math still favours letting it run.";
      }
    } else {
      // Stable
      recommendation = "HOLD";
      reason = `Odds are stable (${oddsMovement >= 0 ? "+" : ""}${oddsMovement.toFixed(2)} movement). Your original edge is intact with a true win probability of ${(trueProb * 100).toFixed(1)}%.`;
      action = "No action needed — let the bet run.";
    }

    res.json({
      found: true,
      recommendation,
      reason,
      action,
      originalOdds: orig,
      currentOdds: curr,
      oddsMovement: Number(oddsMovement.toFixed(3)),
      trueProb: Number((trueProb * 100).toFixed(1)),
      currentEV: Number(currentBet.ev.toFixed(2)),
      approxCashoutValue: Number(approxCashout.toFixed(2)),
      holdExpectedReturn: Number(holdExpectedReturn.toFixed(2)),
      stake: stakeVal,
    });
  } catch (err) {
    res.status(502).json({ error: "Failed to check cash out", detail: err.message });
  }
});

app.get("/api/picks/history", (req, res) => {
  const rows = db.prepare(
    "SELECT * FROM pick_history ORDER BY date DESC LIMIT 60"
  ).all();
  res.json({ history: rows });
});

app.post("/api/track-pick", async (req, res) => {
  const { email, eventId, match, league, label, ev, decimalOdds, kickoff } = req.body ?? {};
  if (!email || !eventId || !match) return res.status(400).json({ error: "email, eventId, and match are required" });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "Invalid email address" });

  const existing = db.prepare("SELECT id FROM bet_trackers WHERE email = ? AND event_id = ?").get(email, eventId);
  if (existing) return res.json({ ok: true, already: true });

  db.prepare(
    "INSERT INTO bet_trackers (email, event_id, match, league, label, ev, decimal_odds, kickoff) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(email, eventId, match, league ?? null, label ?? null, ev ?? null, decimalOdds ?? null, kickoff ?? null);

  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`CalcoBetAI server listening on http://localhost:${PORT}`);
  if (!API_KEY) console.warn("⚠ ODDS_API_KEY not set");
  if (!process.env.JWT_SECRET) console.warn("⚠ JWT_SECRET not set — using insecure default");
  if (!process.env.STRIPE_SECRET_KEY) console.warn("⚠ STRIPE_SECRET_KEY not set — payments disabled");
});
