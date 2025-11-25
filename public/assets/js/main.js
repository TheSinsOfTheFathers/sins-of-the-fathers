/**
 * THE SINS OF THE FATHERS
 * Main Execution Protocol (v4.0 - Optimized Dynamic Routing)
 * --------------------------------------------------------------
 * This file orchestrates module loading dynamically based on the current page's DOM presence.
 */

import initAuth from './modules/auth/auth.js';
import { initMobileMenu } from './modules/ui/mobile-menu.js';

/* --------------------------------------------------------------------------
   ROUTER CONFIGURATION (MAPPINGS)
   --------------------------------------------------------------------------
   Anahtar (Key): DOM'da aranacak unique ID.
   Değer (Value): { 
       log: Konsolda gösterilecek mesaj,
       modulePath: Dinamik yüklenecek dosyanın yolu,
       loaderFn: Dosyadan çağrılacak asenkron fonksiyonun adı 
   }
*/
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

    initMobileMenu();
    initAuth();
    
    for (const config of ROUTER_CONFIGS) {
        
        const idsToCheck = Array.isArray(config.id) ? config.id : [config.id];
        
        const isPageActive = idsToCheck.some(id => document.getElementById(id));

        if (isPageActive) {
            
            console.log(config.log);

            try {
                const module = await import(config.modulePath);
                
                if (module[config.loaderFn]) {
                    module[config.loaderFn]();
                } else {
                    console.error(`ERROR: Module ${config.modulePath} does not export function ${config.loaderFn}`);
                }
                
                return; 

            } catch (error) {
                console.error(`FATAL ERROR: Failed to load module for ${config.log}`, error);
            }
        }
    }

    console.log(" > Standby Mode: No dedicated page module loaded.");
});