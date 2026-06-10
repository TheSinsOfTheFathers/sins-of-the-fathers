import * as d3 from 'd3';
import { client } from '../../lib/sanityClient';
import i18next from '../../lib/i18n';

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

interface TierMap {
    [key: string]: number;
}

interface NameMap {
    [key: string]: string;
}

interface SanityFactionColor {
    hex: string;
}

interface SanityFaction {
    title: string;
    slug: string;
    color?: SanityFactionColor;
}

interface SanityCharacterFaction {
    title: string;
    slug: string;
}

interface SanityCharacter {
    name: string;
    slug: string;
    faction?: SanityCharacterFaction;
}

interface D1Entity {
    id: string;
    name: string;
    status: string;
    threatLevel: string;
    [key: string]: unknown;
}

interface D1BloodlineLink {
    source: { id: string } | string;
    target: { id: string } | string;
    relationType: string;
    [key: string]: unknown;
}

interface D1Response {
    data: {
        entities: D1Entity[];
        bloodlineLinks: D1BloodlineLink[];
    };
}

interface ProcessedNode extends D1Entity {
    faction: string;
    factionColor: string;
    tier: number;
    x?: number;
    y?: number;
    fx?: number | null;
    fy?: number | null;
}

interface ProcessedLink {
    source: string | ProcessedNode;
    target: string | ProcessedNode;
    relationType: string;
    [key: string]: unknown;
}

interface FactionMap {
    [nameKey: string]: string;
}

interface SlugMap {
    [nameKey: string]: string;
}

const TIER_MAP: TierMap = {
    "char_roland": 0,
    "char_miranda": 1,
    "char_lek": 1,
    "char_julian": 1,
    "char_gideon": 1,
    "char_havi": 1,
    "char_silvio_sezar": 2,
    "char_menslier": 2,
    "char_elias": 2,
    "char_hamish": 3,
    "char_nathaniel": 4
};

const NAME_MAP: NameMap = {
    "Silvio & Sezar Orsini": "Silvio"
};

let factionFilterListenersAttached = false;

export const renderBloodline = async (containerSelector: string): Promise<void> => {
    const container = document.querySelector<HTMLElement>(containerSelector);
    if (!container) return;

    try {
        const responseList = await Promise.all([
            fetch('https://ai-brain.bbabacanbaba059.workers.dev/api/bloodline').then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json() as Promise<D1Response>;
            }),
            client.fetch<SanityFaction[]>('*[_type == "faction"]{title, "slug": slug.current, color}'),
            client.fetch<SanityCharacter[]>('*[_type == "character"]{name, "slug": slug.current, faction->{title, "slug": slug.current}}')
        ]);

        const d1Data = responseList[0].data;
        const sanityFactions = responseList[1];
        const sanityCharacters = responseList[2];

        const FACTION_MAP: FactionMap = {};
        const SLUG_MAP: SlugMap = {};
        sanityCharacters.forEach(c => {
            const nameKey = c.name.toLowerCase();
            if (c.faction) FACTION_MAP[nameKey] = c.faction.slug;
            if (c.slug) SLUG_MAP[nameKey] = c.slug;
        });

        const filtersContainer = document.querySelector<HTMLElement>('.faction-filters');

        const generateButtons = (): string => {
            let html = `<button data-faction="ALL" class="active px-4 py-1.5 text-[10px] tracking-widest uppercase font-mono border border-white/10 hover:border-gold/50 text-white/70 transition-all rounded-full whitespace-nowrap">ALL</button>`;
            sanityFactions.forEach(f => {
                const safeSlug = escapeHtml(f.slug);
                const safeColor = escapeHtml(f.color?.hex ?? '#c5a059');
                const safeTitle = escapeHtml(f.title);
                html += `<button data-faction="${safeSlug}" class="px-4 py-1.5 text-[10px] tracking-widest uppercase font-mono border border-white/10 hover:border-gold/50 text-white/70 transition-all rounded-full whitespace-nowrap" style="--faction-color: ${safeColor}">${safeTitle}</button>`;
            });
            return html;
        };

        if (filtersContainer) {
            filtersContainer.innerHTML = generateButtons();
            factionFilterListenersAttached = false;
        }

        const nodes: ProcessedNode[] = d1Data.entities.map(n => {
            const mappedName = NAME_MAP[n.name] ?? n.name;
            const factionSlug = FACTION_MAP[mappedName.toLowerCase()] ?? "independent";
            const factionDetails = sanityFactions.find(f => f.slug === factionSlug);

            return {
                ...n,
                faction: factionSlug,
                factionColor: factionDetails?.color?.hex ?? (factionSlug === 'independent' ? '#555' : '#c5a059'),
                tier: TIER_MAP[n.id] !== undefined ? TIER_MAP[n.id] : 3
            };
        });

        const links: ProcessedLink[] = d1Data.bloodlineLinks.map(link => ({
            ...link,
            source: typeof link.source === 'object' ? (link.source as { id: string }).id : link.source,
            target: typeof link.target === 'object' ? (link.target as { id: string }).id : link.target
        }));

        setupD3Graph(container, containerSelector, nodes, links, sanityFactions, SLUG_MAP);
    } catch (error) {
        console.error("Error fetching or processing Bloodline + Sanity data:", error);
    }
};

const setupD3Graph = (
    container: HTMLElement,
    containerSelector: string,
    nodesData: ProcessedNode[],
    linksData: ProcessedLink[],
    sanityFactions: SanityFaction[],
    slugMap: SlugMap
): void => {
    const width = container.clientWidth;

    container.innerHTML = '';

    const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.2, 3])
        .on("zoom", (e) => g.attr("transform", e.transform));

    const svg = d3.select<HTMLElement, unknown>(containerSelector)
        .append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .call(zoom)
        .on("dblclick.zoom", null);

    const g = svg.append('g').attr('class', 'bloodline-canvas');

    let currentFaction = "ALL";
    let activeNodes: ProcessedNode[] = [...nodesData];
    let activeLinks: ProcessedLink[] = [...linksData];

    if (!factionFilterListenersAttached) {
        document.querySelectorAll<HTMLButtonElement>('.faction-filters button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll<HTMLButtonElement>('.faction-filters button').forEach(b => {
                    b.classList.remove('active');
                    b.style.borderColor = "rgba(255,255,255,0.1)";
                    b.style.color = "rgba(255,255,255,0.7)";
                    b.style.background = "transparent";
                });
                const target = e.target as HTMLButtonElement;
                target.classList.add('active');

                const pColor = target.style.getPropertyValue('--faction-color') || '#c5a059';
                target.style.borderColor = pColor;
                target.style.color = pColor;
                target.style.background = `color-mix(in srgb, ${pColor} 10%, transparent)`;

                currentFaction = target.dataset.faction ?? "ALL";
                updateFilter();
            });
        });
        factionFilterListenersAttached = true;
    }

    document.getElementById('zoom-in')?.addEventListener('click', () => svg.transition().call(zoom.scaleBy, 1.5));
    document.getElementById('zoom-out')?.addEventListener('click', () => svg.transition().call(zoom.scaleBy, 0.75));
    document.getElementById('zoom-reset')?.addEventListener('click', () => {
        svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity.translate(width / 2, 100).scale(1));
    });

    const popup = document.getElementById('character-popup');
    popup?.addEventListener('click', (e) => e.stopPropagation());

    const modalName = document.getElementById('modal-name');
    const modalFactionEl = document.getElementById('modal-faction');
    const modalFaction = modalFactionEl?.querySelector<HTMLElement>('.faction-name');
    const modalDot = modalFactionEl?.querySelector<HTMLElement>('.faction-dot');
    const modalLink = document.getElementById('modal-dossier-link') as HTMLAnchorElement | null;

    const showModal = (event: MouseEvent | null, d: ProcessedNode): void => {
        if (event) event.stopPropagation();

        if (modalName) modalName.textContent = d.name;
        if (modalFaction) modalFaction.textContent = d.faction?.split('_').join(' ') ?? 'Independent';
        if (modalDot) modalDot.style.backgroundColor = d.factionColor;

        const nameKey = d.name.toLowerCase();
        const charSlug = slugMap[nameKey] ?? d.id;
        if (modalLink) {
            modalLink.href = `/pages/character-detail.html?slug=${charSlug}`;
            modalLink.onclick = (e: MouseEvent) => {
                e.preventDefault();
                e.stopPropagation();
                window.location.href = modalLink.href;
            };
            modalLink.style.pointerEvents = 'auto';
        }

        if (event && popup) {
            const rect = (event.currentTarget as Element).getBoundingClientRect();
            const mainRect = container.getBoundingClientRect();

            popup.style.left = `${rect.right + 20 - mainRect.left}px`;
            popup.style.top = `${rect.top - mainRect.top}px`;

            popup.classList.add('active');
            popup.classList.remove('hidden');
        }
    };

    const closeModal = (): void => {
        popup?.classList.remove('active');
        setTimeout(() => {
            if (popup && !popup.classList.contains('active')) popup.classList.add('hidden');
        }, 200);
    };

    document.getElementById('modal-close')?.addEventListener('click', closeModal);
    svg.on('click', () => { closeModal(); });

    const linkGroup = g.append('g').attr('class', 'links');
    const nodeGroup = g.append('g').attr('class', 'nodes');

    const simulation = d3.forceSimulation<ProcessedNode>()
        .force("link", d3.forceLink<ProcessedNode, ProcessedLink>().id(d => d.id).distance(150).strength(0.3))
        .force("charge", d3.forceManyBody<ProcessedNode>().strength(-1200))
        .force("collide", d3.forceCollide<ProcessedNode>().radius(120).iterations(3))
        .force("x", d3.forceX<ProcessedNode>(0).strength(0.05))
        .force("y", d3.forceY<ProcessedNode>(d => d.tier * 180).strength(0.8));

    let nodeElements: d3.Selection<SVGGElement, ProcessedNode, SVGGElement, unknown>;
    let linkElements: d3.Selection<SVGPathElement, ProcessedLink, SVGGElement, unknown>;
    let linkHitAreas: d3.Selection<SVGPathElement, ProcessedLink, SVGGElement, unknown>;

    function render(): void {
        linkHitAreas = linkGroup.selectAll<SVGPathElement, ProcessedLink>('.link-hit-area')
            .data(activeLinks, d => {
                const s = typeof d.source === 'object' ? (d.source as ProcessedNode).id : d.source;
                const t = typeof d.target === 'object' ? (d.target as ProcessedNode).id : d.target;
                return `${s}-${t}`;
            });

        linkHitAreas.exit().remove();

        const hitEnter = linkHitAreas.enter().append('path')
            .attr('class', 'link-hit-area')
            .attr('fill', 'none')
            .attr('stroke', 'transparent')
            .attr('stroke-width', 15)
            .on("mouseenter", (event: MouseEvent, d: ProcessedLink) => showRelationshipTooltip(event, d))
            .on("mousemove", (event: MouseEvent) => positionRelationshipTooltip(event))
            .on("mouseleave", () => hideRelationshipTooltip());

        linkHitAreas = hitEnter.merge(linkHitAreas);

        linkElements = linkGroup.selectAll<SVGPathElement, ProcessedLink>('path.link-line')
            .data(activeLinks, d => {
                const s = typeof d.source === 'object' ? (d.source as ProcessedNode).id : d.source;
                const t = typeof d.target === 'object' ? (d.target as ProcessedNode).id : d.target;
                return `${s}-${t}`;
            });

        linkElements.exit().transition().duration(300).attr('opacity', 0).remove();

        const linkEnter = linkElements.enter().append('path')
            .attr('class', 'link-line')
            .attr('fill', 'none')
            .attr('stroke', (d: ProcessedLink) => {
                if (d.relationType === 'BLOOD_RELATION') return '#c5a059';
                if (d.relationType === 'BLOOD_OATH' || d.relationType === 'RIVAL') return '#7f1d1d';
                return '#4b5563';
            })
            .attr('stroke-width', (d: ProcessedLink) => d.relationType === 'BLOOD_RELATION' ? 3 : 2)
            .attr('stroke-dasharray', (d: ProcessedLink) => d.relationType === 'RIVAL' ? '5,5' : 'none')
            .attr('opacity', 0);

        linkElements = linkEnter.merge(linkElements);
        linkElements.transition().duration(300).attr('opacity', 0.8);

        nodeElements = nodeGroup.selectAll<SVGGElement, ProcessedNode>('g.bloodline-node')
            .data(activeNodes, d => d.id);

        nodeElements.exit().transition().duration(300).attr('opacity', 0).remove();

        const nodeEnter = nodeElements.enter().append('g')
            .attr('class', 'bloodline-node cursor-pointer')
            .attr('opacity', 0)
            .call(d3.drag<SVGGElement, ProcessedNode>()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));

        nodeElements = nodeEnter.merge(nodeElements);

        nodeElements.on('click', (event: MouseEvent, d: ProcessedNode) => {
            if (event.defaultPrevented) return;
            showModal(event, d);
        });

        nodeElements.transition().duration(500).attr('opacity', 1);

        nodeEnter.append('rect')
            .attr('width', 200)
            .attr('height', 70)
            .attr('x', -100)
            .attr('y', -35)
            .attr('fill', '#0a0a0b')
            .attr('stroke', (d: ProcessedNode) => d.factionColor)
            .attr('stroke-width', 1.5)
            .attr('rx', 4);

        nodeEnter.append('text')
            .attr('dy', -8)
            .attr('text-anchor', 'middle')
            .attr('class', 'font-serif text-[14px] tracking-wider fill-white')
            .text((d: ProcessedNode) => d.name);

        nodeEnter.append('text')
            .attr('dy', 12)
            .attr('text-anchor', 'middle')
            .attr('class', 'font-mono text-[9px] uppercase tracking-widest fill-gray-500')
            .text((d: ProcessedNode) => `STATUS: ${d.status}`);

        nodeEnter.append('text')
            .attr('dy', 25)
            .attr('text-anchor', 'middle')
            .attr('class', (d: ProcessedNode) => `font-mono text-[9px] uppercase tracking-widest ${d.threatLevel === 'CRITICAL' ? 'fill-red-500' : 'fill-gray-600'}`)
            .text((d: ProcessedNode) => `THREAT: ${d.threatLevel}`);

        nodeElements = nodeEnter.merge(nodeElements);
        nodeElements.transition().duration(300).attr('opacity', 1);

        simulation.nodes(activeNodes).on("tick", ticked);
        (simulation.force("link") as d3.ForceLink<ProcessedNode, ProcessedLink>).links(activeLinks);
        simulation.alpha(1).restart();
    }

    function updateFilter(): void {
        if (currentFaction === "ALL") {
            activeNodes = nodesData;
        } else {
            activeNodes = nodesData.filter(d => d.faction === currentFaction);
        }

        const activeNodeIds = new Set(activeNodes.map(n => n.id));
        activeLinks = linksData.filter(l => {
            const sourceId = typeof l.source === 'object' ? (l.source as ProcessedNode).id : l.source;
            const targetId = typeof l.target === 'object' ? (l.target as ProcessedNode).id : l.target;
            return activeNodeIds.has(sourceId) && activeNodeIds.has(targetId);
        });

        render();
    }

    function ticked(): void {
        linkElements.attr("d", (d: ProcessedLink) => {
            const s = d.source as ProcessedNode;
            const t = d.target as ProcessedNode;
            return `M${s.x},${s.y}L${t.x},${t.y}`;
        });
        linkHitAreas.attr("d", (d: ProcessedLink) => {
            const s = d.source as ProcessedNode;
            const t = d.target as ProcessedNode;
            return `M${s.x},${s.y}L${t.x},${t.y}`;
        });
        nodeElements.attr("transform", (d: ProcessedNode) => `translate(${d.x},${d.y})`);
    }

    function dragstarted(this: SVGGElement, event: d3.D3DragEvent<SVGGElement, ProcessedNode, unknown>, d: ProcessedNode): void {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
        d3.select<SVGGElement, ProcessedNode>(this).select('rect').attr('stroke', '#fff');
    }

    function dragged(event: d3.D3DragEvent<SVGGElement, ProcessedNode, unknown>, d: ProcessedNode): void {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragended(this: SVGGElement, event: d3.D3DragEvent<SVGGElement, ProcessedNode, unknown>, d: ProcessedNode): void {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
        d3.select<SVGGElement, ProcessedNode>(this).select('rect').attr('stroke', () => d.factionColor);
    }

    render();
    svg.call(zoom.transform, d3.zoomIdentity.translate(width / 2, 100).scale(1));
};

function showRelationshipTooltip(event: MouseEvent, d: ProcessedLink): void {
    const tooltip = d3.select('#bloodline-tooltip');
    const content = d3.select('#tooltip-content');

    const currentLang = localStorage.getItem('app_language') ?? 'en';

    let relationLabel = d.relationType;
    const i18nKey = `bloodline_relations.${d.relationType}`;

    if (i18next.exists(i18nKey)) {
        relationLabel = i18next.t(i18nKey);
    }

    const source = d.source as ProcessedNode;
    const target = d.target as ProcessedNode;
    const sourceName = source.name ?? (source as unknown as { id: string }).id;
    const targetName = target.name ?? (target as unknown as { id: string }).id;

    const contentNode = content.node() as HTMLElement | null;
    if (contentNode) {
        contentNode.innerHTML = '';

        const nameDiv = document.createElement('div');
        nameDiv.className = 'text-white font-serif tracking-widest uppercase text-[11px] mb-1';

        if (currentLang === 'tr') {
            const suffix = getTurkishSuffix(targetName);
            nameDiv.textContent = `${sourceName}, ${targetName}${suffix} ${relationLabel}`;
        } else {
            nameDiv.textContent = `${sourceName}: ${relationLabel} of ${targetName}`;
        }

        const metaDiv = document.createElement('div');
        metaDiv.className = 'text-gold/60 text-[8px] uppercase tracking-tighter';
        metaDiv.textContent = currentLang === 'tr'
            ? 'Güven Aralığı: %98.4 // İstihbarat Aktif'
            : 'Confidence Level: 98.4% // Intel Active';

        contentNode.appendChild(nameDiv);
        contentNode.appendChild(metaDiv);
    }

    tooltip.style('opacity', 1);
    positionRelationshipTooltip(event);
}

function positionRelationshipTooltip(event: MouseEvent): void {
    const tooltip = d3.select('#bloodline-tooltip');
    tooltip
        .style('left', (event.pageX + 15) + 'px')
        .style('top', (event.pageY + 15) + 'px');
}

function hideRelationshipTooltip(): void {
    d3.select('#bloodline-tooltip').style('opacity', 0);
}

function getTurkishSuffix(name: string): string {
    if (!name) return "";
    const vowels = "aeıioöuüAEIİOÖUÜ";
    const lastChar = name[name.length - 1];

    let lastVowel = 'e';
    for (let i = name.length - 1; i >= 0; i--) {
        if (vowels.includes(name[i])) {
            lastVowel = name[i].toLowerCase();
            break;
        }
    }

    const isVowelEnding = vowels.includes(lastChar);

    let suffix = "";
    if ("aı".includes(lastVowel)) suffix = isVowelEnding ? "nın" : "ın";
    else if ("ei".includes(lastVowel)) suffix = isVowelEnding ? "nin" : "in";
    else if ("ou".includes(lastVowel)) suffix = isVowelEnding ? "nun" : "un";
    else if ("öü".includes(lastVowel)) suffix = isVowelEnding ? "nün" : "ün";

    return "'" + suffix;
}
