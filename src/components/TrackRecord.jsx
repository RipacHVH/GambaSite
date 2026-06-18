import { useEffect, useState } from "react";
import { API_URL } from "../context/AuthContext";

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function TrackRecord() {
  const [history, setHistory] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/api/picks/history`)
      .then(r => r.json())
      .then(d => setHistory((d.history ?? []).slice(0, 10)))
      .catch(() => {});
  }, []);

  if (!history) return null;
  const settled = history.filter(r => r.result_won !== null);
  if (settled.length < 2) return null;

  const wins = settled.filter(r => r.result_won === 1).length;
  const winRate = Math.round((wins / settled.length) * 100);
  const streak = (() => {
    let count = 0;
    let type = null;
    for (const r of settled) {
      if (type === null) { type = r.result_won; count = 1; continue; }
      if (r.result_won === type) count++;
      else break;
    }
    return { count, type };
  })();

  return (
    <div style={{ background: "rgba(255,255,255,0.03)", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="mx-auto max-w-6xl px-6 py-8 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-black uppercase tracking-widest text-white">Track Record</h3>
            <span className="font-mono text-[10px] font-bold px-2.5 py-1 rounded-full"
              style={{ background: "rgba(16,185,129,0.12)", color: "#10B981", border: "1px solid rgba(16,185,129,0.25)" }}>
              {winRate}% win rate
            </span>
            {streak.count >= 2 && (
              <span className="font-mono text-[10px] font-bold px-2.5 py-1 rounded-full"
                style={{
                  background: streak.type === 1 ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                  color: streak.type === 1 ? "#10B981" : "#EF4444",
                  border: streak.type === 1 ? "1px solid rgba(16,185,129,0.25)" : "1px solid rgba(239,68,68,0.25)",
                }}>
                {streak.count} {streak.type === 1 ? "WIN" : "LOSS"} streak
              </span>
            )}
          </div>
          <a href="/history" className="text-xs font-semibold transition-opacity hover:opacity-80"
            style={{ color: "rgba(245,158,11,0.7)" }}>
            Full history →
          </a>
        </div>

        <div className="flex gap-2 flex-wrap">
          {history.map((row) => {
            const won = row.result_won;
            const pending = won === null;
            return (
              <div key={row.id} title={`${row.match} · ${row.label}`}
                className="flex flex-col items-center gap-1.5 rounded-xl px-3 py-2.5 cursor-default"
                style={{
                  background: won === 1 ? "rgba(16,185,129,0.1)" : won === 0 ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.04)",
                  border: won === 1 ? "1px solid rgba(16,185,129,0.25)" : won === 0 ? "1px solid rgba(239,68,68,0.2)" : "1px solid rgba(255,255,255,0.07)",
                  minWidth: 52,
                }}>
                <span className="font-mono text-[9px] font-bold uppercase tracking-wide"
                  style={{ color: "rgba(255,255,255,0.3)" }}>
                  {formatDate(row.date)}
                </span>
                <span className="font-mono text-xs font-black"
                  style={{ color: won === 1 ? "#10B981" : won === 0 ? "#EF4444" : "rgba(255,255,255,0.25)" }}>
                  {won === 1 ? "WIN" : won === 0 ? "LOSS" : "—"}
                </span>
              </div>
            );
          })}
        </div>

        <p className="mt-4 text-[11px]" style={{ color: "rgba(255,255,255,0.2)" }}>
          {settled.length} settled picks · {wins} wins · {settled.length - wins} losses · Statistical edge, not guaranteed returns
        </p>
      </div>
    </div>
  );
}
