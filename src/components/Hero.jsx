import { IconChartUp, IconShield, IconTarget, IconUsers } from "./Icons";

const stats = [
  { label: "Avg. Monthly ROI", value: "+14.2%", icon: IconChartUp, tone: "ev" },
  { label: "Calculated Edges Today", value: "84", icon: IconTarget, tone: "text" },
  { label: "Model Win Rate", value: "57.9%", icon: IconShield, tone: "text" },
  { label: "Bettors Tracking Live", value: "12,400+", icon: IconUsers, tone: "text" },
];

export default function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pt-16 sm:pt-24 lg:px-8">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-ev/10 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-4xl text-center animate-fade-up">
        <span className="inline-flex items-center gap-2 rounded-full border border-base-border bg-base-surface px-4 py-1.5 text-xs font-medium text-base-muted">
          <IconShield className="w-3.5 h-3.5 text-ev" />
          Premier League, La Liga, Champions League &amp; every major football competition
        </span>

        <h1 className="mt-6 text-4xl font-extrabold leading-[1.1] tracking-tight text-base-text sm:text-5xl lg:text-6xl">
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
            className="w-full cursor-pointer rounded-lg bg-ev px-6 py-3 text-center text-sm font-semibold text-base-bg shadow-ev-glow transition-transform duration-200 hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ev sm:w-auto"
          >
            Get Today&apos;s Free Edge
          </a>
          <a
            href="#calculator"
            className="w-full cursor-pointer rounded-lg border border-base-border px-6 py-3 text-center text-sm font-semibold text-base-text transition-colors duration-200 hover:bg-base-surface2 sm:w-auto"
          >
            Try the Live Calculator
          </a>
        </div>
      </div>

      <div className="mx-auto mt-14 grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, tone }) => (
          <div
            key={label}
            className="rounded-xl border border-base-border bg-base-surface px-4 py-5 text-center shadow-card"
          >
            <Icon className={`mx-auto h-5 w-5 ${tone === "ev" ? "text-ev" : "text-base-muted"}`} />
            <p
              className={`mt-2 font-mono text-xl font-bold sm:text-2xl ${
                tone === "ev" ? "text-ev" : "text-base-text"
              }`}
            >
              {value}
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-wide text-base-muted">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
