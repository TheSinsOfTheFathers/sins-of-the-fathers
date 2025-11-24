import { client } from '../../lib/sanityClient.js';
import { toHTML } from 'https://esm.sh/@portabletext/to-html@2.0.13';

/**
 * MINI MAP ENGINE (Canlı Uydu Bağlantısı)
 */
const initMiniMap = (lat, lng, color, containerId = 'mini-map') => {
    if (!window.L || !document.getElementById(containerId)) return;

    const container = document.getElementById(containerId);
    if (container._leaflet_id) return; 

    const map = L.map(containerId, {
        center: [lat, lng],
        zoom: 11,
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19
    }).addTo(map);

    const radarIcon = L.divIcon({
        className: 'radar-ping',
        html: `
            <div class="relative w-4 h-4 flex items-center justify-center">
                <div class="absolute w-full h-full bg-[${color}] rounded-full animate-ping opacity-75" style="background-color: ${color}"></div>
                <div class="absolute w-2 h-2 bg-[${color}] rounded-full shadow-[0_0_10px_${color}]" style="background-color: ${color}"></div>
            </div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });

    L.marker([lat, lng], { icon: radarIcon }).addTo(map);
};

/**
 * Tema Rengi Ayarlayıcı
 */
const applyFactionTheme = (colorHex, bannerUrl) => {
    const themeColor = colorHex || '#c5a059';
    document.documentElement.style.setProperty('--theme-color', themeColor);

    const banner = document.getElementById('faction-banner');
    if (banner && bannerUrl) {
        banner.style.backgroundImage = `url('${bannerUrl}')`;
    }
    return themeColor;
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
        threat: document.getElementById('threat-text'),
        relations: document.getElementById('faction-locations-list')
    };

    document.title = `${faction.title} // INTEL - The Sins of the Fathers`;

    // 1. Başlık
    const safeTitle = faction.title || 'Unknown Faction';
    if (els.title) {
        els.title.textContent = safeTitle;
        els.title.classList.remove('animate-fade-in-down');
        void els.title.offsetWidth; 
        els.title.classList.add('animate-fade-in-down');
    }
    if (els.subtitle) els.subtitle.textContent = faction.motto ? `"${faction.motto}"` : "// MOTTO REDACTED";
    
    // 2. Tema & İkon
    const type = faction.type || 'syndicate';
    const icon = type === 'syndicate' ? '<i class="fas fa-skull-crossbones"></i>' : '<i class="fas fa-chess-king"></i>';
    if (els.iconContainer) els.iconContainer.innerHTML = icon;
    
    const themeColor = applyFactionTheme(faction.color?.hex, faction.image?.asset?.url);

    // --> MINI MAP INIT (GELİŞTİRİLMİŞ VERSİYON) <--
    // Konum tespiti için HQ bilgisini veya başlığı (Title) kullanır.
    let searchStr = (faction.hqLocation || faction.title || "").toLowerCase();
    
    // Varsayılan: Glasgow
    let lat = 55.8642, lng = -4.2518;

    // Algılama Mantığı
    if (searchStr.includes('angeles') || searchStr.includes('usa') || searchStr.includes('ballantine')) {
        // Los Angeles Koordinatları
        lat = 34.0522;
        lng = -118.2437;
    } 
    else if (searchStr.includes('scotland') || searchStr.includes('highlands') || searchStr.includes('macpherson') || searchStr.includes('aberdeen')) {
        // Aberdeen / İskoçya Koordinatları
        lat = 57.1497; 
        lng = -2.0942;
    }

    // Haritayı başlat (Eski if bloğu kaldırıldı, artık her durumda çalışır)
    setTimeout(() => initMiniMap(lat, lng, themeColor), 500);


    // 3. Lider & HQ Metin
    if (els.leader) {
        const leaderName = faction.leader ? faction.leader.name : 'UNKNOWN';
        const leaderSlug = faction.leader ? faction.leader.slug : null;
        els.leader.innerHTML = `<span>${leaderName}</span>${leaderSlug ? `<a href="character-detail.html?slug=${leaderSlug}" title="View Profile"><i class="fas fa-external-link-alt text-xs opacity-50 hover:opacity-100"></i></a>` : ''}`;
    }
    if (els.hq) els.hq.textContent = faction.hqLocation || '[Encrypted Coords]';
    
    // 4. Threat Level
    if (els.threat) {
        const threatLevel = safeTitle.toLowerCase().includes('macpherson') ? 'EXTREME' : 'CRITICAL';
        els.threat.textContent = threatLevel;
        els.threat.className = 'ml-2 font-bold font-mono text-xs';
        els.threat.classList.add(threatLevel === 'EXTREME' ? 'text-red-500' : 'text-gold');
    }

    // 5. Lore Description
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

    // 6. Personel
    if (els.roster) {
        if (faction.members && faction.members.length > 0) {
            els.roster.innerHTML = faction.members.map(member => {
                const avatarUrl = member.imageUrl || `https://ui-avatars.com/api/?background=1a1a1a&color=888&name=${encodeURIComponent(member.name || 'User')}`;
                return `
                    <a href="character-detail.html?slug=${member.slug}" class="roster-card bg-white/5 p-3 border border-white/5 flex items-center space-x-3 hover:bg-white/10 transition-all group">
                        <div class="w-10 h-10 bg-black overflow-hidden rounded-full border border-white/10 group-hover:border-[var(--theme-color)] transition-colors">
                            <img src="${avatarUrl}" class="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500">
                        </div>
                        <div>
                            <h4 class="font-serif text-gray-200 leading-tight group-hover:text-white text-sm">${member.name}</h4>
                            <p class="text-[9px] text-gray-500 font-mono uppercase tracking-wider group-hover:text-[var(--theme-color)]">${member.role || 'Member'}</p>
                        </div>
                    </a>`;
            }).join('');
        } else {
            els.roster.innerHTML = '<div class="text-xs font-mono text-gray-600 col-span-full py-4 text-center border border-dashed border-gray-800">// EMPTY</div>';
        }
    }

    // 7. DİPLOMASİ (Foreign Relations)
    if (els.relations) {
        const headerEl = els.relations.previousElementSibling?.previousElementSibling;
        if(headerEl) headerEl.textContent = "FOREIGN RELATIONS";

        if (faction.relations && faction.relations.length > 0) {
            els.relations.innerHTML = faction.relations.map(rel => {
                let statusColor = 'text-gray-500';
                let icon = 'fa-minus';
                
                if(rel.status === 'hostile') { statusColor = 'text-red-500'; icon = 'fa-times'; }
                if(rel.status === 'ally') { statusColor = 'text-green-500'; icon = 'fa-handshake'; }
                if(rel.status === 'vassal') { statusColor = 'text-blue-400'; icon = 'fa-link'; }

                return `
                    <div class="flex justify-between items-center text-xs border-b border-white/5 pb-2 last:border-0 group cursor-help" title="${rel.description || 'No notes'}">
                        <span class="text-gray-300 group-hover:text-white transition-colors">${rel.targetName}</span>
                        <span class="font-mono ${statusColor} uppercase flex items-center gap-1">
                            <i class="fas ${icon} text-[9px]"></i> ${rel.status}
                        </span>
                    </div>
                `;
            }).join('');
        } else {
            els.relations.innerHTML = '<div class="text-xs text-gray-600 font-mono text-center py-2">NO DIPLOMATIC RECORDS FOUND</div>';
        }
        
        const mapBtn = els.relations.parentElement.querySelector('button');
        if(mapBtn) {
            mapBtn.innerText = "ACCESS GLOBAL MAP";
            mapBtn.onclick = () => window.location.href = 'locations.html';
        }
    }

    const grid = document.querySelector('main'); 
    if (grid) grid.classList.remove('opacity-0');
};

export const loadFactionDetails = async () => {
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
            title, motto, description, type,
            "hqLocation": hq, "color": color,
            image { asset->{url} },
            leader->{ name, "slug": slug.current },
            "members": *[_type == "character" && references(^._id)] | order(name asc) [0...6] {
                name, "slug": slug.current, title, "role": title, "imageUrl": image.asset->url
            },
            relations[] {
                status,
                description,
                "targetName": target->title
            }
        }`;
        
        const faction = await client.fetch(query, { slug: factionSlug });

        if(loader) loader.style.display = 'none';

        if (faction) {
            renderFactionDetails(faction);
        } else {
            if (mainContainer) mainContainer.innerHTML = '<div class="h-[50vh] flex flex-col items-center justify-center text-red-800 font-mono"><span>ERROR 404: FILE CORRUPTED</span></div>';
        }
    } catch (error) {
        console.error("Intel Failure:", error);
        if (mainContainer) mainContainer.innerHTML = '<div class="h-[50vh] flex items-center justify-center text-red-500 font-mono">SYSTEM MALFUNCTION.</div>';
    }
};