import { useEffect, useMemo, useRef, useState } from "react";
import { calculateArbitrage, calculateEV } from "../lib/odds";
import { toDecimalOdds, formatDecimalOdds, ODDS_FORMATS } from "../lib/oddsFormat";
import { useOddsFormat } from "../context/OddsFormatContext";
import { IconCalculator, IconChartUp } from "./Icons";

const TABS = [
  { id: "ev", label: "+EV Calculator" },
  { id: "arb", label: "Arbitrage Calculator" },
];

const DEFAULTS = {
  american: { odds: "-110", oddsA: "+150", oddsB: "-130" },
  decimal: { odds: "1.91", oddsA: "2.50", oddsB: "1.77" },
  fractional: { odds: "10/11", oddsA: "3/2", oddsB: "10/13" },
};

/** Keeps an odds text field showing the equivalent value when the global
 * odds format toggle changes, instead of leaving a stale "-110" sitting in a
 * field now labeled "decimal". */
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
      <span className="mb-1.5 block text-xs font-medium text-base-muted">{label}</span>
      <div className="flex items-center rounded-lg border border-base-border bg-base-bg px-3 focus-within:border-ev/60 focus-within:ring-1 focus-within:ring-ev/30 transition-colors duration-200">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={example}
          className="w-full bg-transparent py-2.5 font-mono text-sm text-base-text outline-none placeholder:text-base-muted/50"
        />
        <span className="ml-2 shrink-0 text-[10px] uppercase text-base-muted">{format}</span>
      </div>
    </label>
  );
}

function NumberField({ label, value, onChange, placeholder, suffix }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-base-muted">{label}</span>
      <div className="flex items-center rounded-lg border border-base-border bg-base-bg px-3 focus-within:border-ev/60 focus-within:ring-1 focus-within:ring-ev/30 transition-colors duration-200">
        <input
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent py-2.5 font-mono text-sm text-base-text outline-none placeholder:text-base-muted/50"
        />
        {suffix && <span className="ml-2 text-xs text-base-muted">{suffix}</span>}
      </div>
    </label>
  );
}

function EVPanel() {
  const { format } = useOddsFormat();
  const [odds, setOdds] = useFormatSyncedOdds({
    american: DEFAULTS.american.odds,
    decimal: DEFAULTS.decimal.odds,
    fractional: DEFAULTS.fractional.odds,
  });
  const [trueProb, setTrueProb] = useState("58.3");

  const decimalOdds = useMemo(() => toDecimalOdds(odds, format), [odds, format]);
  const result = useMemo(
    () => calculateEV({ decimalOdds, trueProbabilityPct: trueProb }),
    [decimalOdds, trueProb]
  );

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div className="space-y-4">
        <OddsField label="Sportsbook odds — e.g. Man City to Win" value={odds} onChange={setOdds} />
        <NumberField
          label="Your model's true win probability"
          value={trueProb}
          onChange={setTrueProb}
          placeholder="58.3"
          suffix="%"
        />
        <p className="text-xs leading-relaxed text-base-muted">
          Enter the odds offered (in any format via the toggle above) and the win probability your
          model calculates. We compare it to the book&apos;s implied probability to find your edge.
        </p>
      </div>

      <div className="flex flex-col justify-center rounded-xl border border-base-border bg-base-bg p-5">
        {result ? (
          <>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-base-muted">Book implied probability</span>
              <span className="font-mono text-sm text-base-text">{result.impliedProb.toFixed(2)}%</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs font-medium text-base-muted">Your edge</span>
              <span
                className={`font-mono text-sm font-semibold ${
                  result.edgePct >= 0 ? "text-ev" : "text-neg"
                }`}
              >
                {result.edgePct >= 0 ? "+" : ""}
                {result.edgePct.toFixed(2)} pts
              </span>
            </div>

            <div className="my-4 h-px bg-base-border" />

            <span className="text-xs font-medium text-base-muted">Expected value</span>
            <span
              className={`mt-1 font-mono text-3xl font-extrabold ${
                result.isPositiveEV ? "text-ev" : "text-neg"
              }`}
            >
              {result.isPositiveEV ? "+" : ""}
              {result.evPct.toFixed(2)}%
            </span>
            <span
              className={`mt-2 inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                result.isPositiveEV ? "bg-ev/15 text-ev" : "bg-neg/15 text-neg"
              }`}
            >
              {result.isPositiveEV ? "Positive EV — mathematically favorable" : "Negative EV — avoid this line"}
            </span>
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
  const [oddsA, setOddsA] = useFormatSyncedOdds({
    american: DEFAULTS.american.oddsA,
    decimal: DEFAULTS.decimal.oddsA,
    fractional: DEFAULTS.fractional.oddsA,
  });
  const [oddsB, setOddsB] = useFormatSyncedOdds({
    american: DEFAULTS.american.oddsB,
    decimal: DEFAULTS.decimal.oddsB,
    fractional: DEFAULTS.fractional.oddsB,
  });
  const [stake, setStake] = useState("1000");

  const decimalA = useMemo(() => toDecimalOdds(oddsA, format), [oddsA, format]);
  const decimalB = useMemo(() => toDecimalOdds(oddsB, format), [oddsB, format]);
  const result = useMemo(
    () => calculateArbitrage({ decimalA, decimalB, totalStake: stake }),
    [decimalA, decimalB, stake]
  );

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div className="space-y-4">
        <OddsField label="Book A — Outcome 1 (e.g. Over 2.5 Goals)" value={oddsA} onChange={setOddsA} />
        <OddsField label="Book B — Outcome 2 (e.g. Under 2.5 Goals)" value={oddsB} onChange={setOddsB} />
        <NumberField label="Total stake" value={stake} onChange={setStake} placeholder="1000" suffix="$" />
      </div>

      <div className="flex flex-col justify-center rounded-xl border border-base-border bg-base-bg p-5">
        {result ? (
          <>
            <span className="text-xs font-medium text-base-muted">Combined implied probability</span>
            <span className="font-mono text-sm text-base-text">{result.impliedSum.toFixed(2)}%</span>

            <div className="my-4 h-px bg-base-border" />

            <span className="text-xs font-medium text-base-muted">Arbitrage margin</span>
            <span
              className={`mt-1 font-mono text-3xl font-extrabold ${
                result.isArbitrage ? "text-ev" : "text-neg"
              }`}
            >
              {result.isArbitrage ? "+" : ""}
              {result.arbPct.toFixed(2)}%
            </span>

            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg bg-base-surface2 p-3">
                <p className="text-base-muted">Stake on A</p>
                <p className="mt-1 font-mono text-base text-base-text">${result.stakeA.toFixed(2)}</p>
              </div>
              <div className="rounded-lg bg-base-surface2 p-3">
                <p className="text-base-muted">Stake on B</p>
                <p className="mt-1 font-mono text-base text-base-text">${result.stakeB.toFixed(2)}</p>
              </div>
            </div>

            <p className="mt-3 text-xs text-base-muted">
              Guaranteed {result.profit >= 0 ? "profit" : "loss"}:{" "}
              <span className={result.profit >= 0 ? "text-ev" : "text-neg"}>
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
    <div
      id="calculator"
      className="rounded-2xl border border-base-border bg-base-surface p-5 shadow-card sm:p-8"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-ev/10 text-ev">
            <IconCalculator className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-lg font-bold text-base-text">Run the math yourself</h3>
            <p className="text-xs text-base-muted">No signup. Same engine that powers our daily picks.</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-base-surface2 px-3 py-1 text-xs font-medium text-base-muted">
          <IconChartUp className="w-3.5 h-3.5 text-ev" />
          Live calculation
        </span>
      </div>

      <div role="tablist" aria-label="Calculator type" className="mt-6 inline-flex rounded-lg bg-base-bg p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`cursor-pointer rounded-md px-4 py-2 text-sm font-medium transition-colors duration-200 ${
              tab === t.id
                ? "bg-base-surface2 text-base-text shadow-sm"
                : "text-base-muted hover:text-base-text"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">{tab === "ev" ? <EVPanel /> : <ArbPanel />}</div>
    </div>
  );
}
