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

export default function SupportPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: SUBJECTS[0], message: "" });
  const [state, setState] = useState("idle"); // idle | loading | done | error
  const [errorMsg, setErrorMsg] = useState("");
  const [openFaq, setOpenFaq] = useState(null);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function submit(e) {
    e.preventDefault();
    setState("loading");
    setErrorMsg("");
    try {
      const r = await fetch(`${API_URL}/api/support`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Failed to send");
      setState("done");
    } catch (err) {
      setErrorMsg(err.message);
      setState("error");
    }
  }

  const inputCls = "w-full rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber-400/40 transition-all";
  const inputStyle = { background: "#F8FAFC", border: "1px solid #E2E8F0", color: "#0F172A" };

  return (
    <div className="min-h-screen font-sans" style={{ background: "#F8FAFC", color: "#0F172A" }}>
      <header className="px-6 py-4 bg-white" style={{ borderBottom: "1px solid #F1F5F9" }}>
        <div className="mx-auto max-w-4xl flex items-center justify-between">
          <a href="/"><CalcoBetLogo tileSize={36} textSize={23} taglineSize={8} gap={10} dark /></a>
          <a href="/" className="text-sm font-medium transition-opacity hover:opacity-70" style={{ color: "#64748B" }}>← Back</a>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12 lg:px-8">
        <div className="mb-10">
          <h1 className="text-3xl font-black text-slate-900">Support</h1>
          <p className="mt-2 text-sm" style={{ color: "#64748B" }}>We typically reply within 24 hours.</p>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1fr_420px]">

          {/* FAQ */}
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest mb-5" style={{ color: "#F59E0B" }}>Common Questions</h2>
            <div className="space-y-2">
              {FAQS.map((faq, i) => (
                <div key={i} className="rounded-2xl overflow-hidden" style={{ border: "1px solid #E2E8F0", background: "white" }}>
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full cursor-pointer flex items-center justify-between px-5 py-4 text-left text-sm font-semibold"
                    style={{ color: "#0F172A" }}>
                    {faq.q}
                    <svg className="w-4 h-4 shrink-0 ml-3 transition-transform" style={{ transform: openFaq === i ? "rotate(180deg)" : "none", color: "#94A3B8" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-4 text-sm leading-relaxed" style={{ color: "#475569" }}>{faq.a}</div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-2xl p-6" style={{ background: "linear-gradient(135deg,#060D1A,#0D1F3C)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#F59E0B" }}>Email us directly</p>
              <a href="mailto:legal@calcobet.com" className="text-sm font-semibold text-white hover:opacity-80 transition-opacity">legal@calcobet.com</a>
              <p className="mt-2 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>For billing, account issues, or anything urgent.</p>
            </div>
          </div>

          {/* Contact form */}
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest mb-5" style={{ color: "#F59E0B" }}>Send a Message</h2>

            {state === "done" ? (
              <div className="rounded-2xl p-8 text-center" style={{ background: "white", border: "1px solid #E2E8F0" }}>
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full" style={{ background: "rgba(16,185,129,0.1)" }}>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="#10B981" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                </div>
                <h3 className="text-base font-black text-slate-900 mb-1">Message sent!</h3>
                <p className="text-sm" style={{ color: "#64748B" }}>Check your inbox — we've sent you a confirmation. We'll reply within 24 hours.</p>
                <button onClick={() => { setState("idle"); setForm({ name: "", email: "", subject: SUBJECTS[0], message: "" }); }}
                  className="mt-5 cursor-pointer rounded-xl px-5 py-2.5 text-sm font-semibold"
                  style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", color: "#475569" }}>
                  Send another
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="rounded-2xl p-6 space-y-4" style={{ background: "white", border: "1px solid #E2E8F0" }}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "#64748B" }}>Name</label>
                    <input type="text" value={form.name} onChange={e => set("name", e.target.value)}
                      className={inputCls} style={inputStyle} placeholder="Your name" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "#64748B" }}>Email</label>
                    <input type="email" value={form.email} onChange={e => set("email", e.target.value)}
                      className={inputCls} style={inputStyle} placeholder="your@email.com" required />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#64748B" }}>Subject</label>
                  <select value={form.subject} onChange={e => set("subject", e.target.value)}
                    className={inputCls} style={inputStyle}>
                    {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#64748B" }}>Message</label>
                  <textarea value={form.message} onChange={e => set("message", e.target.value)}
                    className={inputCls} style={{ ...inputStyle, resize: "vertical", minHeight: "140px" }}
                    placeholder="Describe your issue or question..." required rows={5} />
                </div>

                {state === "error" && (
                  <p className="text-sm font-semibold" style={{ color: "#EF4444" }}>{errorMsg}</p>
                )}

                <button type="submit" disabled={state === "loading"}
                  className="w-full cursor-pointer rounded-xl py-3.5 text-sm font-bold text-white transition-all hover:brightness-110 disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg,#F59E0B,#D97706)" }}>
                  {state === "loading" ? "Sending…" : "Send Message"}
                </button>

                <p className="text-center text-xs" style={{ color: "#94A3B8" }}>We reply to every message within 24 hours.</p>
              </form>
            )}
          </div>
        </div>
      </main>

      <footer className="mt-16 py-8 text-center text-xs" style={{ color: "#94A3B8", borderTop: "1px solid #F1F5F9" }}>
        © {new Date().getFullYear()} CalcoBet Analytics ·{" "}
        <a href="/terms" className="hover:text-slate-600">Terms</a> ·{" "}
        <a href="/privacy" className="hover:text-slate-600">Privacy</a> ·{" "}
        <a href="/responsible-gambling" className="hover:text-slate-600">Responsible Gambling</a>
      </footer>
    </div>
  );
}
