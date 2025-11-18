import { client } from '../../lib/sanityClient.js';

const createCharacterCard = (character) => {
    const cardLink = document.createElement('a');
    cardLink.href = `character-detail.html?slug=${character.slug.current}`; 
    cardLink.className = 'character-card animate-fade-in';

    cardLink.innerHTML = `
        <img src="${character.imageUrl || 'https://placehold.co/400x600/1c1c1c/e0e0e0?text=No+Image'}" alt="${character.name}">
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
        const query = '*[_type == "character"]{name, title, slug, "imageUrl": image.asset->url, is_main}';
        const characters = await client.fetch(query);

        if (characters && characters.length > 0) {
            characters.forEach((character) => {
                const card = createCharacterCard(character);
                if (character.is_main) {
                    mainCharactersGallery.appendChild(card);
                } else {
                    sideCharactersGallery.appendChild(card);
                }
            });
        } else {
            mainCharactersGallery.innerHTML = '<p class="text-neutral-400">No characters found.</p>';
        }
    } 
    catch (error) {
        console.error("Error fetching characters: ", error);
        mainCharactersGallery.innerHTML = '<p class="text-red-500">Could not load characters. Please try again later.</p>';
    }
}