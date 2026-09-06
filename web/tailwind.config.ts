import type { Config } from "tailwindcss";

// Colors are wired to CSS custom properties (see globals.css). The dashboard is
// dark-first — the mission-control look — with a light theme available. Status
// colors (good/warn/bad) are reserved for meaning and always paired with a label.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        plane: "var(--page)",
        surface: "var(--surface)",
        inset: "var(--surface-2)",
        primary: "var(--text)",
        secondary: "var(--text-secondary)",
        muted: "var(--text-muted)",
        hairline: "var(--border)",
        grid: "var(--grid)",
        accent: "var(--accent)",
        good: "var(--good)",
        warn: "var(--warn)",
        bad: "var(--bad)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        mono: ["'IBM Plex Mono'", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      borderRadius: {
        card: "12px",
      },
    },
  },
  plugins: [],
};

export default config;
