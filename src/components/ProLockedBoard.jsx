import { IconLock } from "./Icons";
import OddsValue from "./OddsValue";

function formatKickoff(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" });
}

function BlurredRow({ bet, index }) {
  return (
    <div className={`grid grid-cols-[2.2fr_1fr_1fr_0.8fr_0.9fr] items-center gap-3 px-5 py-3 border-b border-base-border last:border-0 ${index % 2 === 0 ? "bg-white" : "bg-base-surface2/30"}`}>
      <span className="select-none truncate text-sm font-medium text-base-text blur-[6px]">{bet.label}</span>
      <span className="select-none font-mono text-xs text-base-muted blur-[5px]">{bet.bookmaker}</span>
      <span className="select-none font-mono text-sm font-semibold text-blue-deep blur-[5px]">
        <OddsValue decimal={bet.decimalOdds} />
      </span>
      <span className="select-none font-mono text-xs text-base-muted blur-[5px]">62.4%</span>
      <span className="select-none">
        <span className="inline-flex rounded-full bg-ev/10 border border-ev/20 px-2.5 py-1 font-mono text-xs font-bold text-ev blur-[5px]">
          +{bet.ev}%
        </span>
      </span>
    </div>
  );
}

function MatchSection({ match }) {
  return (
    <div className="border-b border-base-border last:border-0">
      <div className="flex items-center justify-between bg-blue-light/40 px-5 py-2.5 border-b border-blue-border/40">
        <span className="select-none text-sm font-bold text-blue-deep blur-[5px]">{match.match}</span>
        <span className="font-mono text-[10px] text-base-muted shrink-0 ml-3">{formatKickoff(match.kickoff)}</span>
      </div>
      {match.bets.map((bet, i) => <BlurredRow key={i} bet={bet} index={i} />)}
    </div>
  );
}

function LeagueSection({ league }) {
  return (
    <div className="border-b border-base-border last:border-0">
      <div className="flex items-center gap-3 border-b border-base-border bg-base-surface2 px-5 py-2">
        <span className="font-mono text-[9px] font-black uppercase tracking-[0.18em] text-blue-royal">{league.league}</span>
        <span className="text-[10px] text-base-muted">· {league.matches.length} match{league.matches.length !== 1 ? "es" : ""}</span>
      </div>
      {league.matches.map((m) => <MatchSection key={m.match} match={m} />)}
    </div>
  );
}

export default function ProLockedBoard({ proBoard, onUnlock, loading }) {
  if (loading) {
    return <div className="h-96 animate-pulse rounded-xl border border-base-border bg-base-surface2" />;
  }

  const totalMatches = (proBoard ?? []).reduce((s, l) => s + l.matches.length, 0);
  const totalEdges   = totalMatches * 3;

  return (
    <div className="overflow-hidden rounded-xl border border-base-border bg-white shadow-strong">
      {/* Header */}
      <div className="border-b border-base-border bg-white px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-base-muted">Premium Ledger</p>
            <p className="mt-0.5 text-lg font-black text-blue-deep">{totalEdges} Active +EV Edges Today</p>
          </div>
          <span className="rounded-full border border-base-border bg-base-surface2 px-4 py-1.5 text-xs font-semibold text-base-muted">
            {totalMatches} matches across all leagues
          </span>
        </div>
      </div>

      {/* Column headers */}
      <div className="border-b border-base-border bg-base-surface2 px-5 py-2.5">
        <div className="grid grid-cols-[2.2fr_1fr_1fr_0.8fr_0.9fr] gap-3 items-center">
          {["Selection / Prop", "Book", "Odds", "True Prob", "EV Edge"].map((h, i) => (
            <span key={h} className={`font-mono text-[9px] font-bold uppercase tracking-widest ${i === 4 ? "text-ev" : "text-base-muted"}`}>
              {h}
            </span>
          ))}
        </div>
      </div>

      {/* Blurred rows with frosted overlay */}
      <div className="relative max-h-[500px] overflow-hidden">
        <div aria-hidden="true">
          {(proBoard ?? []).map((league) => (
            <LeagueSection key={league.league} league={league} />
          ))}
        </div>

        {/* Frosted glass fade */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-white via-white/85 to-transparent" />

        {/* Upgrade overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="w-full max-w-md rounded-2xl border border-base-border bg-white/95 p-8 shadow-strong backdrop-blur-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-light mx-auto">
              <IconLock className="w-6 h-6 text-blue-royal" />
            </div>

            <h3 className="mt-5 text-xl font-black text-blue-deep">
              Unlock {totalEdges} Active +EV Edges
            </h3>
            <p className="mt-2 text-sm text-base-muted">
              {totalMatches} matches · 3 mathematically verified bets each · All major leagues &amp; cups
            </p>

            <div className="mt-5 flex items-baseline justify-center gap-1">
              <span className="font-mono text-4xl font-black text-blue-deep">$20</span>
              <span className="text-sm text-base-muted">/month</span>
            </div>

            <button
              onClick={onUnlock}
              className="mt-4 w-full cursor-pointer rounded-lg bg-blue-royal py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-900/20 transition-all hover:bg-blue-deep"
            >
              Unlock All Edges — $20/mo
            </button>
            <p className="mt-3 text-[11px] text-base-muted">7-day money-back guarantee · Cancel anytime</p>
          </div>
        </div>
      </div>
    </div>
  );
}
