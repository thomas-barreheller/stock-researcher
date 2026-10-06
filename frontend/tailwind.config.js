/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        butter: {
          DEFAULT: "#FBEEC7",
          card: "#FFFBF0",
        },
        sky: {
          DEFAULT: "#2F9BD6",
          dark: "#1F7FB3",
          light: "#E4F3FC",
        },
        ink: {
          DEFAULT: "#2B2620",
          muted: "#6B6459",
        },
        rise: "#3F8F5F",
        fall: "#B0463F",
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        body: ["Manrope", "sans-serif"],
      },
    },
  },
  plugins: [],
}
