import { IconLock, IconBolt } from "./Icons";
import OddsValue from "./OddsValue";

function formatKickoff(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function BlurredBetRow({ bet }) {
  return (
    <div className="grid grid-cols-[1.6fr_0.7fr_0.7fr] items-center gap-3 rounded px-3 py-2 text-left hover:bg-base-surface2 transition-colors">
      <span className="select-none truncate text-sm text-base-text/80 blur-[6px]">{bet.label}</span>
      <span className="select-none font-mono text-sm text-base-text/80 blur-[6px]">
        <OddsValue decimal={bet.decimalOdds} />
      </span>
      <span className="select-none font-mono text-sm font-semibold text-ev blur-[6px]">
        +{bet.ev}%
      </span>
    </div>
  );
}

function MatchBlock({ match }) {
  return (
    <div className="border-b border-base-border/50 last:border-0 px-2 py-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2 px-1 mb-1">
        <span className="select-none truncate text-sm font-semibold text-base-text/80 blur-[5px]">
          {match.match}
        </span>
        <span className="text-[11px] text-base-muted shrink-0">{formatKickoff(match.kickoff)}</span>
      </div>
      <div className="space-y-0.5">
        {match.bets.map((bet, i) => (
          <BlurredBetRow key={i} bet={bet} />
        ))}
      </div>
    </div>
  );
}

function LeagueGroup({ league }) {
  return (
    <div>
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-base-border/50">
        <div className="h-px flex-1 bg-base-border/50" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-base-muted px-2">
          {league.league}
        </span>
        <div className="h-px flex-1 bg-base-border/50" />
      </div>
      <div>
        {league.matches.map((match) => (
          <MatchBlock key={match.match} match={match} />
        ))}
      </div>
    </div>
  );
}

export default function ProLockedBoard({ proBoard, onUnlock, loading }) {
  if (loading) {
    return <div className="h-80 animate-pulse rounded border border-base-border bg-base-surface" />;
  }

  const totalMatches = (proBoard ?? []).reduce((sum, l) => sum + l.matches.length, 0);

  return (
    <div className="relative overflow-hidden rounded border border-base-border bg-base-surface shadow-card">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-base-border bg-base-surface2/60 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded bg-pro/10 ring-1 ring-pro/20">
            <IconBolt className="w-3.5 h-3.5 text-pro" />
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-pro">Pro Board</p>
            <p className="text-xs text-base-muted">{totalMatches} matches &middot; 3 edges each</p>
          </div>
        </div>
        <div className="hidden sm:grid grid-cols-3 gap-6 text-[10px] uppercase tracking-wider text-base-muted pr-2">
          <span className="pl-3">Selection</span>
          <span>Odds</span>
          <span>EV%</span>
        </div>
      </div>

      {/* Blurred content */}
      <div className="relative max-h-[500px] overflow-hidden">
        <div aria-hidden="true">
          {(proBoard ?? []).map((league) => (
            <LeagueGroup key={league.league} league={league} />
          ))}
        </div>

        {/* Fade overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-base-surface via-base-surface/80 to-transparent" />

        {/* Lock CTA */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="rounded border border-base-border bg-base-surface/95 px-8 py-7 shadow-panel backdrop-blur-sm">
            <span className="flex h-12 w-12 items-center justify-center rounded bg-pro/10 ring-1 ring-pro/25 mx-auto">
              <IconLock className="w-5 h-5 text-pro" />
            </span>
            <p className="mt-4 text-sm font-bold text-base-text">
              {totalMatches} matches across every major league &amp; cup
            </p>
            <p className="mt-1.5 max-w-xs text-xs text-base-muted">
              3 calculated +EV bets per match — Match Result, Totals &amp; Asian Handicap.
            </p>
            <button
              onClick={onUnlock}
              className="mt-5 cursor-pointer rounded bg-pro px-6 py-2.5 text-sm font-semibold text-base-bg shadow-[0_0_24px_rgba(129,140,248,0.3)] transition-all duration-200 hover:brightness-110"
            >
              Unlock Pro — $20/mo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
