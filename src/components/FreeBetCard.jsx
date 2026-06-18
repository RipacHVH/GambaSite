import { useState, useEffect } from "react";
import { IconTarget } from "./Icons";
import OddsValue from "./OddsValue";
import { useAuth, API_URL } from "../context/AuthContext";

const LOCK_KEY = "cb_free_pick_v2";
const LOCK_DURATION = 24 * 60 * 60 * 1000; // 24 hours

function getStoredPick() {
  try {
    const d = JSON.parse(localStorage.getItem(LOCK_KEY) || "null");
    if (!d?.pick || !d?.unlockedAt) return null;
    return d;
  } catch { return null; }
}

function formatCountdown(ms) {
  if (ms <= 0) return "00:00:00";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return [h, m, s].map(v => String(v).padStart(2, "0")).join(":");
}

function formatKickoff(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

function matchStatus(kickoffIso) {
  if (!kickoffIso) return "upcoming";
  const kickoff = new Date(kickoffIso).getTime();
  const now = Date.now();
  if (now < kickoff) return "upcoming";
  if (now < kickoff + 105 * 60 * 1000) return "live";
  return "finished";
}

function TrackBetButton({ pick }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(user?.email ?? "");
  const [state, setState] = useState("idle");

  async function submit() {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    setState("loading");
    try {
      await fetch(`${API_URL}/api/track-pick`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, eventId: pick.eventId, match: pick.match, league: pick.league, label: pick.label, ev: pick.ev, decimalOdds: pick.decimalOdds, kickoff: pick.kickoff }),
      });
      setState("done");
    } catch { setState("error"); }
  }

  if (state === "done") return (
    <div className="w-full rounded-lg px-4 py-3 text-center text-xs font-semibold"
      style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", color: "#10B981" }}>
      ✓ We'll email you the result
    </div>
  );

  return (
    <div className="w-full">
      <button onClick={() => setOpen(v => !v)}
        className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.5)" }}
        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
        onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}>
        <IconTarget className="w-3.5 h-3.5" /> Track This Bet
      </button>
      {open && (
        <div className="mt-2 rounded-lg p-3" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <p className="text-[11px] mb-2 leading-snug" style={{ color: "rgba(255,255,255,0.4)" }}>
            {user ? "We'll email you the final score and result." : "Enter your email — we'll send you the result after the match."}
          </p>
          {!user && <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com"
            className="mb-2 w-full rounded-md px-3 py-2 text-xs outline-none"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "white" }} />}
          {user && <p className="mb-2 text-xs font-semibold truncate" style={{ color: "rgba(255,255,255,0.6)" }}>{user.email}</p>}
          <button onClick={submit} disabled={state === "loading"}
            className="w-full cursor-pointer rounded-md py-2 text-xs font-bold text-white transition-all disabled:opacity-60"
            style={{ background: "linear-gradient(135deg,#F59E0B,#D97706)" }}>
            {state === "loading" ? "Saving…" : "Notify me"}
          </button>
          {state === "error" && <p className="mt-1.5 text-[11px] text-red-500">Something went wrong — try again.</p>}
        </div>
      )}
    </div>
  );
}

function PickCard({ pick, timeLeft }) {
  const status = matchStatus(pick.kickoff);

  if (status === "finished") {
    const result = pick.result;
    const hasScore = result?.scoreStr;
    const won = result?.won;
    return (
      <div className="overflow-hidden rounded-2xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(12px)" }}>
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-2.5">
            <span className={`h-2 w-2 rounded-full ${won === true ? "bg-ev" : won === false ? "bg-neg" : "bg-white/30"}`} />
            <span className="text-xs font-bold uppercase tracking-widest text-white">
              {won === true ? "Match Finished · Bet Won" : won === false ? "Match Finished · Bet Lost" : "Match Finished"}
            </span>
          </div>
          <span className="font-mono text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>{pick.league} · {formatKickoff(pick.kickoff)}</span>
        </div>
        <div className="grid sm:grid-cols-[1fr_auto]">
          <div className="p-6 sm:p-8">
            <p className="font-display text-3xl font-black text-white sm:text-4xl leading-tight">{pick.match}</p>
            <p className="mt-2 text-sm font-semibold" style={{ color: "rgba(245,158,11,0.9)" }}>{pick.label}</p>
            {hasScore ? (
              <div className="mt-6 inline-flex items-center gap-3 rounded-xl px-5 py-3" style={{
                background: won === true ? "rgba(16,185,129,0.08)" : won === false ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.05)",
                border: won === true ? "1px solid rgba(16,185,129,0.3)" : won === false ? "1px solid rgba(239,68,68,0.25)" : "1px solid rgba(255,255,255,0.1)"
              }}>
                <span className="font-mono text-2xl font-black text-white">{result.scoreStr}</span>
              </div>
            ) : (
              <p className="mt-4 text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>Score not yet available — check back shortly.</p>
            )}
          </div>
          <div className="flex flex-col items-center justify-center gap-4 px-8 py-8 sm:border-l" style={{ borderTop: "1px solid rgba(255,255,255,0.07)", borderColor: "rgba(255,255,255,0.07)", background: won === true ? "rgba(16,185,129,0.05)" : won === false ? "rgba(239,68,68,0.05)" : "rgba(255,255,255,0.02)" }}>
            <div className="text-center">
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>Our Pick</p>
              <p className="mt-1 font-display font-black leading-none" style={{ fontSize: "clamp(3rem,8vw,5rem)", color: won === true ? "#10B981" : won === false ? "#EF4444" : "rgba(255,255,255,0.4)", textShadow: won === true ? "0 0 40px rgba(16,185,129,0.4)" : won === false ? "0 0 40px rgba(239,68,68,0.3)" : "none" }}>
                {won === true ? "WIN" : won === false ? "LOSS" : "–"}
              </p>
              <span className="mt-3 inline-flex items-center rounded-full px-3 py-1.5 font-mono text-[11px] font-bold" style={{ border: won === true ? "1px solid rgba(16,185,129,0.3)" : won === false ? "1px solid rgba(239,68,68,0.25)" : "1px solid rgba(255,255,255,0.1)", background: won === true ? "rgba(16,185,129,0.1)" : won === false ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.05)", color: won === true ? "#10B981" : won === false ? "#EF4444" : "rgba(255,255,255,0.4)" }}>
                {won === true ? "+EV Bet Landed ✓" : won === false ? "Variance — move on" : "Result pending"}
              </span>
            </div>
            <p className="text-center text-[11px]" style={{ color: "rgba(255,255,255,0.25)" }}>
              {pick.ev >= 0 ? "+" : ""}{pick.ev}% edge · {pick.trueProb}% true prob
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(12px)" }}>
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center gap-2.5">
          <span className="h-2 w-2 rounded-full bg-ev animate-pulse-dot" />
          <span className="text-xs font-bold uppercase tracking-widest text-white">Today's Free Edge</span>
        </div>
        <div className="flex items-center gap-3">
          {status === "live" ? (
            <span className="rounded-full border border-ev/40 bg-ev/15 px-3 py-1 font-mono text-[10px] font-bold text-ev">LIVE NOW</span>
          ) : (
            <span className="font-mono text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>{pick.league} · {formatKickoff(pick.kickoff)}</span>
          )}
          {timeLeft > 0 && (
            <span className="font-mono text-[10px] px-2.5 py-1 rounded-full" style={{ background: "rgba(245,158,11,0.1)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.2)" }}>
              Next in {formatCountdown(timeLeft)}
            </span>
          )}
        </div>
      </div>
      <div className="grid sm:grid-cols-[1fr_auto]">
        <div className="p-6 sm:p-8">
          <p className="font-display text-3xl font-black text-white sm:text-4xl leading-tight">{pick.match}</p>
          <p className="mt-2 text-sm font-semibold" style={{ color: "rgba(245,158,11,0.9)" }}>{pick.label}</p>
          <div className="mt-7 grid grid-cols-3 gap-3">
            {[
              { label: "Bookmaker Odds", value: <OddsValue decimal={pick.decimalOdds} />, sub: pick.bookmaker },
              { label: "Implied Prob",   value: `${pick.impliedProb}%`, sub: "book implied" },
              { label: "True Probability", value: `${pick.trueProb}%`, sub: "AI consensus" },
            ].map(({ label, value, sub }) => (
              <div key={label} className="rounded-xl px-4 py-3.5" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <p className="font-mono text-[9px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>{label}</p>
                <p className="mt-1.5 font-mono text-base font-bold text-white">{value}</p>
                <p className="mt-0.5 text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{sub}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center justify-center gap-5 px-8 py-8 sm:border-l" style={{ borderTop: "1px solid rgba(255,255,255,0.07)", borderColor: "rgba(255,255,255,0.07)", background: "rgba(16,185,129,0.04)" }}>
          <div className="text-center">
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(16,185,129,0.6)" }}>AI Edge</p>
            <p className="mt-1 font-display font-black leading-none" style={{ fontSize: "clamp(3rem,8vw,5rem)", color: "#10B981", textShadow: "0 0 40px rgba(16,185,129,0.4)" }}>
              {pick.ev >= 0 ? "+" : ""}{pick.ev}%
            </p>
            <span className="mt-3 inline-flex items-center rounded-full border border-ev/30 bg-ev/10 px-3 py-1.5 font-mono text-[11px] font-bold text-ev">
              +EV Edge Detected
            </span>
          </div>
          <TrackBetButton pick={pick} />
        </div>
      </div>
      <div className="px-6 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.25)" }}>
          Edge calculated by comparing de-vigged probability against best available book price.
        </p>
      </div>
    </div>
  );
}

function LockedCard({ livePick, onUnlock }) {
  return (
    <div className="relative overflow-hidden rounded-2xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(12px)" }}>
      {/* Blurred ghost preview */}
      <div aria-hidden="true" style={{ filter: "blur(8px)", opacity: 0.35, pointerEvents: "none", userSelect: "none" }}>
        <div className="flex items-center gap-2.5 px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <span className="h-2 w-2 rounded-full bg-ev" />
          <span className="text-xs font-bold uppercase tracking-widest text-white">Today's Free Edge</span>
        </div>
        <div className="grid sm:grid-cols-[1fr_auto]">
          <div className="p-6 sm:p-8">
            <p className="font-display text-3xl font-black text-white sm:text-4xl">████████ vs ████████</p>
            <p className="mt-2 text-sm font-semibold" style={{ color: "rgba(245,158,11,0.9)" }}>Over 2.5 Goals (Total)</p>
            <div className="mt-7 grid grid-cols-3 gap-3">
              {["2.10", "47.6%", "53.2%"].map((v, i) => (
                <div key={i} className="rounded-xl px-4 py-3.5" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <p className="font-mono text-base font-bold text-white">{v}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-center justify-center gap-4 px-8 py-8">
            <p className="font-display font-black" style={{ fontSize: "4rem", color: "#10B981" }}>+8.4%</p>
          </div>
        </div>
      </div>

      {/* Lock overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-6 text-center"
        style={{ background: "linear-gradient(to bottom, rgba(6,13,26,0.5) 0%, rgba(6,13,26,0.85) 100%)" }}>
        <div>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full" style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)" }}>
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: "#F59E0B" }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-xl font-black text-white">Today's Free Bet</h3>
          <p className="mt-1.5 text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
            Reveal today's highest +EV edge.<br />Locked for 24 hours — the same pick, no matter what.
          </p>
        </div>
        <button
          onClick={() => livePick && onUnlock()}
          disabled={!livePick}
          className="cursor-pointer rounded-xl px-8 py-3.5 text-sm font-bold text-white transition-all hover:brightness-110 disabled:opacity-40"
          style={{ background: "linear-gradient(135deg,#F59E0B,#D97706)", boxShadow: "0 4px 20px rgba(245,158,11,0.35)" }}>
          {livePick ? "Reveal Today's Free Bet" : "Loading…"}
        </button>
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>Free forever · No account required</p>
      </div>
    </div>
  );
}

export default function FreeBetCard({ pick: livePick, loading }) {
  const [stored, setStored] = useState(() => getStoredPick());
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!stored?.unlockedAt) return;
    const tick = () => {
      const elapsed = Date.now() - new Date(stored.unlockedAt).getTime();
      const remaining = Math.max(0, LOCK_DURATION - elapsed);
      setTimeLeft(remaining);
      if (remaining === 0) setStored(null);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [stored?.unlockedAt]);

  if (loading) {
    return <div className="h-64 animate-pulse rounded-2xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }} />;
  }

  const isUnlocked = stored && timeLeft > 0;

  if (!isUnlocked) {
    return (
      <LockedCard
        livePick={livePick}
        onUnlock={() => {
          if (!livePick) return;
          const data = { pick: livePick, unlockedAt: new Date().toISOString() };
          localStorage.setItem(LOCK_KEY, JSON.stringify(data));
          setStored(data);
        }}
      />
    );
  }

  // Use stored pick but merge in live result data if eventId matches
  const displayPick = livePick?.eventId === stored.pick.eventId && livePick?.result
    ? { ...stored.pick, result: livePick.result }
    : stored.pick;

  return <PickCard pick={displayPick} timeLeft={timeLeft} />;
}
