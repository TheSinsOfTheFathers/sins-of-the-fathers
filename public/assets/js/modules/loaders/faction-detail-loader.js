import { client } from '../../../../../lib/sanityClient.js';
import { toHTML } from 'https://esm.sh/@portabletext/to-html@2.0.13';

const renderFactionDetails = (faction) => {
    const contentDiv = document.getElementById('faction-detail-content');
    
    document.title = `${faction.name} - The Sins of the Fathers`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
        metaDesc.setAttribute('content', faction.summary || `Explore the details of the ${faction.name} faction.`);
    }

    const historyHtml = faction.history 
        ? toHTML(faction.history) 
        : '<p>No detailed history available for this faction.</p>';

    contentDiv.innerHTML = `
        <div class="animate-fade-in">
            <h1 class="text-5xl lg:text-6xl font-serif text-yellow-500 mb-4">${faction.name}</h1>
            <p class="text-xl text-neutral-400 italic mb-8">"${faction.motto || ''}"</p>

            <div class="faction-detail-card">
                <div class="faction-meta">
                    <strong>Leader:</strong> <span>${faction.leaderName || 'Unknown'}</span>
                </div>
                <div class="faction-meta">
                    <strong>Philosophy:</strong> <span>${faction.philosophy || 'Not defined'}</span>
                </div>
                <div class="faction-meta">
                    <strong>Economic Domain:</strong> <span>${faction.economy || 'Not defined'}</span>
                </div>
            </div>

            <div class="prose prose-invert max-w-none text-neutral-300 mt-8">
                ${historyHtml}
            </div>
        </div>
    `;
};

export const loadFactionDetails = async () => {
    const contentDiv = document.getElementById('faction-detail-content');
    if (!contentDiv) {
        console.error('Target content element "faction-detail-content" not found.');
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const factionSlug = params.get('slug');

    if (!factionSlug) {
        contentDiv.innerHTML = '<p class="text-red-500 text-center">No faction specified in the URL.</p>';
        return;
    }

    const query = `*[_type == "faction" && slug.current == $slug][0]{
        name,
        motto,
        philosophy,
        economy,
        summary,
        history,
        "leaderName": leader->name 
    }`;
    const queryParams = { slug: factionSlug };

    try {
        const faction = await client.fetch(query, queryParams);

        if (faction) {
            renderFactionDetails(faction);
        } else {
            contentDiv.innerHTML = '<p class="text-red-500 text-center">Faction not found.</p>';
            document.title = 'Faction Not Found - The Sins of the Fathers';
        }
    } catch (error) {
        console.error("Error fetching faction details from Sanity:", error);
        contentDiv.innerHTML = '<p class="text-red-500 text-center">Failed to load faction details. Please try again later.</p>';
    }
};