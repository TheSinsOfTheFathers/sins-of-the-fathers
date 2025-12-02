import{c as m}from"./sanityClient-DzZXYHaN.js";import{r as c,h as n}from"./imageUtils-LD6ZRw5p.js";import p from"https://esm.sh/i18next@23.7.6";import"https://esm.sh/i18next-http-backend@2.4.1";import"https://esm.sh/i18next-browser-languagedetector@7.2.0";import{i as g}from"./seo-DYcZ_Lxp.js";import{g as u}from"./main-CoGTBBld.js";import"https://esm.sh/@sanity/client@6.22.0";import"https://esm.sh/@sanity/image-url@1.1.0";import"https://esm.sh/blurhash@2.0.5";import"https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";import"https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";import"https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";import"https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";import"https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";import"https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";import"https://www.gstatic.com/firebasejs/10.12.2/firebase-app-check.js";const h=e=>{const a=document.createElement("a");a.href=`character-detail.html?slug=${e.slug.current}`,a.className="group relative w-full h-[500px] overflow-hidden border border-white/10 bg-obsidian hover:border-gold transition-all duration-700 block shadow-2xl opacity-0";const s=e.image?.url||"https://placehold.co/600x800/0a0a0a/333333?text=CLASSIFIED",i=e.image?.blurHash,o=e.alias||"The Architect";a.innerHTML=`
        <canvas class="blur-canvas absolute inset-0 w-full h-full object-cover z-0"></canvas>
        <img src="${s}" alt="${e.name}" 
             class="main-image absolute inset-0 w-full h-full object-cover opacity-0 grayscale group-hover:grayscale-0 group-hover:scale-105 group-hover:opacity-100 transition-all duration-1000 ease-out z-10"
             loading="lazy">
        <div class="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent z-20 pointer-events-none"></div>
        <div class="absolute bottom-0 left-0 w-full p-8 z-30 pointer-events-none">
            <div class="h-px w-12 bg-gold mb-4 transition-all group-hover:w-full duration-700"></div>
            <p class="font-mono text-gold text-xs uppercase tracking-[0.2em] mb-1">${o}</p>
            <h3 class="font-serif text-4xl md:text-5xl text-white uppercase tracking-wide drop-shadow-lg group-hover:text-gold transition-colors">${e.name}</h3>
        </div>
        <div class="absolute top-4 right-4 text-xs font-mono text-white/30 border border-white/20 px-2 py-1 group-hover:text-gold group-hover:border-gold transition-colors z-30">
             TARGET_ALPHA
        </div>
    `;const r=a.querySelector(".blur-canvas"),t=a.querySelector(".main-image");return i&&r&&c(r,i),t&&(t.complete?n(t,r):t.onload=()=>n(t,r)),a},f=e=>{const a=document.createElement("a");a.href=`character-detail.html?slug=${e.slug.current}`,a.className="group block bg-white/5 border border-white/10 hover:border-white/40 hover:-translate-y-1 transition-all duration-300 shadow-lg opacity-0";const s=e.image?.url||"https://placehold.co/400x500/0a0a0a/333?text=IMG_MISSING",i=e.image?.blurHash,o=e.title||"Associate";a.innerHTML=`
        <div class="relative aspect-[3/4] overflow-hidden border-b border-white/5 bg-gray-900">
            <canvas class="blur-canvas absolute inset-0 w-full h-full object-cover z-0"></canvas>
            <img src="${s}" alt="${e.name}" 
                 class="main-image relative w-full h-full object-cover grayscale opacity-0 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500 z-10"
                 loading="lazy">
            <div class="absolute inset-0 border-2 border-transparent group-hover:border-gold/20 transition-all z-20 pointer-events-none"></div>
        </div>
        <div class="p-5">
            <h3 class="font-serif text-xl text-white mb-1 group-hover:text-gold transition-colors">${e.name}</h3>
            <p class="font-mono text-xs text-gray-500 uppercase tracking-widest">${o}</p>
        </div>
    `;const r=a.querySelector(".blur-canvas"),t=a.querySelector(".main-image");return i&&r&&c(r,i),t&&(t.complete?n(t,r):t.onload=()=>n(t,r)),a},v=e=>{const a=document.createElement("a");a.href=`character-detail.html?slug=${e.slug.current}`,a.className="group flex items-center space-x-4 p-3 border border-white/5 bg-black/40 hover:bg-white/5 hover:border-red-900/50 transition-all duration-300 opacity-0";const s=e.image?.url||"https://ui-avatars.com/api/?background=333&color=fff&name="+e.name,i=e.image?.blurHash,o=e.title||"Known Asset";a.innerHTML=`
        <div class="relative w-12 h-12 overflow-hidden rounded-sm border border-gray-700 group-hover:border-red-800 shrink-0 bg-gray-800">
            <canvas class="blur-canvas absolute inset-0 w-full h-full object-cover z-0"></canvas>
            <img src="${s}" 
                 class="main-image w-full h-full object-cover grayscale opacity-0 transition-opacity duration-300 z-10" 
                 alt="${e.name}"
                 loading="lazy">
        </div>
        <div class="min-w-0">
            <h4 class="font-mono text-sm text-gray-300 group-hover:text-white uppercase tracking-wide truncate">${e.name}</h4>
            <p class="text-[10px] text-gray-600 group-hover:text-red-500 transition-colors font-mono truncate">${o}</p>
        </div>
    `;const r=a.querySelector(".blur-canvas"),t=a.querySelector(".main-image");return i&&r&&c(r,i),t&&(t.complete?n(t,r):t.onload=()=>n(t,r)),a};async function N(){const e={protagonists:document.getElementById("protagonists-gallery"),main:document.getElementById("main-characters-gallery"),side:document.getElementById("side-characters-gallery")};if(!(!e.main&&!e.protagonists))try{console.log("> Accessing Personnel Database...");const s=await m.fetch(`*[_type == "character"] | order(name asc) {
            name, title, alias, slug, 
            "image": image.asset->{ url, "blurHash": metadata.blurHash }, 
            is_main
        }`);if(s&&s.length>0){try{const r={"@context":"https://schema.org","@type":"CollectionPage",name:"Personnel Database | The Sins of the Fathers",description:"Classified directory of all known operatives, assets, and targets.",mainEntity:{"@type":"ItemList",itemListElement:s.map((t,l)=>({"@type":"ListItem",position:l+1,item:{"@type":"Person",name:t.name,jobTitle:t.title,image:t.image?.url,url:new URL(`character-detail.html?slug=${t.slug.current}`,window.location.origin).href}}))}};g(r),console.log("> SEO Protocol: Character List Schema Injected.")}catch(o){console.warn("Schema Error:",o)}e.protagonists&&(e.protagonists.innerHTML=""),e.main&&(e.main.innerHTML=""),e.side&&(e.side.innerHTML=""),s.forEach(o=>{const r=(o.name||"").toLowerCase(),t=o.alias?o.alias.toLowerCase():"",l=r.includes("ruaraidh")||t.includes("exile"),d=r.includes("havi")||t.includes("bastard");l||d?e.protagonists&&e.protagonists.appendChild(h(o)):o.is_main?e.main&&e.main.appendChild(f(o)):e.side&&e.side.appendChild(v(o))}),Object.keys(e).forEach(o=>{const r=e[o];r&&r.children.length===0&&(r.innerHTML=`<p class="text-xs font-mono text-gray-600 col-span-full text-center">${p.t("characters_page.no_records_found")}</p>`)});const i=u.timeline();if(e.protagonists&&e.protagonists.children.length>0){const o=Array.from(e.protagonists.children);i.to(o,{opacity:1,y:0,startAt:{y:100,opacity:0},duration:1.2,stagger:.2,ease:"power3.out"})}if(e.main&&e.main.children.length>0){const o=Array.from(e.main.children);i.to(o,{opacity:1,y:0,scale:1,startAt:{y:50,opacity:0,scale:.95},duration:.6,stagger:.1,ease:"back.out(1.2)"},"-=0.8")}if(e.side&&e.side.children.length>0){const o=Array.from(e.side.children);i.to(o,{opacity:1,x:0,startAt:{x:-20,opacity:0},duration:.4,stagger:.05,ease:"power2.out"},"-=0.4")}}else e.main&&(e.main.innerHTML='<p class="text-red-500 font-mono">DATABASE CONNECTION FAILED.</p>')}catch(a){console.error("Data Malfunction: ",a),e.main&&(e.main.innerHTML='<p class="text-red-500 animate-pulse">CRITICAL ERROR: CANNOT RETRIEVE DOSSIERS.</p>')}}export{N as displayCharacters};
