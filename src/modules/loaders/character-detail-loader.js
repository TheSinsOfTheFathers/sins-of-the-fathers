import DOMPurify from 'dompurify';

import { client } from '../../lib/sanityClient.js';
import { applyBlurToStaticImage } from '../../lib/imageUtils.js';
import i18next from '../../lib/i18n.js';
// 👇 SEO / SCHEMA İMPORTU
import { injectSchema, generateCharacterSchema } from '../../lib/seo.js';



import gsap from 'gsap';

/* --------------------------------------------------------------------------
   HELPER FUNCTIONS (Cognitive Complexity Reduction)
   -------------------------------------------------------------------------- */

/**
 * Simple Typewriter effect for text
 */
const typeWriter = (element, text, speed = 20) => {
    element.innerHTML = '';
    let i = 0;
    const inner = () => {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            setTimeout(inner, speed);
        }
    };
    inner();
};

/**
 * Updates character image with blur hash effect
 */
const updateCharacterImage = (els, character) => {
    const imgUrl = character.image?.url || 'https://placehold.co/600x800/000000/333333?text=NO+IMAGE';
    const blurHash = character.image?.blurHash;

    if (!els.image) return imgUrl;

    if (character.image?.url) {
        applyBlurToStaticImage('char-image', imgUrl, blurHash);
    } else {
        els.image.src = imgUrl;
    }
    return imgUrl;
};

/**
 * Updates character status badge
 */
const updateStatusBadge = (statusBadge, character) => {
    if (!statusBadge) return;

    const rawStatus = character.status || 'Active';
    const statusKey = `character_detail_page.status_${rawStatus.toLowerCase()}`;
    statusBadge.textContent = i18next.exists(statusKey) ? i18next.t(statusKey) : rawStatus;

    const isDeceased = rawStatus.toLowerCase() === 'deceased' || rawStatus.toLowerCase() === 'kia';
    statusBadge.className = 'font-mono text-xs uppercase font-bold tracking-widest animate-pulse ' +
        (isDeceased ? 'text-red-600' : 'text-green-500');
};

/**
 * Updates text fields for character details
 */
const updateTextFields = (els, character) => {
    els.name.textContent = character.name;
    if (character.alias) els.alias.textContent = `"${character.alias}"`;

    document.title = `${character.name} // ${i18next.t('character_detail_page.doc_title_suffix')}`;

    if (els.faction) els.faction.textContent = character.faction?.title || i18next.t('character_detail_page.unknown');
    if (els.location) els.location.textContent = character.origin || (character.faction ? i18next.t('character_detail_page.affiliated_territory') : i18next.t('character_detail_page.unknown'));
    const roleText = character.role || character.title || 'Operative';
    if (els.role) els.role.textContent = roleText;

    if (els.bio) {
        const bioText = character.description || i18next.t('character_detail_page.bio_error');
        // Sanitizing and then typewriting
        const sanitizedBio = DOMPurify.sanitize(bioText);
        // We use a simplified version for typewriter: no HTML tags inner
        els.bio.innerHTML = '<span class="loading-cursor"></span>';
        typeWriter(els.bio, bioText.replace(/<\/?[^>]+(>|$)/g, ""), 5);
    }

    if (els.quote) {
        const quoteText = character.quote ? `"${character.quote}"` : "...";
        typeWriter(els.quote, quoteText, 30);
    }

    if (els.artistName) {
        els.artistName.textContent = character.illustrator || "Classified";
    }
    if (els.artistField) {
        els.artistField.textContent = character.illustrator || "Classified";
    }

    const artistNick = character.instagram_nick || character.illustrator_nick;
    if (artistNick) {
        const url = `https://instagram.com/${artistNick}`;
        if (els.artistLink) els.artistLink.href = url;
        if (els.artistLinkTag) els.artistLinkTag.href = url;
    } else {
        if (els.artistLink) {
            els.artistLink.style.pointerEvents = 'none';
            els.artistLink.removeAttribute('href');
        }
        if (els.artistLinkTag) {
            els.artistLinkTag.style.pointerEvents = 'none';
            els.artistLinkTag.removeAttribute('href');
        }
    }

    if (els.artistTag) {
        els.artistTag.classList.remove('opacity-0');
    }
};





/**
 * Injects SEO schema for character
 */
const injectCharacterSeo = (character, imgUrl) => {
    try {
        const schemaData = generateCharacterSchema({
            name: character.name,
            image: { url: imgUrl },
            description: character.description || "",
            faction: character.faction,
            role: character.role || character.title
        });
        injectSchema(schemaData);
        console.log("> SEO Protocol: Character Schema Injected.");
    } catch (err) {
        console.warn("> SEO Protocol Warning: Failed to inject schema.", err);
    }
};



/**
 * KARAKTER DETAYLARINI GÖRSELLEŞTİRİR
 * HTML Sayfasındaki ID'lere Sanity verilerini enjekte eder.
 */
const renderCharacterDetails = async (character, container) => {
    const els = {
        loader: container.querySelector('#file-loader'),
        dossier: container.querySelector('#character-dossier'),
        image: container.querySelector('#char-image'),
        statusBadge: container.querySelector('#char-status'),
        name: container.querySelector('#char-name'),
        alias: container.querySelector('#char-alias'),
        faction: container.querySelector('#char-faction'),
        location: container.querySelector('#char-location'),
        role: container.querySelector('#char-role'),
        bio: container.querySelector('#char-bio'),
        quote: container.querySelector('#char-quote'),
        artistTag: container.querySelector('#char-artist-tag'),
        artistName: container.querySelector('#char-artist-name'),
        artistField: container.querySelector('#char-artist'),
        artistLink: container.querySelector('#char-artist-link'),
        artistLinkTag: container.querySelector('#char-artist-link-tag'),

        title: document.title


    };

    if (!els.name) { console.error("ERROR: Dossier layout corrupted. Missing DOM elements."); return; }

    // 1. Update visual elements using helper functions
    const imgUrl = updateCharacterImage(els, character);
    injectCharacterSeo(character, imgUrl);
    updateStatusBadge(els.statusBadge, character);
    updateTextFields(els, character);

    /* ------------------------------------------------------
       2. YÜKLEME EKRANINI KALDIR VE ANİMASYONLARI BAŞLAT
    ------------------------------------------------------ */
    setTimeout(() => {
        if (els.loader) {
            gsap.to(els.loader, { opacity: 0, pointerEvents: 'none', duration: 1 });
        }
        if (els.dossier) {
            gsap.to(els.dossier, { 
                opacity: 1, 
                y: 0, 
                duration: 1.5, 
                ease: "power4.out",
                onStart: () => {
                    // Start sub-animations
                    gsap.from('#char-image', { scale: 1.2, filter: 'blur(20px) grayscale(1)', duration: 2 });
                    gsap.from('#char-name', { x: -50, opacity: 0, duration: 1, delay: 0.5 });
                    gsap.from('#char-alias', { x: -30, opacity: 0, duration: 1, delay: 0.8 });
                }
            });
        }
    }, 1200);


};

/**
 * SAYFA YÜKLENDİĞİNDE ÇALIŞAN ANA FONKSİYON
 */
export default async function (container, props) {
    const params = new URLSearchParams(globalThis.location.search);
    const characterSlug = params.get('slug');

    if (!characterSlug) {
        console.error("Access Denied: Missing slug parameter.");
        return;
    }

    try {
        console.log(`> Querying database for Subject: ${characterSlug}`);

        const query = `*[_type == "character" && slug.current == $slug][0]{
            ...,
            illustrator,
            "instagram_nick": illustrator_nick,

            "image": image.asset->{

                url,
                "blurHash": metadata.blurHash,
                "lqip": metadata.lqip
            },
            faction->{title, color}

        }`;

        const sanityParams = { slug: characterSlug };
        const character = await client.fetch(query, sanityParams);

        if (character) {
            console.log("> Access Granted. Rendering file.");
            await renderCharacterDetails(character, container);
        } else {
            container.innerHTML = `
                <div class="flex h-screen items-center justify-center bg-black text-red-600 font-mono">
                   ERROR 404: Subject not found in archives.
                </div>`;
        }
    }
    catch (error) {
        console.error("System Failure:", error);
        const loaderText = document.querySelector('#file-loader p');
        if (loaderText) {
            loaderText.textContent = "CONNECTION FAILED";
            loaderText.classList.add('text-red-500');
        }
    }
};