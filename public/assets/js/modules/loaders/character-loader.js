import { client } from '../../lib/sanityClient.js';

/* --------------------------------------------------------------------------
   CARD TEMPLATES (NOIR STYLE)
   -------------------------------------------------------------------------- */

const createProtagonistCard = (character) => {
    const cardLink = document.createElement('a');
    cardLink.href = `character-detail.html?slug=${character.slug.current}`;
    cardLink.className = 'group relative w-full h-[500px] overflow-hidden border border-white/10 bg-obsidian hover:border-gold transition-all duration-700 block shadow-2xl';

    const imageUrl = character.imageUrl || 'https://placehold.co/600x800/0a0a0a/333333?text=CLASSIFIED';

    cardLink.innerHTML = `
        <!-- Image with Grayscale Effect -->
        <img src="${imageUrl}" alt="${character.name}" 
             class="absolute inset-0 w-full h-full object-cover opacity-60 grayscale group-hover:grayscale-0 group-hover:scale-105 group-hover:opacity-100 transition-all duration-1000 ease-out">
        
        <!-- Gradient Overlay -->
        <div class="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>
        
        <!-- Content (Bottom Aligned) -->
        <div class="absolute bottom-0 left-0 w-full p-8 z-10">
            <div class="h-px w-12 bg-gold mb-4 transition-all group-hover:w-full duration-700"></div>
            <p class="font-mono text-gold text-xs uppercase tracking-[0.2em] mb-1">${character.alias || 'The Architect'}</p>
            <h3 class="font-serif text-4xl md:text-5xl text-white uppercase tracking-wide drop-shadow-lg group-hover:text-gold transition-colors">${character.name}</h3>
        </div>
        
        <!-- Corner Decoration -->
        <div class="absolute top-4 right-4 text-xs font-mono text-white/30 border border-white/20 px-2 py-1 group-hover:text-gold group-hover:border-gold transition-colors">
             TARGET_ALPHA
        </div>
    `;
    return cardLink;
};

const createOperativeCard = (character) => {
    const cardLink = document.createElement('a');
    cardLink.href = `character-detail.html?slug=${character.slug.current}`;
    cardLink.className = 'group block bg-white/5 border border-white/10 hover:border-white/40 hover:-translate-y-1 transition-all duration-300 shadow-lg';

    const imageUrl = character.imageUrl || 'https://placehold.co/400x500/0a0a0a/333?text=IMG_MISSING';

    cardLink.innerHTML = `
        <div class="relative aspect-[3/4] overflow-hidden border-b border-white/5">
            <img src="${imageUrl}" alt="${character.name}" class="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500">
            <div class="absolute inset-0 border-2 border-transparent group-hover:border-gold/20 transition-all"></div>
        </div>
        <div class="p-5">
            <h3 class="font-serif text-xl text-white mb-1 group-hover:text-gold transition-colors">${character.name}</h3>
            <p class="font-mono text-xs text-gray-500 uppercase tracking-widest">${character.title || 'Associate'}</p>
        </div>
    `;
    return cardLink;
};

const createAssetCard = (character) => {
    const cardLink = document.createElement('a');
    cardLink.href = `character-detail.html?slug=${character.slug.current}`;
    cardLink.className = 'group flex items-center space-x-4 p-3 border border-white/5 bg-black/40 hover:bg-white/5 hover:border-red-900/50 transition-all duration-300';

    const imageUrl = character.imageUrl || 'https://ui-avatars.com/api/?background=333&color=fff&name=' + character.name;

    cardLink.innerHTML = `
        <div class="w-12 h-12 overflow-hidden rounded-sm border border-gray-700 group-hover:border-red-800">
            <img src="${imageUrl}" class="w-full h-full object-cover grayscale">
        </div>
        <div>
            <h4 class="font-mono text-sm text-gray-300 group-hover:text-white uppercase tracking-wide">${character.name}</h4>
            <p class="text-[10px] text-gray-600 group-hover:text-red-500 transition-colors font-mono">${character.title || 'Known Asset'}</p>
        </div>
    `;
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
            "imageUrl": image.asset->url, 
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
                    container.innerHTML = '<p class="text-xs font-mono text-gray-600 col-span-full text-center">// No records found in this clearance level.</p>';
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