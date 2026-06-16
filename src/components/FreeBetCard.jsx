import { IconTarget } from "./Icons";
import OddsValue from "./OddsValue";

function formatKickoff(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

function DataCell({ label, value, accent }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-base-muted">{label}</span>
      <span className={`font-mono text-sm font-bold ${accent ? "text-ev" : "text-base-text"}`}>{value}</span>
    </div>
  );
}

export default function FreeBetCard({ pick, loading }) {
  if (loading) {
    return <div className="h-56 animate-pulse rounded-sm border border-base-border bg-base-surface" />;
  }
  if (!pick) {
    return (
      <div className="rounded-sm border border-base-border bg-base-surface p-8 text-center text-sm text-base-muted">
        No qualifying +EV match found right now — check back shortly.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-sm border border-base-border bg-base-surface shadow-panel">
      {/* Thick left accent bar */}
      <div className="flex">
        <div className="w-1 shrink-0 bg-ev" />

        <div className="flex-1">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-base-border bg-base-surface2/60 px-5 py-3">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-ev animate-pulse-dot" />
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-ev">Daily Signal</span>
              </span>
              <span className="hidden sm:block h-3 w-px bg-base-border" />
              <span className="hidden sm:block font-mono text-[10px] uppercase tracking-widest text-base-muted">{pick.league}</span>
            </div>
            <span className="font-mono text-[10px] text-base-muted">{formatKickoff(pick.kickoff)}</span>
          </div>

          {/* Match title */}
          <div className="border-b border-base-border px-5 py-4">
            <p className="text-lg font-bold text-base-text sm:text-2xl">{pick.match}</p>
            <p className="mt-1 font-mono text-xs text-ev/80">{pick.label}</p>
          </div>

          {/* Data grid */}
          <div className="grid grid-cols-2 gap-px bg-base-border sm:grid-cols-4">
            {[
              { label: "Book Odds",    value: <OddsValue decimal={pick.decimalOdds} />, accent: false },
              { label: "Via",         value: pick.bookmaker,    accent: false },
              { label: "Book Implied",value: `${pick.impliedProb}%`, accent: false },
              { label: "Fair Prob.",  value: `${pick.trueProb}%`,    accent: true  },
            ].map(({ label, value, accent }) => (
              <div key={label} className="bg-base-surface px-5 py-4">
                <DataCell label={label} value={value} accent={accent} />
              </div>
            ))}
          </div>

          {/* EV footer */}
          <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 bg-ev/5">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-base-muted">Calculated Expected Value</p>
              <p className="mt-1 font-mono text-4xl font-extrabold text-ev sm:text-5xl leading-none">
                {pick.ev >= 0 ? "+" : ""}{pick.ev}%
              </p>
            </div>
            <button className="inline-flex cursor-pointer items-center gap-2 rounded-sm bg-ev px-5 py-3 text-sm font-bold text-base-bg shadow-ev-glow transition-all hover:brightness-110">
              <IconTarget className="w-4 h-4" />
              Track This Bet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
