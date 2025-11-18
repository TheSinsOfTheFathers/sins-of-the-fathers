import { client, urlFor } from '../../../../../lib/sanityClient.js';
import { toHTML } from 'https://esm.sh/@portabletext/to-html@2.0.13';

const renderLocationDetails = (location) => {
    const container = document.getElementById('location-detail-container');
    if (!container) return;

    document.title = `${location.name} - The Sins of the Fathers`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
        metaDesc.setAttribute('content', location.summary || `Details about ${location.name}.`);
    }

    const imageUrl = urlFor(location.mainImage).width(1200).quality(85).url();
    const descriptionHtml = location.description ? toHTML(location.description) : '';

    container.innerHTML = `
        <article class="animate-fade-in">
            <h1 class="text-5xl lg:text-6xl font-serif text-yellow-500 mb-6 text-center">${location.name}</h1>
            
            <img src="${imageUrl}" alt="Image of ${location.name}" class="w-full h-auto max-h-[500px] object-cover rounded-lg shadow-lg mb-8">
            
            <div class="prose prose-invert max-w-none text-neutral-300 text-lg leading-relaxed">
                ${descriptionHtml}
            </div>
        </article>
    `;
};

export async function loadLocationDetails() {
    const container = document.getElementById('location-detail-container');
    if (!container) return;

    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug');

    if (!slug) {
        container.innerHTML = '<p class="text-center text-red-500">No location specified.</p>';
        return;
    }

    const query = `*[_type == "location" && slug.current == $slug][0]{
        name,
        mainImage,
        summary,
        description
    }`;
    const queryParams = { slug };

    try {
        const location = await client.fetch(query, queryParams);
        if (location) {
            renderLocationDetails(location);
        } else {
            container.innerHTML = '<p class="text-center text-red-500">Location not found.</p>';
        }
    } catch (error) {
        console.error("Error fetching location details:", error);
        container.innerHTML = '<p class="text-center text-red-500">Failed to load location details.</p>';
    }
}