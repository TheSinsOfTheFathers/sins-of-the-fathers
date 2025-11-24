import { client } from '../../lib/sanityClient.js';

let mapInstance = null; // Global harita değişkeni

/**
 * Özel Harita İkonu Üreticisi
 */
const createTacticalIcon = (colorHex = '#c5a059', iconClass = 'fa-map-marker-alt') => {
    // Leaflet L global olmalı (HTML head'den geliyor)
    if (!window.L) return null;

    return L.divIcon({
        className: 'custom-tactical-icon',
        html: `
            <div class='relative flex items-center justify-center w-8 h-8'>
                <!-- Dönen dış halka -->
                <div class="absolute inset-0 rounded-full border border-current opacity-50 animate-spin-slow" style="color:${colorHex}"></div>
                <!-- Merkez ikon -->
                <div class='flex items-center justify-center w-6 h-6 rounded-full bg-opacity-20 backdrop-blur-sm border border-current shadow-[0_0_10px_currentColor]' 
                     style="color:${colorHex}; background-color:${colorHex}20; border-color:${colorHex}">
                    <i class="fas ${iconClass} text-[10px]"></i>
                </div>
            </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16], // Merkez noktası
        popupAnchor: [0, -20]
    });
};

/**
 * Haritayı Başlatma ve Ayarlar
 */
const initLeafletMap = () => {
    if (mapInstance) return mapInstance; // Zaten varsa döndür

    // Harita ayarları
    const map = L.map('map', {
        zoomControl: false,
        attributionControl: false,
        center: [40, -35], // Atlantik ortası (Default)
        zoom: 3
    });

    // Karanlık Katman (Dark Matter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
        maxZoom: 18
    }).addTo(map);

    return map;
};

/**
 * ANA FONKSİYON: Sanity'den Çek ve Haritaya İşle
 */
export async function displayLocations() {
    const mapContainer = document.getElementById('map');
    const loader = document.getElementById('map-loader');

    // Eğer map div'i yoksa (yanlış sayfa) veya Leaflet yüklenmediyse çık
    if (!mapContainer || !window.L) return;

    try {
        // 1. Haritayı Başlat
        mapInstance = initLeafletMap();

        // 2. Global Fonksiyonları Bağla (HTML butonları için)
        // HTML'deki 'onclick="zoomToLocation(...)"' butonları buna erişir.
        window.zoomToLocation = (lat, lng, zoom) => {
            mapInstance.flyTo([lat, lng], zoom, { duration: 2.5 });
            // HUD Güncelleme
            const hudName = document.getElementById('location-name-display');
            if(hudName) {
                hudName.innerText = "SECTOR RELOCATION...";
                hudName.classList.add('text-gold', 'animate-pulse');
                setTimeout(() => {
                    hudName.classList.remove('animate-pulse');
                    hudName.innerText = `COORDS: ${lat.toFixed(2)} / ${lng.toFixed(2)}`;
                }, 2500);
            }
        };
        
        window.resetMap = () => {
            mapInstance.flyTo([40, -35], 3, { duration: 2 });
        };

        console.log("> Scanning for geographic data...");

        // 3. Sanity'den Veri Çek
        // "location" alanı Sanity'de 'geopoint' tipinde olmalı ({lat: 12, lng: 34})
        const query = `*[_type == "location" && defined(location)] {
            name,
            "slug": slug.current,
            location, 
            "factionName": faction->title,
            "factionColor": faction->color.hex,
            securityLevel
        }`;
        
        const locations = await client.fetch(query);

        // 4. Markerları Ekle
        if (locations.length > 0) {
            locations.forEach(loc => {
                const lat = loc.location.lat;
                const lng = loc.location.lng;
                const color = loc.factionColor || '#ffffff';
                const threat = loc.securityLevel || 'Unknown';

                const customIcon = createTacticalIcon(color, 'fa-crosshairs');

                const marker = L.marker([lat, lng], { icon: customIcon }).addTo(mapInstance);

                // Pop-up HTML (Tailwind stilleri geçerli)
                const popupContent = `
                    <div class="text-left min-w-[180px]">
                        <h3 class="text-gold font-serif text-lg border-b border-white/20 pb-1 mb-2 uppercase tracking-wide">${loc.name}</h3>
                        <p class="text-xs text-gray-400 font-mono mb-1">CONTROL: <span style="color:${color}">${loc.factionName || 'None'}</span></p>
                        <p class="text-xs text-gray-400 font-mono mb-3">THREAT: ${threat.toUpperCase()}</p>
                        <a href="location-detail.html?slug=${loc.slug}" class="block text-center bg-white/10 hover:bg-white/20 border border-white/20 py-2 text-xs text-white font-mono uppercase tracking-widest transition-colors">
                            > INSPECT SECTOR
                        </a>
                    </div>
                `;
                
                marker.bindPopup(popupContent, {
                    className: 'custom-popup-theme' // CSS ile stil verilebilir (background opacity vb.)
                });
            });
        } else {
            console.warn("System Warning: No geodata found in archives.");
        }

        // 5. Yükleme Ekranını Kaldır
        if (loader) {
            // Yapay bir gecikme, "uydu bağlantısı" hissi için
            setTimeout(() => {
                loader.classList.add('opacity-0', 'pointer-events-none');
            }, 1000);
        }

        // HUD Fare takibi (Koordinat Göstergesi)
        mapInstance.on('mousemove', (e) => {
            const coordDisplay = document.getElementById('coordinates-display');
            if (coordDisplay) {
                coordDisplay.innerText = `LAT: ${e.latlng.lat.toFixed(4)} // LNG: ${e.latlng.lng.toFixed(4)}`;
            }
        });

    } catch (error) {
        console.error("Map Initialization Failed:", error);
        if(loader) loader.innerHTML = '<p class="text-red-500 font-mono">UPLINK FAILED</p>';
    }
}