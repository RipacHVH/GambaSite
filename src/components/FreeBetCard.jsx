import { IconBolt, IconTarget } from "./Icons";
import OddsValue from "./OddsValue";

function formatKickoff(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function FreeBetCard({ pick, loading }) {
  if (loading) {
    return (
      <div className="h-64 animate-pulse rounded border border-base-border bg-base-surface" />
    );
  }

  if (!pick) {
    return (
      <div className="rounded border border-base-border bg-base-surface p-8 text-center text-sm text-base-muted">
        No qualifying +EV match found right now — check back shortly.
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded border border-ev/25 bg-base-surface shadow-ev-glow">
      {/* Subtle top-left glow */}
      <div className="absolute -top-24 -left-24 h-56 w-56 rounded-full bg-ev/10 blur-3xl pointer-events-none" />

      {/* Header row */}
      <div className="relative flex flex-wrap items-center justify-between gap-3 border-b border-base-border px-5 py-3.5">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-ev animate-pulse-dot" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-ev">
            Signal — {pick.league}
          </span>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-base-muted">
          <IconBolt className="w-3 h-3" />
          {formatKickoff(pick.kickoff)}
        </span>
      </div>

      {/* Body */}
      <div className="relative grid gap-6 px-5 py-6 sm:grid-cols-[1fr_auto] sm:items-center sm:px-7">
        <div>
          <p className="text-xl font-bold text-base-text sm:text-2xl">{pick.match}</p>
          <p className="mt-1 text-sm font-medium text-ev/80">{pick.label}</p>

          {/* Data row */}
          <div className="mt-6 grid grid-cols-3 gap-4 sm:max-w-md">
            <div className="rounded border border-base-border bg-base-bg px-3 py-3">
              <p className="text-[10px] uppercase tracking-wider text-base-muted">Book Odds</p>
              <p className="mt-1.5 font-mono text-sm font-bold text-base-text">
                <OddsValue decimal={pick.decimalOdds} />
              </p>
              <p className="mt-0.5 text-[10px] text-base-muted truncate">{pick.bookmaker}</p>
            </div>
            <div className="rounded border border-base-border bg-base-bg px-3 py-3">
              <p className="text-[10px] uppercase tracking-wider text-base-muted">Book Implied</p>
              <p className="mt-1.5 font-mono text-sm font-bold text-base-text">{pick.impliedProb}%</p>
            </div>
            <div className="rounded border border-ev/20 bg-ev/5 px-3 py-3">
              <p className="text-[10px] uppercase tracking-wider text-ev/70">Fair Prob.</p>
              <p className="mt-1.5 font-mono text-sm font-bold text-ev">{pick.trueProb}%</p>
            </div>
          </div>
        </div>

        {/* EV badge */}
        <div className="flex flex-col items-start gap-3 sm:items-end">
          <div className="flex flex-col items-start sm:items-end">
            <span className="text-[10px] uppercase tracking-widest text-base-muted">Expected Value</span>
            <span className="font-mono text-4xl font-extrabold text-ev sm:text-5xl leading-none mt-1">
              {pick.ev >= 0 ? "+" : ""}{pick.ev}%
            </span>
            <span className="mt-1.5 rounded border border-ev/20 bg-ev/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-ev">
              Positive EV
            </span>
          </div>
          <button className="inline-flex cursor-pointer items-center gap-2 rounded bg-ev px-4 py-2.5 text-sm font-semibold text-base-bg shadow-ev-glow transition-all duration-200 hover:brightness-110">
            <IconTarget className="w-4 h-4" />
            Track This Bet
          </button>
        </div>
      </div>
    </div>
  );
}
