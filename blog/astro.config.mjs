import { defineConfig } from "astro/config";
import sanity from "@sanity/astro";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://blog.thesinsofthefathers.com",
  output: "static",
  integrations: [
    sanity({
      projectId: "8cfeoaz2",
      dataset: "production",
      useCdn: true,
      apiVersion: "2023-05-03",
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    build: {
      chunkSizeWarningLimit: 1000,
    },
  },
});
