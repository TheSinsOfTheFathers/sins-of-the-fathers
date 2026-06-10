import { client } from '../../lib/sanityClient';
import i18next from '../../lib/i18n';
import { injectSchema } from '../../lib/seo';
import gsap from 'gsap';
import { NoirEffects } from '../ui/noir-effects';

interface FactionTheme {
    border: string;
    fill: string;
}

interface SanityFactionSlug {
    current: string;
}

interface SanityFaction {
    slug?: SanityFactionSlug;
}

interface SanityLocationCoordinates {
    lat: number;
    lng: number;
}

interface SanityLocation {
    name: string;
    slug: string;
    location: SanityLocationCoordinates;
    faction?: SanityFaction;
    summary?: string;
}

interface MapSchemaData {
    '@context': string;
    '@type': string;
    name: string;
    description: string;
    url: string;
}

const FACTION_THEMES: Record<string, FactionTheme> = {
    'ravenwood-empire': { border: '#c5a059', fill: '#c5a059' },
    'macpherson-clan': { border: '#7f1d1d', fill: '#991b1b' },
    'cagliari': { border: '#155e75', fill: '#0e7490' },
    'cagliari-family': { border: '#155e75', fill: '#0e7490' },
    'cagliari-crime-family': { border: '#155e75', fill: '#0e7490' },
    'fraser-clan': { border: '#166534', fill: '#15803d' },
    'blackwood-syndicate': { border: '#1a1a1a', fill: '#1a1a1a' },
    'default': { border: '#c5a059', fill: '#c5a059' }
};

let mapInstance: unknown = null;

const destroyMap = (): void => {
    if (mapInstance) {
        console.log("> [MapLoader] Destroying existing map instance.");
        (mapInstance as { remove: () => void }).remove();
        mapInstance = null;
    }
};

const createTacticalMarkerElement = (slug: string): HTMLDivElement => {
    const theme = FACTION_THEMES[slug] ?? FACTION_THEMES[slug.toLowerCase()] ?? FACTION_THEMES['default'];
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

async function loadLayer(
    map: { addSource: (id: string, source: unknown) => void; addLayer: (layer: unknown) => void },
    path: string,
    id: string,
    theme: FactionTheme
): Promise<void> {
    try {
        const res = await fetch(path);
        if (!res.ok) throw new Error(`404 Not Found: ${path}`);
        const data: unknown = await res.json();

        map.addSource(id, {
            type: 'geojson',
            data: data
        });

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
        const err = e as Error;
        if (err.message.includes('404')) {
            console.warn(`[Map Layer Missing] ${path}`);
        } else {
            console.error("[Map Layer Error]", path, e);
        }
    }
}

export default async function (container: HTMLElement, props: unknown): Promise<void> {
    const mapContainer = container;
    const loader = document.getElementById('map-loader');

    if (mapContainer) {
        gsap.set(mapContainer, {
            opacity: 0,
            scale: 0.98,
            transform: 'translate3d(0, 0, 0)',
            backfaceVisibility: 'hidden'
        });
    }

    try {
        const schemaData: MapSchemaData = {
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

    const mapboxgl = (globalThis as Record<string, unknown>)['mapboxgl'] as {
        supported: () => boolean;
        Map: new (options: unknown) => {
            addControl: (control: unknown, position?: string) => void;
            on: (event: string, handler: (...args: unknown[]) => void) => void;
            flyTo: (options: unknown) => void;
            resize: () => void;
            remove: () => void;
        };
        NavigationControl: new (options: unknown) => unknown;
        Marker: new (el: HTMLElement) => {
            setLngLat: (coords: [number, number]) => { setPopup: (popup: unknown) => { addTo: (map: unknown) => unknown } };
        };
        Popup: new (options: unknown) => { setHTML: (html: string) => unknown };
    } | undefined;

    if (!mapboxgl) {
        console.error("Mapbox Library Missing!");
        if (loader) loader.innerHTML = "<span class='text-red-500'>OFFLINE</span>";
        return;
    }

    const loadLeafletAssets = (): Promise<void> => {
        return new Promise((resolve, reject) => {
            if ((globalThis as Record<string, unknown>)['L']) {
                resolve();
                return;
            }

            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);

            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load Leaflet'));
            document.head.appendChild(script);
        });
    };

    const applyLeafletFallback = async (msg: string = "Leaflet_Fallback_Active"): Promise<void> => {
        console.warn(`> [MapLoader] Triggering Leaflet Fallback: ${msg}`);

        try {
            await loadLeafletAssets();
            const L = (globalThis as Record<string, unknown>)['L'] as {
                map: (container: HTMLElement, options: unknown) => {
                    flyTo: (latlng: [number, number], zoom: number, options?: unknown) => void;
                    invalidateSize: () => void;
                };
                control: { zoom: (options: unknown) => { addTo: (map: unknown) => void } };
                tileLayer: (url: string, options: unknown) => { addTo: (map: unknown) => void };
                geoJSON: (data: unknown, options: unknown) => { addTo: (map: unknown) => void };
                marker: (latlng: [number, number], options: unknown) => {
                    addTo: (map: unknown) => {
                        bindPopup: (html: string, options?: unknown) => unknown;
                    };
                };
                divIcon: (options: unknown) => unknown;
            };

            mapContainer.innerHTML = '';

            const leafletMap = L.map(mapContainer, {
                center: [40, -30],
                zoom: 3,
                attributionControl: false,
                zoomControl: false
            });

            L.control.zoom({ position: 'bottomright' }).addTo(leafletMap);

            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                subdomains: 'abcd',
                maxZoom: 19
            }).addTo(leafletMap);

            (globalThis as Record<string, unknown>)['zoomToLocation'] = (lat: number, lng: number, z: number): void => {
                leafletMap.flyTo([lat, lng], z, { duration: 2 });
                const display = document.getElementById('location-name-display');
                if (display) display.textContent = i18next.t('location_loader.sector_info', { lat: lat.toFixed(4), lng: lng.toFixed(4) });
                setTimeout(() => leafletMap.invalidateSize(), 500);
            };

            (globalThis as Record<string, unknown>)['resetMap'] = (): void => {
                leafletMap.flyTo([40, -30], 3, { duration: 1.5 });
                const display = document.getElementById('location-name-display');
                if (display) display.textContent = i18next.t('location_loader.global_orbit');
            };

            const factionsData: Record<string, string[]> = {
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
                const theme = FACTION_THEMES[slug] ?? FACTION_THEMES[slug.toLowerCase()] ?? FACTION_THEMES['default'];
                for (const file of files) {
                    try {
                        const response = await fetch(`/assets/maps/${file}`);
                        if (!response.ok) throw new Error(`HTTP ${response.status}`);
                        const geojsonData: unknown = await response.json();

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

            const query = `*[_type == "location" && defined(location)] {
                name, "slug": slug.current, location, faction->{slug}, summary
            }`;
            const locations: SanityLocation[] = await client.fetch(query);

            locations.forEach(loc => {
                const { lat, lng } = loc.location;
                const fSlug = loc.faction?.slug?.current ?? 'default';
                const theme = FACTION_THEMES[fSlug] ?? FACTION_THEMES['default'];

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
                            <p class="text-[11px] text-gray-400 mb-4 leading-relaxed font-mono opacity-80">${loc.summary ?? i18next.t('location_loader.no_intel')}</p>
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

            if (loader) {
                gsap.to(loader, { autoAlpha: 0, duration: 1, onComplete: () => { loader.style.display = 'none'; } });
            }

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

            setTimeout(() => leafletMap.invalidateSize(), 800);

        } catch (err) {
            console.error("> [MapLoader] Leaflet Fallback failed:", err);
            console.warn(`> [MapLoader] Triggering Static Fallback: Final_Resort`);
            const accessToken = (mapboxgl as unknown as { accessToken: string }).accessToken;
            const staticUrl = `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/-30,40,2,0/1200x800?access_token=${accessToken}&attribution=false&logo=false`;

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

        (globalThis as Record<string, unknown>)['zoomToLocation'] = (lat: number, lng: number, z: number): void => {
            map.flyTo({ center: [lng, lat], zoom: z, duration: 2000, essential: true });
            const display = document.getElementById('location-name-display');
            if (display) display.textContent = i18next.t('location_loader.sector_info', { lat: lat.toFixed(4), lng: lng.toFixed(4) });
        };

        (globalThis as Record<string, unknown>)['resetMap'] = (): void => {
            map.flyTo({ center: [-30, 40], zoom: 2, duration: 1500, essential: true });
            const display = document.getElementById('location-name-display');
            if (display) display.textContent = i18next.t('location_loader.global_orbit');
        };

        map.on('load', async (..._args: unknown[]): Promise<void> => {
            console.log("> [MapLoader] Map load complete. Initiating staggered resize.");

            const resizeInt = setInterval(() => map.resize(), 1000);
            setTimeout(() => clearInterval(resizeInt), 5000);

            const factionsData: Record<string, string[]> = {
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
                const theme = FACTION_THEMES[slug] ?? FACTION_THEMES[slug.toLowerCase()] ?? FACTION_THEMES['default'];
                for (const file of files) {
                    const id = file.replace('.geojson', '');
                    await loadLayer(map as unknown as Parameters<typeof loadLayer>[0], `/assets/maps/${file}`, id, theme);
                }
            }

            const query = `*[_type == "location" && defined(location)] {
                name, "slug": slug.current, location, faction->{slug}, summary
            }`;

            const locations: SanityLocation[] = await client.fetch(query);
            const markerElements: HTMLDivElement[] = [];

            if (locations.length > 0) {
                locations.forEach(loc => {
                    const { lat, lng } = loc.location;
                    const fSlug = loc.faction?.slug?.current ?? 'default';

                    const el = createTacticalMarkerElement(fSlug);
                    markerElements.push(el);

                    const popup = new mapboxgl.Popup({ offset: 15, className: 'custom-popup-theme' })
                        .setHTML(`
                            <div class="p-3 bg-obsidian text-gray-300">
                                <h4 class="text-gold text-xs font-bold mb-1 border-b border-gold/20 pb-1 uppercase tracking-widest">${loc.name.toUpperCase()}</h4>
                                <p class="text-[9px] text-gray-400 mb-2 line-clamp-2 leading-relaxed">${loc.summary ?? i18next.t('location_loader.no_intel')}</p>
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

            map.on('mousemove', (e: unknown): void => {
                const event = e as { lngLat: { lat: number; lng: number } };
                const coordEl = document.getElementById('coordinates-display');
                if (coordEl) coordEl.textContent = `${event.lngLat.lat.toFixed(4)} | ${event.lngLat.lng.toFixed(4)}`;
            });

            const tl = gsap.timeline();
            if (loader) {
                tl.to(loader, {
                    autoAlpha: 0,
                    duration: 0.5,
                    onComplete: () => { loader.style.display = 'none'; }
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

        map.on('error', (e: unknown): void => {
            const event = e as { error: unknown };
            console.error("> [MapLoader] Mapbox Error:", event.error);
        });

    } catch (err) {
        console.error("> [MapLoader] Critical Error:", err);
        await applyLeafletFallback("System_Failure");
    }
}
