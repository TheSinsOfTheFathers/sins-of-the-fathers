import { client } from '../../lib/sanityClient.js';
import { toHTML } from 'https://esm.sh/@portabletext/to-html@2.0.13';

/**
 * Faksiyon Rengini ve Temasını Ayarlar
 */
const applyFactionTheme = (colorHex, bannerUrl) => {
    const themeColor = colorHex || '#c5a059';
    document.documentElement.style.setProperty('--theme-color', themeColor);

    const banner = document.getElementById('faction-banner');
    if (banner && bannerUrl) {
        banner.style.backgroundImage = `url('${bannerUrl}')`;
    }
};

const renderFactionDetails = (faction) => {
    const els = {
        title: document.getElementById('faction-title'),
        subtitle: document.getElementById('faction-subtitle'),
        leader: document.getElementById('faction-leader'),
        hq: document.getElementById('faction-hq'),
        description: document.getElementById('faction-description'),
        iconContainer: document.getElementById('faction-icon-container'),
        roster: document.getElementById('faction-roster'),
        threat: document.getElementById('threat-text')
    };

    // Başlık güncelleme
    document.title = `${faction.title} // INTEL - The Sins of the Fathers`;

    // 1. Safe Data Handling (Hata Veren Yer Düzeltildi)
    const safeTitle = faction.title || 'Unknown Faction';
    
    if (els.title) {
        els.title.textContent = safeTitle;
        els.title.classList.remove('animate-fade-in-down');
        void els.title.offsetWidth; 
        els.title.classList.add('animate-fade-in-down');
    }

    if (els.subtitle) els.subtitle.textContent = faction.motto ? `"${faction.motto}"` : "// MOTTO REDACTED";
    
    // 2. Theme & Icon
    // faction.type undefined olabilir, varsayılan ata
    const type = faction.type || 'syndicate';
    const icon = type === 'syndicate' 
        ? '<i class="fas fa-skull-crossbones"></i>' 
        : '<i class="fas fa-chess-king"></i>';
        
    if (els.iconContainer) els.iconContainer.innerHTML = icon;
    
    applyFactionTheme(faction.color?.hex, faction.image?.asset?.url);

    // 3. Leader Stats
    if (els.leader) {
        const leaderName = faction.leader ? faction.leader.name : 'UNKNOWN';
        const leaderSlug = faction.leader ? faction.leader.slug : null;
        
        els.leader.innerHTML = `
            <span>${leaderName}</span>
            ${leaderSlug ? `<a href="character-detail.html?slug=${leaderSlug}" title="View Profile"><i class="fas fa-external-link-alt text-xs opacity-50 hover:opacity-100"></i></a>` : ''}
        `;
    }

    if (els.hq) els.hq.textContent = faction.hqLocation || '[Encrypted Coords]';
    
    // 4. Threat Logic (SAFE GUARDED)
    if (els.threat) {
        // safeTitle kullanarak null check'ten kurtulduk
        const threatLevel = safeTitle.includes('Macpherson') ? 'EXTREME' : 'CRITICAL';
        
        els.threat.textContent = threatLevel;
        
        // Sınıfları temizle ve yeniden ekle
        els.threat.className = 'ml-2 font-bold font-mono text-xs';
        els.threat.classList.add(threatLevel === 'EXTREME' ? 'text-red-500' : 'text-gold');
    }

    // 5. Content (Description)
    if (els.description) {
        if (faction.description) {
            els.description.innerHTML = toHTML(faction.description, {
                components: {
                    block: {
                        normal: ({children}) => `<p class="mb-4 opacity-90">${children}</p>`,
                        h2: ({children}) => `<h3 class="text-xl text-white mt-6 mb-2 font-serif border-b border-white/10 pb-1">${children}</h3>`,
                    }
                }
            });
        } else {
            els.description.innerHTML = '<p class="text-gray-500 italic font-mono">// No records available.</p>';
        }
    }

    // 6. Roster (Üye Listesi)
    if (els.roster) {
        if (faction.members && faction.members.length > 0) {
            els.roster.innerHTML = faction.members.map(member => {
                const avatarUrl = member.imageUrl || `https://ui-avatars.com/api/?background=1a1a1a&color=888&name=${encodeURIComponent(member.name || 'User')}`;
                const role = member.role || member.title || 'Associate';
                const name = member.name || 'Unknown';
                
                return `
                    <a href="character-detail.html?slug=${member.slug}" class="roster-card bg-white/5 p-3 border border-white/5 flex items-center space-x-3 hover:bg-white/10 transition-all group">
                        <div class="w-10 h-10 bg-black overflow-hidden rounded-full border border-white/10 group-hover:border-[var(--theme-color)] transition-colors">
                            <img src="${avatarUrl}" class="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500">
                        </div>
                        <div>
                            <h4 class="font-serif text-gray-200 leading-tight group-hover:text-white text-sm">${name}</h4>
                            <p class="text-[9px] text-gray-500 font-mono uppercase tracking-wider group-hover:text-[var(--theme-color)]">${role}</p>
                        </div>
                    </a>
                `;
            }).join('');
        } else {
            els.roster.innerHTML = '<div class="text-xs font-mono text-gray-600 col-span-full py-4 text-center border border-dashed border-gray-800">// PERSONNEL RECORDS REDACTED OR EMPTY</div>';
        }
    }

    // Reveal Content
    const grid = document.querySelector('main'); 
    if (grid) grid.classList.remove('opacity-0');
};

export const loadFactionDetails = async () => {
    // Loader Yönetimi
    const loader = document.getElementById('factions-loader');
    const mainContainer = document.querySelector('main');

    const params = new URLSearchParams(window.location.search);
    const factionSlug = params.get('slug');

    if (!factionSlug) {
        if (loader) loader.innerHTML = '<p class="text-red-500 font-mono text-sm">ERROR: MISSING SLUG</p>';
        return;
    }

    try {
        const query = `*[_type == "faction" && slug.current == $slug][0]{
            title,
            motto,
            description,
            "hqLocation": hq,
            "color": color,
            type,
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
        
        const faction = await client.fetch(query, { slug: factionSlug });

        // Loader Kaldır
        if(loader) loader.style.display = 'none';

        if (faction) {
            renderFactionDetails(faction);
        } else {
            if (mainContainer) mainContainer.innerHTML = `
                <div class="h-[50vh] flex flex-col items-center justify-center text-red-800 font-mono">
                    <i class="fas fa-folder-open text-4xl mb-4 opacity-50"></i>
                    <span>ERROR 404: FILE CORRUPTED</span>
                </div>`;
        }
    } catch (error) {
        console.error("Critical Intel Failure:", error);
        if (mainContainer) mainContainer.innerHTML = '<div class="h-[50vh] flex items-center justify-center text-red-500 font-mono">SYSTEM MALFUNCTION. RETRY.</div>';
    }
};