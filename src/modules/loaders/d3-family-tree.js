// 👇 MODERN İMPORTLAR
import * as d3 from 'd3';
import i18next from '../../lib/i18n.js';
import gsap from 'gsap';

export function renderFamilyGraph(containerEl, { nodes = [], links = [] } = {}, options = {}) {
    
    // D3 kontrolü artık import edildiği için gerekmez ama container kontrolü yapalım
    if (!containerEl) return;

    containerEl.innerHTML = ''; 
    containerEl.classList.add('d3-container', 'cursor-move'); 

    // Tooltip Oluşturma
    let tooltip = document.createElement('div');
    tooltip.className = 'd3-tooltip';
    Object.assign(tooltip.style, {
        position: 'absolute',
        display: 'none',
        pointerEvents: 'none',
        background: 'rgba(5, 5, 5, 0.95)',
        border: '1px solid #c5a059', 
        color: '#c5a059', 
        padding: '8px 12px',
        fontFamily: "'Courier Prime', monospace",
        fontSize: '10px',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        zIndex: '50',
        boxShadow: '0 0 15px rgba(197, 160, 89, 0.2)',
        borderRadius: '4px'
    });
    containerEl.appendChild(tooltip);

    const width = options.width || Math.max(600, containerEl.clientWidth || 800);
    const height = options.height || 600;

    const svg = d3.select(containerEl)
        .append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .style('background-color', 'transparent'); 

    // --- DEFS & MARKERS ---
    const defs = svg.append('defs');

    // Glow Filter
    const filter = defs.append("filter").attr("id", "glow");
    filter.append("feGaussianBlur").attr("stdDeviation", "2.5").attr("result", "coloredBlur");
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Ok Uçları (Markers)
    defs.append('marker')
        .attr('id', 'arrow-gold')
        .attr('viewBox', '0 -5 10 10').attr('refX', 28).attr('refY', 0) // refX biraz artırıldı (daireden uzaklaşsın diye)
        .attr('markerWidth', 6).attr('markerHeight', 6).attr('orient', 'auto')
        .append('path').attr('d', 'M0,-5L10,0L0,5').attr('fill', '#c5a059');

    defs.append('marker')
        .attr('id', 'arrow-gray')
        .attr('viewBox', '0 -5 10 10').attr('refX', 25).attr('refY', 0)
        .attr('markerWidth', 6).attr('markerHeight', 6).attr('orient', 'auto')
        .append('path').attr('d', 'M0,-5L10,0L0,5').attr('fill', '#444');

    const linkGroup = svg.append('g').attr('class', 'links');
    const nodeGroup = svg.append('g').attr('class', 'nodes');

    // --- DATA HAZIRLIĞI ---
    const sanitizedNodes = nodes.map((n, i) => {
        if (!n) return { id: `node_missing_${i}`, label: i18next.t('family_graph.unknown_node') };
        // Önceki loader dosyasında "id" slug olarak atanmıştı, onu koruyoruz.
        n.id = n.id || n.slug || n._id || n.name || `node_${i}`;
        return n;
    });

    const nodeIdSet = new Set(sanitizedNodes.map(n => n.id));

    const sanitizedLinks = links.map(l => {
        const src = (typeof l.source === 'object' && l.source !== null) ? (l.source.id || l.source.slug || l.source.name) : l.source;
        const tgt = (typeof l.target === 'object' && l.target !== null) ? (l.target.id || l.target.slug || l.target.name) : l.target;
        return { ...l, source: src, target: tgt };
    }).filter(l => l.source && l.target && nodeIdSet.has(l.source) && nodeIdSet.has(l.target));

    const renderNodes = sanitizedNodes;
    const renderLinks = sanitizedLinks;

    // --- LINKS RENDER ---
    const link = linkGroup.selectAll('line')
        .data(renderLinks).enter().append('line')
        .attr('stroke', d => (d.strength && d.strength > 1.2) ? '#c5a059' : '#333') 
        .attr('stroke-width', d => (d.strength && d.strength > 1.2) ? 1.5 : 1)
        .attr('stroke-opacity', 0.6)
        .attr('marker-end', d => (d.strength && d.strength > 1.2) ? 'url(#arrow-gold)' : 'url(#arrow-gray)');

    const linkLabelBg = linkGroup.selectAll('.link-label-bg')
        .data(renderLinks).enter().append('rect')
        .attr('rx', 2).attr('ry', 2)
        .attr('fill', '#050505').attr('fill-opacity', 0.8);

    const linkLabel = linkGroup.selectAll('.link-label')
        .data(renderLinks).enter().append('text')
        .attr('class', 'link-label')
        .attr('font-family', "'Courier Prime', monospace")
        .attr('font-size', 8)
        .attr('fill', '#777')
        .attr('text-anchor', 'middle')
        .text(d => d.label ? d.label.toUpperCase() : '');

    // --- NODES RENDER ---
    const node = nodeGroup.selectAll('g.node')
        .data(renderNodes, d => d.id).enter().append('g')
        .attr('class', 'node')
        // GSAP: Başlangıçta görünmez yap (Animation için)
        .attr('opacity', 0) 
        .call(d3.drag() 
            .on('start', (event, d) => {
                if (!event.active && simulation) simulation.alphaTarget(0.3).restart();
                d.fx = d.x; d.fy = d.y;
                d3.select(event.sourceEvent.target).style("filter", "url(#glow)");
            })
            .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
            .on('end', (event, d) => {
                if (!event.active && simulation) simulation.alphaTarget(0);
                d.fx = null; d.fy = null;
                d3.select(event.sourceEvent.target).style("filter", null);
            })
        );

    node.append('circle')
        .attr('r', d => d.isMain ? 26 : 18)
        .attr('fill', '#050505') 
        .attr('stroke', d => d.isMain ? '#c5a059' : '#333')
        .attr('stroke-width', d => d.isMain ? 2 : 1)
        .attr('class', 'node-circle');

    // Resim Kırpma (ClipPath)
    const clipIdBase = `clip-${Math.random().toString(36).substr(2, 9)}`;
    
    defs.selectAll('.node-clip')
        .data(renderNodes).enter()
        .append('clipPath')
        .attr('id', (d, i) => `${clipIdBase}-${i}`)
        .append('circle')
        .attr('r', d => d.isMain ? 18 : 12);

    node.each(function(d, i) {
        const group = d3.select(this);
        if (d.image) {
            group.append('image')
                .attr('xlink:href', d.image)
                .attr('x', d => d.isMain ? -18 : -12)
                .attr('y', d => d.isMain ? -18 : -12)
                .attr('width', d => d.isMain ? 36 : 24)
                .attr('height', d => d.isMain ? 36 : 24)
                .attr('clip-path', `url(#${clipIdBase}-${i})`)
                .attr('preserveAspectRatio', 'xMidYMid slice');
        } else {
            group.append('circle')
                .attr('r', d => d.isMain ? 18 : 12)
                .attr('fill', '#111');
        }
    });

    node.append('text')
        .attr('dy', d => d.isMain ? 38 : 30)
        .attr('text-anchor', 'middle')
        .text(d => {
            let name = d.label || '';
            return name.length > 12 ? name.substring(0, 10) + '.' : name;
        })
        .attr('font-family', "'Courier Prime', monospace")
        .attr('fill', d => d.isMain ? '#c5a059' : '#888') 
        .attr('font-size', d => d.isMain ? 10 : 8)
        .attr('font-weight', 'bold')
        .attr('letter-spacing', '1px');


    // --- SIMULATION ---
    const simulation = d3.forceSimulation(renderNodes)
        .force('link', d3.forceLink(renderLinks).id(d => d.id).distance(120)) // Mesafe biraz artırıldı
        .force('charge', d3.forceManyBody().strength(-400)) 
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collide', d3.forceCollide(d => (d.isMain ? 40 : 30)).strength(0.8));

    simulation.on('tick', () => {
        // Node'ların alan dışına çıkmasını engelle
        renderNodes.forEach(d => {
            d.x = Math.max(20, Math.min(width - 20, d.x));
            d.y = Math.max(20, Math.min(height - 20, d.y));
        });

        link
            .attr('x1', d => d.source.x).attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x).attr('y2', d => d.target.y);

        linkLabel
            .attr('x', d => (d.source.x + d.target.x) / 2)
            .attr('y', d => (d.source.y + d.target.y) / 2);
            
        linkLabelBg
            .attr('x', d => ((d.source.x + d.target.x) / 2) - (d.label ? d.label.length * 2.5 : 0))
            .attr('y', d => ((d.source.y + d.target.y) / 2) - 5)
            .attr('width', d => d.label ? d.label.length * 5 + 4 : 0)
            .attr('height', 10);

        node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // --- INTERACTION ---
    node.on('mouseover', function(event, d) {
        d3.select(this).select('.node-circle').attr('stroke', '#fff').attr('stroke-width', 2);
        tooltip.style.display = 'block';
        
        const role = d.isMain ? i18next.t('family_graph.role_primary') : i18next.t('family_graph.role_associate');
        
        tooltip.innerHTML = `
            <strong style="color:#fff">${d.label}</strong><br>
            <span style="color:#666">${role}</span>
        `;
    })
    .on('mousemove', function(event) {
        // Tooltip pozisyonunu container'a göre ayarla
        const rect = containerEl.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        tooltip.style.left = (mouseX + 15) + 'px';
        tooltip.style.top = (mouseY + 15) + 'px';
    })
    .on('mouseout', function() {
        d3.select(this).select('.node-circle')
            .attr('stroke', d => d.isMain ? '#c5a059' : '#333')
            .attr('stroke-width', d => d.isMain ? 2 : 1);
        tooltip.style.display = 'none';
    });

    // 👇 NAVİGASYON DÜZELTMESİ
    node.on('click', (event, d) => {
        if (event.defaultPrevented) return; 
        
        // Loader dosyasında 'id' parametresi slug'a eşitlenmişti.
        const slug = d.slug || d.id; 

        if (slug && !slug.startsWith('node_')) { // Geçici ID değilse git
            window.location.href = `character-detail.html?slug=${slug}`;
        } else {
            console.warn("Node clicked but no valid slug found:", d);
        }
    });

    // Zoom Behavior
    const zoom = d3.zoom()
        .scaleExtent([0.5, 3])
        .on('zoom', (event) => {
            nodeGroup.attr('transform', event.transform);
            linkGroup.attr('transform', event.transform);
        });

    svg.call(zoom);
    
    // --- GSAP ENTRANCE ANIMATION ---
    // Node'lar "Pop" diye patlayarak gelsin
    gsap.to(nodeGroup.selectAll('.node').nodes(), {
        opacity: 1,
        scale: 1,
        startAt: { scale: 0 },
        duration: 0.5,
        stagger: {
            amount: 0.5,
            from: "center"
        },
        ease: "back.out(1.7)"
    });

    // Linkler yavaşça belirtsin
    gsap.from(linkGroup.selectAll('line').nodes(), {
        opacity: 0,
        duration: 1,
        delay: 0.3,
        stagger: 0.05
    });

    return { svg, simulation };
}