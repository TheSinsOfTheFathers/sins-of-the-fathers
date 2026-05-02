import { client } from "../../lib/sanityClient.js";
import { toHTML } from "https://esm.sh/@portabletext/to-html@2.0.13";

import i18next from "../../lib/i18n.js";
import { injectSchema } from "../../lib/seo.js";
import gsap from "gsap";
import { NoirEffects } from "../ui/noir-effects.js";

/**
 * MINI MAP ENGINE (Canlı Uydu Bağlantısı via Mapbox)
 */
const initMiniMap = (
  lat,
  lng,
  color,
  containerId = "mini-map",
  context = document
) => {
  const container =
    typeof containerId === "string"
      ? context.querySelector("#" + containerId)
      : containerId;

  console.log(`> [MiniMap] Initializing for: ${lat}, ${lng} (Container: ${containerId})`);

  // Helper for "Signal Lost" UI (Thematic fallback for blocked/failed services)
  const applySignalLostUI = (msg = "SIGNAL_LOST") => {
    console.warn(`> [MiniMap] Signal Lost: ${msg}`);
    container.innerHTML = `
        <div class="relative w-full h-full overflow-hidden flex flex-col items-center justify-center bg-black/90 border border-red-900/20 group">
            <div class="absolute inset-0 bg-[radial-gradient(circle,rgba(239,68,68,0.1)_0%,transparent_70%)] animate-pulse"></div>
            <i class="fas fa-satellite-dish text-4xl text-red-600/40 mb-3 group-hover:scale-110 transition-transform duration-700"></i>
            <div class="text-[10px] font-mono text-red-500 tracking-[0.3em] uppercase animate-pulse">${msg}</div>
            <div class="text-[8px] font-mono text-white/30 mt-2 uppercase tracking-widest text-center px-4">
                Satellite link blocked by local proxy or defense protocol.
            </div>
            <div class="absolute top-2 left-2 bg-red-950/40 px-1.5 py-0.5 text-[7px] font-mono text-red-400 border border-red-900/30">SEC_FAILURE</div>
        </div>
    `;
  };

  // 1. Update labels in the UI (Do this early regardless of map success)
  const latEl = document.getElementById('map-lat');
  const lngEl = document.getElementById('map-lng');
  if (latEl) latEl.textContent = `LAT: ${lat.toFixed(4)} ${lat >= 0 ? 'N' : 'S'}`;
  if (lngEl) lngEl.textContent = `LNG: ${lng.toFixed(4)} ${lng >= 0 ? 'E' : 'W'}`;

  // Check if library is even available (might be blocked by ad-blockers)
  if (!globalThis.mapboxgl) {
    console.warn("> [MiniMap] Critical Error: mapboxgl is not defined on window. Check if script is loaded or blocked.");
    applySignalLostUI("CONNECTION_BLOCKED");
    return;
  }
  console.log("> [MiniMap] mapboxgl library detected.");

  // Mapbox Access Token
  mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN; 

  /**
   * Leaflet Asset Loader (Dynamic)
   */
  const loadLeafletAssets = () => {
    return new Promise((resolve, reject) => {
      if (globalThis.L) return resolve();
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  /**
   * Interactive Leaflet Mini-Map Fallback
   */
  const applyLeafletMiniMapFallback = async (msg = "Leaflet_Mini_Fallback") => {
    console.warn(`> [MiniMap] Triggering Leaflet Fallback: ${msg}`);
    try {
      await loadLeafletAssets();
      const L = globalThis.L;
      container.innerHTML = '';
      
      const leafletMap = L.map(container, {
        center: [lat, lng],
        zoom: 13,
        zoomControl: false,
        attributionControl: false,
        interactive: false
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(leafletMap);

      // Final visual adjustment to avoid pitch-black backgrounds
      container.style.filter = "brightness(1.25) contrast(1.05)";
      container.style.background = "#050505";

      const icon = L.divIcon({
        className: 'custom-radar-icon',
        html: `
            <div class="radar-ping" style="width:20px; height:20px; position:relative;">
                <div class="absolute inset-0 rounded-full animate-ping opacity-75" style="background-color: ${color}"></div>
                <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full shadow-[0_0_20px_${color}]" style="background-color: ${color}"></div>
            </div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      L.marker([lat, lng], { icon }).addTo(leafletMap);

      // Force layout recalculation to fix tile gaps
      setTimeout(() => leafletMap.invalidateSize(), 500);

      console.log("> [MiniMap] Leaflet Mini-Map ready.");

    } catch (err) {
      console.error("> [MiniMap] Leaflet Fallback failed:", err);
      // Final static fallback
      const staticUrl = `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/${lng},${lat},14,0/600x600?access_token=${mapboxgl.accessToken}&attribution=false&logo=false`;
      container.innerHTML = `
          <div class="relative w-full h-full overflow-hidden flex items-center justify-center bg-black">
              <img src="${staticUrl}" class="w-full h-full object-cover grayscale opacity-60" alt="Fallback">
              <div class="absolute bottom-2 left-2 bg-black/80 px-2 py-0.5 text-[8px] font-mono text-gold uppercase border border-gold/20 z-20">LINK_OFFLINE</div>
          </div>
      `;
    }
  };

  // 2. Check for WebGL support
  if (!mapboxgl.supported()) {
    console.warn("> [MiniMap] WebGL is not supported. Switching to Leaflet.");
    applyLeafletMiniMapFallback("WebGL_Unsupported");
    return;
  }
  console.log("> [MiniMap] WebGL support confirmed.");

  try {
    console.log("> [MiniMap] Starting map instance creation...");
    const map = new mapboxgl.Map({
      container: container,
      style: 'mapbox://styles/mapbox/dark-v10',
      center: [lng, lat],
      zoom: 1, // Start zoomed out
      interactive: false,
      attributionControl: false,
      failIfMajorPerformanceCaveat: false // Try harder
    });
    console.log("> [MiniMap] Instance created successfully.");

    map.on('error', (e) => {
      console.error("> [MiniMap] Mapbox internal error:", e.error);
    });

    map.on('load', () => {
      console.log("> [MiniMap] Map 'load' event fired. Initiating staggered resize...");
      
      // Staggered resize to catch potential layout shifts
      const resizeInterval = setInterval(() => {
        console.log("> [MiniMap] Periodic resize trigger...");
        map.resize();
      }, 1000);

      // Stop periodic resize after 5 seconds
      setTimeout(() => {
        clearInterval(resizeInterval);
        console.log("> [MiniMap] Staggered resize sequence complete.");
      }, 5000);

      // Zoom in animation with longer delay
      console.log("> [MiniMap] Scheduling flyTo sequence (2s delay)...");
      setTimeout(() => {
          console.log("> [MiniMap] Executing flyTo...");
          map.flyTo({
              center: [lng, lat],
              zoom: 14,
              speed: 0.8,
              curve: 1.5,
              essential: true
          });
      }, 2000);

      map.on('moveend', () => {
        console.log("> [MiniMap] Map movement/zoom sequence complete.");
      });

      // Pulse effect at destination
      const el = document.createElement('div');
      el.className = 'radar-ping';
      el.style.width = '20px';
      el.style.height = '20px';
      el.innerHTML = `
          <div class="relative w-full h-full flex items-center justify-center">
              <div class="absolute w-full h-full rounded-full animate-ping opacity-75" style="background-color: ${color}"></div>
              <div class="absolute w-2 h-2 rounded-full shadow-[0_0_10px_${color}]" style="background-color: ${color}"></div>
          </div>
      `;

      const popup = new mapboxgl.Popup({ offset: 15, className: 'custom-popup-theme' })
        .setHTML(`
            <div class="p-3 bg-obsidian text-gray-300">
                <h4 class="text-gold text-xs font-bold mb-1 uppercase tracking-widest border-b border-gold/20 pb-1">${props.factionName.toUpperCase()} HQ</h4>
                <p class="text-[9px] leading-relaxed text-gray-400 font-mono">SIGNAL_STRENGTH: OPTIMAL<br>VECTOR_LOCK: CONFIRMED</p>
            </div>
        `);

      new mapboxgl.Marker(el)
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map);
    });

    // Handle container resize
    window.addEventListener('resize', () => map.resize());

  } catch (err) {
    console.error("> [MiniMap] Critical Initialization Failure:", err);
    applyLeafletMiniMapFallback("Initialization_Failed");
  }

  // Ensure container is visible regardless of animation start state
  gsap.to(container, {
    opacity: 1,
    scale: 1,
    filter: "contrast(1.2) brightness(0.8)",
    duration: 1.5,
    ease: "power3.out",
    delay: 0.2
  });
};

/**
 * Tema Rengi Ayarlayıcı
 */
const applyFactionTheme = (colorHex, bannerUrl) => {
  const themeColor = colorHex || "#c5a059";
  document.documentElement.style.setProperty("--theme-color", themeColor);

  const banner = document.getElementById("faction-banner");
  if (banner && bannerUrl) {
    banner.style.backgroundImage = `url('${bannerUrl}')`;
    NoirEffects.revealImage(banner);
  }
  return themeColor;
};

/* --------------------------------------------------------------------------
   HELPER FUNCTIONS (Cognitive Complexity Reduction)
   -------------------------------------------------------------------------- */

const injectFactionSeo = (faction, safeTitle) => {
  try {
    const plainDesc = faction.description
      ? faction.description
          .map((block) => block.children?.map((child) => child.text).join(""))
          .join(" ")
      : faction.motto || "";

    const schemaData = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: safeTitle,
      slogan: faction.motto,
      description: plainDesc.substring(0, 160) + "...",
      url: globalThis.location.href,
      logo: faction.image?.asset?.url,
      founder: faction.leader
        ? { "@type": "Person", name: faction.leader.name }
        : undefined,
      location: faction.hqName
        ? { "@type": "Place", name: faction.hqName }
        : undefined,
    };
    injectSchema(schemaData);
  } catch (err) {
    console.warn("SEO Warning:", err);
  }
};

const renderFactionHeader = (els, faction, safeTitle) => {
  if (els.title) {
    els.title.innerHTML = `<span class="glitch-text" data-text="${safeTitle}">${safeTitle}</span>`;
    gsap.from(els.title, {
        opacity: 0,
        x: -30,
        duration: 1,
        ease: "power4.out",
        delay: 0.5
    });
  }
  
  if (els.subtitle) {
    els.subtitle.textContent = faction.motto ? `"${faction.motto}"` : `// MOTTO_REDACTED`;
    gsap.from(els.subtitle, {
        opacity: 0,
        y: 10,
        duration: 0.8,
        ease: "power2.out",
        delay: 0.7
    });
  }

  if (els.fileId) {
    const typeCode = faction.type === "syndicate" ? "SYN" : "CORP";
    const randomHex = Math.random().toString(16).substr(2, 4).toUpperCase();
    els.fileId.textContent = `FILE: ${typeCode}-${randomHex}`;
  }

  const type = faction.type || "syndicate";
  const icon = type === "syndicate" ? '<i class="fas fa-skull-crossbones text-6xl opacity-30"></i>' : '<i class="fas fa-chess-king text-6xl opacity-30"></i>';
  if (els.iconContainer) {
      els.iconContainer.innerHTML = `<div class="scanning-bar animate-[scan_3s_linear_infinite]"></div>${icon}`;
      gsap.from(els.iconContainer, { scale: 0.8, opacity: 0, duration: 1, ease: "back.out(1.7)", delay: 0.3 });
  }

  const themeColor = applyFactionTheme(faction.color?.hex, faction.image?.asset?.url);

  if (faction.hqLocation?.lat && faction.hqLocation?.lng) {
    setTimeout(() => initMiniMap(faction.hqLocation.lat, faction.hqLocation.lng, themeColor, "mini-map"), 1200);
  }
};

const renderFactionInfo = (els, faction) => {
  if (els.leader) {
    const leaderName = faction.leader ? faction.leader.name : "REDACTED";
    els.leader.innerHTML = `<span class="glitch-hover cursor-pointer">${leaderName}</span>`;
  }
  
  if (els.hq) els.hq.textContent = faction.hqName || "LOC_ENCRYPTED";

  if (els.threat) {
    const threatLevel = (faction.threatLevel || "unknown").toLowerCase();
    const levels = {
      minimal: { active: 1, color: "bg-cyan-500" },
      low: { active: 2, color: "bg-green-500" },
      medium: { active: 3, color: "bg-yellow-500" },
      high: { active: 4, color: "bg-orange-500" },
      critical: { active: 5, color: "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" },
      extreme: { active: 5, color: "bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.8)]" },
      unknown: { active: 0, color: "bg-gray-800" }
    };

    const config = levels[threatLevel] || levels.unknown;
    const bars = els.threat.querySelectorAll(".threat-indicator-bar");
    
    gsap.to(bars, {
        backgroundColor: (i) => i < config.active ? "" : "#1f2937", // gray-800
        duration: 0.1,
        stagger: 0.1,
        onStart: () => {
            bars.forEach((bar, i) => {
                if(i < config.active) {
                    bar.className = `threat-indicator-bar w-2 h-4 ${config.color}`;
                    gsap.from(bar, { opacity: 0, duration: 0.3, delay: i * 0.1 });
                }
            });
        }
    });
  }
};

const renderFactionDescription = (els, faction) => {
  if (!els.description) return;

  if (faction.description) {
    const rawHTML = toHTML(faction.description, {
      components: {
        block: {
          normal: ({ children }) => `<p class="opacity-90 leading-relaxed">${children}</p>`,
          h2: ({ children }) => `<h3 class="text-xl text-gold mt-6 mb-3">${children}</h3>`,
        },
      },
    });

    // Clear previous and prep for typewriter
    els.description.innerHTML = '';
    const textLayer = document.createElement('div');
    textLayer.className = 'terminal-text-layer';
    textLayer.innerHTML = rawHTML;
    els.description.appendChild(textLayer);
    
    // Add blinking cursor at the end
    const cursor = document.createElement('span');
    cursor.className = 'terminal-cursor';
    els.description.appendChild(cursor);

    // Initial state: hidden
    gsap.set(textLayer, { opacity: 0 });

    // Animate the reveal withNoirEffects scramble or reveal
    // We use a custom stagger reveal for better results with HTML
    const revealTl = gsap.timeline({ delay: 1.5 });
    
    revealTl.to(textLayer, { opacity: 1, duration: 0.5 });
    
    const paragraphs = textLayer.querySelectorAll('p, h3');
    paragraphs.forEach((p, index) => {
        const originalText = p.innerHTML;
        p.innerHTML = ''; // Clear for animation
        
        revealTl.add(() => {
            NoirEffects.typewriterEffect(p, originalText);
        }, index * 0.8);
    });

    // Remove cursor when done
    revealTl.to(cursor, { opacity: 0, duration: 0.5, delay: 1 });
  } else {
    els.description.innerHTML = `<p class="text-gray-500 italic font-mono uppercase tracking-widest text-sm">[ NO DATA RECORDED IN SYNDICATE ARCHIVE ]</p>`;
  }
};

const renderFactionRoster = (els, faction) => {
  if (!els.roster) return;

  if (faction.members && faction.members.length > 0) {
    els.roster.innerHTML = faction.members
      .map((member) => {
        const avatarUrl =
          member.imageUrl ||
          `https://ui-avatars.com/api/?background=1a1a1a&color=888&name=${encodeURIComponent(member.name || "User")}`;
        return `
                <a href="character-detail.html?slug=${member.slug}" class="roster-card bg-black/40 p-4 border border-white/5 flex items-center space-x-4 hover:bg-gold/5 hover:border-gold/30 transition-all group tech-clip relative overflow-hidden">
                    <div class="absolute inset-0 bg-gradient-to-r from-gold/0 via-gold/5 to-gold/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    <div class="w-12 h-12 bg-black overflow-hidden ring-1 ring-white/10 group-hover:ring-gold/50 transition-all">
                        <img src="${avatarUrl}" class="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 group-hover:scale-110">
                    </div>
                    <div>
                        <h4 class="font-serif text-gray-200 leading-tight group-hover:text-white">${member.name}</h4>
                        <p class="text-[9px] text-gold/40 font-mono uppercase tracking-[0.2em] group-hover:text-gold transition-colors">${member.role || "ASSOCIATE"}</p>
                    </div>
                    <i class="fas fa-chevron-right absolute right-4 opacity-0 group-hover:opacity-40 transition-opacity text-[10px]"></i>
                </a>`;
      })
      .join("");
  } else {
    els.roster.innerHTML = `<div class="text-[10px] font-mono text-gray-600 col-span-full py-8 text-center border border-dashed border-white/5 uppercase tracking-widest">[ PERSONNEL_RECORDS_REDACTED ]</div>`;
  }
};

const renderFactionRelations = (els, faction) => {
  if (!els.relations) return;

  if (faction.relations && faction.relations.length > 0) {
    els.relations.innerHTML = faction.relations
      .map((rel) => {
        let statusColor = "text-gray-400";
        let icon = "fa-circle-nodes";

        if (rel.status === "hostile") statusColor = "text-red-500";
        if (rel.status === "ally") statusColor = "text-gold";
        if (rel.status === "vassal") statusColor = "text-cyan-400";

        return `
                <div class="flex justify-between items-center text-[10px] font-mono border-b border-white/5 pb-2 last:border-0 group">
                    <span class="text-gray-400 group-hover:text-white transition-colors uppercase tracking-wider">${rel.targetName}</span>
                    <span class="${statusColor} uppercase flex items-center gap-2">
                         ${rel.status} <i class="fas ${icon} text-[8px] opacity-40"></i>
                    </span>
                </div>
            `;
      })
      .join("");
  } else {
    els.relations.innerHTML = `<div class="text-[9px] text-gray-600 font-mono text-center py-4 uppercase">[ NO_ALLIANCE_DATA ]</div>`;
  }
};

const renderFactionDetails = (faction, container) => {
  // Broaden search to document if container is just 'main'
  const searchRoot = document.getElementById('main-wrapper') || document;
  
  const els = {
    title: searchRoot.querySelector("#faction-title"),
    subtitle: searchRoot.querySelector("#faction-subtitle"),
    fileId: searchRoot.querySelector("#faction-file-id"),
    leader: searchRoot.querySelector("#faction-leader"),
    hq: searchRoot.querySelector("#faction-hq"),
    description: searchRoot.querySelector("#faction-description"),
    iconContainer: searchRoot.querySelector("#faction-icon-container"),
    roster: searchRoot.querySelector("#faction-roster"),
    threat: searchRoot.querySelector("#threat-indicator"),
    relations: searchRoot.querySelector("#faction-locations-list"),
  };

  const safeTitle = faction.title || "Unknown Faction";
  document.title = i18next.t("faction_detail_loader.meta_title", {
    factionName: safeTitle,
  });

  injectFactionSeo(faction, safeTitle);
  renderFactionHeader(els, faction, safeTitle);
  renderFactionInfo(els, faction);
  renderFactionDescription(els, faction);
  renderFactionRoster(els, faction);
  renderFactionRelations(els, faction);

  const grid = document.querySelector("main");
  if (grid) grid.classList.remove("opacity-0");
};

export default async function (container, props) {
  // Try finding loader globally if not in container (since we moved it inside main)
  const loader = document.getElementById("factions-loader");
  const mainContainer = document.querySelector("main");
  const params = new URLSearchParams(globalThis.location.search);
  const factionSlug = params.get("slug");

  if (mainContainer) gsap.set(mainContainer, { opacity: 0 });

  if (!factionSlug) {
    if (loader)
      loader.innerHTML = `<p class="text-red-500 font-mono text-sm">${i18next.t("faction_detail_loader.error_missing_slug")}</p>`;
    if (mainContainer) gsap.to(mainContainer, { opacity: 1 });
    return;
  }

  try {
    console.log(`> Querying Sanity for Faction: ${factionSlug}`);
    const query = `*[_type == "faction" && slug.current == $slug][0]{
            title, motto, description, type, threatLevel,
            "hqName": hq, 
            "hqLocation": hqLocation,
            "color": color,
            image { asset->{ url, "blurHash": metadata.blurHash } },
            leader->{ name, "slug": slug.current },
            "members": *[_type == "character" && references(^._id)] | order(name asc) [0...6] {
                name, "slug": slug.current, title, "role": title, 
                "imageUrl": image.asset->url
            },
            relations[] {
                status, description, "targetName": target->title
            }
        }`;

    const faction = await client.fetch(query, { slug: factionSlug });
    console.log("> Sanity Result:", faction);

    if (loader) {
        gsap.to(loader, { opacity: 0, duration: 0.5, onComplete: () => loader.remove() });
    }

    if (faction) {
      gsap.to(mainContainer, { opacity: 1, duration: 0.8, delay: 0.2 });
      renderFactionDetails(faction, container);
    } else {
      if (document.getElementById("faction-title")) document.getElementById("faction-title").textContent = "DATA CORRUPTED";
      if (loader) loader.remove();
      gsap.to(mainContainer, { opacity: 1, duration: 0.5 });
    }
  } catch (error) {
    console.error("Intel Failure:", error);
    if (document.getElementById("faction-title")) document.getElementById("faction-title").textContent = "SYSTEM MALFUNCTION";
    if (loader) loader.remove();
    gsap.to(mainContainer, { opacity: 1, duration: 0.5 });
  }
}
