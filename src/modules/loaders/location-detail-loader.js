import { client, urlFor } from '../../lib/sanityClient.js';
import { toHTML } from 'https://esm.sh/@portabletext/to-html@2.0.13';
import { applyBlurToStaticImage } from '../../lib/imageUtils.js';
import i18next from '../../lib/i18n.js';
// 👇 SEO / SCHEMA İMPORTU
import { injectSchema } from '../../lib/seo.js';

// 👇 1. GSAP IMPORT
import gsap from 'gsap';
import { NoirEffects } from '../ui/noir-effects.js';

const updateThreatDisplay = (level = 'neutral', container) => {
    const threatEl = container ? container.querySelector('#loc-threat') : document.getElementById('loc-threat');
    if (!threatEl) return;

    const normalized = level.toLowerCase();
    let colorClass = 'text-gray-200';
    let icon = 'fa-minus-circle';

    // Renk sınıfları
    if (['high', 'critical', 'severe'].includes(normalized)) {
        colorClass = 'text-red-500';
        icon = 'fa-exclamation-triangle'; // Pulse'ı buradan sildim, GSAP ile yapacağız
    } else if (['moderate', 'elevated'].includes(normalized)) {
        colorClass = 'text-yellow-500';
        icon = 'fa-exclamation-circle';
    } else if (['secure', 'low', 'safe', 'active'].includes(normalized)) {
        colorClass = 'text-green-500';
        icon = 'fa-check-circle';
    }

    threatEl.className = `text-xs font-mono uppercase font-bold flex items-center ${colorClass}`;
    threatEl.innerHTML = `<i class="fas ${icon} mr-2"></i> ${level}`;

    // GSAP ile yanıp sönme (Pulse) efekti - Sadece yüksek tehditler için
    if (['high', 'critical', 'severe'].includes(normalized)) {
        gsap.to(threatEl, { opacity: 0.4, duration: 0.6, repeat: -1, yoyo: true });
    }
};

const renderLocationIntel = (location, container) => {
    document.title = `${location.name} // SURVEILLANCE FEED`;

    const els = {
        container: container.querySelector('#location-intel'), // Ana kapsayıcı (varsa)
        image: container.querySelector('#loc-image'),
        title: container.querySelector('#loc-title'),
        faction: container.querySelector('#loc-faction'),
        status: container.querySelector('#loc-status'),
        coords: container.querySelector('#loc-coords'),
        threat: container.querySelector('#loc-threat'),
        desc: container.querySelector('#loc-description'),
        events: container.querySelector('#loc-events')
    };

    // SEO SCHEMA
    try {
        const schemaData = {
            "@context": "https://schema.org",
            "@type": "Place",
            "name": location.name,
            "description": location.description
                ? location.description.map(block => block.children?.map(child => child.text).join('')).join(' ').substring(0, 160)
                : "A key territory in The Sins of the Fathers universe.",
            "url": window.location.href,
            "image": location.mainImage?.asset?.url,
            "geo": (location.location) ? { "@type": "GeoCoordinates", "latitude": location.location.lat, "longitude": location.location.lng } : undefined,
            "containedInPlace": location.faction ? { "@type": "Place", "name": location.faction.title } : undefined
        };
        injectSchema(schemaData);
        console.log("> SEO Protocol: Location Schema Injected.");
    } catch (err) {
        console.warn("> SEO Protocol Warning: Failed to inject schema.", err);
    }

    // IMAGE PROCESSING
    if (location.mainImage && location.mainImage.asset) {
        const url = urlFor(location.mainImage).width(1000).height(600).fit('crop').quality(75).url();
        const blurHash = location.mainImage.asset.blurHash;

        // GSAP: BlurHash kullanırken, resmi başlangıçta bulanık bırakacağız, animasyonla netleşecek
        applyBlurToStaticImage('loc-image', url, blurHash);
    }

    const setText = (id, text, fallbackKey) => {
        const el = container.querySelector('#' + id);
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

    updateThreatDisplay(location.securityLevel || i18next.t('location_detail_page.tactical_analyzing'), container);

    if (els.desc) {
        els.desc.innerHTML = location.description
            ? toHTML(location.description)
            : `<p class="animate-pulse">${i18next.t('location_detail_page.decrypting_history')}</p>`;
    }

    if (els.events) {
        let foundEvents = [];
        if (location.allEras) {
            location.allEras.forEach(era => {
                if (era.events) {
                    const matches = era.events.filter(evt => evt.relatedLocation && evt.relatedLocation._ref === location._id);
                    foundEvents = [...foundEvents, ...matches];
                }
            });
        }

        if (foundEvents.length > 0) {
            els.events.innerHTML = foundEvents.map(evt => `
                <li class="gsap-event-item opacity-0 border-l-2 border-white/10 pl-3 py-1 hover:border-gold transition-colors group cursor-default">
                    <span class="block text-[9px] font-mono text-gray-200">${evt.date ? evt.date.split('-')[0] : 'Unknown'}</span>
                    <span class="text-xs font-serif text-gray-300 group-hover:text-white">${evt.title_en || 'Redacted Event'}</span>
                </li>
            `).join('');
        } else {
            els.events.innerHTML = `<li class="text-xs text-gray-600 italic opacity-0 gsap-event-item">${i18next.t('location_detail_page.no_events_found')}</li>`;
        }
    }

    // 👇 2. GSAP TIMELINE (SİNEMATİK AÇILIŞ)
    // --------------------------------------------------------------------
    const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
    const loader = container.querySelector('#feed-loader');
    const mainContent = container.querySelector('#location-content'); // HTML'de ana kapsayıcı ID'si

    // A. Loader'ı Kapat & İçeriği Aç
    if (loader) tl.to(loader, { autoAlpha: 0, duration: 0.5 });
    if (mainContent) tl.to(mainContent, { autoAlpha: 1, duration: 0.5 }, "-=0.3");

    // B. Resmi "Uydu Bağlantısı" gibi getir (Bulanıktan netliğe, scale down)
    if (els.image) {
        tl.add(NoirEffects.revealImage(els.image), "-=0.2");
    }

    // C. Başlığı "Matrix/Decoder" efektiyle yaz
    if (els.title) {
        tl.add(() => NoirEffects.scrambleText(els.title, location.name, 0.8), "-=1.0");
        tl.from(els.title, { opacity: 0, duration: 0.1 }, "-=0.8"); // Scramble başlarken görünür yap
    }

    // D. Metadata (Koordinat, Faction vb.) Stagger ile gelsin
    const metaElements = [els.coords, els.faction, els.status, els.threat].filter(el => el);
    if (metaElements.length > 0) {
        tl.fromTo(metaElements,
            { opacity: 0, x: -10 },
            { opacity: 1, x: 0, duration: 0.5, stagger: 0.1 }
            , "-=0.5");
    }

    // E. Açıklama metni alttan yukarı
    if (els.desc) {
        tl.add(NoirEffects.revealCard(els.desc), "-=0.3");
    }

    // F. Olaylar Listesi (Events) tek tek dökülsün
    const eventItems = container.querySelectorAll('.gsap-event-item');
    if (eventItems.length > 0) {
        tl.add(NoirEffects.staggerList(eventItems), "-=0.5");
    }
};

export default async function (container, props) {
    const feedLoader = container.querySelector('#feed-loader');
    const mainContent = container.querySelector('#location-content');
    // const container = mainContent || document.querySelector('main'); // Already passed as arg
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug');

    if (!slug) {
        if (feedLoader) feedLoader.innerHTML = `<p class="text-red-500 font-mono">${i18next.t('location_detail_loader.error_missing_slug')}</p>`;
        if (container) gsap.to(container, { autoAlpha: 1 });
        return;
    }

    try {
        console.log(`> Connecting to drone feed: ${slug}`);

        const query = `*[_type == "location" && slug.current == $slug][0]{
            _id, name, description, securityLevel, status, location, 
            mainImage { asset->{ url, "blurHash": metadata.blurHash } },
            faction->{title},
            "allEras": *[_type == "timelineEra"] {
                events[] { title_en, date, relatedLocation }
            }
        }`;

        const result = await client.fetch(query, { slug });

        if (result) {
            renderLocationIntel(result, container);
        } else {
            if (feedLoader) feedLoader.innerHTML = `<p class="text-red-500 font-mono">${i18next.t('location_detail_loader.error_not_found')}</p>`;
            document.getElementById('loc-title').textContent = "404";
            if (container) gsap.to(container, { autoAlpha: 1 });
        }

    } catch (error) {
        console.error("Uplink Error:", error);
        if (feedLoader) feedLoader.innerHTML = `<p class="text-red-500 font-mono">${i18next.t('location_detail_loader.error_fetch_failed')}</p>`;
        if (container) gsap.to(container, { autoAlpha: 1 });
    }
}