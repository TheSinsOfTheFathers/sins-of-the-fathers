/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./pages/**/*.html", // Diğer HTML sayfaların varsa
    "./src/**/*.{js,ts,jsx,tsx}",
    "./assets/js/**/*.js" // main.js ve diğerleri
  ],
  theme: {
    extend: {
      colors: {
        'blood': '#4a0404',
        'gold': '#c5a059',
        'gold-dim': '#8a6e3e',
        'obsidian': '#050505',
        'charcoal': '#121212'
      },
      fontFamily: {
        serif: ['Cinzel', 'serif'],
        sans: ['Lato', 'sans-serif'],
        mono: ['Courier Prime', 'monospace']
      }
    },
  },
  plugins: [],
}