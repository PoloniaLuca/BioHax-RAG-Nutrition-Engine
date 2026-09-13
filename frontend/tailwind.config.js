/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bioblack: '#121212',
        biored: '#FF3B30',
        biodark: '#1E1E1E',
        biogrey: '#2C2C2E',
      }
    },
  },
  plugins: [],
}
