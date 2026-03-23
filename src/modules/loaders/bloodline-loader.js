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
            client.fetch('*[_type == "character"]{name, faction->{title, "slug": slug.current}}')
        ]);

        const d1Data = responseList[0].data;
        const sanityFactions = responseList[1];
        const sanityCharacters = responseList[2];

        // 1. Build Faction Map from Sanity Characters
        const FACTION_MAP = {};
        sanityCharacters.forEach(c => {
            if (c.faction) {
                FACTION_MAP[c.name.toLowerCase()] = c.faction.slug;
            }
        });

        // 2. Generate Filter Buttons Dynamically
        const filtersContainerDesktop = document.querySelector('.faction-filters.hidden.md\\:flex');
        const filtersContainerMobile = document.querySelector('.faction-filters.md\\:hidden');
        
        const generateButtons = (isMobile) => {
            let html = `<button data-faction="ALL" class="active px-3 py-1 border border-white/10 hover:border-gold/50 text-white/70 transition-all rounded">ALL</button>`;
            sanityFactions.forEach(f => {
                const label = isMobile ? f.title.substring(0, 5).toUpperCase() : f.title.toUpperCase();
                html += `<button data-faction="${f.slug}" class="px-3 py-1 border border-white/10 hover:border-gold/50 text-white/70 transition-all rounded" style="--faction-color: ${f.color?.hex || '#c5a059'}">${label}</button>`;
            });
            return html;
        };

        if (filtersContainerDesktop) filtersContainerDesktop.innerHTML = generateButtons(false);
        if (filtersContainerMobile) filtersContainerMobile.innerHTML = generateButtons(true);

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

        setupD3Graph(container, containerSelector, nodes, links, sanityFactions);
    } catch (error) {
        console.error("Error fetching or processing Bloodline + Sanity data:", error);
    }
};

const setupD3Graph = (container, containerSelector, nodesData, linksData, sanityFactions) => {
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
            .attr('stroke', d => d.relationType === 'RIVAL' || d.relationType === 'BLOOD_OATH' ? '#7f1d1d' : '#4b5563')
            .attr('stroke-width', 2)
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
