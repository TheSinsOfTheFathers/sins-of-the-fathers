import { client, urlFor } from '../../lib/sanityClient';
import { toHTML } from '@portabletext/to-html';
import { applyBlurToStaticImage } from '../../lib/imageUtils';
import i18next from '../../lib/i18n';
import { injectSchema } from '../../lib/seo';
import gsap from 'gsap';
import { NoirEffects } from '../ui/noir-effects';

interface SanityImageAsset {
    url: string;
    blurHash?: string;
}

interface SanityImage {
    asset?: SanityImageAsset;
}

interface GeoPoint {
    lat: number;
    lng: number;
}

interface Faction {
    title: string;
}

interface RelatedLocationRef {
    _ref: string;
}

interface TimelineEvent {
    title_en?: string;
    date?: string;
    relatedLocation?: RelatedLocationRef;
}

interface TimelineEra {
    events?: TimelineEvent[];
}

interface LocationDocument {
    _id: string;
    name: string;
    description?: unknown[];
    securityLevel?: string;
    status?: string;
    location?: GeoPoint;
    mainImage?: SanityImage;
    faction?: Faction;
    allEras?: TimelineEra[];
}

interface PlaceSchema {
    "@context": string;
    "@type": string;
    name: string;
    description: string;
    url: string;
    image?: string;
    geo?: {
        "@type": string;
        latitude: number;
        longitude: number;
    };
    containedInPlace?: {
        "@type": string;
        name: string;
    };
}

const updateThreatDisplay = (level: string = 'neutral', container: Element): void => {
    const threatEl = container ? container.querySelector('#loc-threat') : document.getElementById('loc-threat');
    if (!threatEl) return;

    const normalized = level.toLowerCase();
    let colorClass = 'text-gray-200';
    let icon = 'fa-minus-circle';

    if (['high', 'critical', 'severe'].includes(normalized)) {
        colorClass = 'text-red-500';
        icon = 'fa-exclamation-triangle';
    } else if (['moderate', 'elevated'].includes(normalized)) {
        colorClass = 'text-yellow-500';
        icon = 'fa-exclamation-circle';
    } else if (['secure', 'low', 'safe', 'active'].includes(normalized)) {
        colorClass = 'text-green-500';
        icon = 'fa-check-circle';
    }

    threatEl.className = `text-xs font-mono uppercase font-bold flex items-center ${colorClass}`;
    threatEl.textContent = '';
    const iconEl = document.createElement('i');
    iconEl.className = `fas ${icon} mr-2`;
    threatEl.appendChild(iconEl);
    threatEl.appendChild(document.createTextNode(` ${level}`));

    if (['high', 'critical', 'severe'].includes(normalized)) {
        gsap.to(threatEl, { opacity: 0.4, duration: 0.6, repeat: -1, yoyo: true });
    }
};

const renderLocationIntel = (location: LocationDocument, container: Element): void => {
    document.title = `${location.name} // SURVEILLANCE FEED`;

    const els = {
        container: container.querySelector('#location-intel'),
        image: container.querySelector('#loc-image'),
        title: container.querySelector('#loc-title'),
        faction: container.querySelector('#loc-faction'),
        status: container.querySelector('#loc-status'),
        coords: container.querySelector('#loc-coords'),
        threat: container.querySelector('#loc-threat'),
        desc: container.querySelector('#loc-description'),
        events: container.querySelector('#loc-events')
    };

    try {
        const descriptionText: string = Array.isArray(location.description)
            ? (location.description as Array<{ children?: Array<{ text?: string }> }>)
                .map(block => block.children?.map(child => child.text ?? '').join('') ?? '')
                .join(' ')
                .substring(0, 160)
            : 'A key territory in The Sins of the Fathers universe.';

        const schemaData: PlaceSchema = {
            "@context": "https://schema.org",
            "@type": "Place",
            "name": location.name,
            "description": descriptionText,
            "url": window.location.href,
            "image": location.mainImage?.asset?.url,
            "geo": location.location
                ? { "@type": "GeoCoordinates", "latitude": location.location.lat, "longitude": location.location.lng }
                : undefined,
            "containedInPlace": location.faction
                ? { "@type": "Place", "name": location.faction.title }
                : undefined
        };
        injectSchema(schemaData);
        console.log("> SEO Protocol: Location Schema Injected.");
    } catch (err) {
        console.warn("> SEO Protocol Warning: Failed to inject schema.", err);
    }

    if (location.mainImage?.asset) {
        const url = urlFor(location.mainImage).width(1000).height(600).fit('crop').quality(75).url();
        const blurHash = location.mainImage.asset.blurHash ?? '';
        applyBlurToStaticImage('loc-image', url, blurHash);
    }

    const setText = (id: string, text: string | undefined, fallbackKey?: string): void => {
        const el = container.querySelector('#' + id);
        if (el) el.textContent = text ?? (fallbackKey ? i18next.t(fallbackKey) : '');
    };

    setText('loc-title', location.name, 'location_detail_page.placeholder_unknown');
    setText('loc-faction', location.faction?.title, 'location_detail_page.tactical_unverified');
    setText('loc-status', location.status, 'location_detail_page.tactical_operational');

    if (location.location) {
        setText('loc-coords', `${location.location.lat.toFixed(4)}° N, ${location.location.lng.toFixed(4)}° W`);
    } else {
        setText('loc-coords', '--.--, --.--');
    }

    updateThreatDisplay(location.securityLevel ?? i18next.t('location_detail_page.tactical_analyzing'), container);

    if (els.desc) {
        // trusted: toHTML produces sanitised output from structured Portable Text; fallback string is a static i18n key interpolation with no user input
        els.desc.innerHTML = location.description
            ? toHTML(location.description as unknown as import('@portabletext/types').TypedObject[])
            : `<p class="animate-pulse">${i18next.t('location_detail_page.decrypting_history')}</p>`;
    }

    if (els.events) {
        let foundEvents: TimelineEvent[] = [];
        if (location.allEras) {
            location.allEras.forEach(era => {
                if (era.events) {
                    const matches = era.events.filter(
                        evt => evt.relatedLocation && evt.relatedLocation._ref === location._id
                    );
                    foundEvents = [...foundEvents, ...matches];
                }
            });
        }

        els.events.textContent = '';
        if (foundEvents.length > 0) {
            foundEvents.forEach(evt => {
                const li = document.createElement('li');
                li.className = 'gsap-event-item opacity-0 border-l-2 border-white/10 pl-3 py-1 hover:border-gold transition-colors group cursor-default';

                const dateSpan = document.createElement('span');
                dateSpan.className = 'block text-[9px] font-mono text-gray-200';
                dateSpan.textContent = evt.date ? evt.date.split('-')[0] : 'Unknown';

                const titleSpan = document.createElement('span');
                titleSpan.className = 'text-xs font-serif text-gray-300 group-hover:text-white';
                titleSpan.textContent = evt.title_en ?? 'Redacted Event';

                li.appendChild(dateSpan);
                li.appendChild(titleSpan);
                els.events!.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.className = 'text-xs text-gray-600 italic opacity-0 gsap-event-item';
            li.textContent = i18next.t('location_detail_page.no_events_found');
            els.events.appendChild(li);
        }
    }

    const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
    const loader = container.querySelector('#feed-loader');
    const mainContent = container.querySelector('#location-content');

    if (loader) tl.to(loader, { autoAlpha: 0, duration: 0.5 });
    if (mainContent) tl.to(mainContent, { autoAlpha: 1, duration: 0.5 }, "-=0.3");

    if (els.image) {
        tl.add(NoirEffects.revealImage(els.image), "-=0.2");
    }

    if (els.title) {
        tl.add(() => NoirEffects.scrambleText(els.title as Element, location.name, 0.8), "-=1.0");
        tl.from(els.title, { opacity: 0, duration: 0.1 }, "-=0.8");
    }

    const metaElements = [els.coords, els.faction, els.status, els.threat].filter((el): el is Element => el !== null);
    if (metaElements.length > 0) {
        tl.fromTo(metaElements,
            { opacity: 0, x: -10 },
            { opacity: 1, x: 0, duration: 0.5, stagger: 0.1 }
            , "-=0.5");
    }

    if (els.desc) {
        tl.add(NoirEffects.revealCard(els.desc), "-=0.3");
    }

    const eventItems = container.querySelectorAll('.gsap-event-item');
    if (eventItems.length > 0) {
        tl.add(NoirEffects.staggerList(Array.from(eventItems)), "-=0.5");
    }
};

export default async function locationDetailLoader(container: Element, props: Record<string, unknown>): Promise<void> {
    const feedLoader = container.querySelector('#feed-loader');
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug');

    if (!slug) {
        if (feedLoader) {
            feedLoader.textContent = '';
            const p = document.createElement('p');
            p.className = 'text-red-500 font-mono';
            p.textContent = i18next.t('location_detail_loader.error_missing_slug');
            feedLoader.appendChild(p);
        }
        gsap.to(container, { autoAlpha: 1 });
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

        const result: LocationDocument | null = await client.fetch(query, { slug });

        if (result) {
            renderLocationIntel(result, container);
        } else {
            if (feedLoader) {
                feedLoader.textContent = '';
                const p = document.createElement('p');
                p.className = 'text-red-500 font-mono';
                p.textContent = i18next.t('location_detail_loader.error_not_found');
                feedLoader.appendChild(p);
            }
            const titleEl = document.getElementById('loc-title');
            if (titleEl) titleEl.textContent = "404";
            gsap.to(container, { autoAlpha: 1 });
        }

    } catch (error) {
        console.error("Uplink Error:", error);
        if (feedLoader) {
            feedLoader.textContent = '';
            const p = document.createElement('p');
            p.className = 'text-red-500 font-mono';
            p.textContent = i18next.t('location_detail_loader.error_fetch_failed');
            feedLoader.appendChild(p);
        }
        gsap.to(container, { autoAlpha: 1 });
    }
}
