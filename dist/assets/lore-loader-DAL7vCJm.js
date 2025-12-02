import{c as v}from"./sanityClient-DzZXYHaN.js";import{r as b,h as m}from"./imageUtils-LD6ZRw5p.js";import r from"https://esm.sh/i18next@23.7.6";import"https://esm.sh/i18next-http-backend@2.4.1";import"https://esm.sh/i18next-browser-languagedetector@7.2.0";import{i as y}from"./seo-DYcZ_Lxp.js";import{g as d,S as u}from"./main-CoGTBBld.js";import"https://esm.sh/@sanity/client@6.22.0";import"https://esm.sh/@sanity/image-url@1.1.0";import"https://esm.sh/blurhash@2.0.5";import"https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";import"https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";import"https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";import"https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";import"https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";import"https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";import"https://www.gstatic.com/firebasejs/10.12.2/firebase-app-check.js";d.registerPlugin(u);let p=[];const x=e=>`
    <div class="gsap-archive-card opacity-0 archive-card bg-[#e6e2d3] text-black p-6 rounded-sm shadow-lg relative overflow-hidden group h-fit break-inside-avoid">
        <div class="absolute top-2 right-2 border border-red-900 text-red-900 text-[10px] font-bold px-2 py-0.5 transform rotate-12 opacity-70">DOC_${e._createdAt?e._createdAt.slice(0,4):"2025"}</div>
        <h3 class="font-mono font-bold text-lg mb-2 uppercase underline decoration-red-800 decoration-2 tracking-tighter">
            <a href="lore-detail.html?slug=${e.slug}" class="hover:text-red-900">${e.title}</a>
        </h3>
        <p class="font-serif text-xs italic mb-4 opacity-80 border-b border-black/10 pb-2">
            Source: ${e.source||r.t("lore_loader.unknown_source")}
        </p>
        <div class="font-mono text-xs leading-relaxed opacity-90 mb-4 line-clamp-4">
            ${e.summary||r.t("lore_loader.content_pending")}
        </div>
        <a href="lore-detail.html?slug=${e.slug}" class="block text-right text-[10px] font-bold uppercase tracking-widest hover:text-red-700 transition-colors">
            ${r.t("lore_loader.access_file")} &rarr;
        </a>
    </div>
`,w=e=>`
    <div class="gsap-archive-card opacity-0 archive-card bg-gray-900 border-l-4 border-gold p-5 shadow-lg h-fit break-inside-avoid group">
        <div class="flex items-center justify-between mb-4">
            <h3 class="text-gold font-mono text-sm uppercase truncate w-2/3">
                <i class="fas fa-microphone-alt mr-2"></i> ${e.title}
            </h3>
            <span class="text-[9px] text-gray-600 font-mono border border-gray-700 px-1">REC</span>
        </div>
        <div class="flex items-center space-x-1 h-6 mb-4 opacity-60 group-hover:opacity-100 transition-opacity">
            <div class="w-1 bg-gold h-3"></div><div class="w-1 bg-gold h-5"></div><div class="w-1 bg-gold h-full animate-pulse"></div>
            <div class="w-1 bg-gold h-4"></div><div class="w-1 bg-gold h-2"></div><div class="w-1 bg-gold h-5"></div>
            <div class="w-1 bg-gray-700 h-px flex-grow"></div>
        </div>
        <p class="text-xs text-gray-400 font-mono mb-4 line-clamp-2">${e.summary||r.t("lore_loader.encrypted_audio")}</p>
        <a href="lore-detail.html?slug=${e.slug}" class="block w-full border border-gray-700 py-2 text-[10px] text-center text-white hover:bg-gold hover:text-black hover:border-gold transition-all uppercase font-mono tracking-wider">
            ${r.t("lore_loader.play_transmission")}
        </a>
    </div>
`,_=e=>`
    <div class="gsap-archive-card opacity-0 archive-card bg-black border border-red-900/40 relative overflow-hidden group h-fit break-inside-avoid cursor-not-allowed">
        <div class="p-6 filter blur-sm opacity-30 select-none pointer-events-none">
            <h3 class="text-white font-serif text-xl mb-2">${e.title}</h3>
            <p class="text-gray-400 text-sm font-mono">${e.summary||r.t("lore_loader.redacted")}</p>
            <div class="mt-4 h-20 bg-gray-800 w-full"></div>
        </div>

        <div class="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-[1px] group-hover:bg-black/30 transition-colors z-10">
            <div class="border-2 border-red-600 rounded-full p-3 mb-2 shadow-[0_0_15px_rgba(220,38,38,0.5)] bg-black">
                <i class="fas fa-lock text-xl text-red-500"></i>
            </div>
            <span class="text-red-500 font-mono text-xs uppercase font-bold tracking-widest mb-1">${r.t("lore_loader.classified")}</span>
            <a href="login.html?redirect=lore" class="mt-3 px-4 py-1 bg-red-900/20 text-white text-[9px] border border-red-800 hover:bg-red-900 hover:border-red-500 transition uppercase font-mono">
                ${r.t("lore_loader.clearance_required")}
            </a>
        </div>
    </div>
`,k=e=>{const t=e.image?.url||"https://via.placeholder.com/400",o=e.image?.blurHash,a=e.date?new Date(e.date).toLocaleDateString(r.language):r.t("lore_loader.no_date"),l=document.createElement("div");l.className="gsap-archive-card opacity-0 archive-card bg-white p-3 shadow-lg h-fit break-inside-avoid hover:rotate-1 transition-transform duration-300",l.innerHTML=`
        <a href="lore-detail.html?slug=${e.slug}" class="block group">
            <div class="relative w-full aspect-video bg-gray-200 overflow-hidden border border-gray-300">
                <canvas class="blur-canvas absolute inset-0 w-full h-full object-cover z-0"></canvas>
                <img src="${t}" class="main-image relative w-full h-full object-cover grayscale contrast-125 opacity-0 transition-all duration-700 z-10" loading="lazy" alt="Evidence">
                <div class="absolute bottom-2 right-2 text-black font-bold text-[8px] px-1 rotate-[-5deg] opacity-60 font-mono z-20 bg-white/50">
                    ${a}
                </div>
            </div>
            <div class="pt-3 pb-1 px-1">
                <h3 class="font-mono text-xs text-black uppercase truncate font-bold group-hover:text-red-800 transition-colors">${e.title}</h3>
                <p class="text-[9px] text-gray-600 mt-1 line-clamp-2 font-sans leading-tight">${e.summary||""}</p>
            </div>
        </a>
    `;const i=l.querySelector(".blur-canvas"),s=l.querySelector(".main-image");return o&&i&&b(i,o),s&&(s.complete?m(s,i):s.onload=()=>m(s,i)),l},$=e=>{if(e.restricted)return _(e);switch(e.loreType||"document"){case"audio":return w(e);case"image":return k(e);default:return x(e)}},h=e=>{const t=document.getElementById("archive-grid");if(t){if(t.innerHTML="",e.length===0){t.innerHTML=`<div class="col-span-full text-center text-gray-500 font-mono py-12">${r.t("lore_loader.no_records_query")}</div>`;return}e.forEach(o=>{const a=$(o);typeof a=="string"?t.insertAdjacentHTML("beforeend",a):t.appendChild(a)}),u.getAll().forEach(o=>o.kill()),d.to(".gsap-archive-card",{y:0,opacity:1,duration:.5,stagger:.05,ease:"power2.out",startAt:{y:30,opacity:0},scrollTrigger:{trigger:t,start:"top 90%",toggleActions:"play none none none"}})}};async function G(){const e=document.getElementById("archive-grid"),t=document.getElementById("archive-loader");if(!e)return;const o=document.getElementById("archive-search");o&&(o.placeholder=r.t("search.placeholder")),d.set(e,{autoAlpha:0});try{console.log("> Accessing Archives...");const a=r.language||"en",s=`*[_type == "lore"] | order(date desc) {
            _id,
            _createdAt,
            "title": coalesce(${a==="tr"?"title_tr":"title_en"}, title_en), 
            "summary": coalesce(${a==="tr"?"summary_tr":"summary_en"}, summary_en),
            "slug": slug.current,
            "loreType": loreType,
            "restricted": restricted,
            "image": mainImage.asset->{
                url,
                "blurHash": metadata.blurHash
            },
            "date": date,
            source
        }`;p=await v.fetch(s);try{const c=p.map((n,f)=>({"@type":"ListItem",position:f+1,item:{"@type":"DigitalDocument",name:n.title,description:n.summary,datePublished:n.date,url:new URL(`lore-detail.html?slug=${n.slug}`,window.location.origin).href}})),g={"@context":"https://schema.org","@type":"CollectionPage",name:r.t("archive_page.meta_title")||"Classified Archives",description:"Directory of all known lore and evidence.",mainEntity:{"@type":"ItemList",itemListElement:c}};y(g)}catch(c){console.warn("Schema Error:",c)}t&&(t.style.display="none"),d.to(e,{autoAlpha:1,duration:.3}),h(p),L()}catch(a){console.error("Archive Corrupted:",a),t&&(t.innerHTML=`<span class="text-red-500 font-mono">${r.t("lore_loader.system_error_short")}</span>`),e.innerHTML=`<p class="text-red-500 text-center col-span-full">${r.t("lore_loader.connection_failed_long")}</p>`,d.to(e,{autoAlpha:1})}}function L(){const e=document.getElementById("archive-search"),t=document.querySelectorAll("#archive-filters button"),o=()=>{const a=e?e.value.toLowerCase():"",l=document.querySelector("#archive-filters button.border-gold"),i=l?l.getAttribute("data-filter"):"all",s=p.filter(c=>{const g=(c.title||"").toLowerCase().includes(a)||(c.summary||"").toLowerCase().includes(a);let n=!0;return i==="text"&&(n=c.loreType==="document"||!c.loreType),i==="audio"&&(n=c.loreType==="audio"),i==="classified"&&(n=c.restricted===!0),g&&n});h(s)};e&&e.addEventListener("input",o),t&&t.forEach(a=>{a.addEventListener("click",l=>{t.forEach(s=>{s.classList.remove("bg-gold/10","text-gold","font-bold","border-gold"),s.classList.add("text-gray-500","border-gray-700")});const i=l.target.closest("button");i.classList.remove("text-gray-500","border-gray-700"),i.classList.add("bg-gold/10","text-gold","font-bold","border-gold"),o()})})}export{G as displayLoreList};
