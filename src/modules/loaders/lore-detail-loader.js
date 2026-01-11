import { client, urlFor } from '../../lib/sanityClient.js';
import { toHTML } from 'https://esm.sh/@portabletext/to-html@2.0.13';
import { applyBlurToStaticImage } from '../../lib/imageUtils.js';
import i18next from '../../lib/i18n.js';
import { NoirEffects } from '../ui/noir-effects.js';

/* --------------------------------------------------------------------------
   RENDER LOGIC (GÖRÜNTÜLEME MOTORU)
   -------------------------------------------------------------------------- */
/* --------------------------------------------------------------------------
   HELPER FUNCTIONS (Cognitive Complexity Reduction)
   -------------------------------------------------------------------------- */

const updateLoreText = (doc, container) => {
    const setText = (id, val, fallbackKey) => {
        const el = container.querySelector('#' + id);
        if (el) el.textContent = val || (fallbackKey ? i18next.t(fallbackKey) : '');
    };

    setText('lore-title', doc.title);
    setText('lore-id', `#${doc._id.slice(-6).toUpperCase()}`);
    setText('lore-source', doc.source, 'lore_detail.unknown_source');

    const dateEl = container.querySelector('#lore-date');
    if (dateEl) {
        const dateStr = doc.date
            ? new Date(doc.date).toLocaleDateString(i18next.language, { year: 'numeric', month: 'short', day: 'numeric' })
            : i18next.t('lore_detail.undated');
        dateEl.textContent = dateStr;
    }

    setText('lore-author', doc.author, 'lore_detail.redacted');
};

const renderLoreTags = (doc, container) => {
    const tagsContainer = container.querySelector('#lore-tags');
    if (tagsContainer && doc.relatedEntities) {
        tagsContainer.innerHTML = doc.relatedEntities.map(ref => {
            const typeSlug = ref._type === 'character' ? 'character-detail' : 'faction-detail';
            return `
                <a href="${typeSlug}.html?slug=${ref.slug}" class="gsap-tag opacity-0 text-[10px] font-mono uppercase border border-gray-700 bg-white/5 px-2 py-1 hover:border-gold hover:text-gold transition text-gray-400">
                    #${ref.title || ref.name}
                </a>
            `;
        }).join('');
    } else if (tagsContainer) {
        tagsContainer.innerHTML = `<span class="text-[10px] text-gray-600 font-mono">${i18next.t('lore_detail.no_links')}</span>`;
    }
};

const handleAudioMedia = (doc, wrappers, container) => {
    const { mediaContainer, audioWrapper, paperWrapper } = wrappers;

    if (mediaContainer) mediaContainer.classList.remove('hidden');
    if (audioWrapper) {
        audioWrapper.classList.remove('hidden');

        const audio = container.querySelector('#lore-audio-source');
        const playBtn = container.querySelector('#audio-play-btn');
        const progressBar = container.querySelector('#audio-progress-bar');
        const timeDisplay = container.querySelector('#audio-current-time');
        const statusText = container.querySelector('#audio-status-text');
        const progressContainer = container.querySelector('#audio-progress-container');

        audio.src = doc.audioURL;
        audio.load();

        statusText.textContent = i18next.t('lore_detail.audio_standby');

        const togglePlay = () => {
            if (audio.paused) {
                audio.play().catch(e => console.error(e));
                playBtn.innerHTML = '<i class="fas fa-pause text-xl ml-0"></i>';
                statusText.textContent = i18next.t('lore_detail.audio_playing');
                statusText.classList.add("animate-pulse", "text-red-500");
            } else {
                audio.pause();
                playBtn.innerHTML = '<i class="fas fa-play text-xl ml-1"></i>';
                statusText.textContent = i18next.t('lore_detail.audio_paused');
                statusText.classList.remove("animate-pulse", "text-red-500");
            }
        };

        const newPlayBtn = playBtn.cloneNode(true);
        playBtn.parentNode.replaceChild(newPlayBtn, playBtn);
        newPlayBtn.addEventListener('click', togglePlay);

        if (progressContainer) {
            progressContainer.addEventListener('click', (e) => {
                const rect = progressContainer.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                if (audio.duration) audio.currentTime = percent * audio.duration;
            });
        }

        audio.ontimeupdate = () => {
            if (audio.duration) {
                const percent = (audio.currentTime / audio.duration) * 100;
                progressBar.style.width = `${percent}%`;
                const mins = Math.floor(audio.currentTime / 60);
                const secs = Math.floor(audio.currentTime % 60);
                timeDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            }
        };

        audio.onended = () => {
            newPlayBtn.innerHTML = '<i class="fas fa-play text-xl ml-1"></i>';
            statusText.textContent = i18next.t('lore_detail.audio_ended');
            statusText.classList.remove("animate-pulse", "text-red-500");
            progressBar.style.width = '0%';
        };
    }

    if (paperWrapper) {
        paperWrapper.style.display = 'none';
    }
};

const handleImageAndBody = (doc, wrappers, container) => {
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
                bodyContainer.innerHTML = toHTML(doc.body, {
                    components: {
                        block: {
                            normal: ({ children }) => `<p class="mb-6 leading-relaxed opacity-90">${children}</p>`,
                            blockquote: ({ children }) => `<blockquote class="border-l-2 border-gold pl-4 italic my-4 text-gold/80">${children}</blockquote>`,
                            h3: ({ children }) => `<h3 class="text-gold font-mono uppercase tracking-widest text-sm mt-8 mb-2 border-b border-gold/30 pb-1">${children}</h3>`
                        },
                        marks: {
                            redact: ({ children }) => `<span class="bg-black text-black px-1 select-none hover:text-gray-300 transition-colors cursor-help" title="${i18next.t('lore_detail.classified_tooltip')}">${children}</span>`,
                            em: ({ children }) => `<em class="text-gray-400">${children}</em>`
                        }
                    }
                });
            }
        } else {
            paperWrapper.style.display = 'none';
        }
    }
};

const renderLoreIntel = (doc, container) => {
    updateLoreText(doc, container);
    renderLoreTags(doc, container);

    const wrappers = {
        mediaContainer: container.querySelector('#lore-media-container'),
        imageWrapper: container.querySelector('#image-wrapper'),
        audioWrapper: container.querySelector('#audio-player-wrapper'),
        paperWrapper: container.querySelector('.paper-bg')
    };

    // Reset
    if (wrappers.mediaContainer) wrappers.mediaContainer.classList.add('hidden');
    if (wrappers.imageWrapper) wrappers.imageWrapper.classList.add('hidden');
    if (wrappers.audioWrapper) wrappers.audioWrapper.classList.add('hidden');
    if (wrappers.paperWrapper) wrappers.paperWrapper.style.display = 'block';

    if (doc.audioURL) {
        handleAudioMedia(doc, wrappers, container);
    } else {
        handleImageAndBody(doc, wrappers, container);
    }

    // Loader Kapat & Tags Animasyonu
    setTimeout(() => {
        const loader = container.querySelector('#doc-loader');
        const content = container.querySelector('#doc-content');
        if (loader) loader.classList.add('hidden');
        if (content) content.classList.remove('opacity-0');

        // Noir Motion: Tags
        const tags = container.querySelectorAll('.gsap-tag');
        if (tags.length > 0) NoirEffects.staggerList(tags);
    }, 800);
};


export default async function (container, props) {
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
            mainImage { asset->{ url, "blurHash": metadata.blurHash } },
            "relatedEntities": coalesce(relatedCharacters[]->{name, "title": name, "slug": slug.current, _type}, []) 
                             + coalesce(relatedFactions[]->{"title": title, "slug": slug.current, _type}, [])
        }`;

        const loreDoc = await client.fetch(query, { slug: loreSlug });

        if (loreDoc) {
            renderLoreIntel(loreDoc, container);
        } else {
            console.error("Doküman bulunamadı.");
            const loader = container.querySelector('#doc-loader');
            if (loader) loader.innerHTML = `<span class='text-red-500'>${i18next.t('lore_detail.error_not_found')}</span>`;
        }

    } catch (error) {
        console.error("Veri çekme hatası:", error);
        const loader = container.querySelector('#doc-loader');
        if (loader) loader.innerHTML = `<span class='text-red-500'>${i18next.t('lore_detail.error_system')}</span>`;
    }
};