import pg from "pg";
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
});

// Convert SQLite ? placeholders to PostgreSQL $1, $2, ...
function toPositional(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

const db = {
  // Returns first row or undefined
  async get(sql, params = []) {
    const { rows } = await pool.query(toPositional(sql), params);
    return rows[0];
  },

  // Returns all rows
  async all(sql, params = []) {
    const { rows } = await pool.query(toPositional(sql), params);
    return rows;
  },

  // Execute (INSERT/UPDATE/DELETE), returns pg result
  async run(sql, params = []) {
    return pool.query(toPositional(sql), params);
  },

  pool,
};

// Create tables on startup
await pool.query(`
  CREATE EXTENSION IF NOT EXISTS citext;

  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email CITEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    is_pro INTEGER DEFAULT 0,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS daily_parlay (
    id SERIAL PRIMARY KEY,
    date TEXT NOT NULL UNIQUE,
    legs_json TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS pick_history (
    id SERIAL PRIMARY KEY,
    date TEXT NOT NULL UNIQUE,
    event_id TEXT,
    match TEXT NOT NULL,
    league TEXT,
    label TEXT,
    ev REAL,
    decimal_odds REAL,
    true_prob REAL,
    implied_prob REAL,
    kickoff TEXT,
    bookmaker TEXT,
    result_won INTEGER,
    home_score INTEGER,
    away_score INTEGER,
    score_str TEXT,
    newsletter_sent INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS bet_trackers (
    id SERIAL PRIMARY KEY,
    email CITEXT NOT NULL,
    event_id TEXT NOT NULL,
    match TEXT NOT NULL,
    league TEXT,
    label TEXT,
    ev REAL,
    decimal_odds REAL,
    kickoff TEXT,
    notified INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id SERIAL PRIMARY KEY,
    email CITEXT UNIQUE NOT NULL,
    token TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS server_cache (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    fetched_at TIMESTAMPTZ NOT NULL
  );
`);

export default db;
