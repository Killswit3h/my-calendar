// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--bg))",
        card: "rgb(var(--card))",
        muted: "rgb(var(--muted))",
        fg: "rgb(var(--fg))",
        accent: "rgb(var(--accent))",
        accentFg: "rgb(var(--accent-fg))",
      },
      boxShadow: {
        glass: "0 18px 40px rgba(19,40,28,0.12)",
        card: "0 14px 32px rgba(7,17,11,0.28)",
      },
      backdropBlur: {
        xs: "8px",
      },
      borderRadius: {
        xl2: "1rem",
        xl3: "1.25rem",
      },
      transitionTimingFunction: {
        "ease-out-soft": "cubic-bezier(0.22, 0.61, 0.36, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
