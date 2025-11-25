import { client } from '../../lib/sanityClient.js';

let mapInstance = null; 

const FACTION_THEMES = {
    'ballantine-empire': { border: '#c5a059', fill: '#c5a059', glow: '#ffd700' }, 
    'macpherson-clan':   { border: '#7f1d1d', fill: '#991b1b', glow: '#ef4444' }, 
    'default':           { border: '#52525b', fill: '#3f3f46', glow: '#d4d4d8' }  
};

async function loadGeoJSON(filePath) {
    try {
        const cleanPath = filePath.replace('/public', ''); 
        
        const response = await fetch(cleanPath);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    } catch (error) {
        console.warn(`Map Layer Error (${filePath}):`, error);
        return null; 
    }
}

const createTacticalIcon = (factionSlug, iconType = 'fa-map-marker-alt') => {
    const theme = FACTION_THEMES[factionSlug] || FACTION_THEMES.default;
    const color = theme.border;

    return L.divIcon({
        className: 'custom-tactical-icon',
        html: `
            <div class='relative flex items-center justify-center w-8 h-8 group cursor-pointer'>
                <!-- Dönen dış halka -->
                <div class="absolute inset-0 rounded-full border border-current opacity-60 animate-spin-slow" style="color:${color}"></div>
                <!-- Merkez ikon -->
                <div class='flex items-center justify-center w-5 h-5 rounded-full bg-obsidian border border-current shadow-[0_0_10px_currentColor]' 
                     style="color:${color}; background-color:rgba(0,0,0,0.7); border-color:${color}">
                    <i class="fas ${iconType} text-[9px]"></i>
                </div>
                <!-- Ping effect -->
                <div class="absolute inset-0 rounded-full bg-current opacity-20 animate-ping pointer-events-none" style="color:${color}"></div>
            </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
    });
};

const addLocationMarkers = (map, locations) => {
    if (!locations || locations.length === 0) return;

    console.log(`> Deploying ${locations.length} tactical markers...`);

    locations.forEach(location => {
        const lat = location.location?.lat || location.coordinates?.lat;
        const lng = location.location?.lng || location.coordinates?.lng;

        if (!lat || !lng) return;
        
        const factionSlug = location.faction?.slug?.current || 'default';
        const themeColor = (FACTION_THEMES[factionSlug] || FACTION_THEMES.default).border;

        const icon = createTacticalIcon(factionSlug, 'fa-crosshairs');
        const marker = L.marker([lat, lng], { icon: icon }).addTo(map);

        marker.on('popupopen', function (e) {
            // Zamanlama sorununu çözmek için küçük bir gecikme ekle
            setTimeout(() => {
                if (this.getPopup()) {
                    this.getPopup().update();
                }
            }, 1);

            // Tıklama olayının haritaya sızmasını engelle
            const popupElement = this.getPopup().getElement();
            if (popupElement) {
                const closeButton = popupElement.querySelector('.leaflet-popup-close-button');
                if (closeButton) {
                    L.DomEvent.on(closeButton, 'click', L.DomEvent.stopPropagation);
                    L.DomEvent.on(closeButton, 'mousedown', L.DomEvent.stopPropagation);
                    L.DomEvent.on(closeButton, 'dblclick', L.DomEvent.stopPropagation);
                }
            }
        });

        marker.bindPopup(`
            <div class="text-left min-w-[200px] font-sans">
                <h3 style="color:${themeColor}" class="font-serif text-lg border-b border-gray-700 pb-1 mb-2 uppercase tracking-wide">
                    ${location.name}
                </h3>
                <div class="text-xs font-mono text-gray-400 space-y-1 mb-3">
                    <p>SECTOR: <span class="text-white">${factionSlug.split('-')[0].toUpperCase()}</span></p>
                    <p class="line-clamp-2 opacity-80">${location.summary || 'Surveillance active.'}</p>
                </div>
                <a href="location-detail.html?slug=${location.slug}" 
                   class="block text-center border border-white/20 bg-white/5 hover:bg-white/10 py-2 text-[10px] text-white font-mono uppercase tracking-widest transition-colors">
                    > ACCESS TERMINAL
                </a>
            </div>
        `, {
            className: 'leaflet-dark-popup' 
        });
    });
};

const addFactionTerritories = async (map, factions) => {
    if (!factions) return;

    const factionFileMap = {
        'ballantine-empire': [
            '/assets/maps/united-kingdom-border.geojson',
            '/assets/maps/california-border.geojson',
            '/assets/maps/italy-border.geojson'
        ],
        'macpherson-clan': [
            '/assets/maps/scotland-highlands.geojson' 
        ],
    };

    for (const faction of factions) {
        const slug = faction.slug.current;
        const filePaths = factionFileMap[slug]; 
        if (!filePaths) continue;

        const theme = FACTION_THEMES[slug] || FACTION_THEMES.default;

        const geoStyle = {
            color: theme.border,
            weight: 1,
            opacity: 0.8,
            fillColor: theme.fill,
            fillOpacity: 0.15, 
            dashArray: '5, 10', 
            className: 'tactical-overlay-path'
        };

        for (const path of filePaths) {
            const data = await loadGeoJSON(path);
            if (data) {
                L.geoJSON(data, { style: geoStyle }).addTo(map);
            }
        }
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) return;

    try {
        const map = L.map('map', {
            center: [40, -30], 
            zoom: 3,
            zoomControl: false,
            attributionControl: false
        });
        mapInstance = map;

        // Popup katmanının diğer UI elemanlarının üzerinde olmasını garantile
        map.getPane('popupPane').style.zIndex = 800;

        L.control.zoom({ position: 'topright' }).addTo(map);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19
        }).addTo(map);

        window.zoomToLocation = (lat, lng, zoom) => {
            map.flyTo([lat, lng], zoom, { duration: 2.5 });
            updateHUD(`COORDS LOCKED: ${lat} / ${lng}`);
        };
        
        window.resetMap = () => {
            map.flyTo([40, -30], 3, { duration: 2 });
            updateHUD("GLOBAL VIEW RESTORED");
        };

        function updateHUD(text) {
            const hudDisplay = document.getElementById('location-name-display');
            if(hudDisplay) {
                hudDisplay.textContent = text;
                hudDisplay.classList.add('text-gold', 'animate-pulse');
                setTimeout(() => hudDisplay.classList.remove('text-gold', 'animate-pulse'), 1000);
            }
        }

        const locationsQuery = `*[_type == "location"]{ 
            name, 
            "slug": slug.current, 
            location, 
            coordinates, // Backup field
            summary, 
            faction->{slug}
        }`;
        
        const factionsQuery = `*[_type == "faction"]{ 
            name, 
            slug 
        }`;

        const [locations, factions] = await Promise.all([
            client.fetch(locationsQuery),
            client.fetch(factionsQuery)
        ]);

        await addFactionTerritories(map, factions);
        addLocationMarkers(map, locations);

        map.on('mousemove', (e) => {
            const display = document.getElementById('coordinates-display');
            if(display) display.textContent = `LAT: ${e.latlng.lat.toFixed(4)} // LNG: ${e.latlng.lng.toFixed(4)}`;
        });

        const loader = document.getElementById('map-loader');
        if(loader) loader.classList.add('opacity-0', 'pointer-events-none');

    } catch (error) {
        console.error("System Failure (Map):", error);
        mapContainer.innerHTML = '<div class="flex h-full items-center justify-center text-red-500 font-mono">UPLINK FAILED: SATELLITE OFFLINE</div>';
    }
});