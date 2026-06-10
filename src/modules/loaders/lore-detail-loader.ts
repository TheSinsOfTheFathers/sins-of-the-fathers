import { client, urlFor } from '../../lib/sanityClient';
import { toHTML } from '@portabletext/to-html';
import { applyBlurToStaticImage } from '../../lib/imageUtils';
import i18next from '../../lib/i18n';
import { NoirEffects } from '../ui/noir-effects.js';
import { auth } from '../firebase-config.js';
import DOMPurify from 'dompurify';

interface SanityImageAsset {
    url: string;
    blurHash: string;
}

interface SanityMainImage {
    asset: SanityImageAsset;
}

interface RelatedEntity {
    _type: string;
    name?: string;
    title?: string;
    slug: string;
}

interface LoreDocument {
    _id: string;
    title: string;
    body: unknown[];
    date?: string;
    source?: string;
    author?: string;
    audioURL?: string;
    restricted?: boolean;
    mainImage?: SanityMainImage;
    relatedEntities?: RelatedEntity[];
}

interface LoreWrappers {
    mediaContainer: Element | null;
    imageWrapper: Element | null;
    audioWrapper: Element | null;
    paperWrapper: HTMLElement | null;
}

const updateLoreText = (doc: LoreDocument, container: Element): void => {
    const setText = (id: string, val: string | undefined, fallbackKey?: string): void => {
        const el = container.querySelector('#' + id);
        if (el) el.textContent = val ?? (fallbackKey ? i18next.t(fallbackKey) : '');
    };

    setText('lore-title', doc.title);
    setText('lore-id', `#${doc._id.slice(-6).toUpperCase()}`);
    setText('lore-source', doc.source, 'lore_detail.unknown_source');

    const dateEl = container.querySelector('#lore-date');
    if (dateEl) {
        const locale = i18next.language === 'tr' ? 'tr-TR' : 'en-US';
        const dateStr = doc.date
            ? new Date(doc.date).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' })
            : i18next.t('lore_detail.undated');
        dateEl.textContent = dateStr;
    }

    setText('lore-author', doc.author, 'lore_detail.redacted');
};

const renderLoreTags = (doc: LoreDocument, container: Element): void => {
    const tagsContainer = container.querySelector('#lore-tags');
    if (tagsContainer && doc.relatedEntities) {
        const raw = doc.relatedEntities.map((ref: RelatedEntity) => {
            const typeSlug = ref._type === 'character' ? 'character-detail' : 'faction-detail';
            return `
                <a href="${typeSlug}.html?slug=${ref.slug}" class="gsap-tag opacity-0 text-[10px] font-mono uppercase border border-gray-700 bg-white/5 px-2 py-1 hover:border-gold hover:text-gold transition text-gray-400">
                    #${ref.title ?? ref.name}
                </a>
            `;
        }).join('');
        tagsContainer.innerHTML = DOMPurify.sanitize(raw);
    } else if (tagsContainer) {
        tagsContainer.innerHTML = `<span class="text-[10px] text-gray-600 font-mono">${i18next.t('lore_detail.no_links')}</span>`;
    }
};

const handleAudioMedia = (doc: LoreDocument, wrappers: LoreWrappers, container: Element): void => {
    const { mediaContainer, audioWrapper } = wrappers;

    if (mediaContainer) mediaContainer.classList.remove('hidden');
    if (audioWrapper) {
        audioWrapper.classList.remove('hidden');

        const audio = container.querySelector('#lore-audio-source') as HTMLAudioElement | null;
        const playBtn = container.querySelector('#audio-play-btn') as HTMLElement | null;
        const progressBar = container.querySelector('#audio-progress-bar') as HTMLElement | null;
        const timeDisplay = container.querySelector('#audio-current-time') as HTMLElement | null;
        const statusText = container.querySelector('#audio-status-text') as HTMLElement | null;
        const progressContainer = container.querySelector('#audio-progress-container') as HTMLElement | null;

        if (!audio || !playBtn) return;

        audio.src = doc.audioURL ?? '';
        audio.load();

        if (statusText) statusText.textContent = i18next.t('lore_detail.audio_standby');

        const togglePlay = (): void => {
            if (audio.paused) {
                audio.play().catch((e: unknown) => console.error(e));
                playBtn.innerHTML = '<i class="fas fa-pause text-xl ml-0"></i>';
                if (statusText) {
                    statusText.textContent = i18next.t('lore_detail.audio_playing');
                    statusText.classList.add("animate-pulse", "text-red-500");
                }
            } else {
                audio.pause();
                playBtn.innerHTML = '<i class="fas fa-play text-xl ml-1"></i>';
                if (statusText) {
                    statusText.textContent = i18next.t('lore_detail.audio_paused');
                    statusText.classList.remove("animate-pulse", "text-red-500");
                }
            }
        };

        const newPlayBtn = playBtn.cloneNode(true) as HTMLElement;
        playBtn.parentNode?.replaceChild(newPlayBtn, playBtn);
        newPlayBtn.addEventListener('click', togglePlay);

        if (progressContainer) {
            progressContainer.addEventListener('click', (e: MouseEvent) => {
                const rect = progressContainer.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                if (audio.duration) audio.currentTime = percent * audio.duration;
            });
        }

        audio.ontimeupdate = (): void => {
            if (audio.duration) {
                const percent = (audio.currentTime / audio.duration) * 100;
                if (progressBar) progressBar.style.width = `${percent}%`;
                const mins = Math.floor(audio.currentTime / 60);
                const secs = Math.floor(audio.currentTime % 60);
                if (timeDisplay) timeDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            }
        };

        audio.onended = (): void => {
            newPlayBtn.innerHTML = '<i class="fas fa-play text-xl ml-1"></i>';
            if (statusText) {
                statusText.textContent = i18next.t('lore_detail.audio_ended');
                statusText.classList.remove("animate-pulse", "text-red-500");
            }
            if (progressBar) progressBar.style.width = '0%';
        };
    }
};

const handleImageAndBody = (doc: LoreDocument, wrappers: LoreWrappers, container: Element): void => {
    const { mediaContainer, imageWrapper, paperWrapper } = wrappers;

    if (doc.mainImage && doc.mainImage.asset) {
        if (mediaContainer) mediaContainer.classList.remove('hidden');
        if (imageWrapper) imageWrapper.classList.remove('hidden');

        const imageUrl = urlFor(doc.mainImage).width(800).quality(80).url();
        const blurHash = doc.mainImage.asset.blurHash;
        applyBlurToStaticImage('lore-image', imageUrl, blurHash);
    }

    const bodyContainer = container.querySelector('#lore-body');
    const hasContent = doc.body && doc.body.length > 0;

    if (paperWrapper) {
        if (hasContent) {
            paperWrapper.style.display = 'block';
            if (bodyContainer) {
                bodyContainer.innerHTML = DOMPurify.sanitize(toHTML(doc.body as unknown as import('@portabletext/types').TypedObject[], {
                    components: {
                        block: {
                            normal: ({ children }: { children?: string }) => `<p class="mb-6 leading-relaxed opacity-90">${children}</p>`,
                            blockquote: ({ children }: { children?: string }) => `<blockquote class="border-l-2 border-gold pl-4 italic my-4 text-gold/80">${children}</blockquote>`,
                            h3: ({ children }: { children?: string }) => `<h3 class="text-gold font-mono uppercase tracking-widest text-sm mt-8 mb-2 border-b border-gold/30 pb-1">${children}</h3>`
                        },
                        marks: {
                            redact: ({ children }: { children?: string }) => `<span class="bg-black text-black px-1 select-none hover:text-gray-300 transition-colors cursor-help" title="${i18next.t('lore_detail.classified_tooltip')}">${children}</span>`,
                            em: ({ children }: { children?: string }) => `<em class="text-gray-400">${children}</em>`
                        }
                    }
                }));
            }
        } else {
            paperWrapper.style.display = 'none';
        }
    }
};

const renderLoreIntel = (doc: LoreDocument, container: Element): void => {
    updateLoreText(doc, container);
    renderLoreTags(doc, container);

    const wrappers: LoreWrappers = {
        mediaContainer: container.querySelector('#lore-media-container'),
        imageWrapper: container.querySelector('#image-wrapper'),
        audioWrapper: container.querySelector('#audio-player-wrapper'),
        paperWrapper: container.querySelector('.paper-bg')
    };

    if (wrappers.mediaContainer) wrappers.mediaContainer.classList.add('hidden');
    if (wrappers.imageWrapper) wrappers.imageWrapper.classList.add('hidden');
    if (wrappers.audioWrapper) wrappers.audioWrapper.classList.add('hidden');
    if (wrappers.paperWrapper) wrappers.paperWrapper.style.display = 'block';

    if (doc.audioURL) {
        handleAudioMedia(doc, wrappers, container);
    }

    handleImageAndBody(doc, wrappers, container);

    setTimeout(() => {
        const loader = container.querySelector('#doc-loader');
        const content = container.querySelector('#doc-content');
        const sidebar = container.querySelector('#sidebar-content');

        if (loader) loader.classList.add('hidden');
        if (content) content.classList.remove('opacity-0');
        if (sidebar) sidebar.classList.remove('opacity-0');

        const tags = container.querySelectorAll('.gsap-tag');
        if (tags.length > 0) NoirEffects.staggerList(Array.from(tags));
    }, 800);
};

export default async function (container: Element | null, props: unknown): Promise<void> {
    if (!container) return;

    const params = new URLSearchParams(globalThis.location.search);
    const loreSlug = params.get('slug');

    if (!loreSlug) return;

    try {
        const lang = i18next.language || 'en';
        const titleField = lang === 'tr' ? 'title_tr' : 'title_en';
        const bodyField = lang === 'tr' ? 'content_tr' : 'content_en';

        const query = `*[_type == "lore" && slug.current == $slug][0]{
            _id,
            "title": coalesce(${titleField}, title_en),
            "body": coalesce(${bodyField}, content_en),
            "date": date,
            source,
            author,
            "audioURL": audioFile.asset->url,
            restricted,
            mainImage { asset->{ url, "blurHash": metadata.blurHash } },
            "relatedEntities": coalesce(relatedCharacters[]->{name, "title": name, "slug": slug.current, _type}, [])
                             + coalesce(relatedFactions[]->{"title": title, "slug": slug.current, _type}, [])
        }`;

        const loreDoc: LoreDocument | null = await client.fetch(query, { slug: loreSlug });

        if (loreDoc) {
            if (loreDoc.restricted && !auth.currentUser) {
                const loader = container.querySelector('#doc-loader');
                if (loader) {
                    loader.innerHTML = `
                        <div class="text-center space-y-4">
                            <i class="fas fa-lock text-4xl text-red-900 mb-4 animate-pulse"></i>
                            <h2 class="text-gold font-serif text-2xl uppercase tracking-widest">${i18next.t('lore_detail.restricted_title') || 'ACCESS DENIED'}</h2>
                            <p class="text-gray-400 font-mono text-xs max-w-xs mx-auto">${i18next.t('lore_detail.restricted_msg') || 'In-depth clearance is required to access this encrypted record.'}</p>
                            <a href="/pages/login.html" class="inline-block mt-4 border border-gold/50 px-6 py-2 text-gold hover:bg-gold hover:text-black transition-all font-mono text-[10px] uppercase tracking-widest">
                                ${i18next.t('auth.login') || 'Sign In'}
                            </a>
                        </div>
                    `;
                    const sidebar = container.querySelector('#sidebar-content') as HTMLElement | null;
                    if (sidebar) sidebar.style.display = 'none';
                }
                return;
            }
            const baseTitle = i18next.t('lore_detail.page_title') || "Evidence Record";
            document.title = `${loreDoc.title} | ${baseTitle}`;

            renderLoreIntel(loreDoc, container);
        } else {
            console.error("Doküman bulunamadı.");
            const loader = container.querySelector('#doc-loader');
            if (loader) loader.innerHTML = `<span class='text-red-500'>${i18next.t('lore_detail.error_not_found')}</span>`;
        }

    } catch (error: unknown) {
        console.error("Veri çekme hatası:", error);
        const loader = container.querySelector('#doc-loader');
        if (loader) loader.innerHTML = `<span class='text-red-500'>${i18next.t('lore_detail.error_system')}</span>`;
    }
}
