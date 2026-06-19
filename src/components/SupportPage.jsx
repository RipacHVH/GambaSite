import { useState } from "react";
import { API_URL } from "../context/AuthContext";
import CalcoBetLogo from "./CalcoBetLogo";

const FAQS = [
  { q: "How are picks calculated?", a: "We collect odds from multiple bookmakers, remove their profit margin (de-vig), and calculate the true probability of each outcome. When the best available odds exceed that true probability, it's a positive expected value (+EV) bet." },
  { q: "How do I cancel my Pro subscription?", a: "Go to Settings → Manage Subscription. You can cancel anytime — your access continues until the end of the billing period." },
  { q: "Why is there no pick today?", a: "Picks are tied to the sports calendar. During international breaks or off-seasons, fewer games are available. The pick resets daily at 06:00 UTC." },
  { q: "What sports do you cover?", a: "Currently football (soccer) only — Premier League, La Liga, Bundesliga, Champions League, and major international tournaments." },
  { q: "I can't log in to my account.", a: "Try resetting your password via Settings, or contact us below with your registered email and we'll help." },
];

const SUBJECTS = [
  "Billing & Subscription",
  "Account Issue",
  "Pick Question",
  "Bug Report",
  "Other",
];

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

export default function SupportPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: SUBJECTS[0], message: "" });
  const [state, setState] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [openFaq, setOpenFaq] = useState(null);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function submit(e) {
    e.preventDefault();
    setState("loading");
    setErrorMsg("");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const r = await fetch(`${API_URL}/api/support`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        signal: controller.signal,
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Failed to send");
      setState("done");
    } catch (err) {
      setErrorMsg(err.name === "AbortError" ? "Request timed out — please try again." : err.message);
      setState("error");
    } finally {
      clearTimeout(timeout);
    }
  }

  return (
    <div className="min-h-screen font-sans flex flex-col" style={{ background: "linear-gradient(135deg, #060D1A 0%, #0B1628 60%, #0D1F3C 100%)" }}>
      <div className="top-bar h-[3px] w-full" />

      <header className="px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="mx-auto max-w-5xl lg:px-8 flex items-center justify-between">
          <a href="/"><CalcoBetLogo tileSize={36} textSize={23} taglineSize={8} gap={10} /></a>
          <a href="/" className="text-sm font-medium transition-opacity hover:opacity-70" style={{ color: "rgba(255,255,255,0.4)" }}>← Back</a>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-6 py-12 lg:px-8 flex-1">
        <div className="mb-10">
          <h1 className="text-3xl font-black text-white">Support</h1>
          <p className="mt-2 text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>We typically reply within 24 hours.</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_420px]">

          {/* FAQ */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: "#F59E0B" }}>Common Questions</p>
            <div className="space-y-2">
              {FAQS.map((faq, i) => (
                <div key={i} className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full cursor-pointer flex items-center justify-between px-5 py-4 text-left text-sm font-semibold text-white">
                    {faq.q}
                    <svg className="w-4 h-4 shrink-0 ml-3 transition-transform" style={{ transform: openFaq === i ? "rotate(180deg)" : "none", color: "rgba(255,255,255,0.3)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-4 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>{faq.a}</div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl p-5" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)" }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#F59E0B" }}>Email us directly</p>
              <a href="mailto:legal@calcobet.com" className="text-sm font-semibold text-white hover:opacity-80 transition-opacity">legal@calcobet.com</a>
              <p className="mt-1.5 text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>For billing, account issues, or anything urgent.</p>
            </div>
          </div>

          {/* Contact form */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: "#F59E0B" }}>Send a Message</p>

            <div className="overflow-hidden rounded-2xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(12px)" }}>
              <div className="h-1" style={{ background: "linear-gradient(90deg,#F59E0B,#D97706)" }} />

              {state === "done" ? (
                <div className="px-8 py-12 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full" style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)" }}>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="#10B981" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                  </div>
                  <h3 className="text-lg font-black text-white mb-2">Message sent!</h3>
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>We've sent a confirmation to your inbox. We'll reply within 24 hours.</p>
                  <button onClick={() => { setState("idle"); setForm({ name: "", email: "", subject: SUBJECTS[0], message: "" }); }}
                    className="mt-6 cursor-pointer rounded-xl px-5 py-2.5 text-sm font-semibold"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.6)" }}>
                    Send another
                  </button>
                </div>
              ) : (
                <form onSubmit={submit} className="px-8 py-8 space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>Name</span>
                      <input type="text" value={form.name} onChange={e => set("name", e.target.value)}
                        style={inputStyle} placeholder="Your name" required
                        onFocus={e => e.target.style.borderColor = "rgba(245,158,11,0.6)"}
                        onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.12)"} />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>Email</span>
                      <input type="email" value={form.email} onChange={e => set("email", e.target.value)}
                        style={inputStyle} placeholder="your@email.com" required
                        onFocus={e => e.target.style.borderColor = "rgba(245,158,11,0.6)"}
                        onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.12)"} />
                    </label>
                  </div>

                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>Subject</span>
                    <select value={form.subject} onChange={e => set("subject", e.target.value)} style={inputStyle}>
                      {SUBJECTS.map(s => <option key={s} style={{ background: "#0B1628" }}>{s}</option>)}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>Message</span>
                    <textarea value={form.message} onChange={e => set("message", e.target.value)}
                      style={{ ...inputStyle, resize: "vertical", minHeight: "130px" }}
                      placeholder="Describe your issue or question..." required rows={5}
                      onFocus={e => e.target.style.borderColor = "rgba(245,158,11,0.6)"}
                      onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.12)"} />
                  </label>

                  {state === "error" && (
                    <p className="rounded-lg px-4 py-3 text-sm" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#F87171" }}>{errorMsg}</p>
                  )}

                  <button type="submit" disabled={state === "loading"}
                    className="w-full cursor-pointer rounded-xl py-3.5 text-sm font-bold text-white transition-all hover:brightness-110 disabled:opacity-60"
                    style={{ background: "linear-gradient(135deg,#F59E0B,#D97706)", boxShadow: "0 4px 20px rgba(245,158,11,0.3)" }}>
                    {state === "loading" ? "Sending…" : "Send Message →"}
                  </button>

                  <p className="text-center text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>We reply to every message within 24 hours.</p>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="py-8 text-center text-xs" style={{ color: "rgba(255,255,255,0.2)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        © {new Date().getFullYear()} CalcoBet Analytics ·{" "}
        <a href="/terms" className="hover:opacity-60 transition-opacity">Terms</a> ·{" "}
        <a href="/privacy" className="hover:opacity-60 transition-opacity">Privacy</a> ·{" "}
        <a href="/responsible-gambling" className="hover:opacity-60 transition-opacity">Responsible Gambling</a>
      </footer>
    </div>
  );
}
