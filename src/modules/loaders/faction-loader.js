import { client } from '../../lib/sanityClient.js';
import i18next from '../../lib/i18n.js';
// 👇 SEO İMPORTU
import { injectSchema } from '../../lib/seo.js';

// 👇 1. GSAP IMPORTLARI
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Plugin'i kaydet
gsap.registerPlugin(ScrollTrigger);

/* --------------------------------------------------------------------------
   CARD BUILDER LOGIC
   -------------------------------------------------------------------------- */
const createFactionCard = (faction) => {
    const isOldWorld = faction.type === 'syndicate';
    
    const cardThemeClass = isOldWorld ? 'old-world' : 'new-world';
    const accentColor = faction.color?.hex || (isOldWorld ? '#b91c1c' : '#c5a059');
    const iconClass = isOldWorld ? 'fa-skull-crossbones' : 'fa-chess-king';
    
    const leaderName = (faction.leader && faction.leader.name) ? faction.leader.name : i18next.t('factions.unknown');

    const statsHTML = isOldWorld ? `
        <div>
            <div class="flex justify-between text-[10px] font-mono text-gray-500 mb-1">
                <span>${i18next.t('factions.stat_brutality')}</span> <span>95%</span>
            </div>
            <div class="w-full h-1 bg-gray-900"><div class="h-1 bg-red-800 w-[95%] shadow-[0_0_5px_red]"></div></div>
        </div>
        <div>
            <div class="flex justify-between text-[10px] font-mono text-gray-500 mb-1">
                <span>${i18next.t('factions.stat_chaos')}</span> <span>80%</span>
            </div>
            <div class="w-full h-1 bg-gray-900"><div class="h-1 bg-red-800 w-[80%]"></div></div>
        </div>
    ` : `
        <div>
            <div class="flex justify-between text-[10px] font-mono text-gray-500 mb-1">
                <span>${i18next.t('factions.stat_influence')}</span> <span>98%</span>
            </div>
            <div class="w-full h-1 bg-gray-900"><div class="h-1 bg-gold w-[98%] shadow-[0_0_5px_gold]"></div></div>
        </div>
        <div>
            <div class="flex justify-between text-[10px] font-mono text-gray-500 mb-1">
                <span>${i18next.t('factions.stat_resources')}</span> <span>100%</span>
            </div>
            <div class="w-full h-1 bg-gray-900"><div class="h-1 bg-gold w-[100%]"></div></div>
        </div>
    `;

    const cardLink = document.createElement('a');
    cardLink.href = `faction-detail.html?slug=${faction.slug}`;
    
    // 👇 GSAP SEÇİCİSİ ('gsap-faction-card') ve 'opacity-0' EKLENDİ
    // opacity-0 ekledik ki animasyon başlamadan önce görünmesinler.
    cardLink.className = `gsap-faction-card opacity-0 ${cardThemeClass} p-8 relative group min-h-[400px] flex flex-col justify-between rounded-sm transition-transform duration-300 hover:-translate-y-1`;

    cardLink.innerHTML = `
        <div class="absolute -right-6 -top-6 text-[10rem] opacity-5 pointer-events-none select-none" style="color: ${accentColor}">
            <i class="fas ${iconClass}"></i>
        </div>

        <div>
             <h3 class="text-3xl mb-1 uppercase tracking-wide" style="color:${isOldWorld ? '#b91c1c' : '#c5a059'}">
                ${faction.title}
             </h3>
             
             <p class="text-xs font-mono text-gray-600 uppercase mb-6 tracking-widest flex items-center gap-2">
                <i class="fas fa-circle text-[6px]" style="color:${accentColor}"></i>
                ${faction.type || i18next.t('factions.default_type')}
             </p>
             
             <div class="h-px w-12 mb-6 opacity-50" style="background-color:${accentColor}"></div>
             
             <p class="text-gray-400 text-sm leading-relaxed line-clamp-4 font-sans">
                 ${faction.summary || faction.motto || i18next.t('factions.details_classified')}
             </p>
        </div>
        
        <div class="space-y-6 mt-8">
             ${statsHTML}
        </div>
        
        <div class="mt-8 border-t border-white/5 pt-4 flex items-center justify-between text-xs font-mono" style="color:${accentColor}">
            <span><i class="fas fa-user-tie mr-2"></i>${leaderName.toUpperCase()}</span>
            <span class="border border-current px-2 py-0.5 rounded-[1px] hover:bg-white/5">${i18next.t('factions.view_intel')}</span>
        </div>
    `;
    
    return cardLink;
};

/* --------------------------------------------------------------------------
   MAIN EXECUTION
   -------------------------------------------------------------------------- */
export async function displayFactions() {
    const factionsGrid = document.getElementById('factions-grid');
    const loader = document.getElementById('factions-loader'); 

    if (!factionsGrid) return; 

    try {
        console.log("> Accessing Faction Database...");
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

        if (factions && factions.length > 0) {
            
            // SEO / SCHEMA
            try {
                const itemList = factions.map((faction, index) => ({
                    "@type": "ListItem",
                    "position": index + 1,
                    "item": {
                        "@type": "Organization",
                        "name": faction.title,
                        "url": new URL(`faction-detail.html?slug=${faction.slug}`, window.location.origin).href
                    }
                }));

                const schemaData = {
                    "@context": "https://schema.org",
                    "@type": "CollectionPage",
                    "name": i18next.t('factions.meta_title') || "Factions Database | TSOF",
                    "description": i18next.t('factions.meta_desc') || "List of all organizations and syndicates in the Ballantine Network.",
                    "mainEntity": {
                        "@type": "ItemList",
                        "itemListElement": itemList
                    }
                };
                injectSchema(schemaData);
                console.log("> SEO Protocol: Faction List Schema Injected.");
            } catch (e) {
                console.warn("Schema Error:", e);
            }
            // -----------------------------------------------------

            if(loader) loader.style.display = 'none';
            factionsGrid.innerHTML = '';
            factionsGrid.classList.remove('opacity-0'); 

            factions.forEach((faction) => {
                const card = createFactionCard(faction);
                factionsGrid.appendChild(card);
            });

            // 👇 2. GSAP ANİMASYONU (KARTLAR EKLENDİKTEN SONRA)
            // ----------------------------------------------------------------
            if (factionsGrid.children.length > 0) {
                gsap.to(".gsap-faction-card", {
                    y: 0,
                    opacity: 1,
                    duration: 0.8,
                    stagger: 0.15, // Kartlar 0.15sn arayla gelsin (Domino etkisi)
                    startAt: { y: 50, opacity: 0 }, // Başlangıçta 50px aşağıda ve görünmez olsun
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: factionsGrid,
                        start: "top 85%", // Grid ekranın %85'ine gelince başla
                    }
                });
            }

        } else {
            if(loader) loader.style.display = 'none';
            factionsGrid.innerHTML = `
                <div class="col-span-full text-center py-20 border border-red-900/30 bg-red-900/10">
                    <i class="fas fa-ban text-3xl text-red-800 mb-4"></i>
                    <p class="text-red-500 font-mono uppercase">${i18next.t('factions.no_factions_found')}</p>
                </div>`;
        }
    } catch (error) {
        console.error("Intel Retrieval Failed: ", error);
        if(loader) loader.style.display = 'none';
        factionsGrid.innerHTML = `<p class="text-red-500 text-center font-mono col-span-full">${i18next.t('factions.error_connection')}</p>`;
    }
}