import { client } from "../../lib/sanityClient";
import { toHTML } from "@portabletext/to-html";
import i18next from "../../lib/i18n";
import { injectSchema } from "../../lib/seo.js";
import gsap from "gsap";
import { NoirEffects } from "../ui/noir-effects.js";

interface SanityImageAsset {
  url: string;
  blurHash?: string;
}

interface SanityImage {
  asset?: SanityImageAsset;
}

interface SanityColor {
  hex?: string;
}

interface HqLocation {
  lat: number;
  lng: number;
}

interface FactionLeader {
  name: string;
  slug?: string;
}

interface FactionMember {
  name: string;
  slug?: string;
  title?: string;
  role?: string;
  imageUrl?: string;
}

interface FactionRelation {
  status?: string;
  description?: string;
  targetName?: string;
}

interface PortableTextChild {
  text?: string;
  [key: string]: unknown;
}

interface PortableTextBlock {
  children?: PortableTextChild[];
  [key: string]: unknown;
}

interface FactionDocument {
  title?: string;
  motto?: string;
  description?: PortableTextBlock[];
  type?: string;
  threatLevel?: string;
  hqName?: string;
  hqLocation?: HqLocation;
  color?: SanityColor;
  image?: SanityImage;
  leader?: FactionLeader;
  members?: FactionMember[];
  relations?: FactionRelation[];
}

interface FactionElements {
  title: Element | null;
  subtitle: Element | null;
  fileId: Element | null;
  leader: Element | null;
  hq: Element | null;
  description: Element | null;
  iconContainer: Element | null;
  roster: Element | null;
  threat: Element | null;
  relations: Element | null;
}

interface LoaderProps {
  factionName?: string;
  [key: string]: unknown;
}

declare global {
  interface Window {
    mapboxgl?: MapboxGL;
    L?: LeafletLib;
  }
}

interface MapboxGL {
  accessToken: string;
  supported(): boolean;
  Map: new (options: MapboxMapOptions) => MapboxMap;
  Marker: new (el: HTMLElement) => MapboxMarkerInstance;
  Popup: new (options: MapboxPopupOptions) => MapboxPopup;
}

interface MapboxMapOptions {
  container: Element;
  style: string;
  center: [number, number];
  zoom: number;
  interactive: boolean;
  attributionControl: boolean;
  failIfMajorPerformanceCaveat: boolean;
}

interface MapboxMap {
  on(event: string, callback: (e?: { error?: unknown }) => void): void;
  resize(): void;
  flyTo(options: MapboxFlyToOptions): void;
}

interface MapboxFlyToOptions {
  center: [number, number];
  zoom: number;
  speed: number;
  curve: number;
  essential: boolean;
}

interface MapboxMarkerInstance {
  setLngLat(coords: [number, number]): MapboxMarkerInstance;
  setPopup(popup: MapboxPopup): MapboxMarkerInstance;
  addTo(map: MapboxMap): MapboxMarkerInstance;
}

interface MapboxPopup {
  setHTML(html: string): MapboxPopup;
}

interface MapboxPopupOptions {
  offset?: number;
  className?: string;
}

interface LeafletLib {
  map(container: Element, options: LeafletMapOptions): LeafletMap;
  tileLayer(url: string, options: LeafletTileOptions): LeafletTileLayer;
  divIcon(options: LeafletDivIconOptions): LeafletIcon;
  marker(coords: [number, number], options: LeafletMarkerOptions): LeafletMarker;
}

interface LeafletMapOptions {
  center: [number, number];
  zoom: number;
  zoomControl: boolean;
  attributionControl: boolean;
  interactive: boolean;
}

interface LeafletMap {
  invalidateSize(): void;
}

interface LeafletTileOptions {
  subdomains: string;
  maxZoom: number;
}

interface LeafletTileLayer {
  addTo(map: LeafletMap): LeafletTileLayer;
}

interface LeafletDivIconOptions {
  className: string;
  html: string;
  iconSize: [number, number];
  iconAnchor: [number, number];
}

interface LeafletIcon {}

interface LeafletMarkerOptions {
  icon: LeafletIcon;
}

interface LeafletMarker {
  addTo(map: LeafletMap): LeafletMarker;
}

const initMiniMap = (
  lat: number,
  lng: number,
  color: string,
  containerId: string | Element = "mini-map",
  context: Document | Element = document,
  props: LoaderProps = {},
  resizeHandlerRef?: { handler: (() => void) | null }
): void => {
  const container =
    typeof containerId === "string"
      ? (context as Document).querySelector("#" + containerId)
      : containerId;

  if (!container) return;

  console.log(`> [MiniMap] Initializing for: ${lat}, ${lng} (Container: ${containerId})`);

  const applySignalLostUI = (msg = "SIGNAL_LOST"): void => {
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

  const latEl = document.getElementById("map-lat");
  const lngEl = document.getElementById("map-lng");
  if (latEl) latEl.textContent = `LAT: ${lat.toFixed(4)} ${lat >= 0 ? "N" : "S"}`;
  if (lngEl) lngEl.textContent = `LNG: ${lng.toFixed(4)} ${lng >= 0 ? "E" : "W"}`;

  if (!(globalThis as unknown as Window).mapboxgl) {
    console.warn("> [MiniMap] Critical Error: mapboxgl is not defined on window. Check if script is loaded or blocked.");
    applySignalLostUI("CONNECTION_BLOCKED");
    return;
  }
  console.log("> [MiniMap] mapboxgl library detected.");

  const mapboxgl = (globalThis as unknown as Window).mapboxgl as MapboxGL;
  mapboxgl.accessToken = (import.meta as unknown as Record<string, Record<string, string>>).env.VITE_MAPBOX_TOKEN;

  const loadLeafletAssets = (): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      if ((globalThis as unknown as Window).L) return resolve();
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Leaflet"));
      document.head.appendChild(script);
    });
  };

  const applyLeafletMiniMapFallback = async (msg = "Leaflet_Mini_Fallback"): Promise<void> => {
    console.warn(`> [MiniMap] Triggering Leaflet Fallback: ${msg}`);
    try {
      await loadLeafletAssets();
      const L = (globalThis as unknown as Window).L as LeafletLib;
      container.innerHTML = "";

      const leafletMap = L.map(container as Element, {
        center: [lat, lng],
        zoom: 13,
        zoomControl: false,
        attributionControl: false,
        interactive: false,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        subdomains: "abcd",
        maxZoom: 19,
      }).addTo(leafletMap);

      (container as HTMLElement).style.filter = "brightness(1.25) contrast(1.05)";
      (container as HTMLElement).style.background = "#050505";

      const icon = L.divIcon({
        className: "custom-radar-icon",
        html: `
            <div class="radar-ping" style="width:20px; height:20px; position:relative;">
                <div class="absolute inset-0 rounded-full animate-ping opacity-75" style="background-color: ${color}"></div>
                <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full shadow-[0_0_20px_${color}]" style="background-color: ${color}"></div>
            </div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      L.marker([lat, lng], { icon }).addTo(leafletMap);

      setTimeout(() => leafletMap.invalidateSize(), 500);

      console.log("> [MiniMap] Leaflet Mini-Map ready.");
    } catch (err) {
      console.error("> [MiniMap] Leaflet Fallback failed:", err);
      const staticUrl = `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/${lng},${lat},14,0/600x600?access_token=${mapboxgl.accessToken}&attribution=false&logo=false`;
      container.innerHTML = `
          <div class="relative w-full h-full overflow-hidden flex items-center justify-center bg-black">
              <img src="${staticUrl}" class="w-full h-full object-cover grayscale opacity-60" alt="Fallback">
              <div class="absolute bottom-2 left-2 bg-black/80 px-2 py-0.5 text-[8px] font-mono text-gold uppercase border border-gold/20 z-20">LINK_OFFLINE</div>
          </div>
      `;
    }
  };

  if (!mapboxgl.supported()) {
    console.warn("> [MiniMap] WebGL is not supported. Switching to Leaflet.");
    applyLeafletMiniMapFallback("WebGL_Unsupported");
    return;
  }
  console.log("> [MiniMap] WebGL support confirmed.");

  try {
    console.log("> [MiniMap] Starting map instance creation...");
    const map = new mapboxgl.Map({
      container: container as Element,
      style: "mapbox://styles/mapbox/dark-v10",
      center: [lng, lat],
      zoom: 1,
      interactive: false,
      attributionControl: false,
      failIfMajorPerformanceCaveat: false,
    });
    console.log("> [MiniMap] Instance created successfully.");

    map.on("error", (e?: { error?: unknown }) => {
      console.error("> [MiniMap] Mapbox internal error:", e?.error);
    });

    map.on("load", () => {
      console.log("> [MiniMap] Map 'load' event fired. Initiating staggered resize...");

      const resizeInterval = setInterval(() => {
        console.log("> [MiniMap] Periodic resize trigger...");
        map.resize();
      }, 1000);

      setTimeout(() => {
        clearInterval(resizeInterval);
        console.log("> [MiniMap] Staggered resize sequence complete.");
      }, 5000);

      console.log("> [MiniMap] Scheduling flyTo sequence (2s delay)...");
      setTimeout(() => {
        console.log("> [MiniMap] Executing flyTo...");
        map.flyTo({
          center: [lng, lat],
          zoom: 14,
          speed: 0.8,
          curve: 1.5,
          essential: true,
        });
      }, 2000);

      map.on("moveend", () => {
        console.log("> [MiniMap] Map movement/zoom sequence complete.");
      });

      const el = document.createElement("div");
      el.className = "radar-ping";
      el.style.width = "20px";
      el.style.height = "20px";
      el.innerHTML = `
          <div class="relative w-full h-full flex items-center justify-center">
              <div class="absolute w-full h-full rounded-full animate-ping opacity-75" style="background-color: ${color}"></div>
              <div class="absolute w-2 h-2 rounded-full shadow-[0_0_10px_${color}]" style="background-color: ${color}"></div>
          </div>
      `;

      const factionName = (props.factionName ?? "UNKNOWN").toString();
      const popup = new mapboxgl.Popup({ offset: 15, className: "custom-popup-theme" }).setHTML(`
            <div class="p-3 bg-obsidian text-gray-300">
                <h4 class="text-gold text-xs font-bold mb-1 uppercase tracking-widest border-b border-gold/20 pb-1">${factionName.toUpperCase()} HQ</h4>
                <p class="text-[9px] leading-relaxed text-gray-400 font-mono">SIGNAL_STRENGTH: OPTIMAL<br>VECTOR_LOCK: CONFIRMED</p>
            </div>
        `);

      new mapboxgl.Marker(el).setLngLat([lng, lat]).setPopup(popup).addTo(map);
    });

    const resizeHandler = (): void => { map.resize(); };
    window.addEventListener("resize", resizeHandler);
    if (resizeHandlerRef) {
      resizeHandlerRef.handler = resizeHandler;
    }
  } catch (err) {
    console.error("> [MiniMap] Critical Initialization Failure:", err);
    applyLeafletMiniMapFallback("Initialization_Failed");
  }

  gsap.to(container, {
    opacity: 1,
    scale: 1,
    filter: "contrast(1.2) brightness(0.8)",
    duration: 1.5,
    ease: "power3.out",
    delay: 0.2,
  });
};

const applyFactionTheme = (colorHex: string | undefined, bannerUrl: string | undefined): string => {
  const themeColor = colorHex ?? "#c5a059";
  document.documentElement.style.setProperty("--theme-color", themeColor);

  const banner = document.getElementById("faction-banner");
  if (banner && bannerUrl) {
    banner.style.backgroundImage = `url('${bannerUrl}')`;
    NoirEffects.revealImage(banner);
  }
  return themeColor;
};

const injectFactionSeo = (faction: FactionDocument, safeTitle: string): void => {
  try {
    const plainDesc = faction.description
      ? faction.description
          .map((block) => block.children?.map((child) => child.text).join(""))
          .join(" ")
      : faction.motto ?? "";

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

const renderFactionHeader = (
  els: FactionElements,
  faction: FactionDocument,
  safeTitle: string,
  resizeHandlerRef: { handler: (() => void) | null }
): void => {
  if (els.title) {
    els.title.innerHTML = `<span class="glitch-text" data-text="${safeTitle}">${safeTitle}</span>`;
    gsap.from(els.title, {
      opacity: 0,
      x: -30,
      duration: 1,
      ease: "power4.out",
      delay: 0.5,
    });
  }

  if (els.subtitle) {
    els.subtitle.textContent = faction.motto ? `"${faction.motto}"` : `// MOTTO_REDACTED`;
    gsap.from(els.subtitle, {
      opacity: 0,
      y: 10,
      duration: 0.8,
      ease: "power2.out",
      delay: 0.7,
    });
  }

  if (els.fileId) {
    const typeCode = faction.type === "syndicate" ? "SYN" : "CORP";
    const randomHex = Math.random().toString(16).substr(2, 4).toUpperCase();
    els.fileId.textContent = `FILE: ${typeCode}-${randomHex}`;
  }

  const type = faction.type ?? "syndicate";
  const icon =
    type === "syndicate"
      ? '<i class="fas fa-skull-crossbones text-6xl opacity-30"></i>'
      : '<i class="fas fa-chess-king text-6xl opacity-30"></i>';
  if (els.iconContainer) {
    els.iconContainer.innerHTML = `<div class="scanning-bar animate-[scan_3s_linear_infinite]"></div>${icon}`;
    gsap.from(els.iconContainer, { scale: 0.8, opacity: 0, duration: 1, ease: "back.out(1.7)", delay: 0.3 });
  }

  const themeColor = applyFactionTheme(faction.color?.hex, faction.image?.asset?.url);

  if (faction.hqLocation?.lat && faction.hqLocation?.lng) {
    setTimeout(
      () =>
        initMiniMap(
          faction.hqLocation!.lat,
          faction.hqLocation!.lng,
          themeColor,
          "mini-map",
          document,
          { factionName: faction.title },
          resizeHandlerRef
        ),
      1200
    );
  }
};

const renderFactionInfo = (els: FactionElements, faction: FactionDocument): void => {
  if (els.leader) {
    const leaderName = faction.leader ? faction.leader.name : "REDACTED";
    els.leader.innerHTML = `<span class="glitch-hover cursor-pointer">${leaderName}</span>`;
  }

  if (els.hq) els.hq.textContent = faction.hqName ?? "LOC_ENCRYPTED";

  if (els.threat) {
    const threatLevel = (faction.threatLevel ?? "unknown").toLowerCase();
    const levels: Record<string, { active: number; color: string }> = {
      minimal: { active: 1, color: "bg-cyan-500" },
      low: { active: 2, color: "bg-green-500" },
      medium: { active: 3, color: "bg-yellow-500" },
      high: { active: 4, color: "bg-orange-500" },
      critical: { active: 5, color: "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" },
      extreme: { active: 5, color: "bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.8)]" },
      unknown: { active: 0, color: "bg-gray-800" },
    };

    const config = levels[threatLevel] ?? levels["unknown"];
    const bars = els.threat.querySelectorAll(".threat-indicator-bar");

    gsap.to(bars, {
      backgroundColor: (i: number) => (i < config.active ? "" : "#1f2937"),
      duration: 0.1,
      stagger: 0.1,
      onStart: () => {
        bars.forEach((bar, i) => {
          if (i < config.active) {
            bar.className = `threat-indicator-bar w-2 h-4 ${config.color}`;
            gsap.from(bar, { opacity: 0, duration: 0.3, delay: i * 0.1 });
          }
        });
      },
    });
  }
};

const renderFactionDescription = (els: FactionElements, faction: FactionDocument): void => {
  if (!els.description) return;

  if (faction.description) {
    const rawHTML = toHTML(faction.description as unknown as import('@portabletext/types').TypedObject[], {
      components: {
        block: {
          normal: ({ children }: { children?: string }) => `<p class="opacity-90 leading-relaxed">${children}</p>`,
          h2: ({ children }: { children?: string }) => `<h3 class="text-xl text-gold mt-6 mb-3">${children}</h3>`,
        },
      },
    });

    els.description.innerHTML = "";
    const textLayer = document.createElement("div");
    textLayer.className = "terminal-text-layer";
    textLayer.innerHTML = rawHTML;
    els.description.appendChild(textLayer);

    const cursor = document.createElement("span");
    cursor.className = "terminal-cursor";
    els.description.appendChild(cursor);

    gsap.set(textLayer, { opacity: 0 });

    const revealTl = gsap.timeline({ delay: 1.5 });

    revealTl.to(textLayer, { opacity: 1, duration: 0.5 });

    const paragraphs = textLayer.querySelectorAll("p, h3");
    paragraphs.forEach((p, index) => {
      const originalText = p.innerHTML;
      p.innerHTML = "";

      revealTl.add(() => {
        NoirEffects.typewriterEffect(p, originalText);
      }, index * 0.8);
    });

    revealTl.to(cursor, { opacity: 0, duration: 0.5, delay: 1 });
  } else {
    els.description.innerHTML = `<p class="text-gray-500 italic font-mono uppercase tracking-widest text-sm">[ NO DATA RECORDED IN SYNDICATE ARCHIVE ]</p>`;
  }
};

const renderFactionRoster = (els: FactionElements, faction: FactionDocument): void => {
  if (!els.roster) return;

  if (faction.members && faction.members.length > 0) {
    els.roster.innerHTML = faction.members
      .map((member) => {
        const avatarUrl =
          member.imageUrl ??
          `https://ui-avatars.com/api/?background=1a1a1a&color=888&name=${encodeURIComponent(member.name ?? "User")}`;
        return `
                <a href="character-detail.html?slug=${member.slug}" class="roster-card bg-black/40 p-4 border border-white/5 flex items-center space-x-4 hover:bg-gold/5 hover:border-gold/30 transition-all group tech-clip relative overflow-hidden">
                    <div class="absolute inset-0 bg-gradient-to-r from-gold/0 via-gold/5 to-gold/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    <div class="w-12 h-12 bg-black overflow-hidden ring-1 ring-white/10 group-hover:ring-gold/50 transition-all">
                        <img src="${avatarUrl}" class="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 group-hover:scale-110">
                    </div>
                    <div>
                        <h4 class="font-serif text-gray-200 leading-tight group-hover:text-white">${member.name}</h4>
                        <p class="text-[9px] text-gold/40 font-mono uppercase tracking-[0.2em] group-hover:text-gold transition-colors">${member.role ?? "ASSOCIATE"}</p>
                    </div>
                    <i class="fas fa-chevron-right absolute right-4 opacity-0 group-hover:opacity-40 transition-opacity text-[10px]"></i>
                </a>`;
      })
      .join("");
  } else {
    els.roster.innerHTML = `<div class="text-[10px] font-mono text-gray-600 col-span-full py-8 text-center border border-dashed border-white/5 uppercase tracking-widest">[ PERSONNEL_RECORDS_REDACTED ]</div>`;
  }
};

const renderFactionRelations = (els: FactionElements, faction: FactionDocument): void => {
  if (!els.relations) return;

  if (faction.relations && faction.relations.length > 0) {
    els.relations.innerHTML = faction.relations
      .map((rel) => {
        let statusColor = "text-gray-400";
        const icon = "fa-circle-nodes";

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

const renderFactionDetails = (
  faction: FactionDocument,
  _container: Element,
  resizeHandlerRef: { handler: (() => void) | null }
): void => {
  const searchRoot = document.getElementById("main-wrapper") ?? document;

  const els: FactionElements = {
    title: (searchRoot as Document | Element).querySelector("#faction-title"),
    subtitle: (searchRoot as Document | Element).querySelector("#faction-subtitle"),
    fileId: (searchRoot as Document | Element).querySelector("#faction-file-id"),
    leader: (searchRoot as Document | Element).querySelector("#faction-leader"),
    hq: (searchRoot as Document | Element).querySelector("#faction-hq"),
    description: (searchRoot as Document | Element).querySelector("#faction-description"),
    iconContainer: (searchRoot as Document | Element).querySelector("#faction-icon-container"),
    roster: (searchRoot as Document | Element).querySelector("#faction-roster"),
    threat: (searchRoot as Document | Element).querySelector("#threat-indicator"),
    relations: (searchRoot as Document | Element).querySelector("#faction-locations-list"),
  };

  const safeTitle = faction.title ?? "Unknown Faction";
  document.title = i18next.t("faction_detail_loader.meta_title", {
    factionName: safeTitle,
  });

  injectFactionSeo(faction, safeTitle);
  renderFactionHeader(els, faction, safeTitle, resizeHandlerRef);
  renderFactionInfo(els, faction);
  renderFactionDescription(els, faction);
  renderFactionRoster(els, faction);
  renderFactionRelations(els, faction);

  const grid = document.querySelector("main");
  if (grid) grid.classList.remove("opacity-0");
};

export default async function (container: Element, props: LoaderProps): Promise<void> {
  const loader = document.getElementById("factions-loader");
  const mainContainer = document.querySelector("main");
  const params = new URLSearchParams(globalThis.location.search);
  const factionSlug = params.get("slug");

  const resizeHandlerRef: { handler: (() => void) | null } = { handler: null };

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

    const faction = await client.fetch<FactionDocument>(query, { slug: factionSlug });
    console.log("> Sanity Result:", faction);

    if (loader) {
      gsap.to(loader, { opacity: 0, duration: 0.5, onComplete: () => loader.remove() });
    }

    if (faction) {
      gsap.to(mainContainer, { opacity: 1, duration: 0.8, delay: 0.2 });
      renderFactionDetails(faction, container, resizeHandlerRef);
    } else {
      const titleEl = document.getElementById("faction-title");
      if (titleEl) titleEl.textContent = "DATA CORRUPTED";
      if (loader) loader.remove();
      gsap.to(mainContainer, { opacity: 1, duration: 0.5 });
    }
  } catch (error) {
    console.error("Intel Failure:", error);
    const titleEl = document.getElementById("faction-title");
    if (titleEl) titleEl.textContent = "SYSTEM MALFUNCTION";
    if (loader) loader.remove();
    gsap.to(mainContainer, { opacity: 1, duration: 0.5 });
  }
}
