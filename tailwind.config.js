/** @type {import('tailwindcss').Config} */
export default {
  presets: [
    require('./tailwind.preset.js')
  ],
  content: [
    "./index.html",
    "./pages/**/*.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./assets/js/**/*.js"
  ],
  // Theme and plugins are now handled by the preset, unless specific overrides are needed here.
  theme: {
    extend: {},
  },
  plugins: [],
}