/**
 * THE SINS OF THE FATHERS
 * Main Execution Protocol (v6.0 - Vite Standard Structure)
 * --------------------------------------------------------------
 * All modules now reside in the 'src' directory for proper Vite processing.
 * Heavy async operations are deferred to prevent main thread blocking,
 * ensuring immediate page interactivity and smooth scrolling.
 */

// 1. IMPORTLAR
import * as Sentry from "@sentry/browser";
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import i18next, { initI18n, changeLanguage } from './lib/i18n.js';
import Lenis from '@studio-freight/lenis';

// Modüller (Artık hepsi 'src' klasöründen geliyor)
import initAuth from './modules/auth/auth.js';
import { initMobileMenu } from './modules/ui/mobile-menu.js';
import { initAudioSystem } from './modules/ui/audio-manager.js';
import { initCookieConsent } from './modules/ui/app-policy.js';

// GSAP Ayarları
gsap.registerPlugin(ScrollTrigger);

// LENIS (AKICI KAYDIRMA) & GSAP SCROLLTRIGGER ENTEGRASYONU
// En stabil yöntem olan bağımsız animasyon döngüsü kullanılıyor.
const lenis = new Lenis();
lenis.on('scroll', ScrollTrigger.update);
function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);


// Vite Modül Haritası (Dinamik importlar için)
const moduleMap = import.meta.glob([
    './modules/loaders/*.js', 
    './modules/auth/*.js'
]);

/* --------------------------------------------------------------------------
   YARDIMCI: SENTRY BAŞLATICI
   -------------------------------------------------------------------------- */
function initMonitoringSystem() {
    if (window.isMonitoringActive) return;
    console.log(" > System: Security Protocols (Sentry) Activated.");
    Sentry.init({
        dsn: "https://9a12c94e774235b975e6820692f11ba4@o4510453482520576.ingest.de.sentry.io/4510453491105872",
        integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
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
   ROUTER CONFIGURATION (Yollar düzeltildi)
   -------------------------------------------------------------------------- */
const ROUTER_CONFIGS = [
    { id: ['protagonists-gallery', 'main-characters-gallery'], log: " > Personnel Database Detected", modulePath: './modules/loaders/character-loader.js', loaderFn: 'displayCharacters' },
    { id: 'character-dossier', log: " > Dossier Decryption Started", modulePath: './modules/loaders/character-detail-loader.js', loaderFn: 'loadCharacterDetails' },
    { id: 'factions-grid', log: " > Tactical Overview Initialized", modulePath: './modules/loaders/faction-loader.js', loaderFn: 'displayFactions' },
    { id: 'faction-title', log: " > Faction Intel Access Requested", modulePath: './modules/loaders/faction-detail-loader.js', loaderFn: 'loadFactionDetails' },
    { id: 'timeline-embed', log: " > Constructing Chronology", modulePath: './modules/loaders/timeline-loader.js', loaderFn: 'displayTimeline' },
    { id: 'map', log: " > Satellite Uplink Establishing...", modulePath: './modules/loaders/location-loader.js', loaderFn: 'displayLocations' },
    { id: 'location-intel', log: " > Focusing Drone Feed", modulePath: './modules/loaders/location-detail-loader.js', loaderFn: 'loadLocationDetails' },
    { id: 'archive-grid', log: " > Archive Access Granted", modulePath: './modules/loaders/lore-loader.js', loaderFn: 'displayLoreList' },
    { id: 'evidence-container', log: " > Examining Evidence", modulePath: './modules/loaders/lore-detail-loader.js', loaderFn: 'loadLoreDetails' },
    { id: 'profile-content', log: " > Verifying Biometrics", modulePath: './modules/auth/profile.js', loaderFn: 'loadProfilePage' }
];

/* --------------------------------------------------------------------------
   AĞIR İŞLEMLERİ YAPAN FONKSİYON (Performans için)
   -------------------------------------------------------------------------- */
async function initializeHeavyModules() {
    try {
        const currentLang = await initI18n();
        console.log(` > Language Protocol: LOADED [${currentLang.toUpperCase()}]`);
        updatePageTranslations();
        initCookieConsent();

        const activeBtn = document.querySelector(`.lang-btn[data-lang="${currentLang.substring(0,2)}"]`);
        if (activeBtn) {
            activeBtn.classList.add('text-white', 'font-bold', 'underline');
            activeBtn.classList.remove('text-gray-500');
        }

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
                    if (window.isMonitoringActive) Sentry.captureException(error, { tags: { module: config.modulePath } });
                }
            }
        }
        if (!pageModuleLoaded) console.log(" > Standby Mode: Static Page Active.");

    } catch (error) {
        console.error(" ! Deferred System Failure:", error);
        if (window.isMonitoringActive) Sentry.captureException(error);
    }
}

/* --------------------------------------------------------------------------
   ANA ÇALIŞTIRMA PROTOKOLÜ (Hafifletilmiş)
   -------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
    
    console.log("%c TSOF // SYSTEM ONLINE ", "color: #000; background: #c5a059; padding: 5px; font-weight: bold; font-family: monospace;");
    gsap.set("body", { autoAlpha: 0 });

    // HIZLI VE SENKRON İŞLEMLER
    if (localStorage.getItem('tsof_cookie_consent') === 'accepted') {
        initMonitoringSystem();
    }
    window.enableTrackingSystem = () => initMonitoringSystem();
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
            if (window.isMonitoringActive) Sentry.captureException(e);
        }
    };

    initMobileMenu();
    initAuth();
    initAudioSystem();

    // SAYFAYI GÖRÜNÜR YAP
    gsap.to("body", { 
        autoAlpha: 1, 
        duration: 1.2, 
        ease: "power2.inOut" 
    });

    // AĞIR İŞLEMLERİ ERTELE (Scroll gecikmesini önler)
    setTimeout(initializeHeavyModules, 100); 
});