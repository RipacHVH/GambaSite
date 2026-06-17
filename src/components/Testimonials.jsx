const reviews = [
  {
    name: "James R.",
    role: "Sports bettor · London, UK",
    initials: "JR",
    color: "#2563EB",
    stars: 5,
    text: "Made over £400 profit in my first month following the Pro picks. The EV model is genuinely different from the usual tipster nonsense — it's actually math.",
  },
  {
    name: "Maria T.",
    role: "Recreational bettor · Madrid, Spain",
    initials: "MT",
    color: "#10B981",
    stars: 5,
    text: "I was sceptical at first but the free daily bet alone convinced me. It flagged a 2.10 odds bet I would've ignored — it landed. Subscribed that night.",
  },
  {
    name: "Alex K.",
    role: "Value bettor · Amsterdam, NL",
    initials: "AK",
    color: "#F59E0B",
    stars: 5,
    text: "The Pro ledger is exactly what I needed. Chronological, clean, no noise. I track CLV on every bet and the edge is real over a sample. Brilliant tool.",
  },
];

function Stars({ count }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <svg key={i} className="w-4 h-4" viewBox="0 0 20 20" fill="#F59E0B">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function Testimonials() {
  return (
    <section className="bg-white py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">

        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider mb-4" style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", color: "#D97706" }}>
            Real Results
          </span>
          <h2 className="font-display text-3xl font-black text-blue-deep sm:text-4xl">
            Bettors who stopped guessing
          </h2>
          <p className="mt-3 text-base text-base-muted max-w-md mx-auto">
            Join thousands who use CalcoBet to bet with an actual mathematical edge.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {reviews.map(({ name, role, initials, color, stars, text }) => (
            <div key={name} className="rounded-2xl border border-base-border bg-white p-7 shadow-card flex flex-col gap-4 hover:shadow-strong transition-shadow duration-300">
              <Stars count={stars} />
              <p className="text-sm text-base-text leading-relaxed flex-1">"{text}"</p>
              <div className="flex items-center gap-3 pt-2" style={{ borderTop: "1px solid #F1F5F9" }}>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-black text-white"
                  style={{ background: color }}>
                  {initials}
                </div>
                <div>
                  <p className="text-sm font-bold text-blue-deep">{name}</p>
                  <p className="text-[11px] text-base-muted">{role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Aggregate trust badge */}
        <div className="mt-10 flex items-center justify-center gap-3">
          <Stars count={5} />
          <span className="text-sm font-semibold text-base-text">4.9 / 5</span>
          <span className="text-sm text-base-muted">from 2,400+ verified users</span>
        </div>
      </div>
    </section>
  );
}
