import { client, urlFor } from "../../lib/sanityClient.js";
import i18next from "../../lib/i18n.js";
import { injectSchema } from "../../lib/seo.js";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* --------------------------------------------------------------------------
   RENDER LOGIC (Horizontal Chrono-Stream)
   -------------------------------------------------------------------------- */

const renderEventCard = (evt, index) => {
    // Stagger items above and below the line
    const isEven = index % 2 === 0;
    const yOffset = isEven ? '-40%' : '40%';
    
    // Date formatting
    let dateDisplay = evt.date || "Unknown Date";
    if (evt.date) {
        const parts = evt.date.split("-");
        if (parts.length === 3) {
            dateDisplay = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
    }

    // Image handling
    let imageUrl = evt.external_image_url;
    if (!imageUrl && evt.image?.asset?.url) {
        imageUrl = evt.image.asset.url;
    }
    if (!imageUrl && evt.image) {
         try {
            imageUrl = urlFor(evt.image)?.url();
         } catch(e) { console.warn("Image builder failed", e); }
    }

    const imageHtml = imageUrl 
        ? `<div class="chrono-media relative overflow-hidden h-32 md:h-48 mb-4 border border-white/10 group-hover:border-gold/50 transition-colors duration-500">
             <img src="${imageUrl}" alt="${evt.title_en || 'Event'}" class="w-full h-full object-cover grayscale group-hover:grayscale-0 transform transition-transform duration-1000 group-hover:scale-110" loading="lazy">
             <div class="absolute inset-0 bg-obsidian/40 mix-blend-multiply group-hover:bg-transparent transition-all"></div>
           </div>` 
        : "";

    const linkUrl = evt.slug ? `event.html?slug=${evt.slug}` : "#";

    return `
        <div class="chrono-event relative flex-shrink-0 w-[400px] md:w-[600px] px-12 group" style="transform: translateY(${yOffset})">
            <!-- Connection Line to Axis -->
            <div class="absolute ${isEven ? 'bottom-0' : 'top-0'} left-1/2 -translate-x-1/2 w-px h-24 bg-gradient-to-${isEven ? 't' : 'b'} from-gold/50 to-transparent opacity-30 group-hover:opacity-100 transition-opacity"></div>
            
            <a href="${linkUrl}" class="block bg-obsidian/60 backdrop-blur-md border border-white/5 p-8 hover:border-gold/40 transition-all duration-500 relative group/card">
                <!-- Tactical Corner Accents -->
                <div class="absolute top-0 right-0 w-6 h-6 border-t border-r border-gold/20 m-2 group-hover/card:border-gold/60 transition-colors"></div>
                <div class="absolute bottom-0 left-0 w-6 h-6 border-b border-l border-gold/20 m-2 group-hover/card:border-gold/60 transition-colors"></div>

                <div class="flex items-center gap-3 mb-4">
                    <span class="text-gold font-mono text-[10px] tracking-widest uppercase border-l-2 border-gold pl-2">
                        ${dateDisplay}
                    </span>
                    <div class="h-px bg-white/10 flex-grow"></div>
                </div>

                ${imageHtml}

                <h3 class="text-xl md:text-2xl font-serif text-white uppercase tracking-wider mb-3 leading-tight group-hover/card:text-gold transition-colors">
                    ${evt.title_en || i18next.t("timeline_loader.untitled_event")}
                </h3>
                
                <div class="text-gray-400 font-lato text-sm leading-relaxed line-clamp-3">
                    ${evt.text_en || ""}
                </div>

                <div class="mt-6 flex justify-between items-center">
                    <span class="text-[8px] font-mono text-gray-600 tracking-[3px] uppercase">ID: ${index.toString().padStart(4, '0')}</span>
                    <span class="text-gold text-[10px] font-mono tracking-widest opacity-0 group-hover/card:opacity-100 transition-opacity">
                        INTEL <i class="fas fa-chevron-right ml-1"></i>
                    </span>
                </div>
            </a>
        </div>
    `;
};

const renderEraBackground = (eraTitle) => {
    return `
        <div class="era-bg-container flex-shrink-0 relative pointer-events-none select-none">
            <h2 class="era-title whitespace-nowrap text-[20vh] md:text-[35vh] font-serif font-bold text-white/[0.02] uppercase tracking-[0.2em] leading-none">
                ${eraTitle}
            </h2>
            <div class="absolute inset-0 flex items-center justify-center">
                <div class="w-px h-[60vh] bg-white/[0.05]"></div>
            </div>
        </div>
    `;
};

const buildHorizontalTimeline = (eras, container) => {
    let html = '';
    let globalIndex = 0;

    eras.forEach((era) => {
        const eraTitle = era.title_en || i18next.t("timeline_loader.unknown_era");
        
        // Start Era Section
        html += `<div class="era-section flex items-center relative gap-0">`;
        
        // Era Background Label
        html += renderEraBackground(eraTitle);

        if (era.events && Array.isArray(era.events)) {
            era.events.forEach((evt) => {
                html += renderEventCard(evt, globalIndex);
                globalIndex++;
            });
        }
        
        html += `</div>`; // End Era Section
    });

    container.innerHTML = html;

    // Reveal Axis
    const axis = document.getElementById('timeline-axis');
    if (axis) axis.style.opacity = '1';

    // Initialize Animations
    initChronoAnimations();
};

/* --------------------------------------------------------------------------
   ANIMATION LOGIC (GSAP Horizontal Scroll)
   -------------------------------------------------------------------------- */
const initChronoAnimations = () => {
    if (!window.gsap || !window.ScrollTrigger) {
        console.warn("GSAP/ScrollTrigger not loaded.");
        return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const container = document.getElementById('timeline-embed');
    const wrapper = document.getElementById('timeline-wrapper');
    
    // Calculate total width to scroll
    const totalWidth = container.scrollWidth - window.innerWidth + (window.innerWidth * 0.4); // Added offset for padding

    // 1. Horizontal Scroll Animation
    gsap.to(container, {
        x: () => -(container.scrollWidth - window.innerWidth),
        ease: "none",
        scrollTrigger: {
            trigger: wrapper,
            start: "top top",
            end: () => `+=${container.scrollWidth}`, // Scroll duration based on content width
            scrub: 1,
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
        }
    });

    // 2. Event Focus Effects (Parallax & Scale)
    gsap.utils.toArray('.chrono-event').forEach(event => {
        gsap.fromTo(event, 
            { scale: 0.8, opacity: 0.3, filter: 'blur(10px)' },
            {
                scale: 1,
                opacity: 1,
                filter: 'blur(0px)',
                scrollTrigger: {
                    trigger: event,
                    containerAnimation: gsap.getById('mainScroll'), // Fix if using ScrollTrigger on container
                    // Since it's nested in a pinned container, we use containerAnimation if we had multiple
                    // But here we can use a simpler approach: check horizontal center
                    start: "left 80%",
                    end: "left 20%",
                    scrub: true,
                    // Use toggleClass for CSS effects
                    toggleClass: { targets: event, className: "is-active" }
                }
            }
        );
    });

    // 3. Scanline Animation on Axis
    gsap.to('.timeline-scanline', {
        x: window.innerWidth,
        repeat: -1,
        duration: 8,
        ease: "none"
    });
};


/* --------------------------------------------------------------------------
   MAIN EXPORT
   -------------------------------------------------------------------------- */

export default async function (container, props) {
  const embedEl = container.querySelector("#timeline-embed") || container;
  let loaderEl = document.getElementById("timeline-loading");
  if (!loaderEl) loaderEl = container.querySelector("#timeline-loading");

  try {
    const query = `*[_type == "timelineEra"] | order(order asc) {
            title_en,
            "events": events[] {
                title_en,
                text_en,
                date,
                external_image_url,
                "slug": slug.current,
                image {
                    asset->{
                        url
                    }
                }
            }
        }`;

    const eras = await client.fetch(query);

    if (eras && eras.length > 0) {
      // Build the Horizontal view
      buildHorizontalTimeline(eras, embedEl);
      
      // Hide loader with a delay for smoothness
      setTimeout(() => {
          if (loaderEl) {
              gsap.to(loaderEl, { 
                  opacity: 0, 
                  duration: 1, 
                  onComplete: () => loaderEl.style.display = "none" 
              });
          }
      }, 500);
      
      // SEO Injection (keeping same logic but optional)
      const allEvents = eras.flatMap(e => e.events || []);
      injectSchema({
          "@context": "https://schema.org",
          "@type": "Timeline",
          "name": "The Chronology of Sins",
          "description": "Historical records of the Ravenwood and Macpherson bloodlines.",
          "event": allEvents.map(e => ({
              "@type": "Event",
              "name": e.title_en,
              "startDate": e.date,
              "description": e.text_en
          }))
      });
      
    } else {
      if (loaderEl) loaderEl.style.display = "none";
      embedEl.innerHTML = `<div class="text-center text-red-500 py-10">${i18next.t("timeline_loader.archives_empty")}</div>`;
    }
  } catch (error) {
    console.error("Timeline Load Error:", error);
    if (loaderEl) loaderEl.innerHTML = `<span class='text-red-500'>Error loading archives.</span>`;
  }
}
