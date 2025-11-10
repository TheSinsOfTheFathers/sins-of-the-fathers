// modules/loaders/character-loader.js

// 1. Firebase yerine Sanity istemcisini (client) import ediyoruz.
//    Bu dosya yolunun projenizin yapısına göre doğru olduğundan emin olun.
import { client } from '../../../../../lib/sanityClient.js';

// URL'lerde ID yerine daha okunaklı olan "slug" kullanmak en iyi pratiktir.
const createCharacterCard = (character) => {
    const cardLink = document.createElement('a');
    // 2. URL'i artık karakterin slug'ı ile oluşturuyoruz.
    cardLink.href = `character-detail.html?slug=${character.slug}`;
    cardLink.className = 'character-card animate-fade-in';

    // 3. character.image_url artık doğrudan geliyor.
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
        // 4. Firestore sorgusu yerine Sanity'nin sorgu dili olan GROQ'u kullanıyoruz.
        // Bu sorgu, bize sadece ihtiyacımız olan alanları, istediğimiz isimlerle getirir.
        const query = `*[_type == "character"]{
            name,
            title,
            is_main,
            "slug": slug.current,
            "image_url": image.asset->url
        }`;
        
        // 5. Sanity client'ı kullanarak veriyi çekiyoruz.
        const characters = await client.fetch(query);

        // 6. Dönen 'characters' dizisini işliyoruz. Artık doc.data() ve doc.id yok.
        characters.forEach((character) => {
            const card = createCharacterCard(character);
            if (character.is_main) {
                mainCharactersGallery.appendChild(card);
            } else {
                sideCharactersGallery.appendChild(card);
            }
        });
    } catch (error) {
        console.error("Error fetching characters from Sanity: ", error);
        mainCharactersGallery.innerHTML = '<p class="text-red-500">Could not load characters. Please try again later.</p>';
    }
}