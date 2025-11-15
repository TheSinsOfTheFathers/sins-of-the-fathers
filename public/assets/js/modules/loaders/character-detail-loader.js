<<<<<<< Updated upstream
import { db } from '../firebase-config.js';
import { doc, getDoc, collection, query, getDocs, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { FamilyTree } from '../ui/family-tree.js';
=======
// modules/loaders/character-detail-loader.js

import { client } from '../../../../../lib/sanityClient.js';
>>>>>>> Stashed changes

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
<<<<<<< Updated upstream

            <!-- Family Tree Section -->
            <div class="mb-12">
                <h2 class="section-title" data-i18n-key="character-family-tree-title">Family Tree</h2>
                <div id="family-tree" class="w-full h-[600px] bg-neutral-950/50 rounded-lg border border-neutral-800 overflow-hidden">
                    <!-- Family tree will be rendered here -->
                </div>
            </div>

            <!-- Bottom Section: Story and Relationships -->
=======
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream

    // Initialize family tree after content is rendered
    if (familyData) {
        const container = document.getElementById('family-tree');
        if (container && !familyTree) {
            familyTree = new FamilyTree(container);
        }
        if (familyTree) {
            familyTree.update(familyData);
        }
    }
};

const fetchFamilyData = async (character, allCharacters) => {
    console.log('Building family data for:', character.name);
    
    const familyData = {
        nodes: [],
        links: []
    };
    const processedIds = new Set();

    // Özyineli (recursive) fonksiyon: Bir karakteri ve ailesini işler
    const processCharacter = (charId) => {
        if (!charId || processedIds.has(charId)) {
            return;
        }
        processedIds.add(charId);

        const charData = allCharacters[charId];
        if (!charData) {
            console.warn(`Data for character ID '${charId}' not found.`);
            return;
        }

        // Karakteri düğüm listesine ekle
        familyData.nodes.push({
            id: charId,
            name: charData.name || 'Unknown',
            image: charData.image_url, // Placeholder mantığı tree.js içinde
            description: charData.description
        });

        // Aile ilişkilerini işle ve bağlantıları oluştur
        if (charData.family) {
            for (const [relatedId, relation] of Object.entries(charData.family)) {
                const relationType = typeof relation === 'object' ? relation.type : relation;
                
                // Bağlantıyı ekle
                familyData.links.push({
                    source: charId,
                    target: relatedId,
                    type: relationType
                });
                
                // İlişkili karakteri de işle
                processCharacter(relatedId);
            }
        }
    };

    // Ana karakterden başlayarak tüm ağacı işle
    processCharacter(character.id);

    console.log('Final family data for tree:', familyData);
    return familyData;
};

=======
};

>>>>>>> Stashed changes
export const loadCharacterDetails = async () => {
    const contentDiv = document.getElementById('character-detail-content');
    if (!contentDiv) return;

    const params = new URLSearchParams(window.location.search);
    // URL'den gelen ID'yi alırken alt çizgileri tireye çeviriyoruz, veritabanı ile tutarlı olması için
    const characterId = params.get('id').replace(/_/g, '-');

    if (!characterId) {
        contentDiv.innerHTML = '<p class="text-red-500 text-center">No character ID provided.</p>';
        return;
    }

    try {
        // Veri yapınıza göre, tüm karakterler 'family' koleksiyonundaki 'characters' belgesinde
        const docRef = doc(db, "family", "characters");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const allCharacters = docSnap.data();
            const characterData = allCharacters[characterId];

            if (characterData) {
                const character = { ...characterData, id: characterId };
                
                console.log("Character data from Firestore:", character);
                
                // Aile ağacı verilerini oluşturmak için tüm karakter verilerini gönderiyoruz
                const familyData = await fetchFamilyData(character, allCharacters);
                renderCharacterDetails(character, familyData);
            } else {
                contentDiv.innerHTML = `<p class="text-red-500 text-center">Character with ID '${characterId}' not found in the database.</p>`;
            }
<<<<<<< Updated upstream
        } 
        
        else {
            contentDiv.innerHTML = '<p class="text-red-500 text-center">Could not find the main "characters" document in the "family" collection.</p>';
=======
        }`;
        const params = { slug: characterSlug };

        const character = await client.fetch(query, params);

        console.log('Fetched character data:', character); // Gelen veriyi kontrol etmek için

        if (character) {
            renderCharacterDetails(character);
        } else {
            contentDiv.innerHTML = `<p class="text-red-500 text-center">Character not found.</p>`;
>>>>>>> Stashed changes
        }
    } 
    
    catch (error) {
        console.error("Error fetching character details: ", error);
        contentDiv.innerHTML = '<p class="text-red-500 text-center">Failed to load character details.</p>';
    }
};