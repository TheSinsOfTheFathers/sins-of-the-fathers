import { client } from '../../lib/sanityClient.js';

let mapInstance = null;

const FACTION_THEMES = {
    'ballantine-empire': { border: '#c5a059', fill: '#c5a059' }, 
    'macpherson-clan':   { border: '#7f1d1d', fill: '#991b1b' }, 
    'default':           { border: '#555555', fill: '#777777' }
};

/**
 * Harita Temizleyici (Anti-Initialized Error)
 * Harita divini ve memory referansını sıfırlar.
 */
const destroyMap = (id) => {
    const container = document.getElementById(id);
    if (mapInstance) {
        mapInstance.off();
        mapInstance.remove();
        mapInstance = null;
    }
    if (container) {
        container._leaflet_id = null; 
    }
};

/**
 * Taktiksel Marker İkonu Oluşturucu
 */
const createTacticalIcon = (slug) => {
    if (!window.L) return null;
    const color = (FACTION_THEMES[slug] || FACTION_THEMES.default).border;
    
    return L.divIcon({
        className: 'tactical-pin',
        html: `
            <div style="position:relative; width:30px; height:30px; display:flex; justify-content:center; align-items:center;">
               <div style="position:absolute; width:100%; height:100%; border:1px solid ${color}; border-radius:50%; opacity:0.5;" class="animate-spin-slow"></div>
               <div style="width:10px; height:10px; background:${color}; border-radius:50%; box-shadow:0 0 8px ${color};"></div>
            </div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -15]
    });
};

async function loadLayer(map, path, theme) {
    try {
        const res = await fetch(path);
        if (!res.ok) throw new Error(`404 Not Found: ${path}`);
        const data = await res.json();
        
        L.geoJSON(data, {
            style: {
                color: theme.border,
                weight: 1,
                opacity: 0.6,
                fillColor: theme.fill,
                fillOpacity: 0.1,
                dashArray: '4 4'
            }
        }).addTo(map);
    } catch (e) {
        console.warn(`[Map Layer Missing] ${path}`);
    }
}

export async function displayLocations() {
    const mapContainer = document.getElementById('map');
    const loader = document.getElementById('map-loader');

    if (!mapContainer) return; 
    if (!window.L) {
        console.error("Leaflet Library Missing!");
        return;
    }

    try {
        destroyMap('map');

        const map = L.map('map', {
            center: [40, -30],
            zoom: 3,
            zoomControl: false,
            attributionControl: false
        });
        mapInstance = map; 

        L.control.zoom({ position: 'bottomright' }).addTo(map);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 18
        }).addTo(map);

        window.zoomToLocation = (lat, lng, z) => {
            map.flyTo([lat, lng], z, { duration: 2.0 });
            const display = document.getElementById('location-name-display');
            if (display) display.textContent = `SECTOR: ${lat}, ${lng}`;
        };
        window.resetMap = () => {
            map.flyTo([40, -30], 3, { duration: 1.5 });
            const display = document.getElementById('location-name-display');
            if (display) display.textContent = "GLOBAL ORBIT";
        };

        const factionsData = {
            'ballantine-empire': [
                'united-kingdom-border.geojson', 
                'california-border.geojson', 
                'italy-border.geojson',
                'netherlands-border.geojson'
            ],
            'macpherson-clan': [
                'scotland-highlands.geojson'
            ]
        };

        for (const [slug, files] of Object.entries(factionsData)) {
            const theme = FACTION_THEMES[slug] || FACTION_THEMES.default;
            for (const file of files) {
                await loadLayer(map, `/public/assets/maps/${file}`, theme);
            }
        }

        const query = `*[_type == "location" && defined(location)] { 
            name, "slug": slug.current, location, faction->{slug}, summary 
        }`;
        
        const locations = await client.fetch(query);
        console.log(`> Found ${locations.length} locations.`);

        if (locations.length > 0) {
            locations.forEach(loc => {
                const { lat, lng } = loc.location; 
                const fSlug = loc.faction?.slug?.current || 'default';
                
                const marker = L.marker([lat, lng], {
                    icon: createTacticalIcon(fSlug)
                }).addTo(map);

                marker.bindPopup(`
                    <div class="text-left font-mono min-w-[150px]">
                        <h4 class="text-gold text-sm font-bold mb-1 border-b border-white/20 pb-1">${loc.name.toUpperCase()}</h4>
                        <p class="text-[10px] text-gray-400 mb-2 line-clamp-2">${loc.summary || 'No Intel'}</p>
                        <a href="location-detail.html?slug=${loc.slug}" class="block text-center bg-white/10 py-1 text-[9px] hover:bg-gold hover:text-black uppercase transition">
                            INSPECT
                        </a>
                    </div>
                `, { className: 'custom-popup-theme' });
            });
        }

        if (loader) {
            loader.classList.add('opacity-0', 'pointer-events-none');
        }

        map.on('mousemove', (e) => {
            const el = document.getElementById('coordinates-display');
            if (el) el.textContent = `${e.latlng.lat.toFixed(4)} | ${e.latlng.lng.toFixed(4)}`;
        });

    } catch (err) {
        console.error("Map Critical Error:", err);
        if (mapContainer) mapContainer.innerHTML = '<p class="text-center text-red-500 mt-10">MAP SYSTEM FAILURE</p>';
    }
}