/**
 * THE SINS OF THE FATHERS
 * Main Execution Protocol (v5.0 - GDPR Compliant)
 * --------------------------------------------------------------
 * Orchestrates error monitoring (Sentry), module loading, animations (GSAP), 
 * localization (i18n), audio system, and cookie consent.
 */

// 1. IMPORTLAR
import * as Sentry from "@sentry/browser";
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import i18next, { initI18n, changeLanguage } from './lib/i18n.js';

// Modüller
import initAuth from './modules/auth/auth.js';
import { initMobileMenu } from './modules/ui/mobile-menu.js';
import { initAudioSystem } from './modules/ui/audio-manager.js';
import { initCookieConsent } from './modules/ui/cookie-consent.js';

// GSAP Ayarları
gsap.registerPlugin(ScrollTrigger);

// Vite Modül Haritası
const moduleMap = import.meta.glob([
    './modules/loaders/*.js', 
    './modules/auth/*.js'
]);

/* --------------------------------------------------------------------------
   YARDIMCI: SENTRY BAŞLATICI (Sadece İzin Varsa Çalışır)
   -------------------------------------------------------------------------- */
function initMonitoringSystem() {
    // Çifte başlatmayı önle
    if (window.isMonitoringActive) return;

    console.log(" > System: Security Protocols (Sentry) Activated.");
    
    Sentry.init({
        dsn: "https://9a12c94e774235b975e6820692f11ba4@o4510453482520576.ingest.de.sentry.io/4510453491105872",
        integrations: [
            Sentry.browserTracingIntegration(),
            Sentry.replayIntegration(),
        ],
        tracesSampleRate: 1.0, 
        tracePropagationTargets: ["localhost", /^https:\/\/thesinsofthefathers\.com/],
        replaysSessionSampleRate: 0.1, 
        replaysOnErrorSampleRate: 1.0, 
    });

    window.isMonitoringActive = true;
}

/* --------------------------------------------------------------------------
   YARDIMCI: SAYFA ÇEVİRİSİ
   -------------------------------------------------------------------------- */
function updatePageTranslations() {
    if (!i18next.isInitialized) return;

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const translation = i18next.t(key);
        
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            el.placeholder = translation;
        } else {
            el.innerHTML = translation; 
        }
    });

    const titleKey = document.body.getAttribute('data-page-title-key');
    if (titleKey) document.title = i18next.t(titleKey);
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

    // KABUL EDİLMİŞSE BAŞLAT
    // Daha önce 'accepted' denmişse, sistem hemen devreye girer.
    if (localStorage.getItem('tsof_cookie_consent') === 'accepted') {
        initMonitoringSystem();
    }

    // GLOBAL AYARLAR (Cookie Consent Callback Eklendi)
    // Bu fonksiyonu window'a atıyoruz ki cookie-consent.js içinden çağırılabilsin.
    window.enableTrackingSystem = () => {
        initMonitoringSystem();
    };

    window.changeAppLanguage = async (lang) => {
        try {
            await changeLanguage(lang);
            updatePageTranslations();
            
            document.querySelectorAll('.lang-btn').forEach(btn => {
                btn.classList.remove('text-white', 'font-bold', 'underline');
                btn.classList.add('text-gray-500');
                if(btn.dataset.lang === lang) {
                    btn.classList.add('text-white', 'font-bold', 'underline');
                    btn.classList.remove('text-gray-500');
                }
            });
        } catch (e) {
            console.error("Language Switch Error:", e);
            // Sentry aktifse hata gönderir, değilse göndermez (güvenli)
            if (window.isMonitoringActive) Sentry.captureException(e);
        }
    };

    initMobileMenu();
    initAuth();
    initAudioSystem();

    try {
        // 1. DİL YÜKLEME
        const currentLang = await initI18n();
        console.log(` > Language Protocol: LOADED [${currentLang.toUpperCase()}]`);

        // 2. SAYFAYI ÇEVİR
        updatePageTranslations();

        // 3. COOKIE CONSENT BAŞLAT
        initCookieConsent();

        // Dil butonu güncelleme
        const activeBtn = document.querySelector(`.lang-btn[data-lang="${currentLang.substring(0,2)}"]`);
        if (activeBtn) {
            activeBtn.classList.add('text-white', 'font-bold', 'underline');
            activeBtn.classList.remove('text-gray-500');
        }

        // 4. MODÜL YÜKLEME
        let pageModuleLoaded = false;

        for (const config of ROUTER_CONFIGS) {
            const idsToCheck = Array.isArray(config.id) ? config.id : [config.id];
            const isPageActive = idsToCheck.some(id => document.getElementById(id));

            if (isPageActive) {
                console.log(config.log);
                try {
                    const loaderImporter = moduleMap[config.modulePath];
                    if (!loaderImporter) {
                        console.error(`ERROR: Module path missing: ${config.modulePath}`);
                        continue; 
                    }

                    const module = await loaderImporter();
                    
                    if (module[config.loaderFn]) {
                        await module[config.loaderFn]();
                        pageModuleLoaded = true;
                    } 
                    break; 
                } catch (error) {
                    console.error(`ERROR: ${config.log}`, error);
                    if (window.isMonitoringActive) {
                        Sentry.captureException(error, { tags: { module: config.modulePath } });
                    }
                }
            }
        }

        if (!pageModuleLoaded) {
            console.log(" > Standby Mode: Static Page Active.");
        }

        // 5. FİNAL: PERDEYİ AÇ
        gsap.to("body", { 
            autoAlpha: 1, 
            duration: 1.2, 
            ease: "power2.inOut" 
        });

    } catch (error) {
        console.error(" ! System Failure:", error);
        if (window.isMonitoringActive) Sentry.captureException(error);
        gsap.to("body", { autoAlpha: 1 });
    }
});