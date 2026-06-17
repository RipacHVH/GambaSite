import Database from "better-sqlite3";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DB_PATH || join(__dirname, "data.db");
const db = new Database(dbPath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    is_pro INTEGER DEFAULT 0,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS pick_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
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
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(date)
  );

  CREATE TABLE IF NOT EXISTS bet_trackers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL COLLATE NOCASE,
    event_id TEXT NOT NULL,
    match TEXT NOT NULL,
    league TEXT,
    label TEXT,
    ev REAL,
    decimal_odds REAL,
    kickoff TEXT,
    notified INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

export default db;
