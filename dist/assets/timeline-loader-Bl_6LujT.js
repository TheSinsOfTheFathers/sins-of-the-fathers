import{c as u,u as h}from"./sanityClient-DzZXYHaN.js";import i from"https://esm.sh/i18next@23.7.6";import"https://esm.sh/i18next-http-backend@2.4.1";import"https://esm.sh/i18next-browser-languagedetector@7.2.0";import{i as f}from"./seo-DYcZ_Lxp.js";import{g as c}from"./main-CoGTBBld.js";import"https://esm.sh/@sanity/client@6.22.0";import"https://esm.sh/@sanity/image-url@1.1.0";import"https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";import"https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";import"https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";import"https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";import"https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";import"https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";import"https://www.gstatic.com/firebasejs/10.12.2/firebase-app-check.js";const g=s=>{const a=[];return s.forEach(t=>{const d=t.title_en||i.t("timeline_loader.unknown_era");t.events&&Array.isArray(t.events)&&t.events.forEach(e=>{let o={year:"0000"};if(e.date){const l=e.date.split("-");o={year:l[0],month:l[1]||"",day:l[2]||""}}let r=null;e.image&&(r={url:h(e.image).url(),caption:e.caption||"",credit:e.credit||""});const p=`
                    <div class="font-lato text-gray-400">
                        ${e.text_en||""}
                    </div>
                `,n=`
                    <span class="text-gold font-serif tracking-wide uppercase">
                        ${e.title_en||i.t("timeline_loader.untitled_event")}
                    </span>
                `;a.push({start_date:o,text:{headline:n,text:p},media:r,group:d,_raw_date:e.date})})}),{title:{text:{headline:i.t("timeline_loader.title_headline"),text:i.t("timeline_loader.title_text")},media:{url:"https://images.unsplash.com/photo-1533052379315-29e969401a49?q=80&w=2070&auto.format&fit=crop",caption:i.t("timeline_loader.title_media_caption"),credit:i.t("timeline_loader.title_media_credit")}},events:a}};async function k(){const s="timeline-embed",a=document.getElementById(s),t=document.getElementById("timeline-loading"),d=i.language.startsWith("tr")?"tr":"en";if(a){c.set(a,{autoAlpha:0,scale:.98});try{console.log("> Fetching Historical Data...");const o=await u.fetch(`*[_type == "timelineEra"] | order(order asc) {
            title_en,
            "events": events[] {
                title_en,
                text_en,
                date,
                caption,
                credit,
                image {
                    asset->{
                        url,
                        "blurHash": metadata.blurHash
                    }
                }
            }
        }`);if(o&&o.length>0){const r=g(o);try{const n=r.events.map((m,_)=>({"@type":"ListItem",position:_+1,item:{"@type":"Event",name:m.text.headline.replace(/<[^>]*>/g,"").trim(),description:m.text.text.replace(/<[^>]*>/g,"").trim(),startDate:m._raw_date,image:m.media?.url}})),l={"@context":"https://schema.org","@type":"CollectionPage",name:i.t("timeline_loader.meta_title"),description:i.t("timeline_loader.title_text").replace(/<[^>]*>/g,"").trim(),mainEntity:{"@type":"ItemList",itemListElement:n}};f(l),console.log("> SEO Protocol: Timeline Schema Injected.")}catch(n){console.warn("Schema Error:",n)}const p={font:null,marker_height_min:30,scale_factor:2,initial_zoom:2,timenav_position:"bottom",optimal_tick_width:100,lang:d};if(window.TL){window.timelineInstance=new TL.Timeline(s,r,p);const n=c.timeline();t&&n.to(t,{autoAlpha:0,duration:.6,ease:"power2.inOut",onComplete:()=>t.style.display="none"}),n.to(a,{autoAlpha:1,scale:1,duration:1.5,ease:"power3.out"},"-=0.2")}else throw new Error("TimelineJS library not loaded.")}else t&&(t.style.display="none"),a.innerHTML=`
                <div class="flex h-full items-center justify-center text-red-500 font-mono border border-red-900/30">
                    ${i.t("timeline_loader.archives_empty")}
                </div>`,c.to(a,{autoAlpha:1})}catch(e){console.error("Timeline Malfunction:",e),t&&(t.innerHTML=`<span class='text-red-500'>${i.t("timeline_loader.data_corruption")}</span>`),a&&(a.innerHTML=`<p class='text-center pt-20 text-red-800'>${i.t("timeline_loader.system_failure")}</p>`,c.to(a,{autoAlpha:1}))}}}export{k as displayTimeline};
