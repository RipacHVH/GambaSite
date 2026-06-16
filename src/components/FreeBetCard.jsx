import { IconBolt, IconTarget } from "./Icons";
import OddsValue from "./OddsValue";

function formatKickoff(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  return date.toLocaleString(undefined, {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function FreeBetCard({ pick, loading }) {
  if (loading) {
    return (
      <div className="h-64 animate-pulse rounded-2xl border border-base-border bg-base-surface" />
    );
  }

  if (!pick) {
    return (
      <div className="rounded-2xl border border-base-border bg-base-surface p-8 text-center text-sm text-base-muted">
        No qualifying +EV match found right now — check back shortly.
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-ev/30 bg-base-surface shadow-ev-glow">
      <div className="absolute -top-20 -left-20 h-48 w-48 rounded-full bg-ev/20 blur-3xl pointer-events-none" />

      <div className="relative flex flex-wrap items-center justify-between gap-3 border-b border-base-border px-6 py-4">
        <span className="inline-flex items-center gap-2 rounded-full bg-ev/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-ev">
          <IconBolt className="w-3.5 h-3.5" />
          Free Pick of the Day
        </span>
        <span className="text-xs text-base-muted">
          {pick.league} &middot; {formatKickoff(pick.kickoff)}
        </span>
      </div>

      <div className="relative grid gap-6 px-6 py-6 sm:grid-cols-[1fr_auto] sm:items-center sm:px-8">
        <div>
          <p className="text-xl font-bold text-base-text sm:text-2xl">{pick.match}</p>
          <p className="mt-1 text-sm text-base-muted">{pick.label}</p>

          <div className="mt-5 grid grid-cols-3 gap-4 sm:max-w-md">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-base-muted">Book Odds</p>
              <p className="mt-1 font-mono text-sm font-semibold text-base-text">
                <OddsValue decimal={pick.decimalOdds} />
              </p>
              <p className="text-[11px] text-base-muted">{pick.bookmaker}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-base-muted">Implied Prob.</p>
              <p className="mt-1 font-mono text-sm font-semibold text-base-text">{pick.impliedProb}%</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-base-muted">Consensus Fair Prob.</p>
              <p className="mt-1 font-mono text-sm font-semibold text-ev">{pick.trueProb}%</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-start gap-3 sm:items-end">
          <div className="flex flex-col items-start sm:items-end">
            <span className="text-[11px] uppercase tracking-wide text-base-muted">Calculated EV</span>
            <span className="font-mono text-4xl font-extrabold text-ev sm:text-5xl">
              {pick.ev >= 0 ? "+" : ""}
              {pick.ev}%
            </span>
          </div>
          <button className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-ev px-4 py-2.5 text-sm font-semibold text-base-bg transition-transform duration-200 hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ev">
            <IconTarget className="w-4 h-4" />
            Track This Bet
          </button>
        </div>
      </div>
    </div>
  );
}
