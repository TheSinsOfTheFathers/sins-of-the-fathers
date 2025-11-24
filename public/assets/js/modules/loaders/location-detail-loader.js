import { client, urlFor } from '../../lib/sanityClient.js';
import { toHTML } from 'https://esm.sh/@portabletext/to-html@2.0.13';

/**
 * Tehdit Seviyesine Göre Renk Kodlaması
 */
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
    } else if (['secure', 'low', 'safe'].includes(normalized)) {
        colorClass = 'text-green-500';
        icon = 'fa-check-circle';
    }

    threatEl.className = `text-xs font-mono uppercase font-bold flex items-center ${colorClass}`;
    threatEl.innerHTML = `<i class="fas ${icon} mr-2"></i> ${level}`;
};

/**
 * HUD Ekranına Veri Basımı
 */
const renderLocationIntel = (location) => {
    // 1. Görsel Akışı (Image Feed)
    const imgEl = document.getElementById('loc-image');
    if (imgEl && location.mainImage) {
        // Daha "grenli" ve düşük kaliteli bir istihbarat fotosu hissi için quality düşürülebilir
        imgEl.src = urlFor(location.mainImage).width(1200).height(800).fit('crop').quality(80).url();
        
        // Yükleme animasyonunu durdur
        const loader = document.getElementById('feed-loader');
        if (loader) loader.style.display = 'none';
    }

    // 2. Metadata Enjeksiyonu
    document.title = `${location.name} // SURVEILLANCE FEED`;
    
    const setText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text || 'N/A';
    };

    setText('loc-title', location.name);
    setText('loc-faction', location.faction?.title || 'UNCLAIMED TERRITORY');
    
    // Koordinat Formatlama
    const coords = location.location?.lat 
        ? `${location.location.lat.toFixed(4)}° N, ${location.location.lng.toFixed(4)}° W`
        : 'SIGNAL LOST // TRACE FAILED';
    setText('loc-coords', coords);

    setText('loc-status', location.status || 'ACTIVE');
    
    updateThreatDisplay(location.securityLevel);

    // 3. İstihbarat Raporu (Description)
    const descEl = document.getElementById('loc-description');
    if (descEl) {
        descEl.innerHTML = location.description 
            ? toHTML(location.description) 
            : '<p class="text-red-500 font-mono">[DATA CORRUPTED] - No intel available.</p>';
    }

    // 4. Olay Geçmişi (Connected Events)
    const eventsList = document.getElementById('loc-events');
    if (eventsList) {
        if (location.relatedEvents && location.relatedEvents.length > 0) {
            eventsList.innerHTML = location.relatedEvents.map(event => `
                <li class="border-l-2 border-white/10 pl-3 py-1 hover:border-gold transition-colors group cursor-default">
                    <span class="block text-[9px] font-mono text-gray-500">${event.startDate ? new Date(event.startDate).getFullYear() : 'Unknown Date'}</span>
                    <span class="text-xs font-serif text-gray-300 group-hover:text-white">${event.headline}</span>
                </li>
            `).join('');
        } else {
            eventsList.innerHTML = '<li class="text-xs text-gray-600 italic font-mono">No incidents recorded in this sector.</li>';
        }
    }
};

export async function loadLocationDetails() {
    const container = document.getElementById('location-intel'); // Main container check
    const feedLoader = document.getElementById('feed-loader');

    // URL Check
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug');

    if (!slug) {
        console.warn("Missing Coordinates (Slug)");
        if (feedLoader) feedLoader.innerHTML = '<p class="text-red-500 font-mono">MISSING TARGET COORDINATES</p>';
        return;
    }

    try {
        console.log(`> Establishing uplink to sector: ${slug}`);

        // GROQ Query: Location detayları + Faksiyon Adı + İlişkili Olaylar (Reverse Reference)
        // "location" alanı Sanity'de "geopoint" tipinde olmalıdır.
        const query = `*[_type == "location" && slug.current == $slug][0]{
            name,
            mainImage,
            description,
            securityLevel,
            status,
            location, 
            faction->{title},
            "relatedEvents": *[_type == "event" && references(^._id)] | order(startDate desc) {
                headline,
                startDate
            }
        }`;
        
        const result = await client.fetch(query, { slug });

        if (result) {
            renderLocationIntel(result);
        } else {
            if (feedLoader) feedLoader.innerHTML = '<p class="text-red-500 font-mono">TARGET NOT FOUND / OFFLINE</p>';
            document.getElementById('loc-title').textContent = "SIGNAL LOST";
        }

    } catch (error) {
        console.error("Satellite Uplink Failed:", error);
        if (feedLoader) feedLoader.innerHTML = '<p class="text-red-500 font-mono">CONNECTION REFUSED</p>';
    }
}