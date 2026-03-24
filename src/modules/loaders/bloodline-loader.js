import * as d3 from 'd3';
import { client } from '../../lib/sanityClient.js';

// Depth/Tier mapping to force a hierarchical Tree-like Top-Down layout
const TIER_MAP = {
    "char_roland": 0, // Patriarch
    "char_miranda": 1, // High Command
    "char_lek": 1,
    "char_julian": 1,
    "char_gideon": 1,
    "char_havi": 1,
    "char_silvio_sezar": 2, // Europe / Finance heads
    "char_menslier": 2,
    "char_elias": 2,
    "char_hamish": 3, // Logistics
    "char_nathaniel": 4 // Ground rules
};

// D1 and Sanity Name mismatches mapping (D1 Name -> Sanity Name)
const NAME_MAP = {
    "Silvio & Sezar Orsini": "Silvio"
};

export const renderBloodline = async (containerSelector) => {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    try {
        // Fetch D1 Bloodline Data
        const responseList = await Promise.all([
            fetch('https://ai-brain.bbabacanbaba059.workers.dev/api/bloodline').then(r => r.json()),
            client.fetch('*[_type == "faction"]{title, "slug": slug.current, color}'),
            client.fetch('*[_type == "character"]{name, "slug": slug.current, faction->{title, "slug": slug.current}}')
        ]);

        const d1Data = responseList[0].data;
        const sanityFactions = responseList[1];
        const sanityCharacters = responseList[2];

        // 1. Build Faction & Slug Maps from Sanity
        const FACTION_MAP = {};
        const SLUG_MAP = {};
        sanityCharacters.forEach(c => {
            const nameKey = c.name.toLowerCase();
            if (c.faction) FACTION_MAP[nameKey] = c.faction.slug;
            if (c.slug) SLUG_MAP[nameKey] = c.slug;
        });

        // 2. Generate Filter Buttons Dynamically
        const filtersContainer = document.querySelector('.faction-filters');
        
        const generateButtons = () => {
            let html = `<button data-faction="ALL" class="active px-4 py-1.5 text-[10px] tracking-widest uppercase font-mono border border-white/10 hover:border-gold/50 text-white/70 transition-all rounded-full whitespace-nowrap">ALL</button>`;
            sanityFactions.forEach(f => {
                html += `<button data-faction="${f.slug}" class="px-4 py-1.5 text-[10px] tracking-widest uppercase font-mono border border-white/10 hover:border-gold/50 text-white/70 transition-all rounded-full whitespace-nowrap" style="--faction-color: ${f.color?.hex || '#c5a059'}">${f.title}</button>`;
            });
            return html;
        };

        if (filtersContainer) filtersContainer.innerHTML = generateButtons();

        // 3. Process D1 Nodes
        let nodes = d1Data.entities.map(n => {
            const mappedName = NAME_MAP[n.name] || n.name;
            const factionSlug = FACTION_MAP[mappedName.toLowerCase()] || "independent";
            // Get color from sanity faction
            const factionDetails = sanityFactions.find(f => f.slug === factionSlug);

            return {
                ...n, 
                faction: factionSlug,
                factionColor: factionDetails?.color?.hex || (factionSlug === 'independent' ? '#555' : '#c5a059'),
                tier: TIER_MAP[n.id] !== undefined ? TIER_MAP[n.id] : 3
            };
        });

        let links = d1Data.bloodlineLinks.map(link => ({
            ...link,
            source: link.source.id,
            target: link.target.id
        }));

        setupD3Graph(container, containerSelector, nodes, links, sanityFactions, SLUG_MAP);
    } catch (error) {
        console.error("Error fetching or processing Bloodline + Sanity data:", error);
    }
};

const setupD3Graph = (container, containerSelector, nodesData, linksData, sanityFactions, slugMap) => {
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    container.innerHTML = '';
    
    // Zoom behaviors
    const zoom = d3.zoom()
        .scaleExtent([0.2, 3])
        .on("zoom", (e) => g.attr("transform", e.transform));

    const svg = d3.select(containerSelector)
        .append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .call(zoom)
        .on("dblclick.zoom", null);

    const g = svg.append('g').attr('class', 'bloodline-canvas');

    // Filter controls logic
    let currentFaction = "ALL";
    let activeNodes = [...nodesData];
    let activeLinks = [...linksData];

    document.querySelectorAll('.faction-filters button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.faction-filters button').forEach(b => {
                b.classList.remove('active');
                b.style.borderColor = "rgba(255,255,255,0.1)"; 
                b.style.color = "rgba(255,255,255,0.7)";
                b.style.background = "transparent";
            });
            e.target.classList.add('active');
            
            const pColor = e.target.style.getPropertyValue('--faction-color') || '#c5a059';
            e.target.style.borderColor = pColor;
            e.target.style.color = pColor;
            e.target.style.background = `color-mix(in srgb, ${pColor} 10%, transparent)`;

            currentFaction = e.target.dataset.faction;
            updateFilter();
        });
    });

    // Map Controls
    document.getElementById('zoom-in').addEventListener('click', () => svg.transition().call(zoom.scaleBy, 1.5));
    document.getElementById('zoom-out').addEventListener('click', () => svg.transition().call(zoom.scaleBy, 0.75));
    document.getElementById('zoom-reset').addEventListener('click', () => {
        svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity.translate(width/2, 100).scale(1));
    });

    // Popup Logic
    const popup = document.getElementById('character-popup');
    if (popup) popup.addEventListener('click', (e) => e.stopPropagation());

    const modalName = document.getElementById('modal-name');
    const modalFaction = document.getElementById('modal-faction').querySelector('.faction-name');
    const modalDot = document.getElementById('modal-faction').querySelector('.faction-dot');
    const modalLink = document.getElementById('modal-dossier-link');

    const showModal = (event, d) => {
        if (event) event.stopPropagation();
        
        modalName.textContent = d.name;
        modalFaction.textContent = d.faction?.replaceAll('_', ' ') || 'Independent';
        modalDot.style.backgroundColor = d.factionColor;
        
        // Use the mapped slug from Sanity for the Dossier link
        const nameKey = d.name.toLowerCase();
        const charSlug = slugMap[nameKey] || d.id;
        modalLink.href = `/pages/character-detail.html?slug=${charSlug}`;
        
        // Ensure the link click triggers navigation regardless of event interception
        modalLink.onclick = (e) => {
            e.preventDefault(); // Stop any other handlers
            e.stopPropagation();
            window.location.href = modalLink.href;
        };
        modalLink.style.pointerEvents = 'auto';
        
        // Use actual screen position of the clicked node element
        const rect = event.currentTarget.getBoundingClientRect();
        const mainRect = container.getBoundingClientRect();

        popup.style.left = `${rect.right + 20 - mainRect.left}px`;
        popup.style.top = `${rect.top - mainRect.top}px`;
        
        popup.classList.add('active');
        popup.classList.remove('hidden');
    };

    const closeModal = () => {
        popup.classList.remove('active');
        setTimeout(() => { if (!popup.classList.contains('active')) popup.classList.add('hidden'); }, 200);
    };

    document.getElementById('modal-close')?.addEventListener('click', closeModal);
    svg.on('click', () => { closeModal(); });

    // Layers
    const linkGroup = g.append('g').attr('class', 'links');
    const nodeGroup = g.append('g').attr('class', 'nodes');

    // Force Simulation config
    const simulation = d3.forceSimulation()
        .force("link", d3.forceLink().id(d => d.id).distance(150).strength(0.3))
        .force("charge", d3.forceManyBody().strength(-1200))
        .force("collide", d3.forceCollide().radius(120).iterations(3))
        .force("x", d3.forceX(0).strength(0.05))
        .force("y", d3.forceY(d => d.tier * 180).strength(0.8));

    let nodeElements, linkElements;

    function render() {
        linkElements = linkGroup.selectAll('path')
            .data(activeLinks, d => d.source.id + "-" + d.target.id);
        
        linkElements.exit().transition().duration(300).attr('opacity', 0).remove();
        
        const linkEnter = linkElements.enter().append('path')
            .attr('fill', 'none')
            .attr('stroke', d => {
                if (d.relationType === 'BLOOD_RELATION') return '#c5a059'; // Gold
                if (d.relationType === 'BLOOD_OATH' || d.relationType === 'RIVAL') return '#7f1d1d'; // Dark Red
                return '#4b5563'; // Gray
            })
            .attr('stroke-width', d => d.relationType === 'BLOOD_RELATION' ? 3 : 2)
            .attr('stroke-dasharray', d => d.relationType === 'RIVAL' ? '5,5' : 'none')
            .attr('opacity', 0);
            
        linkElements = linkEnter.merge(linkElements);
        linkElements.transition().duration(300).attr('opacity', 0.8);

        nodeElements = nodeGroup.selectAll('g.bloodline-node')
            .data(activeNodes, d => d.id);
            
        nodeElements.exit().transition().duration(300).attr('opacity', 0).remove();
        
        const nodeEnter = nodeElements.enter().append('g')
            .attr('class', 'bloodline-node cursor-pointer')
            .attr('opacity', 0)
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));

        nodeElements = nodeEnter.merge(nodeElements);

        // Add handler to merged selection to ensure all nodes have it
        nodeElements.on('click', (event, d) => {
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
            .attr('stroke', d => d.factionColor)
            .attr('stroke-width', 1.5)
            .attr('rx', 4);

        nodeEnter.append('text')
            .attr('dy', -8)
            .attr('text-anchor', 'middle')
            .attr('class', 'font-serif text-[14px] tracking-wider fill-white')
            .text(d => d.name);

        nodeEnter.append('text')
            .attr('dy', 12)
            .attr('text-anchor', 'middle')
            .attr('class', d => `font-mono text-[9px] uppercase tracking-widest fill-gray-500`)
            .text(d => `STATUS: ${d.status}`);
            
        nodeEnter.append('text')
            .attr('dy', 25)
            .attr('text-anchor', 'middle')
            .attr('class', d => `font-mono text-[9px] uppercase tracking-widest ${d.threatLevel === 'CRITICAL' ? 'fill-red-500' : 'fill-gray-600'}`)
            .text(d => `THREAT: ${d.threatLevel}`);

        nodeElements = nodeEnter.merge(nodeElements);
        nodeElements.transition().duration(300).attr('opacity', 1);

        simulation.nodes(activeNodes).on("tick", ticked);
        simulation.force("link").links(activeLinks);
        simulation.alpha(1).restart();
    }

    function updateFilter() {
        if (currentFaction === "ALL") {
            activeNodes = nodesData;
        } else {
            activeNodes = nodesData.filter(d => d.faction === currentFaction);
        }
        
        const activeNodeIds = new Set(activeNodes.map(n => n.id));
        activeLinks =  linksData.filter(l => {
            const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
            const targetId = typeof l.target === 'object' ? l.target.id : l.target;
            return activeNodeIds.has(sourceId) && activeNodeIds.has(targetId);
        });
        
        render();
    }

    function ticked() {
        linkElements.attr("d", d => {
            const dx = d.target.x - d.source.x,
                  dy = d.target.y - d.source.y,
                  dr = Math.sqrt(dx * dx + dy * dy); 
            return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
        });
        nodeElements.attr("transform", d => `translate(${d.x},${d.y})`);
    }

    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
        d3.select(this).select('rect').attr('stroke', '#fff');
    }

    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
        d3.select(this).select('rect').attr('stroke', d => d.factionColor);
    }

    render();
    svg.call(zoom.transform, d3.zoomIdentity.translate(width/2, 100).scale(1));
};
