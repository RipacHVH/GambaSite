import { useEffect, useRef } from "react";
import { IconCheck, IconClose, IconBolt } from "./Icons";

const FEATURES = [
  "All daily +EV picks (5–12 per day across every competition)",
  "Live arbitrage scanner across 12+ sportsbooks",
  "Personal bankroll tracker with ROI history",
  "Instant email + SMS alerts when an edge hits your threshold",
  "Closing line value (CLV) tracking on every bet you log",
  "Cancel anytime, no contracts",
];

export default function PaywallModal({ open, onClose }) {
  const closeBtnRef = useRef(null);
  const dialogRef   = useRef(null);

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
        const last  = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
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
        className="absolute inset-0 bg-black/75 backdrop-blur-sm cursor-pointer"
      />

      <div
        ref={dialogRef}
        className="relative w-full max-w-2xl rounded border border-base-border bg-base-surface shadow-panel overflow-hidden"
      >
        {/* Top accent bar */}
        <div className="top-bar h-[3px] w-full" />

        {/* Subtle glow */}
        <div className="absolute -top-20 -right-20 h-48 w-48 rounded-full bg-ev/10 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative flex items-start justify-between gap-4 border-b border-base-border bg-base-surface2/50 px-6 py-5 sm:px-8">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded border border-pro/25 bg-pro/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-pro">
              <IconBolt className="w-3 h-3" />
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
            className="cursor-pointer rounded p-2 text-base-muted transition-colors duration-200 hover:bg-base-surface hover:text-base-text"
          >
            <IconClose />
          </button>
        </div>

        {/* Body */}
        <div className="grid gap-6 px-6 py-6 sm:grid-cols-[1.2fr_1fr] sm:px-8">
          <ul className="space-y-3">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-3 text-sm text-base-text/90">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-ev/20 bg-ev/10 text-ev">
                  <IconCheck className="w-3.5 h-3.5" />
                </span>
                {f}
              </li>
            ))}
          </ul>

          {/* Pricing card */}
          <div className="rounded border border-ev/25 bg-base-surface2 p-5 shadow-ev-glow">
            <p className="text-[10px] font-bold uppercase tracking-widest text-base-muted">EdgeFinder Pro</p>
            <p className="mt-3 flex items-baseline gap-1">
              <span className="font-mono text-4xl font-extrabold text-base-text">$20</span>
              <span className="text-sm text-base-muted">/ month</span>
            </p>
            <p className="mt-0.5 text-xs text-base-muted">Billed monthly. Cancel anytime.</p>

            <button className="mt-5 w-full cursor-pointer rounded bg-ev px-4 py-3 text-sm font-semibold text-base-bg shadow-ev-glow transition-all duration-200 hover:brightness-110">
              Start Pro — $20/mo
            </button>
            <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-base-muted">
              <IconCheck className="w-3 h-3 text-ev" />
              7-day money-back guarantee
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
