import { client } from '../../../../lib/sanityClient.js';

const addLocationMarkers = (map, locations) => {
    console.log("Gelen Konum Verisi:", locations); // DEBUG: Gelen konum verisini kontrol et
    locations.forEach(location => {
        // 'coordinates' alanını kullanıyoruz
        const { lat, lng } = location.coordinates;
        const marker = L.marker([lat, lng]).addTo(map);

        // Tıklandığında açılacak pencere
        marker.bindPopup(`
            <div class="map-popup p-2">
                <h3 class="font-bold text-base mb-1">${location.name}</h3>
                <p class="text-sm mb-2">${location.summary || ''}</p>
                <a href="./location-detail.html?slug=${location.slug}" class="text-yellow-500 hover:underline text-xs">See the details...</a>
            </div>
        `);
    });
};

const addFactionTerritories = (map, factions) => {
    console.log("Gelen Fraksiyon Verisi:", factions);
    factions.forEach(faction => {
        if (!faction.territoryPolygon) return;

        try {
            const geoJsonData = JSON.parse(faction.territoryPolygon);
            const style = {
                color: faction.mapStyle?.borderColor || "#f59e0b",
                weight: 2,
                fillColor: faction.mapStyle?.fillColor || "#eab308", 
                fillOpacity: faction.mapStyle?.fillOpacity || 0.2,
            };

            const geoJsonLayer = L.geoJSON(geoJsonData, { style }).addTo(map);

            geoJsonLayer.bindPopup(`
                <div class="map-popup p-2">
                    <h3 class="font-bold text-base">${faction.name} Faction</h3>
                    <a href="./faction-detail.html?slug=${faction.slug}" class="text-yellow-500 hover:underline text-xs">See the details...</a>
                </div>
            `);
        } catch (error) {
            console.error(`GeoJSON parse hatası (${faction.name}):`, error);
        }
    });
};

document.addEventListener('DOMContentLoaded', async () => {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) return;

    // Haritayı Başlat - Birleşik Krallık merkezli
    const map = L.map('map').setView([55.3781, -3.4360], 5);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
    }).addTo(map);

    const locationsQuery = `*[_type == "location" && defined(coordinates)]{ name, "slug": slug.current, coordinates, summary }`;
    const factionsQuery = `*[_type == "faction"]{ name, "slug": slug.current, territoryPolygon, mapStyle }`;

    try {
        const [locations, factions] = await Promise.all([
            client.fetch(locationsQuery),
            client.fetch(factionsQuery)
        ]);

        addLocationMarkers(map, locations);
        addFactionTerritories(map, factions);

    } catch (error) {
        console.error("Harita verisi Sanity'den çekilemedi:", error);
        mapContainer.innerHTML = '<p class="text-red-500 text-center">Harita verisi yüklenirken bir hata oluştu.</p>';
    }
});