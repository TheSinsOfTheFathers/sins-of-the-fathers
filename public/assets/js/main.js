/**
 * THE SINS OF THE FATHERS
 * Main Execution Protocol (v4.1 - i18n Integrated)
 * --------------------------------------------------------------
 * This file orchestrates module loading dynamically based on the current page's DOM presence.
 */

import initAuth from './modules/auth/auth.js';
import { initMobileMenu } from './modules/ui/mobile-menu.js';
import { initI18n, changeLanguage } from './lib/i18n.js';

/* --------------------------------------------------------------------------
   ROUTER CONFIGURATION (MAPPINGS)
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

    // 1. GLOBAL FONKSİYON ATAMASI
    // HTML'deki butonların (onclick="changeAppLanguage(...)") erişebilmesi için window'a atıyoruz.
    window.changeAppLanguage = changeLanguage;

    // 2. SENKRON UI BAŞLATMALARI
    // Not: Mobil menü elemanı sayfada yoksa mobile-menu.js içindeki kontrol sayesinde hata vermez.
    initMobileMenu();
    initAuth();

    // 3. i18n DİL PROTOKOLÜNÜ BAŞLAT
    // Await kullanıyoruz ki çeviriler yüklenmeden sayfa içeriği render edilmesin.
    try {
        const currentLang = await initI18n();
        console.log(` > Language Protocol: LOADED [${currentLang.toUpperCase()}]`);

        // Aktif dil butonunu parlat (Görsel geri bildirim)
        const activeBtn = document.querySelector(`.lang-btn[data-lang="${currentLang.substring(0,2)}"]`);
        if (activeBtn) {
            activeBtn.classList.add('text-white', 'font-bold', 'underline');
            activeBtn.classList.remove('text-gray-500');
        }

    } catch (error) {
        console.error(" ! Language Protocol Failure:", error);
    }
    
    // 4. SAYFAYA ÖZEL MODÜLLERİ YÜKLE (ROUTER)
    // Bu kısım çalışmadan önce Dil verisi hazır olduğu için 'lore-detail-loader' 
    // doğru dildeki içeriği Sanity'den çekebilir.
    for (const config of ROUTER_CONFIGS) {
        
        const idsToCheck = Array.isArray(config.id) ? config.id : [config.id];
        
        // Sayfada bu ID'lerden biri var mı kontrol et
        const isPageActive = idsToCheck.some(id => document.getElementById(id));

        if (isPageActive) {
            
            console.log(config.log);

            try {
                // Dinamik import ile sadece gerekli JS dosyasını yükle
                const module = await import(config.modulePath);
                
                if (module[config.loaderFn]) {
                    // Modülü başlat
                    await module[config.loaderFn]();
                } else {
                    console.error(`ERROR: Module ${config.modulePath} does not export function ${config.loaderFn}`);
                }
                
                return; // Sayfa modülü bulunduğunda döngüyü kır (Performans için)

            } catch (error) {
                console.error(`FATAL ERROR: Failed to load module for ${config.log}`, error);
            }
        }
    }

    console.log(" > Standby Mode: No dedicated page module loaded.");
});