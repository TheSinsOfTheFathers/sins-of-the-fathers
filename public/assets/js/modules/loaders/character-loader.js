import { client } from '../../../../../lib/sanityClient.js'; // Sanity bağlantı ayarlarımız

// URL'de ID yerine daha okunaklı olan "slug" kullanacağız.
const createCharacterCard = (character) => {
    const cardLink = document.createElement('a');
    // Sanity'den gelen slug verisini kullanıyoruz. '.current' demeyi unutma!
    cardLink.href = `character-detail.html?slug=${character.slug.current}`; 
    cardLink.className = 'character-card animate-fade-in';

    // Sanity'den gelen görsel URL'sini kullanmak için imageUrlBuilder gibi bir helper kullanabilirsin,
    // ama şimdilik doğrudan URL'i varsayalım (veya Sanity'den gelen ham URL'i kullanalım).
    // Cloudinary entegrasyonun burada parlayacak.
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
        // Sanity.io'dan bütün karakterleri çeken GROQ sorgusu
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