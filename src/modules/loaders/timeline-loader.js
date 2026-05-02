import { client, urlFor } from "../../lib/sanityClient.js";
import i18next from "../../lib/i18n.js";
import * as d3 from 'd3';

/**
 * INTERACTIVE CRIME BOARD (TIMELINE v2)
 * Using D3.js to create a zoomable, draggable board of evidence.
 */

// Configuration for the board
const BOARD_WIDTH = 5000;
const BOARD_HEIGHT = 4000;
const CARD_WIDTH = 340;
const CARD_HEIGHT = 420;

const getEventCardType = (evt) => {
    if (evt.external_image_url || evt.image?.asset?.url) return 'polaroid';
    if (evt.text_en?.length > 300) return 'clipping';
    return 'note';
};

const renderCardContent = (selection, evt, type) => {
    // Base shadows and backgrounds are handled via CSS classes
    
    // Header/Pin
    selection.append("circle")
        .attr("cx", CARD_WIDTH / 2)
        .attr("cy", 15)
        .attr("r", 6)
        .attr("class", "board-pin shadow-lg");

    // Background rect based on type
    selection.append("rect")
        .attr("x", 0)
        .attr("y", 30)
        .attr("width", CARD_WIDTH)
        .attr("height", CARD_HEIGHT - 30)
        .attr("class", `${type}-bg timeline-card`);

    // Date
    let dateDisplay = evt.date || "UNKNOWN";
    if (evt.date && evt.date.includes("-")) {
        const parts = evt.date.split("-");
        if (parts.length === 3) dateDisplay = `${parts[2]}.${parts[1]}.${parts[0]}`;
    }

    selection.append("text")
        .attr("x", 20)
        .attr("y", 60)
        .attr("class", "card-date")
        .text(`[ RECORD_${dateDisplay} ]`);

    // Image for Polaroids
    if (type === 'polaroid') {
        let imageUrl = evt.external_image_url || evt.image?.asset?.url;
        if (!imageUrl && evt.image) {
            try { imageUrl = urlFor(evt.image)?.url(); } catch(e) {}
        }

        if (imageUrl) {
            // Clip path for image
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
            
            // Image border/overlay
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

    // Title
    const title = evt.title_en || "UNTITLED_RECORD";
    const textY = type === 'polaroid' ? 345 : 90;
    
    selection.append("text")
        .attr("x", 20)
        .attr("y", textY)
        .attr("class", "card-title")
        .style("font-size", "18px")
        .text(title.length > 25 ? title.substring(0, 22) + "..." : title);

    // Text Content (Wrapped)
    const rawText = evt.text_en || "";
    const cleanText = rawText.replace(/<[^>]*>/g, '').substring(0, 200) + "...";
    
    const textElement = selection.append("text")
        .attr("x", 20)
        .attr("y", textY + 25)
        .attr("class", "card-text")
        .attr("width", CARD_WIDTH - 40);

    // Simple manual wrapping
    const words = cleanText.split(/\s+/);
    let line = [];
    let lineNumber = 0;
    const lineHeight = 1.4; // ems
    const y = textElement.attr("y");
    const x = textElement.attr("x");
    let tspan = textElement.append("tspan").attr("x", x).attr("y", y).attr("dy", "1em");
    
    for (let n = 0; n < words.length; n++) {
        line.push(words[n]);
        tspan.text(line.join(" "));
        if (tspan.node().getComputedTextLength() > CARD_WIDTH - 50) {
            line.pop();
            tspan.text(line.join(" "));
            line = [words[n]];
            tspan = textElement.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + 1 + "em").text(words[n]);
            if (lineNumber > 5) break; // Limit lines
        }
    }

    // Focus ring
    selection.append("rect")
        .attr("x", -5)
        .attr("y", 25)
        .attr("width", CARD_WIDTH + 10)
        .attr("height", CARD_HEIGHT - 20)
        .attr("class", "card-focus-ring")
        .attr("rx", 5);
};

const buildCrimeBoard = (eras, svg) => {
    const mainGroup = svg.select("#main-group");
    const linksLayer = svg.select("#links-layer");
    const cardsLayer = svg.select("#cards-layer");
    
    const allEvents = eras.flatMap(e => e.events || []);
    const eventNodes = [];

    // Layout Logic: Spiral path or Zig-zag path for events
    // Let's use a semi-random zig-zag path from top-left to bottom-right
    allEvents.forEach((evt, i) => {
        const stepX = 500;
        const col = i % 8;
        const row = Math.floor(i / 8);
        
        const baseX = 400 + (col * stepX);
        const baseY = 400 + (row * 600);
        
        // Add random jitter
        const x = baseX + (Math.random() * 200 - 100);
        const y = baseY + (Math.random() * 150 - 75);
        const rotation = (Math.random() * 10 - 5);

        eventNodes.push({ ...evt, x, y, rotation, id: i });
    });

    // Draw Red Strings (Links)
    const lineGenerator = d3.line()
        .x(d => d.x + CARD_WIDTH / 2)
        .y(d => d.y + 15) // Pin position
        .curve(d3.curveBasis); // Smooth paths for organic feeling strings

    // Draw lines between sequential events
    for (let i = 0; i < eventNodes.length - 1; i++) {
        const start = eventNodes[i];
        const end = eventNodes[i+1];
        
        // Midpoint for curve jitter
        const midX = (start.x + end.x) / 2 + (Math.random() * 100 - 50);
        const midY = (start.y + end.y) / 2 + (Math.random() * 100 - 50);

        linksLayer.append("path")
            .datum([start, {x: midX - CARD_WIDTH/2, y: midY - 15}, end])
            .attr("class", "red-string-path")
            .attr("d", lineGenerator);
    }

    // Render Cards
    const cardGroups = cardsLayer.selectAll(".timeline-card-group")
        .data(eventNodes)
        .enter()
        .append("g")
        .attr("class", "timeline-card-group")
        .attr("transform", d => `translate(${d.x},${d.y}) rotate(${d.rotation})`)
        .on("click", function(event, d) {
            // Focus on clip
            event.stopPropagation();
            focusOnCard(d, svg);
        });

    cardGroups.each(function(d) {
        const type = getEventCardType(d);
        renderCardContent(d3.select(this), d, type);
    });

    // Zoom Functions
    function focusOnCard(d, svg) {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        const scale = 1.2;
        const tx = width / 2 - (d.x + CARD_WIDTH / 2) * scale;
        const ty = height / 2 - (d.y + CARD_HEIGHT / 2) * scale;

        svg.transition()
            .duration(1000)
            .call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
            
        cardsLayer.selectAll(".timeline-card-group").classed("is-focused", false);
        d3.select(`.timeline-card-group:nth-child(${d.id + 1})`).classed("is-focused", true);
    }

    const zoom = d3.zoom()
        .scaleExtent([0.1, 2.5])
        .on("zoom", (event) => {
            mainGroup.attr("transform", event.transform);
        });

    svg.call(zoom);

    // Initial positioning: focus on first event
    if (eventNodes.length > 0) {
        const d = eventNodes[0];
        const width = window.innerWidth;
        const height = window.innerHeight;
        const scale = 0.6;
        const tx = width / 2 - (d.x + CARD_WIDTH / 2) * scale;
        const ty = height / 2 - (d.y + CARD_HEIGHT / 2) * scale;
        svg.call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
    }

    // HUD Controls binding
    document.getElementById("zoom-in").addEventListener("click", () => {
        svg.transition().call(zoom.scaleBy, 1.3);
    });
    document.getElementById("zoom-out").addEventListener("click", () => {
        svg.transition().call(zoom.scaleBy, 0.7);
    });
    document.getElementById("zoom-reset").addEventListener("click", () => {
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

export default async function (container, props) {
  const svg = d3.select("#timeline-board");
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

    const eras = await client.fetch(query);

    if (eras && eras.length > 0) {
      buildCrimeBoard(eras, svg);
      
      // Dramatic exit for loader
      if (loaderEl) {
          loaderEl.style.opacity = "0";
          setTimeout(() => loaderEl.style.display = "none", 1000);
      }
      
    } else {
      if (loaderEl) loaderEl.style.display = "none";
      const wrapper = document.getElementById("timeline-wrapper");
      wrapper.innerHTML = `<div class="flex items-center justify-center h-full text-red-800 font-mono uppercase tracking-widest">[ ERROR: ARCHIVES PURGED ]</div>`;
    }
  } catch (error) {
    console.error("Crime Board Reconstruction Failed:", error);
    if (loaderEl) loaderEl.innerHTML = `<span class='text-red-800 font-mono'>SYSTEM FAILURE: ${error.message}</span>`;
  }
}
