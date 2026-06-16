const BASE_URL = "https://api.the-odds-api.com/v4";

// h2h = Match Result (1X2), totals = Over/Under Goals, spreads = Asian Handicap
const MARKETS = "h2h,totals,spreads";
const REGIONS = "uk,eu,us"; // pulls a wide spread of bookmakers so de-vig has more books to average

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

export async function fetchAllLeagues(leagueKeys, apiKey) {
  const results = await Promise.allSettled(leagueKeys.map((key) => fetchLeagueOdds(key, apiKey)));

  return results.map((result, i) => ({
    leagueKey: leagueKeys[i],
    events: result.status === "fulfilled" ? result.value : [],
    error: result.status === "rejected" ? result.reason.message : null,
  }));
}
