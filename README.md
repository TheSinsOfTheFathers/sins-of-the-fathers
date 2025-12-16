<div align="center">
  <img src="https://firebasestorage.googleapis.com/v0/b/sins-of-the-fathers.firebasestorage.app/o/logo.png?alt=media&token=a7d1a0b9-5bba-45ee-9f19-e8f5770c0a84" alt="The Sins of The Fathers Logo" width="200"/>

  # The Sins of the Fathers | Digital Novel Experience Platform

  **Her Hanedanlık Bir Borçtur.**

  Bu proje, epik bir suç destanı olan "The Sins of the Fathers" için sadece bir tanıtım sitesi değil; okuyucuyu evrenin derinliklerine çeken, yaşayan, interaktif ve yüksek performanslı bir **"Dijital Kale"**dir.

</div>

---

### 📖 Proje Vizyonu

Bu platformun temel felsefesi, okuyucuyu pasif bir tüketiciden, bu karanlık dünyanın aktif bir "vatandaşına" ve sırlarını keşfeden bir "ajanına" dönüştürmektir. `thesinsofthefathers.com`, hikayenin kelimelerin ötesinde haritalar, zaman çizelgeleri ve gizli "lore" metinleriyle anlatılmaya devam ettiği bir operasyon merkezidir.

---

### 🏛️ Hibrit ve Performans Odaklı Mimari

Platform, modern web standartlarına uygun, **Core Web Vitals** odaklı ve ölçeklenebilir bir hibrit mimari üzerine kurulmuştur:

*   **⚡ Landing & Core (High-Performance Static):**
    *   Kullanıcıyı karşılayan ana arayüz.
    *   **Strateji:** "Zero-Runtime CSS" yaklaşımı ile Tailwind CSS derlenmiş (build) olarak sunulur. CDN bağımlılıkları minimize edilmiştir.
    *   **Görsel Optimizasyon:** Mobil ve Masaüstü için "Art Direction" (`<picture>` tag) kullanımı ve Next-Gen formatlar (WebP) ile LCP (Largest Contentful Paint) süreleri optimize edilmiştir.
    *   **Teknoloji:** `HTML5`, `Tailwind CLI / PostCSS`, `Vanilla JS`.

*   **📚 Blog & Lore Engine (Dynamic - SSR):**
    *   Romanın evrenini derinlemesine işleyen dinamik içerik motorudur.
    *   **Strateji:** SEO uyumluluğu ve hızlı ilk yükleme için Sunucu Taraflı Oluşturma (SSR) kullanılır.
    *   **Teknoloji:** `Astro`, `Firebase Functions`, `Sanity.io (Headless CMS)`.

---

### 🛠️ Teknoloji Cephaneliği (Tech Stack)

Bu proje, performansı ve kullanıcı deneyimini ön planda tutan modern teknolojilerle donatılmıştır.

**Core Frontend & Styling**

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![PostCSS](https://img.shields.io/badge/PostCSS-DD3A0A?style=for-the-badge&logo=postcss&logoColor=white)

**Performance & Optimization**

![WebP](https://img.shields.io/badge/WebP_Images-005571?style=for-the-badge&logo=google&logoColor=white)
![Lighthouse](https://img.shields.io/badge/Lighthouse_Score-95+-F44B21?style=for-the-badge&logo=lighthouse&logoColor=white)
![Core Web Vitals](https://img.shields.io/badge/Core_Web_Vitals-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)

**Content & Dynamic Engine**

![Astro](https://img.shields.io/badge/Astro-FF5D01?style=for-the-badge&logo=astro&logoColor=white)
![Sanity](https://img.shields.io/badge/Sanity-F03E2F?style=for-the-badge&logo=sanity&logoColor=white)

**Backend & Infrastructure**

![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Google Cloud](https://img.shields.io/badge/Google_Cloud-4285F4?style=for-the-badge&logo=google-cloud&logoColor=white)
