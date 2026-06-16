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
        const focusables = dialogRef.current.querySelectorAll('button, [href], input, [tabindex]:not([tabindex="-1"])');
        if (!focusables.length) return;
        const first = focusables[0], last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKeyDown); document.body.style.overflow = ""; };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-fade-up"
      role="dialog" aria-modal="true" aria-labelledby="paywall-title">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm cursor-pointer" />

      <div ref={dialogRef} className="relative w-full max-w-2xl rounded-lg border border-base-border bg-white shadow-panel overflow-hidden">
        {/* Top accent */}
        <div className="h-1 bg-gradient-to-r from-ev to-pro" />

        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-base-border bg-base-surface2/50 px-6 py-5 sm:px-8">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-ev/20 bg-ev/5 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-ev">
              <IconBolt className="w-3 h-3" /> Pro Membership
            </span>
            <h2 id="paywall-title" className="mt-3 text-2xl font-bold text-base-text sm:text-3xl">
              Unlock every edge, every day
            </h2>
            <p className="mt-1 text-sm text-base-muted">
              The math doesn't pause for the free tier. Pro members see the full board before the lines move.
            </p>
          </div>
          <button ref={closeBtnRef} onClick={onClose} aria-label="Close"
            className="cursor-pointer rounded-sm p-2 text-base-muted transition-colors hover:bg-base-surface2 hover:text-base-text">
            <IconClose />
          </button>
        </div>

        {/* Body */}
        <div className="grid gap-6 px-6 py-6 sm:grid-cols-[1.2fr_1fr] sm:px-8">
          <ul className="space-y-3">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-3 text-sm text-base-text">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ev/10 text-ev">
                  <IconCheck className="w-3 h-3" />
                </span>
                {f}
              </li>
            ))}
          </ul>

          {/* Pricing */}
          <div className="rounded-lg border border-base-border bg-base-surface2/50 p-5">
            <div className="h-0.5 -mx-5 -mt-5 mb-5 bg-ev rounded-t-lg" />
            <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-base-muted">EdgeFinder Pro</p>
            <p className="mt-3 flex items-baseline gap-1">
              <span className="font-mono text-4xl font-extrabold text-base-text">$20</span>
              <span className="text-sm text-base-muted">/ month</span>
            </p>
            <p className="mt-0.5 text-xs text-base-muted">Billed monthly. Cancel anytime.</p>
            <button className="mt-5 w-full cursor-pointer rounded-sm bg-ev py-3 text-sm font-bold text-white shadow-ev-glow transition-all hover:brightness-110">
              Start Pro — $20/mo
            </button>
            <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-base-muted">
              <IconCheck className="w-3 h-3 text-ev" /> 7-day money-back guarantee
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
