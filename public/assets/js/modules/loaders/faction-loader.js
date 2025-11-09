import { db } from '../firebase-config.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const createFactionCard = (faction, id) => {
    const cardLink = document.createElement('a');
    cardLink.href = `faction-detail.html?id=${id}`;
    cardLink.className = 'faction-card group'; // Added 'group' for hover effects

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
        const querySnapshot = await getDocs(collection(db, "factions"));
        factionsGrid.innerHTML = ''; // Clear existing static content
        querySnapshot.forEach((doc) => {
            const faction = doc.data();
            const card = createFactionCard(faction, doc.id);
            factionsGrid.appendChild(card);
        });
    } catch (error) {
        console.error("Error fetching factions: ", error);
        factionsGrid.innerHTML = '<p class="text-red-500">Could not load factions. Please try again later.</p>';
    }
}
