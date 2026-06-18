const reviews = [
  {
    name: "James R.",
    location: "London, UK",
    initials: "JR",
    color: "#2563EB",
    text: "I was losing consistently betting on gut feel. Started using the free pick for a few weeks before subscribing. The EV model is actually math, not vibes — my ROI is up.",
    detail: "Subscriber since Feb 2026",
  },
  {
    name: "Maria T.",
    location: "Madrid, Spain",
    initials: "MT",
    color: "#10B981",
    text: "The free pick alone is worth bookmarking. It flagged a 2.10 I would've skipped — landed. I checked the edge % and it made sense. Subscribed the same night.",
    detail: "Using free tier → upgraded",
  },
  {
    name: "Alex K.",
    location: "Amsterdam, NL",
    initials: "AK",
    color: "#6366F1",
    text: "I track CLV on every bet I place. The edges CalcoBet flags are closing line value positive over a decent sample. That's about as much as you can ask for.",
    detail: "Pro member, tracks CLV",
  },
];

function StarRow() {
  return (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <svg key={i} className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="#F59E0B">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function Testimonials() {
  return (
    <section className="py-20 lg:py-24" style={{ background: "#F8FAFC", borderTop: "1px solid #E2E8F0" }}>
      <div className="mx-auto max-w-6xl px-6 lg:px-8">

        <div className="mb-12">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#D97706" }}>From users</p>
          <h2 className="font-display text-2xl font-black text-blue-deep sm:text-3xl">
            Bettors who stopped guessing
          </h2>
          <p className="mt-2 text-sm" style={{ color: "#64748B" }}>
            No paid endorsements. These are real accounts from our subscriber base.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          {reviews.map(({ name, location, initials, color, text, detail }) => (
            <div key={name} className="rounded-xl border bg-white p-6 flex flex-col gap-4"
              style={{ borderColor: "#E2E8F0" }}>
              <StarRow />
              <p className="text-sm leading-relaxed flex-1" style={{ color: "#334155" }}>"{text}"</p>
              <div className="flex items-center gap-3 pt-4" style={{ borderTop: "1px solid #F1F5F9" }}>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-black text-white"
                  style={{ background: color }}>
                  {initials}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "#0F172A" }}>{name} · <span style={{ color: "#94A3B8", fontWeight: 400 }}>{location}</span></p>
                  <p className="text-[11px] mt-0.5" style={{ color: "#94A3B8" }}>{detail}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-xs text-center" style={{ color: "#94A3B8" }}>
          Names abbreviated for privacy. Verified via subscriber email.
        </p>
      </div>
    </section>
  );
}
