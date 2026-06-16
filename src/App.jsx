import { useState } from "react";
import Hero from "./components/Hero";
import FreeBetCard from "./components/FreeBetCard";
import ProLockedBoard from "./components/ProLockedBoard";
import EdgeCalculator from "./components/EdgeCalculator";
import PaywallModal from "./components/PaywallModal";
import OddsFormatToggle from "./components/OddsFormatToggle";
import { OddsFormatProvider } from "./context/OddsFormatContext";
import { usePicks } from "./hooks/usePicks";

export default function App() {
  const [modalOpen, setModalOpen] = useState(false);
  const { data, usingMock, loading } = usePicks();

  return (
    <OddsFormatProvider>
      <div className="min-h-screen bg-base-bg font-sans text-base-text">

        <div className="top-bar h-[3px] w-full" />

        <header className="sticky top-0 z-40 border-b border-base-border bg-base-bg/90 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3 lg:px-8">

            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-ev text-white font-black text-sm">
                EF
              </div>
              <div>
                <span className="block text-sm font-bold tracking-tight text-base-text">EdgeFinder</span>
                <span className="block text-[9px] font-semibold uppercase tracking-[0.18em] text-base-muted">Analytics</span>
              </div>
            </div>

            <nav className="hidden items-center gap-7 text-xs font-semibold text-base-muted lg:flex">
              <a href="#free-pick"  className="transition-colors hover:text-base-text">Daily Signal</a>
              <a href="#pro-board"  className="transition-colors hover:text-base-text">Pro Board</a>
              <a href="#calculator" className="transition-colors hover:text-base-text">Calculator</a>
            </nav>

            <div className="flex items-center gap-3">
              <OddsFormatToggle className="hidden sm:inline-flex" />
              <button
                onClick={() => setModalOpen(true)}
                className="cursor-pointer rounded-sm bg-ev px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-ev-glow transition-all hover:brightness-110"
              >
                Unlock Pro
              </button>
            </div>
          </div>
        </header>

        {usingMock && !loading && (
          <div className="border-b border-amber-200 bg-amber-50 px-6 py-2 text-center font-mono text-[11px] text-amber-700">
            ⚠ Sample data — connect <code className="rounded bg-amber-100 px-1">server/.env</code> to see live fixtures
          </div>
        )}

        <main>
          <Hero />

          <div className="mx-auto max-w-6xl px-6 lg:px-8">

            <section id="free-pick" className="py-14">
              <div className="mb-5 flex items-center justify-between border-b border-base-border pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-base-muted">01</span>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-base-text">Daily Signal</h2>
                  <span className="flex items-center gap-1.5 rounded-full border border-ev/30 bg-ev/5 px-2.5 py-0.5 font-mono text-[9px] font-bold text-ev">
                    <span className="h-1.5 w-1.5 rounded-full bg-ev animate-pulse-dot" />LIVE
                  </span>
                </div>
                <span className="text-[11px] text-base-muted">Best mathematically-verified pick today</span>
              </div>
              <FreeBetCard pick={data?.freePick} loading={loading} />
            </section>

            <section id="pro-board" className="pb-14">
              <div className="mb-5 flex items-center justify-between border-b border-base-border pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-base-muted">02</span>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-base-text">Full Market Board</h2>
                </div>
                <span className="text-[11px] text-base-muted">All major leagues &amp; cups</span>
              </div>
              <ProLockedBoard proBoard={data?.proBoard} onUnlock={() => setModalOpen(true)} loading={loading} />
            </section>

            <section id="calculator" className="pb-14">
              <div className="mb-5 flex items-center justify-between border-b border-base-border pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-base-muted">03</span>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-base-text">Quantitative Tools</h2>
                </div>
                <span className="text-[11px] text-base-muted">No signup required</span>
              </div>
              <EdgeCalculator />
            </section>

            <section className="pb-20">
              <div className="relative overflow-hidden rounded-lg border border-ev/20 bg-ev px-8 py-12 text-center shadow-ev-glow sm:px-12">
                <div className="absolute inset-0 hero-grid opacity-30 pointer-events-none" />
                <div className="relative">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-blue-200 mb-3">EdgeFinder Pro</p>
                  <h2 className="text-2xl font-extrabold text-white sm:text-3xl">
                    The math is free. The full board is $20/month.
                  </h2>
                  <p className="mx-auto mt-3 max-w-xl text-sm text-blue-100">
                    No parlays. No tipster hype. De-vigged probability models across every major
                    league and cup — only the bets where the numbers say you have the edge.
                  </p>
                  <button
                    onClick={() => setModalOpen(true)}
                    className="mt-7 cursor-pointer rounded-sm bg-white px-8 py-3 text-sm font-bold uppercase tracking-wider text-ev shadow-lg transition-all hover:brightness-105"
                  >
                    Unlock Pro — $20/mo
                  </button>
                </div>
              </div>
            </section>
          </div>
        </main>

        <footer className="border-t border-base-border bg-base-surface px-6 py-6 lg:px-8">
          <div className="mx-auto max-w-6xl flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-base-muted">
              EdgeFinder provides statistical analysis of publicly available football odds only.
              18+/21+ where applicable. Not affiliated with any sportsbook.
            </p>
            <p className="text-xs text-base-muted shrink-0">© {new Date().getFullYear()} EdgeFinder Analytics</p>
          </div>
        </footer>

        <PaywallModal open={modalOpen} onClose={() => setModalOpen(false)} />
      </div>
    </OddsFormatProvider>
  );
}
