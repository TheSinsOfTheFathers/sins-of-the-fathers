import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

export class FamilyTree {
    constructor(container) {
        if (!container) {
            console.error('No container provided for FamilyTree!');
            return;
        }
        this.container = container;
        this.width = container.clientWidth;
        this.height = container.clientHeight;
        this.data = null;

        this.svg = d3.select(this.container).append("svg")
            .attr("width", this.width)
            .attr("height", this.height);

        this.g = this.svg.append("g");

        this.divContainer = d3.select(this.container).append("div")
            .attr("class", "family-tree-nodes");

        // Sürükleme (pan) ve yakınlaştırma (zoom) davranışını ayarla
        this.zoom = d3.zoom()
            .scaleExtent([0.2, 2])
            .on("zoom", (event) => {
                // Hem çizgilere (SVG) hem de kartlara (HTML) aynı transformu uygula
                this.g.attr("transform", event.transform);
                this.divContainer.style("transform", `translate(${event.transform.x}px, ${event.transform.y}px) scale(${event.transform.k})`);
            });

        // Zoom olayını SVG elementine bağla
        this.svg.call(this.zoom);
        
        this.infoPanel = document.querySelector('.character-info-panel') || this.createInfoPanel();
    }

    createInfoPanel() {
        const panel = document.createElement('div');
        panel.className = 'character-info-panel';
        document.body.appendChild(panel);
        const style = document.createElement('style');
        style.textContent = `
            .character-info-panel { position: fixed; right: -500px; top: 0; width: 500px; height: 100vh; background: #1a1a1a; border-left: 1px solid #333; padding: 2rem; transition: right 0.3s ease-in-out; z-index: 1000; color: #fff; overflow-y: auto; }
            .character-info-panel.active { right: 0; }
            .character-info-panel .close-btn { position: absolute; top: 1rem; right: 1rem; background: none; border: none; color: #fff; font-size: 1.5rem; cursor: pointer; }
            .character-info-panel h2 { font-size: 2rem; margin-bottom: 1rem; font-family: serif; color: #f59e0b; }
            .character-info-panel .info-description { color: #d1d5db; margin-bottom: 1.5rem; }
            .character-info-panel .view-character-btn { display: inline-block; padding: 0.75rem 1.5rem; background: #f59e0b; color: #000; text-decoration: none; border-radius: 0.375rem; font-weight: 600; margin-top: 1.5rem; }
        `;
        document.head.appendChild(style);
        return panel;
    }

    showInfoPanel(character) {
        this.infoPanel.innerHTML = `
            <button class="close-btn">&times;</button>
            <h2>${character.name}</h2>
            <div class="info-description">${character.description || 'No description available.'}</div>
            <a href="character-detail.html?id=${character.id}" class="view-character-btn">View Character</a>
        `;
        this.infoPanel.querySelector('.close-btn').addEventListener('click', () => this.hideInfoPanel());
        this.infoPanel.classList.add('active');
    }

    hideInfoPanel() {
        this.infoPanel.classList.remove('active');
    }

    update(data) {
        this.data = data;
        this.g.selectAll('*').remove();
        this.divContainer.selectAll('*').remove();

        if (!data || !data.nodes || data.nodes.length === 0) {
            console.warn('No data for family tree.');
            return;
        }

        const nodes = [...this.data.nodes];
        const links = [...this.data.links];

        const childNodeIds = new Set();
        links.forEach(link => {
            if (link.type === 'child') {
                childNodeIds.add(link.target);
            }
        });

        const actualRoots = nodes.filter(node => !childNodeIds.has(node.id));
        
        const fakeRootId = '___FAKE_ROOT___';
        if (actualRoots.length !== 1) {
            nodes.push({ id: fakeRootId, name: 'Family', isFake: true });
            actualRoots.forEach(root => {
                links.push({ source: fakeRootId, target: root.id, type: 'child' });
            });
        }

        const root = d3.stratify()
            .id(d => d.id)
            .parentId(d => {
                const parentLink = links.find(link => link.target === d.id && link.type === 'child');
                return parentLink ? parentLink.source : null;
            })(nodes);

        const nodeWidth = 120;
        const nodeHeight = 180;
        const treeLayout = d3.tree().nodeSize([nodeWidth * 1.5, nodeHeight * 1.5]);
        const treeData = treeLayout(root);

        const descendants = treeData.descendants().filter(d => d.id !== fakeRootId);
        const treeLinks = treeData.links().filter(l => l.source.id !== fakeRootId);

        this.g.selectAll('path')
            .data(treeLinks)
            .enter().append('path')
            .attr('d', d3.linkVertical().x(node => node.x).y(node => node.y))
            .attr('fill', 'none')
            .attr('stroke', '#4b5563')
            .attr('stroke-width', 2);

        const nodeElements = this.divContainer.selectAll('.tree-node')
            .data(descendants)
            .enter().append('div')
            .attr('class', 'tree-node')
            .attr('style', d => `left: ${d.x}px; top: ${d.y}px;`)
            .on('click', (event, d) => {
                this.showInfoPanel(d.data);
            });

        nodeElements.html(d => `
            <div class="node-card">
                <img src="${d.data.image || 'https://via.placeholder.com/100'}" alt="${d.data.name}" class="node-image">
                <div class="node-name">${d.data.name}</div>
            </div>
        `);

        setTimeout(() => {
            const bounds = this.g.node().getBBox();
            if (bounds.width && bounds.height) {
                const xOffset = this.width / 2 - (bounds.x + bounds.width / 2);
                const yOffset = 50;
                const initialTransform = d3.zoomIdentity.translate(xOffset, yOffset).scale(0.8);
                this.svg.call(this.zoom.transform, initialTransform);
            }
        }, 0);
    }
}

const style = document.createElement('style');
style.innerHTML = `
.family-tree-container {
    position: relative;
    overflow: hidden;
}
.family-tree-nodes {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    /* Sürükleme olaylarının arkadaki SVG'ye geçmesine izin ver */
    pointer-events: none; 
}
.tree-node {
    position: absolute;
    width: 120px;
    transform: translate(-50%, -50%);
    cursor: pointer;
    /* Kartların kendisi tıklanabilir olsun */
    pointer-events: auto; 
}
.node-card {
    background-color: #2d3748;
    border: 1px solid #4a5568;
    border-radius: 8px;
    text-align: center;
    padding: 10px;
    color: #e2e8f0;
    box-shadow: 0 4px 6px rgba(0,0,0,0.3);
}
.node-image {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    object-fit: cover;
    margin: 0 auto 10px;
    border: 2px solid #4a5568;
}
.node-name {
    font-size: 14px;
    font-weight: 600;
}
`;
document.head.appendChild(style);