import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#16181D",
        paper: "#FAFBFD",
        slate2: "#5B6472",
        signal: "#2456F6",
        mint: "#12B886",
        coral: "#F0526A",
        hairline: "#E4E8EF",
      },
      fontFamily: {
        display: ["Sora", "ui-sans-serif", "system-ui", "sans-serif"],
        body: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        sheet: "0 1px 2px rgba(22,24,29,.06), 0 8px 32px rgba(22,24,29,.10)",
      },
    },
  },
  plugins: [],
};
export default config;
