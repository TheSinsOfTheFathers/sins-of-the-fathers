import { client, urlFor } from '../../lib/sanityClient.js';
import { toHTML } from 'https://esm.sh/@portabletext/to-html@2.0.13';

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

    const imgEl = document.getElementById('loc-image');
    if (imgEl && location.mainImage) {
        imgEl.src = urlFor(location.mainImage).width(1000).height(600).fit('crop').quality(75).url();
        const loader = document.getElementById('feed-loader');
        if (loader) loader.style.display = 'none';
    }

    const setText = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text || 'N/A'; };

    setText('loc-title', location.name);
    setText('loc-faction', location.faction?.title || 'NEUTRAL GROUND');
    setText('loc-status', location.status || 'UNKNOWN');
    
    if (location.location) {
        setText('loc-coords', `${location.location.lat.toFixed(4)}° N, ${location.location.lng.toFixed(4)}° W`);
    } else {
        setText('loc-coords', 'SIGNAL LOST');
    }

    updateThreatDisplay(location.securityLevel || 'Moderate');

    const descEl = document.getElementById('loc-description');
    if (descEl) {
        descEl.innerHTML = location.description 
            ? toHTML(location.description) 
            : '<p class="text-red-500 font-mono">[DATA REDACTED]</p>';
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
            eventsList.innerHTML = '<li class="text-xs text-gray-600 italic font-mono">No specific incidents tagged for this sector.</li>';
        }
    }
};

export async function loadLocationDetails() {
    const feedLoader = document.getElementById('feed-loader');
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug');

    if (!slug) return;

    try {
        console.log(`> Connecting to drone feed: ${slug}`);

        const query = `*[_type == "location" && slug.current == $slug][0]{
            _id,
            name,
            mainImage,
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
            if (feedLoader) feedLoader.innerHTML = '<p class="text-red-500 font-mono">TARGET OFFLINE</p>';
            document.getElementById('loc-title').textContent = "404: LOST";
        }

    } catch (error) {
        console.error("Uplink Error:", error);
    }
}