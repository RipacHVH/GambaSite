import { useState, useEffect } from "react";
import { API_URL } from "../context/AuthContext";
import CalcoBetLogo from "./CalcoBetLogo";

const LEAGUES = ["Premier League", "La Liga", "Serie A", "Bundesliga", "Ligue 1", "Champions League", "Europa League", "World Cup", "Euro"];

const EMPTY = {
  date: new Date().toISOString().slice(0, 10),
  match: "",
  league: "Premier League",
  label: "",
  decimal_odds: "",
  ev: "",
  bookmaker: "Bet365",
  result_won: "",
  home_score: "",
  away_score: "",
};

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-amber-500/50";
const inputStyle = { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" };

export default function AdminPage() {
  const [secret, setSecret] = useState(() => sessionStorage.getItem("admin_secret") ?? "");
  const [authed, setAuthed] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [history, setHistory] = useState([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // { type: "ok"|"err", text }

  function headers() {
    return { "Content-Type": "application/json", "x-admin-secret": secret };
  }

  async function loadHistory() {
    const r = await fetch(`${API_URL}/api/picks/history`);
    const d = await r.json();
    setHistory(d.history ?? []);
  }

  async function tryAuth(e) {
    e.preventDefault();
    // Validate by attempting a harmless admin call
    const r = await fetch(`${API_URL}/api/admin/pick`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-secret": secret },
      body: JSON.stringify({ _probe: true }),
    });
    // 400 = authed but missing fields, 401 = wrong secret
    if (r.status === 401) { setMsg({ type: "err", text: "Wrong secret." }); return; }
    sessionStorage.setItem("admin_secret", secret);
    setAuthed(true);
    loadHistory();
  }

  function set(k, v) {
    setForm(f => {
      const next = { ...f, [k]: v };
      // Auto-determine win/loss when both scores are entered
      const hs = k === "home_score" ? v : next.home_score;
      const as = k === "away_score" ? v : next.away_score;
      const lbl = (next.label ?? "").toLowerCase();
      if (hs !== "" && as !== "" && next.result_won === "") {
        const h = Number(hs), a = Number(as), total = h + a;
        let won = "";
        if (/over (\d+\.?\d*)/.test(lbl)) {
          const line = parseFloat(lbl.match(/over (\d+\.?\d*)/)[1]);
          won = total > line ? "1" : total < line ? "0" : "";
        } else if (/under (\d+\.?\d*)/.test(lbl)) {
          const line = parseFloat(lbl.match(/under (\d+\.?\d*)/)[1]);
          won = total < line ? "1" : total > line ? "0" : "";
        } else if (/draw/.test(lbl)) {
          won = h === a ? "1" : "0";
        } else {
          const [home, away] = (next.match ?? "").split(" vs ").map(s => s.trim().toLowerCase());
          if (home && (lbl.includes(home) || lbl.includes("home win"))) won = h > a ? "1" : "0";
          else if (away && (lbl.includes(away) || lbl.includes("away win"))) won = a > h ? "1" : "0";
        }
        if (won !== "") next.result_won = won;
      }
      return next;
    });
  }

  function editRow(row) {
    setForm({
      date: row.date,
      match: row.match ?? "",
      league: row.league ?? "Premier League",
      label: row.label ?? "",
      decimal_odds: row.decimal_odds ?? "",
      ev: row.ev ?? "",
      bookmaker: row.bookmaker ?? "Bet365",
      result_won: row.result_won ?? "",
      home_score: row.home_score ?? "",
      away_score: row.away_score ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const body = {
        date: form.date,
        match: form.match,
        league: form.league,
        label: form.label,
        decimal_odds: form.decimal_odds !== "" ? Number(form.decimal_odds) : undefined,
        ev: form.ev !== "" ? Number(form.ev) : undefined,
        bookmaker: form.bookmaker || undefined,
        result_won: form.result_won !== "" ? Number(form.result_won) : undefined,
        home_score: form.home_score !== "" ? Number(form.home_score) : undefined,
        away_score: form.away_score !== "" ? Number(form.away_score) : undefined,
      };
      const r = await fetch(`${API_URL}/api/admin/pick`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Failed");
      setMsg({ type: "ok", text: `Saved pick for ${form.date}` });
      setForm(f => ({ ...EMPTY, date: f.date }));
      loadHistory();
    } catch (err) {
      setMsg({ type: "err", text: err.message });
    } finally {
      setBusy(false);
    }
  }

  async function forceRefresh(unfreeze = false) {
    if (unfreeze && !confirm("Unfreeze TODAY's free pick + parlay and regenerate them from scratch? Past history is untouched.")) return;
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch(`${API_URL}/api/admin/force-refresh`, {
        method: "POST",
        headers: { ...headers(), "Content-Type": "application/json" },
        body: JSON.stringify({ unfreeze }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Failed");
      setMsg({ type: "ok", text: `${d.unfroze ? "Unfroze today + regenerated" : "Cache busted"}. Free pick: ${d.freePick ?? "none"}${d.freePickLabel ? ` — ${d.freePickLabel}` : ""} | Pro board: ${d.proBoard} games` });
      loadHistory();
    } catch (err) {
      setMsg({ type: "err", text: err.message });
    } finally {
      setBusy(false);
    }
  }

  async function autoResolve() {
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch(`${API_URL}/api/admin/resolve-picks`, {
        method: "POST",
        headers: headers(),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Failed");
      setMsg({ type: "ok", text: d.resolved > 0 ? `Resolved ${d.resolved} pick(s): ${d.details.map(x => `${x.match} → ${x.result} (${x.score})`).join(", ")}` : (d.message ?? "Nothing to resolve yet") });
      loadHistory();
    } catch (err) {
      setMsg({ type: "err", text: err.message });
    } finally {
      setBusy(false);
    }
  }

  async function deletePick(date) {
    if (!confirm(`Delete pick for ${date}?`)) return;
    await fetch(`${API_URL}/api/admin/pick/${date}`, { method: "DELETE", headers: headers() });
    loadHistory();
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #060D1A 0%, #0B1628 100%)" }}>
        <form onSubmit={tryAuth} className="w-full max-w-sm rounded-2xl p-8 space-y-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <h1 className="text-xl font-black text-white">Admin Access</h1>
          <Field label="Admin Secret">
            <input type="password" value={secret} onChange={e => setSecret(e.target.value)}
              className={inputCls} style={inputStyle} placeholder="Enter ADMIN_SECRET" required />
          </Field>
          {msg && <p className="text-xs" style={{ color: msg.type === "err" ? "#EF4444" : "#10B981" }}>{msg.text}</p>}
          <button type="submit" className="w-full cursor-pointer rounded-xl py-3 text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}>
            Enter
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans" style={{ background: "linear-gradient(135deg, #060D1A 0%, #0B1628 100%)" }}>
      <header className="px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="mx-auto max-w-4xl flex items-center justify-between">
          <a href="/"><CalcoBetLogo tileSize={34} textSize={21} taglineSize={8} gap={10} /></a>
          <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full"
            style={{ background: "rgba(239,68,68,0.15)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.3)" }}>
            Admin
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10 space-y-10">

        {/* Pick form */}
        <section className="rounded-2xl p-8" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <h2 className="text-lg font-black text-white mb-6">Add / Update Pick</h2>
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
            <Field label="Date">
              <input type="date" value={form.date} onChange={e => set("date", e.target.value)}
                className={inputCls} style={inputStyle} required />
            </Field>

            <Field label="League">
              <select value={form.league} onChange={e => set("league", e.target.value)}
                className={inputCls} style={inputStyle}>
                {LEAGUES.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </Field>

            <Field label="Match (Home vs Away)">
              <input type="text" value={form.match} onChange={e => set("match", e.target.value)}
                className={inputCls} style={inputStyle} placeholder="Real Madrid vs Barcelona" required />
            </Field>

            <Field label="Bet Label">
              <input type="text" value={form.label} onChange={e => set("label", e.target.value)}
                className={inputCls} style={inputStyle} placeholder="Over 2.5 Goals" required />
            </Field>

            <Field label="Decimal Odds">
              <input type="number" step="0.01" min="1" value={form.decimal_odds} onChange={e => set("decimal_odds", e.target.value)}
                className={inputCls} style={inputStyle} placeholder="1.87" />
            </Field>

            <Field label="EV % (e.g. 6.2)">
              <input type="number" step="0.1" value={form.ev} onChange={e => set("ev", e.target.value)}
                className={inputCls} style={inputStyle} placeholder="6.2" />
            </Field>

            <Field label="Bookmaker">
              <input type="text" value={form.bookmaker} onChange={e => set("bookmaker", e.target.value)}
                className={inputCls} style={inputStyle} placeholder="Bet365" />
            </Field>

            <Field label="Result">
              <select value={form.result_won} onChange={e => set("result_won", e.target.value)}
                className={inputCls} style={inputStyle}>
                <option value="">Pending</option>
                <option value="1">Win</option>
                <option value="0">Loss</option>
              </select>
            </Field>

            <Field label="Home Score">
              <input type="number" min="0" value={form.home_score} onChange={e => set("home_score", e.target.value)}
                className={inputCls} style={inputStyle} placeholder="2" />
            </Field>

            <Field label="Away Score">
              <input type="number" min="0" value={form.away_score} onChange={e => set("away_score", e.target.value)}
                className={inputCls} style={inputStyle} placeholder="1" />
            </Field>

            <div className="sm:col-span-2 flex items-center gap-4">
              <button type="submit" disabled={busy}
                className="cursor-pointer rounded-xl px-8 py-3 text-sm font-bold text-white disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}>
                {busy ? "Saving…" : "Save Pick"}
              </button>
              <button type="button" onClick={() => setForm(EMPTY)}
                className="cursor-pointer rounded-xl px-6 py-3 text-sm font-semibold"
                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)" }}>
                Clear
              </button>
              {msg && <p className="text-sm font-semibold" style={{ color: msg.type === "err" ? "#EF4444" : "#10B981" }}>{msg.text}</p>}
            </div>
          </form>
        </section>

        {/* History table */}
        <section>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-black text-white">Pick History ({history.length})</h2>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => forceRefresh(false)} disabled={busy}
                className="cursor-pointer rounded-xl px-5 py-2.5 text-sm font-bold disabled:opacity-60"
                style={{ background: "rgba(239,68,68,0.15)", color: "#F87171", border: "1px solid rgba(239,68,68,0.3)" }}>
                {busy ? "Refreshing…" : "Force Refresh Cache"}
              </button>
              <button onClick={() => forceRefresh(true)} disabled={busy}
                title="Deletes TODAY's frozen free pick + parlay and regenerates both with the current algorithm. Past history untouched."
                className="cursor-pointer rounded-xl px-5 py-2.5 text-sm font-bold disabled:opacity-60"
                style={{ background: "rgba(239,68,68,0.3)", color: "#FCA5A5", border: "1px solid rgba(239,68,68,0.5)" }}>
                {busy ? "Working…" : "Unfreeze Today + Regenerate"}
              </button>
              <button onClick={autoResolve} disabled={busy}
                className="cursor-pointer rounded-xl px-5 py-2.5 text-sm font-bold disabled:opacity-60"
                style={{ background: "rgba(16,185,129,0.15)", color: "#10B981", border: "1px solid rgba(16,185,129,0.3)" }}>
                {busy ? "Resolving…" : "Auto-Resolve Pending"}
              </button>
            </div>
          </div>
          <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            {history.length === 0 && (
              <p className="px-6 py-10 text-center text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>No picks yet.</p>
            )}
            {history.map(row => (
              <div key={row.id} className="flex items-center gap-4 px-5 py-4 border-b last:border-0"
                style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                <span className="font-mono text-xs shrink-0" style={{ color: "rgba(255,255,255,0.4)" }}>{row.date}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-white">{row.match}</p>
                  <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>{row.league} · {row.label}</p>
                </div>
                <span className="text-xs font-mono shrink-0" style={{ color: row.result_won === 1 ? "#10B981" : row.result_won === 0 ? "#EF4444" : "rgba(255,255,255,0.3)" }}>
                  {row.result_won === 1 ? "WIN" : row.result_won === 0 ? "LOSS" : "Pending"}
                </span>
                <button onClick={() => editRow(row)}
                  className="cursor-pointer shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold"
                  style={{ background: "rgba(245,158,11,0.12)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.25)" }}>
                  Edit
                </button>
                <button onClick={() => deletePick(row.date)}
                  className="cursor-pointer shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold"
                  style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.25)" }}>
                  Delete
                </button>
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}
