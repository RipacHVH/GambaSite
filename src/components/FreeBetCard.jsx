import { useState } from "react";
import { IconTarget } from "./Icons";
import OddsValue from "./OddsValue";
import { useAuth, API_URL } from "../context/AuthContext";

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
  // Assume a football match lasts ~105 min (90 + stoppage)
  if (now < kickoff + 105 * 60 * 1000) return "live";
  return "finished";
}

function TrackBetButton({ pick }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(user?.email ?? "");
  const [state, setState] = useState("idle"); // idle | loading | done | error

  async function submit() {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    setState("loading");
    try {
      await fetch(`${API_URL}/api/track-pick`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          eventId: pick.eventId,
          match: pick.match,
          league: pick.league,
          label: pick.label,
          ev: pick.ev,
          decimalOdds: pick.decimalOdds,
          kickoff: pick.kickoff,
        }),
      });
      setState("done");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className="w-full rounded-lg px-4 py-3 text-center text-xs font-semibold"
        style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", color: "#10B981" }}>
        ✓ We'll email you the result
      </div>
    );
  }

  return (
    <div className="w-full">
      <button
        onClick={() => setOpen(v => !v)}
        className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all"
        style={{ background: "rgba(15,23,42,0.07)", border: "1px solid rgba(15,23,42,0.12)", color: "#64748B" }}
        onMouseEnter={e => e.currentTarget.style.background = "rgba(15,23,42,0.12)"}
        onMouseLeave={e => e.currentTarget.style.background = "rgba(15,23,42,0.07)"}>
        <IconTarget className="w-3.5 h-3.5" />
        Track This Bet
      </button>

      {open && (
        <div className="mt-2 rounded-lg p-3" style={{ background: "rgba(15,23,42,0.05)", border: "1px solid rgba(15,23,42,0.1)" }}>
          <p className="text-[11px] text-slate-500 mb-2 leading-snug">
            {user ? "We'll email you the final score and result." : "Enter your email - we'll send you the result after the match."}
          </p>
          {!user && (
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="mb-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-slate-400"
            />
          )}
          {user && (
            <p className="mb-2 text-xs font-semibold text-slate-600 truncate">{user.email}</p>
          )}
          <button
            onClick={submit}
            disabled={state === "loading"}
            className="w-full cursor-pointer rounded-md py-2 text-xs font-bold text-white transition-all disabled:opacity-60"
            style={{ background: "linear-gradient(135deg,#F59E0B,#D97706)" }}>
            {state === "loading" ? "Saving…" : "Notify me"}
          </button>
          {state === "error" && <p className="mt-1.5 text-[11px] text-red-500">Something went wrong - try again.</p>}
        </div>
      )}
    </div>
  );
}

export default function FreeBetCard({ pick, loading }) {
  if (loading) {
    return <div className="h-64 animate-pulse rounded-xl border border-base-border bg-base-surface2" />;
  }
  if (!pick) {
    return (
      <div className="rounded-xl border border-base-border bg-white p-10 text-center shadow-card">
        <p className="text-sm font-semibold text-base-muted">No qualifying +EV match found right now - check back shortly.</p>
      </div>
    );
  }

  const status = matchStatus(pick.kickoff);

  if (status === "finished") {
    const result = pick.result;
    const hasScore = result?.scoreStr;
    const won = result?.won;

    return (
      <div className="overflow-hidden rounded-xl border border-base-border bg-white shadow-strong">
        {/* Header */}
        <div className={`flex flex-wrap items-center justify-between gap-3 border-b border-base-border px-6 py-4 ${
          won === true ? "bg-ev/10" : won === false ? "bg-neg/10" : "bg-base-surface2/60"
        }`}>
          <span className={`rounded-full px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest ${
            won === true ? "bg-ev/20 text-ev" : won === false ? "bg-neg/20 text-neg" : "bg-base-muted/10 text-base-muted"
          }`}>
            {won === true ? "✓ Match Finished - Bet Won" : won === false ? "✗ Match Finished - Bet Lost" : "⏱ Match Finished"}
          </span>
          <span className="font-mono text-[10px] text-base-muted">{pick.league} · {formatKickoff(pick.kickoff)}</span>
        </div>

        <div className="grid gap-0 sm:grid-cols-[1fr_auto]">
          <div className="p-6 sm:p-7">
            <p className="text-2xl font-black text-blue-deep sm:text-3xl">{pick.match}</p>
            <p className="mt-1 text-sm font-semibold text-blue-royal">{pick.label}</p>

            {hasScore && (
              <div className={`mt-5 inline-flex items-center gap-3 rounded-xl border px-5 py-3 ${
                won === true ? "border-ev/30 bg-ev/5" : won === false ? "border-neg/20 bg-neg/5" : "border-base-border bg-base-surface2"
              }`}>
                <span className="font-mono text-2xl font-black text-blue-deep">{result.scoreStr}</span>
              </div>
            )}

            {!hasScore && (
              <p className="mt-4 text-sm text-base-muted">Score not yet available - check back shortly.</p>
            )}
          </div>

          {/* Result panel */}
          <div className={`flex flex-col items-center justify-center gap-3 border-t border-base-border px-8 py-6 sm:border-l sm:border-t-0 ${
            won === true ? "bg-ev/5" : won === false ? "bg-neg/10" : "bg-base-surface2/40"
          }`}>
            <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-base-muted">Our Pick</p>
            <p className={`font-mono text-5xl font-black leading-none ${
              won === true ? "text-ev" : won === false ? "text-neg" : "text-blue-deep"
            }`}>
              {won === true ? "WIN" : won === false ? "LOSS" : "–"}
            </p>
            <span className={`inline-flex items-center rounded-full border px-3 py-1 font-mono text-xs font-bold ${
              won === true ? "border-ev/30 bg-ev/10 text-ev"
              : won === false ? "border-neg/20 bg-neg/10 text-neg"
              : "border-base-border bg-base-surface2 text-base-muted"
            }`}>
              {won === true ? "+EV Bet Landed ✓" : won === false ? "Variance - move on" : "Result pending"}
            </span>
            <p className="text-center text-[11px] text-base-muted">
              {pick.ev >= 0 ? "+" : ""}{pick.ev}% edge · {pick.trueProb}% true prob
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-base-border bg-white shadow-strong">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-base-border px-6 py-4" style={{ background: "linear-gradient(135deg, #060D1A 0%, #0D1F3C 60%, #091628 100%)" }}>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-white/20 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-white">
            Free Calculated Edge of the Day
          </span>
        </div>
        <div className="flex items-center gap-2">
          {status === "live" ? (
            <>
              <span className="h-2 w-2 rounded-full bg-ev animate-pulse-dot" />
              <span className="font-mono text-[10px] font-bold text-ev">LIVE NOW</span>
            </>
          ) : (
            <>
              <span className="h-2 w-2 rounded-full bg-ev animate-pulse-dot" />
              <span className="font-mono text-[10px] text-blue-200">{pick.league} · {formatKickoff(pick.kickoff)}</span>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-0 sm:grid-cols-[1fr_auto]">
        {/* Main data */}
        <div className="p-6 sm:p-7">
          <p className="text-2xl font-black text-blue-deep sm:text-3xl">{pick.match}</p>
          <p className="mt-1.5 text-sm font-semibold text-blue-royal">{pick.label}</p>

          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              { label: "Bookmaker Odds",    value: <OddsValue decimal={pick.decimalOdds} />, sub: pick.bookmaker },
              { label: "Book Implied Prob", value: `${pick.impliedProb}%`,                   sub: "implied"      },
              { label: "True Probability",  value: `${pick.trueProb}%`,                       sub: "AI consensus" },
            ].map(({ label, value, sub }) => (
              <div key={label} className="rounded-lg border border-base-border bg-base-surface2/50 px-4 py-3.5">
                <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-base-muted">{label}</p>
                <p className="mt-1.5 font-mono text-base font-bold text-blue-deep">{value}</p>
                <p className="mt-0.5 text-[10px] text-base-muted">{sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* EV badge panel */}
        <div className="flex flex-col items-center justify-center gap-4 border-t border-base-border bg-ev/5 px-8 py-6 sm:border-l sm:border-t-0">
          <div className="text-center">
            <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-ev/70">AI Edge</p>
            <p className="mt-1 font-mono text-5xl font-black text-ev leading-none">
              {pick.ev >= 0 ? "+" : ""}{pick.ev}%
            </p>
            <span className="mt-2 inline-flex items-center rounded-full border border-ev/30 bg-ev/10 px-3 py-1 font-mono text-xs font-bold text-ev">
              +EV Edge Detected
            </span>
          </div>
          <TrackBetButton pick={pick} />
        </div>
      </div>

      <div className="border-t border-base-border bg-base-surface2/40 px-6 py-3">
        <p className="text-[11px] text-base-muted">
          Edge calculated by comparing AI consensus de-vigged probability against best available book price. Positive EV means the true probability exceeds the book's implied probability.
        </p>
      </div>
    </div>
  );
}
