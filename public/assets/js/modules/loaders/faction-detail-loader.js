import { client } from '../../lib/sanityClient.js';
import { toHTML } from 'https://esm.sh/@portabletext/to-html@2.0.13';

/**
 * MINI MAP ENGINE (Canlı Uydu Bağlantısı)
 */
const initMiniMap = (lat, lng, color, containerId = 'mini-map') => {
    if (!window.L || !document.getElementById(containerId)) return;

    const container = document.getElementById(containerId);
    
    // Haritanın tekrar tekrar oluşturulmasını engelleyen sorunu çözmek için
    // Önceki harita örneğini temizle
    if (container._leaflet_id) {
        const mapInstance = container._leaflet_map;
        if (mapInstance) {
            mapInstance.remove();
        }
    }
    
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

    const safeTitle = faction.title || 'Unknown Faction';
    if (els.title) {
        els.title.textContent = safeTitle;
        els.title.classList.remove('animate-fade-in-down');
        void els.title.offsetWidth; 
        els.title.classList.add('animate-fade-in-down');
    }
    if (els.subtitle) els.subtitle.textContent = faction.motto ? `"${faction.motto}"` : "// MOTTO REDACTED";
    
    const type = faction.type || 'syndicate';
    const icon = type === 'syndicate' ? '<i class="fas fa-skull-crossbones"></i>' : '<i class="fas fa-chess-king"></i>';
    if (els.iconContainer) els.iconContainer.innerHTML = icon;
    
    const themeColor = applyFactionTheme(faction.color?.hex, faction.image?.asset?.url);

    if (faction.hqLocation?.lat && faction.hqLocation?.lng) {
        setTimeout(() => initMiniMap(faction.hqLocation.lat, faction.hqLocation.lng, themeColor), 500);
    }


    if (els.leader) {
        const leaderName = faction.leader ? faction.leader.name : 'UNKNOWN';
        const leaderSlug = faction.leader ? faction.leader.slug : null;
        els.leader.innerHTML = `<span>${leaderName}</span>${leaderSlug ? `<a href="character-detail.html?slug=${leaderSlug}" title="View Profile"><i class="fas fa-external-link-alt text-xs opacity-50 hover:opacity-100"></i></a>` : ''}`;
    }
    if (els.hq) els.hq.textContent = faction.hqName || '[Encrypted Coords]';
    
    if (els.threat) {
        const threatLevel = (faction.threatLevel || 'unknown').toLowerCase();
        const threatContainer = els.threat.parentElement;
        
        const levels = {
            minimal: { text: 'MINIMAL', bars: 1, color: 'text-cyan-400', barColor: 'bg-cyan-400' },
            low: { text: 'LOW', bars: 2, color: 'text-green-400', barColor: 'bg-green-400' },
            medium: { text: 'MEDIUM', bars: 3, color: 'text-yellow-400', barColor: 'bg-yellow-400' },
            high: { text: 'HIGH', bars: 4, color: 'text-orange-500', barColor: 'bg-orange-500' },
            critical: { text: 'CRITICAL', bars: 5, color: 'text-gold', barColor: 'bg-gold' },
            extreme: { text: 'EXTREME', bars: 6, color: 'text-red-500', barColor: 'bg-red-500' },
            unknown: { text: 'ANALYZING...', bars: 0, color: 'text-gray-500', barColor: 'bg-gray-800' }
        };
        
        const config = levels[threatLevel] || levels.unknown;

        // Update the text content and class
        els.threat.textContent = config.text;
        els.threat.className = `ml-2 font-bold font-mono text-xs ${config.color}`;

        // Select all threat bars and update their classes
        const bars = threatContainer.querySelectorAll('.threat-bar');
        bars.forEach((bar, index) => {
            // Reset classes first
            bar.className = 'threat-bar w-2 h-6'; 
            if (index < config.bars) {
                bar.classList.add(config.barColor);
            } else {
                bar.classList.add('bg-gray-800');
            }
        });
    }

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

    if (els.relations) {
        const headerEl = els.relations.previousElementSibling;
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
            title, motto, description, type, threatLevel,
            "hqName": hq, 
            "hqLocation": hqLocation,
            "color": color,
            image { 
                asset->{
                    url,
                    "blurHash": metadata.blurHash
                } 
            },
            leader->{ name, "slug": slug.current },
            "members": *[_type == "character" && references(^._id)] | order(name asc) [0...6] {
                name, 
                "slug": slug.current, 
                title, 
                "role": title, 
                "image": image.asset->{
                    url,
                    "blurHash": metadata.blurHash
                }
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