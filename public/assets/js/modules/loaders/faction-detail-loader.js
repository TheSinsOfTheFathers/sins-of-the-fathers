import { db } from '../firebase-config.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const renderFactionDetails = (faction) => {
    const contentDiv = document.getElementById('faction-detail-content');
    
    document.title = `${faction.name} - The Sins of the Fathers`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
        metaDesc.setAttribute('content', `Details about the ${faction.name}. ${faction.description || ''}`);
    }

    contentDiv.innerHTML = `
        <div class="animate-fade-in">
            <h1 class="text-5xl lg:text-6xl font-serif text-yellow-500 mb-4">${faction.name}</h1>
            <p class="text-xl text-neutral-400 italic mb-8">"${faction.motto || ''}"</p>

            <div class="faction-detail-card">
                <div class="faction-meta">
                    <strong>Leader:</strong> <span>${faction.leader || 'Unknown'}</span>
                </div>
                <div class="faction-meta">
                    <strong>Philosophy:</strong> <span>${faction.philosophy || 'Not defined'}</span>
                </div>
                <div class="faction-meta">
                    <strong>Economic Domain:</strong> <span>${faction.economy || 'Not defined'}</span>
                </div>
            </div>

            <div class="prose prose-invert max-w-none text-neutral-300 mt-8">
                <p>${faction.description || 'No description available.'}</p>
            </div>
        </div>
    `;
};

export const loadFactionDetails = async () => {
    const contentDiv = document.getElementById('faction-detail-content');
    if (!contentDiv) return;

    const params = new URLSearchParams(window.location.search);
    const factionId = params.get('id');

    if (!factionId) {
        contentDiv.innerHTML = '<p class="text-red-500 text-center">No faction ID provided.</p>';
        return;
    }

    try {
        const docRef = doc(db, "factions", factionId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            renderFactionDetails(docSnap.data());
        } 
        
        else {
            contentDiv.innerHTML = '<p class="text-red-500 text-center">Faction not found.</p>';
        }
    } 
    
    catch (error) {
        console.error("Error fetching faction details: ", error);
        contentDiv.innerHTML = '<p class="text-red-500 text-center">Failed to load faction details.</p>';
    }
};
