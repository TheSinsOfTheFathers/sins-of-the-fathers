import { client } from '../../lib/sanityClient.js';
import i18next from '../../lib/i18n.js';
import { injectSchema } from '../../lib/seo.js';
import gsap from 'gsap';
import { NoirEffects } from '../ui/noir-effects.js';

let mapInstance = null;

const FACTION_THEMES = {
    'ravenwood-empire': { border: '#c5a059', fill: '#c5a059' },
    'macpherson-clan': { border: '#7f1d1d', fill: '#991b1b' },
    'cagliari': { border: '#155e75', fill: '#0e7490' },
    'cagliari-crime-family': { border: '#155e75', fill: '#0e7490' },
    'the-gilded-hand': { border: '#c5a059', fill: '#c5a059' },
    'blackwood-syndicate': { border: '#1a1a1a', fill: '#1a1a1a' },
    'default': { border: '#c5a059', fill: '#c5a059' }
};

/**
 * Harita Temizleyici (Anti-Initialized Error)
 */
const destroyMap = () => {
    if (mapInstance) {
        console.log("> [MapLoader] Destroying existing map instance.");
        mapInstance.remove();
        mapInstance = null;
    }
};

/**
 * Taktiksel Marker Element Oluşturucu
 */
const createTacticalMarkerElement = (slug) => {
    // Handle potential casing mismatch
    const theme = FACTION_THEMES[slug] || FACTION_THEMES[slug.toLowerCase()] || FACTION_THEMES.default;
    const color = theme.border;

    const el = document.createElement('div');
    el.className = 'tactical-pin';
    el.style.width = '30px';
    el.style.height = '30px';
    el.innerHTML = `
        <div style="position:relative; width:100%; height:100%; display:flex; justify-content:center; align-items:center;">
           <div style="position:absolute; width:100%; height:100%; border:1px solid ${color}; border-radius:50%; opacity:0.5;" class="animate-spin-slow"></div>
           <div style="width:10px; height:10px; background:${color}; border-radius:50%; box-shadow:0 0 8px ${color};"></div>
        </div>`;
    return el;
};

async function loadLayer(map, path, id, theme) {
    try {
        const res = await fetch(path);
        if (!res.ok) throw new Error(`404 Not Found: ${path}`);
        const data = await res.json();

        map.addSource(id, {
            type: 'geojson',
            data: data
        });

        // Fill Layer
        map.addLayer({
            id: `${id}-fill`,
            type: 'fill',
            source: id,
            layout: {},
            paint: {
                'fill-color': theme.fill,
                'fill-opacity': 0.05
            }
        });

        // Outline Layer
        map.addLayer({
            id: `${id}-outline`,
            type: 'line',
            source: id,
            layout: {},
            paint: {
                'line-color': theme.border,
                'line-width': 1,
                'line-dasharray': [2, 2],
                'line-opacity': 0.4
            }
        });

    } catch (e) {
        if (e.message.includes('404')) {
            console.warn(`[Map Layer Missing] ${path}`);
        } else {
            console.error("[Map Layer Error]", path, e);
        }
    }
}

export default async function (container, props) {
    const mapContainer = container;
    const loader = document.getElementById('map-loader');

    if (mapContainer) {
        gsap.set(mapContainer, { 
            opacity: 0, 
            scale: 0.98,
            // Force GPU rendering to prevent black squares
            transform: 'translate3d(0, 0, 0)',
            backfaceVisibility: 'hidden'
        });
    }

    try {
        const schemaData = {
            "@context": "https://schema.org",
            "@type": "Map",
            "name": "Global Surveillance Map | The Sins of the Fathers",
            "description": "Interactive map showing all faction territories and key locations in the TSOF universe.",
            "url": globalThis.location.href
        };
        injectSchema(schemaData);
    } catch (e) {
        console.warn("Schema Injection Failed:", e);
    }

    if (!globalThis.mapboxgl) {
        console.error("Mapbox Library Missing!");
        if (loader) loader.innerHTML = "<span class='text-red-500'>OFFLINE</span>";
        return;
    }

    // Mapbox Token
    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || ''; 

    const applyStaticFallback = (msg = "Static_Fallback_Active") => {
        console.warn(`> [MapLoader] Triggering Static Fallback: ${msg}`);
        const staticUrl = `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/-30,40,2,0/1200x800?access_token=${mapboxgl.accessToken}&attribution=false&logo=false`;
        
        mapContainer.innerHTML = `
            <div class="relative w-full h-full overflow-hidden flex items-center justify-center bg-black">
                <img src="${staticUrl}" 
                     class="w-full h-full object-cover grayscale opacity-40" 
                     alt="Global Surveillance Fallback">
                <div class="absolute inset-0 bg-obsidian/40 pointer-events-none"></div>
                <div class="absolute bottom-6 right-6 bg-black/80 px-3 py-1 text-[10px] font-mono text-gold uppercase border border-gold/20 z-20">${msg}</div>
                <div class="absolute inset-0 map-grid pointer-events-none opacity-20"></div>
            </div>
        `;

        if (loader) {
            gsap.to(loader, { autoAlpha: 0, duration: 1, onComplete: () => loader.style.display = 'none' });
        }
        gsap.to(mapContainer, { 
            opacity: 1, 
            scale: 1, 
            filter: "contrast(1.2) brightness(0.8)",
            duration: 2 
        });
    };

    if (!mapboxgl.supported()) {
        applyStaticFallback("WebGL_Unsupported");
        return;
    }

    try {
        destroyMap();

        const map = new mapboxgl.Map({
            container: mapContainer,
            style: 'mapbox://styles/mapbox/dark-v10',
            center: [-30, 40],
            zoom: 2,
            attributionControl: false,
            projection: 'mercator' // Standard tactical projection
        });
        mapInstance = map;

        // Custom Zoom Control positioning (Bottom Right)
        map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');

        globalThis.zoomToLocation = (lat, lng, z) => {
            map.flyTo({ center: [lng, lat], zoom: z, duration: 2000, essential: true });
            const display = document.getElementById('location-name-display');
            if (display) display.textContent = i18next.t('location_loader.sector_info', { lat: lat.toFixed(4), lng: lng.toFixed(4) });
        };

        globalThis.resetMap = () => {
            map.flyTo({ center: [-30, 40], zoom: 2, duration: 1500, essential: true });
            const display = document.getElementById('location-name-display');
            if (display) display.textContent = i18next.t('location_loader.global_orbit');
        };

        map.on('load', async () => {
            console.log("> [MapLoader] Map load complete. Initiating staggered resize.");
            
            // Staggered resize to fix "black square" issue
            const resizeInt = setInterval(() => map.resize(), 1000);
            setTimeout(() => clearInterval(resizeInt), 5000);

            // 1. Load Faction Territories
            const factionsData = {
                'Ravenwood-empire': [
                    'scotland.geojson',
                    'wales.geojson',
                    'northern-ireland.geojson',
                    'california-border.geojson',
                    'italy-border.geojson',
                    'netherlands-border.geojson'
                ],
                'macpherson-clan': [
                    'scotland-highlands.geojson'
                ],
                'cagliari-family': [
                    'corsica-border.geojson'
                ]
            };

            for (const [slug, files] of Object.entries(factionsData)) {
                const theme = FACTION_THEMES[slug] || FACTION_THEMES[slug.toLowerCase()] || FACTION_THEMES.default;
                for (const file of files) {
                    const id = file.replace('.geojson', '');
                    await loadLayer(map, `/assets/maps/${file}`, id, theme);
                }
            }

            // 2. Load Markers from Sanity
            const query = `*[_type == "location" && defined(location)] { 
                name, "slug": slug.current, location, faction->{slug}, summary 
            }`;

            const locations = await client.fetch(query);
            console.log(`> [MapLoader] Found ${locations.length} locations.`);

            const markerElements = [];
            if (locations.length > 0) {
                locations.forEach(loc => {
                    const { lat, lng } = loc.location;
                    const fSlug = loc.faction?.slug?.current || 'default';

                    const el = createTacticalMarkerElement(fSlug);
                    markerElements.push(el);

                    const popup = new mapboxgl.Popup({ offset: 15, className: 'custom-popup-theme' })
                        .setHTML(`
                            <div class="p-3 bg-obsidian text-gray-300">
                                <h4 class="text-gold text-xs font-bold mb-1 border-b border-gold/20 pb-1 uppercase tracking-widest">${loc.name.toUpperCase()}</h4>
                                <p class="text-[9px] text-gray-400 mb-2 line-clamp-2 leading-relaxed">${loc.summary || i18next.t('location_loader.no_intel')}</p>
                                <a href="/pages/location-detail.html?slug=${loc.slug}" class="block text-center border border-white/10 py-1 text-[8px] hover:bg-gold hover:text-black uppercase transition-colors tracking-tighter">
                                    ${i18next.t('location_loader.inspect_button')}
                                </a>
                            </div>
                        `);

                    new mapboxgl.Marker(el)
                        .setLngLat([lng, lat])
                        .setPopup(popup)
                        .addTo(map);

                    gsap.set(el, { scale: 0, opacity: 0 });
                });
            }

            // Coordination tracking
            map.on('mousemove', (e) => {
                const coordEl = document.getElementById('coordinates-display');
                if (coordEl) coordEl.textContent = `${e.lngLat.lat.toFixed(4)} | ${e.lngLat.lng.toFixed(4)}`;
            });

            // Reveal Animation
            const tl = gsap.timeline();

            if (loader) {
                tl.to(loader, {
                    autoAlpha: 0,
                    duration: 0.5,
                    onComplete: () => loader.style.display = 'none'
                });
            }

            tl.to(mapContainer, {
                opacity: 1,
                scale: 1,
                filter: "contrast(1.2) brightness(0.8)",
                duration: 1.2,
                ease: "power2.inOut"
            }, "-=0.2");

            if (markerElements.length > 0) {
                NoirEffects.staggerScaleReveal(markerElements);
            }
        });

        map.on('error', (e) => {
            console.error("> [MapLoader] Mapbox Error:", e.error);
        });

    } catch (err) {
        console.error("> [MapLoader] Critical Error:", err);
        applyStaticFallback("System_Failure");
    }
}