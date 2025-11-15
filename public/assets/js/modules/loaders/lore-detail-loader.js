// 1. Firebase yerine Sanity istemcisini ve Portable Text çeviricisini import et
import { client } from '../../../../../lib/sanityClient.js';
import { toHTML } from 'https://esm.sh/@portabletext/to-html@2.0.13';

const renderLoreDetails = (lore) => {
    const contentDiv = document.getElementById('lore-detail-content');
    
    document.title = `${lore.title_en} - The Sins of the Fathers`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
        metaDesc.setAttribute('content', lore.summary_en || `An article about ${lore.title_en}.`);
    }

    // 2. Portable Text içeriğini HTML'e çevir
    const contentHtml = lore.content_en 
        ? toHTML(lore.content_en) 
        : '<p>Content for this article is not available yet.</p>';

    contentDiv.innerHTML = `
        <article class="lore-detail-article animate-fade-in">
            <h1 class="lore-detail-title">${lore.title_en}</h1>
            <div class="prose prose-invert max-w-none">
                ${contentHtml}
            </div>
        </article>
    `;
};

export const loadLoreDetails = async () => {
    const contentDiv = document.getElementById('lore-detail-content');
    if (!contentDiv) return;

    const params = new URLSearchParams(window.location.search);
    // 3. ID yerine 'slug' kullan
    const loreSlug = params.get('slug');

    if (!loreSlug) {
        contentDiv.innerHTML = '<p class="text-red-500 text-center">No lore article specified.</p>';
        return;
    }

    try {
        // 4. 'slug'a göre veri çekmek için GROQ sorgusu
        const query = `*[_type == "lore" && slug.current == $slug][0]{
            title_en,
            summary_en,
            content_en
        }`;
        const queryParams = { slug: loreSlug };

        const lore = await client.fetch(query, queryParams);

        if (lore) {
            renderLoreDetails(lore);
        } else {
            contentDiv.innerHTML = '<p class="text-red-500 text-center">Lore article not found.</p>';
            document.title = 'Article Not Found - The Sins of the Fathers';
        }
    } catch (error) {
        console.error("Error fetching lore details from Sanity: ", error);
        contentDiv.innerHTML = '<p class="text-red-500 text-center">Failed to load lore details.</p>';
    }
};
