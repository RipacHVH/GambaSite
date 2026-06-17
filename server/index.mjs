import "dotenv/config";
import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import { fetchAllLeagues, fetchScores } from "./oddsApi.mjs";
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
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours — 6 leagues × 4 refreshes/day × 30 days = 720 req/month
let cache = { payload: null, fetchedAt: 0 };

// Score cache — keyed by eventId, value: { homeScore, awayScore, completed }
let scoreCache = {};

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

app.get("/api/pro/parlay", requireAuth, requirePro, async (req, res) => {
  if (!API_KEY) return res.status(503).json({ error: "ODDS_API_KEY not configured" });
  try {
    const payload = await getCachedPayload();
    const analyzed = analyzeAllLeagues(payload._leagueResults ?? []);
    const todayStr    = new Date().toISOString().slice(0, 10);
    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const isToday     = (m) => new Date(m.kickoff).toISOString().slice(0, 10) === todayStr;
    const isTomorrow  = (m) => new Date(m.kickoff).toISOString().slice(0, 10) === tomorrowStr;

    let todayParlay = buildParlay(analyzed, isToday);
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
