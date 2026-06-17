import { useEffect, useState } from "react";
import { API_URL } from "../context/AuthContext";
import CalcoBetLogo from "./CalcoBetLogo";

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

function ResultBadge({ won }) {
  if (won === 1)    return <span className="inline-flex items-center rounded-full px-3 py-1 font-mono text-xs font-black" style={{ background: "rgba(16,185,129,0.15)", color: "#10B981", border: "1px solid rgba(16,185,129,0.3)" }}>WIN</span>;
  if (won === 0)    return <span className="inline-flex items-center rounded-full px-3 py-1 font-mono text-xs font-black" style={{ background: "rgba(239,68,68,0.15)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.3)" }}>LOSS</span>;
  return <span className="inline-flex items-center rounded-full px-3 py-1 font-mono text-xs font-semibold" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.1)" }}>Pending</span>;
}

function StatCard({ label, value, sub, accent }) {
  return (
    <div className="rounded-2xl px-6 py-5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <p className="font-mono text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>{label}</p>
      <p className="mt-1.5 font-display text-3xl font-black" style={{ color: accent ?? "white" }}>{value}</p>
      {sub && <p className="mt-1 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>{sub}</p>}
    </div>
  );
}

export default function HistoryPage() {
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    fetch(`${API_URL}/api/picks/history`)
      .then(r => r.json())
      .then(d => setHistory(d.history ?? []))
      .catch(() => setError("Failed to load history."))
      .finally(() => setLoading(false));
  }, []);

  const settled = (history ?? []).filter(r => r.result_won !== null);
  const wins    = settled.filter(r => r.result_won === 1).length;
  const losses  = settled.filter(r => r.result_won === 0).length;
  const winRate = settled.length ? Math.round((wins / settled.length) * 100) : null;
  const avgEV   = settled.length
    ? (settled.reduce((s, r) => s + (r.ev ?? 0), 0) / settled.length).toFixed(1)
    : null;

  return (
    <div className="min-h-screen font-sans" style={{ background: "linear-gradient(135deg, #060D1A 0%, #0B1628 60%, #0D1F3C 100%)" }}>
      <div className="top-bar h-[3px] w-full" />

      <header className="px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="mx-auto max-w-6xl lg:px-8 flex items-center justify-between">
          <a href="/"><CalcoBetLogo tileSize={36} textSize={23} taglineSize={8} gap={10} /></a>
          <a href="/" className="text-sm transition-opacity hover:opacity-80" style={{ color: "rgba(255,255,255,0.45)" }}>← Back to dashboard</a>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-white">AI Prediction History</h1>
          <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Every free daily bet we've ever published — with results.</p>
        </div>

        {/* Stats row */}
        {settled.length > 0 && (
          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Win Rate" value={`${winRate}%`} sub={`${settled.length} settled bets`} accent="#10B981" />
            <StatCard label="Wins" value={wins} sub="correct predictions" accent="#10B981" />
            <StatCard label="Losses" value={losses} sub="incorrect predictions" accent="#EF4444" />
            <StatCard label="Avg EV" value={`${avgEV >= 0 ? "+" : ""}${avgEV}%`} sub="average edge per pick" accent="#F59E0B" />
          </div>
        )}

        {/* Table */}
        <div className="overflow-hidden rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          {/* Column headers */}
          <div className="hidden sm:grid px-6 py-3 border-b" style={{ gridTemplateColumns: "130px 1fr 1fr 80px 70px 80px", borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)" }}>
            {["Date", "Match", "Our Bet", "Odds", "EV", "Result"].map(h => (
              <span key={h} className="font-mono text-[9px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>{h}</span>
            ))}
          </div>

          {loading && (
            <div className="space-y-px">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-16 animate-pulse" style={{ background: "rgba(255,255,255,0.03)" }} />
              ))}
            </div>
          )}

          {error && (
            <div className="px-6 py-10 text-center text-sm" style={{ color: "rgba(239,68,68,0.7)" }}>{error}</div>
          )}

          {!loading && !error && history?.length === 0 && (
            <div className="px-6 py-16 text-center">
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>No predictions recorded yet — check back tomorrow.</p>
            </div>
          )}

          {!loading && !error && history?.map((row, i) => (
            <div key={row.id}
              className="px-6 py-4 border-b last:border-0 flex flex-col gap-2 sm:grid sm:items-center"
              style={{
                gridTemplateColumns: "130px 1fr 1fr 80px 70px 80px",
                borderColor: "rgba(255,255,255,0.05)",
                background: row.result_won === 1
                  ? "rgba(16,185,129,0.03)"
                  : row.result_won === 0
                  ? "rgba(239,68,68,0.03)"
                  : "transparent",
              }}>
              {/* Date */}
              <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>{formatDate(row.date)}</span>

              {/* Match */}
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-white">{row.match}</p>
                <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{row.league}{row.score_str ? ` · ${row.score_str}` : ""}</p>
              </div>

              {/* Bet label */}
              <p className="truncate text-sm" style={{ color: "rgba(245,158,11,0.85)" }}>{row.label}</p>

              {/* Odds */}
              <span className="font-mono text-sm font-bold text-white">{row.decimal_odds ? `${row.decimal_odds}x` : "–"}</span>

              {/* EV */}
              <span className="font-mono text-sm font-bold" style={{ color: "#10B981" }}>
                {row.ev != null ? `${row.ev >= 0 ? "+" : ""}${row.ev}%` : "–"}
              </span>

              {/* Result */}
              <ResultBadge won={row.result_won} />
            </div>
          ))}
        </div>

        {history?.length >= 60 && (
          <p className="mt-4 text-center text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>Showing last 60 predictions</p>
        )}
      </main>
    </div>
  );
}
