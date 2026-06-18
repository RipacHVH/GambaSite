import { useState } from "react";
import { API_URL } from "../context/AuthContext";

export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState("idle"); // idle | loading | done | error

  async function subscribe(e) {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    setState("loading");
    try {
      const res = await fetch(`${API_URL}/api/newsletter/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      setState("done");
    } catch {
      setState("error");
    }
  }

  return (
    <div style={{ background: "rgba(245,158,11,0.04)", borderTop: "1px solid rgba(245,158,11,0.12)", borderBottom: "1px solid rgba(245,158,11,0.12)" }}>
      <div className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
          {/* Left */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="h-2 w-2 rounded-full bg-ev animate-pulse-dot" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(245,158,11,0.7)" }}>
                Free Daily Pick
              </span>
            </div>
            <h3 className="text-lg font-black text-white leading-snug">
              Get tomorrow's +EV pick in your inbox
            </h3>
            <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
              One email per day. The match, the pick, the edge %. No account needed.
            </p>
          </div>

          {/* Right: form */}
          <div className="w-full sm:w-auto sm:min-w-[320px]">
            {state === "done" ? (
              <div className="rounded-xl px-5 py-4 text-center"
                style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)" }}>
                <p className="text-sm font-bold" style={{ color: "#10B981" }}>✓ You're in — check your inbox</p>
                <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>Unsubscribe any time from any email.</p>
              </div>
            ) : (
              <form onSubmit={subscribe} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="flex-1 min-w-0 rounded-xl px-4 py-3 text-sm outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    border: state === "error" ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(255,255,255,0.15)",
                    color: "white",
                  }}
                  onFocus={e => e.target.style.border = "1px solid rgba(245,158,11,0.5)"}
                  onBlur={e => e.target.style.border = state === "error" ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(255,255,255,0.15)"}
                />
                <button
                  type="submit"
                  disabled={state === "loading"}
                  className="shrink-0 cursor-pointer rounded-xl px-5 py-3 text-sm font-bold text-white transition-all hover:brightness-110 disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg,#F59E0B,#D97706)", boxShadow: "0 4px 16px rgba(245,158,11,0.25)" }}>
                  {state === "loading" ? "…" : "Subscribe"}
                </button>
              </form>
            )}
            {state === "error" && (
              <p className="mt-1.5 text-xs" style={{ color: "rgba(239,68,68,0.8)" }}>Something went wrong — try again.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
