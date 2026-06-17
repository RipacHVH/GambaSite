import { useEffect, useRef, useState } from "react";
import { IconCheck, IconClose, IconBolt } from "./Icons";
import { useAuth, API_URL } from "../context/AuthContext";

const FEATURES = [
  "Full daily +EV picks board (5–12 per day, every competition)",
  "Live arbitrage scanner across 12+ sportsbooks",
  "Personal bankroll tracker with ROI history",
  "Instant email alerts when an edge hits your threshold",
  "Closing line value (CLV) tracking on every logged bet",
  "Cancel anytime - no long-term contracts",
];

export default function PaywallModal({ open, onClose }) {
  const { user, apiFetch } = useAuth();
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const closeBtnRef = useRef(null);
  const dialogRef   = useRef(null);

  useEffect(() => {
    if (!open) return;
    closeBtnRef.current?.focus();
    function onKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKeyDown); document.body.style.overflow = ""; };
  }, [open, onClose]);

  if (!open) return null;

  async function handleSubscribe() {
    if (!user) { window.location.href = "/login"; return; }
    if (user.is_pro) { onClose(); return; }
    setCheckoutBusy(true);
    setCheckoutError("");
    try {
      const { url } = await apiFetch("/api/stripe/create-checkout-session", { method: "POST" });
      window.location.href = url;
    } catch (err) {
      setCheckoutError(err.message);
      setCheckoutBusy(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-fade-up"
        role="dialog" aria-modal="true" aria-labelledby="paywall-title">
        <button aria-label="Close" onClick={onClose}
          className="absolute inset-0 bg-blue-deep/40 backdrop-blur-sm cursor-pointer" />

        <div ref={dialogRef} className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-base-border bg-white shadow-strong">
          <div className="h-1.5 w-full bg-gradient-to-r from-blue-deep via-blue-royal to-ev" />

          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-base-border px-6 py-6 sm:px-8">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider" style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", color: "#D97706" }}>
                <IconBolt className="w-3 h-3" /> Pro Membership
              </span>
              <h2 id="paywall-title" className="mt-4 text-2xl font-black text-blue-deep sm:text-3xl">
                {user?.is_pro ? "You're a Pro member ✓" : "Unlock Every Edge, Every Day"}
              </h2>
              <p className="mt-1.5 text-sm text-base-muted">
                {user?.is_pro
                  ? "Your Pro access is active. The full board is unlocked."
                  : "The algorithm never sleeps. Pro members access the full board before the market corrects."}
              </p>
              {user && !user.is_pro && (
                <p className="mt-2 text-xs text-base-muted">
                  Signed in as <span className="font-semibold text-blue-royal">{user.email}</span>
                </p>
              )}
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
                {["Full market board daily", "All +EV edges", "Live odds monitoring", "Priority support"].map((f) => (
                  <div key={f} className="flex items-center gap-2 text-xs text-blue-deep">
                    <IconCheck className="w-3.5 h-3.5 text-ev shrink-0" /> {f}
                  </div>
                ))}
              </div>

              {checkoutError && (
                <p className="mt-3 rounded-lg border border-neg/20 bg-neg/10 px-3 py-2 text-xs text-neg">{checkoutError}</p>
              )}

              {user?.is_pro ? (
                <button onClick={onClose}
                  className="mt-5 w-full cursor-pointer rounded-lg bg-ev py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:opacity-90">
                  ✓ Access Your Pro Board
                </button>
              ) : (
                <button onClick={handleSubscribe} disabled={checkoutBusy}
                  className="mt-5 w-full cursor-pointer rounded-xl py-3.5 text-sm font-bold text-white transition-all hover:brightness-110 disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg,#F59E0B,#D97706)", boxShadow: "0 4px 20px rgba(245,158,11,0.35)" }}>
                  {checkoutBusy ? "Redirecting to checkout…" : user ? "Subscribe - $20/mo →" : "Sign Up & Subscribe →"}
                </button>
              )}

              <p className="mt-3 text-center text-[11px] text-base-muted">
                {user ? "✓ 7-day money-back guarantee" : "Create a free account, then subscribe"}
              </p>
            </div>
          </div>
        </div>
      </div>

    </>
  );
}
