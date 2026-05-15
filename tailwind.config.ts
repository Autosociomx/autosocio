import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        marca: {
          DEFAULT: "#0f172a",
          acento: "#f59e0b",
        },
      },
    },
  },
  plugins: [],
};

export default config;
