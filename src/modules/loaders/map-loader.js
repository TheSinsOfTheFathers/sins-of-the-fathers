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
    'cagliari-family': { border: '#155e75', fill: '#0e7490' },
    'cagliari-crime-family': { border: '#155e75', fill: '#0e7490' },
    'fraser-clan': { border: '#166534', fill: '#15803d' },
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

    /**
     * Leaflet Asset Loader (Dynamic)
     */
    const loadLeafletAssets = () => {
        return new Promise((resolve, reject) => {
            if (globalThis.L) return resolve();
            
            // CSS
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);
            
            // JS
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    };

    /**
     * Interactive Leaflet Fallback
     */
    const applyLeafletFallback = async (msg = "Leaflet_Fallback_Active") => {
        console.warn(`> [MapLoader] Triggering Leaflet Fallback: ${msg}`);
        
        try {
            await loadLeafletAssets();
            const L = globalThis.L;
            
            // Clean container
            mapContainer.innerHTML = '';
            
            // Init Leaflet Map
            const leafletMap = L.map(mapContainer, {
                center: [40, -30],
                zoom: 3,
                attributionControl: false,
                zoomControl: false
            });

            L.control.zoom({ position: 'bottomright' }).addTo(leafletMap);

            // Dark Matter Tiles (CartoDB)
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                subdomains: 'abcd',
                maxZoom: 19
            }).addTo(leafletMap);

            // Interface for Global Flight
            globalThis.zoomToLocation = (lat, lng, z) => {
                leafletMap.flyTo([lat, lng], z, { duration: 2 });
                const display = document.getElementById('location-name-display');
                if (display) display.textContent = i18next.t('location_loader.sector_info', { lat: lat.toFixed(4), lng: lng.toFixed(4) });
                
                // Force layout recalculation to fix tile gaps
                setTimeout(() => leafletMap.invalidateSize(), 500);
            };

            globalThis.resetMap = () => {
                leafletMap.flyTo([40, -30], 3, { duration: 1.5 });
                const display = document.getElementById('location-name-display');
                if (display) display.textContent = i18next.t('location_loader.global_orbit');
            };

            // Add Faction Territories (Leaflet GeoJSON - Local Asset Parity)
            const factionsData = {
                'ravenwood-empire': [
                    'united-kingdom-main.geojson',
                    'california-border.geojson',
                    'italy-border.geojson',
                    'netherlands-border.geojson'
                ],
                'macpherson-clan': [
                    'aberdeen.geojson'
                ],
                'fraser-clan': [
                    'edinburgh.geojson'
                ],
                'cagliari-family': [
                    'corsica.geojson'
                ]
            };

            for (const [slug, files] of Object.entries(factionsData)) {
                const theme = FACTION_THEMES[slug] || FACTION_THEMES[slug.toLowerCase()] || FACTION_THEMES.default;
                for (const file of files) {
                    try {
                        const response = await fetch(`/assets/maps/${file}`);
                        if (!response.ok) throw new Error(`HTTP ${response.status}`);
                        const geojsonData = await response.json();
                        
                        L.geoJSON(geojsonData, {
                            style: {
                                color: theme.border,
                                weight: 1.5,
                                opacity: 0.4,
                                fillColor: theme.border,
                                fillOpacity: 0.1
                            }
                        }).addTo(leafletMap);
                    } catch (e) {
                        console.error(`> [MapLoader] Leaflet GeoJSON error [${file}]:`, e);
                    }
                }
            }

            // Fetch and Add Markers (Similar Logic to Mapbox)
            const query = `*[_type == "location" && defined(location)] { 
                name, "slug": slug.current, location, faction->{slug}, summary 
            }`;
            const locations = await client.fetch(query);

            locations.forEach(loc => {
                const { lat, lng } = loc.location;
                const fSlug = loc.faction?.slug?.current || 'default';
                const theme = FACTION_THEMES[fSlug] || FACTION_THEMES.default;

                // Simple Div Icon for consistency
                const icon = L.divIcon({
                    className: 'custom-leaflet-marker',
                    html: `
                        <div class="tactical-pin" style="width:20px; height:20px; position:relative;">
                            <div style="position:absolute; inset:0; border:1px solid ${theme.border}; border-radius:50%; opacity:0.5;" class="animate-spin-slow"></div>
                            <div style="position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); width:6px; height:6px; background:${theme.border}; border-radius:50%; box-shadow:0 0 8px ${theme.border};"></div>
                        </div>`,
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                });

                L.marker([lat, lng], { icon })
                    .addTo(leafletMap)
                    .bindPopup(`
                        <div class="p-4 bg-obsidian text-gray-300 min-w-[180px] border border-gold/20 shadow-2xl">
                            <h4 class="text-gold text-sm font-bold mb-2 border-b border-gold/20 pb-1 uppercase tracking-widest font-display">${loc.name.toUpperCase()}</h4>
                            <p class="text-[11px] text-gray-400 mb-4 leading-relaxed font-mono opacity-80">${loc.summary || i18next.t('location_loader.no_intel')}</p>
                            <a href="/pages/location-detail.html?slug=${loc.slug}" 
                               class="block text-center border border-gold/30 bg-gold/5 py-2 text-[10px] hover:bg-gold hover:text-black uppercase transition-all duration-300 tracking-widest font-bold">
                                ${i18next.t('location_loader.inspect_button')}
                            </a>
                        </div>
                    `, { 
                        className: 'custom-leaflet-popup',
                        maxWidth: 300
                    });
            });

            // Finish Loading & Force Visibility
            if (loader) {
                gsap.to(loader, { autoAlpha: 0, duration: 1, onComplete: () => loader.style.display = 'none' });
            }

            // Remove transition classes that might block GSAP
            mapContainer.classList.remove('opacity-0', 'scale-95');

            gsap.fromTo(mapContainer, 
                { opacity: 0, scale: 0.98 },
                { 
                    opacity: 1, 
                    scale: 1, 
                    filter: "contrast(1.05) brightness(1.25)",
                    duration: 1.5,
                    ease: "power2.out"
                }
            );

            // Final fix for tile alignment
            setTimeout(() => leafletMap.invalidateSize(), 800);

        } catch (err) {
            console.error("> [MapLoader] Leaflet Fallback failed:", err);
            // Final static fallback if even Leaflet fails
            console.warn(`> [MapLoader] Triggering Static Fallback: Final_Resort`);
            const staticUrl = `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/-30,40,2,0/1200x800?access_token=${mapboxgl.accessToken}&attribution=false&logo=false`;
            
            mapContainer.innerHTML = `
                <div class="relative w-full h-full overflow-hidden flex items-center justify-center bg-black">
                    <img src="${staticUrl}" class="w-full h-full object-cover grayscale opacity-40" alt="Static Fallback">
                    <div class="absolute bottom-6 right-6 bg-black/80 px-3 py-1 text-[10px] font-mono text-gold uppercase border border-gold/20 z-20">SYSTEM_OFFLINE</div>
                </div>
            `;
        }
    };

    if (!mapboxgl.supported()) {
        await applyLeafletFallback("WebGL_Unsupported");
        return;
    }

    try {
        destroyMap();

        const map = new mapboxgl.Map({
            container: mapContainer,
            style: 'mapbox://styles/mapbox/dark-v11',
            center: [-30, 40],
            zoom: 2,
            attributionControl: false,
            projection: 'mercator'
        });
        mapInstance = map;

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
            
            const resizeInt = setInterval(() => map.resize(), 1000);
            setTimeout(() => clearInterval(resizeInt), 5000);

            // Territories Data
            const factionsData = {
                'ravenwood-empire': [
                    'united-kingdom-main.geojson',
                    'california-border.geojson',
                    'italy-border.geojson',
                    'netherlands-border.geojson'
                ],
                'macpherson-clan': [
                    'aberdeen.geojson'
                ],
                'fraser-clan': [
                    'edinburgh.geojson'
                ],
                'cagliari-family': [
                    'corsica.geojson'
                ]
            };

            for (const [slug, files] of Object.entries(factionsData)) {
                const theme = FACTION_THEMES[slug] || FACTION_THEMES[slug.toLowerCase()] || FACTION_THEMES.default;
                for (const file of files) {
                    const id = file.replace('.geojson', '');
                    await loadLayer(map, `/assets/maps/${file}`, id, theme);
                }
            }

            // Load Markers from Sanity
            const query = `*[_type == "location" && defined(location)] { 
                name, "slug": slug.current, location, faction->{slug}, summary 
            }`;

            const locations = await client.fetch(query);
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

            map.on('mousemove', (e) => {
                const coordEl = document.getElementById('coordinates-display');
                if (coordEl) coordEl.textContent = `${e.lngLat.lat.toFixed(4)} | ${e.lngLat.lng.toFixed(4)}`;
            });

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
        await applyLeafletFallback("System_Failure");
    }
}