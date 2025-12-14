import { client } from '../../lib/sanityClient.js';
import { renderBlurHash, handleImageLoad } from '../../lib/imageUtils.js';
import i18next from '../../lib/i18n.js'; // i18next import
// 👇 SEO İMPORTU EKLENDİ
import { injectSchema } from '../../lib/seo.js';

let allLoreData = [];

/* --------------------------------------------------------------------------
   CARD TEMPLATES (GÖRSEL AYRIŞTIRMA)
   -------------------------------------------------------------------------- */

const createDocumentCard = (lore) => `
    <div class="archive-card bg-[#e6e2d3] text-black p-6 rounded-sm shadow-lg relative overflow-hidden group h-fit break-inside-avoid">
        <div class="absolute top-2 right-2 border border-red-900 text-red-900 text-[10px] font-bold px-2 py-0.5 transform rotate-12 opacity-70">DOC_${lore._createdAt.slice(0, 4)}</div>
        <h3 class="font-mono font-bold text-lg mb-2 uppercase underline decoration-red-800 decoration-2 tracking-tighter">
            <a href="lore-detail.html?slug=${lore.slug}" class="hover:text-red-900">${lore.title}</a>
        </h3>
        <p class="font-serif text-xs italic mb-4 opacity-80 border-b border-black/10 pb-2">
            Source: ${lore.source || i18next.t('lore_loader.unknown_source')}
        </p>
        <div class="font-mono text-xs leading-relaxed opacity-90 mb-4 line-clamp-4">
            ${lore.summary || i18next.t('lore_loader.content_pending')}
        </div>
        <a href="lore-detail.html?slug=${lore.slug}" class="block text-right text-[10px] font-bold uppercase tracking-widest hover:text-red-700 transition-colors">
            ${i18next.t('lore_loader.access_file')} &rarr;
        </a>
    </div>
`;

const createAudioCard = (lore) => `
    <div class="archive-card bg-gray-900 border-l-4 border-gold p-5 shadow-lg h-fit break-inside-avoid group">
        <div class="flex items-center justify-between mb-4">
            <h3 class="text-gold font-mono text-sm uppercase truncate w-2/3">
                <i class="fas fa-microphone-alt mr-2"></i> ${lore.title}
            </h3>
            <span class="text-[9px] text-gray-600 font-mono border border-gray-700 px-1">REC</span>
        </div>
        <div class="flex items-center space-x-1 h-6 mb-4 opacity-60 group-hover:opacity-100 transition-opacity">
            <div class="w-1 bg-gold h-3"></div><div class="w-1 bg-gold h-5"></div><div class="w-1 bg-gold h-full animate-pulse"></div>
            <div class="w-1 bg-gold h-4"></div><div class="w-1 bg-gold h-2"></div><div class="w-1 bg-gold h-5"></div>
            <div class="w-1 bg-gray-700 h-px flex-grow"></div>
        </div>
        <p class="text-xs text-gray-400 font-mono mb-4 line-clamp-2">${lore.summary || i18next.t('lore_loader.encrypted_audio')}</p>
        <a href="lore-detail.html?slug=${lore.slug}" class="block w-full border border-gray-700 py-2 text-[10px] text-center text-white hover:bg-gold hover:text-black hover:border-gold transition-all uppercase font-mono tracking-wider">
            ${i18next.t('lore_loader.play_transmission')}
        </a>
    </div>
`;

const createRestrictedCard = (lore) => `
    <div class="archive-card bg-black border border-red-900/40 relative overflow-hidden group h-fit break-inside-avoid cursor-not-allowed">
        <div class="p-6 filter blur-sm opacity-30 select-none pointer-events-none">
            <h3 class="text-white font-serif text-xl mb-2">${lore.title}</h3>
            <p class="text-gray-400 text-sm font-mono">${lore.summary || i18next.t('lore_loader.redacted')}</p>
            <div class="mt-4 h-20 bg-gray-800 w-full"></div>
        </div>

        <div class="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-[1px] group-hover:bg-black/30 transition-colors z-10">
            <div class="border-2 border-red-600 rounded-full p-3 mb-2 shadow-[0_0_15px_rgba(220,38,38,0.5)] bg-black">
                <i class="fas fa-lock text-xl text-red-500"></i>
            </div>
            <span class="text-red-500 font-mono text-xs uppercase font-bold tracking-widest mb-1">${i18next.t('lore_loader.classified')}</span>
            <a href="login.html?redirect=lore" class="mt-3 px-4 py-1 bg-red-900/20 text-white text-[9px] border border-red-800 hover:bg-red-900 hover:border-red-500 transition uppercase font-mono">
                ${i18next.t('lore_loader.clearance_required')}
            </a>
        </div>
    </div>
`;

const createImageCard = (lore) => {
    const imgUrl = lore.image?.url || 'https://via.placeholder.com/400';
    const blurHash = lore.image?.blurHash;

    const cardDiv = document.createElement('div');
    cardDiv.className = 'archive-card bg-white p-3 shadow-lg h-fit break-inside-avoid hover:rotate-1 transition-transform duration-300';

    cardDiv.innerHTML = `
        <a href="lore-detail.html?slug=${lore.slug}" class="block group">
            <div class="relative w-full aspect-video bg-gray-200 overflow-hidden border border-gray-300">
                
                <canvas class="blur-canvas absolute inset-0 w-full h-full object-cover z-0"></canvas>

                <img src="${imgUrl}" 
                     class="main-image relative w-full h-full object-cover grayscale contrast-125 opacity-0 transition-all duration-700 z-10" 
                     loading="lazy" 
                     alt="Evidence">
                
                <div class="absolute bottom-2 right-2 text-black font-bold text-[8px] px-1 rotate-[-5deg] opacity-60 font-mono z-20 bg-white/50">
                    ${lore.date || i18next.t('lore_loader.no_date')}
                </div>
            </div>
            <div class="pt-3 pb-1 px-1">
                <h3 class="font-mono text-xs text-black uppercase truncate font-bold group-hover:text-red-800 transition-colors">${lore.title}</h3>
                <p class="text-[9px] text-gray-600 mt-1 line-clamp-2 font-sans leading-tight">${lore.summary || ''}</p>
            </div>
        </a>
    `;

    const canvas = cardDiv.querySelector('.blur-canvas');
    const img = cardDiv.querySelector('.main-image');

    if (blurHash && canvas) {
        renderBlurHash(canvas, blurHash);
    }

    if (img) {
        if (img.complete) handleImageLoad(img, canvas);
        else img.onload = () => handleImageLoad(img, canvas);
    }

    return cardDiv;
};

/* --------------------------------------------------------------------------
   KART DAĞITICI (Dispatcher)
   -------------------------------------------------------------------------- */
const generateCard = (lore) => {
    if (lore.restricted) return createRestrictedCard(lore);

    const type = lore.loreType || 'document';

    switch (type) {
        case 'audio': return createAudioCard(lore);
        case 'image': return createImageCard(lore);
        default: return createDocumentCard(lore);
    }
};

/* --------------------------------------------------------------------------
   FILTER LOGIC
   -------------------------------------------------------------------------- */
const renderGrid = (data) => {
    const container = document.getElementById('archive-grid');
    if (!container) return;

    container.innerHTML = '';

    if (data.length === 0) {
        container.innerHTML = `<div class="col-span-full text-center text-gray-500 font-mono py-12">${i18next.t('lore_loader.no_records_query')}</div>`;
        return;
    }

    data.forEach(item => {
        const card = generateCard(item);

        if (typeof card === 'string') {
            container.insertAdjacentHTML('beforeend', card);
        } else {
            container.appendChild(card);
        }
    });
};

const applyFilters = (searchTerm = '', filterType = 'all') => {
    const lowerTerm = searchTerm.toLowerCase();

    const filtered = allLoreData.filter(item => {
        const matchesSearch =
            (item.title || '').toLowerCase().includes(lowerTerm) ||
            (item.summary || '').toLowerCase().includes(lowerTerm);

        let matchesType = true;
        if (filterType === 'documents') matchesType = item.loreType === 'document' || !item.loreType;
        if (filterType === 'audio') matchesType = item.loreType === 'audio';
        if (filterType === 'classified') matchesType = item.restricted === true;

        return matchesSearch && matchesType;
    });

    renderGrid(filtered);
};

/* --------------------------------------------------------------------------
   MAIN EXECUTION
   -------------------------------------------------------------------------- */
export async function displayLoreList() {
    const container = document.getElementById('archive-grid');
    const loader = document.getElementById('archive-loader');

    if (!container) return;

    try {
        console.log("> Accessing Archives...");

        const query = `*[_type == "lore"] | order(date desc) {
            _id,
            _createdAt,
            "title": title_en,
            "summary": summary_en,
            "slug": slug.current,
            "loreType": loreType,
            "restricted": restricted,
            "image": mainImage.asset->{
                url,
                "blurHash": metadata.blurHash
            },
            "date": date,
            source
        }`;

        allLoreData = await client.fetch(query);

        // 👇 SEO / SCHEMA ENJEKSİYONU (ItemList)
        try {
            const itemList = allLoreData.map((lore, index) => ({
                "@type": "ListItem",
                "position": index + 1,
                "item": {
                    "@type": "DigitalDocument",
                    "name": lore.title,
                    "description": lore.summary,
                    "datePublished": lore.date,
                    "url": new URL(`lore-detail.html?slug=${lore.slug}`, globalThis.location.origin).href
                }
            }));

            const schemaData = {
                "@context": "https://schema.org",
                "@type": "CollectionPage",
                "name": i18next.t('archive_page.meta_title') || "Classified Archives | TSOF",
                "description": "Directory of all known lore and evidence.",
                "mainEntity": {
                    "@type": "ItemList",
                    "itemListElement": itemList
                }
            };
            injectSchema(schemaData);
            console.log("> SEO Protocol: Lore List Schema Injected.");
        } catch (e) {
            console.warn("Schema Error:", e);
        }
        // -----------------------------------------------------

        if (loader) loader.style.display = 'none';
        container.classList.remove('opacity-0');

        renderGrid(allLoreData);
        setupSearchInterface();

    } catch (error) {
        console.error("Archive Corrupted:", error);
        if (loader) loader.innerHTML = `<span class="text-red-500 font-mono">${i18next.t('lore_loader.system_error_short')}</span>`;
        container.innerHTML = `<p class="text-red-500 text-center col-span-full">${i18next.t('lore_loader.connection_failed_long')}</p>`;
    }
}

function setupSearchInterface() {
    const searchInput = document.querySelector('input[placeholder*="Search"]');
    const filterButtons = document.querySelectorAll('button.uppercase');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const activeBtn = document.querySelector(String.raw`button.bg-gold\/10`);
            const type = activeBtn ? mapBtnTextToType(activeBtn.textContent) : 'all';
            applyFilters(e.target.value, type);
        });
    }

    if (filterButtons) {
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                filterButtons.forEach(b => {
                    b.classList.remove('bg-gold/10', 'text-gold', 'font-bold', 'border-gold');
                    b.classList.add('text-gray-500', 'border-gray-700');
                });
                btn.classList.remove('text-gray-500', 'border-gray-700');
                btn.classList.add('bg-gold/10', 'text-gold', 'font-bold', 'border-gold');

                const type = mapBtnTextToType(btn.textContent);
                const term = searchInput ? searchInput.value : '';
                applyFilters(term, type);
            });
        });
    }
}

function mapBtnTextToType(text) {
    const t = text.toLowerCase();
    if (t.includes('audio')) return 'audio';
    if (t.includes('doc')) return 'documents';
    if (t.includes('class')) return 'classified';
    return 'all';
}