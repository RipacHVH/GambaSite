import { useEffect, useRef } from "react";
import { IconCheck, IconClose, IconBolt } from "./Icons";

const FEATURES = [
  "All daily +EV picks (5-12 per day, every sport)",
  "Live arbitrage scanner across 12+ sportsbooks",
  "Personal bankroll tracker with ROI history",
  "Instant email + SMS alerts when an edge hits your threshold",
  "Closing line value (CLV) tracking on every bet you log",
  "Cancel anytime, no contracts",
];

export default function PaywallModal({ open, onClose }) {
  const closeBtnRef = useRef(null);
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    closeBtnRef.current?.focus();

    function onKeyDown(e) {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-fade-up"
      role="dialog"
      aria-modal="true"
      aria-labelledby="paywall-title"
    >
      <button
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm cursor-pointer"
      />

      <div
        ref={dialogRef}
        className="relative w-full max-w-2xl rounded-2xl border border-base-border bg-base-surface shadow-card overflow-hidden"
      >
        <div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-ev/20 blur-3xl pointer-events-none" />

        <div className="relative flex items-start justify-between gap-4 border-b border-base-border px-6 py-5 sm:px-8">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-pro/10 px-3 py-1 text-xs font-semibold text-pro">
              <IconBolt className="w-3.5 h-3.5" />
              Pro Membership
            </span>
            <h2 id="paywall-title" className="mt-3 text-2xl font-bold text-base-text sm:text-3xl">
              Unlock every edge, every day
            </h2>
            <p className="mt-1 text-sm text-base-muted">
              The math doesn&apos;t pause for the free tier. Pro members see the full board before the lines move.
            </p>
          </div>
          <button
            ref={closeBtnRef}
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer rounded-lg p-2 text-base-muted transition-colors duration-200 hover:bg-base-surface2 hover:text-base-text"
          >
            <IconClose />
          </button>
        </div>

        <div className="grid gap-6 px-6 py-6 sm:grid-cols-[1.2fr_1fr] sm:px-8">
          <ul className="space-y-3">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-3 text-sm text-base-text/90">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ev/15 text-ev">
                  <IconCheck className="w-3.5 h-3.5" />
                </span>
                {f}
              </li>
            ))}
          </ul>

          <div className="rounded-xl border border-ev/30 bg-gradient-to-b from-base-surface2 to-base-surface p-5 shadow-ev-glow">
            <p className="text-xs font-semibold uppercase tracking-wide text-base-muted">EdgeFinder Pro</p>
            <p className="mt-2 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-base-text">$20</span>
              <span className="text-sm text-base-muted">/ month</span>
            </p>
            <p className="mt-1 text-xs text-base-muted">Billed monthly. Cancel anytime.</p>

            <button className="mt-5 w-full cursor-pointer rounded-lg bg-ev px-4 py-3 text-sm font-semibold text-base-bg shadow-ev-glow transition-transform duration-200 hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ev">
              Start Pro &mdash; $20/mo
            </button>
            <p className="mt-3 text-center text-[11px] text-base-muted">
              7-day money-back guarantee
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
