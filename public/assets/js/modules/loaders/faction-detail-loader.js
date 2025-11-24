import { client } from '../../lib/sanityClient.js';
import { toHTML } from 'https://esm.sh/@portabletext/to-html@2.0.13';

/**
 * Faksiyon Rengini ve Temasını Ayarlar
 */
const applyFactionTheme = (colorHex, bannerUrl) => {
    // 1. Ana Rengi Değiştir (CSS Variable)
    // Eğer renk yoksa varsayılan Gold (#c5a059) kullanılır.
    const themeColor = colorHex || '#c5a059';
    document.documentElement.style.setProperty('--theme-color', themeColor);

    // 2. Banner Resmini Güncelle
    const banner = document.getElementById('faction-banner');
    if (banner && bannerUrl) {
        // Tailwind background sınıflarını temizle, inline style bas
        banner.style.backgroundImage = `url('${bannerUrl}')`;
    }
};

const renderFactionDetails = (faction) => {
    // DOM Elementlerini Seç
    const els = {
        title: document.getElementById('faction-title'),
        subtitle: document.getElementById('faction-subtitle'), // Motto
        leader: document.getElementById('faction-leader'),
        hq: document.getElementById('faction-hq'),
        description: document.getElementById('faction-description'),
        iconContainer: document.getElementById('faction-icon-container'),
        roster: document.getElementById('faction-roster'),
        locationsList: document.getElementById('faction-locations-list'), // Opsiyonel
        threat: document.getElementById('threat-text') // Opsiyonel
    };

    // Title (Browser Tab) Update
    document.title = `${faction.title} // INTEL - The Sins of the Fathers`;

    // --- CONTENT INJECTION ---

    // 1. Header & Basics
    if (els.title) els.title.textContent = faction.title;
    // Animasyon tekrar tetiklensin diye class reset
    if (els.title) {
        els.title.classList.remove('animate-fade-in-down');
        void els.title.offsetWidth; // Reflow trigger
        els.title.classList.add('animate-fade-in-down');
    }

    if (els.subtitle) els.subtitle.textContent = faction.motto ? `"${faction.motto}"` : "// MOTTO REDACTED";
    
    // 2. Theme & Icon
    const icon = faction.type === 'syndicate' 
        ? '<i class="fas fa-skull-crossbones"></i>' // Macpherson Style
        : '<i class="fas fa-chess-king"></i>';      // Ballantine Style
        
    if (els.iconContainer) els.iconContainer.innerHTML = icon;
    
    // CSS Theme Rengini Uygula
    applyFactionTheme(faction.color?.hex, faction.image?.asset?.url);

    // 3. Stats
    if (els.leader) {
        const leaderName = faction.leader ? faction.leader.name : 'UNKNOWN';
        const leaderSlug = faction.leader ? faction.leader.slug : null;
        
        els.leader.innerHTML = `
            <span>${leaderName}</span>
            ${leaderSlug ? `<a href="character-detail.html?slug=${leaderSlug}" title="View Profile"><i class="fas fa-external-link-alt text-xs opacity-50 hover:opacity-100"></i></a>` : ''}
        `;
    }

    if (els.hq) els.hq.textContent = faction.hqLocation || '[Encrypted Coords]';
    
    // Threat Level (Logic: Manuel veya hesaplanabilir, şimdilik random/static)
    if (els.threat) {
        const threat = faction.title.includes('Macpherson') ? 'EXTREME' : 'CRITICAL';
        els.threat.textContent = threat;
        if (threat === 'EXTREME') els.threat.className = 'ml-2 font-bold font-mono text-xs text-red-500';
        else els.threat.className = 'ml-2 font-bold font-mono text-xs text-gold';
    }

    // 4. Portable Text (Manifesto/Description)
    if (els.description) {
        if (faction.description) {
            els.description.innerHTML = toHTML(faction.description, {
                components: {
                    // Özelleştirilmiş bileşenler (isteğe bağlı)
                    block: {
                        normal: ({children}) => `<p class="mb-4">${children}</p>`,
                        h2: ({children}) => `<h3 class="text-xl text-white mt-6 mb-2 font-serif">${children}</h3>`,
                    }
                }
            });
        } else {
            els.description.innerHTML = '<p class="text-gray-500 italic">// No records available.</p>';
        }
    }

    // 5. Roster Generation (Known Associates)
    if (els.roster && faction.members && faction.members.length > 0) {
        els.roster.innerHTML = faction.members.map(member => {
            const avatarUrl = member.imageUrl || `https://ui-avatars.com/api/?background=1a1a1a&color=888&name=${encodeURIComponent(member.name)}`;
            const role = member.role || member.title || 'Associate';
            
            return `
                <a href="character-detail.html?slug=${member.slug}" class="roster-card bg-white/5 p-3 border border-white/5 flex items-center space-x-3 hover:bg-white/10 transition-all group">
                    <div class="w-10 h-10 bg-black overflow-hidden rounded-full border border-white/10 group-hover:border-[var(--theme-color)] transition-colors">
                        <img src="${avatarUrl}" class="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500">
                    </div>
                    <div>
                        <h4 class="font-serif text-gray-200 leading-tight group-hover:text-white">${member.name}</h4>
                        <p class="text-[9px] text-gray-500 font-mono uppercase tracking-wider group-hover:text-[var(--theme-color)]">${role}</p>
                    </div>
                </a>
            `;
        }).join('');
    } else if (els.roster) {
        els.roster.innerHTML = '<div class="text-xs font-mono text-gray-600 col-span-full py-4 text-center">// NO KNOWN ASSOCIATES FOUND IN DB.</div>';
    }

    // Reveal Page
    const grid = document.getElementById('factions-grid'); // Eğer grid wrapper varsa
    if (grid) grid.classList.remove('opacity-0');
};

export const loadFactionDetails = async () => {
    const contentContainer = document.querySelector('main'); // Fallback
    
    // URL Parametre Kontrolü
    const params = new URLSearchParams(window.location.search);
    const factionSlug = params.get('slug');

    if (!factionSlug) {
        if(contentContainer) contentContainer.innerHTML = '<div class="h-screen flex items-center justify-center text-red-500 font-mono">ERROR: MISSING COORDINATES (No Slug).</div>';
        return;
    }

    try {
        // GROQ QUERY:
        // 1. Faksiyonu çek
        // 2. Leader'i referansla aç
        // 3. Bu faksiyona ait olan karakterleri (Reverse Reference) bul ve "members" dizisi yap.
        const query = `*[_type == "faction" && slug.current == $slug][0]{
            title,
            motto,
            description,
            "hqLocation": hq,
            "color": color,
            "type": type,
            image { asset->{url} },
            leader->{
                name,
                "slug": slug.current
            },
            "members": *[_type == "character" && references(^._id)] | order(name asc) [0...6] {
                name,
                title,
                "slug": slug.current,
                "imageUrl": image.asset->url
            }
        }`;
        
        const queryParams = { slug: factionSlug };
        const faction = await client.fetch(query, queryParams);

        // Loader'ı Kaldır (Varsa)
        const loader = document.getElementById('factions-loader'); // Veya page specific loader id
        if(loader) loader.style.display = 'none';

        if (faction) {
            renderFactionDetails(faction);
        } else {
            if(contentContainer) contentContainer.innerHTML = '<div class="h-screen flex items-center justify-center text-red-500 font-mono">ERROR 404: FACTION DISBANDED OR UNKNOWN.</div>';
        }
    } catch (error) {
        console.error("Critical Intel Failure:", error);
        if(contentContainer) contentContainer.innerHTML = '<div class="h-screen flex items-center justify-center text-red-500 font-mono">SYSTEM MALFUNCTION. RETRY CONNECTION.</div>';
    }
};