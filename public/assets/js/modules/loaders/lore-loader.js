import { db } from '../firebase-config.js';
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const createLoreListItem = (lore, id) => {
    const cardLink = document.createElement('a');
    cardLink.href = `lore-detail.html?id=${id}`;
    cardLink.className = 'lore-card group'; // Use a new class for styling

    cardLink.innerHTML = `
        <h2 class="lore-card-title">${lore.title_en}</h2>
        <p class="lore-card-summary">${lore.summary_en}</p>
    `;
    return cardLink;
};

export async function displayLoreList() {
    const loreContainer = document.getElementById('lore-list-container');
    if (!loreContainer) return;

    try {
        const q = query(collection(db, "lore"), orderBy("order"));
        const querySnapshot = await getDocs(q);
        
        loreContainer.innerHTML = ''; // Clear placeholder
        querySnapshot.forEach((doc) => {
            const lore = doc.data();
            const listItem = createLoreListItem(lore, doc.id);
            loreContainer.appendChild(listItem);
        });
    } catch (error) {
        console.error("Error fetching lore list: ", error);
        loreContainer.innerHTML = '<p class="text-red-500">Could not load lore articles.</p>';
    }
}
