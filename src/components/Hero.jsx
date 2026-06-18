import { IconChartUp, IconShield, IconTarget, IconUsers } from "./Icons";

const stats = [
  { label: "AI Model Accuracy",      value: "64.8%",  icon: IconShield,   gold: false },
  { label: "Avg. Monthly Yield",     value: "+14.2%", icon: IconChartUp,  gold: true  },
  { label: "Edges Calculated Today", value: "142",    icon: IconTarget,   gold: false },
  { label: "Active Subscribers",     value: "340+",icon: IconUsers,    gold: false },
];

function GrowthChart() {
  const W = 480, H = 160;
  const pts = Array.from({ length: 60 }, (_, i) => {
    const t = i / 59;
    const noise = Math.sin(i * 2.3) * 6 + Math.sin(i * 0.7) * 10;
    const base = 1000 * Math.pow(1 + 0.142 / 30, i * 8.33);
    const y = H - ((Math.log(base) - Math.log(1000)) / (Math.log(7200) - Math.log(1000))) * (H - 20) - 10;
    return [Math.round((i / 59) * W), Math.max(10, Math.round(y + noise * (1 - t)))];
  });
  const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ");
  const areaD = `${pathD} L${W},${H} L0,${H} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none" style={{ height: 160 }}>
      <defs>
        <linearGradient id="chartGrad2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
        </linearGradient>
        <filter id="glow2">
          <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
          <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {[0.3, 0.6, 0.9].map((f, i) => (
        <line key={i} x1="0" y1={H * f} x2={W} y2={H * f} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      ))}
      <path d={areaD} fill="url(#chartGrad2)" />
      <path d={pathD} fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow2)" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="5" fill="#10B981" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="10" fill="#10B981" fillOpacity="0.2" />
    </svg>
  );
}

export default function Hero({ user, scrollToSection, goToCheckout, checkoutBusy }) {
  return (
    <section style={{ background: "linear-gradient(135deg, #060D1A 0%, #0D1F3C 60%, #091628 100%)" }}>
      {/* Hero copy + chart */}
      <div className="mx-auto max-w-6xl px-6 pt-20 pb-16 lg:px-8">
        <div className="grid gap-14 lg:grid-cols-[1fr_460px] lg:items-center">

          {/* Left */}
          <div className="animate-fade-up">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5"
              style={{ background: "rgba(37,99,235,0.15)", border: "1px solid rgba(37,99,235,0.3)" }}>
              <span className="h-1.5 w-1.5 rounded-full animate-pulse-dot" style={{ background: "#2563EB" }} />
              <span className="text-[11px] font-semibold" style={{ color: "#93C5FD" }}>
                Machine Learning · Real-Time Odds Analysis
              </span>
            </div>

            <h1 className="font-display text-5xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl xl:text-[64px]">
              Finally, bet with
              <br />
              <span style={{ background: "linear-gradient(90deg, #F59E0B, #FCD34D)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                the odds in
              </span>
              <br />
              your favour.
            </h1>

            <p className="mt-6 max-w-md text-lg leading-relaxed" style={{ color: "#94A3B8" }}>
              Every day we find the bets where the bookmakers got it wrong - so you don't have to.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {user?.is_pro ? (
                <button
                  onClick={() => scrollToSection?.("#pro-board")}
                  className="cursor-pointer inline-flex items-center rounded-xl px-8 py-4 text-sm font-bold text-white transition-all hover:brightness-110 shadow-gold-glow"
                  style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}>
                  View Pro Ledger
                </button>
              ) : (
                <button
                  onClick={() => goToCheckout?.()}
                  disabled={checkoutBusy}
                  className="cursor-pointer inline-flex items-center rounded-xl px-8 py-4 text-sm font-bold text-white transition-all hover:brightness-110 shadow-gold-glow disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}>
                  {checkoutBusy ? "Loading…" : "Unlock Pro"}
                </button>
              )}
              <button
                onClick={() => scrollToSection?.("#free-pick")}
                className="cursor-pointer inline-flex items-center rounded-xl px-8 py-4 text-sm font-bold transition-all"
                style={{ border: "2px solid rgba(255,255,255,0.2)", color: "white", background: "rgba(255,255,255,0.05)" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}>
                Free Bet
              </button>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs" style={{ color: "#64748B" }}>
              {["No tipster bias", "Pure ML probability", "6 leagues & cups", "Live odds feed"].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <span style={{ color: "#10B981" }} className="font-bold">✓</span> {t}
                </span>
              ))}
            </div>
          </div>

          {/* Right - dark glass card */}
          <div className="animate-fade-up delay-200">
            <div className="overflow-hidden rounded-2xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(12px)" }}>
              <div className="px-5 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#64748B" }}>Simulated Bankroll Growth</p>
                    <p className="mt-1 text-3xl font-black text-white font-display">$1,000 → $7,200</p>
                    <p className="mt-0.5 text-xs" style={{ color: "#64748B" }}>500 algorithmic trades · +14.2% avg. monthly yield</p>
                  </div>
                  <span className="flex items-center rounded-lg px-3 py-1.5" style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.25)" }}>
                    <span className="font-mono text-sm font-black" style={{ color: "#10B981" }}>+620%</span>
                  </span>
                </div>
              </div>
              <div className="px-5 pt-4 pb-3">
                <GrowthChart />
              </div>
              <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.2)" }}>
                <span className="font-mono text-[10px]" style={{ color: "#475569" }}>Based on historical +EV model back-test</span>
                <span className="font-mono text-[10px] font-semibold" style={{ color: "#10B981" }}>↑ Past performance, not guaranteed</span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Trust metric strip */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4">
            {stats.map(({ label, value, gold }, i) => (
              <div key={label} className={`py-6 px-4 text-center ${
                i === 0 || i === 2
                  ? "[border-right:1px_solid_rgba(255,255,255,0.07)]"          // left col both rows: always show divider
                  : i === 1
                  ? "sm:[border-right:1px_solid_rgba(255,255,255,0.07)]"       // right col row 1: only show on sm+ (4-col layout)
                  : ""
              }`}>
                <p className="font-display text-2xl font-black sm:text-3xl" style={{ color: gold ? "#F59E0B" : "white" }}>{value}</p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
