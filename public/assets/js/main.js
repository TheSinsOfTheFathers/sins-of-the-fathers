import { displayCharacters } from './modules/loaders/character-loader.js';
import { loadCharacterDetails } from './modules/loaders/character-detail-loader.js';
import { loadFactionDetails } from './modules/loaders/faction-detail-loader.js';
import { displayFactions } from './modules/loaders/faction-loader.js';
import { displayTimeline } from './modules/loaders/timeline-loader.js';
import { initMobileMenu } from './modules/ui/mobile-menu.js';
import { displayLoreList } from './modules/loaders/lore-loader.js';
import { loadLoreDetails } from './modules/loaders/lore-detail-loader.js';
import { initAuth } from './modules/auth/auth.js';
import { loadProfilePage } from './modules/auth/profile.js';

document.addEventListener('DOMContentLoaded', () => {    
    console.log("🧩 [App Init] DOM Content Loaded. Initializing core modules.");

    // Global Initializers
    initMobileMenu();
    console.log("📱 [App Init] Mobile menu handler initialized.");
    
    initAuth();
    console.log("🔐 [App Init] Authentication system initialized.");

    // Page-specific Loaders (Conditional Logic)
    
    if (document.getElementById('main-characters-gallery')) {
        console.log("👤 [Loader] Found 'main-characters-gallery'. Calling displayCharacters().");
        displayCharacters();
    }
    
    if (document.getElementById('character-detail-content')) {
        console.log("👁️ [Loader] Found 'character-detail-content'. Calling loadCharacterDetails().");
        loadCharacterDetails();
    }
    
    if (document.getElementById('factions-grid')) {
        console.log("🚩 [Loader] Found 'factions-grid'. Calling displayFactions().");
        displayFactions();
    }
    
    if (document.getElementById('faction-detail-content')) {
        console.log("🏰 [Loader] Found 'faction-detail-content'. Calling loadFactionDetails().");
        loadFactionDetails();
    }
    
    if (document.getElementById('timeline-container')) {
        console.log("⏳ [Loader] Found 'timeline-container'. Calling displayTimeline().");
        displayTimeline();
    }
    
    if (document.getElementById('lore-list-container')) {
        console.log("📜 [Loader] Found 'lore-list-container'. Calling displayLoreList().");
        displayLoreList();
    }
    
    if (document.getElementById('lore-detail-content')) {
        console.log("🔍 [Loader] Found 'lore-detail-content'. Calling loadLoreDetails().");
        loadLoreDetails();
    }
    
    if (document.getElementById('profile-content')) {
        console.log("👤 [Loader] Found 'profile-content'. Calling loadProfilePage().");
        loadProfilePage();
    }

    console.log("✅ [App Init] All page loaders checked.");
});