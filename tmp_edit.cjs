const fs = require('fs');
const file = 'c:/Users/SOFT/Documents/GitHub/sins-of-the-fathers/pages/faction-detail.html';
let content = fs.readFileSync(file, 'utf8');

const split1 = content.split('<!-- Main Content Area -->');
const split2 = split1[1].split('<!-- CONTENT -->');
const split3 = split2[1].split('<!-- Footer -->');

const replacementHero = `
    <div id="main-wrapper" class="flex flex-col grow pt-[4rem] min-h-screen">
        
        <!-- DOSSIER HEADER (Premium Noir Style) -->
        <div class="relative w-full border-b border-white/5 bg-obsidian mt-8">
            <!-- Background Image Container (Dynamic) -->
            <div id="faction-banner" class="absolute inset-0 bg-cover bg-center opacity-10 grayscale-[0.8] mix-blend-luminosity"></div>
            <div class="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent"></div>
            <div class="absolute inset-0 hq-bg-glow opacity-30"></div>

            <div class="container mx-auto px-6 pt-16 pb-12 relative z-10 flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
                
                <div class="flex-1 max-w-4xl">
                    <!-- Security Badges -->
                    <div class="flex items-center gap-4 mb-6">
                        <div class="border border-red-500/50 bg-red-500/10 px-3 py-1 text-red-500 font-mono text-[9px] uppercase tracking-widest flex items-center gap-2">
                            <i class="fas fa-exclamation-triangle"></i> Classified Intel
                        </div>
                        <div class="text-gray-500 font-mono text-[9px] uppercase tracking-widest border-l border-white/10 pl-4 hq-text" id="faction-file-id">
                            FILE ID: <span class="text-white">████-████</span>
                        </div>
                    </div>
                    
                    <div class="flex items-center gap-4 mb-2">
                         <!-- Fractional Icon (Populated by JS) -->
                         <div id="faction-icon-container" class="text-4xl hq-text opacity-90"></div>
                         <h1 id="faction-title" class="text-4xl md:text-6xl font-serif text-white uppercase tracking-wider drop-shadow-xl" data-i18n="faction_detail_page.retrieving">
                             Retrieving...
                         </h1>
                    </div>
                    
                    <p id="faction-subtitle" class="font-mono text-gray-400 text-sm md:text-base border-l-2 border-gold/50 pl-4 hq-text max-w-2xl mt-4" data-i18n="faction_detail_page.encrypting_connection">
                        Establishing encrypted connection...
                    </p>
                </div>
            </div>
        </div>

        `;

// Extract everything from <main> until the loader starts
const contentSplit = split3[0].split('<!-- LOADER (Specific to Faction Intel) -->');

// Rebuild the DOM, injecting the Loader into the active <main> element
let newMainContent = contentSplit[0];
// The end of newMainContent is `</main>\n    </div>\n    \n    `. We need to insert the loader before `</main>`.
newMainContent = newMainContent.replace('</main>', `
            <!-- LOADER (Inside main so JS scoped to container finds it) -->
            <div id="factions-loader" class="absolute inset-0 z-30 bg-black/90 backdrop-blur-md flex flex-col items-center justify-start pt-32 h-[50vh]">
                <div class="relative w-20 h-20 mb-6">
                    <div class="absolute inset-0 border-t-2 border-b-2 border-gold/40 rounded-full animate-[spin_3s_linear_infinite]"></div>
                    <div class="absolute inset-2 border-r-2 border-l-2 border-gold/20 rounded-full animate-[spin_2s_linear_infinite_reverse]"></div>
                    <div class="absolute inset-0 flex items-center justify-center">
                        <i class="fas fa-fingerprint text-gold text-2xl hq-text animate-pulse"></i>
                    </div>
                </div>
                <p class="font-mono text-[10px] text-gold uppercase tracking-[0.3em] hq-text animate-pulse" data-i18n="faction_detail_page.loader_text">AUTHENTICATING BIOMETRICS...</p>
                <!-- Terminal readouts -->
                <div class="mt-8 font-mono text-[9px] text-green-500/50 opacity-50 space-y-1 text-center">
                    <p>> INITIATING SECURE HANDSHAKE</p>
                    <p>> BYPASSING FIREWALL [████████]</p>
                    <p>> ACCESSING SYNDICATE ARCHIVES</p>
                </div>
            </div>
        </main>`);

const newContent = split1[0] + '<!-- Main Content Area -->\n' + replacementHero + '\n        <!-- CONTENT -->' + newMainContent + '\n    <!-- Footer -->' + split3[1];
fs.writeFileSync(file, newContent);
console.log('faction-detail hero and loader fixed.');
