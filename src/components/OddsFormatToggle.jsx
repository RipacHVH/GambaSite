import { ODDS_FORMATS } from "../lib/oddsFormat";
import { useOddsFormat } from "../context/OddsFormatContext";

export default function OddsFormatToggle({ className = "" }) {
  const { format, setFormat } = useOddsFormat();

  return (
    <div
      role="radiogroup"
      aria-label="Odds format"
      className={`inline-flex rounded-lg border border-base-border bg-base-bg p-1 ${className}`}
    >
      {ODDS_FORMATS.map((f) => (
        <button
          key={f.id}
          role="radio"
          aria-checked={format === f.id}
          onClick={() => setFormat(f.id)}
          title={`${f.label} (e.g. ${f.example})`}
          className={`cursor-pointer rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors duration-200 ${
            format === f.id
              ? "bg-base-surface2 text-base-text shadow-sm"
              : "text-base-muted hover:text-base-text"
          }`}
        >
          {f.id === "american" ? "US" : f.id === "decimal" ? "EU" : "UK"}
        </button>
      ))}
    </div>
  );
}
