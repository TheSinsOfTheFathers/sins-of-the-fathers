/**
 * THE SINS OF THE FATHERS
 * Main Execution Protocol (v3.0)
 * --------------------------------------------------------------
 * This file orchestrates all module loading based on the current page's DOM presence.
 */

// --- MODULE IMPORTS ---
import initAuth from './modules/auth/auth.js';
import { initMobileMenu } from './modules/ui/mobile-menu.js';

// Loaders (Lazy Load Logic managed via if-checks)
import { displayCharacters } from './modules/loaders/character-loader.js';
import { loadCharacterDetails } from './modules/loaders/character-detail-loader.js';
import { displayFactions } from './modules/loaders/faction-loader.js';
import { loadFactionDetails } from './modules/loaders/faction-detail-loader.js';
import { displayTimeline } from './modules/loaders/timeline-loader.js';
import { displayLocations } from './modules/loaders/location-loader.js'; // Map Engine
import { loadLocationDetails } from './modules/loaders/location-detail-loader.js';
import { displayLoreList } from './modules/loaders/lore-loader.js';
import { loadLoreDetails } from './modules/loaders/lore-detail-loader.js';
import { loadProfilePage } from './modules/auth/profile.js';

/* --------------------------------------------------------------------------
   SYSTEM INIT
   -------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
    
    // Noir Console Branding
    console.log(
        "%c TSOF // SYSTEM ONLINE ", 
        "color: #000; background: #c5a059; padding: 5px; font-weight: bold; font-family: monospace;"
    );

    /* 1. GLOBAL UTILITIES */
    initMobileMenu();
    initAuth();

    /* 2. PAGE ROUTING (DETECTION BY DOM ID) */
    
    // A. CHARACTERS PAGE
    // Detects either the 'Protagonists' or 'Main' gallery containers
    if (document.getElementById('protagonists-gallery') || document.getElementById('main-characters-gallery')) {
        console.log(" > Personnel Database Detected");
        displayCharacters();
    }

    // B. CHARACTER DETAIL (Dossier)
    // Detects the dynamic dossier wrapper
    if (document.getElementById('character-dossier')) {
        console.log(" > Dossier Decryption Started");
        loadCharacterDetails();
    }

    // C. FACTIONS PAGE (War Room)
    if (document.getElementById('factions-grid')) {
        console.log(" > Tactical Overview Initialized");
        displayFactions();
    }

    // D. FACTION DETAIL (HQ)
    // Check for the dynamic banner or specific leader ID container
    if (document.getElementById('faction-title')) {
        console.log(" > Faction Intel Access Requested");
        loadFactionDetails();
    }

    // E. TIMELINE (Chronicles)
    if (document.getElementById('timeline-embed')) {
        console.log(" > Constructing Chronology");
        displayTimeline();
    }

    // F. LOCATIONS / MAP (Global View)
    // The Leaflet map container
    if (document.getElementById('map')) {
        console.log(" > Satellite Uplink Establishing...");
        displayLocations(); // This fires up the Map & Markers
    }

    // G. LOCATION DETAIL (Surveillance Feed)
    if (document.getElementById('location-intel')) {
        console.log(" > Focusing Drone Feed");
        loadLocationDetails();
    }

    // H. LORE ARCHIVE (The Wall)
    if (document.getElementById('archive-grid')) {
        console.log(" > Archive Access Granted");
        displayLoreList();
    }

    // I. LORE DETAIL (Reader)
    if (document.getElementById('evidence-container')) {
        console.log(" > Examining Evidence");
        loadLoreDetails();
    }

    // J. PROFILE (ID Card)
    if (document.getElementById('profile-content')) {
        console.log(" > Verifying Biometrics");
        loadProfilePage();
    }

});