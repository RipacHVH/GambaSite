// The Odds API sport keys for the major soccer leagues & cups.
// https://the-odds-api.com/sports-odds-data/soccer-odds.html
export const LEAGUES = [
  { key: "soccer_epl", name: "Premier League", tier: "league" },
  { key: "soccer_spain_la_liga", name: "La Liga", tier: "league" },
  { key: "soccer_germany_bundesliga", name: "Bundesliga", tier: "league" },
  { key: "soccer_italy_serie_a", name: "Serie A", tier: "league" },
  { key: "soccer_france_ligue_one", name: "Ligue 1", tier: "league" },
  { key: "soccer_netherlands_eredivisie", name: "Eredivisie", tier: "league" },
  { key: "soccer_portugal_primeira_liga", name: "Primeira Liga", tier: "league" },
  { key: "soccer_usa_mls", name: "MLS", tier: "league" },
  { key: "soccer_brazil_campeonato", name: "Brasileirão", tier: "league" },
  { key: "soccer_uefa_champs_league", name: "UEFA Champions League", tier: "cup" },
  { key: "soccer_uefa_europa_league", name: "UEFA Europa League", tier: "cup" },
  { key: "soccer_uefa_european_championship", name: "UEFA Euro", tier: "cup" },
  { key: "soccer_fifa_world_cup", name: "FIFA World Cup", tier: "cup" },
  { key: "soccer_conmebol_copa_libertadores", name: "Copa Libertadores", tier: "cup" },
];

export const FREE_TIER_LEAGUE_KEYS = ["soccer_epl"];
