import { ODDS_FORMATS } from "../lib/oddsFormat";
import { useOddsFormat } from "../context/OddsFormatContext";

export default function OddsFormatToggle({ className = "", dark = false }) {
  const { format, setFormat } = useOddsFormat();
  return (
    <div role="radiogroup" aria-label="Odds format"
      className={`inline-flex rounded-lg p-1 ${className}`}
      style={{
        background: dark ? "rgba(255,255,255,0.08)" : "#F1F5F9",
        border: dark ? "1px solid rgba(255,255,255,0.12)" : "1px solid #E2E8F0",
      }}>
      {ODDS_FORMATS.map((f) => (
        <button key={f.id} role="radio" aria-checked={format === f.id} onClick={() => setFormat(f.id)}
          title={`${f.label} (e.g. ${f.example})`}
          className="cursor-pointer rounded-md px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-all"
          style={format === f.id
            ? { background: "linear-gradient(135deg,#F59E0B,#D97706)", color: "white", boxShadow: "0 1px 4px rgba(245,158,11,0.4)" }
            : { color: dark ? "rgba(255,255,255,0.5)" : "#64748B" }
          }>
          {f.id === "american" ? "US" : f.id === "decimal" ? "EU" : "UK"}
        </button>
      ))}
    </div>
  );
}
