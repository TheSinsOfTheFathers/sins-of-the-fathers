import { client } from '/public/assets/js/lib/sanityClient.js';

async function loadGeoJSON(filePath) {
    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Could not load local GeoJSON file: ${filePath}`, error);
        return null; 
    }
}

const addLocationMarkers = (map, locations) => {
    if (!locations || locations.length === 0) return;

    locations.forEach(location => {
        if (!location.coordinates?.lat || !location.coordinates?.lng) {
            console.warn(`'${location.name}' için koordinat verisi eksik veya geçersiz.`);
            return;
        }
        
        const { lat, lng } = location.coordinates;
        const marker = L.marker([lat, lng]).addTo(map);

        marker.bindPopup(`
            <div class="map-popup">
                <h3 class="map-popup-title">${location.name}</h3>
                <p class="map-popup-summary">${location.summary || ''}</p>
                <a href="/public/pages/location-detail.html?slug=${location.slug}" class="map-popup-link">See the details...</a>
            </div>
        `);
    });
};

const addFactionTerritories = async (map, factions) => {
    if (!factions || factions.length === 0) return;

    const factionFileMap = {
        'ballantine-empire': [
            '/public/assets/maps/united-kingdom-border.geojson',
            '/public/assets/maps/california-border.geojson',
            '/public/assets/maps/italy-border.geojson'
        ],
        'macpherson-clan': [
            '/public/assets/maps/scotland-highlands.geojson'
        ]
    };
    
    const factionColors = {
        'ballantine-empire': { border: "#ca8a04", fill: "#eab308" }, 
        'macpherson-clan':   { border: "#2563eb", fill: "#3b82f6" }, 
        'default':           { border: "#6b7280", fill: "#71717a" } 
    };

    const drawOrder = [
        'ballantine-empire', 
        'macpherson-clan'    
    ];

    factions.sort((a, b) => {
        const indexA = drawOrder.indexOf(a.slug);
        const indexB = drawOrder.indexOf(b.slug);

        const priorityA = indexA === -1 ? Infinity : indexA;
        const priorityB = indexB === -1 ? Infinity : indexB;

        return priorityA - priorityB;
    });

    for (const faction of factions) {
        const filePaths = factionFileMap[faction.slug]; 
        
        if (!filePaths || filePaths.length === 0) {
            console.warn(`'${faction.name}' (${faction.slug}) fraksiyonu için harita dosyası tanımlanmamış.`);
            continue;
        }

        const assignedColors = factionColors[faction.slug] || factionColors.default;

        const style = {
            color: faction.mapStyle?.borderColor || assignedColors.border,
            weight: 2,
            fillColor: faction.mapStyle?.fillColor || assignedColors.fill, 
            fillOpacity: faction.mapStyle?.fillOpacity || 0.2,
        };
        
        for (const filePath of filePaths) {
            const geoJsonData = await loadGeoJSON(filePath);
            if (!geoJsonData) continue;

            const geoJsonLayer = L.geoJSON(geoJsonData, { style }).addTo(map);

            geoJsonLayer.bindPopup(`
                <div class="map-popup">
                    <h3 class="map-popup-title" style="color: ${style.color};">${faction.name}</h3>
                    <a href="/public/pages/faction-detail.html?slug=${faction.slug}" class="map-popup-link">See the details...</a>
                </div>
            `);
        }
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) return;

    const map = L.map('map', {
        center: [48, 8], 
        zoom: 4,
        zoomControl: false 
    });
    
    L.control.zoom({ position: 'topright' }).addTo(map);


    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 19
    }).addTo(map);

    const locationsQuery = `*[_type == "location" && defined(coordinates)]{ name, "slug": slug.current, coordinates, summary }`;
    const factionsQuery = `*[_type == "faction" && defined(slug.current)]{ name, "slug": slug.current, mapStyle }`;

    try {
        const [locations, factions] = await Promise.all([
            client.fetch(locationsQuery),
            client.fetch(factionsQuery)
        ]);
        
        await addFactionTerritories(map, factions);

        addLocationMarkers(map, locations);

    } catch (error) {
        console.error("Could not load map data from Sanity:", error);
        mapContainer.innerHTML = '<p class="text-red-500 text-center">An error occurred while loading map data.</p>';
    }
});