import { client } from '../../lib/sanityClient.js';

// Bu dosyada, başka bir kütüphaneye (Cytoscape gibi) ihtiyacımız yok.

const renderCharacterDetails = async (character) => {
    const contentDiv = document.getElementById('character-detail-content');
    if (!contentDiv) {
        console.error('Content div not found!');
        return;
    }
    
    // Sayfa başlığını ve meta etiketlerini dinamik olarak güncelle.
    document.title = `${character.name} - The Sins of the Fathers`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
        metaDesc.setAttribute('content', `Details about ${character.name}, ${character.title}. ${character.description || ''}`);
    }

    // İlişkiler (Relationships) HTML'ini oluştur.
    let relationshipsHtml = '';
    if (character.relationships && character.relationships.length > 0) {
        relationshipsHtml = character.relationships.map(rel => `
            <div class="relationship-card">
                <strong class="relationship-name">${rel.name}</strong>
                <span class="relationship-status">${rel.status}</span>
            </div>
        `).join('');
    } else {
        relationshipsHtml = '<p class="text-neutral-400">No known relationships.</p>';
    }

    // Bütün sayfanın ana HTML yapısını oluştur.
    contentDiv.innerHTML = `
        <div class="animate-fade-in">
            <!-- Üst Kısım: Resim ve Temel Bilgiler -->
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
            
            <!-- Alt Kısım: Hikaye, İlişkiler ve Soy Ağacı -->
            <div classs="space-y-12">
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
                    <div class="lg:col-span-2">
                        <h2 class="section-title">Story</h2>
                        <div class="prose prose-invert max-w-none text-neutral-300">
                            <p>${character.story || 'This character\'s story has not yet been written.'}</p>
                        </div>
                    </div>
                    <div class="lg:col-span-1">
                        <h2 class="section-title">Relationships</h2>
                        <div class="space-y-4">
                            ${relationshipsHtml}
                        </div>
                    </div>
                </div>
            </div>

        </div>
    `;

    // --- AİLE AĞACINI OLUŞTURMA VE D3 İLE ÇİZDİRME ---
    const familyContainer = document.getElementById('family-graph') || document.getElementById('family-tree-container') || document.querySelector('.mermaid') || document.querySelector('.family-tree');
    if (familyContainer) {
        // Build nodes & links from available structured data (relationships[] and family[])
        const loadingEl = familyContainer.querySelector && familyContainer.querySelector('.d3-loading');
        const emptyEl = familyContainer.querySelector && familyContainer.querySelector('.d3-empty');
        if (loadingEl) loadingEl.style.display = 'flex';
        const nodesMap = new Map();

        // Helper to add node. Accepts multiple legacy shapes:
        // - populated object: { name, slug, image_url }
        // - reference object: { _ref: '<id>' } or { character: { _ref: '<id>' } }
        // - legacy object: { name: 'Name' }
        const addNode = (obj, isMain = false) => {
            if (!obj) return;
            // normalize when given a simple ref wrapper
            if (typeof obj === 'string') {
                // simple string name
                const id = obj.toLowerCase().replace(/\s+/g, '-');
                if (!nodesMap.has(id)) {
                    nodesMap.set(id, { id, label: obj, slug: null, image: null, isMain: !!isMain, group: '' });
                }
                return;
            }

            // If it's a wrapper { character: { _ref/... } }
            if (obj.character && obj.character._ref) {
                const refId = obj.character._ref;
                if (!nodesMap.has(refId)) {
                    nodesMap.set(refId, { id: refId, label: obj.character.name || refId, slug: obj.character.slug || null, image: obj.character.image_url || null, isMain: !!isMain, group: '' });
                }
                return;
            }

            // If it's a reference object { _ref: 'id' }
            if (obj._ref) {
                const refId = obj._ref;
                if (!nodesMap.has(refId)) {
                    nodesMap.set(refId, { id: refId, label: obj.name || refId, slug: null, image: null, isMain: !!isMain, group: '' });
                }
                return;
            }

            // Otherwise assume populated object
            const id = obj.slug || obj._id || obj.name || obj.Ad || null;
            if (!id) return;
            if (!nodesMap.has(id)) {
                nodesMap.set(id, {
                    id,
                    label: obj.name || obj.Ad || obj.title || id,
                    slug: obj.slug || null,
                    image: obj.image_url || (obj.image && obj.image.asset && obj.image.asset.url) || null,
                    isMain: !!isMain,
                    group: obj.group || ''
                });
            } else if (isMain) {
                nodesMap.get(id).isMain = true;
            }
        };

        // Main character node
        addNode(character, true);

        // Add family refs if present
        if (character.family && Array.isArray(character.family)) {
            character.family.forEach(ref => {
                // family item may be { character: {...}, relation } or populated character or simple ref
                if (!ref) return;
                if (ref.character) {
                    addNode(ref.character, false);
                } else if (ref._ref || ref._id) {
                    addNode(ref, false);
                } else if (ref.name) {
                    addNode(ref.name, false);
                } else {
                    addNode(ref, false);
                }
            });
        }

        // Add relationships (these already include character.{name,slug} in the query)
        if (character.relationships && Array.isArray(character.relationships)) {
            character.relationships.forEach(rel => {
                // New shape: { character: {..}, status }
                if (!rel) return;
                if (rel.character) addNode(rel.character, false);
                else if (rel.name) addNode(rel.name, false); // legacy shape
            });
        }

        // Build links: from main to relationships and family
        const links = [];
        const mainId = character.slug || character._id || character.name || character.Ad || null;

        if (character.relationships && Array.isArray(character.relationships)) {
            character.relationships.forEach(rel => {
                if (!rel) return;
                if (rel.character) {
                    const tgt = rel.character.slug || rel.character._id || rel.character.name || (rel.character._ref || null);
                    if (tgt) links.push({ source: mainId, target: tgt, label: rel.status || '', width: 1.6 });
                } else if (rel.name) {
                    const tgt = rel.name.toLowerCase().replace(/\s+/g, '-');
                    links.push({ source: mainId, target: tgt, label: rel.status || '', width: 1.6 });
                }
            });
        }

        if (character.family && Array.isArray(character.family)) {
            character.family.forEach(ref => {
                if (!ref) return;
                let id = null;
                if (ref.character) {
                    id = ref.character.slug || ref.character._id || ref.character.name || (ref.character._ref || null);
                } else if (ref._ref || ref._id) {
                    id = ref._ref || ref._id;
                } else if (ref.name) {
                    id = ref.slug || ref._id || ref.name.toLowerCase().replace(/\s+/g, '-');
                }
                if (id) links.push({ source: mainId, target: id, label: ref.relation || ref.label || 'family', width: 1.2 });
            });
        }

        const nodes = Array.from(nodesMap.values());

        // determine layout from URL param (layout=tree|force) and optional debug
        const params = new URLSearchParams(window.location.search);
        const layout = params.get('layout') || 'tree';
        const debug = params.get('debug') === '1' || params.get('debug') === 'true';

        // Debug: log nodes and links before rendering when requested
        if (debug) {
            console.groupCollapsed('D3 Family Graph - debug payload');
            console.log('layout:', layout);
            console.log('nodes:', JSON.parse(JSON.stringify(nodes)));
            console.log('links:', JSON.parse(JSON.stringify(links)));
            console.groupEnd();
        }

        // If there are no nodes (only main missing or no relationships), show empty state
        if (!nodes || nodes.length === 0) {
            if (loadingEl) loadingEl.style.display = 'none';
            if (emptyEl) {
                emptyEl.style.display = 'block';
            } else {
                familyContainer.innerHTML = '<p class="text-neutral-400">No family data available.</p>';
            }
            return;
        }

        // Dynamic import our d3 renderer and render
        try {
            const module = await import('./d3-family-tree.js');
            await module.renderFamilyGraph(familyContainer, { nodes, links }, { width: Math.max(600, familyContainer.clientWidth || 800), height: 700, layout });
            if (loadingEl) loadingEl.style.display = 'none';
        } catch (err) {
            console.error('D3 family renderer failed:', err);
            // Fallback: render a minimal text
            if (loadingEl) loadingEl.style.display = 'none';
            if (emptyEl) {
                emptyEl.style.display = 'block';
                emptyEl.innerText = 'Family graph could not be rendered.';
            } else {
                familyContainer.innerHTML = '<p class="text-neutral-400">Family graph could not be rendered.</p>';
            }
        }
    }
};

export const loadCharacterDetails = async () => {
    const contentDiv = document.getElementById('character-detail-content');
    if (!contentDiv) return;

    const params = new URLSearchParams(window.location.search);
    const characterSlug = params.get('slug'); 

    if (!characterSlug) {
        contentDiv.innerHTML = '<p class="text-red-500 text-center">No character slug provided.</p>';
        return;
    }

    try {
        // Sanity'den görsel URL'ini de alacak şekilde sorguyu güncelledim.
        const query = `*[_type == "character" && slug.current == $slug][0]{..., "image_url": image.asset->url, family[]->{name, "slug": slug.current, "image_url": image.asset->url}, relationships[]{..., character->{name, "slug": slug.current, "image_url": image.asset->url}}}`;
        const sanityParams = { slug: characterSlug };

        const character = await client.fetch(query, sanityParams);

        if (character) {
            await renderCharacterDetails(character); 
        } else {
            contentDiv.innerHTML = `<p class="text-red-500 text-center">Character with slug '${characterSlug}' not found.</p>`;
        }
    } 
    catch (error) {
        console.error("Error fetching character details: ", error);
        contentDiv.innerHTML = '<p class="text-red-500 text-center">Failed to load character details.</p>';
    }
};