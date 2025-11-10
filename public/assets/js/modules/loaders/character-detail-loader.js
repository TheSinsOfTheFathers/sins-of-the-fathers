// modules/loaders/character-detail-loader.js

import { client } from '../../../../../lib/sanityClient.js';
import { FamilyTree } from '../ui/family-tree.js';

// Sanity'den gelen zengin metin (block content) verisini HTML'e çeviren basit bir yardımcı fonksiyon
function blocksToHtml(blocks) {
    if (!blocks) return '';
    return blocks.map(block => {
        if (block._type === 'block' && block.children) {
            const childrenHtml = block.children.map(child => {
                let text = child.text;
                if (child.marks && child.marks.includes('strong')) text = `<strong>${text}</strong>`;
                if (child.marks && child.marks.includes('em')) text = `<em>${text}</em>`;
                return text;
            }).join('');
            return `<p>${childrenHtml}</p>`;
        }
        return '';
    }).join('');
}

let familyTree;

const renderCharacterDetails = (character) => {
    const contentDiv = document.getElementById('character-detail-content');
    if (!contentDiv) return;

    // Sayfa başlığını ve meta etiketlerini güncelle
    document.title = `${character.name} - The Sins of the Fathers`;
    document.querySelector('meta[name="description"]')?.setAttribute('content', `Details about ${character.name}, ${character.title}. ${character.description || ''}`);

    const relationshipsHtml = character.relationships?.map(rel => `
        <div class="relationship-card">
            <strong class="relationship-name">${rel.name}</strong>
            <span class="relationship-status">${rel.status}</span>
        </div>
    `).join('') || '<p class="text-neutral-400">No known relationships.</p>';

    // Zengin metin alanlarını HTML'e çevir
    const storyHtml = blocksToHtml(character.story);

    contentDiv.innerHTML = `
        <div class="animate-fade-in">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 items-start mb-12">
                <div class="md:col-span-1">
                    <img src="${character.image_url}" alt="${character.name}" class="w-full h-auto rounded-lg shadow-lg object-cover">
                </div>
                <div class="md:col-span-2">
                    <h1 class="text-5xl lg:text-6xl font-serif text-yellow-500 mb-2">${character.name}</h1>
                    <p class="text-xl text-neutral-400 italic mb-6">"${character.title}"</p>
                    <div class="prose prose-invert max-w-none text-neutral-300">
                        <p>${character.description || 'No description available.'}</p>
                    </div>
                </div>
            </div>
            <div class="mb-12">
                <h2 class="section-title">Family Tree</h2>
                <div id="family-tree" class="w-full h-[600px] bg-neutral-950/50 rounded-lg border border-neutral-800 overflow-hidden"></div>
            </div>
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
                <div class="lg:col-span-2">
                    <h2 class="section-title">Story</h2>
                    <div class="prose prose-invert max-w-none text-neutral-300">${storyHtml || "<p>This character's story has not yet been written.</p>"}</div>
                </div>
                <div class="lg:col-span-1">
                    <h2 class="section-title">Relationships</h2>
                    <div class="space-y-4">${relationshipsHtml}</div>
                </div>
            </div>
        </div>
    `;

    // Aile ağacını render et
    const familyData = buildFamilyTreeData(character);
    const container = document.getElementById('family-tree');
    if (container && familyData.nodes.length > 0) {
        if (!familyTree) familyTree = new FamilyTree(container);
        familyTree.update(familyData);
    }
};

// Sanity'den gelen veri yapısına göre aile ağacı verisini oluşturan yeni fonksiyon
function buildFamilyTreeData(character) {
    const familyData = { nodes: [], links: [] };
    const processedIds = new Set();

    // Ana karakteri ekle
    familyData.nodes.push({
        id: character._id,
        name: character.name,
        image: character.image_url,
        description: character.description
    });
    processedIds.add(character._id);

    // Ana karakterin aile üyelerini işle
    if (character.family) {
        character.family.forEach(relation => {
            const relatedChar = relation.character;
            if (!relatedChar) return;

            // Eğer aile üyesi daha önce eklenmediyse, node listesine ekle
            if (!processedIds.has(relatedChar._id)) {
                familyData.nodes.push({
                    id: relatedChar._id,
                    name: relatedChar.name,
                    image: relatedChar.image_url,
                    description: relatedChar.description
                });
                processedIds.add(relatedChar._id);
            }

            // Bağlantıyı oluştur
            familyData.links.push({
                source: character._id,
                target: relatedChar._id,
                type: relation.relation
            });
        });
    }

    return familyData;
}

export const loadCharacterDetails = async () => {
    const contentDiv = document.getElementById('character-detail-content');
    if (!contentDiv) return;

    const params = new URLSearchParams(window.location.search);
    const characterSlug = params.get('slug'); // ID yerine SLUG kullanıyoruz

    if (!characterSlug) {
        contentDiv.innerHTML = '<p class="text-red-500 text-center">No character specified.</p>';
        return;
    }

    try {
        // Tek bir karakteri ve onunla ilişkili AİLE üyelerini TEK BİR SORGUDAs getiren güçlü GROQ sorgusu
        const query = `*[_type == "character" && slug.current == $slug][0]{
            _id,
            name,
            title,
            description,
            story,
            relationships,
            "image_url": image.asset->url,
            "family": family[]{
                relation,
                character->{
                    _id,
                    name,
                    description,
                    "image_url": image.asset->url
                }
            }
        }`;
        const params = { slug: characterSlug };

        const character = await client.fetch(query, params);

        if (character) {
            renderCharacterDetails(character);
        } else {
            contentDiv.innerHTML = `<p class="text-red-500 text-center">Character not found.</p>`;
        }
    } catch (error) {
        console.error("Error fetching character details from Sanity: ", error);
        contentDiv.innerHTML = '<p class="text-red-500 text-center">Failed to load character details.</p>';
    }
};