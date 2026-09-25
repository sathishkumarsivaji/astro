/** @type {import("tailwindcss").Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        astro: {
          dark: "#090A10",
          card: "#121422",
          surface: "#1A1D33",
          gold: "#E2B755",
          "gold-light": "#FBE696",
          purple: "#7A5AF8",
          accent: "#9B8AFB",
          rose: "#EE46BC",
        }
      }
    },
  },
  plugins: [],
}
