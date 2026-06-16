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
        <header className="sticky top-0 z-40 border-b border-base-border bg-base-bg/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4 lg:px-8">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ev/15 text-ev">
                <IconBolt className="w-4 h-4" />
              </span>
              <span className="text-lg font-bold tracking-tight">EdgeFinder</span>
            </div>
            <nav className="hidden items-center gap-8 text-sm text-base-muted lg:flex">
              <a href="#free-pick" className="transition-colors duration-200 hover:text-base-text">
                Free Pick
              </a>
              <a href="#pro-board" className="transition-colors duration-200 hover:text-base-text">
                Pro Board
              </a>
              <a href="#calculator" className="transition-colors duration-200 hover:text-base-text">
                Calculator
              </a>
            </nav>
            <div className="flex items-center gap-3">
              <OddsFormatToggle className="hidden sm:inline-flex" />
              <button
                onClick={() => setModalOpen(true)}
                className="cursor-pointer rounded-lg bg-ev px-4 py-2 text-sm font-semibold text-base-bg transition-transform duration-200 hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ev"
              >
                Unlock Pro
              </button>
            </div>
          </div>
        </header>

        {usingMock && !loading && (
          <div className="border-b border-amber-500/20 bg-amber-500/10 px-6 py-2 text-center text-xs text-amber-300">
            Showing sample data &mdash; connect a live odds feed in{" "}
            <code className="rounded bg-black/30 px-1">server/.env</code> to see today&apos;s real
            fixtures.
          </div>
        )}

        <main>
          <Hero />

          <section id="free-pick" className="mx-auto max-w-4xl px-6 py-16 lg:px-8">
            <FreeBetCard pick={data?.freePick} loading={loading} />
          </section>

          <section id="pro-board" className="mx-auto max-w-4xl px-6 pb-16 lg:px-8">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-base-text sm:text-3xl">
                The Full Board Is Pro&apos;s Edge
              </h2>
              <p className="mt-2 text-sm text-base-muted">
                Every major league and cup, three calculated bets per match, updated all day.
              </p>
            </div>
            <ProLockedBoard proBoard={data?.proBoard} onUnlock={() => setModalOpen(true)} loading={loading} />
          </section>

          <section className="mx-auto max-w-4xl px-6 pb-16 lg:px-8">
            <EdgeCalculator />
          </section>

          <section className="mx-auto max-w-4xl px-6 pb-20 lg:px-8">
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-base-border bg-base-surface px-6 py-10 text-center shadow-card sm:px-12">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-pro/15 text-pro">
                <IconShield className="w-5 h-5" />
              </span>
              <h2 className="text-2xl font-bold text-base-text sm:text-3xl">
                The math is free. The full board is $20/month.
              </h2>
              <p className="max-w-xl text-sm text-base-muted">
                No parlays. No tipster hype. Just de-vigged probability models across every major
                league and cup, and the bets where the numbers say you have the edge.
              </p>
              <button
                onClick={() => setModalOpen(true)}
                className="mt-2 cursor-pointer rounded-lg bg-ev px-6 py-3 text-sm font-semibold text-base-bg shadow-ev-glow transition-transform duration-200 hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ev"
              >
                Unlock Pro &mdash; $20/mo
              </button>
            </div>
          </section>
        </main>

        <footer className="border-t border-base-border px-6 py-8 text-center text-xs text-base-muted lg:px-8">
          <p>
            EdgeFinder provides statistical analysis of publicly available football odds only.
            18+/21+ where applicable. Bet responsibly. Not affiliated with any sportsbook.
          </p>
          <p className="mt-1">&copy; {new Date().getFullYear()} EdgeFinder Analytics, Inc.</p>
        </footer>

        <PaywallModal open={modalOpen} onClose={() => setModalOpen(false)} />
      </div>
    </OddsFormatProvider>
  );
}
