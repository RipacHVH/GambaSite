import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useLiveAdvisor } from "../hooks/useLiveAdvisor";

// ── Helpers ──────────────────────────────────────────────────
function fmtCountdown(ms) {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function fmtKickoff(iso, minsToKickoff) {
  if (minsToKickoff <= 0) return "Kicking off now";
  if (minsToKickoff < 60) return `Kickoff in ${minsToKickoff}m`;
  const h = Math.floor(minsToKickoff / 60);
  const m = minsToKickoff % 60;
  return `Kickoff in ${h}h${m > 0 ? ` ${m}m` : ""}`;
}

// ── Sub-components ───────────────────────────────────────────
function UrgencyBadge({ urgency }) {
  const styles = {
    HIGH:   { bg: "rgba(239,68,68,0.15)",   border: "rgba(239,68,68,0.35)",   color: "#EF4444", dot: "#EF4444",   label: "URGENT" },
    MEDIUM: { bg: "rgba(245,158,11,0.15)",  border: "rgba(245,158,11,0.35)",  color: "#F59E0B", dot: "#F59E0B",   label: "SOON" },
    LOW:    { bg: "rgba(100,116,139,0.15)", border: "rgba(100,116,139,0.3)",  color: "#94A3B8", dot: "#64748B",   label: "TODAY" },
  }[urgency] ?? {};
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[9px] font-bold"
      style={{ background: styles.bg, border: `1px solid ${styles.border}`, color: styles.color }}>
      <span className="h-1.5 w-1.5 rounded-full animate-pulse-dot" style={{ background: styles.dot }} />
      {styles.label}
    </span>
  );
}

function ConfidenceBadge({ confidence }) {
  const map = {
    "STRONG BUY": { bg: "rgba(16,185,129,0.15)", border: "rgba(16,185,129,0.35)", color: "#10B981" },
    "BUY":        { bg: "rgba(16,185,129,0.10)", border: "rgba(16,185,129,0.25)", color: "#34D399" },
    "WATCH":      { bg: "rgba(100,116,139,0.12)", border: "rgba(100,116,139,0.25)", color: "#94A3B8" },
  }[confidence] ?? {};
  return (
    <span className="rounded-full px-2.5 py-0.5 font-mono text-[9px] font-bold"
      style={{ background: map.bg, border: `1px solid ${map.border}`, color: map.color }}>
      {confidence}
    </span>
  );
}

function PickRow({ pick }) {
  return (
    <div className="rounded-xl p-4 transition-colors"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <UrgencyBadge urgency={pick.urgency} />
          <span className="text-[10px] font-semibold" style={{ color: "rgba(255,255,255,0.35)" }}>
            {fmtKickoff(pick.kickoff, pick.minsToKickoff)}
          </span>
        </div>
        <ConfidenceBadge confidence={pick.confidence} />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-bold text-white truncate">{pick.match}</p>
          <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{pick.league}</p>
          <p className="text-sm mt-1 font-semibold" style={{ color: "#F59E0B" }}>{pick.label}</p>
        </div>
        <div className="flex gap-4 shrink-0">
          <div className="text-right">
            <p className="font-mono text-lg font-black text-white">{pick.decimalOdds}x</p>
            <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.3)" }}>Odds</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-lg font-black" style={{ color: "#10B981" }}>+{pick.ev}%</p>
            <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.3)" }}>Edge</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-lg font-black" style={{ color: "#94A3B8" }}>{pick.trueProb}%</p>
            <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.3)" }}>True Prob</p>
          </div>
        </div>
      </div>

      <div className="mt-3">
        <div className="text-[9px] font-semibold uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.25)" }}>
          Edge strength
        </div>
        <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
          <div className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(100, (pick.ev / 10) * 100)}%`,
              background: pick.ev >= 6 ? "linear-gradient(90deg,#10B981,#34D399)" : pick.ev >= 3 ? "#F59E0B" : "#64748B",
            }} />
        </div>
      </div>

      <p className="mt-2 text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
        Best odds at {pick.bookmaker}
      </p>
    </div>
  );
}

// ── Cash Out Tab ─────────────────────────────────────────────
const inputStyle = {
  width: "100%",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 10,
  padding: "10px 14px",
  color: "white",
  fontSize: 13,
  outline: "none",
};

function CashOutTab({ events }) {
  const { apiFetch } = useAuth();
  const [eventId, setEventId]         = useState("");
  const [betIndex, setBetIndex]       = useState("");
  const [originalOdds, setOrigOdds]   = useState("");
  const [stake, setStake]             = useState("");
  const [result, setResult]           = useState(null);
  const [busy, setBusy]               = useState(false);
  const [err, setErr]                 = useState("");

  const selectedEvent = events?.find(e => e.eventId === eventId);
  const selectedBet   = selectedEvent?.bets[parseInt(betIndex)] ?? null;

  async function handleCheck(e) {
    e.preventDefault();
    if (!selectedBet || !originalOdds || !stake) { setErr("Fill all fields."); return; }
    setErr(""); setBusy(true); setResult(null);
    try {
      const r = await apiFetch("/api/pro/cashout-check", {
        method: "POST",
        body: JSON.stringify({
          eventId,
          market: selectedBet.market,
          selection: selectedBet.selection,
          point: selectedBet.point,
          originalOdds: parseFloat(originalOdds),
          stake: parseFloat(stake),
        }),
      });
      setResult(r);
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  }

  const recColor = result?.recommendation === "HOLD"    ? "#10B981"
                 : result?.recommendation === "CASH OUT" ? "#EF4444"
                 : "#F59E0B";
  const recBg    = result?.recommendation === "HOLD"    ? "rgba(16,185,129,0.1)"
                 : result?.recommendation === "CASH OUT" ? "rgba(239,68,68,0.1)"
                 : "rgba(245,158,11,0.1)";

  return (
    <div>
      <p className="text-sm mb-5" style={{ color: "rgba(255,255,255,0.45)" }}>
        Enter your active bet below — we'll compare current market odds against your original position and tell you whether to hold or take the cash out.
      </p>

      <form onSubmit={handleCheck} className="space-y-4">
        {/* Match selector */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>
            Match
          </label>
          <select value={eventId} onChange={e => { setEventId(e.target.value); setBetIndex(""); setResult(null); }}
            style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}>
            <option value="">Select a match…</option>
            {(events ?? []).map(ev => (
              <option key={ev.eventId} value={ev.eventId}>{ev.match} — {ev.league}</option>
            ))}
          </select>
        </div>

        {/* Bet selector */}
        {selectedEvent && (
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>
              Your Bet
            </label>
            <select value={betIndex} onChange={e => { setBetIndex(e.target.value); setResult(null); }}
              style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}>
              <option value="">Select your bet…</option>
              {selectedEvent.bets.map((b, i) => (
                <option key={i} value={i}>{b.label} (current: {b.decimalOdds}x)</option>
              ))}
            </select>
          </div>
        )}

        {/* Odds + Stake */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>
              Your Original Odds
            </label>
            <input type="number" step="0.01" min="1.01" placeholder="e.g. 2.10"
              value={originalOdds} onChange={e => { setOrigOdds(e.target.value); setResult(null); }}
              style={inputStyle} />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>
              Your Stake (£)
            </label>
            <input type="number" step="0.01" min="0.01" placeholder="e.g. 50"
              value={stake} onChange={e => { setStake(e.target.value); setResult(null); }}
              style={inputStyle} />
          </div>
        </div>

        {err && <p className="text-xs" style={{ color: "#EF4444" }}>{err}</p>}

        <button type="submit" disabled={busy || !eventId || betIndex === "" || !originalOdds || !stake}
          className="w-full cursor-pointer rounded-xl py-3 text-sm font-bold text-white transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}>
          {busy ? "Analysing…" : "Analyse My Bet →"}
        </button>
      </form>

      {/* Result */}
      {result && (
        <div className="mt-5 rounded-xl overflow-hidden" style={{ border: `1px solid ${recColor}40` }}>
          {/* Header */}
          <div className="px-5 py-4 flex items-center justify-between" style={{ background: recBg }}>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: `${recColor}99` }}>
                AI Recommendation
              </p>
              <p className="text-2xl font-black" style={{ color: recColor }}>
                {result.recommendation}
              </p>
            </div>
            {result.found && (
              <div className="text-right">
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                  Odds movement
                </p>
                <p className="font-mono text-lg font-black" style={{ color: result.oddsMovement < 0 ? "#10B981" : result.oddsMovement > 0 ? "#EF4444" : "#94A3B8" }}>
                  {result.oddsMovement > 0 ? "+" : ""}{result.oddsMovement}
                </p>
              </div>
            )}
          </div>

          {/* Body */}
          <div className="px-5 py-4 space-y-3" style={{ background: "rgba(0,0,0,0.2)" }}>
            <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>{result.reason}</p>
            <div className="rounded-lg px-4 py-3 text-sm font-semibold" style={{ background: "rgba(255,255,255,0.04)", color: recColor }}>
              → {result.action}
            </div>

            {result.found && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                {[
                  { label: "Original Odds", value: `${result.originalOdds}x` },
                  { label: "Current Odds",  value: `${result.currentOdds}x` },
                  { label: "True Win Prob", value: `${result.trueProb}%` },
                  { label: "Current Edge",  value: `${result.currentEV >= 0 ? "+" : ""}${result.currentEV}%` },
                  { label: "Est. Cash Out", value: `£${result.approxCashoutValue}` },
                  { label: "Hold Expected", value: `£${result.holdExpectedReturn}` },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-lg px-3 py-2" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <p className="text-[9px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{label}</p>
                    <p className="font-mono text-sm font-bold text-white">{value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Skeleton loader ──────────────────────────────────────────
function Skeleton() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-28 rounded-xl animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
      ))}
    </div>
  );
}

// ── Locked overlay (non-Pro) ─────────────────────────────────
function LockedOverlay({ onUnlock }) {
  return (
    <div className="relative rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(245,158,11,0.2)" }}>
      {/* blurred ghost */}
      <div className="px-5 py-5 space-y-3 pointer-events-none select-none blur-sm opacity-40">
        {[["Arsenal vs Chelsea", "Over 2.5 Goals", "1.85", "+8.2%", "HIGH"],
          ["Man City vs Liverpool", "Man City to Win", "2.10", "+5.7%", "MEDIUM"],
          ["Barcelona vs Real Madrid", "BTTS Yes", "1.70", "+4.1%", "LOW"]].map(([match, label, odds, ev, urg]) => (
          <div key={match} className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="rounded-full px-2 py-0.5 text-[9px] font-bold" style={{ background: "rgba(239,68,68,0.15)", color: "#EF4444" }}>{urg}</span>
            </div>
            <p className="text-sm font-bold text-white">{match}</p>
            <p className="text-sm mt-1" style={{ color: "#F59E0B" }}>{label}</p>
            <div className="flex gap-4 mt-2">
              <span className="font-mono font-black text-white">{odds}x</span>
              <span className="font-mono font-black" style={{ color: "#10B981" }}>{ev}</span>
            </div>
          </div>
        ))}
      </div>
      {/* overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4"
        style={{ background: "rgba(6,13,26,0.7)", backdropFilter: "blur(4px)" }}>
        <div className="text-center">
          <p className="text-white font-black text-lg mb-1">Pro Feature</p>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
            Real-time bet recommendations &amp; cash out advice — Pro only
          </p>
        </div>
        <button onClick={onUnlock}
          className="cursor-pointer rounded-xl px-7 py-3 text-sm font-bold text-white hover:brightness-110 transition-all shadow-gold-glow"
          style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}>
          Unlock Pro
        </button>
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────
export default function LiveAdvisorCard({ isPro, onUnlock }) {
  const [tab, setTab] = useState("picks");
  const { data, loading, error, countdown, refresh } = useLiveAdvisor(isPro);

  if (!isPro) return <LockedOverlay onUnlock={onUnlock} />;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
      {/* Header */}
      <div className="px-5 py-4 flex flex-wrap items-center justify-between gap-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-3">
          <span className="flex h-2 w-2 rounded-full animate-pulse-dot" style={{ background: "#EF4444" }} />
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-white">Live Advisor</span>
          <span className="rounded-full px-2.5 py-0.5 font-mono text-[9px] font-bold"
            style={{ background: "rgba(245,158,11,0.15)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.3)" }}>PRO</span>
        </div>
        <div className="flex items-center gap-3">
          {!loading && (
            <button onClick={refresh} className="cursor-pointer text-[10px] font-semibold transition-opacity hover:opacity-80"
              style={{ color: "rgba(255,255,255,0.35)" }}>
              Refresh
            </button>
          )}
          <span className="font-mono text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>
            Next refresh in {fmtCountdown(countdown)}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {[["picks", "Top Picks Now"], ["cashout", "Cash Out Advisor"]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className="cursor-pointer flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors"
            style={{
              color: tab === key ? "#F59E0B" : "rgba(255,255,255,0.35)",
              borderBottom: tab === key ? "2px solid #F59E0B" : "2px solid transparent",
              background: "none",
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="px-5 py-5">
        {tab === "picks" && (
          <>
            {loading && <Skeleton />}
            {error && <p className="text-sm py-4 text-center" style={{ color: "#EF4444" }}>{error}</p>}
            {!loading && !error && (!data?.picks?.length ? (
              <div className="py-10 text-center">
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>No high-confidence picks available in the next 24 hours.</p>
                <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.2)" }}>Check back closer to kick-off times.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.picks.map((pick, i) => <PickRow key={`${pick.eventId}-${pick.market}-${pick.selection}-${i}`} pick={pick} />)}
              </div>
            ))}
          </>
        )}
        {tab === "cashout" && (
          <>
            {loading && <Skeleton />}
            {!loading && <CashOutTab events={data?.events ?? []} />}
          </>
        )}
      </div>
    </div>
  );
}
