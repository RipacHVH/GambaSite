import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { IconClose } from "./Icons";

export default function AuthModal({ open, onClose, onSuccess, initialTab = "login" }) {
  const { login, register } = useAuth();
  const [tab, setTab]       = useState(initialTab);
  const [email, setEmail]   = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [error, setError]   = useState("");
  const [busy, setBusy]     = useState(false);
  const closeBtnRef         = useRef(null);
  const dialogRef           = useRef(null);

  useEffect(() => { if (open) { setError(""); setTab(initialTab); } }, [open, initialTab]);
  useEffect(() => { if (open) closeBtnRef.current?.focus(); }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open, onClose]);

  if (!open) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (tab === "register" && password !== confirm) {
      setError("Passwords do not match"); return;
    }
    setBusy(true);
    try {
      if (tab === "login") await login(email, password);
      else await register(email, password);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-up"
      role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <button aria-label="Close" onClick={onClose}
        className="absolute inset-0 bg-blue-deep/40 backdrop-blur-sm cursor-pointer" />

      <div ref={dialogRef} className="relative w-full max-w-md overflow-hidden rounded-2xl border border-base-border bg-white shadow-strong">
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-deep via-blue-royal to-ev" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-base-border">
          <div>
            <h2 id="auth-title" className="text-xl font-black text-blue-deep">
              {tab === "login" ? "Sign in to CalcoBetAI" : "Create your account"}
            </h2>
            <p className="text-xs text-base-muted mt-0.5">
              {tab === "login" ? "Access your Pro picks and dashboard" : "Start your 7-day free trial today"}
            </p>
          </div>
          <button ref={closeBtnRef} onClick={onClose} aria-label="Close"
            className="cursor-pointer rounded-lg p-2 text-base-muted hover:bg-base-surface2">
            <IconClose />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-base-border">
          {[["login", "Sign In"], ["register", "Create Account"]].map(([id, label]) => (
            <button key={id} onClick={() => { setTab(id); setError(""); }}
              className={`flex-1 cursor-pointer py-3 text-sm font-bold transition-colors ${
                tab === id
                  ? "border-b-2 border-blue-royal text-blue-royal"
                  : "text-base-muted hover:text-base-text"
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-base-muted">Email address</span>
            <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-base-border bg-white px-3 py-2.5 text-sm text-base-text outline-none placeholder:text-base-muted/40 focus:border-blue-royal/50 focus:ring-2 focus:ring-blue-royal/10 transition-all" />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-base-muted">Password</span>
            <input type="password" required autoComplete={tab === "login" ? "current-password" : "new-password"}
              value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder={tab === "register" ? "At least 8 characters" : "••••••••"}
              className="w-full rounded-lg border border-base-border bg-white px-3 py-2.5 text-sm text-base-text outline-none placeholder:text-base-muted/40 focus:border-blue-royal/50 focus:ring-2 focus:ring-blue-royal/10 transition-all" />
          </label>

          {tab === "register" && (
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-base-muted">Confirm password</span>
              <input type="password" required autoComplete="new-password"
                value={confirm} onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-base-border bg-white px-3 py-2.5 text-sm text-base-text outline-none placeholder:text-base-muted/40 focus:border-blue-royal/50 focus:ring-2 focus:ring-blue-royal/10 transition-all" />
            </label>
          )}

          {error && (
            <p className="rounded-lg border border-neg/20 bg-neg/10 px-4 py-2.5 text-sm text-neg">{error}</p>
          )}

          <button type="submit" disabled={busy}
            className="w-full cursor-pointer rounded-lg bg-blue-royal py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-900/20 transition-all hover:bg-blue-deep disabled:opacity-60">
            {busy ? "Please wait…" : tab === "login" ? "Sign In →" : "Create Account →"}
          </button>

          {tab === "register" && (
            <p className="text-center text-[11px] text-base-muted">
              By creating an account you agree to our Terms of Service. No credit card required to sign up.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
