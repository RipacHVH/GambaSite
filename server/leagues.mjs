// The Odds API sport keys — kept to top competitions only to preserve quota.
// Free tier = 500 req/month. At 6 leagues × 2 fetches/hour = 288/day — use
// a 1-hour cache TTL to stay well within limits.
// priority: 1 = elite (used first for free pick), 2 = top-tier
export const LEAGUES = [
  { key: "soccer_fifa_world_cup",               name: "FIFA World Cup",           tier: "cup",    priority: 1 },
  { key: "soccer_uefa_european_championship",   name: "UEFA Euro",                tier: "cup",    priority: 1 },
  { key: "soccer_uefa_champs_league",           name: "UEFA Champions League",    tier: "cup",    priority: 1 },
  { key: "soccer_epl",                          name: "Premier League",           tier: "league", priority: 1 },
  { key: "soccer_spain_la_liga",                name: "La Liga",                  tier: "league", priority: 1 },
  { key: "soccer_conmebol_copa_libertadores",   name: "Copa Libertadores",        tier: "cup",    priority: 2 },
];

export const FREE_TIER_LEAGUE_KEYS = ["soccer_epl"];
