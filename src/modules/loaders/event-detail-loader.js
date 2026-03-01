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
        ? `<div class="event-detail-media relative w-full h-[40vh] md:h-[60vh] overflow-hidden mb-16 border-y border-white/10 opacity-0 transform translate-y-10">
             <div class="absolute inset-0 bg-obsidian/40 z-10"></div>
             <img src="${imageUrl}" alt="${event.title_en || 'Event Image'}" class="w-full h-full object-cover grayscale opacity-80" id="parallax-img">
             <div class="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-obsidian via-obsidian/80 to-transparent z-20 flex justify-between items-end">
                <span class="text-gold/50 font-mono text-[10px] uppercase tracking-widest">${event.image?.caption || 'FIG. 1: EVIDENCE RECORD'}</span>
                <span class="text-white/20 font-mono text-[10px] uppercase tracking-widest">TSOF ARCHIVES // CLASSIFIED</span>
             </div>
           </div>` 
        : "";

    const dateStr = event.date ? event.date.split("-").reverse().join(".") : 'UNKNOWN';

    // Advanced layout for Event Detail Page
    const html = `
        <article class="relative z-10 pb-20">
            
            <!-- Header Section -->
            <header class="event-detail-header text-center mb-16 px-4 md:px-0 opacity-0 transform translate-y-8">
                <div class="inline-flex items-center gap-4 mb-8">
                    <div class="h-px bg-gold/30 w-12 md:w-24"></div>
                    <span class="text-gold font-mono text-xs md:text-sm tracking-[0.3em] uppercase bg-gold/5 px-4 py-1 border border-gold/20">
                        RECORD // ${dateStr}
                    </span>
                    <div class="h-px bg-gold/30 w-12 md:w-24"></div>
                </div>
                
                <h1 class="text-4xl md:text-6xl lg:text-7xl font-serif text-white uppercase tracking-wider leading-tight text-shadow-lg mb-6 max-w-5xl mx-auto">
                    ${event.title_en || "REDACTED"}
                </h1>
                
                <div class="flex flex-wrap justify-center gap-6 md:gap-12 text-gray-500 font-mono text-[10px] md:text-xs uppercase tracking-[0.2em] mt-8">
                    <div>
                        <span class="text-gold mr-2">CASE FILE:</span> #${event.slug ? event.slug.toUpperCase() : 'UNKNOWN'}
                    </div>
                    <div>
                        <span class="text-gold mr-2">AUTHORIZATION:</span> GAMMA LEVEL
                    </div>
                    <div>
                        <span class="text-gold mr-2">SOURCE:</span> ${event.credit || 'RAVENWOOD DEEP ARCHIVE'}
                    </div>
                </div>
            </header>

            ${imageHtml}

            <!-- Main Content Container -->
            <div class="event-detail-content max-w-4xl mx-auto px-6 md:px-12 opacity-0 transform translate-y-8">
                <!-- Drop cap & typography styling for the text -->
                <div class="font-lato text-lg md:text-xl text-gray-300 leading-[1.8] md:leading-[2] tracking-wide text-justify
                            first-letter:float-left first-letter:text-7xl first-letter:pr-4 first-letter:pt-2 
                            first-letter:font-serif first-letter:text-gold first-line:uppercase first-line:tracking-widest">
                    ${event.text_en ? `<p class="mb-8">${event.text_en.replace(/\n\n/g, '</p><p class="mb-8">').replace(/\n/g, '<br>')}</p>` : '<p class="text-center font-mono text-gray-600 tracking-widest">No narrative record found.</p>'}
                </div>
                
                <!-- End of record mark -->
                <div class="mt-24 pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 opacity-70 hover:opacity-100 transition-opacity duration-500">
                    <a href="timeline.html" class="group flex items-center text-xs font-mono text-gold tracking-widest hover:text-white transition-colors border border-gold/30 px-6 py-3 hover:bg-gold/10">
                        <i class="fas fa-arrow-left mr-3 group-hover:-translate-x-1 transition-transform"></i> RETURN TO ARCHIVE (TIMELINE)
                    </a>
                    <span class="text-[10px] font-mono text-gray-600 tracking-[0.3em] flex items-center gap-2">
                        <div class="w-1.5 h-1.5 bg-red-900 rounded-full animate-pulse"></div>
                        END OF DOCUMENT // 0492-AX
                    </span>
                </div>
            </div>
        </article>
    `;

    container.innerHTML = html;

    // Initialize Animations
    setTimeout(initEventAnimations, 100);
};

const initEventAnimations = () => {
    if (!window.gsap || !window.ScrollTrigger) return;
    
    gsap.registerPlugin(ScrollTrigger);

    const tl = gsap.timeline();

    // Fade in Header
    tl.to('.event-detail-header', {
        y: 0,
        opacity: 1,
        duration: 1.2,
        ease: "power3.out"
    });

    // Fade in Media
    if (document.querySelector('.event-detail-media')) {
        tl.to('.event-detail-media', {
            y: 0,
            opacity: 1,
            duration: 1.2,
            ease: "power3.out"
        }, "-=0.8");

        // Parallax Image Effect
        gsap.to('#parallax-img', {
            scrollTrigger: {
                trigger: '.event-detail-media',
                start: "top bottom",
                end: "bottom top",
                scrub: 1
            },
            y: 50,
            ease: "none"
        });
    }

    // Fade in Content
    tl.to('.event-detail-content', {
        y: 0,
        opacity: 1,
        duration: 1.2,
        ease: "power3.out"
    }, "-=0.8");
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
