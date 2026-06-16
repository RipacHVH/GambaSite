import { ODDS_FORMATS } from "../lib/oddsFormat";
import { useOddsFormat } from "../context/OddsFormatContext";

export default function OddsFormatToggle({ className = "" }) {
  const { format, setFormat } = useOddsFormat();

  return (
    <div
      role="radiogroup"
      aria-label="Odds format"
      className={`inline-flex rounded-sm border border-base-border bg-base-surface p-0.5 ${className}`}
    >
      {ODDS_FORMATS.map((f) => (
        <button
          key={f.id}
          role="radio"
          aria-checked={format === f.id}
          onClick={() => setFormat(f.id)}
          title={`${f.label} (e.g. ${f.example})`}
          className={`cursor-pointer rounded-sm px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors duration-150 ${
            format === f.id
              ? "bg-ev text-base-bg"
              : "text-base-muted hover:text-base-text"
          }`}
        >
          {f.id === "american" ? "US" : f.id === "decimal" ? "EU" : "UK"}
        </button>
      ))}
    </div>
  );
}
