import{c as d}from"./sanityClient-DzZXYHaN.js";import s from"https://esm.sh/i18next@23.7.6";import"https://esm.sh/i18next-http-backend@2.4.1";import"https://esm.sh/i18next-browser-languagedetector@7.2.0";import{i as p}from"./seo-DYcZ_Lxp.js";import{g as l,S as m}from"./main-CoGTBBld.js";import"https://esm.sh/@sanity/client@6.22.0";import"https://esm.sh/@sanity/image-url@1.1.0";import"https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";import"https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";import"https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";import"https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";import"https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";import"https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";import"https://www.gstatic.com/firebasejs/10.12.2/firebase-app-check.js";l.registerPlugin(m);const f=t=>{const e=t.type==="syndicate",r=e?"old-world":"new-world",a=t.color?.hex||(e?"#b91c1c":"#c5a059"),o=e?"fa-skull-crossbones":"fa-chess-king",n=t.leader&&t.leader.name?t.leader.name:s.t("factions.unknown"),c=e?`
        <div>
            <div class="flex justify-between text-[10px] font-mono text-gray-500 mb-1">
                <span>${s.t("factions.stat_brutality")}</span> <span>95%</span>
            </div>
            <div class="w-full h-1 bg-gray-900"><div class="h-1 bg-red-800 w-[95%] shadow-[0_0_5px_red]"></div></div>
        </div>
        <div>
            <div class="flex justify-between text-[10px] font-mono text-gray-500 mb-1">
                <span>${s.t("factions.stat_chaos")}</span> <span>80%</span>
            </div>
            <div class="w-full h-1 bg-gray-900"><div class="h-1 bg-red-800 w-[80%]"></div></div>
        </div>
    `:`
        <div>
            <div class="flex justify-between text-[10px] font-mono text-gray-500 mb-1">
                <span>${s.t("factions.stat_influence")}</span> <span>98%</span>
            </div>
            <div class="w-full h-1 bg-gray-900"><div class="h-1 bg-gold w-[98%] shadow-[0_0_5px_gold]"></div></div>
        </div>
        <div>
            <div class="flex justify-between text-[10px] font-mono text-gray-500 mb-1">
                <span>${s.t("factions.stat_resources")}</span> <span>100%</span>
            </div>
            <div class="w-full h-1 bg-gray-900"><div class="h-1 bg-gold w-[100%]"></div></div>
        </div>
    `,i=document.createElement("a");return i.href=`faction-detail.html?slug=${t.slug}`,i.className=`gsap-faction-card opacity-0 ${r} p-8 relative group min-h-[400px] flex flex-col justify-between rounded-sm transition-transform duration-300 hover:-translate-y-1`,i.innerHTML=`
        <div class="absolute -right-6 -top-6 text-[10rem] opacity-5 pointer-events-none select-none" style="color: ${a}">
            <i class="fas ${o}"></i>
        </div>

        <div>
             <h3 class="text-3xl mb-1 uppercase tracking-wide" style="color:${e?"#b91c1c":"#c5a059"}">
                ${t.title}
             </h3>
             
             <p class="text-xs font-mono text-gray-600 uppercase mb-6 tracking-widest flex items-center gap-2">
                <i class="fas fa-circle text-[6px]" style="color:${a}"></i>
                ${t.type||s.t("factions.default_type")}
             </p>
             
             <div class="h-px w-12 mb-6 opacity-50" style="background-color:${a}"></div>
             
             <p class="text-gray-400 text-sm leading-relaxed line-clamp-4 font-sans">
                 ${t.summary||t.motto||s.t("factions.details_classified")}
             </p>
        </div>
        
        <div class="space-y-6 mt-8">
             ${c}
        </div>
        
        <div class="mt-8 border-t border-white/5 pt-4 flex items-center justify-between text-xs font-mono" style="color:${a}">
            <span><i class="fas fa-user-tie mr-2"></i>${n.toUpperCase()}</span>
            <span class="border border-current px-2 py-0.5 rounded-[1px] hover:bg-white/5">${s.t("factions.view_intel")}</span>
        </div>
    `,i};async function C(){const t=document.getElementById("factions-grid"),e=document.getElementById("factions-loader");if(t)try{console.log("> Accessing Faction Database...");const a=await d.fetch(`*[_type == "faction"] | order(title asc) {
            title, 
            "slug": slug.current, 
            motto,
            summary,
            type,
            color, 
            "hqLocation": hq,
            leader->{name}
        }`);if(a&&a.length>0){try{const o=a.map((c,i)=>({"@type":"ListItem",position:i+1,item:{"@type":"Organization",name:c.title,url:new URL(`faction-detail.html?slug=${c.slug}`,window.location.origin).href}})),n={"@context":"https://schema.org","@type":"CollectionPage",name:s.t("factions.meta_title")||"Factions Database | TSOF",description:s.t("factions.meta_desc")||"List of all organizations and syndicates in the Ballantine Network.",mainEntity:{"@type":"ItemList",itemListElement:o}};p(n),console.log("> SEO Protocol: Faction List Schema Injected.")}catch(o){console.warn("Schema Error:",o)}e&&(e.style.display="none"),t.innerHTML="",t.classList.remove("opacity-0"),a.forEach(o=>{const n=f(o);t.appendChild(n)}),t.children.length>0&&l.to(".gsap-faction-card",{y:0,opacity:1,duration:.8,stagger:.15,startAt:{y:50,opacity:0},ease:"power2.out",scrollTrigger:{trigger:t,start:"top 85%"}})}else e&&(e.style.display="none"),t.innerHTML=`
                <div class="col-span-full text-center py-20 border border-red-900/30 bg-red-900/10">
                    <i class="fas fa-ban text-3xl text-red-800 mb-4"></i>
                    <p class="text-red-500 font-mono uppercase">${s.t("factions.no_factions_found")}</p>
                </div>`}catch(r){console.error("Intel Retrieval Failed: ",r),e&&(e.style.display="none"),t.innerHTML=`<p class="text-red-500 text-center font-mono col-span-full">${s.t("factions.error_connection")}</p>`}}export{C as displayFactions};
