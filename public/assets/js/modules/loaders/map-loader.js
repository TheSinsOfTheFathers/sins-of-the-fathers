import { client } from '../../lib/sanityClient.js';

let mapInstance = null; // Global harita değişkeni

// TEMA AYARLARI (Theme Colors)
const FACTION_THEMES = {
    'ballantine-empire': { border: '#c5a059', fill: '#c5a059', glow: '#ffd700' }, // Gold
    'macpherson-clan':   { border: '#7f1d1d', fill: '#991b1b', glow: '#ef4444' }, // Blood Red
    'default':           { border: '#52525b', fill: '#3f3f46', glow: '#d4d4d8' }  // Gray
};

// --- HELPER: GeoJSON Yükleyici ---
async function loadGeoJSON(filePath) {
    try {
        // Not: 'public' klasörü genellikle root'tur. Eğer deploy sonrası 404 alırsanız '/assets/maps/...' deneyin.
        // Geliştirme ortamı için '/assets/maps/...' genelde daha güvenlidir.
        const cleanPath = filePath.replace('/public', ''); 
        
        const response = await fetch(cleanPath);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    } catch (error) {
        console.warn(`Map Layer Error (${filePath}):`, error);
        return null; 
    }
}

// --- HELPER: Taktiksel İkon (Daire ve Dönen Efekt) ---
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

// --- LOGIC: Marker Ekleme ---
const addLocationMarkers = (map, locations) => {
    if (!locations || locations.length === 0) return;

    console.log(`> Deploying ${locations.length} tactical markers...`);

    locations.forEach(location => {
        // Koordinat kontrolü (geopoint)
        const lat = location.location?.lat || location.coordinates?.lat;
        const lng = location.location?.lng || location.coordinates?.lng;

        if (!lat || !lng) return;
        
        // Faksiyon tespiti (Rengi belirlemek için)
        const factionSlug = location.faction?.slug?.current || 'default';
        const themeColor = (FACTION_THEMES[factionSlug] || FACTION_THEMES.default).border;

        const icon = createTacticalIcon(factionSlug, 'fa-crosshairs');
        const marker = L.marker([lat, lng], { icon: icon }).addTo(map);

        // Pop-up HTML (Noir Dossier Style)
        marker.bindPopup(`
            <div class="text-left min-w-[200px] font-sans">
                <h3 class="text-[${themeColor}] font-serif text-lg border-b border-gray-700 pb-1 mb-2 uppercase tracking-wide">
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
            className: 'leaflet-dark-popup' // CSS override gerekirse
        });
    });
};

// --- LOGIC: Bölgeleri (GeoJSON) Ekleme ---
const addFactionTerritories = async (map, factions) => {
    if (!factions) return;

    // GeoJSON dosyalarının yerel yolları (Proje yapınıza göre düzenleyin)
    const factionFileMap = {
        'ballantine-empire': [
            '/assets/maps/united-kingdom-border.geojson',
            '/assets/maps/california-border.geojson',
            '/assets/maps/italy-border.geojson'
        ],
        'macpherson-clan': [
            '/assets/maps/scotland-highlands.geojson' // Eğer dosya yoksa hata verir, konsola bak
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
            fillOpacity: 0.15, // Hafif dolgu
            dashArray: '5, 10', // Kesik çizgiler (Cyberpunk style)
            className: 'tactical-overlay-path' // CSS'de animasyon eklenebilir
        };

        for (const path of filePaths) {
            const data = await loadGeoJSON(path);
            if (data) {
                L.geoJSON(data, { style: geoStyle }).addTo(map);
            }
        }
    }
};

// --- INIT MAIN ---
document.addEventListener('DOMContentLoaded', async () => {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) return;

    try {
        // 1. Leaflet Haritayı Başlat (CartoDB Dark Matter)
        const map = L.map('map', {
            center: [40, -30], // Atlantik Ortası (Default)
            zoom: 3,
            zoomControl: false,
            attributionControl: false
        });
        mapInstance = map;

        // Add Zoom control manuel (Sağ üst)
        L.control.zoom({ position: 'topright' }).addTo(map);

        // Dark Tile Layer
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19
        }).addTo(map);

        // 2. Global Functions (HTML Butonları İçin)
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

        // 3. Sanity Data Fetching
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

        // 4. Layerları Çiz
        await addFactionTerritories(map, factions);
        addLocationMarkers(map, locations);

        // 5. HUD Mouse Takibi
        map.on('mousemove', (e) => {
            const display = document.getElementById('coordinates-display');
            if(display) display.textContent = `LAT: ${e.latlng.lat.toFixed(4)} // LNG: ${e.latlng.lng.toFixed(4)}`;
        });

        // 6. Loader Kaldır
        const loader = document.getElementById('map-loader');
        if(loader) loader.classList.add('opacity-0', 'pointer-events-none');

    } catch (error) {
        console.error("System Failure (Map):", error);
        mapContainer.innerHTML = '<div class="flex h-full items-center justify-center text-red-500 font-mono">UPLINK FAILED: SATELLITE OFFLINE</div>';
    }
});