import { useEffect, useState, useCallback } from "react";
import Hero from "./components/Hero";
import FreeBetCard from "./components/FreeBetCard";
import ProLockedBoard from "./components/ProLockedBoard";
import EdgeCalculator from "./components/EdgeCalculator";
import AuthPage from "./components/AuthPage";
import SettingsPage from "./components/SettingsPage";
import HistoryPage from "./components/HistoryPage";
import Testimonials from "./components/Testimonials";
import FAQ from "./components/FAQ";
import OddsFormatToggle from "./components/OddsFormatToggle";
import { OddsFormatProvider } from "./context/OddsFormatContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import CalcoBetLogo from "./components/CalcoBetLogo";
import { usePicks } from "./hooks/usePicks";
import { useProPicks } from "./hooks/useProPicks";
import { useParlay } from "./hooks/useParlay";
import ParlayCard from "./components/ParlayCard";

function SectionHeader({ number, title, badge, sub }) {
  return (
    <div className="mb-7 flex items-center justify-between border-b border-base-border pb-5">
      <div className="flex items-center gap-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-black font-display text-white" style={{ background: "linear-gradient(135deg,#F59E0B,#D97706)" }}>{number}</span>
        <h2 className="font-display text-base font-black uppercase tracking-wider text-blue-deep">{title}</h2>
        {badge}
      </div>
      {sub && <span className="text-xs text-base-muted">{sub}</span>}
    </div>
  );
}

function AppInner() {
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Simple pathname router
  const path = window.location.pathname;
  const isLoginPage    = path === "/login";
  const isRegisterPage = path === "/register";
  const isSettingsPage = path === "/settings";
  const isHistoryPage  = path === "/history";
  if (isLoginPage || isRegisterPage) return <AuthPage defaultTab={isRegisterPage ? "register" : "login"} />;
  if (isSettingsPage) return <SettingsPage />;
  if (isHistoryPage)  return <HistoryPage />;

  const { data, usingMock, loading } = usePicks();
  const { proBoard, loading: proLoading } = useProPicks();
  const { parlay, loading: parlayLoading } = useParlay();
  const { user, logout, refreshUser, apiFetch } = useAuth();

  const scrollToSection = useCallback((hash) => {
    const target = document.querySelector(hash);
    if (!target) return;
    const navH = 62; // compact navbar height — consistent regardless of scroll state
    const extra = (hash === "#pro-board" || hash === "#calculator") ? -8 : 0;
    const top = target.getBoundingClientRect().top + window.scrollY - navH + extra;
    window.scrollTo({ top, behavior: "smooth" });
  }, []);

  const goToCheckout = useCallback(async () => {
    if (!user) { window.location.href = "/login"; return; }
    if (user.is_pro) return;
    if (checkoutBusy) return;
    setCheckoutBusy(true);
    try {
      const { url } = await apiFetch("/api/stripe/create-checkout-session", { method: "POST" });
      window.location.href = url;
    } catch {
      setCheckoutBusy(false);
    }
  }, [user, apiFetch, checkoutBusy]);

  // Scroll-aware navbar: transparent over dark hero, solid after scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Detect Stripe success redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("pro_success") === "1") {
      let attempts = 0;
      const interval = setInterval(async () => {
        const updated = await refreshUser();
        if (updated?.is_pro || ++attempts >= 10) clearInterval(interval);
      }, 2000);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const navStyle = scrolled
    ? { background: "rgba(6,13,26,0.97)", backdropFilter: "blur(16px)", boxShadow: "0 4px 24px rgba(0,0,0,0.4)" }
    : { background: "rgba(6,13,26,0.75)", backdropFilter: "blur(12px)" };

  const navTextColor = "rgba(255,255,255,0.6)";
  const navTextHover = "#F59E0B";

  return (
    <div className="min-h-screen font-sans" style={{ background: "#F8FAFC", color: "#0F172A" }}>
      <div className="top-bar h-[3px] w-full" />

      {/* Scroll-aware header */}
      <header className="fixed top-0 left-0 right-0 z-40 transition-all duration-300" style={navStyle}>
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-2 lg:px-8">
          <a href="/" className="flex items-center">
            <CalcoBetLogo tileSize={scrolled ? 34 : 40} textSize={scrolled ? 22 : 26} taglineSize={scrolled ? 8 : 9} gap={10} />
          </a>

          <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
            {[["#free-pick","Daily Edge"],["#parlay","Parlay"],["#pro-board","Pro Ledger"],["#calculator","Calculator"],["#faq","FAQ"],["/history","History"]].map(([href, label]) => (
              <a key={href} href={href}
                className="transition-colors duration-200 hover:opacity-100"
                style={{ color: navTextColor }}
                onMouseEnter={e => e.currentTarget.style.color = navTextHover}
                onMouseLeave={e => e.currentTarget.style.color = navTextColor}
                onClick={e => { if (href.startsWith("#")) { e.preventDefault(); scrollToSection(href); } }}>
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <OddsFormatToggle className="hidden md:inline-flex" dark={true} />

            {user ? (
              <div className="relative">
                <button onClick={() => setUserMenuOpen(v => !v)}
                  className="cursor-pointer flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "white" }}>
                  <span className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black text-white" style={{ background: "linear-gradient(135deg,#F59E0B,#D97706)" }}>
                    {user.email[0].toUpperCase()}
                  </span>
                  <span className="max-w-[120px] truncate">{user.email}</span>
                  {user.is_pro && (
                    <span className="rounded-full px-1.5 py-0.5 font-mono text-[9px] font-bold" style={{ background: "rgba(16,185,129,0.15)", color: "#10B981", border: "1px solid rgba(16,185,129,0.3)" }}>PRO</span>
                  )}
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl border border-base-border bg-white shadow-strong z-50 overflow-hidden">
                    <div className="px-4 py-3" style={{ borderBottom: "1px solid #F1F5F9" }}>
                      <p className="text-xs font-semibold text-base-text truncate">{user.email}</p>
                      <p className="text-[10px] text-base-muted mt-0.5">{user.is_pro ? "Pro member ✓" : "Free account"}</p>
                    </div>
                    <a href="/settings"
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-xs font-semibold transition-colors"
                      style={{ color: "rgba(15,23,42,0.7)" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#F8FAFC"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      Settings
                    </a>
                    {!user.is_pro && (
                      <button onClick={() => { setUserMenuOpen(false); goToCheckout(); }}
                        className="flex w-full cursor-pointer items-center gap-2 px-4 py-2.5 text-xs font-semibold transition-colors"
                        style={{ color: "#D97706" }}
                        onMouseEnter={e => e.currentTarget.style.background = "#FFFBEB"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        Upgrade to Pro →
                      </button>
                    )}
                    <button onClick={() => { logout(); setUserMenuOpen(false); }}
                      className="flex w-full cursor-pointer items-center gap-2 px-4 py-2.5 text-xs text-base-muted hover:bg-base-surface2 transition-colors">
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <a href="/login"
                  className="cursor-pointer rounded-xl px-4 py-2.5 text-xs font-semibold transition-all"
                  style={{ background: scrolled ? "white" : "rgba(255,255,255,0.08)", border: scrolled ? "1px solid #E2E8F0" : "1px solid rgba(255,255,255,0.18)", color: scrolled ? "#0F172A" : "white" }}>
                  Sign In
                </a>
                <button onClick={goToCheckout} disabled={checkoutBusy}
                  className="cursor-pointer rounded-xl px-5 py-2.5 text-xs font-bold text-white transition-all hover:brightness-110 shadow-gold-glow disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}>
                  {checkoutBusy ? "Loading…" : "Unlock Pro"}
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {userMenuOpen && <div className="fixed inset-0 z-30" onClick={() => setUserMenuOpen(false)} />}

      {/* Spacer for fixed navbar - only needed on non-hero pages */}
      <div className="h-[3px]" />

      {usingMock && !loading && (
        <div style={{ background: "#FFFBEB", borderBottom: "1px solid #FDE68A", padding: "8px 24px", textAlign: "center" }}>
          <span style={{ fontSize: "12px", color: "#92400E" }}>
            ⚠ Sample data shown - connect <code style={{ background: "#FEF3C7", padding: "1px 4px", borderRadius: 4 }}>server/.env</code> to see live fixtures
          </span>
        </div>
      )}

      <main>
        <Hero user={user} scrollToSection={scrollToSection} goToCheckout={goToCheckout} checkoutBusy={checkoutBusy} />

        {/* Testimonials */}
        <Testimonials />

        {/* Free pick - full-width featured zone */}
        <section id="free-pick" style={{ background: "linear-gradient(180deg, #060D1A 0%, #0B1628 100%)" }}>
          <div className="mx-auto max-w-6xl px-6 py-14 lg:px-8">
            <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-black font-display text-white" style={{ background: "linear-gradient(135deg,#F59E0B,#D97706)" }}>1</span>
                <h2 className="font-display text-base font-black uppercase tracking-wider text-white">Free Bet of the Day</h2>
                <span className="flex items-center gap-1.5 rounded-full border border-ev/40 bg-ev/15 px-2.5 py-0.5 font-mono text-[9px] font-bold text-ev">
                  <span className="h-1.5 w-1.5 rounded-full bg-ev animate-pulse-dot" />LIVE
                </span>
              </div>
              <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.35)" }}>Updated every 6 hours</span>
            </div>
            <FreeBetCard pick={data?.freePick} loading={loading} />
          </div>
        </section>

        {/* Parlay of the Day - dark featured zone, same as Free Pick */}
        <section id="parlay" style={{ background: "linear-gradient(180deg, #0B1628 0%, #060D1A 100%)" }}>
          <div className="mx-auto max-w-6xl px-6 py-14 lg:px-8">
            <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-black font-display text-white"
                  style={{ background: "linear-gradient(135deg,#F59E0B,#D97706)" }}>2</span>
                <h2 className="font-display text-base font-black uppercase tracking-wider text-white">Parlay of the Day</h2>
                <span className="rounded-full px-2.5 py-0.5 font-mono text-[9px] font-bold"
                  style={{ background: "rgba(245,158,11,0.15)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.3)" }}>
                  PRO
                </span>
              </div>
              <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.35)" }}>AI-selected multi-leg combo</span>
            </div>
            <ParlayCard
              parlay={parlay}
              loading={parlayLoading}
              isPro={!!user?.is_pro}
              onUnlock={goToCheckout}
            />
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8 space-y-16">

          {/* Pro board */}
          <section id="pro-board">
            <SectionHeader
              number="03"
              title="Premium Edge Ledger"
              badge={user?.is_pro
                ? <span className="rounded-full border border-ev/30 bg-ev/10 px-2.5 py-0.5 text-[10px] font-semibold text-ev">✓ Pro Unlocked</span>
                : <span className="rounded-full border border-base-border bg-base-surface2 px-2.5 py-0.5 text-[10px] font-semibold text-base-muted">Pro Only</span>
              }
              sub="All major leagues & cups"
            />
            <ProLockedBoard
              proBoard={user?.is_pro ? proBoard : null}
              teaserBoard={data?.teaserBoard}
              proStats={data?.proStats}
              onUnlock={goToCheckout}
              loading={loading || (user?.is_pro && proLoading)}
            />
          </section>

          {/* Calculator */}
          <section id="calculator">
            <SectionHeader number="04" title="Quantitative Tools" sub="No signup required" />
            <EdgeCalculator />
          </section>

          {/* Pricing CTA - hide if already Pro */}
          {!user?.is_pro && (
            <section id="pricing">
              <div className="overflow-hidden rounded-3xl shadow-strong" style={{ background: "linear-gradient(135deg, #060D1A 0%, #0D1F3C 100%)" }}>
                <div className="grid lg:grid-cols-2 gap-0">
                  {/* Left: copy */}
                  <div className="p-10 sm:p-14">
                    <span className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider mb-6"
                      style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)", color: "#F59E0B" }}>
                      CalcoBet Pro
                    </span>
                    <h2 className="font-display text-3xl font-black text-white sm:text-4xl leading-tight">
                      Stop guessing.<br />
                      <span style={{ color: "#F59E0B" }}>Start winning</span> with math.
                    </h2>
                    <p className="mt-4 text-base leading-relaxed" style={{ color: "#94A3B8" }}>
                      Access every +EV edge we calculate - across 6 competitions, every day, before the line moves.
                    </p>
                    <ul className="mt-7 space-y-3">
                      {[
                        "Daily AI Parlay - multi-leg combo with combined odds",
                        "Full picks board - 5 to 12 edges per day",
                        "Ranked by AI edge, not tipster opinion",
                        "Score tracking + bet result after match",
                        "Cancel anytime, no contracts",
                      ].map(f => (
                        <li key={f} className="flex items-start gap-3 text-sm" style={{ color: "#CBD5E1" }}>
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full" style={{ background: "rgba(16,185,129,0.2)" }}>
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12" stroke="#10B981" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                            </svg>
                          </span>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Right: pricing card */}
                  <div className="flex items-center justify-center p-10 sm:p-14" style={{ borderLeft: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="w-full max-w-xs rounded-2xl p-8 text-center" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                      <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#F59E0B" }}>Monthly Plan</p>
                      <div className="flex items-baseline justify-center gap-1 mb-2">
                        <span className="font-display text-6xl font-black text-white">$20</span>
                        <span className="text-sm" style={{ color: "#64748B" }}>/mo</span>
                      </div>
                      <p className="text-xs mb-8" style={{ color: "#475569" }}>Billed monthly. Cancel anytime.</p>
                      <button onClick={goToCheckout} disabled={checkoutBusy}
                        className="w-full cursor-pointer rounded-xl py-4 text-sm font-bold text-white transition-all hover:brightness-110 shadow-gold-glow disabled:opacity-60"
                        style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}>
                        {checkoutBusy ? "Loading…" : "Get Pro Access"}
                      </button>
                      <p className="mt-4 text-xs" style={{ color: "#475569" }}>✓ 7-day money-back guarantee</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* FAQ */}
        <div id="faq">
          <FAQ />
        </div>
      </main>

      {/* Footer */}
      <footer style={{ background: "#060D1A", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div className="lg:col-span-2">
              <div className="mb-4"><CalcoBetLogo tileSize={40} textSize={26} taglineSize={9} gap={12} /></div>
              <p className="text-sm leading-relaxed max-w-xs" style={{ color: "#475569" }}>
                Statistical analysis of real-time football odds. We find the edges - you place the bets.
              </p>
              <div className="mt-5 flex gap-3">
                {["Twitter", "Discord"].map(s => (
                  <span key={s} className="rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer transition-colors"
                    style={{ background: "rgba(255,255,255,0.05)", color: "#64748B", border: "1px solid rgba(255,255,255,0.08)" }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Product */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#F59E0B" }}>Product</p>
              <ul className="space-y-2.5">
                {[["#free-pick","Free Daily Bet"],["#pro-board","Pro Ledger"],["#calculator","Edge Calculator"],["#pricing","Pricing"],["/history","Prediction History"]].map(([href, label]) => (
                  <li key={label}>
                    <a href={href} className="text-sm transition-colors hover:text-white cursor-pointer" style={{ color: "#475569" }}
                      onClick={e => { if (href.startsWith("#")) { e.preventDefault(); scrollToSection(href); } }}>{label}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#F59E0B" }}>Legal</p>
              <ul className="space-y-2.5">
                {["Terms of Service","Privacy Policy","Cookie Policy","Responsible Gambling"].map(label => (
                  <li key={label}>
                    <span className="text-sm cursor-pointer transition-colors hover:text-white" style={{ color: "#475569" }}>{label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-xs" style={{ color: "#334155" }}>
              © {new Date().getFullYear()} CalcoBet Analytics. Statistical analysis only - not a bookmaker. 18+ where applicable.
            </p>
            <p className="text-xs" style={{ color: "#334155" }}>
              Not affiliated with any sportsbook. Bet responsibly.
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <OddsFormatProvider>
        <AppInner />
      </OddsFormatProvider>
    </AuthProvider>
  );
}
