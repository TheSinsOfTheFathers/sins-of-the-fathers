import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const headerBlock = `<!-- Header & Navigation -->
    <header aria-label="Main navigation" class="fixed top-0 w-full z-50 bg-obsidian/90 backdrop-blur-md border-b border-white/5 transition-all">
        <nav class="container mx-auto px-6 py-4 flex justify-between items-center relative">
            <!-- Brand -->
            <a href="/" aria-label="The Sins of the Fathers - Home" class="text-xl md:text-3xl font-serif text-gold tracking-widest uppercase hover:text-white transition-colors z-20 relative">
                TSOF
            </a>
            
            <!-- Desktop Menu (Absolute Center) -->
            <div class="hidden md:flex absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 items-center space-x-6 xl:space-x-8 text-xs xl:text-sm uppercase tracking-widest font-semibold whitespace-nowrap">
                <a href="/pages/bloodline.html" aria-label="Navigate to The Bloodline: Intelligence Web" class="text-gray-400 hover:text-gold transition-colors block border-b border-transparent hover:border-gold" data-i18n="nav.bloodline">THE BLOODLINE</a>
                <a href="/pages/characters.html" aria-label="Navigate to The Dossier: Characters" class="text-gray-400 hover:text-gold transition-colors block border-b border-transparent hover:border-gold" data-i18n="nav.dossier">DOSSIER</a>
                <a href="/pages/timeline.html" aria-label="Navigate to History: Timeline" class="text-gray-400 hover:text-gold transition-colors block border-b border-transparent hover:border-gold" data-i18n="nav.history">HISTORY</a>
                <a href="/pages/factions.html" aria-label="Navigate to Power Dynamics: Factions" class="text-gray-400 hover:text-gold transition-colors block border-b border-transparent hover:border-gold" data-i18n="nav.factions">FACTIONS</a>
                <a href="/pages/locations.html" aria-label="Navigate to Territories: Locations" class="text-gray-400 hover:text-gold transition-colors block border-b border-transparent hover:border-gold" data-i18n="nav.territories">TERRITORIES</a>

                <a href="https://shop.thesinsofthefathers.com" aria-label="Visit the merchandise store" class="text-gray-400 hover:text-gold transition-colors block border-b border-transparent hover:border-gold" target="_blank" data-i18n="nav.merch">MERCH</a>
                <a href="https://blog.thesinsofthefathers.com" aria-label="Visit the blog" class="text-gray-400 hover:text-gold transition-colors block border-b border-transparent hover:border-gold" data-i18n="nav.blog">BLOG</a>
                
                <!-- Auth Controls -->
                <div class="border-l border-white/20 pl-6 ml-4 flex items-center gap-4" id="auth-controls">
                    <a href="/pages/lore.html" aria-label="Access classified lore archive" id="nav-link-classified" class="text-gold hover:text-white transition-colors flex items-center gap-2">
                        <i class="fas fa-lock text-xs guest-lock"></i> <span data-i18n="nav.classified">Classified</span>
                    </a>
                    <a href="/pages/login.html" aria-label="Sign in to your account" class="hover:text-gold transition-colors guest-only" id="auth-signin-link" data-i18n="auth.login"><span data-i18n="auth.login">Sign in</span></a>
                </div>
            </div>

            <!-- Mobile Hamburger -->
            <div class="md:hidden relative z-50">
                <button id="hamburger-button" aria-label="Open main menu" class="text-gold focus:outline-none flex flex-col justify-center items-center w-8 h-8 space-y-1.5 group">
                    <span class="block w-6 h-0.5 bg-gold transition-transform duration-300"></span>
                    <span class="block w-6 h-0.5 bg-gold transition-opacity duration-300"></span>
                    <span class="block w-6 h-0.5 bg-gold transition-transform duration-300"></span>
                </button>
            </div>

            <!-- Language Switcher (Desktop) -->
            <div class="hidden md:flex gap-2 font-mono text-[10px] z-20 relative">
                <button class="lang-btn hover:text-gold transition-colors text-gray-200" data-lang="en" onclick="window.changeAppLanguage('en')">EN</button>
                <span class="text-gray-600">/</span>
                <button class="lang-btn hover:text-gold transition-colors text-gray-200" data-lang="tr" onclick="window.changeAppLanguage('tr')">TR</button>
            </div>
        </nav>
    </header>`;

const mobileMenuBlock = `<!-- Mobile Menu Overlay -->
    <div id="mobile-menu" class="hidden fixed inset-0 z-40 bg-black/95 flex-col items-center justify-center space-y-8 transition-opacity duration-300 backdrop-blur-xl">
        <a href="/pages/bloodline.html" aria-label="Navigate to The Bloodline: Intelligence Web" class="text-2xl text-white font-serif hover:text-gold uppercase tracking-widest" data-i18n="nav.bloodline">Bloodline</a>
        <a href="/pages/characters.html" aria-label="Navigate to The Dossier: Characters" class="text-2xl text-white font-serif hover:text-gold uppercase tracking-widest" data-i18n="nav.dossier">Dossier</a>
        <a href="/pages/timeline.html" aria-label="Navigate to History: Timeline" class="text-2xl text-white font-serif hover:text-gold uppercase tracking-widest" data-i18n="nav.history">History</a>
        <a href="/pages/factions.html" aria-label="Navigate to Power Dynamics: Factions" class="text-2xl text-white font-serif hover:text-gold uppercase tracking-widest" data-i18n="nav.factions">Factions</a>
        <a href="/pages/locations.html" aria-label="Navigate to Territories: Locations" class="text-2xl text-white font-serif hover:text-gold uppercase tracking-widest" data-i18n="nav.territories">Territories</a>

        <a href="https://shop.thesinsofthefathers.com" aria-label="Visit the merchandise store" class="text-2xl text-white font-serif hover:text-gold uppercase tracking-widest transition-colors" target="_blank" data-i18n="nav.merch">Merch</a>
        <a href="https://blog.thesinsofthefathers.com" aria-label="Visit the blog" class="text-2xl text-white font-serif hover:text-gold uppercase tracking-widest" data-i18n="nav.blog">Blog</a>
        <a href="/pages/lore.html" aria-label="Access classified lore archive" id="nav-link-classified" class="text-xl text-gold font-serif hover:text-white uppercase tracking-widest" data-i18n="nav.classified">Classified</a>
        <a href="/pages/login.html" aria-label="Sign in to your account" class="text-sm text-gray-400 hover:text-white mt-8 font-mono uppercase" data-i18n="auth.login">Sign in</a>

        <!-- Mobile Language -->
        <div class="flex gap-4 font-mono text-sm mt-4">
            <button class="lang-btn hover:text-gold transition-colors text-gray-200" data-lang="en" onclick="window.changeAppLanguage('en')">EN</button>
            <span class="text-gray-600">/</span>
            <button class="lang-btn hover:text-gold transition-colors text-gray-200" data-lang="tr" onclick="window.changeAppLanguage('tr')">TR</button>
        </div>
    </div>`;

const files = [
    'index.html',
    'pages/404.html',
    'pages/bloodline.html',
    'pages/character-detail.html',
    'pages/characters.html',
    'pages/event.html',
    'pages/faction-detail.html',
    'pages/factions.html',
    'pages/location-detail.html',
    'pages/locations.html',
    'pages/login.html',
    'pages/lore-detail.html',
    'pages/lore.html',
    'pages/privacy.html',
    'pages/profile.html',
    'pages/silvio.html',
    'pages/terms.html',
    'pages/timeline.html'
];

function replaceBlock(content, startStr, endStr, replacement) {
    const startIndex = content.indexOf(startStr);
    if (startIndex === -1) return content;
    
    let searchFrom = startIndex + startStr.length;
    let nesting = 1;
    let currentIndex = searchFrom;
    
    if (startStr.includes('<div')) {
        while (nesting > 0 && currentIndex < content.length) {
            const nextDiv = content.indexOf('<div', currentIndex);
            const nextCloseDiv = content.indexOf('</div>', currentIndex);
            
            if (nextCloseDiv === -1) break;
            
            if (nextDiv !== -1 && nextDiv < nextCloseDiv) {
                nesting++;
                currentIndex = nextDiv + 4;
            } else {
                nesting--;
                currentIndex = nextCloseDiv + 6;
            }
        }
        return content.substring(0, startIndex) + replacement + content.substring(currentIndex);
    } else if (startStr.includes('<header')) {
        const closeHeader = content.indexOf('</header>', startIndex) + 9;
        return content.substring(0, startIndex) + replacement + content.substring(closeHeader);
    }
    
    return content;
}

files.forEach(file => {
    const fullPath = path.join(rootDir, file);
    if (!fs.existsSync(fullPath)) return;

    let content = fs.readFileSync(fullPath, 'utf-8');
    
    const headerStart = '<header aria-label="Main navigation"';
    if (content.indexOf(headerStart) !== -1) {
        content = content.replace(/<!--\s*Header & Navigation\s*-->\s*<header aria-label="Main navigation"/i, '<header aria-label="Main navigation"');
        content = replaceBlock(content, headerStart, '</header>', headerBlock);
    }

    const mobileStart = '<div id="mobile-menu"';
    if (content.indexOf(mobileStart) !== -1) {
        content = content.replace(/<!--\s*Mobile Menu Overlay\s*-->\s*<div id="mobile-menu"/i, '<div id="mobile-menu"');
        content = replaceBlock(content, mobileStart, '</div>', mobileMenuBlock);
    }

    fs.writeFileSync(fullPath, content, 'utf-8');
    console.log('Updated: ' + file);
});
