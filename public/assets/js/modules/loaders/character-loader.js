import { client } from '../../lib/sanityClient.js';
import { renderBlurHash, handleImageLoad } from '../../lib/imageUtils.js';
import i18next from '../../lib/i18n.js';

/* --------------------------------------------------------------------------
   CARD TEMPLATES (NOIR STYLE)
   -------------------------------------------------------------------------- */

const createProtagonistCard = (character) => {
    const cardLink = document.createElement('a');
    cardLink.href = `character-detail.html?slug=${character.slug.current}`;
    cardLink.className = 'group relative w-full h-[500px] overflow-hidden border border-white/10 bg-obsidian hover:border-gold transition-all duration-700 block shadow-2xl';

    // Verileri hazırla
    const imageUrl = character.image?.url || 'https://placehold.co/600x800/0a0a0a/333333?text=CLASSIFIED';
    const blurHash = character.image?.blurHash;
    const alias = character.alias || 'The Architect';

    cardLink.innerHTML = `
        <canvas class="blur-canvas absolute inset-0 w-full h-full object-cover z-0"></canvas>
        
        <img src="${imageUrl}" alt="${character.name}" 
             class="main-image absolute inset-0 w-full h-full object-cover opacity-0 grayscale group-hover:grayscale-0 group-hover:scale-105 group-hover:opacity-100 transition-all duration-1000 ease-out z-10"
             loading="lazy">
        
        <div class="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent z-20 pointer-events-none"></div>
        
        <div class="absolute bottom-0 left-0 w-full p-8 z-30 pointer-events-none">
            <div class="h-px w-12 bg-gold mb-4 transition-all group-hover:w-full duration-700"></div>
            <p class="font-mono text-gold text-xs uppercase tracking-[0.2em] mb-1">${alias}</p>
            <h3 class="font-serif text-4xl md:text-5xl text-white uppercase tracking-wide drop-shadow-lg group-hover:text-gold transition-colors">${character.name}</h3>
        </div>
        
        <div class="absolute top-4 right-4 text-xs font-mono text-white/30 border border-white/20 px-2 py-1 group-hover:text-gold group-hover:border-gold transition-colors z-30">
             TARGET_ALPHA
        </div>
    `;

    // Blur ve Yükleme Mantığı
    const canvas = cardLink.querySelector('.blur-canvas');
    const img = cardLink.querySelector('.main-image');

    if (blurHash && canvas) {
        renderBlurHash(canvas, blurHash);
    }

    if (img) {
        // Resim yüklendiğinde blur'u kapat, resmi aç
        if (img.complete) {
            handleImageLoad(img, canvas);
        } else {
            img.onload = () => handleImageLoad(img, canvas);
        }
    }

    return cardLink;
};

const createOperativeCard = (character) => {
    const cardLink = document.createElement('a');
    cardLink.href = `character-detail.html?slug=${character.slug.current}`;
    cardLink.className = 'group block bg-white/5 border border-white/10 hover:border-white/40 hover:-translate-y-1 transition-all duration-300 shadow-lg';

    const imageUrl = character.image?.url || 'https://placehold.co/400x500/0a0a0a/333?text=IMG_MISSING';
    const blurHash = character.image?.blurHash;
    const title = character.title || 'Associate';

    cardLink.innerHTML = `
        <div class="relative aspect-[3/4] overflow-hidden border-b border-white/5 bg-gray-900">
            
            <canvas class="blur-canvas absolute inset-0 w-full h-full object-cover z-0"></canvas>
            
            <img src="${imageUrl}" alt="${character.name}" 
                 class="main-image relative w-full h-full object-cover grayscale opacity-0 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500 z-10"
                 loading="lazy">
                 
            <div class="absolute inset-0 border-2 border-transparent group-hover:border-gold/20 transition-all z-20 pointer-events-none"></div>
        </div>
        
        <div class="p-5">
            <h3 class="font-serif text-xl text-white mb-1 group-hover:text-gold transition-colors">${character.name}</h3>
            <p class="font-mono text-xs text-gray-500 uppercase tracking-widest">${title}</p>
        </div>
    `;

    // Blur ve Yükleme Mantığı
    const canvas = cardLink.querySelector('.blur-canvas');
    const img = cardLink.querySelector('.main-image');

    if (blurHash && canvas) {
        renderBlurHash(canvas, blurHash);
    }

    if (img) {
        if (img.complete) {
            handleImageLoad(img, canvas);
        } else {
            img.onload = () => handleImageLoad(img, canvas);
        }
    }

    return cardLink;
};

const createAssetCard = (character) => {
    const cardLink = document.createElement('a');
    cardLink.href = `character-detail.html?slug=${character.slug.current}`;
    cardLink.className = 'group flex items-center space-x-4 p-3 border border-white/5 bg-black/40 hover:bg-white/5 hover:border-red-900/50 transition-all duration-300';

    const imageUrl = character.image?.url || 'https://ui-avatars.com/api/?background=333&color=fff&name=' + character.name;
    const blurHash = character.image?.blurHash;
    const title = character.title || 'Known Asset';

    cardLink.innerHTML = `
        <div class="relative w-12 h-12 overflow-hidden rounded-sm border border-gray-700 group-hover:border-red-800 shrink-0 bg-gray-800">
            
            <canvas class="blur-canvas absolute inset-0 w-full h-full object-cover z-0"></canvas>
            
            <img src="${imageUrl}" 
                 class="main-image w-full h-full object-cover grayscale opacity-0 transition-opacity duration-300 z-10" 
                 alt="${character.name}"
                 loading="lazy">
        </div>
        
        <div class="min-w-0">
            <h4 class="font-mono text-sm text-gray-300 group-hover:text-white uppercase tracking-wide truncate">${character.name}</h4>
            <p class="text-[10px] text-gray-600 group-hover:text-red-500 transition-colors font-mono truncate">${title}</p>
        </div>
    `;

    // Blur ve Yükleme Mantığı
    const canvas = cardLink.querySelector('.blur-canvas');
    const img = cardLink.querySelector('.main-image');

    if (blurHash && canvas) {
        renderBlurHash(canvas, blurHash);
    }

    if (img) {
        if (img.complete) {
            handleImageLoad(img, canvas);
        } else {
            img.onload = () => handleImageLoad(img, canvas);
        }
    }

    return cardLink;
};


/* --------------------------------------------------------------------------
   MAIN LOGIC
   -------------------------------------------------------------------------- */
export async function displayCharacters() {
    const containers = {
        protagonists: document.getElementById('protagonists-gallery'),
        main: document.getElementById('main-characters-gallery'),
        side: document.getElementById('side-characters-gallery')
    };

    if (!containers.main && !containers.protagonists) return;

    try {
        console.log("> Accessing Personnel Database...");

        const query = `*[_type == "character"] | order(name asc) {
            name, 
            title, 
            alias,
            slug, 
            // DEĞİŞİKLİK: imageUrl string'i yerine image objesi
            "image": image.asset->{
                url,
                "blurHash": metadata.blurHash
            }, 
            is_main
        }`;
        
        const characters = await client.fetch(query);

        if (characters && characters.length > 0) {
            
            if(containers.protagonists) containers.protagonists.innerHTML = '';
            if(containers.main) containers.main.innerHTML = '';
            if(containers.side) containers.side.innerHTML = '';

            characters.forEach((character) => {
                const slug = character.slug.current;
                const lowerName = (character.name || '').toLowerCase();
                const lowerAlias = character.alias ? character.alias.toLowerCase() : '';

                const isRuaraidh = lowerName.includes('ruaraidh') || lowerAlias.includes('exile');
                const isHavi = lowerName.includes('havi') || lowerAlias.includes('bastard');

                if (isRuaraidh || isHavi) {
                    if (containers.protagonists) {
                        containers.protagonists.appendChild(createProtagonistCard(character));
                    }
                } 
                else if (character.is_main) {
                    if (containers.main) {
                        containers.main.appendChild(createOperativeCard(character));
                    }
                } 
                else {
                    if (containers.side) {
                        containers.side.appendChild(createAssetCard(character));
                    }
                }
            });

            Object.keys(containers).forEach(key => {
                const container = containers[key];
                if (container && container.children.length === 0) {
                    container.innerHTML = `<p class="text-xs font-mono text-gray-600 col-span-full text-center">${i18next.t('characters_page.no_records_found')}</p>`;
                }
            });

        } else {
            if (containers.main) containers.main.innerHTML = '<p class="text-red-500 font-mono">DATABASE CONNECTION FAILED.</p>';
        }
    } 
    catch (error) {
        console.error("Data Malfunction: ", error);
        if (containers.main) containers.main.innerHTML = '<p class="text-red-500 animate-pulse">CRITICAL ERROR: CANNOT RETRIEVE DOSSIERS.</p>';
    }
}