import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#101418",        // ພື້ນຫຼັງເຂັ້ມ
        panel: "#171c22",      // panel/card
        panel2: "#1e242b",
        line: "#2a323b",
        signal: "#3dd6c3",     // ສີສັນຫຼັກ — signal teal (ອ້າງອີງແສງໜ້າຈໍ IMEI scan)
        signalDim: "#1f5c53",
        warn: "#f2a340",
        danger: "#e65a5a",
        ok: "#5ad6a0",
        muted: "#8a94a0",
        paper: "#f4f6f7",
      },
      fontFamily: {
        display: ["'IBM Plex Sans Condensed'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      borderRadius: {
        card: "10px",
      },
    },
  },
  plugins: [],
};
export default config;
