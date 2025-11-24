import { client } from '../../lib/sanityClient.js';

/* --------------------------------------------------------------------------
   CARD BUILDER LOGIC
   -------------------------------------------------------------------------- */
const createFactionCard = (faction) => {
    // 1. Stil ve Tip Belirleme
    // "syndicate" -> Old World (Kırmızı/Kaos)
    // "corporation" -> New World (Altın/Düzen)
    const isOldWorld = faction.type === 'syndicate';
    
    const cardThemeClass = isOldWorld ? 'old-world' : 'new-world';
    const accentColor = faction.color?.hex || (isOldWorld ? '#b91c1c' : '#c5a059');
    const iconClass = isOldWorld ? 'fa-skull-crossbones' : 'fa-chess-king';
    
    // Leader Check
    const leaderName = (faction.leader && faction.leader.name) ? faction.leader.name : 'UNKNOWN';

    // 2. Stat Simülasyonu (Eğer Sanity'de sayısal veri yoksa tipe göre uyduruyoruz)
    // Bu sayede kartlar dolu gözüküyor.
    const statsHTML = isOldWorld ? `
        <div>
            <div class="flex justify-between text-[10px] font-mono text-gray-500 mb-1"><span>BRUTALITY</span> <span>95%</span></div>
            <div class="w-full h-1 bg-gray-900"><div class="h-1 bg-red-800 w-[95%] shadow-[0_0_5px_red]"></div></div>
        </div>
        <div>
            <div class="flex justify-between text-[10px] font-mono text-gray-500 mb-1"><span>CHAOS</span> <span>80%</span></div>
            <div class="w-full h-1 bg-gray-900"><div class="h-1 bg-red-800 w-[80%]"></div></div>
        </div>
    ` : `
        <div>
            <div class="flex justify-between text-[10px] font-mono text-gray-500 mb-1"><span>INFLUENCE</span> <span>98%</span></div>
            <div class="w-full h-1 bg-gray-900"><div class="h-1 bg-gold w-[98%] shadow-[0_0_5px_gold]"></div></div>
        </div>
        <div>
            <div class="flex justify-between text-[10px] font-mono text-gray-500 mb-1"><span>RESOURCES</span> <span>100%</span></div>
            <div class="w-full h-1 bg-gray-900"><div class="h-1 bg-gold w-[100%]"></div></div>
        </div>
    `;

    // 3. Element Oluşturma
    const cardLink = document.createElement('a');
    cardLink.href = `faction-detail.html?slug=${faction.slug}`;
    // CSS'te tanımladığımız sınıfları ekliyoruz
    cardLink.className = `faction-card ${cardThemeClass} p-8 relative group min-h-[400px] flex flex-col justify-between rounded-sm transition-transform duration-300 hover:-translate-y-1`;

    // 4. İçerik (HTML Injection)
    cardLink.innerHTML = `
        <!-- Background Icon Watermark -->
        <div class="absolute -right-6 -top-6 text-[10rem] opacity-5 pointer-events-none select-none" style="color: ${accentColor}">
            <i class="fas ${iconClass}"></i>
        </div>

        <div>
             <h3 class="text-3xl mb-1 uppercase tracking-wide" style="color:${isOldWorld ? '#b91c1c' : '#c5a059'}">
                ${faction.title}
             </h3>
             
             <p class="text-xs font-mono text-gray-600 uppercase mb-6 tracking-widest flex items-center gap-2">
                <i class="fas fa-circle text-[6px]" style="color:${accentColor}"></i>
                ${faction.type || 'Organization'}
             </p>
             
             <div class="h-px w-12 mb-6 opacity-50" style="background-color:${accentColor}"></div>
             
             <p class="text-gray-400 text-sm leading-relaxed line-clamp-4 font-sans">
                 ${faction.summary || faction.motto || 'Details classified.'}
             </p>
        </div>
        
        <div class="space-y-6 mt-8">
             <!-- Stats Block -->
             ${statsHTML}
        </div>
        
        <div class="mt-8 border-t border-white/5 pt-4 flex items-center justify-between text-xs font-mono" style="color:${accentColor}">
            <span><i class="fas fa-user-tie mr-2"></i>${leaderName.toUpperCase()}</span>
            <span class="border border-current px-2 py-0.5 rounded-[1px] hover:bg-white/5">VIEW INTEL</span>
        </div>
    `;
    
    return cardLink;
};

/* --------------------------------------------------------------------------
   MAIN EXECUTION
   -------------------------------------------------------------------------- */
export async function displayFactions() {
    const factionsGrid = document.getElementById('factions-grid');
    const loader = document.getElementById('factions-loader'); // Dönen radar

    if (!factionsGrid) return; // Yanlış sayfadayız

    try {
        // 1. Veri Çek (title, leader referansını aç, tip, renk ve lokasyon)
        const query = `*[_type == "faction"] | order(title asc) {
            title, 
            "slug": slug.current, 
            motto,
            summary,
            type,
            color, 
            "hqLocation": hq,
            leader->{name}
        }`;
        
        const factions = await client.fetch(query);

        // 2. Loader'ı gizle ve Grid'i temizle
        if(loader) loader.style.display = 'none';
        factionsGrid.innerHTML = '';
        factionsGrid.classList.remove('opacity-0'); // CSS Fade-in

        if (factions && factions.length > 0) {
            factions.forEach((faction) => {
                const card = createFactionCard(faction);
                factionsGrid.appendChild(card);
            });
        } else {
            factionsGrid.innerHTML = `
                <div class="col-span-full text-center py-20 border border-red-900/30 bg-red-900/10">
                    <i class="fas fa-ban text-3xl text-red-800 mb-4"></i>
                    <p class="text-red-500 font-mono uppercase">No Active Factions Found in Database.</p>
                </div>`;
        }
    } catch (error) {
        console.error("Intel Retrieval Failed: ", error);
        if(loader) loader.style.display = 'none';
        factionsGrid.innerHTML = '<p class="text-red-500 text-center font-mono col-span-full">CRITICAL ERROR: CONNECTION SEVERED.</p>';
    }
}