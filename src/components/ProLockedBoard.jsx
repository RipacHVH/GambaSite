import { IconLock } from "./Icons";
import OddsValue from "./OddsValue";

function formatKickoff(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" });
}

function BlurredRow({ bet, index }) {
  return (
    <div className={`grid grid-cols-[2fr_0.9fr_0.9fr_0.7fr] items-center gap-2 px-5 py-2.5 border-b border-base-border/50 last:border-0 ${index % 2 === 0 ? "bg-white" : "bg-base-surface2/30"}`}>
      <span className="select-none truncate text-sm text-base-text/80 blur-[5px]">{bet.label}</span>
      <span className="select-none font-mono text-xs text-base-muted blur-[5px]">{bet.bookmaker}</span>
      <span className="select-none font-mono text-sm font-semibold text-base-text blur-[5px]">
        <OddsValue decimal={bet.decimalOdds} />
      </span>
      <span className="select-none font-mono text-sm font-bold text-ev blur-[5px]">+{bet.ev}%</span>
    </div>
  );
}

function MatchSection({ match }) {
  return (
    <div className="border-b border-base-border last:border-0">
      <div className="flex items-center justify-between bg-base-surface2/50 px-5 py-2.5 border-b border-base-border/50">
        <span className="select-none text-sm font-semibold text-base-text/80 blur-[4px]">{match.match}</span>
        <span className="font-mono text-[10px] text-base-muted shrink-0 ml-3">{formatKickoff(match.kickoff)}</span>
      </div>
      {match.bets.map((bet, i) => <BlurredRow key={i} bet={bet} index={i} />)}
    </div>
  );
}

function LeagueSection({ league }) {
  return (
    <div className="border-b border-base-border last:border-0">
      <div className="flex items-center gap-3 border-b border-base-border bg-ev/5 px-5 py-2.5">
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-ev">{league.league}</span>
        <span className="text-[10px] text-base-muted">{league.matches.length} match{league.matches.length !== 1 ? "es" : ""}</span>
      </div>
      {league.matches.map((m) => <MatchSection key={m.match} match={m} />)}
    </div>
  );
}

export default function ProLockedBoard({ proBoard, onUnlock, loading }) {
  if (loading) {
    return <div className="h-96 animate-pulse rounded-lg border border-base-border bg-base-surface" />;
  }

  const totalMatches = (proBoard ?? []).reduce((s, l) => s + l.matches.length, 0);

  return (
    <div className="relative overflow-hidden rounded-lg border border-base-border bg-white shadow-panel">
      {/* Blue top accent */}
      <div className="h-1 bg-ev w-full" />

      {/* Column headers */}
      <div className="border-b border-base-border bg-base-surface2 px-5 py-3">
        <div className="grid grid-cols-[2fr_0.9fr_0.9fr_0.7fr] gap-2 items-center">
          <span className="font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-base-muted">Selection</span>
          <span className="font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-base-muted">Book</span>
          <span className="font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-base-muted">Odds</span>
          <span className="font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-ev">EV%</span>
        </div>
      </div>

      {/* Blurred rows */}
      <div className="relative max-h-[480px] overflow-hidden">
        <div aria-hidden="true">
          {(proBoard ?? []).map((league) => (
            <LeagueSection key={league.league} league={league} />
          ))}
        </div>

        {/* Fade */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-white via-white/70 to-transparent" />

        {/* Lock card */}
        <div className="absolute inset-0 flex items-center justify-center px-6">
          <div className="w-full max-w-sm rounded-lg border border-base-border bg-white p-8 text-center shadow-panel">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-base-surface2 mx-auto mb-4">
              <IconLock className="w-5 h-5 text-base-muted" />
            </div>
            <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-base-muted mb-1">Pro Access Required</p>
            <p className="text-lg font-bold text-base-text">{totalMatches} matches · 3 edges each</p>
            <p className="mt-2 text-sm text-base-muted">
              Match Result, Totals &amp; Asian Handicap across every major league and cup.
            </p>
            <button
              onClick={onUnlock}
              className="mt-6 w-full cursor-pointer rounded-sm bg-ev py-3 text-sm font-bold text-white shadow-ev-glow transition-all hover:brightness-110"
            >
              Unlock Pro — $20/mo
            </button>
            <p className="mt-2 text-[11px] text-base-muted">7-day money-back guarantee · Cancel anytime</p>
          </div>
        </div>
      </div>
    </div>
  );
}
