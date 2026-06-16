import { useEffect, useRef } from "react";
import { IconCheck, IconClose, IconBolt } from "./Icons";

const FEATURES = [
  "All daily +EV picks (5–12 per day, every competition)",
  "Live arbitrage scanner across 12+ sportsbooks",
  "Personal bankroll tracker with ROI history",
  "Instant email + SMS alerts when an edge hits your threshold",
  "Closing line value (CLV) tracking on every logged bet",
  "Cancel anytime — no long-term contracts",
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
        const els = dialogRef.current.querySelectorAll('button, [href], input, [tabindex]:not([tabindex="-1"])');
        if (!els.length) return;
        const first = els[0], last = els[els.length - 1];
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
      <button aria-label="Close" onClick={onClose}
        className="absolute inset-0 bg-blue-deep/40 backdrop-blur-sm cursor-pointer" />

      <div ref={dialogRef} className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-base-border bg-white shadow-strong">
        {/* Top gradient bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-deep via-blue-royal to-ev" />

        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-base-border px-6 py-6 sm:px-8">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-border bg-blue-light px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-royal">
              <IconBolt className="w-3 h-3" /> Pro Membership
            </span>
            <h2 id="paywall-title" className="mt-4 text-2xl font-black text-blue-deep sm:text-3xl">
              Unlock Every Edge, Every Day
            </h2>
            <p className="mt-1.5 text-sm text-base-muted">
              The algorithm never sleeps. Pro members access the full board before the market corrects.
            </p>
          </div>
          <button ref={closeBtnRef} onClick={onClose} aria-label="Close"
            className="cursor-pointer rounded-lg p-2 text-base-muted transition-colors hover:bg-base-surface2">
            <IconClose />
          </button>
        </div>

        {/* Body */}
        <div className="grid gap-6 px-6 py-6 sm:grid-cols-[1.2fr_1fr] sm:px-8">
          <ul className="space-y-3.5">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-3 text-sm text-base-text">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ev/15 text-ev">
                  <IconCheck className="w-3 h-3" />
                </span>
                {f}
              </li>
            ))}
          </ul>

          {/* Pricing card */}
          <div className="rounded-xl border border-blue-border bg-blue-light p-6">
            <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-blue-royal">CalcoBetAI Pro</p>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="font-mono text-5xl font-black text-blue-deep">$20</span>
              <span className="text-sm text-base-muted">/ month</span>
            </div>
            <p className="mt-1 text-xs text-base-muted">Billed monthly. Cancel anytime.</p>

            <div className="mt-5 space-y-2.5 border-t border-blue-border pt-4">
              {["Full market board daily", "142+ edges per day", "Live odds monitoring", "Priority support"].map((f) => (
                <div key={f} className="flex items-center gap-2 text-xs text-blue-deep">
                  <IconCheck className="w-3.5 h-3.5 text-ev shrink-0" /> {f}
                </div>
              ))}
            </div>

            <button className="mt-5 w-full cursor-pointer rounded-lg bg-blue-royal py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-900/20 transition-all hover:bg-blue-deep">
              Start Pro — $20/mo
            </button>
            <p className="mt-3 text-center text-[11px] text-base-muted">
              ✓ 7-day money-back guarantee
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
