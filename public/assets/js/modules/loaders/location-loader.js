import { client, urlFor } from '../../../../../lib/sanityClient.js';

const createLocationCard = (location) => {
    const imageUrl = location.mainImage
        ? urlFor(location.mainImage).width(500).height(350).quality(80).url()
        : 'https://via.placeholder.com/500x350';

    const cardLink = document.createElement('a');
    cardLink.href = `location-detail.html?slug=${location.slug}`;
    cardLink.className = 'location-card group block bg-neutral-800 rounded-lg overflow-hidden shadow-lg hover:shadow-yellow-500/20 transition-all duration-300 transform hover:-translate-y-1';

    cardLink.innerHTML = `
        <div class="relative overflow-hidden">
            <img src="${imageUrl}" alt="Image of ${location.name}" class="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300">
            <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        </div>
        <div class="p-6">
            <h2 class="text-2xl font-serif text-yellow-500 mb-2">${location.name}</h2>
            <p class="text-neutral-400 text-sm leading-relaxed">${location.summary || ''}</p>
        </div>
    `;
    return cardLink;
};

export async function displayLocations() {
    const mainContent = document.querySelector('main.container');
    if (!mainContent) return;

    const placeholder = mainContent.querySelector('[data-i18n-key="content-placeholder"]');
    const locationsGrid = document.createElement('div');
    locationsGrid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in';

    if (placeholder) {
        placeholder.replaceWith(locationsGrid);
    } else {
        mainContent.appendChild(locationsGrid);
    }

    try {
        const query = `*[_type == "location"]{
            name,
            "slug": slug.current,
            summary,
            mainImage
        }`;
        const locations = await client.fetch(query);

        if (locations.length > 0) {
            locations.forEach(location => {
                const card = createLocationCard(location);
                locationsGrid.appendChild(card);
            });
        } else {
            locationsGrid.innerHTML = '<p class="text-center col-span-full text-neutral-500">No locations have been added yet.</p>';
        }
    } catch (error) {
        console.error("Error fetching locations from Sanity:", error);
        locationsGrid.innerHTML = '<p class="text-center col-span-full text-red-500">Failed to load locations.</p>';
    }
}