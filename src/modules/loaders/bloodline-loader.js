import * as d3 from 'd3';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Initializes and renders the Bloodline / Case File visualization.
 * @param {string} containerSelector - The CSS selector for the container element.
 */
export const renderBloodline = async (containerSelector) => {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    // TODO: Replace with actual Firebase Data Connect fetch
    // const { entities, bloodlineLinks } = await fetchBloodlineData();
    
    // Mock Data for scaffolding
    const mockNodes = [
        { id: "1", name: "Gregor Ravenwood", role: "Industrial Baron", status: "DECEASED", threatLevel: "CRITICAL", imageUrl: "/assets/images/characters/gregor.jpg" },
        { id: "2", name: "Silvio", role: "Information Broker", status: "ACTIVE", threatLevel: "HIGH", imageUrl: "/assets/images/characters/silvio.jpg" },
        { id: "3", name: "Isabella", role: "Assassin", status: "ACTIVE", threatLevel: "HIGH", imageUrl: "/assets/images/characters/isabella.jpg" }
    ];
    
    const mockLinks = [
        { source: "1", target: "2", relationType: "BLOOD_OATH" },
        { source: "1", target: "3", relationType: "BIOLOGICAL" },
        { source: "2", target: "3", relationType: "RIVAL" }
    ];

    // Setup SVG Canvas
    const width = container.clientWidth || 1000;
    const height = 800; // Will be dynamic based on tree depth
    
    container.innerHTML = ''; // Clear previous
    const svg = d3.select(containerSelector)
        .append('svg')
        .attr('width', '100%')
        .attr('height', height)
        .attr('viewBox', [0, 0, width, height])
        .style('background-color', 'transparent');

    const g = svg.append('g').attr('class', 'bloodline-layer');

    // Setup Force Directed Graph or Tree Layout
    // For a structured hierarchical case file, d3.tree() is preferred, but force topology is good for tangled webs.
    // Let's use a force simulation tweaked for a top-down hierarchy
    const simulation = d3.forceSimulation(mockNodes)
        .force("link", d3.forceLink(mockLinks).id(d => d.id).distance(220)) // Increased distance to 220
        .force("charge", d3.forceManyBody().strength(-2000)) // Increased repulsion to -2000
        .force("center", d3.forceCenter(width / 2, height / 2 + 50)) // Pushed center down slightly
        .force("collide", d3.forceCollide().radius(140).iterations(3)) // Added collide force based on node width
        .force("y", d3.forceY().strength(0.1)); // encourage spread

    // Draw Links
    const link = g.append('g')
        .attr('class', 'links')
        .selectAll('path')
        .data(mockLinks)
        .join('path')
        .attr('fill', 'none')
        .attr('stroke', d => d.relationType === 'RIVAL' || d.relationType === 'BLOOD_OATH' ? '#7f1d1d' : '#4b5563') // red-900 or gray-600
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', d => d.relationType === 'RIVAL' ? '5,5' : 'none')
        .attr('opacity', 0); // hidden for GSAP

    // Draw Nodes
    const node = g.append('g')
        .attr('class', 'nodes')
        .selectAll('g')
        .data(mockNodes)
        .join('g')
        .attr('class', 'bloodline-node cursor-default')
        .attr('opacity', 0); // hidden for GSAP

    // Node Background (Obsidian)
    node.append('rect')
        .attr('width', 220)
        .attr('height', 80)
        .attr('x', -110)
        .attr('y', -40)
        .attr('fill', '#0a0a0b') // bg-obsidian
        .attr('stroke', '#c5a059') // border-gold/40
        .attr('stroke-width', 1)
        .attr('rx', 4);

    // Node Name (Serif)
    node.append('text')
        .attr('dy', -10)
        .attr('text-anchor', 'middle')
        .attr('class', 'fill-gold font-serif text-lg tracking-wider')
        .text(d => d.name);

    // Node Status/Threat (Terminal/Monospace)
    node.append('text')
        .attr('dy', 15)
        .attr('text-anchor', 'middle')
        .attr('class', 'fill-gray-500 font-mono text-[10px] uppercase tracking-widest')
        .text(d => `STATUS: ${d.status}`);

    node.append('text')
        .attr('dy', 30)
        .attr('text-anchor', 'middle')
        .attr('class', d => `font-mono text-[10px] uppercase tracking-widest ${d.threatLevel === 'CRITICAL' || d.threatLevel === 'HIGH' ? 'fill-red-900' : 'fill-gray-600'}`)
        .text(d => `THREAT: ${d.threatLevel}`);

    // Simulation Tick
    simulation.on("tick", () => {
        link.attr("d", d => {
            const dx = d.target.x - d.source.x,
                  dy = d.target.y - d.source.y,
                  dr = Math.sqrt(dx * dx + dy * dy);
            return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
        });
        node.attr("transform", d => `translate(${d.x},${d.y})`);
    });

    // --- GSAP Animations ---
    const initAnimations = () => {
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: containerSelector,
                start: "top 70%",
                once: true
            }
        });

        // 1. Reveal Patriarch/Core Nodes
        // Removed y:0 because it conflicted with D3 tick transform.
        tl.fromTo('.bloodline-node', 
            { opacity: 0, scale: 0.9 },
            {
                opacity: 1,
                scale: 1,
                duration: 1.5,
                stagger: 0.3,
                ease: "power3.out"
            }
        )
        // 2. Animate connecting links
        .to(link.nodes(), {
            opacity: 0.6,
            duration: 1,
            stagger: 0.1,
            ease: "power2.inOut"
        }, "-=1");

        // Hover functionality (Vanilla JS + D3)
        node.on('mouseenter', function() {
            gsap.to(this, { scale: 1.05, duration: 0.3, ease: 'back.out(1.7)' });
            d3.select(this).select('rect').attr('stroke', '#fff'); // Brighten border
        }).on('mouseleave', function() {
            gsap.to(this, { scale: 1, duration: 0.3, ease: 'power2.out' });
            d3.select(this).select('rect').attr('stroke', '#c5a059'); // Reset border
        });
    };

    // Wait for simulation to cool down before animating
    setTimeout(() => {
        simulation.stop();
        initAnimations();
    }, 1000);
};
