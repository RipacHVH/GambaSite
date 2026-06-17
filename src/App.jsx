import { useEffect, useState } from "react";
import Hero from "./components/Hero";
import FreeBetCard from "./components/FreeBetCard";
import ProLockedBoard from "./components/ProLockedBoard";
import EdgeCalculator from "./components/EdgeCalculator";
import PaywallModal from "./components/PaywallModal";
import AuthPage from "./components/AuthPage";
import OddsFormatToggle from "./components/OddsFormatToggle";
import { OddsFormatProvider } from "./context/OddsFormatContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { usePicks } from "./hooks/usePicks";
import { useProPicks } from "./hooks/useProPicks";

function AppInner() {
  const [modalOpen, setModalOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Simple pathname router — no library needed
  const path = window.location.pathname;
  const isLoginPage    = path === "/login";
  const isRegisterPage = path === "/register";
  if (isLoginPage || isRegisterPage) {
    return <AuthPage defaultTab={isRegisterPage ? "register" : "login"} />;
  }

  const { data, usingMock, loading } = usePicks();
  const { proBoard, loading: proLoading } = useProPicks();
  const { user, logout, refreshUser } = useAuth();

  // Detect Stripe success redirect (?pro_success=1)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("pro_success") === "1") {
      // Poll until is_pro is true (webhook can take a few seconds)
      let attempts = 0;
      const interval = setInterval(async () => {
        const updated = await refreshUser();
        if (updated?.is_pro || ++attempts >= 10) clearInterval(interval);
      }, 2000);
      // Clean up URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  return (
    <div className="min-h-screen bg-base-bg font-sans text-base-text">
      <div className="top-bar h-[3px] w-full" />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-base-border bg-base-bg/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3.5 lg:px-8">
          <a href="/" className="flex items-center">
            <img src="/logo.png" alt="CalcoBet" className="h-24 w-auto" style={{ mixBlendMode: "multiply" }} />
          </a>

          <nav className="hidden items-center gap-7 text-sm font-medium text-base-muted lg:flex">
            <a href="#free-pick"  className="transition-colors hover:text-blue-royal">Daily Edge</a>
            <a href="#pro-board"  className="transition-colors hover:text-blue-royal">Pro Ledger</a>
            <a href="#calculator" className="transition-colors hover:text-blue-royal">Calculator</a>
          </nav>

          <div className="flex items-center gap-3">
            <OddsFormatToggle className="hidden sm:inline-flex" />

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="cursor-pointer flex items-center gap-2 rounded-lg border border-base-border bg-white px-4 py-2 text-xs font-semibold text-base-text shadow-card hover:bg-base-surface2 transition-all"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-royal text-[10px] font-black text-white">
                    {user.email[0].toUpperCase()}
                  </span>
                  <span className="max-w-[120px] truncate">{user.email}</span>
                  {user.is_pro && (
                    <span className="rounded-full bg-ev/10 border border-ev/30 px-1.5 py-0.5 font-mono text-[9px] font-bold text-ev">PRO</span>
                  )}
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-base-border bg-white shadow-strong z-50">
                    <div className="border-b border-base-border px-4 py-3">
                      <p className="text-xs font-semibold text-base-text truncate">{user.email}</p>
                      <p className="text-[10px] text-base-muted mt-0.5">{user.is_pro ? "Pro member ✓" : "Free account"}</p>
                    </div>
                    {!user.is_pro && (
                      <button
                        onClick={() => { setUserMenuOpen(false); setModalOpen(true); }}
                        className="flex w-full cursor-pointer items-center gap-2 px-4 py-2.5 text-xs font-semibold text-blue-royal hover:bg-blue-light transition-colors"
                      >
                        Upgrade to Pro →
                      </button>
                    )}
                    <button
                      onClick={() => { logout(); setUserMenuOpen(false); }}
                      className="flex w-full cursor-pointer items-center gap-2 px-4 py-2.5 text-xs text-base-muted hover:bg-base-surface2 transition-colors"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <a
                  href="/login"
                  className="cursor-pointer rounded-lg border border-base-border bg-white px-4 py-2.5 text-xs font-semibold text-base-text shadow-card transition-all hover:bg-base-surface2"
                >
                  Sign In
                </a>
                <button
                  onClick={() => setModalOpen(true)}
                  className="cursor-pointer rounded-lg bg-blue-royal px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-blue-900/20 transition-all hover:bg-blue-deep"
                >
                  Unlock Pro
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Click-away to close user menu */}
      {userMenuOpen && (
        <div className="fixed inset-0 z-30" onClick={() => setUserMenuOpen(false)} />
      )}

      {usingMock && !loading && (
        <div className="border-b border-amber-200 bg-amber-50 px-6 py-2 text-center text-xs text-amber-700">
          ⚠ Sample data shown - connect <code className="rounded bg-amber-100 px-1">server/.env</code> to see live fixtures
        </div>
      )}

      <main>
        <Hero />

        <div className="mx-auto max-w-6xl px-6 py-14 lg:px-8 space-y-14">

          {/* Free pick */}
          <section id="free-pick">
            <div className="mb-5 flex items-center justify-between border-b border-base-border pb-4">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-light text-xs font-black text-blue-royal">01</span>
                <h2 className="text-base font-black uppercase tracking-wider text-blue-deep">Free Calculated Edge</h2>
                <span className="flex items-center gap-1.5 rounded-full border border-ev/30 bg-ev/10 px-2.5 py-0.5 font-mono text-[9px] font-bold text-ev">
                  <span className="h-1.5 w-1.5 rounded-full bg-ev animate-pulse-dot" />LIVE
                </span>
              </div>
              <span className="text-xs text-base-muted">Proof-of-concept · Updated every 10 min</span>
            </div>
            <FreeBetCard pick={data?.freePick} loading={loading} />
          </section>

          {/* Pro board */}
          <section id="pro-board">
            <div className="mb-5 flex items-center justify-between border-b border-base-border pb-4">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-light text-xs font-black text-blue-royal">02</span>
                <h2 className="text-base font-black uppercase tracking-wider text-blue-deep">Premium Edge Ledger</h2>
                {user?.is_pro ? (
                  <span className="rounded-full border border-ev/30 bg-ev/10 px-2.5 py-0.5 text-[10px] font-semibold text-ev">
                    ✓ Pro Unlocked
                  </span>
                ) : (
                  <span className="rounded-full border border-base-border bg-base-surface2 px-2.5 py-0.5 text-[10px] font-semibold text-base-muted">
                    Pro Only
                  </span>
                )}
              </div>
              <span className="text-xs text-base-muted">All major leagues &amp; cups</span>
            </div>
            <ProLockedBoard
              proBoard={user?.is_pro ? proBoard : null}
              proStats={data?.proStats}
              onUnlock={() => setModalOpen(true)}
              loading={loading || (user?.is_pro && proLoading)}
            />
          </section>

          {/* Calculator */}
          <section id="calculator">
            <div className="mb-5 flex items-center justify-between border-b border-base-border pb-4">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-light text-xs font-black text-blue-royal">03</span>
                <h2 className="text-base font-black uppercase tracking-wider text-blue-deep">Quantitative Tools</h2>
              </div>
              <span className="text-xs text-base-muted">No signup required</span>
            </div>
            <EdgeCalculator />
          </section>

          {/* CTA banner — hide if user is already Pro */}
          {!user?.is_pro && (
            <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-blue-deep to-blue-royal p-10 text-center shadow-strong sm:p-14">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-blue-200 mb-3">CalcoBetAI Pro</p>
              <h2 className="text-2xl font-black text-white sm:text-3xl max-w-xl mx-auto leading-tight">
                Stop Relying on Gut Feeling. Trade with Mathematical Certainty.
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-sm text-blue-200">
                Access 142+ daily +EV edges across every major league - backed by AI probability models, not tipster opinion.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <button
                  onClick={() => setModalOpen(true)}
                  className="cursor-pointer rounded-lg bg-white px-8 py-3.5 text-sm font-bold text-blue-royal shadow-lg transition-all hover:shadow-xl hover:brightness-105"
                >
                  Unlock Pro - $20/mo
                </button>
                <span className="text-sm text-blue-200">7-day money-back guarantee</span>
              </div>
            </section>
          )}
        </div>
      </main>

      <footer className="border-t border-base-border bg-white px-6 py-6 lg:px-8">
        <div className="mx-auto max-w-6xl flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-base-muted">
            CalcoBetAI provides statistical analysis of publicly available football odds only. 18+/21+ where applicable. Not affiliated with any sportsbook.
          </p>
          <p className="text-xs text-base-muted shrink-0">© {new Date().getFullYear()} CalcoBetAI Analytics</p>
        </div>
      </footer>

      <PaywallModal open={modalOpen} onClose={() => setModalOpen(false)} />
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
