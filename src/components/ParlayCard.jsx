import { useState } from "react";
import OddsValue from "./OddsValue";

function formatKickoff(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

function legColors(result) {
  if (result?.won === true)  return { bg: "rgba(16,185,129,0.08)",  border: "rgba(16,185,129,0.25)",  badge: { bg: "rgba(16,185,129,0.15)", color: "#10B981", border: "rgba(16,185,129,0.3)", text: "WON ✓" } };
  if (result?.won === false) return { bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.22)",   badge: { bg: "rgba(239,68,68,0.15)",  color: "#EF4444", border: "rgba(239,68,68,0.3)",  text: "LOST" } };
  return { bg: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.07)", badge: null };
}

function LegRow({ leg, index }) {
  const colors = legColors(leg.result);
  return (
    <div className="flex items-center gap-4 rounded-xl px-5 py-4 transition-colors"
      style={{ background: colors.bg, border: `1px solid ${colors.border}` }}>
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-black"
        style={{ background: "rgba(245,158,11,0.15)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.3)" }}>
        {index + 1}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-white">{leg.match}</p>
        <p className="mt-0.5 truncate text-xs" style={{ color: "rgba(245,158,11,0.8)" }}>{leg.label}</p>
        <p className="mt-0.5 text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
          {leg.league} · {formatKickoff(leg.kickoff)}
        </p>
      </div>
      <div className="shrink-0 text-right flex flex-col items-end gap-1">
        {colors.badge ? (
          <span className="rounded-full px-2 py-0.5 font-mono text-[10px] font-black"
            style={{ background: colors.badge.bg, color: colors.badge.color, border: `1px solid ${colors.badge.border}` }}>
            {colors.badge.text}
          </span>
        ) : (
          <>
            <p className="font-mono text-base font-black text-white"><OddsValue decimal={leg.decimalOdds} /></p>
            <p className="font-mono text-[10px] font-bold" style={{ color: "#10B981" }}>+{leg.ev}% EV</p>
          </>
        )}
      </div>
    </div>
  );
}

function LockedOverlay({ onUnlock }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl z-10"
      style={{ background: "rgba(6,13,26,0.82)", backdropFilter: "blur(6px)" }}>
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl mb-4"
        style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)" }}>
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="#F59E0B" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <p className="text-base font-black text-white mb-1">Pro Feature</p>
      <p className="mb-5 text-xs text-center max-w-[220px]" style={{ color: "rgba(255,255,255,0.45)" }}>
        Unlock the full daily parlay — selected legs with combined odds and edge
      </p>
      <button onClick={onUnlock}
        className="cursor-pointer rounded-xl px-7 py-3 text-sm font-bold text-white transition-all hover:brightness-110 shadow-gold-glow"
        style={{ background: "linear-gradient(135deg,#F59E0B,#D97706)" }}>
        Unlock Pro · $20/mo
      </button>
    </div>
  );
}

function StatsPanel({ data }) {
  const payout100 = (100 * data.combinedOdds).toFixed(0);
  const wonLegs  = data.legs.filter(l => l.result?.won === true).length;
  const lostLegs = data.legs.filter(l => l.result?.won === false).length;
  const anyLost  = lostLegs > 0;

  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl p-6 lg:rounded-xl"
      style={{ background: anyLost ? "rgba(239,68,68,0.04)" : "rgba(245,158,11,0.04)", border: `1px solid ${anyLost ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.12)"}` }}>
      <div className="text-center">
        <p className="font-mono text-[10px] font-bold uppercase tracking-widest mb-1"
          style={{ color: anyLost ? "rgba(239,68,68,0.6)" : "rgba(245,158,11,0.6)" }}>Combined Odds</p>
        <p className="font-display font-black leading-none"
          style={{ fontSize: "clamp(2.5rem,7vw,3.5rem)", color: anyLost ? "#EF4444" : "#F59E0B", textShadow: anyLost ? "0 0 30px rgba(239,68,68,0.3)" : "0 0 30px rgba(245,158,11,0.35)" }}>
          {data.combinedOdds}x
        </p>
        <p className="mt-2 text-xs font-semibold" style={{ color: "rgba(255,255,255,0.35)" }}>
          $100 → <span className="text-white font-bold">${payout100}</span>
        </p>
        {(wonLegs > 0 || lostLegs > 0) && (
          <p className="mt-1.5 text-xs font-mono" style={{ color: "rgba(255,255,255,0.4)" }}>
            {wonLegs > 0 && <span style={{ color: "#10B981" }}>{wonLegs} won </span>}
            {lostLegs > 0 && <span style={{ color: "#EF4444" }}>{lostLegs} lost </span>}
            {data.legs.length - wonLegs - lostLegs > 0 && <span>{data.legs.length - wonLegs - lostLegs} pending</span>}
          </p>
        )}
      </div>
      <div className="w-full space-y-2">
        {[
          { label: "AI Edge", value: `${data.combinedEV >= 0 ? "+" : ""}${data.combinedEV}%`, style: { bg: "rgba(16,185,129,0.07)", border: "rgba(16,185,129,0.15)", color: "#10B981" } },
          { label: "True Prob", value: `${data.combinedTrueProb}%`, style: { bg: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.07)", color: "white" } },
          { label: "Legs", value: data.legCount, style: { bg: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.07)", color: "white" } },
        ].map(({ label, value, style: s }) => (
          <div key={label} className="flex items-center justify-between rounded-lg px-3 py-2"
            style={{ background: s.bg, border: `1px solid ${s.border}` }}>
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</span>
            <span className="font-mono text-sm font-black" style={{ color: s.color }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ParlayContent({ data }) {
  if (!data) {
    return (
      <div className="py-10 text-center">
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
          No qualifying parlay found for this day — check back after the next odds refresh.
        </p>
      </div>
    );
  }

  const anyLost = data.legs.some(l => l.result?.won === false);

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[1fr_220px]">
        <div className="space-y-2.5">
          {data.legs.map((leg, i) => (
            <LegRow key={`${leg.eventId}-${leg.label}`} leg={leg} index={i} />
          ))}
        </div>
        <StatsPanel data={data} />
      </div>

      {/* Replacement parlay if a leg busted */}
      {anyLost && data.replacement && (
        <div className="rounded-xl p-5" style={{ background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.15)" }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#F59E0B" }}>
            Replacement Parlay — Rebuilt from remaining games
          </p>
          <div className="space-y-2.5">
            {data.replacement.legs.map((leg, i) => (
              <LegRow key={`r-${leg.eventId}-${leg.label}`} leg={leg} index={i} />
            ))}
          </div>
          <div className="mt-3 flex items-center gap-3 text-xs font-mono" style={{ color: "rgba(255,255,255,0.4)" }}>
            <span>Combined: <span className="text-white font-bold">{data.replacement.combinedOdds}x</span></span>
            <span>·</span>
            <span>Edge: <span style={{ color: "#10B981" }}>{data.replacement.combinedEV >= 0 ? "+" : ""}{data.replacement.combinedEV}%</span></span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ParlayCard({ parlay, loading, isPro, onUnlock }) {
  const [tab, setTab] = useState("today");

  if (loading) {
    return (
      <div className="h-64 animate-pulse rounded-2xl"
        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }} />
    );
  }

  const activeData = tab === "today" ? parlay?.today : parlay?.tomorrow;

  const ghostLegs = [
    { match: "Team A vs Team B", label: "Over 2.5 Goals (Total)", league: "Premier League", kickoff: new Date(Date.now() + 3600000).toISOString(), decimalOdds: 1.85, ev: 3.2, eventId: "g1" },
    { match: "Team C vs Team D", label: "Team C to Win (Match Result)", league: "La Liga", kickoff: new Date(Date.now() + 7200000).toISOString(), decimalOdds: 2.10, ev: 5.1, eventId: "g2" },
    { match: "Team E vs Team F", label: "Under 3.5 Goals (Total)", league: "Bundesliga", kickoff: new Date(Date.now() + 10800000).toISOString(), decimalOdds: 1.72, ev: 2.8, eventId: "g3" },
  ];
  const ghostData = { legs: ghostLegs, combinedOdds: 6.67, combinedTrueProb: 18.4, combinedEV: 22.7, legCount: 3 };

  return (
    <div className="overflow-hidden rounded-2xl"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(12px)" }}>

      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center gap-2.5">
          <span className="h-2 w-2 rounded-full animate-pulse-dot" style={{ background: "#F59E0B" }} />
          <span className="text-xs font-bold uppercase tracking-widest text-white">AI Parlay</span>
          <span className="rounded-full px-2.5 py-0.5 font-mono text-[9px] font-bold"
            style={{ background: "rgba(245,158,11,0.15)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.3)" }}>
            PRO
          </span>
        </div>
        <div className="inline-flex rounded-lg p-1" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
          {[["today", "Today"], ["tomorrow", "Tomorrow"]].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              className="cursor-pointer rounded-md px-4 py-1.5 text-xs font-bold transition-all"
              style={tab === id ? { background: "rgba(255,255,255,0.12)", color: "white" } : { color: "rgba(255,255,255,0.4)" }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative p-6 sm:p-8">
        {isPro ? (
          <ParlayContent data={activeData} />
        ) : (
          <>
            <div style={{ filter: "blur(5px)", pointerEvents: "none", userSelect: "none", opacity: 0.4 }}>
              <ParlayContent data={ghostData} />
            </div>
            <LockedOverlay onUnlock={onUnlock} />
          </>
        )}
      </div>

      {isPro && (
        <div className="px-6 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.25)" }}>
            Parlay legs selected by highest AI edge from today's fixtures. All legs must win for payout.
          </p>
        </div>
      )}
    </div>
  );
}
