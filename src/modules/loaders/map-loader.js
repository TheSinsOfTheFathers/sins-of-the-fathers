import { client } from '../../lib/sanityClient.js';
import i18next from '../../lib/i18n.js';
// 👇 SEO İMPORTU
import { injectSchema } from '../../lib/seo.js';

// 👇 1. GSAP IMPORT
import gsap from 'gsap';

let mapInstance = null; 

const FACTION_THEMES = {
    'ballantine-empire': { border: '#c5a059', fill: '#c5a059', glow: '#ffd700' }, 
    'macpherson-clan':   { border: '#7f1d1d', fill: '#991b1b', glow: '#ef4444' }, 
    'default':           { border: '#52525b', fill: '#3f3f46', glow: '#d4d4d8' }  
};

/**
 * Harita Temizleyici (Memory Leak Önleyici)
 * Leaflet instance'ını ve DOM referanslarını temizler.
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
        container.innerHTML = ""; // DOM'u tamamen temizle
        // GSAP stillerini sıfırla
        gsap.set(container, { clearProps: "all" });
    }
};

async function loadGeoJSON(filePath) {
    try {
        // Vite / Public path düzeltmesi
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
    if (!window.L) return null;
    const theme = FACTION_THEMES[factionSlug] || FACTION_THEMES.default;
    const color = theme.border;

    return L.divIcon({
        // GSAP ile seçmek için 'custom-tactical-icon' sınıfını kullanacağız
        className: 'custom-tactical-icon', 
        html: `
            <div class='relative flex items-center justify-center w-8 h-8 group cursor-pointer'>
                <div class="absolute inset-0 rounded-full border border-current opacity-60 animate-spin-slow" style="color:${color}"></div>
                <div class='flex items-center justify-center w-5 h-5 rounded-full bg-obsidian border border-current shadow-[0_0_10px_currentColor]' 
                     style="color:${color}; background-color:rgba(0,0,0,0.7); border-color:${color}">
                    <i class="fas ${iconType} text-[9px]"></i>
                </div>
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

        // Marker oluşturulduğu an GSAP ile gizleyelim (Sonra topluca açacağız)
        const el = marker.getElement();
        if(el) gsap.set(el, { scale: 0, opacity: 0 });

        marker.on('popupopen', function (e) {
            // Popup açıldığında içindeki içeriğe animasyon
            const popupNode = this.getPopup().getElement();
            if(popupNode) {
                const content = popupNode.querySelector('.leaflet-popup-content');
                if(content) {
                    gsap.fromTo(content, {y: 10, opacity: 0}, {y: 0, opacity: 1, duration: 0.3});
                }
            }
        });

        marker.bindPopup(`
            <div class="text-left min-w-[200px] font-sans">
                <h3 style="color:${themeColor}" class="font-serif text-lg border-b border-gray-700 pb-1 mb-2 uppercase tracking-wide">
                    ${location.name}
                </h3>
                <div class="text-xs font-mono text-gray-400 space-y-1 mb-3">
                    <p>${i18next.t('locations.sector')}: <span class="text-white">${factionSlug.split('-')[0].toUpperCase()}</span></p>
                    <p class="line-clamp-2 opacity-80">${location.summary || i18next.t('locations.default_summary')}</p>
                </div>
                <a href="location-detail.html?slug=${location.slug}" 
                   class="block text-center border border-white/20 bg-white/5 hover:bg-white/10 py-2 text-[10px] text-white font-mono uppercase tracking-widest transition-colors">
                    > ${i18next.t('locations.access_terminal')}
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
            className: 'tactical-overlay-path' // SVG Path class
        };

        for (const path of filePaths) {
            const data = await loadGeoJSON(path);
            if (data) {
                // GeoJSON katmanını ekle
                const layer = L.geoJSON(data, { style: geoStyle }).addTo(map);
                
                // GSAP ile SVG Path Animasyonu (Çizgi çizme efekti)
                // Leaflet SVG kullandığı için path elementlerini seçebiliriz
                // Not: Bu işlem biraz ağırdır, sadece masaüstünde yapmak mantıklı olabilir.
                /* layer.eachLayer((l) => {
                    if(l._path) {
                        const length = l._path.getTotalLength();
                        gsap.set(l._path, { strokeDasharray: length, strokeDashoffset: length });
                        gsap.to(l._path, { strokeDashoffset: 0, duration: 2, ease: "power2.inOut" });
                    }
                });
                */
            }
        }
    }
};

/* --------------------------------------------------------------------------
   MAIN EXECUTION (Router Compatible)
   -------------------------------------------------------------------------- */
export async function displayLocations() {
    const mapContainer = document.getElementById('map');
    const loader = document.getElementById('map-loader');

    // Başlangıçta Map Container'ı gizle (FOUC Önleme)
    if(mapContainer) gsap.set(mapContainer, { opacity: 0, scale: 0.95 });

    // SEO SCHEMA
    try {
        const schemaData = {
            "@context": "https://schema.org",
            "@type": "Map",
            "name": "Global Surveillance Map | The Sins of the Fathers",
            "description": "Interactive map showing all faction territories and key locations in the TSOF universe.",
            "url": window.location.href
        };
        injectSchema(schemaData);
    } catch (e) {
        console.warn("Schema Injection Failed:", e);
    }

    if (!mapContainer) return; 
    if (!window.L) {
        console.error("Leaflet Library Missing!");
        if(loader) loader.innerHTML = "<span class='text-red-500'>OFFLINE</span>";
        return;
    }

    try {
        // Haritayı temizle
        destroyMap('map');

        const map = L.map('map', {
            center: [40, -30], 
            zoom: 3,
            zoomControl: false,
            attributionControl: false
        });
        mapInstance = map;

        map.getPane('popupPane').style.zIndex = 800;

        // Zoom kontrolü (Başlangıçta gizli)
        const zoomControl = L.control.zoom({ position: 'topright' }).addTo(map);
        const zoomNode = zoomControl.getContainer();
        if(zoomNode) gsap.set(zoomNode, { autoAlpha: 0, x: 50 });

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19
        }).addTo(map);

        window.zoomToLocation = (lat, lng, zoom) => {
            map.flyTo([lat, lng], zoom, { duration: 2.5 });
            updateHUD(`${i18next.t('locations.hud_coords_locked')}: ${lat} / ${lng}`);
        };
        
        window.resetMap = () => {
            map.flyTo([40, -30], 3, { duration: 2 });
            updateHUD(i18next.t('locations.hud_global_view'));
        };

        function updateHUD(text) {
            const hudDisplay = document.getElementById('location-name-display');
            if(hudDisplay) {
                // Text Scramble Efekti (Küçük)
                const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
                let iterations = 0;
                const interval = setInterval(() => {
                    hudDisplay.textContent = text.split("")
                        .map((letter, index) => {
                            if(index < iterations) return text[index];
                            return chars[Math.floor(Math.random() * chars.length)];
                        }).join("");
                    if(iterations >= text.length) clearInterval(interval);
                    iterations += 1/2; 
                }, 30);
                
                hudDisplay.classList.add('text-gold');
                setTimeout(() => hudDisplay.classList.remove('text-gold'), 1000);
            }
        }

        const locationsQuery = `*[_type == "location"]{ 
            name, "slug": slug.current, location, coordinates, summary, faction->{slug}
        }`;
        
        const factionsQuery = `*[_type == "faction"]{ name, slug }`;

        const [locations, factions] = await Promise.all([
            client.fetch(locationsQuery),
            client.fetch(factionsQuery)
        ]);

        await addFactionTerritories(map, factions);
        addLocationMarkers(map, locations);

        map.on('mousemove', (e) => {
            const display = document.getElementById('coordinates-display');
            if(display) display.textContent = `${i18next.t('locations.hud_lat')}: ${e.latlng.lat.toFixed(4)} // ${i18next.t('locations.hud_lng')}: ${e.latlng.lng.toFixed(4)}`;
        });

        // 👇 2. GSAP MASTER ANIMATION
        // -----------------------------------------------------
        const tl = gsap.timeline();

        // A. Loader'ı Kapat
        if(loader) {
            tl.to(loader, { 
                autoAlpha: 0, 
                duration: 0.5,
                onComplete: () => loader.style.display = 'none' 
            });
        }

        // B. Harita Konteynerini Aç (Zoom Out Efektiyle)
        tl.to(mapContainer, { 
            opacity: 1, 
            scale: 1, 
            duration: 1.5, 
            ease: "power2.inOut" 
        }, "-=0.2");

        // C. Zoom Kontrollerini Getir
        if(zoomNode) {
            tl.to(zoomNode, { autoAlpha: 1, x: 0, duration: 0.5 }, "-=0.5");
        }

        // D. Tüm Markerları Patlat (Stagger Pop)
        // Leaflet markerları DOM'a ekledi, şimdi hepsini seçip anime ediyoruz
        const allMarkers = document.querySelectorAll('.custom-tactical-icon');
        if (allMarkers.length > 0) {
            tl.to(allMarkers, {
                scale: 1,
                opacity: 1,
                duration: 0.6,
                stagger: {
                    amount: 1.5, // Toplam 1.5 saniye içinde hepsi gelecek
                    from: "random" // Rastgele sırayla
                },
                ease: "back.out(2)" // Pop efekti
            }, "-=0.8");
        }

    } catch (error) {
        console.error("System Failure (Map):", error);
        mapContainer.innerHTML = `<div class="flex h-full items-center justify-center text-red-500 font-mono">${i18next.t('locations.error_uplink')}</div>`;
        if(loader) loader.style.display = 'none';
        gsap.to(mapContainer, { opacity: 1 });
    }
}