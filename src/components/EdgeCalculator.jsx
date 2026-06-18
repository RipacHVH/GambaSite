import { useMemo, useState } from "react";

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-base-muted">{label}</span>
      {children}
    </label>
  );
}

function NumInput({ value, onChange, placeholder, suffix }) {
  return (
    <div className="flex items-center rounded-lg border border-base-border bg-white px-3 shadow-sm focus-within:border-blue-royal/50 focus-within:ring-2 focus-within:ring-blue-royal/10 transition-all">
      <input type="number" step="0.01" min="0.01" value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent py-2.5 font-mono text-sm text-base-text outline-none placeholder:text-base-muted/40" />
      {suffix && <span className="ml-2 text-xs font-semibold text-base-muted">{suffix}</span>}
    </div>
  );
}

function ResultBox({ children, empty }) {
  return (
    <div className="rounded-xl border border-base-border bg-base-surface2/50 p-5 h-full">
      {empty ? <p className="text-sm text-base-muted">Enter values to calculate.</p> : children}
    </div>
  );
}

function calcCashOut(origOdds, currOdds, stake, cashoutOffer) {
  const orig    = parseFloat(origOdds);
  const curr    = parseFloat(currOdds);
  const st      = parseFloat(stake);
  const offered = parseFloat(cashoutOffer);
  if (!orig || !curr || !st || orig < 1.01 || curr < 1.01 || st <= 0) return null;

  const movement       = curr - orig;
  const impliedWinProb = (1 / curr) * 100;
  const holdExpected   = (1 / curr) * orig * st;
  const fairCashout    = st * (orig / curr);
  const cashoutValue   = Number.isFinite(offered) && offered > 0 ? offered : fairCashout * 0.87;
  const isExact        = Number.isFinite(offered) && offered > 0;
  const bookieMargin   = isExact ? ((fairCashout - offered) / fairCashout * 100) : null;

  let recommendation, reason;
  if (cashoutValue >= holdExpected) {
    recommendation = "CASH OUT";
    reason = `The cash out offer (£${cashoutValue.toFixed(2)}) exceeds the expected return from holding (£${holdExpected.toFixed(2)}). Taking the offer is the mathematically correct decision.`;
  } else if (movement < -0.15) {
    recommendation = "HOLD";
    reason = `Odds shortened ${Math.abs(movement).toFixed(2)} since you bet — your selection is more likely to win now. The expected return if held (£${holdExpected.toFixed(2)}) beats the cash out offer (£${cashoutValue.toFixed(2)}).`;
  } else if (movement > 0.25 && cashoutValue >= st * 0.7) {
    recommendation = "CASH OUT";
    reason = `Odds drifted +${movement.toFixed(2)} and the cash out offer (£${cashoutValue.toFixed(2)}) is reasonable versus the expected return if held (£${holdExpected.toFixed(2)}).`;
  } else {
    recommendation = "HOLD";
    reason = `Expected return if held (£${holdExpected.toFixed(2)}) outweighs the cash out offer (£${cashoutValue.toFixed(2)}). The math favours letting it run.`;
  }

  return { recommendation, reason, movement, impliedWinProb, holdExpected, cashoutValue, fairCashout, isExact, bookieMargin };
}

export default function EdgeCalculator() {
  const [origOdds,     setOrigOdds]     = useState("");
  const [currOdds,     setCurrOdds]     = useState("");
  const [stake,        setStake]        = useState("");
  const [cashoutOffer, setCashoutOffer] = useState("");

  const result   = useMemo(() => calcCashOut(origOdds, currOdds, stake, cashoutOffer), [origOdds, currOdds, stake, cashoutOffer]);
  const recColor = result?.recommendation === "HOLD" ? "#10B981" : result?.recommendation === "CASH OUT" ? "#EF4444" : null;

  return (
    <div className="overflow-hidden rounded-xl border border-base-border bg-white shadow-panel">
      <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #F59E0B, #10B981)" }} />
      <div className="border-b border-base-border bg-base-surface2/40 px-6 py-4 sm:px-8">
        <h3 className="text-base font-black text-blue-deep">Cash Out Advisor</h3>
        <p className="text-xs text-base-muted mt-0.5">Should you take the cash out? Enter your bet details and find out instantly.</p>
      </div>
      <div className="p-6 sm:p-8">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-4">
            <Field label="Odds when you placed the bet (decimal)">
              <NumInput value={origOdds} onChange={setOrigOdds} placeholder="e.g. 2.50" />
            </Field>
            <Field label="Current odds on your bookmaker (decimal)">
              <NumInput value={currOdds} onChange={setCurrOdds} placeholder="e.g. 1.80" />
            </Field>
            <Field label="Your stake">
              <NumInput value={stake} onChange={setStake} placeholder="e.g. 50" suffix="£" />
            </Field>
            <Field label="Bookmaker cash out offer (optional)">
              <NumInput value={cashoutOffer} onChange={setCashoutOffer} placeholder="e.g. 38.50 — shown in your bookmaker app" suffix="£" />
            </Field>
            <p className="text-xs leading-relaxed text-base-muted">
              Enter the exact cash out figure your bookmaker is showing for precise advice. Leave it blank and we'll estimate it for you.
            </p>
          </div>

          <ResultBox empty={!result}>
            {result && (
              <>
                <div className="mb-4 pb-4 border-b border-base-border">
                  <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-base-muted mb-1">Recommendation</p>
                  <p className="font-mono text-3xl font-black" style={{ color: recColor }}>{result.recommendation}</p>
                  <p className="mt-2 text-xs leading-relaxed text-base-muted">{result.reason}</p>
                </div>
                <div className="space-y-2.5 text-xs">
                  {[
                    ["Odds movement",       `${result.movement >= 0 ? "+" : ""}${result.movement.toFixed(2)}`,
                      result.movement < 0 ? "text-ev" : result.movement > 0 ? "text-neg" : "text-base-muted"],
                    ["Implied win prob",    `${result.impliedWinProb.toFixed(1)}%`,             "text-base-text font-semibold"],
                    [result.isExact ? "Cash out offer" : "Est. cash out", `£${result.cashoutValue.toFixed(2)}`, "text-base-text font-semibold"],
                    ["Fair cash out value", `£${result.fairCashout.toFixed(2)}`,                "text-base-text font-semibold"],
                    ["Expected if held",    `£${result.holdExpected.toFixed(2)}`,               "text-base-text font-semibold"],
                  ].map(([label, value, cls]) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-base-muted">{label}</span>
                      <span className={`font-mono font-bold ${cls}`}>{value}</span>
                    </div>
                  ))}
                  {result.isExact && result.bookieMargin !== null && (
                    <div className="flex justify-between pt-1 border-t border-base-border">
                      <span className="text-base-muted">Bookmaker's cut</span>
                      <span className="font-mono font-bold text-neg">{result.bookieMargin.toFixed(1)}%</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </ResultBox>
        </div>
      </div>
    </div>
  );
}
