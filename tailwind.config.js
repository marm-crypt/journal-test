/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",

    // common Vite/React locations:
    "./App.{js,jsx,ts,tsx}",
    "./main.{js,jsx,ts,tsx}",

    // your project seems to use these folders:
    "./pages/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};