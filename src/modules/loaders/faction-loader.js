import DOMPurify from 'dompurify';
import { client } from '../../lib/sanityClient.js';
import i18next from '../../lib/i18n.js';
import { injectSchema } from '../../lib/seo.js';
import { gsap } from 'gsap';

// 👇 1. GSAP IMPORTLARI
import { NoirEffects } from '../ui/noir-effects.js';

/* --------------------------------------------------------------------------
   RIGHT PANEL GENERATOR (ACTIVE FACTION INTEL)
   -------------------------------------------------------------------------- */
const renderActiveFaction = (faction, container) => {
    const isOldWorld = faction.type === 'syndicate';
    
    // Determine Theme Color
    let accentColor = faction.color?.hex || '#a3a3a3'; // Fallback
    const rootStyles = getComputedStyle(document.documentElement);
    if (!faction.color) {
        accentColor = isOldWorld 
            ? rootStyles.getPropertyValue('--old-world-red').trim() || '#8b0000'
            : rootStyles.getPropertyValue('--new-world-blue').trim() || '#004488';
    }
    
    const iconClass = isOldWorld ? 'fa-chess-rook' : 'fa-network-wired';
    const leaderName = faction.leader?.name || 'Classified';
    const imageUrl = faction.image?.asset?.url || 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?q=80&w=1920&auto=format&fit=crop';

    // Segmented bar generator
    const generateSegmentedBar = (percentage, colorHex) => {
        const totalSegments = 10;
        const activeSegments = Math.round((percentage / 100) * totalSegments);
        let segmentsHTML = '';
        for (let i = 0; i < totalSegments; i++) {
            const isActive = i < activeSegments;
            const bg = isActive ? colorHex : 'transparent';
            const border = isActive ? colorHex : 'rgba(255,255,255,0.1)';
            const shadow = isActive ? `box-shadow: 0 0 5px ${colorHex}80;` : '';
            
            segmentsHTML += `<div class="stat-segment h-1 flex-1 opacity-0 transform translate-y-2" style="background-color: ${bg}; border: 1px solid ${border}; ${shadow}"></div>`;
        }
        return `<div class="flex gap-1 w-full mt-2">${segmentsHTML}</div>`;
    };

    const statsHTML = `
        <div class="mb-4">
            <div class="flex justify-between text-[10px] font-mono mb-1">
                <span class="uppercase tracking-widest text-gray-400">Brutality</span> <span class="text-white">95%</span>
            </div>
            ${generateSegmentedBar(95, accentColor)}
        </div>
        <div>
            <div class="flex justify-between text-[10px] font-mono mb-1">
                <span class="uppercase tracking-widest text-gray-400">Chaos</span> <span class="text-white">80%</span>
            </div>
            ${generateSegmentedBar(80, accentColor)}
        </div>
    `;

    container.innerHTML = DOMPurify.sanitize(`
        <!-- Full Background Image -->
        <div class="absolute inset-0 bg-cover bg-center opacity-40 transition-transform duration-1000 scale-105" id="faction-bg" style="background-image: url('${imageUrl}')"></div>
        
        <!-- Vignette & Gradients -->
        <div class="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/60 to-transparent z-10"></div>
        <div class="absolute inset-0 bg-gradient-to-r from-obsidian/80 via-transparent to-transparent z-10"></div>
        
        <!-- Massive Watermark -->
        <div class="absolute -right-20 -bottom-20 text-[20rem] opacity-[0.03] z-0 pointer-events-none select-none" style="color: ${accentColor}">
            <i class="fas ${iconClass}"></i>
        </div>

        <!-- CONTENT HUD -->
        <div class="relative z-20 p-8 md:p-12 h-full flex flex-col justify-end w-full lg:w-4/5">
            
            <!-- Type Label -->
            <div class="flex items-center gap-3 mb-6 slide-up-el opacity-0">
                <div class="w-2 h-6 shadow-[0_0_10px_${accentColor}]" style="background-color:${accentColor}"></div>
                <p class="text-xs font-mono text-gray-300 uppercase tracking-[0.3em]">
                    ${faction.type || i18next.t('factions.default_type')}
                </p>
                <span class="text-[10px] text-gold border border-gold/30 px-2 py-0.5 rounded-sm animate-pulse ml-4">LIVE FEED</span>
            </div>

            <!-- Title -->
            <h2 class="text-5xl md:text-7xl mb-6 font-serif text-white uppercase tracking-wider drop-shadow-2xl slide-up-el opacity-0">
                <span class="glitch-text" data-text="${faction.title}">${faction.title}</span>
            </h2>
            
            <!-- Summary -->
            <p class="text-gray-300 text-lg md:text-xl leading-relaxed mb-10 font-sans max-w-3xl slide-up-el opacity-0 border-l-2 pl-4" style="border-color: ${accentColor}">
                ${faction.summary || faction.motto || i18next.t('factions.details_classified')}
            </p>
            
            <!-- Data Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 slide-up-el opacity-0">
                <div class="bg-black/60 p-6 border border-white/10 backdrop-blur-md rounded-sm">
                    ${statsHTML}
                </div>
                
                <div class="flex flex-col justify-between bg-black/40 p-6 border border-white/5 backdrop-blur-sm">
                    <div class="text-[11px] font-mono text-gray-500 uppercase flex flex-col mb-6">
                        <span class="mb-2 text-gray-600 tracking-widest">Known Commander</span>
                        <span class="text-white text-lg"><i class="fas fa-user-tie mr-3" style="color: ${accentColor}"></i>${leaderName}</span>
                    </div>
                    
                    <a href="faction-detail.html?slug=${faction.slug.current || faction.slug}" class="hq-border-button hover:bg-white/10 transition-colors px-6 py-3 border border-white/30 text-xs font-mono text-white flex items-center justify-between group cursor-pointer w-full">
                        <span class="tracking-widest uppercase">Access Full Dossier</span>
                        <i class="fas fa-arrow-right text-[${accentColor}] group-hover:translate-x-2 transition-transform"></i>
                    </a>
                </div>
            </div>
        </div>
    `);

    // Animate the entrance of right panel content
    gsap.fromTo(".slide-up-el", 
        { y: 30, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: "out.expo" }
    );
    gsap.to(".stat-segment", {
        y: 0,
        opacity: 1,
        duration: 0.4,
        stagger: 0.02,
        ease: "power2.out",
        delay: 0.3
    });
    // Slight zoom on bg
    gsap.to("#faction-bg", { scale: 1, duration: 6, ease: "sine.out" });
};

/* --------------------------------------------------------------------------
   3D COVERFLOW BUILDER
   -------------------------------------------------------------------------- */
const initCoverflow = (factions, coverflowContainer, displayContainer) => {
    const items = [];
    let currentIndex = 0;
    
    // Clear container (keep the pulse line)
    coverflowContainer.innerHTML = '<div class="absolute inset-x-0 top-1/2 -mt-[50px] h-[100px] border-y border-gold/20 bg-gold/5 pointer-events-none z-0 mix-blend-screen pulse-subtle"></div>';

    // 1. Create DOM Elements
    factions.forEach((faction, index) => {
        const isOldWorld = faction.type === 'syndicate';
        let accentColor = faction.color?.hex || '#a3a3a3'; 
        const rootStyles = getComputedStyle(document.documentElement);
        if (!faction.color) {
            accentColor = isOldWorld 
                ? rootStyles.getPropertyValue('--old-world-red').trim() || '#8b0000'
                : rootStyles.getPropertyValue('--new-world-blue').trim() || '#004488';
        }

        const item = document.createElement('div');
        item.className = 'coverflow-item';
        item.style.setProperty('--theme-color', accentColor);
        item.setAttribute('data-index', index);
        
        item.innerHTML = DOMPurify.sanitize(`
            <div class="flex-1">
                <h3 class="item-title">${faction.title}</h3>
                <span class="item-subtitle">${faction.type || 'SYNDICATE'} // LVL ${Math.floor(Math.random() * 5) + 1}</span>
            </div>
            <div class="text-2xl opacity-50"><i class="fas ${isOldWorld ? 'fa-chess-rook' : 'fa-network-wired'}"></i></div>
        `);

        // Click to select
        item.addEventListener('click', () => {
            if (currentIndex !== index) {
                currentIndex = index;
                updateCoverflow();
            }
        });

        coverflowContainer.appendChild(item);
        items.push(item);
    });

    // 2. Logic to update positions
    const updateCoverflow = () => {
        items.forEach((item, i) => {
            const offset = i - currentIndex;
            const absOffset = Math.abs(offset);
            
            // Manage Active State
            if (offset === 0) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
            
            const isVisible = absOffset <= 3; // Show 3 items up and down

            // GSAP Animation for 3D Transform
            gsap.to(item, {
                y: offset * 80, // Vertical spacing
                z: isVisible ? -absOffset * 150 : -600, // Push back
                rotateX: isVisible ? offset * -15 : offset * -30, // Tilt away from center
                opacity: isVisible ? 1 - (absOffset * 0.25) : 0, // Fade out the further away
                duration: 0.6,
                ease: 'power3.out',
                zIndex: 100 - absOffset, // Center items on top
                onUpdate: function() {
                    const currentBlur = isVisible ? absOffset * 3 : 10;
                    item.style.filter = `blur(${currentBlur}px)`;
                }
            });
        });

        // Trigger right panel update
        renderActiveFaction(factions[currentIndex], displayContainer);
    };

    // 3. Wheel & Touch Interaction
    let lastWheelTime = 0;
    const scrollThrottle = 150; // ms

    const handleNext = () => {
        if (currentIndex < items.length - 1) {
            currentIndex++;
            updateCoverflow();
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            currentIndex--;
            updateCoverflow();
        }
    };

    coverflowContainer.addEventListener('wheel', (e) => {
        e.preventDefault();
        e.stopImmediatePropagation();
        
        const now = Date.now();
        if (now - lastWheelTime < scrollThrottle) return;
        lastWheelTime = now;

        if (e.deltaY > 0) {
            handleNext();
        } else if (e.deltaY < 0) {
            handlePrev();
        }
    }, { passive: false });

    // Touch Support
    let touchStartY = 0;
    coverflowContainer.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
    }, { passive: true });

    coverflowContainer.addEventListener('touchmove', (e) => {
        const touchY = e.touches[0].clientY;
        const diff = touchStartY - touchY;
        
        if (Math.abs(diff) > 30) {
            e.preventDefault();
            e.stopImmediatePropagation();
            if (diff > 0) handleNext();
            else handlePrev();
            touchStartY = touchY; // Reset for next segment
        }
    }, { passive: false });

    // Initial Render
    updateCoverflow();
};

/* --------------------------------------------------------------------------
   MAIN EXECUTION
   -------------------------------------------------------------------------- */
export default async function (container, props) {
    const consoleLayout = container.querySelector('#console-layout');
    
    // Coverflow target
    const coverflowContainer = container.querySelector('#coverflow-container');
    
    // Target display panel
    const displayPanel = container.querySelector('#faction-display');
    const loader = container.querySelector('#factions-loader');
    const countDisplay = container.querySelector('#roster-count');

    if (!consoleLayout || !coverflowContainer || !displayPanel) return;

    try {
        console.log("> Accessing Faction Database...");
        const query = `*[_type == "faction"] | order(title asc) {
            title, 
            "slug": slug.current, 
            motto,
            summary,
            type,
            color,
            "image": image.asset->url,
            "hqName": hq,
            leader->{name}
        }`;

        const factions = await client.fetch(query);

        if (factions && factions.length > 0) {
            if (loader) loader.style.display = 'none';
            
            // Show the layout
            consoleLayout.classList.remove('opacity-0');
            countDisplay.innerText = `${factions.length} TARGETS IDENTIFIED`;

            // Initialize Vertical Coverflow
            initCoverflow(factions, coverflowContainer, displayPanel);

        } else {
            if (loader) loader.style.display = 'none';
            consoleLayout.innerHTML = `
                <div class="w-full h-full flex flex-col items-center justify-center p-20 text-red-500 font-mono">
                    <i class="fas fa-ban text-4xl mb-4"></i>
                    <p class="uppercase tracking-widest">${i18next.t('factions.no_factions_found')}</p>
                </div>`;
            consoleLayout.classList.remove('opacity-0');
        }
    } catch (error) {
        console.error("Intel Retrieval Failed: ", error);
        if (loader) loader.style.display = 'none';
        consoleLayout.innerHTML = `<div class="w-full flex items-center justify-center text-red-500 font-mono"><p>${i18next.t('factions.error_connection')}</p></div>`;
        consoleLayout.classList.remove('opacity-0');
    }
}