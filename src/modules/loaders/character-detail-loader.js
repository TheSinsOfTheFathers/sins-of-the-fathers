import { client } from '../../lib/sanityClient.js';
import { applyBlurToStaticImage } from '../../lib/imageUtils.js';
import i18next from '../../lib/i18n.js';
// 👇 SEO / SCHEMA İMPORTU
import { injectSchema, generateCharacterSchema } from '../../lib/seo.js';

// 👇 1. GSAP IMPORT
import gsap from 'gsap';

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
        detailsContainer: document.querySelector('.meta-details'), // Eğer varsa grup olarak seçmek için
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

    // SEO SCHEMA ENJEKSİYONU
    try {
        const schemaData = generateCharacterSchema({
            name: character.name,
            image: { url: imgUrl },
            description: character.description || "",
            faction: character.faction,
            role: character.role || character.title
        });
        injectSchema(schemaData);
        console.log("> SEO Protocol: Character Schema Injected.");
    } catch (err) {
        console.warn("> SEO Protocol Warning: Failed to inject schema.", err);
    }

    // STATUS GÜNCELLEMESİ
    if (els.statusBadge) {
        const rawStatus = character.status || 'Active';
        const statusKey = `character_detail_page.status_${rawStatus.toLowerCase()}`;
        els.statusBadge.textContent = i18next.exists(statusKey) ? i18next.t(statusKey) : rawStatus;
        
        // Renk ayarı (Pulse class'ını sildim, GSAP ile yapacağız)
        els.statusBadge.className = 'font-mono text-xs uppercase font-bold tracking-widest ' + 
            (rawStatus.toLowerCase() === 'deceased' || rawStatus.toLowerCase() === 'kia' ? 'text-red-600' : 'text-green-500');
    }

    els.name.textContent = character.name;
    if(character.alias) els.alias.textContent = `"${character.alias}"`;
    
    document.title = `${character.name} // ${i18next.t('character_detail_page.doc_title_suffix')}`;

    if(els.faction) els.faction.textContent = character.faction?.title || i18next.t('character_detail_page.unknown');
    if(els.location) els.location.textContent = character.origin || (character.faction ? i18next.t('character_detail_page.affiliated_territory') : i18next.t('character_detail_page.unknown'));
    if(els.role) els.role.textContent = character.role || character.title || 'Operative';

    if (els.bio) {
        if (character.description) {
            els.bio.innerHTML = character.description.split('\n').map(p => `<p class="mb-4">${p}</p>`).join('');
        } else {
            els.bio.innerHTML = `<p class='text-red-500'>${i18next.t('character_detail_page.bio_error')}</p>`;
        }
    }

    if(els.quote) els.quote.textContent = character.quote ? `"${character.quote}"` : "...";

    /* ------------------------------------------------------
       2. GSAP REVEAL ANIMATION (Eski setTimeout yerine)
       "Dosya Masaya Konuyor" Efekti
    ------------------------------------------------------ */
    
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    // A. Loader'ı kaldır
    tl.to(els.loader, { autoAlpha: 0, duration: 0.5 })
      
      // B. Ana konteyneri görünür yap
      .set(els.dossier, { autoAlpha: 1 }) 

      // C. Resmi dramatik getir (Zoom out + Grayscale to Color)
      .from(els.image, { 
          scale: 1.1, 
          filter: "grayscale(100%) blur(5px)", 
          duration: 1.5,
          ease: "power2.inOut"
      }, "<") // Loader biter bitmez başla

      // D. İsim ve Başlıkları soldan kaydırarak getir (Sırayla)
      .from([els.statusBadge, els.name, els.alias, els.role], {
          x: -30,
          opacity: 0,
          duration: 0.8,
          stagger: 0.1
      }, "-=1.0")

      // E. Detayları (Faction, Location vb.) alttan yukarı getir
      .from([els.faction, els.location, els.quote], {
          y: 20,
          opacity: 0,
          duration: 0.6,
          stagger: 0.1
      }, "-=0.5")

      // F. Biyografiyi yavaşça aç (Fade in)
      .from(els.bio, {
          autoAlpha: 0,
          y: 10,
          duration: 1
      }, "-=0.3");

    // G. Status Badge için sürekli "Nefes Alma" efekti (CSS animate-pulse yerine)
    if (els.statusBadge) {
        gsap.to(els.statusBadge, {
            opacity: 0.5,
            duration: 0.8,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
        });
    }

    /* ------------------------------------------------------
       3. NETWORK (AİLE AĞACI) - D3 LOGIC
    ------------------------------------------------------ */
    const familyContainer = document.getElementById('family-graph');
    if (familyContainer) {
        
        // GSAP: Konteyneri başta gizle, grafik yüklenince açacağız
        gsap.set(familyContainer, { autoAlpha: 0, scale: 0.98 });

        const loadingEl = familyContainer.querySelector('.d3-loading');
        const emptyEl = familyContainer.querySelector('.d3-empty');
        
        if (loadingEl) loadingEl.style.display = 'flex';

        // ... (D3 NODE HAZIRLAMA KODLARI AYNI KALDI) ...
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
                nodesMap.set(id, { id, label, image: img, isMain, group: isMain ? 'protagonist' : 'associate' });
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
                    links.push({ source: mainId, target: targetId, label: rel.status || rel.type || '', strength: 1 });
                }
            });
        }

        if (character.family && Array.isArray(character.family)) {
            character.family.forEach(fam => {
                 const targetId = addNode(fam.character || fam);
                 if (mainId && targetId && mainId !== targetId) {
                    links.push({ source: mainId, target: targetId, label: fam.relation || 'Family', strength: 1.5 });
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

                // GSAP: Grafik hazır olduğunda kutuyu yumuşakça aç
                gsap.to(familyContainer, { autoAlpha: 1, scale: 1, duration: 0.8, ease: "power2.out" });

            } catch (err) {
                console.error('D3 Render Failed:', err);
                if (emptyEl) {
                     emptyEl.style.display = 'flex'; 
                     emptyEl.innerHTML = 'Error rendering network.<br>System failure.';
                }
                // Hata olsa bile kutuyu göster
                gsap.to(familyContainer, { autoAlpha: 1 });
            }
        } else {
             if (loadingEl) loadingEl.style.display = 'none';
             if (emptyEl) {
                 emptyEl.style.display = 'flex'; 
                 emptyEl.classList.remove('hidden');
             }
             gsap.to(familyContainer, { autoAlpha: 1 });
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
                    "image": image.asset->{ url, "blurHash": metadata.blurHash }
                }
            },
            relationships[] {
                status,
                character->{
                    name,
                    "slug": slug.current,
                    "image": image.asset->{ url, "blurHash": metadata.blurHash }
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