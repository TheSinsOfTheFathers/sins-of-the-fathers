// Basit bir D3 force-graph renderer. Tarayıcıda d3@7 ESM modülünü CDN'den yükler ve
// verilen node/link verisiyle interaktif bir network çizer.

// Use global window.d3 (must be loaded via <script src="/assets/js/vendor/d3.v7.min.js"></script> in HTML)
export function renderFamilyGraph(containerEl, { nodes = [], links = [] } = {}, options = {}) {
    const d3 = window.d3;
    if (!d3) {
        containerEl.innerHTML = '<p class="text-red-500">D3 kütüphanesi yüklenemedi. Lütfen d3.v7.min.js dosyasını yükleyin.</p>';
        return;
    }

    // Clean previous content
    containerEl.innerHTML = '';
    containerEl.classList.add('d3-container');

    // Tooltip element for node hover
    let tooltip = containerEl.querySelector('.d3-tooltip');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.className = 'd3-tooltip';
        tooltip.style.position = 'absolute';
        tooltip.style.pointerEvents = 'none';
        tooltip.style.display = 'none';
        containerEl.appendChild(tooltip);
    }

    const width = options.width || Math.max(600, containerEl.clientWidth || 800);
    const height = options.height || 600;

    const svg = d3.select(containerEl)
        .append('svg')
        .attr('width', '100%')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');

        const defs = svg.append('defs'); // Keep this line as is

        // numeric safety helper: avoid translate(undefined,undefined)
        function safeNum(v, fallback = 0) {
            return (v === 0 || Number.isFinite(v)) ? v : fallback;
        }

    // Arrow marker for directed links
    defs.append('marker')
        .attr('id', 'arrow')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 18)
        .attr('refY', 0)
        .attr('markerWidth', 8)
        .attr('markerHeight', 8)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', options.arrowColor || '#6b7280');

    const linkGroup = svg.append('g').attr('class', 'links');
    const nodeGroup = svg.append('g').attr('class', 'nodes');

    // --- Sanitization: ensure nodes have ids and links reference ids ---
    const sanitizedNodes = nodes.map((n, i) => {
        if (!n) return { id: `node_missing_${i}`, label: '(missing)' };
        if (!n.id) n.id = n.slug || n._id || n.name || `node_${i}`;
        return n;
    });

    const nodeIdSet = new Set(sanitizedNodes.map(n => n.id));

    const sanitizedLinks = links.map(l => {
        // allow l.source/l.target to be objects or ids
        const src = (typeof l.source === 'object' && l.source !== null) ? (l.source.id || l.source.slug || l.source._id) : l.source;
        const tgt = (typeof l.target === 'object' && l.target !== null) ? (l.target.id || l.target.slug || l.target._id) : l.target;
        return Object.assign({}, l, { source: src, target: tgt });
    }).filter(l => l.source && l.target && nodeIdSet.has(l.source) && nodeIdSet.has(l.target));

    // Replace local references for downstream code
    nodes = sanitizedNodes;
    links = sanitizedLinks;

    const link = linkGroup.selectAll('line').data(links).enter().append('line')
        .attr('stroke', options.linkColor || '#6b7280')
        .attr('stroke-width', d => d.width || 1.6)
        .attr('marker-end', 'url(#arrow)');

    const node = nodeGroup.selectAll('g.node').data(nodes, d => d.id).enter().append('g')
        .attr('class', d => `node ${d.group || ''}`)
        .call(d3.drag()
            .on('start', (event, d) => {
                if (!event.active && typeof simulation !== 'undefined') simulation.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
            })
            .on('drag', (event, d) => {
                d.fx = event.x;
                d.fy = event.y;
            })
            .on('end', (event, d) => {
                if (!event.active && typeof simulation !== 'undefined') simulation.alphaTarget(0);
                d.fx = null;
                d.fy = null;
            })
        );

    // Node visuals: circle + optional image + label
    node.append('circle')
        .attr('r', d => d.isMain ? 28 : 20)
        .attr('fill', d => d.color || (d.isMain ? '#f59e0b' : '#1c1c1c'))
        .attr('stroke', d => d.stroke || '#334155')
        .attr('stroke-width', 2);

    // Optional small portrait + label (we'll render image before text)
    const imageSize = 30;
    // Use unique clipPath id per render to avoid collisions
    const clipId = `nodeImgClip-${Date.now()}`;
    defs.append('clipPath').attr('id', clipId).append('circle').attr('r', imageSize/2).attr('cx', 0).attr('cy', 0);

    node.filter(d => d.image).append('image')
        .attr('xlink:href', d => d.image)
        .attr('x', -(imageSize/2))
        .attr('y', -(imageSize/2))
        .attr('width', imageSize)
        .attr('height', imageSize)
        .attr('clip-path', `url(#${clipId})`);

    node.append('text')
        .attr('dy', 4)
        .attr('x', d => d.isMain ? 36 : 28)
        .each(function(d) {
            const el = d3.select(this);
            const lines = (d.label || '').split('\n');
            lines.forEach((ln, i) => {
                el.append('tspan').attr('x', d.isMain ? 36 : 28).attr('dy', i === 0 ? 0 : '1.1em').text(ln);
            });
        })
        .attr('font-family', options.fontFamily || "'Cormorant Garamond', Georgia, serif")
        .attr('fill', d => d.isMain ? '#071228' : '#d1d5db')
        .attr('font-weight', d => d.isMain ? 700 : 400)
        .attr('font-size', d => d.isMain ? '14px' : '13px');

    // Labels for links
    const linkLabel = linkGroup.selectAll('text').data(links).enter().append('text')
        .attr('class', 'link-label')
        .attr('font-size', 11)
        .attr('fill', '#9ca3af')
        .text(d => d.label || '');

    // Utility: create/enter node visuals for a selection
    function createNodeSelection(selection) {
        const enter = selection.enter();
        const n = enter.append('g').attr('class', d => `node ${d.group || ''}`);

        n.append('circle')
            .attr('r', d => d.isMain ? 28 : 20)
            .attr('fill', d => d.color || (d.isMain ? '#f59e0b' : '#1c1c1c'))
            .attr('stroke', d => d.stroke || '#334155')
            .attr('stroke-width', 2);

        // small portrait if available
        n.filter(d => d.image).append('image')
            .attr('xlink:href', d => d.image)
            .attr('x', -(imageSize/2))
            .attr('y', -(imageSize/2))
            .attr('width', imageSize)
            .attr('height', imageSize)
            .attr('clip-path', `url(#${clipId})`);

        n.append('text')
            .attr('dy', d => d.isMain ? 6 : 5)
            .attr('x', d => d.isMain ? 36 : 28)
            .attr('font-family', options.fontFamily || "'Cormorant Garamond', Georgia, serif")
            .attr('fill', d => d.isMain ? '#071228' : '#d1d5db')
            .attr('font-weight', d => d.isMain ? 700 : 400)
            .attr('font-size', d => d.isMain ? '14px' : '13px')
            .each(function(d) {
                const el = d3.select(this);
                const lines = (d.label || '').split('\n');
                lines.forEach((ln, i) => el.append('tspan').attr('x', d.isMain ? 36 : 28).attr('dy', i === 0 ? 0 : '1.1em').text(ln));
            });

        n.on('mouseover', function(event, d) {
            d3.select(this).select('circle').attr('stroke-width', 3);
            if (typeof tooltip !== 'undefined' && tooltip) {
                tooltip.style.display = 'block';
                tooltip.innerHTML = `<strong>${(d.label||'').split('\n')[0]}</strong><br/>${d.meta || ''}`;
            }
        }).on('mousemove', function(event) {
            if (typeof tooltip !== 'undefined' && tooltip) {
                tooltip.style.left = (event.offsetX + 12) + 'px';
                tooltip.style.top = (event.offsetY + 12) + 'px';
            }
        }).on('mouseout', function() {
            d3.select(this).select('circle').attr('stroke-width', 2);
            if (typeof tooltip !== 'undefined' && tooltip) tooltip.style.display = 'none';
        }).on('click', (event, d) => {
            if (d.slug) window.location.href = `/pages/character-detail.html?slug=${d.slug}`;
        });

        return n;
    }

    // If options.layout === 'tree' build hierarchical layout
    if ((options.layout || 'force') === 'tree') {
        try {
            // build map and children relationships
            const nodeById = new Map(nodes.map(n => [n.id, Object.assign({}, n)]));
            nodes.forEach(n => { if (!nodeById.get(n.id).children) nodeById.get(n.id).children = []; });
            links.forEach(l => {
                const src = nodeById.get(l.source);
                const tgt = nodeById.get(l.target);
                if (src && tgt) src.children.push(tgt);
            });

            // find root (main or node with no incoming links)
            let rootNode = nodes.find(n => n.isMain) || nodes[0];
            if (!rootNode) throw new Error('No root node available for tree layout');

            const rootData = nodeById.get(rootNode.id);
            if (!rootData) throw new Error(`D3 tree: rootData missing for id ${rootNode.id}`);

            const root = d3.hierarchy(rootData, d => d.children);
            const treeLayout = d3.tree().nodeSize([140, 160]);
            treeLayout(root);

            const descendants = root.descendants() || [];
            const hasCoords = descendants.length > 0 && descendants.some(nd => Number.isFinite(nd.x) && Number.isFinite(nd.y));
            if (!hasCoords) throw new Error('Tree layout did not produce valid numeric coordinates');

            // draw links (use safe numeric accessors)
            linkGroup.selectAll('path').data(root.links()).enter().append('path')
                .attr('fill', 'none')
                .attr('stroke', options.linkColor || '#6b7280')
                .attr('stroke-width', 1.4)
                .attr('d', d3.linkHorizontal().x(d => safeNum(d.y)).y(d => safeNum(d.x)));

            // draw nodes
            const nodesSel = nodeGroup.selectAll('g.node').data(root.descendants(), (d, i) => {
                try {
                    return (d && d.data && (d.data.id || d.data.slug || d.data.name)) ? (d.data.id || d.data.slug || d.data.name) : `__node_${i}`;
                } catch (e) {
                    console.warn('D3: descendant key function error', e, d, i);
                    return `__node_${i}`;
                }
            });
            createNodeSelection(nodesSel);
            nodeGroup.selectAll('g.node').attr('transform', d => `translate(${safeNum(d.y)},${safeNum(d.x)})`);

            svg.call(d3.zoom().on('zoom', (event) => {
                nodeGroup.attr('transform', event.transform);
                linkGroup.attr('transform', event.transform);
            }));

            return { svg };
        } catch (err) {
            console.warn('D3 tree layout failed, falling back to force layout: ', err);
            // fall through to the force layout implementation below
        }
    }

    // FORCE layout fallback
    const simulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links).id(d => d.id).distance(d => d.distance || 120).strength(0.8))
        .force('charge', d3.forceManyBody().strength(-400))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(d => (d.isMain ? 44 : 34)).strength(0.9));

    simulation.on('tick', () => {
        link
            .attr('x1', d => safeNum(d.source && d.source.x))
            .attr('y1', d => safeNum(d.source && d.source.y))
            .attr('x2', d => safeNum(d.target && d.target.x))
            .attr('y2', d => safeNum(d.target && d.target.y));

        nodeGroup.selectAll('g.node').attr('transform', d => `translate(${safeNum(d.x)},${safeNum(d.y)})`);
    });

    // Interactivity: hover highlights + click already added via createNodeSelection

    // Zoom/pan
    svg.call(d3.zoom().on('zoom', (event) => {
        nodeGroup.attr('transform', event.transform);
        linkGroup.attr('transform', event.transform);
    }));

    return { svg, simulation };
}
