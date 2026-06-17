import { createContext, useContext, useState } from "react";

const OddsFormatContext = createContext(null);

function detectDefaultFormat() {
  // Respect any previously saved preference
  const saved = localStorage.getItem("cb_odds_format");
  if (saved && ["american", "decimal", "fractional"].includes(saved)) return saved;

  // Detect by timezone - Intl.DateTimeFormat is available in all modern browsers
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
    // UK timezones
    if (/^Europe\/(London|Dublin|Lisbon)$/.test(tz)) return "fractional";
    // US/Canada timezones
    if (/^America\//.test(tz) || /^US\//.test(tz) || /^Canada\//.test(tz)) return "american";
    // Everything else (EU, Asia, Africa, Oceania…) → decimal
    return "decimal";
  } catch {
    return "decimal";
  }
}

export function OddsFormatProvider({ children }) {
  const [format, setFormat] = useState(detectDefaultFormat);

  function handleSetFormat(f) {
    localStorage.setItem("cb_odds_format", f);
    setFormat(f);
  }

  return (
    <OddsFormatContext.Provider value={{ format, setFormat: handleSetFormat }}>{children}</OddsFormatContext.Provider>
  );
}

export function useOddsFormat() {
  const ctx = useContext(OddsFormatContext);
  if (!ctx) throw new Error("useOddsFormat must be used within OddsFormatProvider");
  return ctx;
}
