import { useState } from "react";

const FAQS = [
  {
    q: "What is positive expected value (+EV) betting?",
    a: "A bet is +EV when the true probability of an outcome is higher than what the bookmaker's odds imply. For example, if our model says a team has a 55% chance of winning but the book prices it at 45%, there's a 10% edge. Over hundreds of bets, +EV bets produce profit regardless of short-term variance.",
  },
  {
    q: "How often are the picks updated?",
    a: "A new free pick is published every day at 06:00 UTC. The odds are also refreshed after each tracked game finishes, so results and scores appear as soon as the match ends.",
  },
  {
    q: "Which leagues and competitions do you cover?",
    a: "We cover the FIFA World Cup, UEFA Champions League, UEFA Euro Championship, Premier League, La Liga, and Copa Libertadores - the competitions with the deepest liquidity, meaning more bookmakers price them, which makes our consensus probability more accurate.",
  },
  {
    q: "Do I need betting experience to use this?",
    a: "No. The free daily bet is a single clear recommendation with the bet, bookmaker, and odds laid out. Pro members get the full board with every edge ranked. If you know how to place a bet, you can follow CalcoBet.",
  },
  {
    q: "Can I cancel my Pro subscription anytime?",
    a: "Yes - cancel anytime from your account with one click. You keep access until the end of the billing period. No contracts, no retention tricks, no questions asked.",
  },
  {
    q: "Is sports betting legal in my country?",
    a: "Betting laws vary by jurisdiction. CalcoBet provides statistical analysis only - we do not operate as a bookmaker or accept bets. It is your responsibility to verify that sports betting is legal where you are located before placing any wagers.",
  },
];

function Item({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-base-border last:border-0">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex w-full cursor-pointer items-center justify-between gap-4 py-5 text-left"
      >
        <span className="text-sm font-bold text-blue-deep">{q}</span>
        <span className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full transition-colors"
          style={{ background: open ? "#2563EB" : "#F1F5F9" }}>
          <svg className="w-3.5 h-3.5 transition-transform duration-200" style={{ color: open ? "white" : "#64748B", transform: open ? "rotate(45deg)" : "rotate(0deg)" }}
            fill="none" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 1v12M1 7h12" />
          </svg>
        </span>
      </button>
      {open && (
        <p className="pb-5 text-sm text-base-muted leading-relaxed max-w-2xl">{a}</p>
      )}
    </div>
  );
}

export default function FAQ() {
  return (
    <section className="py-20 lg:py-28" style={{ background: "#F8FAFC" }}>
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="grid gap-14 lg:grid-cols-[380px_1fr] lg:items-start">

          <div>
            <span className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider mb-4" style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", color: "#D97706" }}>
              FAQ
            </span>
            <h2 className="font-display text-3xl font-black text-blue-deep sm:text-4xl leading-tight">
              Questions we get asked a lot
            </h2>
            <p className="mt-4 text-sm text-base-muted leading-relaxed">
              Still have questions? Email us at{" "}
              <a href="mailto:support@calcobet.com" className="text-blue-royal font-semibold hover:underline">
                support@calcobet.com
              </a>
            </p>
          </div>

          <div className="rounded-2xl border border-base-border bg-white px-7 shadow-card">
            {FAQS.map((faq) => (
              <Item key={faq.q} {...faq} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
