import { IconLock } from "./Icons";
import OddsValue from "./OddsValue";

function formatKickoff(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" });
}

function BlurredRow({ bet, index }) {
  return (
    <div className={`grid grid-cols-[2fr_0.9fr_0.9fr_0.7fr] items-center gap-2 px-4 py-2.5 border-b border-base-border/40 last:border-0 ${index % 2 === 0 ? "bg-base-surface" : "bg-base-surface2/30"}`}>
      <span className="select-none truncate font-mono text-xs text-base-text/80 blur-[5px]">{bet.label}</span>
      <span className="select-none font-mono text-xs text-base-muted blur-[5px]">{bet.bookmaker}</span>
      <span className="select-none font-mono text-xs font-semibold text-base-text blur-[5px]">
        <OddsValue decimal={bet.decimalOdds} />
      </span>
      <span className="select-none font-mono text-xs font-bold text-ev blur-[5px]">+{bet.ev}%</span>
    </div>
  );
}

function MatchSection({ match }) {
  return (
    <div className="border-b border-base-border last:border-0">
      <div className="flex items-center justify-between bg-base-surface2/40 px-4 py-2 border-b border-base-border/50">
        <span className="select-none text-xs font-bold text-base-text/80 blur-[4px]">{match.match}</span>
        <span className="font-mono text-[10px] text-base-muted shrink-0 ml-3">{formatKickoff(match.kickoff)}</span>
      </div>
      {match.bets.map((bet, i) => <BlurredRow key={i} bet={bet} index={i} />)}
    </div>
  );
}

function LeagueSection({ league }) {
  return (
    <div className="border-b border-base-border last:border-0">
      <div className="flex items-center gap-3 border-b border-base-border bg-base-surface2 px-4 py-2">
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-ev">{league.league}</span>
        <span className="text-[10px] text-base-muted">{league.matches.length} match{league.matches.length !== 1 ? "es" : ""}</span>
      </div>
      {league.matches.map((m) => <MatchSection key={m.match} match={m} />)}
    </div>
  );
}

export default function ProLockedBoard({ proBoard, onUnlock, loading }) {
  if (loading) {
    return <div className="h-96 animate-pulse rounded-sm border border-base-border bg-base-surface" />;
  }

  const totalMatches = (proBoard ?? []).reduce((s, l) => s + l.matches.length, 0);

  return (
    <div className="relative overflow-hidden rounded-sm border border-base-border bg-base-surface shadow-panel">
      {/* Column header bar */}
      <div className="border-b border-base-border bg-base-surface2 px-4 py-2.5">
        <div className="grid grid-cols-[2fr_0.9fr_0.9fr_0.7fr] gap-2 items-center">
          <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-base-muted">Selection</span>
          <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-base-muted">Book</span>
          <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-base-muted">Odds</span>
          <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-ev">EV%</span>
        </div>
      </div>

      {/* Blurred screener rows */}
      <div className="relative max-h-[480px] overflow-hidden">
        <div aria-hidden="true">
          {(proBoard ?? []).map((league) => (
            <LeagueSection key={league.league} league={league} />
          ))}
        </div>

        {/* Gradient fade */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-base-surface via-base-surface/70 to-transparent" />

        {/* Lock overlay */}
        <div className="absolute inset-0 flex items-center justify-center px-6">
          <div className="w-full max-w-sm rounded-sm border border-base-border bg-base-surface/95 p-7 text-center shadow-panel backdrop-blur-sm">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px flex-1 bg-base-border" />
              <span className="flex h-9 w-9 items-center justify-center rounded-sm border border-base-border bg-base-surface2">
                <IconLock className="w-4 h-4 text-base-muted" />
              </span>
              <div className="h-px flex-1 bg-base-border" />
            </div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-base-muted mb-1">Pro Access Required</p>
            <p className="text-base font-bold text-base-text">{totalMatches} matches · 3 edges each</p>
            <p className="mt-2 text-xs text-base-muted">
              Match Result, Totals &amp; Asian Handicap across every major league and cup.
            </p>
            <button
              onClick={onUnlock}
              className="mt-5 w-full cursor-pointer rounded-sm bg-ev py-3 text-sm font-bold text-base-bg shadow-ev-glow transition-all hover:brightness-110"
            >
              Unlock Pro — $20/mo
            </button>
            <p className="mt-2 font-mono text-[10px] text-base-muted">Cancel anytime</p>
          </div>
        </div>
      </div>
    </div>
  );
}
