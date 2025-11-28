import { client, urlFor } from '../../lib/sanityClient.js';
import { toHTML } from 'https://esm.sh/@portabletext/to-html@2.0.13';
import { applyBlurToStaticImage } from '../../lib/imageUtils.js';
import i18next from '../../lib/i18n.js';

const updateThreatDisplay = (level = 'neutral') => {
    const threatEl = document.getElementById('loc-threat');
    if (!threatEl) return;

    const normalized = level.toLowerCase();
    let colorClass = 'text-gray-500';
    let icon = 'fa-minus-circle';

    if (['high', 'critical', 'severe'].includes(normalized)) {
        colorClass = 'text-red-500';
        icon = 'fa-exclamation-triangle animate-pulse';
    } else if (['moderate', 'elevated'].includes(normalized)) {
        colorClass = 'text-yellow-500';
        icon = 'fa-exclamation-circle';
    } else if (['secure', 'low', 'safe', 'active'].includes(normalized)) {
        colorClass = 'text-green-500';
        icon = 'fa-check-circle';
    }

    threatEl.className = `text-xs font-mono uppercase font-bold flex items-center ${colorClass}`;
    threatEl.innerHTML = `<i class="fas ${icon} mr-2"></i> ${level}`;
};

const renderLocationIntel = (location) => {
    document.title = `${location.name} // SURVEILLANCE FEED`;

    if (location.mainImage && location.mainImage.asset) {
        const url = urlFor(location.mainImage).width(1000).height(600).fit('crop').quality(75).url();
        const blurHash = location.mainImage.asset.blurHash; // Query'e eklediğin blurHash
        
        // Tek satırda hallediyoruz:
        applyBlurToStaticImage('loc-image', url, blurHash);

        const loader = document.getElementById('feed-loader');
        if (loader) loader.style.display = 'none';
    }

    const setText = (id, text, fallbackKey) => { 
        const el = document.getElementById(id); 
        if (el) el.textContent = text || (fallbackKey ? i18next.t(fallbackKey) : ''); 
    };

    setText('loc-title', location.name, 'location_detail_page.placeholder_unknown');
    setText('loc-faction', location.faction?.title, 'location_detail_page.tactical_unverified');
    setText('loc-status', location.status, 'location_detail_page.tactical_operational');
    
    if (location.location) {
        setText('loc-coords', `${location.location.lat.toFixed(4)}° N, ${location.location.lng.toFixed(4)}° W`);
    } else {
        setText('loc-coords', '--.--, --.--');
    }

    updateThreatDisplay(location.securityLevel || i18next.t('location_detail_page.tactical_analyzing'));

    const descEl = document.getElementById('loc-description');
    if (descEl) {
    descEl.innerHTML = location.description 
        ? toHTML(location.description) 
        : `<p class="animate-pulse">${i18next.t('location_detail_page.decrypting_history')}</p>`;
    }

    const eventsList = document.getElementById('loc-events');
    if (eventsList) {
        let foundEvents = [];
        
        if (location.allEras) {
            location.allEras.forEach(era => {
                if (era.events) {
                    const matches = era.events.filter(evt => 
                        evt.relatedLocation && evt.relatedLocation._ref === location._id
                    );
                    foundEvents = [...foundEvents, ...matches];
                }
            });
        }

        if (foundEvents.length > 0) {
            eventsList.innerHTML = foundEvents.map(evt => `
                <li class="border-l-2 border-white/10 pl-3 py-1 hover:border-gold transition-colors group cursor-default">
                    <span class="block text-[9px] font-mono text-gray-500">${evt.date ? evt.date.split('-')[0] : 'Unknown'}</span>
                    <span class="text-xs font-serif text-gray-300 group-hover:text-white">${evt.title_en || 'Redacted Event'}</span>
                </li>
            `).join('');
        } else {
            eventsList.innerHTML = `<li class="text-xs text-gray-600 italic">${i18next.t('location_detail_page.no_events_found')}</li>`;
        }
    }
};

export async function loadLocationDetails() {
    const feedLoader = document.getElementById('feed-loader');
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug');

    if (!slug) {
        if (feedLoader) feedLoader.innerHTML = `<p class="text-red-500 font-mono">${i18next.t('location_detail_loader.error_missing_slug')}</p>`;
        return;
    }

    try {
        console.log(`> Connecting to drone feed: ${slug}`);

        const query = `*[_type == "location" && slug.current == $slug][0]{
            _id,
            name,
            // Lokasyon görseli (Expanded)
            mainImage {
                asset->{
                    url,
                    "blurHash": metadata.blurHash
                }
            },
            description,
            securityLevel,
            status,
            location, 
            faction->{title},
            "allEras": *[_type == "timelineEra"] {
                events[] {
                    title_en,
                    date,
                    relatedLocation
                }
            }
        }`;
        
        const result = await client.fetch(query, { slug });

        if (result) {
            renderLocationIntel(result);
        } else {
            if (feedLoader) feedLoader.innerHTML = `<p class="text-red-500 font-mono">${i18next.t('location_detail_loader.error_not_found')}</p>`;
            document.getElementById('loc-title').textContent = "404";
        }

    } catch (error) {
        console.error("Uplink Error:", error);
        if (feedLoader) feedLoader.innerHTML = `<p class="text-red-500 font-mono">${i18next.t('location_detail_loader.error_fetch_failed')}</p>`;
    }
}