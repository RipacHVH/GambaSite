import { IconChartUp, IconShield, IconTarget, IconUsers } from "./Icons";

const stats = [
  { label: "Avg. Monthly ROI",       value: "+14.2%", icon: IconChartUp, highlight: true  },
  { label: "Edges Identified Today", value: "84",     icon: IconTarget,  highlight: false },
  { label: "Model Win Rate",         value: "57.9%",  icon: IconShield,  highlight: false },
  { label: "Active Subscribers",     value: "12,400+",icon: IconUsers,   highlight: false },
];

const BARS = [65, 42, 78, 55, 90, 38, 72, 61, 85, 47, 69, 83];

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 -z-10 hero-grid" />
      <div className="absolute left-1/2 top-0 -z-10 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-ev/5 blur-[160px] pointer-events-none" />

      <div className="mx-auto max-w-6xl px-6 pt-14 pb-0 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1fr_420px] lg:items-center lg:pt-10 lg:pb-16">

          {/* Left — copy */}
          <div className="animate-fade-up">
            <div className="mb-5 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-ev animate-pulse-dot" />
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-ev">
                Live market analysis · Football
              </span>
            </div>

            <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight text-base-text sm:text-5xl xl:text-6xl">
              Stop Guessing.
              <br />
              Start Calculating.
              <br />
              <span className="text-ev">Beat the Bookies</span>
              <br />
              with Pure Math.
            </h1>

            <p className="mt-6 max-w-lg text-base text-base-muted leading-relaxed">
              EdgeFinder de-vigs every major sportsbook across today's biggest football
              fixtures to find the true probability — then surfaces only the bets where
              the math is in your favour.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#free-pick"
                className="inline-flex items-center gap-2 rounded-sm bg-ev px-6 py-3 text-sm font-bold text-base-bg shadow-ev-glow transition-all hover:brightness-110"
              >
                View Today's Signal
              </a>
              <a
                href="#calculator"
                className="inline-flex items-center gap-2 rounded-sm border border-base-border bg-base-surface px-6 py-3 text-sm font-semibold text-base-text transition-colors hover:bg-base-surface2"
              >
                Open Calculator
              </a>
            </div>
          </div>

          {/* Right — terminal card */}
          <div className="hidden lg:block animate-fade-up">
            <div className="rounded-sm border border-base-border bg-base-surface shadow-panel overflow-hidden">
              {/* Terminal title bar */}
              <div className="flex items-center justify-between border-b border-base-border bg-base-surface2 px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
                  <div className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
                </div>
                <span className="font-mono text-[10px] tracking-wider text-base-muted">EDGEFINDER · LIVE FEED</span>
                <span className="flex items-center gap-1 text-[10px] text-ev">
                  <span className="h-1.5 w-1.5 rounded-full bg-ev animate-pulse-dot" />
                  LIVE
                </span>
              </div>

              {/* Mini bar chart */}
              <div className="border-b border-base-border px-4 pt-4 pb-3">
                <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-base-muted">EV Distribution — Today</p>
                <div className="flex items-end gap-1 h-16">
                  {BARS.map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-sm bg-ev/20 transition-all"
                      style={{ height: `${h}%`, backgroundColor: h > 70 ? 'rgb(59 158 255 / 0.7)' : h > 50 ? 'rgb(59 158 255 / 0.35)' : 'rgb(59 158 255 / 0.15)' }}
                    />
                  ))}
                </div>
              </div>

              {/* Data rows */}
              {[
                { league: "WORLD CUP",   match: "Brazil vs Argentina",  ev: "+11.4%", market: "Over 2.5" },
                { league: "PREMIER LGE", match: "Arsenal vs Chelsea",    ev: "+8.7%",  market: "Home Win" },
                { league: "LA LIGA",     match: "Real Madrid vs Barça",  ev: "+6.2%",  market: "BTTS" },
              ].map((r) => (
                <div key={r.match} className="flex items-center justify-between border-b border-base-border/50 px-4 py-2.5 last:border-0">
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-widest text-base-muted">{r.league}</p>
                    <p className="mt-0.5 text-xs font-semibold text-base-text">{r.match}</p>
                    <p className="mt-0.5 font-mono text-[10px] text-base-muted">{r.market}</p>
                  </div>
                  <span className="font-mono text-sm font-bold text-ev">{r.ev}</span>
                </div>
              ))}

              <div className="flex items-center justify-between px-4 py-2 bg-ev/5">
                <span className="font-mono text-[10px] text-base-muted">84 signals computed</span>
                <span className="font-mono text-[10px] text-ev">↑ Updated 2m ago</span>
              </div>
            </div>
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 gap-px border-t border-base-border bg-base-border sm:grid-cols-4">
          {stats.map(({ label, value, icon: Icon, highlight }) => (
            <div key={label} className="flex items-center gap-4 bg-base-surface px-6 py-5">
              <Icon className={`h-5 w-5 shrink-0 ${highlight ? "text-ev" : "text-base-muted"}`} />
              <div>
                <p className={`font-mono text-xl font-bold ${highlight ? "text-ev" : "text-base-text"}`}>{value}</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wider text-base-muted">{label}</p>
              </div>
              {highlight && <div className="ml-auto h-8 w-[2px] rounded-full bg-ev/50" />}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
