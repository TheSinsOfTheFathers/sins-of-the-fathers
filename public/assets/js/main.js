/**
 * THE SINS OF THE FATHERS
 * Main Execution Protocol (v4.5 - Final Stable)
 * --------------------------------------------------------------
 * Orchestrates module loading, animations (GSAP), and localization (i18n).
 */

// 1. KÜTÜPHANE IMPORTLARI
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import i18next, { initI18n, changeLanguage } from './lib/i18n.js'; // i18next eklendi

// 2. MODÜL IMPORTLARI
import initAuth from './modules/auth/auth.js';
import { initMobileMenu } from './modules/ui/mobile-menu.js';

// 3. GSAP AYARLARI
gsap.registerPlugin(ScrollTrigger);

/* --------------------------------------------------------------------------
   VITE MODULE GLOB DEFINITION
   -------------------------------------------------------------------------- */
const moduleMap = import.meta.glob([
    './modules/loaders/*.js', 
    './modules/auth/*.js'
]);

/* --------------------------------------------------------------------------
   YARDIMCI FONKSİYON: SAYFA ÇEVİRİSİ (STATİK HTML İÇİN)
   -------------------------------------------------------------------------- */
function updatePageTranslations() {
    if (!i18next.isInitialized) return;

    // data-i18n özniteliğine sahip tüm elementleri bul ve çevir
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const translation = i18next.t(key);
        
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            el.placeholder = translation;
        } else {
            el.innerHTML = translation; // HTML etiketlerini (span, br vb.) korur
        }
    });

    // Sayfa başlığını (Title) güncelle
    const titleKey = document.body.getAttribute('data-page-title-key');
    if (titleKey) {
        document.title = i18next.t(titleKey);
    }
}

/* --------------------------------------------------------------------------
   ROUTER CONFIGURATION
   -------------------------------------------------------------------------- */
const ROUTER_CONFIGS = [
    { 
        id: ['protagonists-gallery', 'main-characters-gallery'],
        log: " > Personnel Database Detected",
        modulePath: './modules/loaders/character-loader.js',
        loaderFn: 'displayCharacters'
    },
    { 
        id: 'character-dossier', 
        log: " > Dossier Decryption Started",
        modulePath: './modules/loaders/character-detail-loader.js',
        loaderFn: 'loadCharacterDetails'
    },
    { 
        id: 'factions-grid', 
        log: " > Tactical Overview Initialized",
        modulePath: './modules/loaders/faction-loader.js',
        loaderFn: 'displayFactions'
    },
    { 
        id: 'faction-title', 
        log: " > Faction Intel Access Requested",
        modulePath: './modules/loaders/faction-detail-loader.js',
        loaderFn: 'loadFactionDetails'
    },
    { 
        id: 'timeline-embed', 
        log: " > Constructing Chronology",
        modulePath: './modules/loaders/timeline-loader.js',
        loaderFn: 'displayTimeline'
    },
    { 
        id: 'map', 
        log: " > Satellite Uplink Establishing...",
        modulePath: './modules/loaders/location-loader.js',
        loaderFn: 'displayLocations'
    },
    { 
        id: 'location-intel', 
        log: " > Focusing Drone Feed",
        modulePath: './modules/loaders/location-detail-loader.js',
        loaderFn: 'loadLocationDetails'
    },
    { 
        id: 'archive-grid', 
        log: " > Archive Access Granted",
        modulePath: './modules/loaders/lore-loader.js',
        loaderFn: 'displayLoreList'
    },
    { 
        id: 'evidence-container', 
        log: " > Examining Evidence",
        modulePath: './modules/loaders/lore-detail-loader.js',
        loaderFn: 'loadLoreDetails'
    },
    { 
        id: 'profile-content', 
        log: " > Verifying Biometrics",
        modulePath: './modules/auth/profile.js',
        loaderFn: 'loadProfilePage'
    }
];

/* --------------------------------------------------------------------------
   EXECUTION PROTOCOL (MAIN FUNCTION)
   -------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', async () => {
    
    console.log(
        "%c TSOF // SYSTEM ONLINE ", 
        "color: #000; background: #c5a059; padding: 5px; font-weight: bold; font-family: monospace;"
    );

    // FOUC ÖNLEME
    gsap.set("body", { autoAlpha: 0 });

    // GLOBAL AYARLAR VE DİL DEĞİŞTİRME MANTIĞI
    window.changeAppLanguage = async (lang) => {
        try {
            await changeLanguage(lang);
            updatePageTranslations(); // Dil değişince metinleri güncelle
            
            // Aktif buton görselini güncelle
            document.querySelectorAll('.lang-btn').forEach(btn => {
                btn.classList.remove('text-white', 'font-bold', 'underline');
                btn.classList.add('text-gray-500');
                if(btn.dataset.lang === lang) {
                    btn.classList.add('text-white', 'font-bold', 'underline');
                    btn.classList.remove('text-gray-500');
                }
            });
            
            // Sayfayı yenilemeye gerek yok, i18next ve loader fonksiyonları dinamik çalışır
        } catch (e) {
            console.error("Language Switch Error:", e);
        }
    };

    initMobileMenu();
    initAuth();

    try {
        // 1. DİL YÜKLEME (BEKLE)
        const currentLang = await initI18n();
        console.log(` > Language Protocol: LOADED [${currentLang.toUpperCase()}]`);

        // 2. SAYFAYI ÇEVİR (İLK YÜKLEME)
        updatePageTranslations();

        // Aktif dil butonunu işaretle
        const activeBtn = document.querySelector(`.lang-btn[data-lang="${currentLang.substring(0,2)}"]`);
        if (activeBtn) {
            activeBtn.classList.add('text-white', 'font-bold', 'underline');
            activeBtn.classList.remove('text-gray-500');
        }

        // 3. MODÜL YÜKLEME (ROUTER)
        let pageModuleLoaded = false;

        for (const config of ROUTER_CONFIGS) {
            const idsToCheck = Array.isArray(config.id) ? config.id : [config.id];
            const isPageActive = idsToCheck.some(id => document.getElementById(id));

            if (isPageActive) {
                console.log(config.log);
                try {
                    const loaderImporter = moduleMap[config.modulePath];
                    if (!loaderImporter) {
                        console.error(`ERROR: Module path missing in glob: ${config.modulePath}`);
                        continue; 
                    }

                    const module = await loaderImporter();
                    
                    if (module[config.loaderFn]) {
                        await module[config.loaderFn](); // Sayfa modülünü çalıştır
                        pageModuleLoaded = true;
                    } 
                    break; 
                } catch (error) {
                    console.error(`FATAL ERROR: Failed to load module for ${config.log}`, error);
                }
            }
        }

        if (!pageModuleLoaded) {
            console.log(" > Standby Mode: Homepage or Static Page Active.");
        }

        // 4. FİNAL: PERDEYİ AÇ
        gsap.to("body", { 
            autoAlpha: 1, 
            duration: 1.2, 
            ease: "power2.inOut" 
        });

    } catch (error) {
        console.error(" ! System Protocol Failure:", error);
        // Hata olsa bile sayfayı göster
        gsap.to("body", { autoAlpha: 1 });
    }
});