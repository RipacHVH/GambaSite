import { IconTarget } from "./Icons";
import OddsValue from "./OddsValue";

function formatKickoff(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

export default function FreeBetCard({ pick, loading }) {
  if (loading) {
    return <div className="h-56 animate-pulse rounded-lg border border-base-border bg-base-surface" />;
  }
  if (!pick) {
    return (
      <div className="rounded-lg border border-base-border bg-base-surface p-8 text-center text-sm text-base-muted shadow-card">
        No qualifying +EV match found right now — check back shortly.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-base-border bg-white shadow-panel">
      {/* Blue accent top bar */}
      <div className="h-1 bg-ev w-full" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-base-border bg-base-surface2/50 px-6 py-3.5">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 rounded-full bg-ev/10 border border-ev/20 px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-ev animate-pulse-dot" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-ev">Daily Signal</span>
          </span>
          <span className="text-xs text-base-muted">{pick.league}</span>
        </div>
        <span className="text-xs text-base-muted">{formatKickoff(pick.kickoff)}</span>
      </div>

      <div className="px-6 py-5">
        <p className="text-2xl font-bold text-base-text sm:text-3xl">{pick.match}</p>
        <p className="mt-1.5 text-sm font-medium text-ev">{pick.label}</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-px bg-base-border border-t border-base-border sm:grid-cols-4">
        {[
          { label: "Book Odds",     value: <OddsValue decimal={pick.decimalOdds} />, sub: pick.bookmaker, blue: false },
          { label: "Book Implied",  value: `${pick.impliedProb}%`,                   sub: "implied prob",  blue: false },
          { label: "Fair Prob.",    value: `${pick.trueProb}%`,                       sub: "consensus",     blue: true  },
          { label: "Expected Value",value: `${pick.ev >= 0 ? "+" : ""}${pick.ev}%`,  sub: "mathematical",  blue: true  },
        ].map(({ label, value, sub, blue }) => (
          <div key={label} className={`px-5 py-4 ${blue ? "bg-ev/5" : "bg-white"}`}>
            <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-base-muted">{label}</p>
            <p className={`mt-1.5 font-mono text-xl font-extrabold ${blue ? "text-ev" : "text-base-text"}`}>{value}</p>
            <p className="mt-0.5 text-[10px] text-base-muted">{sub}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="flex items-center justify-between gap-4 border-t border-base-border bg-base-surface2/30 px-6 py-4">
        <p className="text-xs text-base-muted max-w-sm">
          This edge was identified by comparing consensus de-vigged probability against the best available book odds.
        </p>
        <button className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-sm bg-ev px-5 py-2.5 text-sm font-bold text-white shadow-ev-glow transition-all hover:brightness-110">
          <IconTarget className="w-4 h-4" />
          Track This Bet
        </button>
      </div>
    </div>
  );
}
