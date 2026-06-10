import type { Config } from "tailwindcss";

/**
 * Tailwind is wired to the same design tokens defined as CSS custom
 * properties in app/globals.css, so utilities and the ported component
 * styles share one source of truth for the Multicolor design language.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        ink: {
          DEFAULT: "var(--ink)",
          soft: "var(--ink-soft)",
        },
        muted: "var(--muted)",
        line: {
          DEFAULT: "var(--line)",
          soft: "var(--line-soft)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
          soft: "var(--accent-soft)",
        },
        sale: {
          DEFAULT: "var(--sale)",
          soft: "var(--sale-soft)",
        },
        ok: "var(--ok)",
      },
      fontFamily: {
        sans: ["var(--font-georgian)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "var(--radius)",
        lg: "var(--radius-lg)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
      },
      maxWidth: {
        wrap: "var(--maxw)",
      },
      backgroundImage: {
        spectrum: "var(--spectrum)",
      },
    },
  },
  plugins: [],
};

export default config;
