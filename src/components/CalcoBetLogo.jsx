const TOKENS = {
  gold: "#E0A33E",
  white: "#FFFFFF",
  tagline: "#C7CCD3",
  font: "'Space Grotesk', system-ui, sans-serif",
};

function SigmaTile({ size = 54 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.26,
        background: TOKENS.gold,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flex: "none",
      }}
    >
      <span style={{ fontFamily: TOKENS.font, fontWeight: 700, fontSize: size * 0.61, lineHeight: 1, color: TOKENS.white }}>
        Σ
      </span>
    </div>
  );
}

// size: tile size; textSize: wordmark font size; taglineSize: tagline font size
export default function CalcoBetLogo({ tileSize = 40, textSize = 26, taglineSize = 9, gap = 12, dark = false }) {
  const textColor = dark ? "#0F172A" : TOKENS.white;
  const taglineColor = dark ? "#64748B" : TOKENS.tagline;
  return (
    <div style={{ display: "flex", alignItems: "center", gap }}>
      <SigmaTile size={tileSize} />
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <span style={{ fontFamily: TOKENS.font, fontSize: textSize, letterSpacing: "-0.025em", lineHeight: 1 }}>
          <span style={{ fontWeight: 400, color: textColor }}>Calco</span>
          <span style={{ fontWeight: 700, color: TOKENS.gold }}>Bet</span>
        </span>
        <span style={{ fontFamily: TOKENS.font, fontWeight: 600, fontSize: taglineSize, letterSpacing: "0.26em", textTransform: "uppercase", color: taglineColor }}>
          Profitable Betting
        </span>
      </div>
    </div>
  );
}
