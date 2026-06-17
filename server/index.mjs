import "dotenv/config";
import express from "express";
import cors from "cors";
import { fetchAllLeagues, fetchScores } from "./oddsApi.mjs";
import { buildPicksPayload } from "./analysis.mjs";
import { LEAGUES } from "./leagues.mjs";
import { router as authRouter, requireAuth, requirePro } from "./authRouter.mjs";
import { router as stripeRouter, stripeWebhookHandler } from "./stripeRouter.mjs";

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
const CACHE_TTL_MS = 10 * 60 * 1000;
let cache = { payload: null, fetchedAt: 0 };

// Score cache — keyed by eventId, value: { homeScore, awayScore, completed }
let scoreCache = {};

// Daily free pick — persists through kickoff so the card doesn't disappear
// once the Odds API stops serving odds for a live match.
// Keyed by UTC date string "YYYY-MM-DD".
let dailyFreePickStore = { date: null, pick: null };

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

    return { ...freePick, result };
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
  cache = { payload: { ...payload, erroredLeagues }, fetchedAt: Date.now() };
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

    const todayUTC = new Date().toISOString().slice(0, 10);

    // Persist today's free pick — once selected it survives kickoff (the Odds
    // API stops returning odds for live matches, so freePick goes null).
    if (rest.freePick) {
      dailyFreePickStore = { date: todayUTC, pick: rest.freePick };
    }
    const resolvedPick = rest.freePick
      ?? (dailyFreePickStore.date === todayUTC ? dailyFreePickStore.pick : null);

    // Attach score + win/loss result if match is finished
    const freePick = await attachScoreToFreePick(resolvedPick);

    res.json({ ...rest, freePick, proBoard: null, proStats: { totalMatches, totalEdges }, cached: cache.fetchedAt > 0 });
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

app.listen(PORT, () => {
  console.log(`CalcoBetAI server listening on http://localhost:${PORT}`);
  if (!API_KEY) console.warn("⚠ ODDS_API_KEY not set");
  if (!process.env.JWT_SECRET) console.warn("⚠ JWT_SECRET not set — using insecure default");
  if (!process.env.STRIPE_SECRET_KEY) console.warn("⚠ STRIPE_SECRET_KEY not set — payments disabled");
});
