import { IconChartUp, IconShield, IconTarget, IconUsers } from "./Icons";

const stats = [
  { label: "Avg. Monthly ROI",        value: "+14.2%", icon: IconChartUp, highlight: true },
  { label: "Calculated Edges Today",  value: "84",     icon: IconTarget,  highlight: false },
  { label: "Model Win Rate",          value: "57.9%",  icon: IconShield,  highlight: false },
  { label: "Analysts Tracking Live",  value: "12,400+",icon: IconUsers,   highlight: false },
];

export default function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pt-16 pb-4 sm:pt-24 lg:px-8">

      {/* Grid background */}
      <div className="absolute inset-0 -z-10 hero-grid" />

      {/* Blue radial glow */}
      <div className="absolute left-1/2 top-0 -z-10 h-[520px] w-[640px] -translate-x-1/2 rounded-full bg-ev/8 blur-[140px] pointer-events-none" />

      <div className="mx-auto max-w-4xl text-center animate-fade-up">

        <span className="inline-flex items-center gap-2 rounded border border-ev/20 bg-ev/5 px-4 py-1.5 text-xs font-medium text-ev">
          <span className="h-1.5 w-1.5 rounded-full bg-ev animate-pulse-dot" />
          Premier League · La Liga · Champions League · World Cup &amp; more
        </span>

        <h1 className="mt-7 text-4xl font-extrabold leading-[1.1] tracking-tight text-base-text sm:text-5xl lg:text-6xl">
          Stop Guessing. Start Calculating.
          <br />
          <span className="text-ev">Beat the Bookies with Pure Math.</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base text-base-muted sm:text-lg">
          EdgeFinder scans odds from every major sportsbook across today&apos;s biggest football
          fixtures, de-vigs the market to find the true probability, and surfaces the bets where
          the math is in your favor &mdash; before the line moves.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href="#free-pick"
            className="w-full cursor-pointer rounded bg-ev px-6 py-3 text-center text-sm font-semibold text-base-bg shadow-ev-glow transition-all duration-200 hover:brightness-110 sm:w-auto"
          >
            Get Today&apos;s Free Signal
          </a>
          <a
            href="#calculator"
            className="w-full cursor-pointer rounded border border-base-border bg-base-surface px-6 py-3 text-center text-sm font-semibold text-base-text transition-colors duration-200 hover:bg-base-surface2 sm:w-auto"
          >
            Try the Live Calculator
          </a>
        </div>
      </div>

      {/* KPI stat cards */}
      <div className="mx-auto mt-14 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, highlight }) => (
          <div
            key={label}
            className={`relative rounded border bg-base-surface px-4 py-5 text-center shadow-card ${
              highlight
                ? "border-ev/30 bg-gradient-to-b from-ev/5 to-base-surface"
                : "border-base-border"
            }`}
          >
            {highlight && (
              <div className="absolute left-0 top-0 h-full w-[2px] rounded-l bg-ev/60" />
            )}
            <Icon className={`mx-auto h-4 w-4 ${highlight ? "text-ev" : "text-base-muted"}`} />
            <p className={`mt-2 font-mono text-2xl font-bold ${highlight ? "text-ev" : "text-base-text"}`}>
              {value}
            </p>
            <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-base-muted">
              {label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
