// C:\Projects\sins-of-the-fathers\vite.config.js

import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // Vite'a projenin ana klasörünün burası olduğunu,
  // ve ana index.html'in burada olduğunu söylüyoruz.
  root: process.cwd(), 

  // Kaynak dosyalarımızın (JS, CSS) nerede olduğunu belirtiyoruz.
  // Bu, Vite'ın geliştirme sunucusunda dosyaları doğru bulmasını sağlar.
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },

  build: {
    // Vite'a build işlemi için hangi HTML dosyasını kullanacağını söylüyoruz.
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        // Eğer pages klasöründe başka ana HTML dosyaların varsa,
        // onları da buraya ekleyebilirsin. Örneğin:
        // characters: resolve(__dirname, 'pages/characters.html'),
      },
    },
    // "npm run build" komutunun çıktılarını "dist" klasörüne atmasını sağlıyoruz.
    // Bu, Firebase Hosting için en iyi yöntemdir.
    outDir: './dist',
    emptyOutDir: true, // Her build öncesi dist klasörünü temizle
  },
  
  server: {
    // `npm run dev` komutunun doğru çalışması için.
    open: true, // Sunucu başlayınca tarayıcıda otomatik aç
  }
});