/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          bg:       "#06101E",
          surface:  "#0C1A2E",
          surface2: "#122136",
          border:   "#1E3350",
          muted:    "#5B7A9E",
          text:     "#E2EEF9",
        },
        ev: {
          DEFAULT: "#3B9EFF",
          dim:     "#1A4D80",
          glow:    "rgba(59,158,255,0.3)",
        },
        neg: {
          DEFAULT: "#F05252",
          dim:     "#7A1C1C",
          glow:    "rgba(240,82,82,0.3)",
        },
        pro: {
          DEFAULT: "#818CF8",
          glow:    "rgba(129,140,248,0.35)",
        },
      },
      fontFamily: {
        sans:    ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Plus Jakarta Sans", "Inter", "ui-sans-serif", "sans-serif"],
        mono:    ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        "ev-glow": "0 0 28px rgba(59,158,255,0.22)",
        "card":    "0 1px 0 0 rgba(255,255,255,0.03) inset, 0 8px 24px -8px rgba(0,0,0,0.7)",
        "panel":   "0 0 0 1px rgba(30,51,80,0.8), 0 8px 32px -8px rgba(0,0,0,0.6)",
      },
      keyframes: {
        "fade-up": {
          "0%":   { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%":      { opacity: "0.5", transform: "scale(0.85)" },
        },
        "shimmer": {
          "0%":   { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
      },
      animation: {
        "fade-up":   "fade-up 0.6s ease-out both",
        "fade-in":   "fade-in 0.6s ease-out both",
        "pulse-dot": "pulse-dot 2s ease-in-out infinite",
        "shimmer":   "shimmer 2.5s linear infinite",
      },
    },
  },
  plugins: [],
};
