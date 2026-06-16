import "dotenv/config";
import express from "express";
import cors from "cors";
import { fetchAllLeagues } from "./oddsApi.mjs";
import { buildPicksPayload } from "./analysis.mjs";
import { LEAGUES } from "./leagues.mjs";

const app = express();
const PORT = process.env.PORT || 8787;
const API_KEY = process.env.ODDS_API_KEY;

// The Odds API free tier is 500 requests/month. Each league fetched costs 1
// request, so we cache the computed picks in memory and only refresh every
// CACHE_TTL_MS — refreshing all ~14 leagues every page load would burn the
// quota in hours.
const CACHE_TTL_MS = 10 * 60 * 1000;
let cache = { payload: null, fetchedAt: 0 };

// In production, set ALLOWED_ORIGIN to the deployed frontend's URL (e.g.
// https://edgefinder.vercel.app) so only that origin can call this API.
// Left unset (local dev) it allows any origin so the Vite dev server works.
const allowedOrigin = process.env.ALLOWED_ORIGIN;
app.use(cors(allowedOrigin ? { origin: allowedOrigin } : {}));

app.get("/api/health", (req, res) => {
  res.json({ ok: true, hasApiKey: Boolean(API_KEY) });
});

app.get("/api/picks", async (req, res) => {
  if (!API_KEY) {
    return res.status(503).json({
      error: "ODDS_API_KEY is not configured on the server.",
      hint: "Get a free key at https://the-odds-api.com and set it in server/.env",
    });
  }

  const isFresh = cache.payload && Date.now() - cache.fetchedAt < CACHE_TTL_MS;
  if (isFresh) {
    return res.json({ ...cache.payload, cached: true });
  }

  try {
    const results = await fetchAllLeagues(LEAGUES.map((l) => l.key), API_KEY);

    const leagueResults = results.map((r, i) => ({
      league: LEAGUES[i],
      events: r.events,
      error: r.error,
    }));

    const payload = buildPicksPayload(leagueResults);
    const erroredLeagues = leagueResults.filter((l) => l.error).map((l) => l.league.name);

    cache = { payload: { ...payload, erroredLeagues }, fetchedAt: Date.now() };

    res.json({ ...cache.payload, cached: false });
  } catch (err) {
    res.status(502).json({ error: "Failed to fetch odds data", detail: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`EdgeFinder odds server listening on http://localhost:${PORT}`);
  if (!API_KEY) {
    console.warn("⚠ ODDS_API_KEY not set — /api/picks will return 503 until you add one to server/.env");
  }
});
