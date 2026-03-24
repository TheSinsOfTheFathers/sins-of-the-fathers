import DOMPurify from 'dompurify';

import { client } from '../../lib/sanityClient.js';
import { renderBlurHash, handleImageLoad } from '../../lib/imageUtils.js';
import i18next from '../../lib/i18n.js';
import { injectSchema } from '../../lib/seo.js';

// 👇 1. GSAP IMPORT
import gsap from 'gsap';
import { NoirEffects } from '../ui/noir-effects.js';

/* --------------------------------------------------------------------------
   CARD TEMPLATES (NOIR STYLE)
   -------------------------------------------------------------------------- */

const createProtagonistCard = (character) => {
    const cardLink = document.createElement('a');
    cardLink.href = `character-detail.html?slug=${character.slug.current}`;

    cardLink.className = 'group relative w-full h-[600px] overflow-hidden border border-white/10 bg-black hover:border-gold/50 transition-all duration-1000 block shadow-2xl opacity-0 scale-95';

    const imageUrl = character.image?.url || 'https://placehold.co/800x1200/0a0a0a/333333?text=CLASSIFIED';
    const blurHash = character.image?.blurHash;
    const alias = character.alias || 'The Architect';

    cardLink.innerHTML = DOMPurify.sanitize(`
        <canvas class="blur-canvas absolute inset-0 w-full h-full object-cover z-0"></canvas>
        <img src="${imageUrl}" alt="${character.name}" 
             class="main-image absolute inset-0 w-full h-full object-cover opacity-0 grayscale brightness-50 group-hover:grayscale-0 group-hover:brightness-100 group-hover:scale-110 transition-all duration-1000 cubic-bezier(0.2, 0, 0, 1) z-10"
             loading="lazy">
        
        <!-- Tactical HUD Overlay -->
        <div class="absolute inset-0 z-20 pointer-events-none border-[20px] border-transparent group-hover:border-black/20 transition-all duration-1000">
             <div class="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-gold/40"></div>
             <div class="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-gold/40"></div>
             <div class="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-gold/40"></div>
             <div class="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-gold/40"></div>
             
             <!-- Scanning Effect -->
             <div class="absolute inset-0 bg-linear-to-b from-transparent via-gold/5 to-transparent h-1/2 w-full -translate-y-full group-hover:animate-[scan_4s_linear_infinite] opacity-0 group-hover:opacity-100"></div>
        </div>

        <div class="absolute inset-0 bg-linear-to-t from-black via-black/40 to-transparent z-25 pointer-events-none group-hover:opacity-60 transition-opacity duration-1000"></div>
        
        <div class="absolute bottom-0 left-0 w-full p-10 z-30 pointer-events-none transform translate-y-4 group-hover:translate-y-0 transition-transform duration-700">
            <div class="flex items-center gap-3 mb-4">
                <div class="h-[2px] w-8 bg-gold shadow-[0_0_10px_gold]"></div>
                <p class="font-mono text-gold text-[10px] uppercase tracking-[0.4em] font-bold">${alias}</p>
            </div>
            <h3 class="font-serif text-5xl md:text-6xl text-white uppercase tracking-tighter leading-none mb-2 drop-shadow-2xl group-hover:text-gold transition-colors duration-500">${character.name}</h3>
            <p class="font-mono text-[9px] text-white/40 uppercase tracking-widest">Architect Verified // Status: ACTIVE</p>
        </div>

        <div class="absolute top-8 right-8 text-[10px] font-mono text-gold/40 border border-gold/20 px-3 py-1 backdrop-blur-md transition-all duration-500 group-hover:text-gold group-hover:border-gold/50 group-hover:bg-gold/10 z-30">
             FILE_ID: PX-${Math.floor(Math.random() * 9000) + 1000}
        </div>
    `);

    const canvas = cardLink.querySelector('.blur-canvas');
    const img = cardLink.querySelector('.main-image');

    if (blurHash && canvas) renderBlurHash(canvas, blurHash);
    if (img) {
        if (img.complete) handleImageLoad(img, canvas);
        else img.onload = () => handleImageLoad(img, canvas);
    }

    return cardLink;
};

const createOperativeCard = (character) => {
    const cardLink = document.createElement('a');
    cardLink.href = `character-detail.html?slug=${character.slug.current}`;

    cardLink.className = 'group block bg-white/[0.03] border border-white/5 hover:border-gold/30 hover:bg-white/[0.08] transition-all duration-500 shadow-xl opacity-0 translate-y-8';

    const imageUrl = character.image?.url || 'https://placehold.co/400x500/0a0a0a/333?text=IMG_MISSING';
    const blurHash = character.image?.blurHash;
    const title = character.title || 'Field Operative';

    cardLink.innerHTML = DOMPurify.sanitize(`
        <div class="relative aspect-[4/5] overflow-hidden border-b border-white/10 bg-obsidian">
            <canvas class="blur-canvas absolute inset-0 w-full h-full object-cover z-0 opacity-40"></canvas>
            <img src="${imageUrl}" alt="${character.name}" 
                 class="main-image relative w-full h-full object-cover grayscale brightness-75 group-hover:grayscale-0 group-hover:brightness-100 group-hover:scale-105 transition-all duration-700 z-10"
                 loading="lazy">
            <div class="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent z-15"></div>
            
            <!-- Mini HUD Overlay -->
            <div class="absolute inset-0 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                 <div class="absolute top-2 left-2 w-2 h-2 border-t border-l border-gold/40"></div>
                 <div class="absolute bottom-2 right-2 w-2 h-2 border-b border-r border-gold/40"></div>
                 <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(212,175,55,0.05)_100%)]"></div>
            </div>
        </div>
        <div class="p-6 relative overflow-hidden">
            <div class="relative z-10">
                <span class="font-mono text-[9px] text-white/30 uppercase tracking-[0.4em] mb-1 block">Subject Profile</span>
                <h3 class="font-serif text-2xl text-white group-hover:text-gold transition-colors duration-300 mb-1">${character.name}</h3>
                <div class="flex items-center gap-2">
                    <span class="w-1.5 h-1.5 rounded-full bg-green-500/50 animate-pulse"></span>
                    <p class="font-mono text-[10px] text-white/50 uppercase tracking-widest">${title}</p>
                </div>
            </div>
            
            <!-- Graphic Decor -->
            <div class="absolute -right-4 -bottom-4 w-12 h-12 border-b border-r border-white/5 group-hover:border-gold/20 transition-colors"></div>
        </div>
    `);

    const canvas = cardLink.querySelector('.blur-canvas');
    const img = cardLink.querySelector('.main-image');

    if (blurHash && canvas) renderBlurHash(canvas, blurHash);
    if (img) {
        if (img.complete) handleImageLoad(img, canvas);
        else img.onload = () => handleImageLoad(img, canvas);
    }

    return cardLink;
};

const createAssetCard = (character) => {
    const cardLink = document.createElement('a');
    cardLink.href = `character-detail.html?slug=${character.slug.current}`;

    // GSAP için 'opacity-0' ekledik
    cardLink.className = 'group flex items-center space-x-4 p-3 border border-white/5 bg-black/40 hover:bg-white/5 hover:border-red-900/50 transition-all duration-300 opacity-0';

    const imageUrl = character.image?.url || 'https://ui-avatars.com/api/?background=333&color=fff&name=' + character.name;
    const blurHash = character.image?.blurHash;
    const title = character.title || 'Known Asset';

    cardLink.innerHTML = DOMPurify.sanitize(`
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
    `);

    const canvas = cardLink.querySelector('.blur-canvas');
    const img = cardLink.querySelector('.main-image');

    if (blurHash && canvas) renderBlurHash(canvas, blurHash);
    if (img) {
        if (img.complete) handleImageLoad(img, canvas);
        else img.onload = () => handleImageLoad(img, canvas);
    }

    return cardLink;
};


/* --------------------------------------------------------------------------
   MAIN LOGIC
   -------------------------------------------------------------------------- */
/* --------------------------------------------------------------------------
   HELPER FUNCTIONS (Cognitive Complexity Reduction)
   -------------------------------------------------------------------------- */

const injectCharacterListSchema = (characters) => {
    try {
        const itemList = characters.map((char, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "item": {
                "@type": "Person",
                "name": char.name,
                "jobTitle": char.title,
                "image": char.image?.url,
                "url": new URL(`character-detail.html?slug=${char.slug.current}`, globalThis.location.origin).href
            }
        }));

        const schemaData = {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": "Personnel Database | The Sins of the Fathers",
            "description": "Classified directory of all known operatives, assets, and targets.",
            "mainEntity": {
                "@type": "ItemList",
                "itemListElement": itemList
            }
        };
        injectSchema(schemaData);
        console.log("> SEO Protocol: Character List Schema Injected.");
    } catch (e) {
        console.warn("Schema Error:", e);
    }
};

const renderCharacterCards = (characters, containers) => {
    if (containers.protagonists) containers.protagonists.innerHTML = '';
    if (containers.main) containers.main.innerHTML = '';
    if (containers.side) containers.side.innerHTML = '';

    characters.forEach((character) => {
        // Hardcoded Roland/Havi checks removed. Now using Schema field 'is_architect'.
        if (character.is_architect) {
            if (containers.protagonists) {
                containers.protagonists.appendChild(createProtagonistCard(character));
            }
        }
        else if (character.is_main) {
            if (containers.main) {
                containers.main.appendChild(createOperativeCard(character));
            }
        }
        else if (containers.side) {
            containers.side.appendChild(createAssetCard(character));
        }
    });

    Object.keys(containers).forEach(key => {
        const container = containers[key];
        if (container && container.children.length === 0) {
            container.innerHTML = `<p class="text-xs font-mono text-gray-600 col-span-full text-center">${i18next.t('characters_page.no_records_found')}</p>`;
        }
    });

    // Noir Motion Protocol: Reveal Cards
    gsap.to('.gsap-page-title', { opacity: 1, y: 0, duration: 1.5, ease: "expo.out" });
    gsap.to('.gsap-title-underline', { width: "100%", duration: 2, delay: 0.5, ease: "power4.inOut" });
    gsap.to('.gsap-page-subtitle', { opacity: 1, y: 0, duration: 1, delay: 1, stagger: 0.2 });

    NoirEffects.revealCard('.opacity-0', 0.1, {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 1.2,
        ease: "power4.out"
    });
};

/* --------------------------------------------------------------------------
   MAIN LOGIC
   -------------------------------------------------------------------------- */
export default async function (container, props) {
    const containers = {
        protagonists: container.querySelector('#protagonists-gallery'),
        main: container.querySelector('#main-characters-gallery'),
        side: container.querySelector('#side-characters-gallery')
    };

    if (!containers.main && !containers.protagonists) return;

    try {
        console.log("> Accessing Personnel Database...");

        const query = `*[_type == "character"] | order(name asc) {
            name, title, alias, slug, 
            "image": image.asset->{ url, "blurHash": metadata.blurHash }, 
            is_main,
            is_architect
        }`;

        const characters = await client.fetch(query);

        if (characters && characters.length > 0) {
            injectCharacterListSchema(characters);
            renderCharacterCards(characters, containers);
        } else if (containers.main) {
            containers.main.innerHTML = '<p class="text-red-500 font-mono">DATABASE CONNECTION FAILED.</p>';
        }
    }
    catch (error) {
        console.error("Data Malfunction: ", error);
        if (containers.main) containers.main.innerHTML = '<p class="text-red-500 animate-pulse">CRITICAL ERROR: CANNOT RETRIEVE DOSSIERS.</p>';
    }
}