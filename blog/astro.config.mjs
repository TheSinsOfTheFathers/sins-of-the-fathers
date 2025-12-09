import { defineConfig } from 'astro/config';
import sanity from "@sanity/astro";
import tailwindcss from '@tailwindcss/vite'; 
import node from "@astrojs/node"; 

export default defineConfig({
  site: 'https://blog.thesinsofthefathers.com', 
  output: 'server', 
  adapter: node({
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
      chunkSizeWarningLimit: 1000,
    }
  },
});