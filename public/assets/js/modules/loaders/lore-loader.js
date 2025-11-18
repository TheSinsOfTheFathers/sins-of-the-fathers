import { client } from '/public/assets/js/lib/sanityClient.js';

const createLoreListItem = (lore) => {
    const cardLink = document.createElement('a');
    cardLink.href = `lore-detail.html?slug=${lore.slug}`;
    cardLink.className = 'lore-card group';

    cardLink.innerHTML = `
        <h2 class="lore-card-title">${lore.title_en}</h2>
        <p class="lore-card-summary">${lore.summary_en || ''}</p>
    `;
    return cardLink;
};

export async function displayLoreList() {
    const loreContainer = document.getElementById('lore-list-container');
    if (!loreContainer) return;

    try {
        const query = `*[_type == "lore"] | order(order asc){
            title_en,
            summary_en,
            "slug": slug.current
        }`;
        
        const loreArticles = await client.fetch(query);
        
        if (loreArticles && loreArticles.length > 0) {
            loreContainer.innerHTML = '';
            loreArticles.forEach((lore) => {
                const listItem = createLoreListItem(lore);
                loreContainer.appendChild(listItem);
            });
        } else {
            loreContainer.innerHTML = '<p>No lore articles found.</p>';
        }
    } catch (error) {
        console.error("Error fetching lore list from Sanity: ", error);
        loreContainer.innerHTML = '<p class="text-red-500">Could not load lore articles.</p>';
    }
}
