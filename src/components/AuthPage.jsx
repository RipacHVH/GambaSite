import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export default function AuthPage({ defaultTab = "login" }) {
  const { login, register, user } = useAuth();
  const [tab, setTab]         = useState(defaultTab);
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [error, setError]       = useState("");
  const [busy, setBusy]         = useState(false);

  // If already logged in, send home
  useEffect(() => {
    if (user) window.location.href = "/";
  }, [user]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (tab === "register" && password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setBusy(true);
    try {
      if (tab === "login") await login(email, password);
      else await register(email, password);
      // auto-redirect — useEffect above handles it once user is set
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-base-bg font-sans flex flex-col">
      {/* Top accent bar */}
      <div className="top-bar h-[3px] w-full" />

      {/* Header */}
      <header className="border-b border-base-border bg-white px-6 py-4">
        <a href="/">
          <img src="/logo.png" alt="CalcoBet" className="h-10 w-auto" />
        </a>
      </header>

      {/* Main */}
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">

          {/* Card */}
          <div className="overflow-hidden rounded-2xl border border-base-border bg-white shadow-strong">
            <div className="h-1.5 w-full bg-gradient-to-r from-blue-deep via-blue-royal to-ev" />

            {/* Tabs */}
            <div className="flex border-b border-base-border">
              {[["login", "Sign In"], ["register", "Create Account"]].map(([id, label]) => (
                <button key={id} onClick={() => { setTab(id); setError(""); }}
                  className={`flex-1 cursor-pointer py-4 text-sm font-bold transition-colors ${
                    tab === id
                      ? "border-b-2 border-blue-royal text-blue-royal bg-blue-light/30"
                      : "text-base-muted hover:text-base-text"
                  }`}>
                  {label}
                </button>
              ))}
            </div>

            <div className="px-8 py-8">
              <h1 className="text-2xl font-black text-blue-deep">
                {tab === "login" ? "Welcome back" : "Create your account"}
              </h1>
              <p className="mt-1.5 text-sm text-base-muted">
                {tab === "login"
                  ? "Sign in to access your Pro picks and dashboard."
                  : "Sign up for free. Upgrade to Pro anytime."}
              </p>

              <form onSubmit={handleSubmit} className="mt-7 space-y-5">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-base-muted">Email address</span>
                  <input
                    type="email" required autoComplete="email"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-base-border bg-white px-4 py-3 text-sm text-base-text outline-none placeholder:text-base-muted/40 focus:border-blue-royal/60 focus:ring-2 focus:ring-blue-royal/10 transition-all"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-base-muted">Password</span>
                  <input
                    type="password" required
                    autoComplete={tab === "login" ? "current-password" : "new-password"}
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder={tab === "register" ? "At least 8 characters" : "••••••••"}
                    className="w-full rounded-lg border border-base-border bg-white px-4 py-3 text-sm text-base-text outline-none placeholder:text-base-muted/40 focus:border-blue-royal/60 focus:ring-2 focus:ring-blue-royal/10 transition-all"
                  />
                </label>

                {tab === "register" && (
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-base-muted">Confirm password</span>
                    <input
                      type="password" required autoComplete="new-password"
                      value={confirm} onChange={(e) => setConfirm(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-lg border border-base-border bg-white px-4 py-3 text-sm text-base-text outline-none placeholder:text-base-muted/40 focus:border-blue-royal/60 focus:ring-2 focus:ring-blue-royal/10 transition-all"
                    />
                  </label>
                )}

                {error && (
                  <p className="rounded-lg border border-neg/20 bg-neg/10 px-4 py-3 text-sm text-neg">{error}</p>
                )}

                <button type="submit" disabled={busy}
                  className="w-full cursor-pointer rounded-lg bg-blue-royal py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-900/20 transition-all hover:bg-blue-deep disabled:opacity-60">
                  {busy ? "Please wait…"
                    : tab === "login" ? "Sign In →"
                    : "Create Account & Sign In →"}
                </button>

                {tab === "login" ? (
                  <p className="text-center text-sm text-base-muted">
                    Don't have an account?{" "}
                    <button type="button" onClick={() => { setTab("register"); setError(""); }}
                      className="cursor-pointer font-semibold text-blue-royal hover:underline">
                      Create one free
                    </button>
                  </p>
                ) : (
                  <p className="text-center text-sm text-base-muted">
                    Already have an account?{" "}
                    <button type="button" onClick={() => { setTab("login"); setError(""); }}
                      className="cursor-pointer font-semibold text-blue-royal hover:underline">
                      Sign in
                    </button>
                  </p>
                )}
              </form>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-base-muted">
            By continuing you agree to our Terms of Service. No credit card required to sign up.
          </p>
        </div>
      </main>
    </div>
  );
}
