import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#121417",
        muted: "#667085",
        line: "#E5E7EB",
        surface: "#F7F8FA"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(16, 24, 40, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
