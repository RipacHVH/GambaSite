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

// Sports day rolls over at 06:00 UTC — late-night games (01:00 UTC) stay
// attached to the day they kicked off, not the next calendar day.
function getSportsDay() {
  const adjusted = new Date(Date.now() - 6 * 60 * 60 * 1000);
  return adjusted.toISOString().slice(0, 10);
}

// Daily free pick store — keyed by sports day "YYYY-MM-DD".
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
  const pending = await db.all(
    "SELECT id, email FROM bet_trackers WHERE event_id = ? AND notified = 0",
    [freePick.eventId]
  );
  if (!pending.length) return;

  const mailer = getMailer();
  if (!mailer) return;

  const { scoreStr, won } = freePick.result;
  const outcome = won === true ? "WON" : won === false ? "LOST" : "VOID";
  const emoji = won === true ? "✅" : won === false ? "❌" : "➖";
  const fromName = process.env.EMAIL_FROM_NAME ?? "CalcoBet";
  const fromAddr = process.env.EMAIL_FROM ?? process.env.EMAIL_USER;
  const from = `"${fromName}" <${fromAddr}>`;

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

  for (const row of pending) {
    try {
      await mailer.sendMail({ from, to: row.email, subject: `${emoji} Match Result: ${freePick.match} - Bet ${outcome}`, html });
      await db.run("UPDATE bet_trackers SET notified = 1 WHERE id = ?", [row.id]);
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
    const scores = await fetchScores(sportKey, API_KEY, 5);
    const [homeTeam, awayTeam] = freePick.match.split(" vs ").map(s => s.trim().toLowerCase());
    const event = scores.find(
      (s) => s.id === freePick.eventId ||
             (s.home_team.toLowerCase() === homeTeam && s.away_team.toLowerCase() === awayTeam)
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
  const todayStr = getSportsDay();
  const savedPick = await db.get("SELECT * FROM pick_history WHERE date = ?", [todayStr]);
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

// Force cache clear — requires ADMIN_SECRET env var to prevent abuse
app.post("/api/debug/refresh", async (req, res) => {
  const secret = process.env.ADMIN_SECRET;
  if (secret && req.headers["x-admin-secret"] !== secret) {
    return res.status(403).json({ error: "Forbidden" });
  }
  cache = { payload: null, fetchedAt: 0 };
  try {
    const payload = await refreshCache();
    const proBoard = payload?.proBoard ?? [];
    const markets = [...new Set(proBoard.flatMap(m => m.bets.map(b => b.market)))];
    res.json({ ok: true, proBoard: proBoard.length, markets });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Diagnostic endpoint — shows cache state, league errors, and pick counts
app.get("/api/debug/status", async (req, res) => {
  try {
    const payload = await getCachedPayload();
    if (!payload) return res.json({ error: "No cache — API key missing or first fetch failed" });
    const leagues = (payload._leagueResults ?? []).map(r => ({
      league: r.league?.name ?? r.leagueKey,
      events: r.events?.length ?? 0,
      error: r.error ?? null,
    }));
    res.json({
      cachedAt: cache.fetchedAt ? new Date(cache.fetchedAt).toISOString() : null,
      freePick: payload.freePick ? `${payload.freePick.match} (${payload.freePick.league})` : null,
      proBoard: payload.proBoard?.length ?? 0,
      leagues,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Public endpoint for the +EV calculator — returns all upcoming matches with AI true probabilities
app.get("/api/calculator/matches", async (req, res) => {
  if (!API_KEY) return res.json({ matches: [] });
  try {
    const payload = await getCachedPayload();
    const leagueResults = payload._leagueResults ?? [];
    const analyzed = analyzeAllLeagues(leagueResults);
    const now = Date.now();
    const in7d = now + 7 * 24 * 60 * 60 * 1000;

    const matches = [];
    for (const { league, matches: leagueMatches } of analyzed) {
      for (const match of leagueMatches) {
        const t = new Date(match.kickoff).getTime();
        if (t < now || t > in7d) continue;
        if (!match.bets.length) continue;
        matches.push({
          eventId: match.eventId,
          match: match.match,
          league: match.league ?? league.name,
          kickoff: match.kickoff,
          bets: match.bets.map(b => ({
            label: b.label,
            market: b.market,
            selection: b.selection,
            point: b.point ?? null,
            decimalOdds: b.decimalOdds,
            trueProb: b.trueProb,
            ev: b.ev,
            bookmaker: b.bookmaker,
          })),
        });
      }
    }
    matches.sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));
    res.json({ matches, cachedAt: cache.fetchedAt });
  } catch (err) {
    res.status(502).json({ error: "Failed to fetch matches", detail: err.message });
  }
});

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

    // Sports day: rolls over at 06:00 UTC so late-night games (e.g. 01:00 UTC)
    // stay attached to the day they kicked off. All users see the same pick.
    const localDate = getSportsDay();

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
      await db.run(`
        INSERT INTO pick_history (date, event_id, match, league, label, ev, decimal_odds, true_prob, implied_prob, kickoff, bookmaker, result_won, home_score, away_score, score_str)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (date) DO UPDATE SET
          result_won  = COALESCE(EXCLUDED.result_won,  pick_history.result_won),
          home_score  = COALESCE(EXCLUDED.home_score,  pick_history.home_score),
          away_score  = COALESCE(EXCLUDED.away_score,  pick_history.away_score),
          score_str   = COALESCE(EXCLUDED.score_str,   pick_history.score_str)
      `, [
        localDate, freePick.eventId ?? null, freePick.match, freePick.league ?? null,
        freePick.label ?? null, freePick.ev ?? null, freePick.decimalOdds ?? null,
        freePick.trueProb ?? null, freePick.impliedProb ?? null, freePick.kickoff ?? null,
        freePick.bookmaker ?? null,
        result ? (result.won === true ? 1 : result.won === false ? 0 : null) : null,
        result?.homeScore ?? null, result?.awayScore ?? null, result?.scoreStr ?? null,
      ]);
    }

    // Send daily newsletter to subscribers (fire-and-forget, only fires once per pick)
    if (freePick) sendDailyPickNewsletter(freePick).catch(() => {});

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
    const todayStr    = getSportsDay();
    const tomorrowStr = new Date(new Date(getSportsDay()).getTime() + 86400000).toISOString().slice(0, 10);
    // Apply the same 6h offset to kickoff so 01:00 UTC games belong to the previous sports day
    const kickoffSportsDay = (m) => new Date(new Date(m.kickoff).getTime() - 6 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const isToday     = (m) => kickoffSportsDay(m) === todayStr;
    const isTomorrow  = (m) => kickoffSportsDay(m) === tomorrowStr;

    // Load or create today's frozen parlay
    const savedRow = await db.get("SELECT legs_json FROM daily_parlay WHERE date = ?", [todayStr]);
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
        await db.run("INSERT INTO daily_parlay (date, legs_json) VALUES (?, ?) ON CONFLICT (date) DO NOTHING", [todayStr, JSON.stringify(toFreeze)]);
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

    res.json({
      picks: livePicks.slice(0, 7),
      liveCount: livePicks.length,
      cachedAt: cache.fetchedAt,
      inPlayCachedAt: inPlayCache.fetchedAt,
    });
  } catch (err) {
    res.status(502).json({ error: "Failed to fetch live advisor", detail: err.message });
  }
});

app.post("/api/pro/cashout-check", requireAuth, requirePro, async (req, res) => {
  try {
    const { originalOdds, currentOdds, stake } = req.body ?? {};
    if (!originalOdds || !currentOdds || !stake) {
      return res.status(400).json({ error: "originalOdds, currentOdds and stake are required" });
    }

    const orig     = parseFloat(originalOdds);
    const curr     = parseFloat(currentOdds);
    const stakeVal = parseFloat(stake);

    if (orig < 1.01 || curr < 1.01 || stakeVal <= 0) {
      return res.status(400).json({ error: "Invalid values — odds must be ≥ 1.01 and stake > 0" });
    }

    const oddsMovement = curr - orig;

    // Implied probability from current market odds (de-vigged approximation)
    const impliedCurr = 1 / curr;
    // Probability at time of original bet
    const impliedOrig = 1 / orig;

    // Expected return if held to completion (using current market implied prob as best estimate)
    const holdExpectedReturn = impliedCurr * orig * stakeVal;

    // Fair cash out value = stake × (original odds / current odds)
    // Bookmaker typically offers ~87% of mathematical fair value
    const fairCashout   = stakeVal * (orig / curr);
    const approxCashout = fairCashout * 0.87;

    // Edge vs original entry (how much the probability has moved)
    const probShift = ((impliedCurr - impliedOrig) * 100).toFixed(1);

    let recommendation, reason, action;

    if (oddsMovement < -0.15) {
      recommendation = "HOLD";
      reason = `Odds have shortened from ${orig} → ${curr} (−${Math.abs(oddsMovement).toFixed(2)}). The market now prices your selection as more likely to win. Your position has increased in value.`;
      action = "Stay in — the bookmaker cash out offer will be significantly below your position's true worth.";
    } else if (oddsMovement > 0.25) {
      if (approxCashout >= stakeVal * 0.8) {
        recommendation = "CASH OUT";
        reason = `Odds have drifted from ${orig} → ${curr} (+${oddsMovement.toFixed(2)}). The market now believes your selection is less likely to win than when you placed your bet.`;
        action = `Estimated bookmaker cash out: ~£${approxCashout.toFixed(2)}. Expected return if held: ~£${holdExpectedReturn.toFixed(2)}.`;
      } else {
        recommendation = "HOLD";
        reason = `Odds have drifted but the estimated cash out (£${approxCashout.toFixed(2)}) would lock in a heavy loss. Holding gives the bet a chance to recover.`;
        action = "Hold — cashing out here crystallises too large a loss.";
      }
    } else {
      recommendation = "HOLD";
      reason = `Odds movement is minimal (${oddsMovement >= 0 ? "+" : ""}${oddsMovement.toFixed(2)}). Your original position is essentially unchanged — no reason to accept the bookmaker's margin on a cash out.`;
      action = "Let the bet run — no meaningful odds movement detected.";
    }

    res.json({
      recommendation,
      reason,
      action,
      originalOdds: orig,
      currentOdds: curr,
      oddsMovement: Number(oddsMovement.toFixed(3)),
      impliedWinProb: Number((impliedCurr * 100).toFixed(1)),
      probShift: Number(probShift),
      approxCashoutValue: Number(approxCashout.toFixed(2)),
      holdExpectedReturn: Number(holdExpectedReturn.toFixed(2)),
      stake: stakeVal,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to calculate cash out advice", detail: err.message });
  }
});

app.get("/api/picks/history", async (req, res) => {
  const rows = await db.all("SELECT * FROM pick_history ORDER BY date DESC LIMIT 60", []);
  res.json({ history: rows });
});

// ── Admin: manual pick entry ─────────────────────────────────
// POST /api/admin/pick  — protected by ADMIN_SECRET header
app.post("/api/admin/pick", async (req, res) => {
  const secret = process.env.ADMIN_SECRET;
  if (!secret || req.headers["x-admin-secret"] !== secret) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { date, match, league, label, decimal_odds, ev, true_prob, implied_prob, kickoff, bookmaker, result_won, home_score, away_score } = req.body ?? {};
  if (!date || !match || !label) {
    return res.status(400).json({ error: "date, match and label are required" });
  }

  const scoreStr = (home_score != null && away_score != null) ? `${home_score}–${away_score}` : null;

  await db.run(`
    INSERT INTO pick_history (date, match, league, label, ev, decimal_odds, true_prob, implied_prob, kickoff, bookmaker, result_won, home_score, away_score, score_str)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT (date) DO UPDATE SET
      match        = EXCLUDED.match,
      league       = EXCLUDED.league,
      label        = EXCLUDED.label,
      ev           = COALESCE(EXCLUDED.ev,           pick_history.ev),
      decimal_odds = COALESCE(EXCLUDED.decimal_odds, pick_history.decimal_odds),
      true_prob    = COALESCE(EXCLUDED.true_prob,    pick_history.true_prob),
      implied_prob = COALESCE(EXCLUDED.implied_prob, pick_history.implied_prob),
      kickoff      = COALESCE(EXCLUDED.kickoff,      pick_history.kickoff),
      bookmaker    = COALESCE(EXCLUDED.bookmaker,    pick_history.bookmaker),
      result_won   = COALESCE(EXCLUDED.result_won,   pick_history.result_won),
      home_score   = COALESCE(EXCLUDED.home_score,   pick_history.home_score),
      away_score   = COALESCE(EXCLUDED.away_score,   pick_history.away_score),
      score_str    = COALESCE(EXCLUDED.score_str,    pick_history.score_str)
  `, [date, match, league ?? null, label, ev ?? null, decimal_odds ?? null, true_prob ?? null, implied_prob ?? null, kickoff ?? null, bookmaker ?? null, result_won ?? null, home_score ?? null, away_score ?? null, scoreStr]);

  res.json({ ok: true, date });
});

// DELETE /api/admin/pick/:date — remove a pick by date
app.delete("/api/admin/pick/:date", async (req, res) => {
  const secret = process.env.ADMIN_SECRET;
  if (!secret || req.headers["x-admin-secret"] !== secret) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  await db.run("DELETE FROM pick_history WHERE date = ?", [req.params.date]);
  res.json({ ok: true });
});

// POST /api/admin/resolve-picks — auto-fetch scores and resolve pending picks
app.post("/api/admin/resolve-picks", async (req, res) => {
  const secret = process.env.ADMIN_SECRET;
  if (!secret || req.headers["x-admin-secret"] !== secret) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!API_KEY) return res.status(500).json({ error: "ODDS_API_KEY not configured" });

  const pending = await db.all(
    "SELECT * FROM pick_history WHERE result_won IS NULL AND kickoff IS NOT NULL",
    []
  );

  if (!pending.length) return res.json({ ok: true, resolved: 0, message: "No pending picks with kickoff data" });

  // Group by league to minimise API calls
  const byLeague = {};
  for (const pick of pending) {
    const key = leagueNameToKey(pick.league);
    if (!key) continue;
    if (!byLeague[key]) byLeague[key] = [];
    byLeague[key].push(pick);
  }

  let resolved = 0;
  const details = [];

  await Promise.all(Object.entries(byLeague).map(async ([sportKey, picks]) => {
    try {
      const scores = await fetchScores(sportKey, API_KEY, 7);
      for (const pick of picks) {
        const kickoffMs = new Date(pick.kickoff).getTime();
        if (Date.now() < kickoffMs + 115 * 60 * 1000) continue; // match not finished yet

        const [homeTeam, awayTeam] = pick.match.split(" vs ").map(s => s.trim().toLowerCase());
        const event = scores.find(s =>
          (s.id && s.id === pick.event_id) ||
          (s.home_team?.toLowerCase() === homeTeam && s.away_team?.toLowerCase() === awayTeam)
        );

        if (!event?.completed || !event.scores) continue;

        const homeScore = parseInt(event.scores.find(s => s.name === event.home_team)?.score ?? 0);
        const awayScore = parseInt(event.scores.find(s => s.name === event.away_team)?.score ?? 0);
        const scoreStr = `${homeScore}–${awayScore}`;

        // Parse label to determine market/selection/point
        const label = (pick.label ?? "").toLowerCase();
        let won = null;
        const total = homeScore + awayScore;

        if (/over (\d+\.?\d*)/.test(label)) {
          const line = parseFloat(label.match(/over (\d+\.?\d*)/)[1]);
          won = total > line ? true : total < line ? false : null;
        } else if (/under (\d+\.?\d*)/.test(label)) {
          const line = parseFloat(label.match(/under (\d+\.?\d*)/)[1]);
          won = total < line ? true : total > line ? false : null;
        } else if (/draw/.test(label)) {
          won = homeScore === awayScore;
        } else {
          // h2h — check if label contains either team name
          const [home] = pick.match.split(" vs ");
          const homeLower = home.trim().toLowerCase();
          const awayLower = pick.match.split(" vs ")[1]?.trim().toLowerCase() ?? "";
          if (label.includes(homeLower) || label.includes("home win")) {
            won = homeScore > awayScore;
          } else if (label.includes(awayLower) || label.includes("away win")) {
            won = awayScore > homeScore;
          }
        }

        await db.run(
          "UPDATE pick_history SET result_won = ?, home_score = ?, away_score = ?, score_str = ? WHERE date = ?",
          [won === true ? 1 : won === false ? 0 : null, homeScore, awayScore, scoreStr, pick.date]
        );

        resolved++;
        details.push({ date: pick.date, match: pick.match, score: scoreStr, result: won === true ? "WIN" : won === false ? "LOSS" : "void" });
      }
    } catch (err) {
      console.error(`resolve-picks error for ${sportKey}:`, err.message);
    }
  }));

  res.json({ ok: true, resolved, details });
});

// ── Newsletter ───────────────────────────────────────────────
import { randomBytes } from "crypto";

function generateToken() {
  return randomBytes(24).toString("hex");
}

app.post("/api/newsletter/subscribe", async (req, res) => {
  const { email } = req.body ?? {};
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Valid email required" });
  }
  const existing = await db.get("SELECT id FROM newsletter_subscribers WHERE email = ?", [email]);
  if (existing) return res.json({ ok: true, already: true });

  const token = generateToken();
  await db.run("INSERT INTO newsletter_subscribers (email, token) VALUES (?, ?)", [email, token]);

  // Send welcome email
  const mailer = getMailer();
  if (mailer) {
    const fromName = process.env.EMAIL_FROM_NAME ?? "CalcoBet";
    const fromAddr = process.env.EMAIL_FROM ?? process.env.EMAIL_USER;
    const from = `"${fromName}" <${fromAddr}>`;
    const unsubUrl = `${process.env.ALLOWED_ORIGIN ?? "https://calcobet.com"}/api/newsletter/unsubscribe?token=${token}`;
    mailer.sendMail({
      from, to: email,
      subject: "You're in — daily +EV picks incoming",
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#F8FAFC;border-radius:16px">
          <h2 style="color:#0F172A;margin:0 0 8px">You're subscribed to CalcoBet daily picks</h2>
          <p style="color:#475569;font-size:14px;margin:0 0 20px">Every day we'll send you one +EV edge — the highest expected-value bet from the upcoming fixtures, with odds, true probability, and our edge %.</p>
          <p style="color:#94A3B8;font-size:12px;margin:0"><a href="${unsubUrl}" style="color:#94A3B8">Unsubscribe</a></p>
        </div>`,
    }).catch(() => {});
  }

  res.json({ ok: true });
});

app.get("/api/newsletter/unsubscribe", async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).send("Missing token");
  await db.run("DELETE FROM newsletter_subscribers WHERE token = ?", [token]);
  res.send(`<html><body style="font-family:sans-serif;text-align:center;padding:60px;background:#F8FAFC"><h2>Unsubscribed</h2><p style="color:#64748B">You won't receive any more daily picks.</p><a href="${process.env.ALLOWED_ORIGIN ?? "https://calcobet.com"}" style="color:#F59E0B">← Back to CalcoBet</a></body></html>`);
});

// Called once when a new date's pick is first saved — send to all newsletter subscribers
async function sendDailyPickNewsletter(pick) {
  const mailer = getMailer();
  if (!mailer || !pick) return;

  const already = await db.get("SELECT newsletter_sent FROM pick_history WHERE event_id = ?", [pick.eventId]);
  if (already?.newsletter_sent) return;

  const subscribers = await db.all("SELECT email, token FROM newsletter_subscribers", []);
  if (!subscribers.length) return;

  await db.run("UPDATE pick_history SET newsletter_sent = 1 WHERE event_id = ?", [pick.eventId]);

  const fromName = process.env.EMAIL_FROM_NAME ?? "CalcoBet";
  const fromAddr = process.env.EMAIL_FROM ?? process.env.EMAIL_USER;
  const from = `"${fromName}" <${fromAddr}>`;
  const site = process.env.ALLOWED_ORIGIN ?? "https://calcobet.com";

  const oddsStr = pick.decimalOdds ? `${pick.decimalOdds}x` : "";
  const evStr = pick.ev != null ? `${pick.ev >= 0 ? "+" : ""}${pick.ev}%` : "";

  for (const sub of subscribers) {
    const unsubUrl = `${site}/api/newsletter/unsubscribe?token=${sub.token}`;
    mailer.sendMail({
      from, to: sub.email,
      subject: `Today's Free Pick: ${pick.match}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#F8FAFC;border-radius:16px">
          <p style="font-size:11px;font-weight:700;letter-spacing:2px;color:#94A3B8;text-transform:uppercase;margin:0 0 16px">CalcoBet · Daily +EV Pick</p>
          <h2 style="color:#0F172A;margin:0 0 4px;font-size:22px">${pick.match}</h2>
          <p style="color:#64748B;font-size:13px;margin:0 0 20px">${pick.league}</p>
          <div style="background:white;border-radius:12px;padding:20px;border:1px solid #E2E8F0;margin-bottom:20px">
            <p style="font-size:16px;font-weight:800;color:#0F172A;margin:0 0 12px">Our Pick: <span style="color:#F59E0B">${pick.label}</span></p>
            <div style="display:flex;gap:16px;flex-wrap:wrap">
              ${oddsStr ? `<div><p style="font-size:10px;color:#94A3B8;margin:0 0 2px;font-weight:700;text-transform:uppercase;letter-spacing:1px">Odds</p><p style="font-size:20px;font-weight:900;color:#0F172A;margin:0;font-family:monospace">${oddsStr}</p></div>` : ""}
              ${pick.trueProb ? `<div><p style="font-size:10px;color:#94A3B8;margin:0 0 2px;font-weight:700;text-transform:uppercase;letter-spacing:1px">True Prob</p><p style="font-size:20px;font-weight:900;color:#0F172A;margin:0;font-family:monospace">${pick.trueProb}%</p></div>` : ""}
              ${evStr ? `<div><p style="font-size:10px;color:#94A3B8;margin:0 0 2px;font-weight:700;text-transform:uppercase;letter-spacing:1px">EV Edge</p><p style="font-size:20px;font-weight:900;color:#10B981;margin:0;font-family:monospace">${evStr}</p></div>` : ""}
            </div>
          </div>
          <a href="${site}" style="display:inline-block;background:linear-gradient(135deg,#F59E0B,#D97706);color:white;font-weight:700;font-size:13px;padding:12px 28px;border-radius:10px;text-decoration:none">View on CalcoBet →</a>
          <p style="color:#94A3B8;font-size:11px;margin:20px 0 0"><a href="${unsubUrl}" style="color:#94A3B8">Unsubscribe</a> · Statistical analysis only, not financial advice.</p>
        </div>`,
    }).catch(() => {});
  }
}

app.post("/api/track-pick", async (req, res) => {
  const { email, eventId, match, league, label, ev, decimalOdds, kickoff } = req.body ?? {};
  if (!email || !eventId || !match) return res.status(400).json({ error: "email, eventId, and match are required" });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "Invalid email address" });

  const existing = await db.get("SELECT id FROM bet_trackers WHERE email = ? AND event_id = ?", [email, eventId]);
  if (existing) return res.json({ ok: true, already: true });

  await db.run(
    "INSERT INTO bet_trackers (email, event_id, match, league, label, ev, decimal_odds, kickoff) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [email, eventId, match, league ?? null, label ?? null, ev ?? null, decimalOdds ?? null, kickoff ?? null]
  );

  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`CalcoBetAI server listening on http://localhost:${PORT}`);
  if (!API_KEY) console.warn("⚠ ODDS_API_KEY not set");
  if (!process.env.JWT_SECRET) console.warn("⚠ JWT_SECRET not set — using insecure default");
  if (!process.env.STRIPE_SECRET_KEY) console.warn("⚠ STRIPE_SECRET_KEY not set — payments disabled");
});
