/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./pages/**/*.{js,ts,jsx,tsx}','./components/**/*.{js,ts,jsx,tsx}','./app/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: { colors: { brand: { 900:'#1B2A4A', 700:'#2E5FA3', 500:'#4A90D9', 100:'#E6F1FB' } } } },
  plugins: [],
}
