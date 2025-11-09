import { db } from '../firebase-config.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const createCharacterCard = (character, id) => {
    const cardLink = document.createElement('a');
    cardLink.href = `character-detail.html?id=${id}`;
    cardLink.className = 'character-card animate-fade-in';

    cardLink.innerHTML = `
        <img src="${character.image_url}" alt="${character.name}">
        <div class="character-card-content">
            <h3 class="character-card-name">${character.name}</h3>
            <p class="character-card-title">"${character.title}"</p>
        </div>
    `;
    return cardLink;
};

export async function displayCharacters() {
    const mainCharactersGallery = document.getElementById('main-characters-gallery');
    const sideCharactersGallery = document.getElementById('side-characters-gallery');

    if (!mainCharactersGallery || !sideCharactersGallery) {
        return;
    }

    try {
        const querySnapshot = await getDocs(collection(db, "characters"));
        querySnapshot.forEach((doc) => {
            const character = doc.data();
            const card = createCharacterCard(character, doc.id);
            if (character.is_main) {
                mainCharactersGallery.appendChild(card);
            } 
            
            else {
                sideCharactersGallery.appendChild(card);
            }
        });
    } 
    
    catch (error) {
        console.error("Error fetching characters: ", error);
        mainCharactersGallery.innerHTML = '<p class="text-red-500">Could not load characters. Please try again later.</p>';
    }
}
