/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx,js,jsx}",
    "./components/**/*.{ts,tsx,js,jsx}",
    "./src/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0b1110",
        fg: "#e7e9ea",
        muted: "#99a3a7",
        card: "rgba(18,24,22,0.7)",
        accent: "#3ddc84",
      },
      borderRadius: {
        xl: "24px",
        lg: "18px",
        md: "14px",
      },
      boxShadow: {
        glass: "0 1px 0 rgba(255,255,255,.06), 0 10px 30px rgba(0,0,0,.35)",
      },
    },
  },
  plugins: [],
};