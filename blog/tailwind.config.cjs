// blog/tailwind.config.cjs
/** @type {import('tailwindcss').Config} */
module.exports = {
  // Astro'ya hangi dosyaları taramasını söylüyoruz
  content: [
    './src/**/*.{astro,html,js,jsx,ts,tsx}', 
    './*.astro' 
  ],
  theme: {
    extend: {
      // Ana projenin özel renklerini buraya taşıdık
      colors: {
        'gold': '#c5a059',
        'gold-dim': '#8a6e3e',
        'obsidian': '#050505',
        'charcoal': '#121212'
      },
      // Ana projenin özel fontlarını buraya taşıdık
      fontFamily: {
        serif: ['Cinzel', 'serif'],
        sans: ['Lato', 'sans-serif'],
        mono: ['Courier Prime', 'monospace']
      },
    },
  },
  plugins: [
    // Typography eklentisi (Blog içeriğini düzgün biçimlendirir)
    require('@tailwindcss/typography'),
  ],
}