import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "./db.mjs";

export const router = express.Router();

function jwtSecret() {
  if (!process.env.JWT_SECRET) {
    console.warn("⚠ JWT_SECRET not set — using insecure default. Set it in server/.env");
    return "dev-secret-change-me";
  }
  return process.env.JWT_SECRET;
}

function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, jwtSecret(), { expiresIn: "30d" });
}

function safeUser(u) {
  return { id: u.id, email: u.email, is_pro: Boolean(u.is_pro) };
}

export function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return res.status(401).json({ error: "Authentication required" });
  try {
    req.user = jwt.verify(auth.slice(7), jwtSecret());
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requirePro(req, res, next) {
  const row = db.prepare("SELECT is_pro FROM users WHERE id = ?").get(req.user.id);
  if (!row?.is_pro) return res.status(403).json({ error: "Active Pro subscription required" });
  next();
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) return res.status(400).json({ error: "Email and password are required" });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "Invalid email address" });
  if (password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters" });

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) return res.status(409).json({ error: "An account with this email already exists" });

  const password_hash = await bcrypt.hash(password, 12);
  const { lastInsertRowid } = db.prepare("INSERT INTO users (email, password_hash) VALUES (?, ?)").run(email, password_hash);
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(lastInsertRowid);

  res.status(201).json({ token: signToken(user), user: safeUser(user) });
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) return res.status(400).json({ error: "Email and password are required" });

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user) return res.status(401).json({ error: "Invalid email or password" });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: "Invalid email or password" });

  res.json({ token: signToken(user), user: safeUser(user) });
});

// POST /api/auth/change-password
router.post("/change-password", requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body ?? {};
  if (!currentPassword || !newPassword) return res.status(400).json({ error: "Both passwords are required" });
  if (newPassword.length < 8) return res.status(400).json({ error: "New password must be at least 8 characters" });

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  const ok = await bcrypt.compare(currentPassword, user.password_hash);
  if (!ok) return res.status(401).json({ error: "Current password is incorrect" });

  const password_hash = await bcrypt.hash(newPassword, 12);
  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(password_hash, user.id);
  res.json({ ok: true });
});

// GET /api/auth/me  — refresh session & subscription status
router.get("/me", requireAuth, (req, res) => {
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ user: safeUser(user) });
});
