// 1. Sanity istemcisini import et
import { client } from '../../../../../lib/sanityClient.js';

// Kart oluşturma fonksiyonu Sanity verisine göre güncellendi
const createLoreListItem = (lore) => {
    const cardLink = document.createElement('a');
    // 2. Link artık 'slug' kullanıyor
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
        // 3. Sanity'den veri çekmek için GROQ sorgusu
        const query = `*[_type == "lore"] | order(order asc){
            title_en,
            summary_en,
            "slug": slug.current
        }`;
        
        const loreArticles = await client.fetch(query);
        
        if (loreArticles && loreArticles.length > 0) {
            loreContainer.innerHTML = ''; // Yükleniyor yazısını temizle
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
