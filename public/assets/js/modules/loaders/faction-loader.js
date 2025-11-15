import { client } from '../../../../../lib/sanityClient.js';

const createFactionCard = (faction) => {
    // URL'yi slug ile oluşturmak SEO için daha iyidir.
    const cardLink = document.createElement('a');
    cardLink.href = `faction-detail.html?slug=${faction.slug}`; // ID yerine slug kullanıyoruz
    cardLink.className = 'faction-card group';

    cardLink.innerHTML = `
        <div class="faction-card-header">
            <h2 class="faction-title">${faction.name}</h2>
        </div>
        <div class="faction-card-body">
            <div class="faction-meta">
                <strong>Leader:</strong>
                <span>${faction.leader || 'Unknown'}</span>
            </div>
            <div class="faction-meta">
                <strong>Philosophy:</strong>
                <span>${faction.philosophy || 'Not defined'}</span>
            </div>
            <p class="faction-description">${faction.summary || ''}</p>
        </div>
    `;
    return cardLink;
};

export async function displayFactions() {
    const factionsGrid = document.getElementById('factions-grid');
    if (!factionsGrid) return;

    try {
        // Firestore sorgusu yerine GROQ sorgusu
        const query = '*[_type == "faction"]{ name, "slug": slug.current, leader, philosophy, summary }';
        const factions = await client.fetch(query);

        factionsGrid.innerHTML = ''; // Temizle
        factions.forEach((faction) => {
            const card = createFactionCard(faction);
            factionsGrid.appendChild(card);
        });
    } catch (error) {
        console.error("Error fetching factions from Sanity: ", error);
        factionsGrid.innerHTML = '<p class="text-red-500">Could not load factions.</p>';
    }
}