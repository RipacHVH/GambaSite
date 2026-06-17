import { IconChartUp, IconShield, IconTarget, IconUsers } from "./Icons";

const stats = [
  { label: "AI Model Accuracy",      value: "64.8%",  icon: IconShield,   green: false },
  { label: "Average Monthly Yield",  value: "+14.2%", icon: IconChartUp,  green: true  },
  { label: "Calculated Edges Today", value: "142",    icon: IconTarget,   green: false },
  { label: "Active Subscribers",     value: "12,400+",icon: IconUsers,    green: false },
];

// Mock bankroll growth curve — 500 trades, compounding ~14% monthly
function GrowthChart() {
  const W = 480, H = 180;
  // Generate smooth upward curve points
  const pts = Array.from({ length: 60 }, (_, i) => {
    const t = i / 59;
    const noise = Math.sin(i * 2.3) * 8 + Math.sin(i * 0.7) * 14;
    const base = 1000 * Math.pow(1 + 0.142 / 30, i * 8.33);
    const y = H - ((Math.log(base) - Math.log(1000)) / (Math.log(7200) - Math.log(1000))) * (H - 24) - 12;
    return [Math.round((i / 59) * W), Math.max(12, Math.round(y + noise * (1 - t)))];
  });

  const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ");
  const areaD = `${pathD} L${W},${H} L0,${H} Z`;

  return (
    <div className="relative">
      <div className="absolute inset-0 rounded-lg bg-gradient-to-b from-transparent to-white pointer-events-none" style={{ top: "60%" }} />
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none" style={{ height: 180 }}>
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0.01" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((f, i) => (
          <line key={i} x1="0" y1={H * f} x2={W} y2={H * f} stroke="#E2E8F0" strokeWidth="1" />
        ))}
        {/* Area fill */}
        <path d={areaD} fill="url(#chartGrad)" />
        {/* Line */}
        <path d={pathD} fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)" />
        {/* End dot */}
        <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="5" fill="#10B981" />
        <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="9" fill="#10B981" fillOpacity="0.2" />
      </svg>
      {/* Y-axis labels */}
      <div className="absolute left-0 top-0 flex flex-col justify-between h-full py-2 pointer-events-none">
        {["$7,200", "$4,100", "$2,200", "$1,000"].map((l) => (
          <span key={l} className="font-mono text-[9px] text-slate-400">{l}</span>
        ))}
      </div>
    </div>
  );
}

export default function Hero() {
  return (
    <section className="bg-white border-b border-base-border">
      {/* Hero copy + chart */}
      <div className="mx-auto max-w-6xl px-6 pt-16 pb-12 lg:px-8">
        <div className="grid gap-14 lg:grid-cols-[1fr_480px] lg:items-center">

          {/* Left */}
          <div className="animate-fade-up">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-border bg-blue-light px-4 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-royal animate-pulse-dot" />
              <span className="text-[11px] font-semibold text-blue-royal">Machine Learning · Football Analytics</span>
            </div>

            <h1 className="text-4xl font-black leading-[1.1] tracking-tight text-blue-deep sm:text-5xl xl:text-[52px]">
              Find Winning Bets
              <br />
              <span className="text-blue-royal">Before the Bookies</span>
              <br />
              Correct the Odds.
            </h1>

            <p className="mt-6 max-w-md text-base text-base-muted leading-relaxed">
              CalcoBetAI scans every major sportsbook in real time, de-vigs the market using
              machine learning, and surfaces only the bets where probability is genuinely
              mispriced - before the line corrects.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#pro-board"
                className="inline-flex items-center rounded-md bg-blue-royal px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-900/20 transition-all hover:bg-blue-deep hover:shadow-xl"
              >
                Unlock Pro
              </a>
              <a href="#free-pick"
                className="inline-flex items-center rounded-md bg-white px-7 py-3.5 text-sm font-bold transition-all hover:bg-blue-light"
                style={{ border: "2px solid #2563EB", color: "#2563EB" }}
              >
                Free Bet
              </a>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs text-base-muted">
              {["No tipster bias", "Pure ML probability", "14 leagues & cups", "Live odds feed"].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <span className="text-ev font-bold">✓</span> {t}
                </span>
              ))}
            </div>
          </div>

          {/* Right — growth chart card */}
          <div className="animate-fade-up">
            <div className="rounded-xl border border-base-border bg-white shadow-strong overflow-hidden">
              <div className="border-b border-base-border px-5 py-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-base-muted uppercase tracking-wider">Simulated Bankroll Growth</p>
                    <p className="mt-1 text-2xl font-black text-blue-deep">$1,000 → $7,200</p>
                    <p className="mt-0.5 text-xs text-base-muted">500 algorithmic trades · +14.2% avg. monthly yield</p>
                  </div>
                  <span className="flex items-center gap-1.5 rounded-full bg-ev/10 border border-ev/20 px-3 py-1.5">
                    <span className="font-mono text-sm font-black text-ev">+620%</span>
                  </span>
                </div>
              </div>
              <div className="px-5 pt-4 pb-2">
                <GrowthChart />
              </div>
              <div className="flex items-center justify-between border-t border-base-border bg-base-surface2/50 px-5 py-3">
                <span className="font-mono text-[10px] text-base-muted">Based on historical +EV model back-test</span>
                <span className="font-mono text-[10px] font-semibold text-ev">↑ Past performance, not guaranteed</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trust metric strip */}
      <div className="border-t border-base-border bg-base-surface2/60">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-2 divide-x divide-base-border sm:grid-cols-4">
            {stats.map(({ label, value, icon: Icon, green }) => (
              <div key={label} className="flex items-center gap-4 px-6 py-5">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${green ? "bg-ev/10" : "bg-blue-light"}`}>
                  <Icon className={`h-5 w-5 ${green ? "text-ev" : "text-blue-royal"}`} />
                </div>
                <div>
                  <p className={`font-mono text-xl font-black ${green ? "text-ev" : "text-blue-deep"}`}>{value}</p>
                  <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-base-muted">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
