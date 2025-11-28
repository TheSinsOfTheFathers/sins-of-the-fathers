import { client } from '../../lib/sanityClient.js';
import { applyBlurToStaticImage } from '../../lib/imageUtils.js';
import i18next from '../../lib/i18n.js'; // Dil desteği için import

/**
 * KARAKTER DETAYLARINI GÖRSELLEŞTİRİR
 * HTML Sayfasındaki ID'lere Sanity verilerini enjekte eder.
 */
const renderCharacterDetails = async (character) => {
    const els = {
        loader: document.getElementById('file-loader'),
        dossier: document.getElementById('character-dossier'),
        image: document.getElementById('char-image'), 
        statusBadge: document.getElementById('char-status'),
        name: document.getElementById('char-name'),
        alias: document.getElementById('char-alias'),
        faction: document.getElementById('char-faction'),
        location: document.getElementById('char-location'),
        role: document.getElementById('char-role'),
        bio: document.getElementById('char-bio'),
        quote: document.getElementById('char-quote'),
        title: document.title
    };

    if (!els.name) { console.error("ERROR: Dossier layout corrupted. Missing DOM elements."); return; }

    /* ------------------------------------------------------
       1. META DATA ENJEKSİYONU
    ------------------------------------------------------ */
    
    // GÖRSEL GÜNCELLEMESİ
    const imgUrl = character.image?.url || 'https://placehold.co/600x800/000000/333333?text=NO+IMAGE';
    const blurHash = character.image?.blurHash;

    if (els.image) {
        if (!character.image?.url) {
            els.image.src = imgUrl;
        } else {
            applyBlurToStaticImage('char-image', imgUrl, blurHash);
        }
    }

    // STATUS GÜNCELLEMESİ (Çevirili)
    if (els.statusBadge) {
        const rawStatus = character.status || 'Active';
        // status_active, status_deceased gibi key'ler oluşturacağız
        const statusKey = `character_detail_page.status_${rawStatus.toLowerCase()}`;
        // Çeviri varsa kullan, yoksa veritabanındakini bas
        els.statusBadge.textContent = i18next.exists(statusKey) ? i18next.t(statusKey) : rawStatus;
        
        els.statusBadge.className = 'font-mono text-xs uppercase font-bold tracking-widest animate-pulse ' + 
            (rawStatus.toLowerCase() === 'deceased' || rawStatus.toLowerCase() === 'kia' ? 'text-red-600' : 'text-green-500');
    }

    els.name.textContent = character.name;
    if(character.alias) els.alias.textContent = `"${character.alias}"`;
    
    // Sayfa Başlığını Çevir
    document.title = `${character.name} // ${i18next.t('character_detail_page.doc_title_suffix')}`;

    if(els.faction) els.faction.textContent = character.faction?.title || i18next.t('character_detail_page.unknown');
    if(els.location) els.location.textContent = character.origin || (character.faction ? i18next.t('character_detail_page.affiliated_territory') : i18next.t('character_detail_page.unknown'));
    if(els.role) els.role.textContent = character.role || character.title || 'Operative';

    if (els.bio) {
        if (character.description) {
            els.bio.innerHTML = character.description.split('\n').map(p => `<p>${p}</p>`).join('');
        } else {
            els.bio.innerHTML = `<p class='text-red-500'>${i18next.t('character_detail_page.bio_error')}</p>`;
        }
    }

    if(els.quote) els.quote.textContent = character.quote ? `"${character.quote}"` : "...";

    /* ------------------------------------------------------
       2. YÜKLEME EKRANINI KALDIR
    ------------------------------------------------------ */
    setTimeout(() => {
        if (els.loader) els.loader.classList.add('opacity-0', 'pointer-events-none');
        if (els.dossier) els.dossier.classList.remove('opacity-0');
    }, 800);

    /* ------------------------------------------------------
       3. NETWORK (AİLE AĞACI) - D3 LOGIC
    ------------------------------------------------------ */
    const familyContainer = document.getElementById('family-graph');
    if (familyContainer) {
        const loadingEl = familyContainer.querySelector('.d3-loading');
        const emptyEl = familyContainer.querySelector('.d3-empty');
        
        if (loadingEl) loadingEl.style.display = 'flex';

        const nodesMap = new Map();
        
        const addNode = (obj, isMain = false) => {
            if (!obj) return;
            
            let id = obj.slug || obj._id || obj._ref || null;
            let label = obj.name || obj.label || id;
            let img = obj.image?.url || (obj.image && obj.image.asset && obj.image.asset.url) || null;

            if(typeof obj === 'string') { id = obj.toLowerCase(); label = obj; }

            if (obj.character) { 
                const inner = obj.character;
                id = inner.slug || inner._ref || inner._id;
                label = inner.name || label;
                img = inner.image?.url || img;
            }
            
            if (!id) return;
            
            id = String(id).replace(/\s+/g, '-').toLowerCase();

            if (!nodesMap.has(id)) {
                nodesMap.set(id, {
                    id,
                    label,
                    image: img,
                    isMain,
                    group: isMain ? 'protagonist' : 'associate'
                });
            } else if (isMain) {
                nodesMap.get(id).isMain = true;
            }
            return id; 
        };

        const mainId = addNode(character, true);
        const links = [];

        if (character.relationships && Array.isArray(character.relationships)) {
            character.relationships.forEach(rel => {
                const targetId = addNode(rel.character || rel);
                if (mainId && targetId && mainId !== targetId) {
                    links.push({ 
                        source: mainId, 
                        target: targetId, 
                        label: rel.status || rel.type || '', 
                        strength: 1
                    });
                }
            });
        }

        if (character.family && Array.isArray(character.family)) {
            character.family.forEach(fam => {
                 const targetId = addNode(fam.character || fam);
                 if (mainId && targetId && mainId !== targetId) {
                    links.push({ 
                        source: mainId, 
                        target: targetId, 
                        label: fam.relation || 'Family', 
                        strength: 1.5
                    });
                 }
            });
        }

        const nodes = Array.from(nodesMap.values());

        if (nodes.length > 0) {
            try {
                const module = await import('./d3-family-tree.js');
                const width = familyContainer.clientWidth || 300;
                const height = familyContainer.clientHeight || 400;
                
                await module.renderFamilyGraph(familyContainer, { nodes, links }, { width, height, layout: 'force' });
                
                if (loadingEl) loadingEl.style.display = 'none';
            } catch (err) {
                console.error('D3 Render Failed:', err);
                if (emptyEl) {
                     emptyEl.style.display = 'flex'; 
                     emptyEl.innerHTML = 'Error rendering network.<br>System failure.';
                }
            }
        } else {
             if (loadingEl) loadingEl.style.display = 'none';
             if (emptyEl) emptyEl.style.display = 'flex'; 
             if (emptyEl) emptyEl.classList.remove('hidden');
        }
    }
};

/**
 * SAYFA YÜKLENDİĞİNDE ÇALIŞAN ANA FONKSİYON
 */
export const loadCharacterDetails = async () => {
    const params = new URLSearchParams(window.location.search);
    const characterSlug = params.get('slug'); 

    if (!characterSlug) {
        console.error("Access Denied: Missing slug parameter.");
        return;
    }

    try {
        console.log(`> Querying database for Subject: ${characterSlug}`);

        const query = `*[_type == "character" && slug.current == $slug][0]{
            ...,
            "image": image.asset->{
                url,
                "blurHash": metadata.blurHash,
                "lqip": metadata.lqip
            },
            faction->{title, color}, 
            family[] {
                relation,
                character->{
                    name, 
                    "slug": slug.current,
                    "image": image.asset->{
                        url,
                        "blurHash": metadata.blurHash
                    }
                }
            },
            relationships[] {
                status,
                character->{
                    name,
                    "slug": slug.current,
                    "image": image.asset->{
                        url,
                        "blurHash": metadata.blurHash
                    }
                }
            }
        }`;
        
        const sanityParams = { slug: characterSlug };

        const character = await client.fetch(query, sanityParams);

        if (character) {
            console.log("> Access Granted. Rendering file.");
            await renderCharacterDetails(character); 
        } else {
             document.body.innerHTML = `
                <div class="flex h-screen items-center justify-center bg-black text-red-600 font-mono">
                   ERROR 404: Subject not found in archives.
                </div>`;
        }
    } 
    catch (error) {
        console.error("System Failure:", error);
        const loaderText = document.querySelector('#file-loader p');
        if(loaderText) {
            loaderText.textContent = "CONNECTION FAILED";
            loaderText.classList.add('text-red-500');
        }
    }
};