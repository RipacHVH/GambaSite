import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export default function AuthPage({ defaultTab = "login" }) {
  const { login, register, user } = useAuth();
  const [tab, setTab]           = useState(defaultTab);
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [error, setError]       = useState("");
  const [busy, setBusy]         = useState(false);

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
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const inputStyle = {
    width: "100%",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "10px",
    padding: "12px 16px",
    fontSize: "14px",
    color: "white",
    outline: "none",
    transition: "border-color 0.2s",
  };

  return (
    <div className="min-h-screen font-sans flex flex-col" style={{ background: "linear-gradient(135deg, #060D1A 0%, #0B1628 60%, #0D1F3C 100%)" }}>
      {/* Top accent bar */}
      <div className="top-bar h-[3px] w-full" />

      {/* Header */}
      <header className="px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <a href="/">
          <img src="/logo.svg" alt="CalcoBet" className="h-10 w-auto" />
        </a>
      </header>

      {/* Main */}
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">

          {/* Card */}
          <div className="overflow-hidden rounded-2xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(12px)" }}>

            {/* Gold top bar */}
            <div className="h-1" style={{ background: "linear-gradient(90deg, #F59E0B, #D97706)" }} />

            {/* Tabs */}
            <div className="flex" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              {[["login", "Sign In"], ["register", "Create Account"]].map(([id, label]) => (
                <button key={id} onClick={() => { setTab(id); setError(""); }}
                  className="flex-1 cursor-pointer py-4 text-sm font-bold transition-colors"
                  style={tab === id
                    ? { color: "#F59E0B", borderBottom: "2px solid #F59E0B", background: "rgba(245,158,11,0.06)" }
                    : { color: "rgba(255,255,255,0.4)", borderBottom: "2px solid transparent" }}>
                  {label}
                </button>
              ))}
            </div>

            <div className="px-8 py-8">
              <h1 className="text-2xl font-black text-white">
                {tab === "login" ? "Welcome back" : "Create your account"}
              </h1>
              <p className="mt-1.5 text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
                {tab === "login"
                  ? "Sign in to access your Pro picks and dashboard."
                  : "Sign up free. Upgrade to Pro anytime."}
              </p>

              <form onSubmit={handleSubmit} className="mt-7 space-y-5">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>Email address</span>
                  <input
                    type="email" required autoComplete="email"
                    value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = "rgba(245,158,11,0.6)"}
                    onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.12)"}
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>Password</span>
                  <input
                    type="password" required
                    autoComplete={tab === "login" ? "current-password" : "new-password"}
                    value={password} onChange={e => setPassword(e.target.value)}
                    placeholder={tab === "register" ? "At least 8 characters" : "••••••••"}
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = "rgba(245,158,11,0.6)"}
                    onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.12)"}
                  />
                </label>

                {tab === "register" && (
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>Confirm password</span>
                    <input
                      type="password" required autoComplete="new-password"
                      value={confirm} onChange={e => setConfirm(e.target.value)}
                      placeholder="••••••••"
                      style={inputStyle}
                      onFocus={e => e.target.style.borderColor = "rgba(245,158,11,0.6)"}
                      onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.12)"}
                    />
                  </label>
                )}

                {error && (
                  <p className="rounded-lg px-4 py-3 text-sm" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#F87171" }}>
                    {error}
                  </p>
                )}

                <button type="submit" disabled={busy}
                  className="w-full cursor-pointer rounded-xl py-3.5 text-sm font-bold text-white transition-all hover:brightness-110 disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)", boxShadow: "0 4px 20px rgba(245,158,11,0.3)" }}>
                  {busy ? "Please wait…"
                    : tab === "login" ? "Sign In →"
                    : "Create Account →"}
                </button>

                {tab === "login" ? (
                  <p className="text-center text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
                    Don't have an account?{" "}
                    <button type="button" onClick={() => { setTab("register"); setError(""); }}
                      className="cursor-pointer font-semibold hover:opacity-80 transition-opacity"
                      style={{ color: "#F59E0B" }}>
                      Create one free
                    </button>
                  </p>
                ) : (
                  <p className="text-center text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
                    Already have an account?{" "}
                    <button type="button" onClick={() => { setTab("login"); setError(""); }}
                      className="cursor-pointer font-semibold hover:opacity-80 transition-opacity"
                      style={{ color: "#F59E0B" }}>
                      Sign in
                    </button>
                  </p>
                )}
              </form>
            </div>
          </div>

          <p className="mt-6 text-center text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
            By continuing you agree to our Terms of Service. No credit card required to sign up.
          </p>
        </div>
      </main>
    </div>
  );
}
