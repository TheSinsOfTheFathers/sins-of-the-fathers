// blog/astro.config.mjs
import { defineConfig } from 'astro/config';
import sanity from "@sanity/astro";
import tailwindcss from '@tailwindcss/vite'; 
import node from "@astrojs/node"; 

export default defineConfig({
  output: 'server', 
  adapter: node({
    // BURASI DEĞİŞTİ: 'standalone' yerine 'middleware' yapıyoruz.
    mode: 'middleware' 
  }),
  integrations: [
    sanity({ 
      projectId: "8cfeoaz2", 
      dataset: "production",
      useCdn: true,
      apiVersion: "2023-05-03"
    })
  ],
  vite: {
    plugins: [tailwindcss()],
    build: {
      // Firebase functions ile çakışmayı önlemek için assets boyut limiti
      chunkSizeWarningLimit: 1000,
    }
  },
});