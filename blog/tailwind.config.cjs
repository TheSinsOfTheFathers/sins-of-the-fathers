// blog/tailwind.config.cjs
/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [
    require('../tailwind.preset.js')
  ],
  // Astro'ya hangi dosyaları taramasını söylüyoruz
  content: [
    './src/**/*.{astro,html,js,jsx,ts,tsx}',
    './*.astro'
  ],
  theme: {
    extend: {},
  },
  plugins: [
    // Typography eklentisi (Blog içeriğini düzgün biçimlendirir)
    require('@tailwindcss/typography'),
  ],
}