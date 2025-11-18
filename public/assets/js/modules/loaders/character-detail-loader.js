import { client } from '../../../../../lib/sanityClient.js';

let familyTree;

const renderCharacterDetails = (character, familyData) => {
    console.log('Rendering character details:', character);
    console.log('Family data:', familyData);
    
    const contentDiv = document.getElementById('character-detail-content');
    if (!contentDiv) {
        console.error('Content div not found!');
        return;
    }
    
    // Update page title and meta description
    document.title = `${character.name} - The Sins of the Fathers`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
        metaDesc.setAttribute('content', `Details about ${character.name}, ${character.title}. ${character.description || ''}`);
    }

    // Build relationships HTML
    let relationshipsHtml = '';
    if (character.relationships && character.relationships.length > 0) {
        relationshipsHtml = character.relationships.map(rel => `
            <div class="relationship-card">
                <strong class="relationship-name">${rel.name}</strong>
                <span class="relationship-status">${rel.status}</span>
            </div>
        `).join('');
    } 
    
    else {
        relationshipsHtml = '<p class="text-neutral-400">No known relationships.</p>';
    }

    // Final HTML structure
    contentDiv.innerHTML = `
        <div class="animate-fade-in">
            <!-- Top Section: Image and Core Info -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 items-start mb-12">
                <div class="md:col-span-1">
                    <img src="${character.image_url || 'https://placehold.co/600x400/1c1c1c/e0e0e0?text=No+Image'}" alt="${character.name}" class="w-full h-auto rounded-lg shadow-lg object-cover">
                </div>
                <div class="md:col-span-2">
                    <h1 class="text-5xl lg:text-6xl font-serif text-yellow-500 mb-2">${character.name}</h1>
                    <p class="text-xl text-neutral-400 italic mb-6">"${character.title}"</p>
                    <div class="prose prose-invert max-w-none text-neutral-300">
                        <p>${character.description || 'No description available.'}</p>
                    </div>
                </div>
            </div>
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
                <div class="lg:col-span-2">
                    <h2 class="section-title" data-i18n-key="character-story-title">Story</h2>
                    <div class="prose prose-invert max-w-none text-neutral-300">
                        <p>${character.story || 'This character\'s story has not yet been written.'}</p>
                    </div>
                </div>
                <div class="lg:col-span-1">
                    <h2 class="section-title" data-i18n-key="character-relationships-title">Relationships</h2>
                    <div class="space-y-4">
                        ${relationshipsHtml}
                    </div>
                </div>
            </div>
        </div>
    `;
};

export const loadCharacterDetails = async () => {
    const contentDiv = document.getElementById('character-detail-content');
    if (!contentDiv) return;

    const params = new URLSearchParams(window.location.search);
    // Sanity'deki slug'lar genellikle tire (-) ile ayrılır. 
    // URL'den 'id' yerine 'slug' almamız daha doğru olur.
    // Örnek: character-detail.html?slug=ruaraidh-ballantine
    const characterSlug = params.get('slug'); 

    if (!characterSlug) {
        contentDiv.innerHTML = '<p class="text-red-500 text-center">No character slug provided.</p>';
        return;
    }

    try {
        // Sanity.io'dan doğru karakteri slug'ına göre çeken GROQ sorgusu
        const query = `*[_type == "character" && slug.current == $slug][0]`;
        const sanityParams = { slug: characterSlug };

        const character = await client.fetch(query, sanityParams);

        console.log('Fetched character data:', character); // Gelen veriyi kontrol etmek için

        if (character) {
            // Şimdilik familyData'yı devre dışı bırakıyoruz, render fonksiyonu sadece karakteri alsın.
            renderCharacterDetails(character); 
        } else {
            contentDiv.innerHTML = `<p class="text-red-500 text-center">Character with slug '${characterSlug}' not found.</p>`;
        }
    } 
    catch (error) {
        console.error("Error fetching character details: ", error);
        contentDiv.innerHTML = '<p class="text-red-500 text-center">Failed to load character details.</p>';
    }
};