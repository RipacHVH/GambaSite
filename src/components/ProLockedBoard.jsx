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
    <div className="grid grid-cols-[1.6fr_0.7fr_0.7fr] items-center gap-3 rounded-md px-3 py-2 text-left">
      <span className="select-none truncate text-sm text-base-text/90 blur-[6px]">{bet.label}</span>
      <span className="select-none truncate font-mono text-sm text-base-text/90 blur-[6px]">
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
    <button type="button" className="w-full cursor-pointer rounded-lg p-3 text-left transition-colors duration-200 hover:bg-base-surface2">
      <div className="flex flex-wrap items-baseline justify-between gap-2 px-1">
        <span className="select-none truncate text-sm font-semibold text-base-text/90 blur-[5px]">
          {match.match}
        </span>
        <span className="text-[11px] text-base-muted">{formatKickoff(match.kickoff)}</span>
      </div>
      <div className="mt-1 space-y-0.5">
        {match.bets.map((bet, i) => (
          <BlurredBetRow key={i} bet={bet} />
        ))}
      </div>
    </button>
  );
}

function LeagueGroup({ league, onUnlock }) {
  return (
    <div className="border-b border-base-border last:border-b-0">
      <div className="px-4 pt-4 pb-1 text-[11px] font-bold uppercase tracking-wide text-base-muted">
        {league.league}
      </div>
      <div className="space-y-1 px-1 pb-2" onClick={onUnlock}>
        {league.matches.map((match) => (
          <MatchBlock key={match.match} match={match} />
        ))}
      </div>
    </div>
  );
}

export default function ProLockedBoard({ proBoard, onUnlock, loading }) {
  if (loading) {
    return <div className="h-80 animate-pulse rounded-2xl border border-base-border bg-base-surface" />;
  }

  const totalMatches = (proBoard ?? []).reduce((sum, l) => sum + l.matches.length, 0);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-base-border bg-base-surface shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-base-border px-6 py-4">
        <span className="inline-flex items-center gap-2 rounded-full bg-pro/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-pro">
          <IconBolt className="w-3.5 h-3.5" />
          Pro Board &mdash; {totalMatches} Matches &middot; 3 Bets Each
        </span>
        <span className="text-xs text-base-muted">All major leagues &amp; cups</span>
      </div>

      <div className="relative max-h-[520px] overflow-hidden">
        <div aria-hidden="true">
          {(proBoard ?? []).map((league) => (
            <LeagueGroup key={league.league} league={league} onUnlock={onUnlock} />
          ))}
        </div>

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-base-surface via-base-surface/75 to-transparent" />

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-pro/15 text-pro">
            <IconLock className="w-5 h-5" />
          </span>
          <p className="text-sm font-semibold text-base-text">
            {totalMatches} matches across every major league &amp; cup
          </p>
          <p className="max-w-xs text-xs text-base-muted">
            3 calculated +EV bets per match &mdash; Match Result, Totals &amp; Asian Handicap. Unlock for
            $20/month.
          </p>
          <button
            onClick={onUnlock}
            className="mt-1 cursor-pointer rounded-lg bg-pro px-5 py-2.5 text-sm font-semibold text-base-bg shadow-[0_0_24px_rgba(167,139,250,0.35)] transition-transform duration-200 hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pro"
          >
            Unlock Pro
          </button>
        </div>
      </div>
    </div>
  );
}
