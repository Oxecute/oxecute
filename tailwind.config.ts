import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-urbanist)", "sans-serif"],
        urbanist: ["var(--font-urbanist)", "Urbanist", "sans-serif"],
        dm: ["var(--font-dm-sans)", "DM Sans", "sans-serif"],
      },
      colors: {
        ox: {
          p: "var(--p)",
          p2: "var(--p2)",
          ca: "var(--ca)",
          na: "var(--na)",
          mi: "var(--mi)",
          wa: "var(--wa)",
          fw: "var(--fw)",
          ac: "var(--ac)",
          bg: "var(--bg)",
          sur: "var(--sur)",
          sur2: "var(--sur2)",
          t1: "var(--t1)",
          t2: "var(--t2)",
          t3: "var(--t3)",
        },
      },
    },
  },
  plugins: [],
};
export default config;
