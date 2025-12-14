import { client } from '../../lib/sanityClient.js';
import { toHTML } from 'https://esm.sh/@portabletext/to-html@2.0.13';

import i18next from '../../lib/i18n.js';
// 👇 SEO İMPORTU (injectSchema'yı çağırıyoruz)
import { injectSchema } from '../../lib/seo.js';

/**
 * MINI MAP ENGINE (Canlı Uydu Bağlantısı)
 */
const initMiniMap = (lat, lng, color, containerId = 'mini-map') => {
    if (!globalThis.L || !document.getElementById(containerId)) return;

    const container = document.getElementById(containerId);

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

/* --------------------------------------------------------------------------
   HELPER FUNCTIONS (Cognitive Complexity Reduction)
   -------------------------------------------------------------------------- */

const injectFactionSeo = (faction, safeTitle) => {
    try {
        const plainDesc = faction.description
            ? faction.description.map(block => block.children?.map(child => child.text).join('')).join(' ')
            : faction.motto || "";

        const schemaData = {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": safeTitle,
            "slogan": faction.motto,
            "description": plainDesc.substring(0, 160) + "...",
            "url": globalThis.location.href,
            "logo": faction.image?.asset?.url,
            "founder": faction.leader ? {
                "@type": "Person",
                "name": faction.leader.name
            } : undefined,
            "location": faction.hqName ? {
                "@type": "Place",
                "name": faction.hqName
            } : undefined
        };

        injectSchema(schemaData);
        console.log("> SEO Protocol: Faction Schema Injected.");
    } catch (err) {
        console.warn("> SEO Protocol Warning: Failed to inject schema.", err);
    }
};

const renderFactionHeader = (els, faction, safeTitle) => {
    if (els.title) {
        els.title.textContent = safeTitle;
        els.title.classList.remove('animate-fade-in-down');
        // Force reflow
        els.title.offsetWidth;
        els.title.classList.add('animate-fade-in-down');
    }
    if (els.subtitle) els.subtitle.textContent = faction.motto ? `"${faction.motto}"` : i18next.t('faction_detail_loader.motto_redacted');

    const type = faction.type || 'syndicate';
    const icon = type === 'syndicate' ? '<i class="fas fa-skull-crossbones"></i>' : '<i class="fas fa-chess-king"></i>';
    if (els.iconContainer) els.iconContainer.innerHTML = icon;

    const themeColor = applyFactionTheme(faction.color?.hex, faction.image?.asset?.url);

    if (faction.hqLocation?.lat && faction.hqLocation?.lng) {
        setTimeout(() => initMiniMap(faction.hqLocation.lat, faction.hqLocation.lng, themeColor), 500);
    }
};

const renderFactionInfo = (els, faction) => {
    if (els.leader) {
        const leaderName = faction.leader ? faction.leader.name : i18next.t('faction_detail_loader.unknown_leader');
        const leaderSlug = faction.leader ? faction.leader.slug : null;
        const leaderLink = leaderSlug ? `<a href="character-detail.html?slug=${leaderSlug}" title="${i18next.t('faction_detail_loader.view_profile')}"><i class="fas fa-external-link-alt text-xs opacity-50 hover:opacity-100"></i></a>` : '';
        els.leader.innerHTML = `<span>${leaderName}</span>${leaderLink}`;
    }
    if (els.hq) els.hq.textContent = faction.hqName || i18next.t('faction_detail_loader.encrypted_coords');

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
            unknown: { text: i18next.t('faction_detail_loader.threat_analyzing'), bars: 0, color: 'text-gray-500', barColor: 'bg-gray-800' }
        };

        const config = levels[threatLevel] || levels.unknown;

        els.threat.textContent = config.text;
        els.threat.className = `ml-2 font-bold font-mono text-xs ${config.color}`;

        const bars = threatContainer.querySelectorAll('.threat-bar');
        bars.forEach((bar, index) => {
            bar.className = 'threat-bar w-2 h-6';
            if (index < config.bars) {
                bar.classList.add(config.barColor);
            } else {
                bar.classList.add('bg-gray-800');
            }
        });
    }
};

const renderFactionDescription = (els, faction) => {
    if (!els.description) return;

    if (faction.description) {
        els.description.innerHTML = toHTML(faction.description, {
            components: {
                block: {
                    normal: ({ children }) => `<p class="mb-4 opacity-90">${children}</p>`,
                    h2: ({ children }) => `<h3 class="text-xl text-white mt-6 mb-2 font-serif border-b border-white/10 pb-1">${children}</h3>`,
                }
            }
        });
    } else {
        els.description.innerHTML = `<p class="text-gray-500 italic font-mono">${i18next.t('faction_detail_loader.no_records_available')}</p>`;
    }
};

const renderFactionRoster = (els, faction) => {
    if (!els.roster) return;

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
        els.roster.innerHTML = `<div class="text-xs font-mono text-gray-600 col-span-full py-4 text-center border border-dashed border-gray-800">${i18next.t('faction_detail_loader.roster_empty')}</div>`;
    }
};

const renderFactionRelations = (els, faction) => {
    if (!els.relations) return;

    const headerEl = els.relations.previousElementSibling;
    if (headerEl) headerEl.textContent = i18next.t('faction_detail_loader.foreign_relations');
    if (faction.relations && faction.relations.length > 0) {
        els.relations.innerHTML = faction.relations.map(rel => {
            let statusColor = 'text-gray-500';
            let icon = 'fa-minus';

            if (rel.status === 'hostile') { statusColor = 'text-red-500'; icon = 'fa-times'; }
            if (rel.status === 'ally') { statusColor = 'text-green-500'; icon = 'fa-handshake'; }
            if (rel.status === 'vassal') { statusColor = 'text-blue-400'; icon = 'fa-link'; }

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
        els.relations.innerHTML = `<div class="text-xs text-gray-600 font-mono text-center py-2">${i18next.t('faction_detail_loader.no_diplomatic_records')}</div>`;
    }

    const mapBtn = els.relations.parentElement.querySelector('button');
    if (mapBtn) {
        mapBtn.innerText = i18next.t('faction_detail_loader.access_global_map');
        mapBtn.onclick = () => globalThis.location.href = 'locations.html';
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
        threat: document.getElementById('threat-text'),
        relations: document.getElementById('faction-locations-list')
    };

    const safeTitle = faction.title || 'Unknown Faction';
    document.title = i18next.t('faction_detail_loader.meta_title', { factionName: safeTitle });

    injectFactionSeo(faction, safeTitle);
    renderFactionHeader(els, faction, safeTitle);
    renderFactionInfo(els, faction);
    renderFactionDescription(els, faction);
    renderFactionRoster(els, faction);
    renderFactionRelations(els, faction);

    const grid = document.querySelector('main');
    if (grid) grid.classList.remove('opacity-0');
};

export const loadFactionDetails = async () => {
    const loader = document.getElementById('factions-loader');
    const mainContainer = document.querySelector('main');
    const params = new URLSearchParams(globalThis.location.search);
    const factionSlug = params.get('slug');

    if (!factionSlug) {
        if (loader) loader.innerHTML = `<p class="text-red-500 font-mono text-sm">${i18next.t('faction_detail_loader.error_missing_slug')}</p>`;
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

        if (loader) loader.style.display = 'none';

        if (faction) {
            renderFactionDetails(faction);
        } else if (mainContainer) {
            mainContainer.innerHTML = `<div class="h-[50vh] flex flex-col items-center justify-center text-red-800 font-mono"><span>${i18next.t('faction_detail_loader.error_file_corrupted')}</span></div>`;
        }
    } catch (error) {
        console.error("Intel Failure:", error);
        if (mainContainer) mainContainer.innerHTML = `<div class="h-[50vh] flex items-center justify-center text-red-500 font-mono">${i18next.t('faction_detail_loader.error_system_malfunction')}</div>`;
    }
};