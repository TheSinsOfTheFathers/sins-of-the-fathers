import { client, urlFor } from '../../lib/sanityClient.js';
import { toHTML } from 'https://esm.sh/@portabletext/to-html@2.0.13';
import { applyBlurToStaticImage } from '../../lib/imageUtils.js';

/**
 * HTML'e Veri Enjeksiyonu
 */
const renderLoreIntel = (doc) => {
    const setText = (id, val) => {
        const el = document.getElementById(id);
        if(el) el.textContent = val || 'Unknown';
    };

    setText('lore-title', doc.title);
    setText('lore-id', `#${doc._id.slice(-6).toUpperCase()}`); 
    setText('lore-source', doc.source || 'Anonymous Source');
    
    if (document.getElementById('lore-date')) {
        const dateStr = doc.date 
            ? new Date(doc.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
            : 'Undated Record';
        document.getElementById('lore-date').textContent = dateStr;
    }

    setText('lore-author', doc.author || 'REDACTED');

    const tagsContainer = document.getElementById('lore-tags');
    if (tagsContainer && doc.relatedEntities) {
        tagsContainer.innerHTML = doc.relatedEntities.map(ref => {
            const typeSlug = ref._type === 'character' ? 'character-detail' : 'faction-detail'; 
            return `
                <a href="${typeSlug}.html?slug=${ref.slug}" class="text-[10px] font-mono uppercase border border-gray-700 bg-white/5 px-2 py-1 hover:border-gold hover:text-gold transition text-gray-400">
                    #${ref.title || ref.name}
                </a>
            `;
        }).join('');
    } else if(tagsContainer) {
        tagsContainer.innerHTML = '<span class="text-[10px] text-gray-600 font-mono">// No associated links</span>';
    }

    const mediaContainer = document.getElementById('lore-media-container');
    const mediaImg = document.getElementById('lore-image');
    
    // ⬇️ BLURHASH ENTEGRASYON ALANI BAŞLANGIÇ ⬇️
    if (doc.mainImage && doc.mainImage.asset) {
        if (mediaContainer) mediaContainer.classList.remove('hidden');
        
        // Sanity URL'i oluşturma
        const imageUrl = urlFor(doc.mainImage).width(800).quality(80).url();
        // BlurHash verisini çekme (loadLoreDetails query'de olmalı)
        const blurHash = doc.mainImage.asset.blurHash;
        
        // applyBlurToStaticImage fonksiyonunu çağırıyoruz
        applyBlurToStaticImage('lore-image', imageUrl, blurHash);
        
    } else if (mediaImg) {
        // Görsel yoksa Placeholder veya gizleme mantığını koruyabilirsin.
        // Bu örnekte, görseli gizli tutuyoruz.
        mediaImg.src = ''; 
    }
    // ⬆️ BLURHASH ENTEGRASYON ALANI SONU ⬆️

    const bodyContainer = document.getElementById('lore-body');
    if (bodyContainer) {
        if (doc.body) {
            bodyContainer.innerHTML = toHTML(doc.body, {
                components: {
                    block: {
                        normal: ({children}) => `<p class="mb-6 leading-relaxed opacity-90">${children}</p>`,
                        blockquote: ({children}) => `<blockquote class="border-l-2 border-gold pl-4 italic my-4 text-gold/80">${children}</blockquote>`,
                        h3: ({children}) => `<h3 class="text-gold font-mono uppercase tracking-widest text-sm mt-8 mb-2 border-b border-gold/30 pb-1">${children}</h3>`
                    },
                    marks: {
                        redact: ({children}) => `<span class="bg-black text-black px-1 select-none hover:text-gray-300 transition-colors cursor-help" title="Classified Info">${children}</span>`,
                        em: ({children}) => `<em class="text-gray-400">${children}</em>`
                    }
                }
            });
        } else {
            bodyContainer.innerHTML = `
                <p class="text-center text-sm font-mono mt-10">
                    <span class="text-red-500">[ERROR]</span><br>
                    File content corrupted or heavily encrypted.<br>
                    Decrypting segments... failed.
                </p>
            `;
        }
    }

    // Yükleme ekranını kaldırıp içeriği görünür yapma
    setTimeout(() => {
        const loader = document.getElementById('doc-loader');
        const content = document.getElementById('doc-content');
        if(loader) loader.classList.add('hidden');
        if(content) content.classList.remove('opacity-0');
    }, 800); 
};


export const loadLoreDetails = async () => {
    const container = document.getElementById('evidence-container'); 
    if (!container) return; 

   
    const params = new URLSearchParams(window.location.search);
    const loreSlug = params.get('slug');

    if (!loreSlug) {
        console.warn("Missing Slug");
        const loader = document.getElementById('doc-loader');
        if(loader) loader.innerHTML = "<span class='text-red-500'>ARCHIVE QUERY FAILED: NO ID</span>";
        return;
    }

    try {
        console.log(`> Retrieving File: ${loreSlug}`);

        const query = `*[_type == "lore" && slug.current == $slug][0]{
            "title": title_en,
            "body": content_en,
            _id,
            "date": date,
            source,
            author,
            // Lore ana görseli
            mainImage {
                asset->{
                    url,
                    "blurHash": metadata.blurHash
                }
            },
            "relatedEntities": coalesce(relatedCharacters[]->{name, "title": name, "slug": slug.current, _type}, []) 
                             + coalesce(relatedFactions[]->{"title": title, "slug": slug.current, _type}, [])
        }`;
        
        const loreDoc = await client.fetch(query, { slug: loreSlug });

        if (loreDoc) {
            renderLoreIntel(loreDoc);
        } else {
            document.title = '404 - File Lost';
            const loader = document.getElementById('doc-loader');
            if(loader) loader.innerHTML = "<span class='text-red-500'>ERROR 404: FILE NOT FOUND IN ARCHIVE</span>";
        }

    } catch (error) {
        console.error("Archive Connection Error:", error);
        const loader = document.getElementById('doc-loader');
        if(loader) loader.innerHTML = "<span class='text-red-500'>SYSTEM ERROR: CANNOT READ DATA STREAM</span>";
    }
};