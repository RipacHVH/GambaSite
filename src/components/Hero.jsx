import { IconChartUp, IconShield, IconTarget, IconUsers } from "./Icons";

const stats = [
  { label: "Avg. Monthly ROI",       value: "+14.2%", icon: IconChartUp, highlight: true  },
  { label: "Edges Identified Today", value: "84",     icon: IconTarget,  highlight: false },
  { label: "Model Win Rate",         value: "57.9%",  icon: IconShield,  highlight: false },
  { label: "Active Subscribers",     value: "12,400+",icon: IconUsers,   highlight: false },
];

const BARS = [45, 62, 38, 75, 55, 88, 42, 70, 60, 82, 50, 68];

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-base-surface">
      <div className="absolute inset-0 hero-grid pointer-events-none" />
      <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-ev/5 to-transparent pointer-events-none" />

      <div className="relative mx-auto max-w-6xl px-6 pt-16 pb-0 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1fr_400px] lg:items-start lg:pt-12 lg:pb-16">

          {/* Left — copy */}
          <div className="animate-fade-up pt-2">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-ev/20 bg-ev/5 px-4 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-ev animate-pulse-dot" />
              <span className="text-[11px] font-semibold text-ev">Live market analysis · Football</span>
            </div>

            <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-base-text sm:text-5xl xl:text-[56px]">
              Stop Guessing.
              <br />
              <span className="text-ev">Start Calculating.</span>
              <br />
              Beat the Bookies
              <br />
              with Pure Math.
            </h1>

            <p className="mt-6 max-w-lg text-base text-base-muted leading-relaxed">
              EdgeFinder de-vigs every major sportsbook across today's biggest football
              fixtures to find the true probability — then surfaces only the bets where
              the math is genuinely in your favour.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#free-pick"
                className="inline-flex items-center rounded-sm bg-ev px-6 py-3 text-sm font-bold text-white shadow-ev-glow transition-all hover:brightness-110"
              >
                View Today's Signal
              </a>
              <a href="#calculator"
                className="inline-flex items-center rounded-sm border border-base-border bg-base-surface px-6 py-3 text-sm font-semibold text-base-text shadow-card transition-all hover:bg-base-surface2"
              >
                Open Calculator
              </a>
            </div>

            {/* Trust badges */}
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-base-muted">
              <span className="flex items-center gap-1.5"><span className="text-ev">✓</span> No tipster bias</span>
              <span className="flex items-center gap-1.5"><span className="text-ev">✓</span> Pure probability math</span>
              <span className="flex items-center gap-1.5"><span className="text-ev">✓</span> 14 leagues &amp; cups</span>
            </div>
          </div>

          {/* Right — live feed terminal */}
          <div className="hidden lg:block animate-fade-up">
            <div className="rounded-lg border border-base-border bg-white shadow-panel overflow-hidden">
              {/* Terminal header */}
              <div className="flex items-center justify-between border-b border-base-border bg-base-surface2 px-4 py-3">
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-base-muted">Live Edge Feed</span>
                <span className="flex items-center gap-1.5 rounded-full bg-ev/10 px-2.5 py-1 font-mono text-[9px] font-bold text-ev">
                  <span className="h-1.5 w-1.5 rounded-full bg-ev animate-pulse-dot" />LIVE
                </span>
              </div>

              {/* Mini bar chart */}
              <div className="border-b border-base-border px-4 pt-4 pb-3 bg-base-surface2/30">
                <p className="mb-2.5 font-mono text-[9px] font-bold uppercase tracking-widest text-base-muted">EV Distribution — Today's Matches</p>
                <div className="flex items-end gap-1 h-14">
                  {BARS.map((h, i) => (
                    <div key={i} className="flex-1 rounded-sm transition-all" style={{
                      height: `${h}%`,
                      backgroundColor: h > 70 ? 'rgb(37 99 235 / 0.75)' : h > 50 ? 'rgb(37 99 235 / 0.40)' : 'rgb(37 99 235 / 0.15)'
                    }} />
                  ))}
                </div>
              </div>

              {/* Signal rows */}
              {[
                { league: "FIFA WORLD CUP",  match: "Brazil vs Argentina", ev: "+11.4%", market: "Over 2.5 Goals" },
                { league: "PREMIER LEAGUE",  match: "Arsenal vs Chelsea",   ev: "+8.7%",  market: "Home Win" },
                { league: "LA LIGA",         match: "Real Madrid vs Barça", ev: "+6.2%",  market: "Both Teams Score" },
              ].map((r, i) => (
                <div key={r.match} className={`flex items-center justify-between px-4 py-3 ${i < 2 ? "border-b border-base-border" : ""}`}>
                  <div>
                    <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-base-muted">{r.league}</p>
                    <p className="mt-0.5 text-xs font-semibold text-base-text">{r.match}</p>
                    <p className="mt-0.5 text-[10px] text-base-muted">{r.market}</p>
                  </div>
                  <span className="font-mono text-sm font-bold text-ev">{r.ev}</span>
                </div>
              ))}

              <div className="flex items-center justify-between border-t border-base-border bg-ev/5 px-4 py-2">
                <span className="font-mono text-[9px] text-base-muted">84 signals computed today</span>
                <span className="font-mono text-[9px] font-semibold text-ev">Updated 2m ago ↑</span>
              </div>
            </div>
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 gap-px bg-base-border border-t border-base-border sm:grid-cols-4">
          {stats.map(({ label, value, icon: Icon, highlight }) => (
            <div key={label} className="flex items-center gap-4 bg-base-surface px-6 py-5">
              <Icon className={`h-5 w-5 shrink-0 ${highlight ? "text-ev" : "text-base-muted"}`} />
              <div>
                <p className={`font-mono text-xl font-bold ${highlight ? "text-ev" : "text-base-text"}`}>{value}</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wider text-base-muted">{label}</p>
              </div>
              {highlight && <div className="ml-auto h-8 w-0.5 rounded-full bg-ev/40" />}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
