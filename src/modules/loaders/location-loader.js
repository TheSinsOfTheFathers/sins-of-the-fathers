import { client } from '../../lib/sanityClient.js';
import i18next from '../../lib/i18n.js';
import { injectSchema } from '../../lib/seo.js';

// 👇 1. GSAP IMPORT
import gsap from 'gsap';

let mapInstance = null;

const FACTION_THEMES = {
    'ballantine-empire': { border: '#c5a059', fill: '#c5a059' },
    'macpherson-clan': { border: '#7f1d1d', fill: '#991b1b' },
    'default': { border: '#555555', fill: '#777777' }
};

/**
 * Harita Temizleyici (Anti-Initialized Error)
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
        // GSAP ile temizlerken kalan stilleri sıfırla
        gsap.set(container, { clearProps: "all" });
    }
};

/**
 * Taktiksel Marker İkonu Oluşturucu
 */
const createTacticalIcon = (slug) => {
    if (!window.L) return null;
    const color = (FACTION_THEMES[slug] || FACTION_THEMES.default).border;

    return L.divIcon({
        className: 'tactical-pin', // GSAP ile bunu seçeceğiz
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
        const cleanPath = path.replace('/public', '');

        const res = await fetch(cleanPath);
        if (!res.ok) throw new Error(`404 Not Found: ${cleanPath}`);
        const data = await res.json();

        const layer = L.geoJSON(data, {
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
        console.warn(`[Map Layer Missing] ${path}`, e);
    }
}

export async function displayLocations() {
    const mapContainer = document.getElementById('map');
    const loader = document.getElementById('map-loader');

    // Başlangıçta haritayı gizle (FOUC önleme)
    if (mapContainer) gsap.set(mapContainer, { opacity: 0, scale: 0.98 });

    // SEO Schema
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
        if (loader) loader.innerHTML = "<span class='text-red-500'>OFFLINE</span>";
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

        // Zoom kontrolünü ekle ama henüz gösterme (Animation için)
        const zoomControl = L.control.zoom({ position: 'bottomright' }).addTo(map);
        const zoomContainer = zoomControl.getContainer();
        if (zoomContainer) gsap.set(zoomContainer, { autoAlpha: 0, x: 50 });

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 18
        }).addTo(map);

        // Global Helper Functions
        window.zoomToLocation = (lat, lng, z) => {
            map.flyTo([lat, lng], z, { duration: 2.0 });
            const display = document.getElementById('location-name-display');
            if (display) display.textContent = i18next.t('location_loader.sector_info', { lat: lat.toFixed(4), lng: lng.toFixed(4) });
        };
        window.resetMap = () => {
            map.flyTo([40, -30], 3, { duration: 1.5 });
            const display = document.getElementById('location-name-display');
            if (display) display.textContent = i18next.t('location_loader.global_orbit');
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

        // GeoJSON Layerlarını yükle
        // Not: Bunlar asenkron yüklenir, harita açıldıktan sonra gelirler.
        for (const [slug, files] of Object.entries(factionsData)) {
            const theme = FACTION_THEMES[slug] || FACTION_THEMES.default;
            for (const file of files) {
                // Vite'da public klasörü root kabul edilir, o yüzden path'i düzelttik
                await loadLayer(map, `/assets/maps/${file}`, theme);
            }
        }

        const query = `*[_type == "location" && defined(location)] { 
            name, "slug": slug.current, location, faction->{slug}, summary 
        }`;

        const locations = await client.fetch(query);
        console.log(`> Found ${locations.length} locations.`);

        const markerElements = []; // Animasyon için marker DOM elementlerini toplayacağız

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
                        <p class="text-[10px] text-gray-400 mb-2 line-clamp-2">${loc.summary || i18next.t('location_loader.no_intel')}</p>
                        <a href="location-detail.html?slug=${loc.slug}" class="block text-center bg-white/10 py-1 text-[9px] hover:bg-gold hover:text-black uppercase transition">
                            ${i18next.t('location_loader.inspect_button')}
                        </a>
                    </div>
                `, { className: 'custom-popup-theme' });

                // Leaflet marker elementini al (DOM elementi)
                const el = marker.getElement();
                if (el) {
                    markerElements.push(el);
                    // Başlangıçta gizle (Stagger ile getireceğiz)
                    gsap.set(el, { scale: 0, opacity: 0 });
                }
            });
        }

        // Mouse Move Event
        map.on('mousemove', (e) => {
            const el = document.getElementById('coordinates-display');
            if (el) el.textContent = `${e.latlng.lat.toFixed(4)} | ${e.latlng.lng.toFixed(4)}`;
        });

        // 👇 2. GSAP MASTER TIMELINE
        // -----------------------------------------------------
        const tl = gsap.timeline();

        // A. Loader'ı Kapat
        if (loader) {
            tl.to(loader, {
                autoAlpha: 0,
                duration: 0.5,
                onComplete: () => loader.style.display = 'none' // Tamamen kaldır
            });
        }

        // B. Harita Konteynerini Aç (Zoom-out efekti ile)
        tl.to(mapContainer, {
            opacity: 1,
            scale: 1,
            duration: 1.2,
            ease: "power2.inOut"
        }, "-=0.2");

        // C. Zoom Kontrollerini Kaydırarak Getir
        if (zoomContainer) {
            tl.to(zoomContainer, { autoAlpha: 1, x: 0, duration: 0.5 }, "-=0.5");
        }

        // D. Markerları "Pop" diye patlat (Stagger)
        if (markerElements.length > 0) {
            tl.to(markerElements, {
                scale: 1,
                opacity: 1,
                duration: 0.6,
                stagger: {
                    amount: 1.5, // Toplam 1.5 saniye içinde hepsi gelecek (rastgelelik hissi verir)
                    from: "random" // Rastgele sırayla gelsin, daha organik durur
                },
                ease: "back.out(2)" // Hafif yaylanma efekti (pop)
            }, "-=0.5");
        }

    } catch (err) {
        console.error("Map Critical Error:", err);
        if (mapContainer) mapContainer.innerHTML = '<p class="text-center text-red-500 mt-10">MAP SYSTEM FAILURE</p>';
        if (loader) loader.style.display = 'none';
        // Hata olsa bile container'ı göster
        gsap.to(mapContainer, { opacity: 1 });
    }
}