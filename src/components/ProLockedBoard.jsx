import { IconLock, IconCheck } from "./Icons";
import OddsValue from "./OddsValue";

function formatKickoff(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" });
}

// ── Real unlocked row ───────────────────────────────────────
function RealRow({ bet, index }) {
  return (
    <div className={`grid grid-cols-[2.2fr_1fr_1fr_0.8fr_0.9fr] items-center gap-3 px-5 py-3 border-b border-base-border last:border-0 ${index % 2 === 0 ? "bg-white" : "bg-base-surface2/30"}`}>
      <span className="truncate text-sm font-medium text-base-text">{bet.label}</span>
      <span className="font-mono text-xs text-base-muted">{bet.bookmaker}</span>
      <span className="font-mono text-sm font-semibold text-blue-deep">
        <OddsValue decimal={bet.decimalOdds} />
      </span>
      <span className="font-mono text-xs text-base-muted">{bet.trueProb ?? "–"}%</span>
      <span>
        <span className="inline-flex rounded-full bg-ev/10 border border-ev/20 px-2.5 py-1 font-mono text-xs font-bold text-ev">
          +{bet.ev}%
        </span>
      </span>
    </div>
  );
}

// ── Blurred locked row (placeholder) ───────────────────────
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

function MatchSection({ match, unlocked }) {
  const RowComp = unlocked ? RealRow : BlurredRow;
  return (
    <div className="border-b border-base-border last:border-0">
      <div className="flex items-center justify-between bg-blue-light/40 px-5 py-2.5 border-b border-blue-border/40">
        <span className={`text-sm font-bold text-blue-deep ${unlocked ? "" : "blur-[5px] select-none"}`}>{match.match}</span>
        <span className="font-mono text-[10px] text-base-muted shrink-0 ml-3">{formatKickoff(match.kickoff)}</span>
      </div>
      {match.bets.map((bet, i) => <RowComp key={i} bet={bet} index={i} />)}
    </div>
  );
}

function LeagueSection({ league, unlocked }) {
  return (
    <div className="border-b border-base-border last:border-0">
      <div className="flex items-center gap-3 border-b border-base-border bg-base-surface2 px-5 py-2">
        <span className="font-mono text-[9px] font-black uppercase tracking-[0.18em] text-blue-royal">{league.league}</span>
        <span className="text-[10px] text-base-muted">· {league.matches.length} match{league.matches.length !== 1 ? "es" : ""}</span>
      </div>
      {league.matches.map((m) => <MatchSection key={m.match} match={m} unlocked={unlocked} />)}
    </div>
  );
}

// ── MOCK data for locked view ───────────────────────────────
const MOCK_BOARD = [
  { league: "Premier League", matches: [
    { match: "Man City vs Liverpool", kickoff: new Date(Date.now() + 7*3600*1000).toISOString(),
      bets: [
        { label: "Man City to Win (Match Result)", bookmaker: "Bet365", decimalOdds: 2.3, ev: 12.9 },
        { label: "Over 3.5 Goals (Total)", bookmaker: "William Hill", decimalOdds: 3.4, ev: 15.6 },
        { label: "Liverpool +1.5 (Asian Handicap)", bookmaker: "Pinnacle", decimalOdds: 1.85, ev: 7.7 },
      ] },
  ] },
  { league: "La Liga", matches: [
    { match: "Real Madrid vs Barcelona", kickoff: new Date(Date.now() + 28*3600*1000).toISOString(),
      bets: [
        { label: "Over 2.5 Goals (Total)", bookmaker: "Pinnacle", decimalOdds: 1.95, ev: 11.9 },
        { label: "Barcelona to Win (Match Result)", bookmaker: "Bet365", decimalOdds: 2.45, ev: 10.0 },
        { label: "Real Madrid -0.5 (Asian Handicap)", bookmaker: "Betfair", decimalOdds: 2.0, ev: 7.6 },
      ] },
  ] },
  { league: "UEFA Champions League", matches: [
    { match: "Bayern Munich vs PSG", kickoff: new Date(Date.now() + 31*3600*1000).toISOString(),
      bets: [
        { label: "Bayern Munich to Win (Match Result)", bookmaker: "William Hill", decimalOdds: 2.2, ev: 12.2 },
        { label: "Over 3.5 Goals (Total)", bookmaker: "Pinnacle", decimalOdds: 3.1, ev: 13.2 },
        { label: "PSG +0.5 (Asian Handicap)", bookmaker: "Bet365", decimalOdds: 1.92, ev: 5.6 },
      ] },
  ] },
];

export default function ProLockedBoard({ proBoard, proStats, onUnlock, loading }) {
  if (loading) {
    return <div className="h-96 animate-pulse rounded-xl border border-base-border bg-base-surface2" />;
  }

  const unlocked = Boolean(proBoard && proBoard.length > 0);
  const displayBoard = unlocked ? proBoard : MOCK_BOARD;

  const totalMatches = unlocked
    ? proBoard.reduce((s, l) => s + l.matches.length, 0)
    : (proStats?.totalMatches ?? MOCK_BOARD.reduce((s, l) => s + l.matches.length, 0));
  const totalEdges = unlocked
    ? proBoard.reduce((s, l) => s + l.matches.flatMap((m) => m.bets).length, 0)
    : (proStats?.totalEdges ?? totalMatches * 3);

  return (
    <div className="overflow-hidden rounded-xl border border-base-border bg-white shadow-strong">
      {/* Header */}
      <div className="border-b border-base-border bg-white px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-base-muted">Premium Ledger</p>
            <p className="mt-0.5 text-lg font-black text-blue-deep">{totalEdges} Active +EV Edges Today</p>
          </div>
          <div className="flex items-center gap-3">
            {unlocked && (
              <span className="flex items-center gap-1.5 rounded-full border border-ev/30 bg-ev/10 px-3 py-1 font-mono text-[10px] font-bold text-ev">
                <IconCheck className="w-3 h-3" /> Pro Unlocked
              </span>
            )}
            <span className="rounded-full border border-base-border bg-base-surface2 px-4 py-1.5 text-xs font-semibold text-base-muted">
              {totalMatches} matches across all leagues
            </span>
          </div>
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

      {/* Board rows */}
      {unlocked ? (
        <div className="max-h-[600px] overflow-y-auto">
          {displayBoard.map((league) => (
            <LeagueSection key={league.league} league={league} unlocked={true} />
          ))}
        </div>
      ) : (
        <div className="relative max-h-[500px] overflow-hidden">
          <div aria-hidden="true">
            {displayBoard.map((league) => (
              <LeagueSection key={league.league} league={league} unlocked={false} />
            ))}
          </div>

          {/* Frosted glass fade */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-white via-white/85 to-transparent" />

          {/* Lock card */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
            <div className="w-full max-w-md rounded-2xl border border-base-border bg-white/95 p-8 shadow-strong backdrop-blur-sm">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-light mx-auto">
                <IconLock className="w-6 h-6 text-blue-royal" />
              </div>
              <h3 className="mt-5 text-xl font-black text-blue-deep">
                Unlock {totalEdges} Active +EV Edges
              </h3>
              <p className="mt-2 text-sm text-base-muted">
                {totalMatches} matches · mathematically verified bets · all major leagues &amp; cups
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
      )}
    </div>
  );
}
