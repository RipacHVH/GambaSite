import "dotenv/config";
import express from "express";
import cors from "cors";
import { fetchAllLeagues } from "./oddsApi.mjs";
import { buildPicksPayload } from "./analysis.mjs";
import { LEAGUES } from "./leagues.mjs";
import { router as authRouter, requireAuth, requirePro } from "./authRouter.mjs";
import { router as stripeRouter, stripeWebhookHandler } from "./stripeRouter.mjs";

const app = express();
const PORT = process.env.PORT || 8787;
const API_KEY = process.env.ODDS_API_KEY;

const allowedOrigin = process.env.ALLOWED_ORIGIN;
app.use(cors(allowedOrigin ? { origin: allowedOrigin } : {}));

// Stripe webhook needs raw body — must be BEFORE express.json()
app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), stripeWebhookHandler);

app.use(express.json());

// ── Auth routes ────────────────────────────────────────────
app.use("/api/auth", authRouter);

// ── Stripe routes ──────────────────────────────────────────
app.use("/api/stripe", stripeRouter);

// ── Odds cache ─────────────────────────────────────────────
const CACHE_TTL_MS = 10 * 60 * 1000;
let cache = { payload: null, fetchedAt: 0 };

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

// ── Public picks (freePick + summary counts only) ──────────
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

    // proBoard is now a flat array of match objects (not grouped by league)
    const totalMatches = (proBoard ?? []).length;
    const totalEdges   = (proBoard ?? []).reduce((s, m) => s + (m.bets?.length ?? 0), 0);

    res.json({ ...rest, proBoard: null, proStats: { totalMatches, totalEdges }, cached: cache.fetchedAt > 0 });
  } catch (err) {
    res.status(502).json({ error: "Failed to fetch odds data", detail: err.message });
  }
});

// ── Pro picks (full proBoard — requires active subscription) ─
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
