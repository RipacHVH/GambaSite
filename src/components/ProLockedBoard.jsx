import { IconLock, IconCheck } from "./Icons";
import OddsValue from "./OddsValue";

function formatKickoff(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const isToday = d.toDateString() === today.toDateString();
  const isTomorrow = d.toDateString() === tomorrow.toDateString();
  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

  if (isToday) return `Today · ${time}`;
  if (isTomorrow) return `Tomorrow · ${time}`;
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }) + ` · ${time}`;
}

function RealRow({ bet }) {
  return (
    <div className="grid grid-cols-[2.4fr_1fr_0.9fr_0.9fr] items-center gap-3 px-5 py-3 border-b border-base-border last:border-0 bg-white odd:bg-base-surface2/20">
      <span className="truncate text-sm font-medium text-base-text">{bet.label}</span>
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

function BlurredRow({ bet }) {
  return (
    <div className="grid grid-cols-[2.4fr_1fr_0.9fr_0.9fr] items-center gap-3 px-5 py-3 border-b border-base-border last:border-0 bg-white odd:bg-base-surface2/20">
      <span className="select-none truncate text-sm font-medium text-base-text blur-[6px]">{bet.label}</span>
      <span className="select-none font-mono text-sm font-semibold text-blue-deep blur-[5px]">
        <OddsValue decimal={bet.decimalOdds} />
      </span>
      <span className="select-none font-mono text-xs text-base-muted blur-[5px]">61.2%</span>
      <span className="select-none">
        <span className="inline-flex rounded-full bg-ev/10 border border-ev/20 px-2.5 py-1 font-mono text-xs font-bold text-ev blur-[5px]">
          +{bet.ev}%
        </span>
      </span>
    </div>
  );
}

function MatchCard({ match, unlocked }) {
  const RowComp = unlocked ? RealRow : BlurredRow;
  return (
    <div className="border-b border-base-border last:border-0">
      {/* Match header */}
      <div className="flex items-center justify-between px-5 py-2.5 border-b border-base-border" style={{ background: "rgba(245,158,11,0.04)" }}>
        <div className="flex items-center gap-2 min-w-0">
          <span className={`text-sm font-bold text-blue-deep truncate ${unlocked ? "" : "blur-[5px] select-none"}`}>
            {match.match}
          </span>
          <span className="shrink-0 rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide" style={{ background: "rgba(245,158,11,0.1)", color: "#D97706", border: "1px solid rgba(245,158,11,0.2)" }}>
            {match.league}
          </span>
        </div>
        <span className="font-mono text-[10px] text-base-muted shrink-0 ml-3">{formatKickoff(match.kickoff)}</span>
      </div>
      {match.bets.map((bet, i) => <RowComp key={i} bet={bet} />)}
    </div>
  );
}

// Placeholder bets for blurred rows — content doesn't matter, only structure
const PLACEHOLDER_BETS = [
  { label: "Team to Win (Match Result)", decimalOdds: 2.3, ev: 12.9 },
  { label: "Over 2.5 Goals (Total)",     decimalOdds: 1.88, ev: 8.4 },
];

// Build locked display from real teaser data (real league + kickoff, fake match/bets)
function buildLockedMatches(teaserBoard) {
  if (teaserBoard && teaserBoard.length > 0) {
    return teaserBoard.map(t => ({
      league:  t.league,
      kickoff: t.kickoff,
      match:   "██████ vs ██████",
      bets:    PLACEHOLDER_BETS,
    }));
  }
  // Absolute fallback if teaser hasn't loaded yet
  return [
    { league: "FIFA World Cup",        match: "██████ vs ██████", kickoff: new Date(Date.now() + 5*3600*1000).toISOString(),  bets: PLACEHOLDER_BETS },
    { league: "UEFA Champions League", match: "██████ vs ██████", kickoff: new Date(Date.now() + 26*3600*1000).toISOString(), bets: PLACEHOLDER_BETS },
    { league: "Copa Libertadores",     match: "██████ vs ██████", kickoff: new Date(Date.now() + 50*3600*1000).toISOString(), bets: PLACEHOLDER_BETS },
  ];
}

export default function ProLockedBoard({ proBoard, teaserBoard, proStats, onUnlock, loading }) {
  if (loading) {
    return <div className="h-96 animate-pulse rounded-xl border border-base-border bg-base-surface2" />;
  }

  const unlocked = Boolean(proBoard && proBoard.length > 0);
  const lockedMatches = buildLockedMatches(teaserBoard);
  const displayMatches = unlocked ? proBoard : lockedMatches;

  const totalMatches = unlocked ? proBoard.length : (proStats?.totalMatches ?? lockedMatches.length);
  const totalEdges   = unlocked
    ? proBoard.reduce((s, m) => s + m.bets.length, 0)
    : (proStats?.totalEdges ?? totalMatches * 2);

  return (
    <div className="overflow-hidden rounded-xl border border-base-border bg-white shadow-strong">
      {/* Header */}
      <div className="border-b border-base-border bg-white px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-base-muted">Premium Ledger · Next 7 Days</p>
            <p className="mt-0.5 text-lg font-black text-blue-deep">{totalEdges} Active +EV Edges</p>
          </div>
          <div className="flex items-center gap-3">
            {unlocked && (
              <span className="flex items-center gap-1.5 rounded-full border border-ev/30 bg-ev/10 px-3 py-1 font-mono text-[10px] font-bold text-ev">
                <IconCheck className="w-3 h-3" /> Pro Unlocked
              </span>
            )}
            <span className="rounded-full border border-base-border bg-base-surface2 px-4 py-1.5 text-xs font-semibold text-base-muted">
              {totalMatches} matches · chronological
            </span>
          </div>
        </div>
      </div>

      {/* Column headers */}
      <div className="border-b border-base-border bg-base-surface2 px-5 py-2.5">
        <div className="grid grid-cols-[2.4fr_1fr_0.9fr_0.9fr] gap-3 items-center">
          {["Selection / Prop", "Odds (Bet365)", "True Prob", "EV Edge"].map((h, i) => (
            <span key={h} className={`font-mono text-[9px] font-bold uppercase tracking-widest ${i === 3 ? "text-ev" : "text-base-muted"}`}>
              {h}
            </span>
          ))}
        </div>
      </div>

      {/* Board */}
      {unlocked ? (
        <div className="max-h-[650px] overflow-y-auto">
          {displayMatches.map((match, i) => (
            <MatchCard key={i} match={match} unlocked={true} />
          ))}
        </div>
      ) : (
        <div className="relative max-h-[500px] overflow-hidden">
          <div aria-hidden="true">
            {displayMatches.map((match, i) => (
              <MatchCard key={i} match={match} unlocked={false} />
            ))}
          </div>

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-white via-white/85 to-transparent" />

          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
            <div className="w-full max-w-md rounded-2xl border border-base-border bg-white/95 p-8 shadow-strong backdrop-blur-sm">
              <div className="flex h-14 w-14 items-center justify-center rounded-full mx-auto" style={{ background: "rgba(245,158,11,0.12)" }}>
                <IconLock className="w-6 h-6" style={{ color: "#D97706" }} />
              </div>
              <h3 className="mt-5 text-xl font-black text-blue-deep">
                Unlock {totalEdges} Active +EV Edges
              </h3>
              <p className="mt-2 text-sm text-base-muted">
                {totalMatches} matches in the next 7 days · sorted by kickoff time · Bet365 odds
              </p>
              <div className="mt-5 flex items-baseline justify-center gap-1">
                <span className="font-mono text-4xl font-black" style={{ color: "#F59E0B" }}>$20</span>
                <span className="text-sm text-base-muted">/month</span>
              </div>
              <button
                onClick={onUnlock}
                className="mt-4 w-full cursor-pointer rounded-xl py-3.5 text-sm font-bold text-white transition-all hover:brightness-110"
                style={{ background: "linear-gradient(135deg,#F59E0B,#D97706)", boxShadow: "0 4px 20px rgba(245,158,11,0.3)" }}
              >
                Unlock All Edges - $20/mo
              </button>
              <p className="mt-3 text-[11px] text-base-muted">7-day money-back guarantee · Cancel anytime</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
