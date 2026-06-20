const BASE_URL = "https://api.the-odds-api.com/v4";

// h2h = Match Result (1X2), totals = Over/Under Goals, spreads = Asian Handicap
const MARKETS = "h2h,totals,spreads";
// The Odds API quota cost per odds request = (#markets) × (#regions). With 3
// markets, each region we add costs another 3 credits per league. EU + UK already
// cover the sharpest soccer books (Pinnacle, bet365, etc.) so the consensus de-vig
// stays accurate. Override with ODDS_API_REGIONS if you want to widen/narrow it.
const REGIONS = process.env.ODDS_API_REGIONS ?? "eu,uk";

export class OddsApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

/**
 * Fetch odds for one league/cup. Returns the raw events array from The Odds API:
 * [{ id, sport_key, commence_time, home_team, away_team, bookmakers: [...] }, ...]
 */
export async function fetchLeagueOdds(sportKey, apiKey) {
  const url = `${BASE_URL}/sports/${sportKey}/odds/?apiKey=${apiKey}&regions=${REGIONS}&markets=${MARKETS}&oddsFormat=decimal&dateFormat=iso`;

  const res = await fetch(url);

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new OddsApiError(`The Odds API request failed for ${sportKey}: ${res.status} ${body}`, res.status);
  }

  return res.json();
}

/**
 * Fetch completed/live scores for a sport. daysFrom = how many days back.
 * Returns array of { id, home_team, away_team, completed, scores: [{name, score}] }
 *
 * NOTE: The Odds API only accepts daysFrom values of 1, 2 or 3. Any other value
 * returns 422 Unprocessable Entity. We clamp here so an out-of-range caller can
 * never silently break score fetching (which previously left bets stuck on
 * "Score not yet available" indefinitely).
 */
export async function fetchScores(sportKey, apiKey, daysFrom = 3) {
  const clamped = Math.min(Math.max(1, Math.round(daysFrom)), 3);
  const url = `${BASE_URL}/sports/${sportKey}/scores/?apiKey=${apiKey}&daysFrom=${clamped}`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[scores] API error for ${sportKey} (daysFrom=${clamped}): ${res.status} ${body}`);
    throw new OddsApiError(`Scores request failed for ${sportKey}: ${res.status}`, res.status);
  }
  return res.json();
}

/**
 * Fetch live in-play odds for one sport.
 * Returns the same event shape as fetchLeagueOdds but for currently live matches.
 */
export async function fetchInPlayOdds(sportKey, apiKey) {
  const url = `${BASE_URL}/sports/${sportKey}/odds/?apiKey=${apiKey}&regions=${REGIONS}&markets=h2h,totals&oddsFormat=decimal&dateFormat=iso&inPlay=true`;
  const res = await fetch(url);
  if (!res.ok) return [];
  return res.json();
}

/**
 * List upcoming events for a sport WITHOUT odds. This hits the /events endpoint
 * which is FREE (0 quota cost), so it's used for cheap league discovery — we only
 * need to know which leagues have games, not their prices.
 * Returns array of { id, commence_time, home_team, away_team } (empty on error).
 */
export async function fetchEvents(sportKey, apiKey) {
  const url = `${BASE_URL}/sports/${sportKey}/events/?apiKey=${apiKey}&dateFormat=iso`;
  const res = await fetch(url);
  if (!res.ok) return [];
  return res.json();
}

export async function fetchAllLeagues(leagueKeys, apiKey) {
  const results = await Promise.allSettled(leagueKeys.map((key) => fetchLeagueOdds(key, apiKey)));

  return results.map((result, i) => ({
    leagueKey: leagueKeys[i],
    events: result.status === "fulfilled" ? result.value : [],
    error: result.status === "rejected" ? result.reason.message : null,
  }));
}
