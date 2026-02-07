import { client, urlFor } from "../../lib/sanityClient.js";
import i18next from "../../lib/i18n.js";
import { injectSchema } from "../../lib/seo.js";

/* --------------------------------------------------------------------------
   RENDER LOGIC
   -------------------------------------------------------------------------- */
const renderEventDetail = (event, container) => {
    // Image handling
    let imageUrl = event.external_image_url;
    if (!imageUrl && event.image?.asset?.url) {
        imageUrl = event.image.asset.url;
    }
    if (!imageUrl && event.image) {
         try {
            imageUrl = urlFor(event.image)?.url();
         } catch(e) { console.warn("Image builder failed", e); }
    }

    const imageHtml = imageUrl 
        ? `<div class="w-full mb-10 relative group">
             <div class="absolute inset-0 bg-gold/5 transform translate-x-4 translate-y-4 -z-10 border border-gold/20"></div>
             <div class="relative overflow-hidden border border-gold/40 shadow-[0_0_30px_rgba(197,160,89,0.1)]">
                <img src="${imageUrl}" alt="${event.title_en || 'Event Image'}" class="w-full h-auto object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700">
                <div class="absolute bottom-0 left-0 right-0 p-2 bg-black/80 backdrop-blur-sm border-t border-gold/30 text-center">
                    <p class="text-[10px] text-gold font-mono uppercase tracking-widest opacity-70">${event.image?.caption || 'FIG. 1: EVIDENCE RECORD'}</p>
                </div>
             </div>
           </div>` 
        : "";

    const dateStr = event.date ? event.date.split("-").reverse().join(".") : 'UNKNOWN';

    const html = `
        <article class="animate-fade-in-up relative">
            <!-- Classification Stamp -->
            <div class="absolute -top-12 -right-4 sm:-right-12 border-4 border-red-900/30 text-red-900/30 font-black text-6xl uppercase tracking-widest rotate-12 pointer-events-none select-none z-0 mix-blend-overlay">
                CLASSIFIED
            </div>

            <!-- Header Section -->
            <header class="mb-12 relative z-10 border-b border-gold/20 pb-8">
                <div class="flex flex-col md:flex-row justify-between items-start md:items-end mb-6">
                    <div>
                        <div class="text-gold/60 font-mono text-xs tracking-[0.3em] mb-2">CASE FILE: #${event.slug ? event.slug.toUpperCase() : 'UNKNOWN'}</div>
                        <h1 class="text-4xl md:text-6xl font-serif text-white uppercase tracking-wide leading-none text-shadow-lg">
                            ${event.title_en || "REDACTED"}
                        </h1>
                    </div>
                    <div class="mt-4 md:mt-0 text-right">
                        <div class="text-gray-500 font-mono text-xs uppercase tracking-widest mb-1">DATE OF INCIDENT</div>
                        <div class="text-2xl text-gold font-serif">${dateStr}</div>
                    </div>
                </div>
            </header>

            <!-- Grid Layout -->
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <!-- Metadata Side -->
                <aside class="hidden lg:block lg:col-span-3 border-r border-gold/10 pr-8">
                    <div class="mb-8">
                        <h4 class="text-gold font-mono text-xs tracking-widest mb-2 border-b border-gold/20 pb-1">LOCATION</h4>
                        <p class="text-gray-400 font-lato text-sm">Unknown Sector</p>
                    </div>
                    <div class="mb-8">
                        <h4 class="text-gold font-mono text-xs tracking-widest mb-2 border-b border-gold/20 pb-1">CLEARANCE</h4>
                        <p class="text-gray-400 font-lato text-sm">Level 4 (Eyes Only)</p>
                    </div>
                    <div>
                        <h4 class="text-gold font-mono text-xs tracking-widest mb-2 border-b border-gold/20 pb-1">SOURCE</h4>
                        <p class="text-gray-400 font-lato text-sm italic">${event.credit || 'Ravenwood Archives'}</p>
                    </div>
                </aside>

                <!-- Main Content -->
                <div class="lg:col-span-9">
                    ${imageHtml}

                    <div class="prose prose-invert prose-lg max-w-none font-lato text-gray-300 leading-relaxed text-justify first-letter:float-left first-letter:text-5xl first-letter:pr-4 first-letter:font-serif first-letter:text-gold">
                        ${event.text_en ? `<p>${event.text_en.replace(/\n/g, '<br><br>')}</p>` : ''}
                    </div>
                    
                    <div class="mt-16 pt-8 border-t border-white/5 flex justify-between items-center opacity-50 hover:opacity-100 transition-opacity">
                        <a href="timeline.html" class="flex items-center text-xs font-mono text-gold tracking-widest hover:text-white transition-colors">
                            <span class="mr-2">&larr;</span> RETURN TO TIMELINE
                        </a>
                        <span class="text-[10px] font-mono text-gray-600 tracking-[0.2em]">END OF RECORD // 0492-AX</span>
                    </div>
                </div>
            </div>
        </article>
    `;

    container.innerHTML = html;
};

/* --------------------------------------------------------------------------
   MAIN EXPORT
   -------------------------------------------------------------------------- */
export default async function (container, props) {
  const loaderEl = container.querySelector("#event-loading");
  
  // Get Slug from URL
  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get('slug');

  if (!slug) {
      if (loaderEl) loaderEl.style.display = "none";
      container.innerHTML = `<div class="text-center text-red-500 py-20 font-mono">ERROR: MISSING EVENT REFERENCE ID.</div>`;
      return;
  }

  try {
    console.log(`> Fetching Event Data for slug: ${slug}...`);

    // Complex Query to find the event inside any timelineEra
    const query = `*[_type == "timelineEra" && defined(events) && $slug in events[].slug.current][0] {
        "event": events[slug.current == $slug][0] {
            title_en,
            text_en,
            date,
            caption,
            credit,
            external_image_url,
            image {
                asset->{
                    url
                },
                caption
            }
        }
    }`;

    const result = await client.fetch(query, { slug });

    if (result && result.event) {
      renderEventDetail(result.event, container);
      
      // SEO Injection
      const seoData = {
          title: result.event.title_en + " | Sins of the Fathers",
          description: result.event.title_en,
          image: result.event.image?.asset?.url || result.event.external_image_url
      };
      // injectSchema(seoData); // TBD
      
    } else {
      if (loaderEl) loaderEl.style.display = "none";
      container.innerHTML = `<div class="text-center text-red-500 py-20 font-mono">ARCHIVE RECORD NOT FOUND.</div>`;
    }
  } catch (error) {
    console.error("Event Fetch Failed:", error);
    if (loaderEl) loaderEl.innerHTML = `<span class='text-red-500'>CRITICAL DATABASE ERROR.</span>`;
  }
}
