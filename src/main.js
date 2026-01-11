/**
 * THE SINS OF THE FATHERS
 * Main Execution Protocol (v6.0 - Vite Standard Structure)
 * --------------------------------------------------------------
 * Heavy async operations are deferred to prevent main thread blocking,
 * ensuring immediate page interactivity and smooth scrolling.
 * SENTRY importu dinamik hale getirildi.
 */

// 1. İMPORTLAR
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import i18next, { initI18n, changeLanguage } from './lib/i18n.js';
import Lenis from '@studio-freight/lenis';

// Modüller
import initAuth from './modules/auth/auth.js';
import { initMobileMenu } from './modules/ui/mobile-menu.js';
import { initAudioSystem } from './modules/ui/audio-manager.js';
import { initCookieConsent } from './modules/ui/app-policy.js';

gsap.registerPlugin(ScrollTrigger);

const lenis = new Lenis();
lenis.on('scroll', ScrollTrigger.update);
function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            lenis.scrollTo(target, {
                offset: -80,
                duration: 2
            });
        }
    });
});


const moduleMap = import.meta.glob([
    './modules/loaders/*.js',
    './modules/auth/*.js'
]);

/* --------------------------------------------------------------------------
    YARDIMCI: SENTRY BAŞLATICI (SENTRY ARTIK İÇERİDE DİNAMİK YÜKLENİYOR)
    -------------------------------------------------------------------------- */
async function initMonitoringSystem() {
    if (window.isMonitoringActive) return;

    try {
        const Sentry = await import("@sentry/browser");

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
        window.SentryCaptureException = Sentry.captureException;

    } catch (error) {
        console.error("Sentry Dynamic Import Failure:", error);
    }
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
    AĞIR İŞLEMLERİ YAPAN FONKSİYON (Performans için)
    -------------------------------------------------------------------------- */
async function initializeHeavyModules() {
    try {
        // ----------------------------------------------------------------
        // YENİ: ATTRIBUTE TABANLI OTOMATİK YÜKLEYİCİ (data-module)
        // ----------------------------------------------------------------
        const dynamicModules = document.querySelectorAll('[data-module]');

        if (dynamicModules.length > 0) {
            console.log(` > Auto-Loader: Found ${dynamicModules.length} dynamic modules.`);

            for (const el of dynamicModules) {
                const rawPath = el.dataset.module;
                const fnName = el.dataset.function || 'default';

                // Props parsing (JSON safely)
                let props = {};
                if (el.dataset.props) {
                    try { props = JSON.parse(el.dataset.props); }
                    catch (e) { console.warn("Invalid data-props JSON:", e); }
                }

                // Path resolution (Mapping friendly)
                // Eğer tam yol verilmediyse, ./modules/loaders/ içinde ara
                let targetPath = rawPath;
                if (!moduleMap[targetPath]) {
                    const potentialPath = `./modules/loaders/${rawPath}`;
                    if (moduleMap[potentialPath]) targetPath = potentialPath;
                }

                if (moduleMap[targetPath]) {
                    try {
                        const module = await moduleMap[targetPath]();
                        if (typeof module[fnName] === 'function') {
                            console.log(` > Executing Module: ${rawPath} -> ${fnName}`);
                            await module[fnName](el, props); // Pass container (el) and props
                        } else {
                            console.error(`Module method not found: ${fnName} in ${targetPath}`);
                        }
                    } catch (err) {
                        console.error(`Dynamic Module Failed: ${targetPath}`, err);
                        if (window.isMonitoringActive && window.SentryCaptureException) {
                            window.SentryCaptureException(err, { tags: { module: targetPath } });
                        }
                    }
                } else {
                    console.warn(`Module not found in map: ${rawPath}`);
                }
            }
        } else {
            console.log(" > Standby Mode: No dynamic modules detected.");
        }

    } catch (error) {
        console.error(" ! Deferred System Failure:", error);
        if (window.isMonitoringActive && window.SentryCaptureException) window.SentryCaptureException(error);
    }
}

/* --------------------------------------------------------------------------
    ANA ÇALIŞTIRMA PROTOKOLÜ (Hafifletilmiş)
    -------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', async () => { // Made async to await initI18n

    console.log("%c TSOF // SYSTEM ONLINE ", "color: #000; background: #c5a059; padding: 5px; font-weight: bold; font-family: monospace; font-display: swap;");
    gsap.set("body", { autoAlpha: 0 });

    if (localStorage.getItem('tsof_cookie_consent') === 'accepted') {
        initMonitoringSystem();
    }
    window.enableTrackingSystem = () => initMonitoringSystem();

    // Language and Cookie Consent initialization moved here
    const currentLang = await initI18n();
    console.log(` > Language Protocol: LOADED [${currentLang.toUpperCase()}]`);
    updatePageTranslations();
    initCookieConsent();

    const activeBtn = document.querySelector(`.lang-btn[data-lang="${currentLang.substring(0, 2)}"]`);
    if (activeBtn) {
        activeBtn.classList.add('text-white', 'font-bold', 'underline');
        activeBtn.classList.remove('text-gray-200');
    }

    window.changeAppLanguage = async (lang) => {
        try {
            await changeLanguage(lang);
            updatePageTranslations();
            document.querySelectorAll('.lang-btn').forEach(btn => {
                btn.classList.remove('text-white', 'font-bold', 'underline');
                btn.classList.add('text-gray-200');
                if (btn.dataset.lang === lang) {
                    btn.classList.add('text-white', 'font-bold', 'underline');
                    btn.classList.remove('text-gray-200');
                }
            });
        } catch (e) {
            console.error("Language Switch Error:", e);
            if (window.isMonitoringActive && window.SentryCaptureException) window.SentryCaptureException(e);
        }
    };

    initMobileMenu();
    initAuth();
    initAudioSystem();

    gsap.to("body", {
        autoAlpha: 1,
        duration: 1.2,
        ease: "power2.inOut"
    });

    setTimeout(initializeHeavyModules, 100);
});