import { useState } from "react";
import Hero from "./components/Hero";
import FreeBetCard from "./components/FreeBetCard";
import ProLockedBoard from "./components/ProLockedBoard";
import EdgeCalculator from "./components/EdgeCalculator";
import PaywallModal from "./components/PaywallModal";
import OddsFormatToggle from "./components/OddsFormatToggle";
import { OddsFormatProvider } from "./context/OddsFormatContext";
import { usePicks } from "./hooks/usePicks";
import { IconBolt, IconShield } from "./components/Icons";

export default function App() {
  const [modalOpen, setModalOpen] = useState(false);
  const { data, usingMock, loading } = usePicks();

  return (
    <OddsFormatProvider>
      <div className="min-h-screen bg-base-bg font-sans text-base-text">

        {/* Finance-style coloured top accent bar */}
        <div className="top-bar h-[3px] w-full" />

        <header className="sticky top-0 z-40 border-b border-base-border bg-base-bg/90 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3.5 lg:px-8">

            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-ev/10 ring-1 ring-ev/20">
                <IconBolt className="w-4 h-4 text-ev" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-[15px] font-bold tracking-tight text-base-text">EdgeFinder</span>
                <span className="text-[10px] font-medium uppercase tracking-widest text-base-muted">Analytics</span>
              </div>
            </div>

            <nav className="hidden items-center gap-7 text-sm text-base-muted lg:flex">
              <a href="#free-pick" className="transition-colors duration-200 hover:text-base-text">Daily Signal</a>
              <a href="#pro-board" className="transition-colors duration-200 hover:text-base-text">Pro Board</a>
              <a href="#calculator" className="transition-colors duration-200 hover:text-base-text">Calculator</a>
            </nav>

            <div className="flex items-center gap-3">
              <OddsFormatToggle className="hidden sm:inline-flex" />
              <button
                onClick={() => setModalOpen(true)}
                className="cursor-pointer rounded bg-ev px-4 py-2 text-sm font-semibold text-base-bg shadow-ev-glow transition-all duration-200 hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ev"
              >
                Unlock Pro
              </button>
            </div>
          </div>
        </header>

        {usingMock && !loading && (
          <div className="border-b border-amber-500/20 bg-amber-500/10 px-6 py-2 text-center text-xs text-amber-300">
            Showing sample data &mdash; connect a live odds feed in{" "}
            <code className="rounded bg-black/30 px-1">server/.env</code> to see today&apos;s real fixtures.
          </div>
        )}

        <main>
          <Hero />

          <section id="free-pick" className="mx-auto max-w-4xl px-6 py-16 lg:px-8">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-ev">Daily Signal</p>
                <h2 className="mt-0.5 text-xl font-bold text-base-text">Best +EV Pick Today</h2>
              </div>
              <span className="flex items-center gap-1.5 rounded border border-base-border bg-base-surface px-2.5 py-1 text-[11px] font-medium text-base-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-ev animate-pulse-dot" />
                Live odds
              </span>
            </div>
            <FreeBetCard pick={data?.freePick} loading={loading} />
          </section>

          <section id="pro-board" className="mx-auto max-w-4xl px-6 pb-16 lg:px-8">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-pro">Pro Access</p>
                <h2 className="mt-0.5 text-xl font-bold text-base-text">Full Market Board</h2>
              </div>
              <span className="text-xs text-base-muted">Every major league &amp; cup</span>
            </div>
            <ProLockedBoard proBoard={data?.proBoard} onUnlock={() => setModalOpen(true)} loading={loading} />
          </section>

          <section className="mx-auto max-w-4xl px-6 pb-16 lg:px-8">
            <EdgeCalculator />
          </section>

          {/* CTA strip */}
          <section className="mx-auto max-w-4xl px-6 pb-20 lg:px-8">
            <div className="relative overflow-hidden rounded-lg border border-base-border bg-base-surface px-8 py-10 text-center shadow-panel">
              <div className="absolute inset-0 hero-grid opacity-60 pointer-events-none" />
              <div className="absolute -top-16 left-1/2 h-32 w-96 -translate-x-1/2 rounded-full bg-ev/10 blur-3xl pointer-events-none" />
              <div className="relative">
                <span className="flex h-12 w-12 items-center justify-center rounded bg-ev/10 ring-1 ring-ev/20 mx-auto">
                  <IconShield className="w-5 h-5 text-ev" />
                </span>
                <h2 className="mt-5 text-2xl font-bold text-base-text sm:text-3xl">
                  The math is free. The full board is $20/month.
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-sm text-base-muted">
                  No parlays. No tipster hype. Just de-vigged probability models across every major
                  league and cup, and the bets where the numbers say you have the edge.
                </p>
                <button
                  onClick={() => setModalOpen(true)}
                  className="mt-6 cursor-pointer rounded bg-ev px-7 py-3 text-sm font-semibold text-base-bg shadow-ev-glow transition-all duration-200 hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ev"
                >
                  Unlock Pro &mdash; $20/mo
                </button>
              </div>
            </div>
          </section>
        </main>

        <footer className="border-t border-base-border px-6 py-8 lg:px-8">
          <div className="mx-auto max-w-6xl flex flex-col items-center gap-2 text-center text-xs text-base-muted sm:flex-row sm:justify-between sm:text-left">
            <p>
              EdgeFinder provides statistical analysis of publicly available football odds only.
              18+/21+ where applicable. Bet responsibly. Not affiliated with any sportsbook.
            </p>
            <p className="shrink-0">&copy; {new Date().getFullYear()} EdgeFinder Analytics</p>
          </div>
        </footer>

        <PaywallModal open={modalOpen} onClose={() => setModalOpen(false)} />
      </div>
    </OddsFormatProvider>
  );
}
