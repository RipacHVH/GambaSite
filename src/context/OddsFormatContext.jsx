import { createContext, useContext, useState } from "react";

const OddsFormatContext = createContext(null);

export function OddsFormatProvider({ children }) {
  const [format, setFormat] = useState("american");
  return (
    <OddsFormatContext.Provider value={{ format, setFormat }}>{children}</OddsFormatContext.Provider>
  );
}

export function useOddsFormat() {
  const ctx = useContext(OddsFormatContext);
  if (!ctx) throw new Error("useOddsFormat must be used within OddsFormatProvider");
  return ctx;
}
