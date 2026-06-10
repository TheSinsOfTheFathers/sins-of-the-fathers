import { client, urlFor } from "../../lib/sanityClient";
import * as d3 from 'd3';
const CARD_WIDTH = 340;
const CARD_HEIGHT = 420;

interface SanityImageAsset {
    url: string;
}

interface SanityImage {
    asset?: SanityImageAsset;
}

interface TimelineEvent {
    title_en?: string;
    text_en?: string;
    date?: string;
    external_image_url?: string;
    slug?: string;
    image?: SanityImage;
}

interface TimelineEra {
    title_en?: string;
    events?: TimelineEvent[];
}

interface EventNode extends TimelineEvent {
    x: number;
    y: number;
    rotation: number;
    id: number;
}

type CardType = 'polaroid' | 'clipping' | 'note';

type D3SVGSelection = d3.Selection<SVGSVGElement, unknown, HTMLElement, unknown>;

const getEventCardType = (evt: TimelineEvent): CardType => {
    if (evt.external_image_url || evt.image?.asset?.url) return 'polaroid';
    if ((evt.text_en?.length ?? 0) > 300) return 'clipping';
    return 'note';
};

const renderCardContent = (
    selection: d3.Selection<SVGGElement, EventNode, SVGGElement | null, unknown>,
    evt: TimelineEvent,
    type: CardType
): void => {
    selection.append("circle")
        .attr("cx", CARD_WIDTH / 2)
        .attr("cy", 15)
        .attr("r", 6)
        .attr("class", "board-pin shadow-lg");

    selection.append("rect")
        .attr("x", 0)
        .attr("y", 30)
        .attr("width", CARD_WIDTH)
        .attr("height", CARD_HEIGHT - 30)
        .attr("class", `${type}-bg timeline-card`);

    let dateDisplay = evt.date ?? "UNKNOWN";
    if (evt.date && evt.date.includes("-")) {
        const parts = evt.date.split("-");
        if (parts.length === 3) dateDisplay = `${parts[2]}.${parts[1]}.${parts[0]}`;
    }

    selection.append("text")
        .attr("x", 20)
        .attr("y", 60)
        .attr("class", "card-date")
        .text(`[ RECORD_${dateDisplay} ]`);

    if (type === 'polaroid') {
        let imageUrl: string | undefined = evt.external_image_url ?? evt.image?.asset?.url;
        if (!imageUrl && evt.image) {
            try { imageUrl = urlFor(evt.image)?.url(); } catch(e) {}
        }

        if (imageUrl) {
            const clipId = `clip-${Math.random().toString(36).substr(2, 9)}`;
            selection.append("clipPath")
                .attr("id", clipId)
                .append("rect")
                .attr("x", 20)
                .attr("y", 75)
                .attr("width", CARD_WIDTH - 40)
                .attr("height", 240);

            selection.append("image")
                .attr("xlink:href", imageUrl)
                .attr("x", 20)
                .attr("y", 75)
                .attr("width", CARD_WIDTH - 40)
                .attr("height", 240)
                .attr("preserveAspectRatio", "xMidYMid slice")
                .attr("clip-path", `url(#${clipId})`)
                .attr("filter", "grayscale(100%) contrast(1.2)");

            selection.append("rect")
                .attr("x", 20)
                .attr("y", 75)
                .attr("width", CARD_WIDTH - 40)
                .attr("height", 240)
                .attr("fill", "none")
                .attr("stroke", "rgba(0,0,0,0.1)")
                .attr("stroke-width", 1);
        }
    }

    const title = evt.title_en ?? "UNTITLED_RECORD";
    const textY = type === 'polaroid' ? 345 : 90;

    selection.append("text")
        .attr("x", 20)
        .attr("y", textY)
        .attr("class", "card-title")
        .style("font-size", "18px")
        .text(title.length > 25 ? title.substring(0, 22) + "..." : title);

    const rawText = evt.text_en ?? "";
    const cleanText = rawText.replace(/<[^>]*>/g, '').substring(0, 200) + "...";

    const textElement = selection.append("text")
        .attr("x", 20)
        .attr("y", textY + 25)
        .attr("class", "card-text")
        .attr("width", CARD_WIDTH - 40);

    const words = cleanText.split(/\s+/);
    let line: string[] = [];
    let lineNumber = 0;
    const lineHeight = 1.4;
    const y = textElement.attr("y");
    const x = textElement.attr("x");
    let tspan = textElement.append("tspan").attr("x", x).attr("y", y).attr("dy", "1em");

    for (let n = 0; n < words.length; n++) {
        line.push(words[n]);
        tspan.text(line.join(" "));
        const node = tspan.node();
        if (node && node.getComputedTextLength() > CARD_WIDTH - 50) {
            line.pop();
            tspan.text(line.join(" "));
            line = [words[n]];
            tspan = textElement.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + 1 + "em").text(words[n]);
            if (lineNumber > 5) break;
        }
    }

    selection.append("rect")
        .attr("x", -5)
        .attr("y", 25)
        .attr("width", CARD_WIDTH + 10)
        .attr("height", CARD_HEIGHT - 20)
        .attr("class", "card-focus-ring")
        .attr("rx", 5);
};

const buildCrimeBoard = (eras: TimelineEra[], svg: D3SVGSelection): void => {
    const mainGroup = svg.select<SVGGElement>("#main-group");
    const linksLayer = svg.select<SVGGElement>("#links-layer");
    const cardsLayer = svg.select<SVGGElement>("#cards-layer");

    const allEvents = eras.flatMap(e => e.events ?? []);
    const eventNodes: EventNode[] = [];

    allEvents.forEach((evt, i) => {
        const stepX = 500;
        const col = i % 8;
        const row = Math.floor(i / 8);

        const baseX = 400 + (col * stepX);
        const baseY = 400 + (row * 600);

        const x = baseX + (Math.random() * 200 - 100);
        const y = baseY + (Math.random() * 150 - 75);
        const rotation = (Math.random() * 10 - 5);

        eventNodes.push({ ...evt, x, y, rotation, id: i });
    });

    const lineGenerator = d3.line<EventNode>()
        .x(d => d.x + CARD_WIDTH / 2)
        .y(d => d.y + 15)
        .curve(d3.curveBasis);

    for (let i = 0; i < eventNodes.length - 1; i++) {
        const start = eventNodes[i];
        const end = eventNodes[i + 1];

        const midX = (start.x + end.x) / 2 + (Math.random() * 100 - 50);
        const midY = (start.y + end.y) / 2 + (Math.random() * 100 - 50);

        linksLayer.append("path")
            .datum([start, { ...start, x: midX - CARD_WIDTH / 2, y: midY - 15 }, end])
            .attr("class", "red-string-path")
            .attr("d", lineGenerator);
    }

    const cardGroups = cardsLayer.selectAll<SVGGElement, EventNode>(".timeline-card-group")
        .data(eventNodes)
        .enter()
        .append("g")
        .attr("class", "timeline-card-group")
        .attr("transform", d => `translate(${d.x},${d.y}) rotate(${d.rotation})`)
        .on("click", function(event: MouseEvent, d: EventNode) {
            event.stopPropagation();
            focusOnCard(d, svg);
        });

    cardGroups.each(function(d: EventNode) {
        const type = getEventCardType(d);
        renderCardContent(d3.select<SVGGElement, EventNode>(this as SVGGElement), d, type);
    });

    const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 2.5])
        .on("zoom", (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
            mainGroup.attr("transform", event.transform.toString());
        });

    function focusOnCard(d: EventNode, svgEl: D3SVGSelection): void {
        const width = window.innerWidth;
        const height = window.innerHeight;

        const scale = 1.2;
        const tx = width / 2 - (d.x + CARD_WIDTH / 2) * scale;
        const ty = height / 2 - (d.y + CARD_HEIGHT / 2) * scale;

        svgEl.transition()
            .duration(1000)
            .call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));

        cardsLayer.selectAll(".timeline-card-group").classed("is-focused", false);
        d3.select(`.timeline-card-group:nth-child(${d.id + 1})`).classed("is-focused", true);
    }

    svg.call(zoom);

    if (eventNodes.length > 0) {
        const d = eventNodes[0];
        const width = window.innerWidth;
        const height = window.innerHeight;
        const scale = 0.6;
        const tx = width / 2 - (d.x + CARD_WIDTH / 2) * scale;
        const ty = height / 2 - (d.y + CARD_HEIGHT / 2) * scale;
        svg.call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
    }

    document.getElementById("zoom-in")?.addEventListener("click", () => {
        svg.transition().call(zoom.scaleBy, 1.3);
    });
    document.getElementById("zoom-out")?.addEventListener("click", () => {
        svg.transition().call(zoom.scaleBy, 0.7);
    });
    document.getElementById("zoom-reset")?.addEventListener("click", () => {
        if (eventNodes.length > 0) {
            const d = eventNodes[0];
            const width = window.innerWidth;
            const height = window.innerHeight;
            const scale = 0.5;
            const tx = width / 2 - (d.x + CARD_WIDTH / 2) * scale;
            const ty = height / 2 - (d.y + CARD_HEIGHT / 2) * scale;
            svg.transition().duration(1000).call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
        }
    });
};

export default async function (container: HTMLElement, props: Record<string, unknown>): Promise<void> {
    const svg = d3.select<SVGSVGElement, unknown>("#timeline-board");
    const loaderEl = document.getElementById("timeline-loading");

    try {
        console.log("> Accessing Classified Archives for Crime Board...");

        const query = `*[_type == "timelineEra"] | order(order asc) {
            title_en,
            "events": events[] {
                title_en,
                text_en,
                date,
                external_image_url,
                "slug": slug.current,
                image {
                    asset->{
                        url
                    }
                }
            }
        }`;

        const eras: TimelineEra[] = await client.fetch(query);

        if (eras && eras.length > 0) {
            buildCrimeBoard(eras, svg);

            if (loaderEl) {
                loaderEl.style.opacity = "0";
                setTimeout(() => { loaderEl.style.display = "none"; }, 1000);
            }
        } else {
            if (loaderEl) loaderEl.style.display = "none";
            const wrapper = document.getElementById("timeline-wrapper");
            if (wrapper) {
                wrapper.innerHTML = `<div class="flex items-center justify-center h-full text-red-800 font-mono uppercase tracking-widest">[ ERROR: ARCHIVES PURGED ]</div>`;
            }
        }
    } catch (error) {
        console.error("Crime Board Reconstruction Failed:", error);
        if (loaderEl) {
            const span = document.createElement("span");
            span.className = "text-red-800 font-mono";
            span.textContent = `SYSTEM FAILURE: ${(error as Error).message}`;
            loaderEl.replaceChildren(span);
        }
    }
}
