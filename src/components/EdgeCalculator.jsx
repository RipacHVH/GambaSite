import { useEffect, useMemo, useRef, useState } from "react";
import { calculateArbitrage, calculateEV } from "../lib/odds";
import { toDecimalOdds, formatDecimalOdds, ODDS_FORMATS } from "../lib/oddsFormat";
import { useOddsFormat } from "../context/OddsFormatContext";

const TABS = [
  { id: "ev",  label: "+EV Calculator" },
  { id: "arb", label: "Arbitrage Calculator" },
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

function OddsField({ label, value, onChange }) {
  const { format } = useOddsFormat();
  const example = ODDS_FORMATS.find((f) => f.id === format)?.example;
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-base-muted">{label}</span>
      <div className="flex items-center rounded-sm border border-base-border bg-base-surface px-3 shadow-sm focus-within:border-ev/60 focus-within:ring-1 focus-within:ring-ev/30 transition-all">
        <input
          type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={example}
          className="w-full bg-transparent py-2.5 font-mono text-sm text-base-text outline-none placeholder:text-base-muted/40"
        />
        <span className="ml-2 shrink-0 font-mono text-[9px] uppercase tracking-wider text-base-muted/70">{format}</span>
      </div>
    </label>
  );
}

function NumberField({ label, value, onChange, placeholder, suffix }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-base-muted">{label}</span>
      <div className="flex items-center rounded-sm border border-base-border bg-base-surface px-3 shadow-sm focus-within:border-ev/60 focus-within:ring-1 focus-within:ring-ev/30 transition-all">
        <input
          type="number" inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className="w-full bg-transparent py-2.5 font-mono text-sm text-base-text outline-none placeholder:text-base-muted/40"
        />
        {suffix && <span className="ml-2 text-xs text-base-muted">{suffix}</span>}
      </div>
    </label>
  );
}

function EVPanel() {
  const { format } = useOddsFormat();
  const [odds, setOdds] = useFormatSyncedOdds({ american: DEFAULTS.american.odds, decimal: DEFAULTS.decimal.odds, fractional: DEFAULTS.fractional.odds });
  const [trueProb, setTrueProb] = useState("58.3");
  const decimalOdds = useMemo(() => toDecimalOdds(odds, format), [odds, format]);
  const result = useMemo(() => calculateEV({ decimalOdds, trueProbabilityPct: trueProb }), [decimalOdds, trueProb]);

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div className="space-y-4">
        <OddsField label="Sportsbook odds — e.g. Man City to Win" value={odds} onChange={setOdds} />
        <NumberField label="Your model's true win probability" value={trueProb} onChange={setTrueProb} placeholder="58.3" suffix="%" />
        <p className="text-xs leading-relaxed text-base-muted">
          Enter the odds offered and the win probability your model calculates. We compare it to the book's implied probability to find your edge.
        </p>
      </div>
      <div className="rounded-sm border border-base-border bg-base-surface2/50 p-5">
        {result ? (
          <>
            <div className="space-y-3 border-b border-base-border pb-4">
              <div className="flex justify-between text-xs">
                <span className="text-base-muted">Book implied probability</span>
                <span className="font-mono font-semibold text-base-text">{result.impliedProb.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-base-muted">Your edge</span>
                <span className={`font-mono font-semibold ${result.edgePct >= 0 ? "text-ev" : "text-neg"}`}>
                  {result.edgePct >= 0 ? "+" : ""}{result.edgePct.toFixed(2)} pts
                </span>
              </div>
            </div>
            <div className="pt-4">
              <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-base-muted">Expected Value</p>
              <p className={`mt-1 font-mono text-4xl font-extrabold ${result.isPositiveEV ? "text-ev" : "text-neg"}`}>
                {result.isPositiveEV ? "+" : ""}{result.evPct.toFixed(2)}%
              </p>
              <span className={`mt-3 inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold border ${
                result.isPositiveEV ? "border-ev/20 bg-ev/5 text-ev" : "border-neg/20 bg-neg/5 text-neg"
              }`}>
                {result.isPositiveEV ? "Positive EV — mathematically favourable" : "Negative EV — avoid this line"}
              </span>
            </div>
          </>
        ) : (
          <p className="text-sm text-base-muted">Enter valid odds and probability to calculate.</p>
        )}
      </div>
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
    <div className="grid gap-6 sm:grid-cols-2">
      <div className="space-y-4">
        <OddsField label="Book A — Outcome 1 (e.g. Over 2.5 Goals)"  value={oddsA} onChange={setOddsA} />
        <OddsField label="Book B — Outcome 2 (e.g. Under 2.5 Goals)" value={oddsB} onChange={setOddsB} />
        <NumberField label="Total stake" value={stake} onChange={setStake} placeholder="1000" suffix="$" />
      </div>
      <div className="rounded-sm border border-base-border bg-base-surface2/50 p-5">
        {result ? (
          <>
            <div className="border-b border-base-border pb-4 mb-4">
              <div className="flex justify-between text-xs">
                <span className="text-base-muted">Combined implied probability</span>
                <span className="font-mono font-semibold text-base-text">{result.impliedSum.toFixed(2)}%</span>
              </div>
            </div>
            <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-base-muted">Arbitrage Margin</p>
            <p className={`mt-1 font-mono text-4xl font-extrabold ${result.isArbitrage ? "text-ev" : "text-neg"}`}>
              {result.isArbitrage ? "+" : ""}{result.arbPct.toFixed(2)}%
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {[["Stake on A", result.stakeA], ["Stake on B", result.stakeB]].map(([l, v]) => (
                <div key={l} className="rounded-sm border border-base-border bg-base-surface p-3">
                  <p className="text-[10px] text-base-muted">{l}</p>
                  <p className="mt-1 font-mono font-bold text-base-text">${v.toFixed(2)}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-base-muted">
              Guaranteed {result.profit >= 0 ? "profit" : "loss"}:{" "}
              <span className={`font-semibold ${result.profit >= 0 ? "text-ev" : "text-neg"}`}>
                ${result.profit.toFixed(2)} ({result.roiPct.toFixed(2)}%)
              </span>
            </p>
          </>
        ) : (
          <p className="text-sm text-base-muted">Enter valid odds on both sides and a stake to calculate.</p>
        )}
      </div>
    </div>
  );
}

export default function EdgeCalculator() {
  const [tab, setTab] = useState("ev");
  return (
    <div id="calculator" className="rounded-lg border border-base-border bg-white p-6 shadow-panel sm:p-8">
      <div className="h-1 -mx-6 -mt-6 sm:-mx-8 sm:-mt-8 mb-6 bg-gradient-to-r from-ev to-pro rounded-t-lg" />
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-base font-bold text-base-text">Quantitative Analysis Tools</h3>
          <p className="text-xs text-base-muted mt-0.5">Same engine that powers our daily signals. No signup.</p>
        </div>
        <div role="tablist" className="inline-flex rounded-sm border border-base-border bg-base-surface2 p-1">
          {TABS.map((t) => (
            <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
              className={`cursor-pointer rounded-sm px-4 py-2 text-xs font-semibold transition-all ${
                tab === t.id ? "bg-ev text-white shadow-sm" : "text-base-muted hover:text-base-text"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      {tab === "ev" ? <EVPanel /> : <ArbPanel />}
    </div>
  );
}
