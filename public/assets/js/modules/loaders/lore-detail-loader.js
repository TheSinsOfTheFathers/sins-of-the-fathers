import { db } from '../firebase-config.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const renderLoreDetails = (lore) => {
    const contentDiv = document.getElementById('lore-detail-content');
    
    document.title = `${lore.title_en} - The Sins of the Fathers`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
        metaDesc.setAttribute('content', lore.summary_en || `An article about ${lore.title_en}.`);
    }

    contentDiv.innerHTML = `
        <article class="lore-detail-article animate-fade-in">
            <h1 class="lore-detail-title">${lore.title_en}</h1>
            <div class="prose prose-invert max-w-none">
                ${lore.content_en}
            </div>
        </article>
    `;
};

export const loadLoreDetails = async () => {
    const contentDiv = document.getElementById('lore-detail-content');
    if (!contentDiv) return;

    const params = new URLSearchParams(window.location.search);
    const loreId = params.get('id');

    if (!loreId) {
        contentDiv.innerHTML = '<p class="text-red-500 text-center">No lore ID provided.</p>';
        return;
    }

    try {
        const docRef = doc(db, "lore", loreId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            renderLoreDetails(docSnap.data());
        } else {
            contentDiv.innerHTML = '<p class="text-red-500 text-center">Lore article not found.</p>';
        }
    } catch (error) {
        console.error("Error fetching lore details: ", error);
        contentDiv.innerHTML = '<p class="text-red-500 text-center">Failed to load lore details.</p>';
    }
};
