import DOMPurify from 'dompurify';
import gsap from 'gsap';

import { client } from '../../lib/sanityClient';
import { applyBlurToStaticImage } from '../../lib/imageUtils';
import i18next from '../../lib/i18n';
import { injectSchema, generateCharacterSchema } from '../../lib/seo';

interface CharacterImage {
    url: string;
    blurHash?: string;
    lqip?: string;
}

interface CharacterFaction {
    title: string;
    color?: string;
}

interface Character {
    name: string;
    alias?: string;
    status?: string;
    description?: string;
    quote?: string;
    role?: string;
    title?: string;
    origin?: string;
    illustrator?: string;
    illustrator_nick?: string;
    instagram_nick?: string;
    image?: CharacterImage;
    faction?: CharacterFaction;
}

interface DossierElements {
    loader: Element | null;
    dossier: Element | null;
    image: HTMLImageElement | null;
    statusBadge: Element | null;
    name: Element | null;
    alias: Element | null;
    faction: Element | null;
    location: Element | null;
    role: Element | null;
    bio: Element | null;
    quote: Element | null;
    artistTag: Element | null;
    artistName: Element | null;
    artistField: Element | null;
    artistLink: HTMLAnchorElement | null;
    artistLinkTag: HTMLAnchorElement | null;
    title: string;
}

const typeWriter = (element: Element, text: string, speed: number = 20): void => {
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

const updateCharacterImage = (els: DossierElements, character: Character): string => {
    const imgUrl = character.image?.url ?? 'https://placehold.co/600x800/000000/333333?text=NO+IMAGE';
    const blurHash = character.image?.blurHash;

    if (!els.image) return imgUrl;

    if (character.image?.url) {
        applyBlurToStaticImage('char-image', imgUrl, blurHash ?? '');
    } else {
        els.image.src = imgUrl;
    }
    return imgUrl;
};

const updateStatusBadge = (statusBadge: Element | null, character: Character): void => {
    if (!statusBadge) return;

    const rawStatus = character.status ?? 'Active';
    const statusKey = `character_detail_page.status_${rawStatus.toLowerCase()}`;
    statusBadge.textContent = i18next.exists(statusKey) ? i18next.t(statusKey) : rawStatus;

    const isDeceased = rawStatus.toLowerCase() === 'deceased' || rawStatus.toLowerCase() === 'kia';
    statusBadge.className = 'font-mono text-xs uppercase font-bold tracking-widest animate-pulse ' +
        (isDeceased ? 'text-red-600' : 'text-green-500');
};

const updateTextFields = (els: DossierElements, character: Character): void => {
    els.name?.textContent !== undefined && (els.name!.textContent = character.name);

    if (character.alias && els.alias) els.alias.textContent = `"${character.alias}"`;

    document.title = `${character.name} // ${i18next.t('character_detail_page.doc_title_suffix')}`;

    if (els.faction) els.faction.textContent = character.faction?.title ?? i18next.t('character_detail_page.unknown');
    if (els.location) els.location.textContent = character.origin ?? (character.faction ? i18next.t('character_detail_page.affiliated_territory') : i18next.t('character_detail_page.unknown'));
    const roleText = character.role ?? character.title ?? 'Operative';
    if (els.role) els.role.textContent = roleText;

    if (els.bio) {
        const bioText = character.description ?? i18next.t('character_detail_page.bio_error');
        DOMPurify.sanitize(bioText);
        els.bio.innerHTML = '<span class="loading-cursor"></span>';
        typeWriter(els.bio, bioText.replace(/<\/?[^>]+(>|$)/g, ""), 5);
    }

    if (els.quote) {
        const quoteText = character.quote ? `"${character.quote}"` : "...";
        typeWriter(els.quote, quoteText, 30);
    }

    if (els.artistName) {
        els.artistName.textContent = character.illustrator ?? "Classified";
    }
    if (els.artistField) {
        els.artistField.textContent = character.illustrator ?? "Classified";
    }

    const artistNick = character.instagram_nick ?? character.illustrator_nick;
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

const injectCharacterSeo = (character: Character, imgUrl: string): void => {
    try {
        const schemaData = generateCharacterSchema({
            name: character.name,
            image: { url: imgUrl },
            description: character.description ?? "",
            faction: character.faction,
            role: character.role ?? character.title
        });
        injectSchema(schemaData);
        console.log("> SEO Protocol: Character Schema Injected.");
    } catch (err) {
        console.warn("> SEO Protocol Warning: Failed to inject schema.", err);
    }
};

const renderCharacterDetails = async (character: Character, container: Element): Promise<void> => {
    const els: DossierElements = {
        loader: container.querySelector('#file-loader'),
        dossier: container.querySelector('#character-dossier'),
        image: container.querySelector<HTMLImageElement>('#char-image'),
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
        artistLink: container.querySelector<HTMLAnchorElement>('#char-artist-link'),
        artistLinkTag: container.querySelector<HTMLAnchorElement>('#char-artist-link-tag'),
        title: document.title,
    };

    if (!els.name) { console.error("ERROR: Dossier layout corrupted. Missing DOM elements."); return; }

    const imgUrl = updateCharacterImage(els, character);
    injectCharacterSeo(character, imgUrl);
    updateStatusBadge(els.statusBadge, character);
    updateTextFields(els, character);

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
                    gsap.from('#char-image', { scale: 1.2, filter: 'blur(20px) grayscale(1)', duration: 2 });
                    gsap.from('#char-name', { x: -50, opacity: 0, duration: 1, delay: 0.5 });
                    gsap.from('#char-alias', { x: -30, opacity: 0, duration: 1, delay: 0.8 });
                }
            });
        }
    }, 1200);
};

export default async function (container: Element, props: unknown): Promise<void> {
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
        const character: Character | null = await client.fetch(query, sanityParams);

        if (character) {
            console.log("> Access Granted. Rendering file.");
            await renderCharacterDetails(character, container);
        } else {
            container.innerHTML = `
                <div class="flex h-screen items-center justify-center bg-black text-red-600 font-mono">
                   ERROR 404: Subject not found in archives.
                </div>`;
        }
    } catch (error) {
        console.error("System Failure:", error);
        const loaderText = document.querySelector('#file-loader p');
        if (loaderText) {
            loaderText.textContent = "CONNECTION FAILED";
            loaderText.classList.add('text-red-500');
        }
    }
}
