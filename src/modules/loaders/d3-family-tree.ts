import * as d3 from 'd3';
import i18next from '../../lib/i18n';

interface GraphNode {
    id: string;
    slug?: string;
    _id?: string;
    name?: string;
    label?: string;
    image?: string;
    isMain?: boolean;
    x?: number;
    y?: number;
    fx?: number | null;
    fy?: number | null;
}

interface GraphLink {
    source: string | GraphNode;
    target: string | GraphNode;
    label?: string;
    strength?: number;
}

interface RawNode {
    id?: string;
    slug?: string;
    _id?: string;
    name?: string;
    label?: string;
    image?: string;
    isMain?: boolean;
    [key: string]: unknown;
}

interface RawLink {
    source: string | RawNode | null | undefined;
    target: string | RawNode | null | undefined;
    label?: string;
    strength?: number;
    [key: string]: unknown;
}

interface GraphData {
    nodes?: RawNode[];
    links?: RawLink[];
}

interface GraphOptions {
    width?: number;
    height?: number;
}

interface RenderFamilyGraphResult {
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
    simulation: d3.Simulation<GraphNode, GraphLink>;
}

export function renderFamilyGraph(
    containerEl: HTMLElement,
    { nodes = [], links = [] }: GraphData = {},
    options: GraphOptions = {}
): RenderFamilyGraphResult | undefined {
    containerEl.replaceChildren();
    containerEl.classList.add('d3-container', 'cursor-move');

    const tooltip = document.createElement('div');
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

    const width = options.width ?? Math.max(600, containerEl.clientWidth || 800);
    const height = options.height ?? 600;

    const svg = d3.select(containerEl)
        .append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .style('background-color', 'transparent');

    const defs = svg.append('defs');

    const filter = defs.append('filter').attr('id', 'glow');
    filter.append('feGaussianBlur').attr('stdDeviation', '2.5').attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    defs.append('marker')
        .attr('id', 'arrow-gold')
        .attr('viewBox', '0 -5 10 10').attr('refX', 28).attr('refY', 0)
        .attr('markerWidth', 6).attr('markerHeight', 6).attr('orient', 'auto')
        .append('path').attr('d', 'M0,-5L10,0L0,5').attr('fill', '#c5a059');

    defs.append('marker')
        .attr('id', 'arrow-gray')
        .attr('viewBox', '0 -5 10 10').attr('refX', 25).attr('refY', 0)
        .attr('markerWidth', 6).attr('markerHeight', 6).attr('orient', 'auto')
        .append('path').attr('d', 'M0,-5L10,0L0,5').attr('fill', '#444');

    const linkGroup = svg.append('g').attr('class', 'links');
    const nodeGroup = svg.append('g').attr('class', 'nodes');

    const sanitizedNodes: GraphNode[] = nodes.map((n, i) => {
        if (!n) return { id: `node_missing_${i}`, label: i18next.t('family_graph.unknown_node') };
        n.id = n.id ?? n.slug ?? n._id ?? n.name ?? `node_${i}`;
        return n as GraphNode;
    });

    const nodeIdSet = new Set(sanitizedNodes.map(n => n.id));

    const sanitizedLinks: GraphLink[] = links.map(l => {
        const src = (typeof l.source === 'object' && l.source !== null)
            ? ((l.source as RawNode).id ?? (l.source as RawNode).slug ?? (l.source as RawNode).name)
            : l.source;
        const tgt = (typeof l.target === 'object' && l.target !== null)
            ? ((l.target as RawNode).id ?? (l.target as RawNode).slug ?? (l.target as RawNode).name)
            : l.target;
        return { ...l, source: src as string, target: tgt as string };
    }).filter(l => l.source && l.target && nodeIdSet.has(l.source as string) && nodeIdSet.has(l.target as string)) as GraphLink[];

    const renderNodes = sanitizedNodes;
    const renderLinks = sanitizedLinks;

    const link = linkGroup.selectAll<SVGLineElement, GraphLink>('line')
        .data(renderLinks).enter().append('line')
        .attr('stroke', d => (d.strength != null && d.strength > 1.2) ? '#c5a059' : '#333')
        .attr('stroke-width', d => (d.strength != null && d.strength > 1.2) ? 1.5 : 1)
        .attr('stroke-opacity', 0.6)
        .attr('marker-end', d => (d.strength != null && d.strength > 1.2) ? 'url(#arrow-gold)' : 'url(#arrow-gray)');

    const linkLabelBg = linkGroup.selectAll<SVGRectElement, GraphLink>('.link-label-bg')
        .data(renderLinks).enter().append('rect')
        .attr('rx', 2).attr('ry', 2)
        .attr('fill', '#050505').attr('fill-opacity', 0.8);

    const linkLabel = linkGroup.selectAll<SVGTextElement, GraphLink>('.link-label')
        .data(renderLinks).enter().append('text')
        .attr('class', 'link-label')
        .attr('font-family', "'Courier Prime', monospace")
        .attr('font-size', 8)
        .attr('fill', '#777')
        .attr('text-anchor', 'middle')
        .attr('font-display', 'swap;')
        .text(d => d.label ? d.label.toUpperCase() : '');

    const node = nodeGroup.selectAll<SVGGElement, GraphNode>('g.node')
        .data(renderNodes, d => d.id).enter().append('g')
        .attr('class', 'node')
        .call(d3.drag<SVGGElement, GraphNode>()
            .on('start', (event, d) => {
                if (!event.active && simulation) simulation.alphaTarget(0.3).restart();
                d.fx = d.x; d.fy = d.y;
                d3.select(event.sourceEvent.target as Element).style('filter', 'url(#glow)');
            })
            .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
            .on('end', (event, d) => {
                if (!event.active && simulation) simulation.alphaTarget(0);
                d.fx = null; d.fy = null;
                d3.select(event.sourceEvent.target as Element).style('filter', null);
            })
        );

    node.append('circle')
        .attr('r', d => d.isMain ? 26 : 18)
        .attr('fill', '#050505')
        .attr('stroke', d => d.isMain ? '#c5a059' : '#333')
        .attr('stroke-width', d => d.isMain ? 2 : 1)
        .attr('class', 'node-circle');

    const clipIdBase = `clip-${Math.random().toString(36).substr(2, 9)}`;

    defs.selectAll<SVGClipPathElement, GraphNode>('.node-clip')
        .data(renderNodes).enter()
        .append('clipPath')
        .attr('id', (_d, i) => `${clipIdBase}-${i}`)
        .append('circle')
        .attr('r', d => d.isMain ? 18 : 12);

    node.each(function (d, i) {
        const group = d3.select(this);
        if (d.image) {
            group.append('image')
                .attr('xlink:href', d.image)
                .attr('x', d.isMain ? -18 : -12)
                .attr('y', d.isMain ? -18 : -12)
                .attr('width', d.isMain ? 36 : 24)
                .attr('height', d.isMain ? 36 : 24)
                .attr('clip-path', `url(#${clipIdBase}-${i})`)
                .attr('preserveAspectRatio', 'xMidYMid slice');
        } else {
            group.append('circle')
                .attr('r', d.isMain ? 18 : 12)
                .attr('fill', '#111');
        }
    });

    node.append('text')
        .attr('dy', d => d.isMain ? 38 : 30)
        .attr('text-anchor', 'middle')
        .text(d => {
            const name = d.label ?? '';
            return name.length > 12 ? name.substring(0, 10) + '.' : name;
        })
        .attr('font-family', "'Courier Prime', monospace")
        .attr('fill', d => d.isMain ? '#c5a059' : '#888')
        .attr('font-size', d => d.isMain ? 10 : 8)
        .attr('font-weight', 'bold')
        .attr('letter-spacing', '1px')
        .attr('font-display', 'swap;');

    const simulation = d3.forceSimulation<GraphNode, GraphLink>(renderNodes)
        .force('link', d3.forceLink<GraphNode, GraphLink>(renderLinks).id(d => d.id).distance(100))
        .force('charge', d3.forceManyBody().strength(-300))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collide', d3.forceCollide<GraphNode>(d => (d.isMain ? 40 : 30)).strength(0.8));

    simulation.on('tick', () => {
        renderNodes.forEach(d => {
            d.x = Math.max(20, Math.min(width - 20, d.x ?? 0));
            d.y = Math.max(20, Math.min(height - 20, d.y ?? 0));
        });

        link
            .attr('x1', d => (d.source as GraphNode).x ?? 0)
            .attr('y1', d => (d.source as GraphNode).y ?? 0)
            .attr('x2', d => (d.target as GraphNode).x ?? 0)
            .attr('y2', d => (d.target as GraphNode).y ?? 0);

        linkLabel
            .attr('x', d => (((d.source as GraphNode).x ?? 0) + ((d.target as GraphNode).x ?? 0)) / 2)
            .attr('y', d => (((d.source as GraphNode).y ?? 0) + ((d.target as GraphNode).y ?? 0)) / 2);

        linkLabelBg
            .attr('x', d => ((((d.source as GraphNode).x ?? 0) + ((d.target as GraphNode).x ?? 0)) / 2) - (d.label ? d.label.length * 2.5 : 0))
            .attr('y', d => ((((d.source as GraphNode).y ?? 0) + ((d.target as GraphNode).y ?? 0)) / 2) - 5)
            .attr('width', d => d.label ? d.label.length * 5 + 4 : 0)
            .attr('height', 10);

        node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    node.on('mouseover', function (event, d) {
        d3.select(this).select('circle').attr('stroke', '#fff').attr('stroke-width', 2);
        tooltip.style.display = 'block';

        const role = d.isMain ? i18next.t('family_graph.role_primary') : i18next.t('family_graph.role_associate');

        const strong = document.createElement('strong');
        strong.style.color = '#fff';
        strong.textContent = d.label ?? '';
        const br = document.createElement('br');
        const span = document.createElement('span');
        span.style.color = '#666';
        span.textContent = role;
        tooltip.replaceChildren(strong, br, span);
    })
        .on('mousemove', function (event) {
            tooltip.style.left = (event.offsetX + 15) + 'px';
            tooltip.style.top = (event.offsetY + 15) + 'px';
        })
        .on('mouseout', function (_event, d) {
            d3.select(this).select('circle')
                .attr('stroke', d.isMain ? '#c5a059' : '#333')
                .attr('stroke-width', d.isMain ? 2 : 1);
            tooltip.style.display = 'none';
        });

    node.on('click', (event, d) => {
        if (event.defaultPrevented) return;

        if (d.slug) {
            globalThis.location.href = `character-detail.html?slug=${d.slug}`;
        } else {
            console.warn('Node clicked but no valid slug found:', d);
        }
    });

    const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.5, 3])
        .on('zoom', (event) => {
            nodeGroup.attr('transform', event.transform);
            linkGroup.attr('transform', event.transform);
        });

    svg.call(zoom);

    return { svg, simulation };
}
