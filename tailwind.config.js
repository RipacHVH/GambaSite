/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          bg: "#0A0E14",
          surface: "#10151D",
          surface2: "#161D28",
          border: "#232B38",
          muted: "#8B98A9",
          text: "#E6EDF3",
        },
        ev: {
          DEFAULT: "#39FF6E",
          dim: "#1F7A46",
          glow: "rgba(57,255,110,0.35)",
        },
        neg: {
          DEFAULT: "#FF5C66",
          dim: "#7A2630",
          glow: "rgba(255,92,102,0.3)",
        },
        pro: {
          DEFAULT: "#A78BFA",
          glow: "rgba(167,139,250,0.35)",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        "ev-glow": "0 0 24px rgba(57,255,110,0.25)",
        "card": "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 24px -8px rgba(0,0,0,0.6)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s ease-out both",
        "pulse-glow": "pulse-glow 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
