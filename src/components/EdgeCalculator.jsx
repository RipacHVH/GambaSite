import { useEffect, useMemo, useRef, useState } from "react";
import { calculateArbitrage, calculateEV } from "../lib/odds";
import { toDecimalOdds, formatDecimalOdds, ODDS_FORMATS } from "../lib/oddsFormat";
import { useOddsFormat } from "../context/OddsFormatContext";

const TABS = [
  { id: "ev",      label: "+EV Calculator" },
  { id: "arb",     label: "Arbitrage Calculator" },
  { id: "cashout", label: "Cash Out Advisor" },
];
const DEFAULTS = {
  american:   { odds: "-110", oddsA: "+150", oddsB: "-130" },
  decimal:    { odds: "1.91", oddsA: "2.50", oddsB: "1.77" },
  fractional: { odds: "10/11", oddsA: "3/2", oddsB: "10/13" },
};

function useFormatSyncedOdds(defaults) {
  const { format } = useOddsFormat();
  const [value, setValue] = useState(defaults[format]);
  const prevFormat = useRef(format);
  useEffect(() => {
    if (prevFormat.current === format) return;
    const decimal = toDecimalOdds(value, prevFormat.current);
    setValue(Number.isFinite(decimal) && decimal > 1 ? formatDecimalOdds(decimal, format) : defaults[format]);
    prevFormat.current = format;
  }, [format]);
  return [value, setValue];
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-base-muted">{label}</span>
      {children}
    </label>
  );
}

function OddsInput({ label, value, onChange }) {
  const { format } = useOddsFormat();
  const example = ODDS_FORMATS.find((f) => f.id === format)?.example;
  return (
    <Field label={label}>
      <div className="flex items-center rounded-lg border border-base-border bg-white px-3 shadow-sm focus-within:border-blue-royal/50 focus-within:ring-2 focus-within:ring-blue-royal/10 transition-all">
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={example}
          className="w-full bg-transparent py-2.5 font-mono text-sm text-base-text outline-none placeholder:text-base-muted/40" />
        <span className="ml-2 shrink-0 font-mono text-[9px] font-bold uppercase tracking-wider text-base-muted/60 bg-base-surface2 rounded px-1.5 py-0.5">{format}</span>
      </div>
    </Field>
  );
}

function NumberInput({ label, value, onChange, placeholder, suffix }) {
  return (
    <Field label={label}>
      <div className="flex items-center rounded-lg border border-base-border bg-white px-3 shadow-sm focus-within:border-blue-royal/50 focus-within:ring-2 focus-within:ring-blue-royal/10 transition-all">
        <input type="number" inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className="w-full bg-transparent py-2.5 font-mono text-sm text-base-text outline-none placeholder:text-base-muted/40" />
        {suffix && <span className="ml-2 text-xs font-semibold text-base-muted">{suffix}</span>}
      </div>
    </Field>
  );
}

function ResultBox({ children, empty }) {
  return (
    <div className="rounded-xl border border-base-border bg-base-surface2/50 p-5 h-full">
      {empty
        ? <p className="text-sm text-base-muted">Enter values to calculate.</p>
        : children}
    </div>
  );
}

function EVPanel() {
  const { format } = useOddsFormat();
  const [odds, setOdds] = useFormatSyncedOdds({ american: DEFAULTS.american.odds, decimal: DEFAULTS.decimal.odds, fractional: DEFAULTS.fractional.odds });
  const [trueProb, setTrueProb] = useState("58.3");
  const decimalOdds = useMemo(() => toDecimalOdds(odds, format), [odds, format]);
  const result = useMemo(() => calculateEV({ decimalOdds, trueProbabilityPct: trueProb }), [decimalOdds, trueProb]);

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <div className="space-y-4">
        <OddsInput label="Sportsbook odds (e.g. Man City to Win)" value={odds} onChange={setOdds} />
        <NumberInput label="AI true win probability" value={trueProb} onChange={setTrueProb} placeholder="58.3" suffix="%" />
        <p className="text-xs leading-relaxed text-base-muted">
          Compare the sportsbook's implied probability against your model's true probability to find the mathematical edge.
        </p>
      </div>
      <ResultBox empty={!result}>
        {result && <>
          <div className="space-y-2.5 border-b border-base-border pb-4 text-xs">
            <div className="flex justify-between">
              <span className="text-base-muted">Book implied probability</span>
              <span className="font-mono font-semibold text-base-text">{result.impliedProb.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-base-muted">Your edge</span>
              <span className={`font-mono font-bold ${result.edgePct >= 0 ? "text-ev" : "text-neg"}`}>
                {result.edgePct >= 0 ? "+" : ""}{result.edgePct.toFixed(2)} pts
              </span>
            </div>
          </div>
          <div className="pt-4">
            <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-base-muted">Expected Value</p>
            <p className={`mt-1 font-mono text-4xl font-black ${result.isPositiveEV ? "text-ev" : "text-neg"}`}>
              {result.isPositiveEV ? "+" : ""}{result.evPct.toFixed(2)}%
            </p>
            <span className={`mt-3 inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold ${
              result.isPositiveEV ? "border-ev/30 bg-ev/10 text-ev" : "border-neg/20 bg-neg/10 text-neg"
            }`}>
              {result.isPositiveEV ? "+EV Edge Detected - Mathematically Favourable" : "Negative EV - Avoid This Line"}
            </span>
          </div>
        </>}
      </ResultBox>
    </div>
  );
}

function ArbPanel() {
  const { format } = useOddsFormat();
  const [oddsA, setOddsA] = useFormatSyncedOdds({ american: DEFAULTS.american.oddsA, decimal: DEFAULTS.decimal.oddsA, fractional: DEFAULTS.fractional.oddsA });
  const [oddsB, setOddsB] = useFormatSyncedOdds({ american: DEFAULTS.american.oddsB, decimal: DEFAULTS.decimal.oddsB, fractional: DEFAULTS.fractional.oddsB });
  const [stake, setStake] = useState("1000");
  const decimalA = useMemo(() => toDecimalOdds(oddsA, format), [oddsA, format]);
  const decimalB = useMemo(() => toDecimalOdds(oddsB, format), [oddsB, format]);
  const result = useMemo(() => calculateArbitrage({ decimalA, decimalB, totalStake: stake }), [decimalA, decimalB, stake]);

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <div className="space-y-4">
        <OddsInput label="Book A - Outcome 1 (e.g. Over 2.5 Goals)"  value={oddsA} onChange={setOddsA} />
        <OddsInput label="Book B - Outcome 2 (e.g. Under 2.5 Goals)" value={oddsB} onChange={setOddsB} />
        <NumberInput label="Total stake" value={stake} onChange={setStake} placeholder="1000" suffix="$" />
      </div>
      <ResultBox empty={!result}>
        {result && <>
          <div className="border-b border-base-border pb-4 mb-4 text-xs">
            <div className="flex justify-between">
              <span className="text-base-muted">Combined implied probability</span>
              <span className="font-mono font-semibold text-base-text">{result.impliedSum.toFixed(2)}%</span>
            </div>
          </div>
          <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-base-muted">Arbitrage Margin</p>
          <p className={`mt-1 font-mono text-4xl font-black ${result.isArbitrage ? "text-ev" : "text-neg"}`}>
            {result.isArbitrage ? "+" : ""}{result.arbPct.toFixed(2)}%
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[["Stake on A", result.stakeA], ["Stake on B", result.stakeB]].map(([l, v]) => (
              <div key={l} className="rounded-lg border border-base-border bg-white p-3">
                <p className="text-[10px] text-base-muted">{l}</p>
                <p className="mt-1 font-mono font-bold text-blue-deep">${v.toFixed(2)}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-base-muted">
            Guaranteed {result.profit >= 0 ? "profit" : "loss"}:{" "}
            <span className={`font-bold ${result.profit >= 0 ? "text-ev" : "text-neg"}`}>
              ${result.profit.toFixed(2)} ({result.roiPct.toFixed(2)}%)
            </span>
          </p>
        </>}
      </ResultBox>
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
  const holdExpected   = (1 / curr) * orig * st;   // fair expected return if held
  const fairCashout    = st * (orig / curr);        // mathematical cash-out value
  // Use the actual bookmaker offer if provided, otherwise estimate at 87%
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

function CashOutPanel() {
  const [origOdds,     setOrigOdds]     = useState("");
  const [currOdds,     setCurrOdds]     = useState("");
  const [stake,        setStake]        = useState("");
  const [cashoutOffer, setCashoutOffer] = useState("");

  const result = useMemo(() => calcCashOut(origOdds, currOdds, stake, cashoutOffer), [origOdds, currOdds, stake, cashoutOffer]);

  const recColor = result?.recommendation === "HOLD"     ? "#10B981"
                 : result?.recommendation === "CASH OUT"  ? "#EF4444"
                 : null;

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <div className="space-y-4">
        <Field label="Odds when you placed the bet (decimal)">
          <div className="flex items-center rounded-lg border border-base-border bg-white px-3 shadow-sm focus-within:border-blue-royal/50 focus-within:ring-2 focus-within:ring-blue-royal/10 transition-all">
            <input type="number" step="0.01" min="1.01" value={origOdds} onChange={e => setOrigOdds(e.target.value)}
              placeholder="e.g. 2.50"
              className="w-full bg-transparent py-2.5 font-mono text-sm text-base-text outline-none placeholder:text-base-muted/40" />
          </div>
        </Field>
        <Field label="Current odds on your bookmaker (decimal)">
          <div className="flex items-center rounded-lg border border-base-border bg-white px-3 shadow-sm focus-within:border-blue-royal/50 focus-within:ring-2 focus-within:ring-blue-royal/10 transition-all">
            <input type="number" step="0.01" min="1.01" value={currOdds} onChange={e => setCurrOdds(e.target.value)}
              placeholder="e.g. 1.80"
              className="w-full bg-transparent py-2.5 font-mono text-sm text-base-text outline-none placeholder:text-base-muted/40" />
          </div>
        </Field>
        <Field label="Your stake">
          <div className="flex items-center rounded-lg border border-base-border bg-white px-3 shadow-sm focus-within:border-blue-royal/50 focus-within:ring-2 focus-within:ring-blue-royal/10 transition-all">
            <input type="number" step="0.01" min="0.01" value={stake} onChange={e => setStake(e.target.value)}
              placeholder="e.g. 50"
              className="w-full bg-transparent py-2.5 font-mono text-sm text-base-text outline-none placeholder:text-base-muted/40" />
            <span className="ml-2 text-xs font-semibold text-base-muted">£</span>
          </div>
        </Field>
        <Field label="Bookmaker cash out offer (optional)">
          <div className="flex items-center rounded-lg border border-base-border bg-white px-3 shadow-sm focus-within:border-blue-royal/50 focus-within:ring-2 focus-within:ring-blue-royal/10 transition-all">
            <input type="number" step="0.01" min="0.01" value={cashoutOffer} onChange={e => setCashoutOffer(e.target.value)}
              placeholder="e.g. 38.50 — shown in your bookmaker app"
              className="w-full bg-transparent py-2.5 font-mono text-sm text-base-text outline-none placeholder:text-base-muted/40" />
            <span className="ml-2 text-xs font-semibold text-base-muted">£</span>
          </div>
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
                ["Odds movement",      `${result.movement >= 0 ? "+" : ""}${result.movement.toFixed(2)}`,
                  result.movement < 0 ? "text-ev" : result.movement > 0 ? "text-neg" : "text-base-muted"],
                ["Implied win prob",   `${result.impliedWinProb.toFixed(1)}%`,  "text-base-text font-semibold"],
                [result.isExact ? "Cash out offer" : "Est. cash out", `£${result.cashoutValue.toFixed(2)}`, "text-base-text font-semibold"],
                ["Fair cash out value",`£${result.fairCashout.toFixed(2)}`,     "text-base-text font-semibold"],
                ["Expected if held",   `£${result.holdExpected.toFixed(2)}`,    "text-base-text font-semibold"],
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
  );
}

export default function EdgeCalculator() {
  const [tab, setTab] = useState("ev");
  return (
    <div className="overflow-hidden rounded-xl border border-base-border bg-white shadow-panel">
      <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #F59E0B, #10B981)" }} />
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-base-border bg-base-surface2/40 px-6 py-4 sm:px-8">
        <div>
          <h3 className="text-base font-black text-blue-deep">Quantitative Analysis Tools</h3>
          <p className="text-xs text-base-muted mt-0.5">Same AI engine that powers our daily edges. No signup required.</p>
        </div>
        <div role="tablist" className="inline-flex rounded-lg border border-base-border bg-white p-1 shadow-card">
          {TABS.map((t) => (
            <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
              className="cursor-pointer rounded-md px-4 py-2 text-xs font-bold transition-all"
              style={tab === t.id
                ? { background: "#1E293B", color: "white", boxShadow: "0 1px 4px rgba(0,0,0,0.15)" }
                : { color: "#94A3B8" }}
              onMouseEnter={e => { if (tab !== t.id) e.currentTarget.style.color = "#475569"; }}
              onMouseLeave={e => { if (tab !== t.id) e.currentTarget.style.color = "#94A3B8"; }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="p-6 sm:p-8">
        {tab === "ev" ? <EVPanel /> : tab === "arb" ? <ArbPanel /> : <CashOutPanel />}
      </div>
    </div>
  );
}
