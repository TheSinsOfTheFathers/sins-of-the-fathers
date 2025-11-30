import { client, urlFor } from '../../lib/sanityClient.js';
import { toHTML } from 'https://esm.sh/@portabletext/to-html@2.0.13';
import { renderBlurHash, applyBlurToStaticImage } from '../../lib/imageUtils.js';
import i18next from '../../lib/i18n.js';
import { injectSchema } from '../../lib/seo.js';

// 👇 1. GSAP IMPORT
import gsap from 'gsap';

/* --------------------------------------------------------------------------
   HELPER: SCRAMBLE TEXT (ŞİFRE ÇÖZME EFEKTİ)
   -------------------------------------------------------------------------- */
const animateScramble = (element, finalText, duration = 1) => {
    if (!element) return;
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&";
    const originalText = finalText || element.textContent;
    const length = originalText.length;
    
    let obj = { value: 0 };
    
    gsap.to(obj, {
        value: 1,
        duration: duration,
        ease: "none",
        onUpdate: () => {
            const progress = Math.floor(obj.value * length);
            let result = "";
            for (let i = 0; i < length; i++) {
                if (i < progress) {
                    result += originalText[i];
                } else {
                    result += chars[Math.floor(Math.random() * chars.length)];
                }
            }
            element.textContent = result;
        },
        onComplete: () => {
            element.textContent = originalText;
        }
    });
};

/* --------------------------------------------------------------------------
   YARDIMCI: STATİK HTML ÇEVİRİSİ
   -------------------------------------------------------------------------- */
const updateStaticTranslations = () => {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const translation = i18next.t(key);
        if (translation) el.textContent = translation;
    });
};

/* --------------------------------------------------------------------------
   RENDER LOGIC (GÖRÜNTÜLEME MOTORU)
   -------------------------------------------------------------------------- */
const renderLoreIntel = (doc) => {
    
    // 1. METİN GÜNCELLEMELERİ
    const setText = (id, val, fallbackKey) => {
        const el = document.getElementById(id);
        if(el) el.textContent = val || (fallbackKey ? i18next.t(fallbackKey) : '');
    };

    setText('lore-title', doc.title);
    
    const docId = `#${doc._id.slice(-6).toUpperCase()}`;
    // ID'yi direkt yazmak yerine aşağıda animasyonla yazacağız, şimdilik boş bırakabiliriz veya placeholder koyabiliriz.
    setText('lore-id', '#######'); 

    setText('lore-source', doc.source, 'lore_detail.unknown_source');
    
    if (document.getElementById('lore-date')) {
        const dateStr = doc.date 
            ? new Date(doc.date).toLocaleDateString(i18next.language, { year: 'numeric', month: 'short', day: 'numeric' })
            : i18next.t('lore_detail.undated');
        document.getElementById('lore-date').textContent = dateStr;
    }

    setText('lore-author', doc.author, 'lore_detail.redacted');

    // 2. ETİKETLER
    const tagsContainer = document.getElementById('lore-tags');
    if (tagsContainer && doc.relatedEntities) {
        tagsContainer.innerHTML = doc.relatedEntities.map(ref => {
            const typeSlug = ref._type === 'character' ? 'character-detail' : 'faction-detail'; 
            // class'a 'gsap-tag' ve 'opacity-0' ekledim
            return `
                <a href="${typeSlug}.html?slug=${ref.slug}" class="gsap-tag opacity-0 text-[10px] font-mono uppercase border border-gray-700 bg-white/5 px-2 py-1 hover:border-gold hover:text-gold transition text-gray-400">
                    #${ref.title || ref.name}
                </a>
            `;
        }).join('');
    } else if(tagsContainer) {
        tagsContainer.innerHTML = `<span class="text-[10px] text-gray-600 font-mono">${i18next.t('lore_detail.no_links')}</span>`;
    }

    // 3. MEDYA YÖNETİMİ
    const mediaContainer = document.getElementById('lore-media-container');
    const imageWrapper = document.getElementById('image-wrapper');
    const audioWrapper = document.getElementById('audio-player-wrapper');
    const paperWrapper = document.querySelector('.paper-bg'); 

    // Reset Classes
    if (mediaContainer) mediaContainer.classList.add('hidden');
    if (imageWrapper) imageWrapper.classList.add('hidden');
    if (audioWrapper) audioWrapper.classList.add('hidden');
    if (paperWrapper) paperWrapper.style.display = 'block';

    // --- SENARYO A: SES DOSYASI VARSA ---
    if (doc.audioURL) {
        if (mediaContainer) mediaContainer.classList.remove('hidden');
        if (audioWrapper) {
            audioWrapper.classList.remove('hidden');
            
            const audio = document.getElementById('lore-audio-source');
            const playBtn = document.getElementById('audio-play-btn');
            const progressBar = document.getElementById('audio-progress-bar');
            const timeDisplay = document.getElementById('audio-current-time');
            const statusText = document.getElementById('audio-status-text');
            const progressContainer = document.getElementById('audio-progress-container');
            
            audio.src = doc.audioURL;
            audio.load();

            statusText.textContent = i18next.t('lore_detail.audio_standby');

            const togglePlay = () => {
                if (audio.paused) {
                    audio.play().catch(e => console.error(e));
                    playBtn.innerHTML = '<i class="fas fa-pause text-xl ml-0"></i>';
                    statusText.textContent = i18next.t('lore_detail.audio_playing');
                    statusText.classList.add("animate-pulse", "text-red-500");
                    
                    // GSAP: Equalizer efekti veya oynuyor hissi
                    gsap.to(playBtn, { scale: 0.9, duration: 0.1, yoyo: true, repeat: 1 });
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

        if (paperWrapper && !doc.body) {
            paperWrapper.style.display = 'none';
        }

    } 
    // --- SENARYO B: RESİM/METİN ---
    else {
        if (doc.mainImage && doc.mainImage.asset) {
            if (mediaContainer) mediaContainer.classList.remove('hidden');
            if (imageWrapper) imageWrapper.classList.remove('hidden');
            
            const imageUrl = urlFor(doc.mainImage).width(800).quality(80).url();
            const blurHash = doc.mainImage.asset.blurHash;
            applyBlurToStaticImage('lore-image', imageUrl, blurHash);
        }

        const bodyContainer = document.getElementById('lore-body');
        const hasContent = doc.body && doc.body.length > 0;

        if (paperWrapper) {
            if (hasContent) {
                paperWrapper.style.display = 'block';
                if (bodyContainer) {
                    bodyContainer.innerHTML = toHTML(doc.body, {
                        components: {
                            block: {
                                normal: ({children}) => `<p class="mb-6 leading-relaxed opacity-90">${children}</p>`,
                                blockquote: ({children}) => `<blockquote class="border-l-2 border-gold pl-4 italic my-4 text-gold/80">${children}</blockquote>`,
                                h3: ({children}) => `<h3 class="text-gold font-mono uppercase tracking-widest text-sm mt-8 mb-2 border-b border-gold/30 pb-1">${children}</h3>`
                            },
                            marks: {
                                redact: ({children}) => `<span class="bg-black text-black px-1 select-none hover:text-gray-300 transition-colors cursor-help" title="${i18next.t('lore_detail.classified_tooltip')}">${children}</span>`,
                                em: ({children}) => `<em class="text-gray-400">${children}</em>`
                            }
                        }
                    });
                }
            } else {
                paperWrapper.style.display = 'none';
            }
        }
    }

    // ÖNEMLİ: Çevirileri güncelle
    updateStaticTranslations();

    // 👇 2. GSAP REVEAL ANIMATION (Eski setTimeout yerine)
    // -----------------------------------------------------------------------
    const loader = document.getElementById('doc-loader');
    const content = document.getElementById('doc-content');
    
    // GSAP Timeline
    const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

    // A. Loader Out
    if(loader) tl.to(loader, { autoAlpha: 0, duration: 0.5 });
    
    // B. Content In (Hemen ardından)
    if(content) {
        tl.to(content, { autoAlpha: 1, duration: 0.5 }, "-=0.3");
        content.classList.remove('opacity-0'); // CSS class'ını temizle
    }

    // C. Başlık ve ID Animasyonu
    const titleEl = document.getElementById('lore-title');
    const idEl = document.getElementById('lore-id');
    const metaEl = document.getElementById('lore-meta'); // Tarih, Yazar vb. kapsayıcısı

    if(titleEl) {
        tl.from(titleEl, { y: -20, opacity: 0, duration: 0.8 }, "-=0.2");
    }
    
    // ID Scramble Effect
    if(idEl) {
        tl.add(() => animateScramble(idEl, docId, 1.0), "-=0.6");
    }

    // D. Metadata (Yazar, Kaynak) soldan gelir
    if(metaEl) {
        tl.from(metaEl, { x: -20, opacity: 0, duration: 0.6 }, "-=0.8");
    }

    // E. Etiketler (Tags) sırayla gelir
    const tags = document.querySelectorAll('.gsap-tag');
    if(tags.length > 0) {
        tl.to(tags, {
            opacity: 1,
            y: 0,
            duration: 0.4,
            stagger: 0.05,
            startAt: { y: 10 }
        }, "-=0.5");
    }

    // F. Medya (Audio veya Resim)
    if (mediaContainer && !mediaContainer.classList.contains('hidden')) {
        // Audio ise yukarıdan iner
        if (doc.audioURL) {
            tl.from(audioWrapper, { y: -30, opacity: 0, duration: 0.8, ease: "back.out(1.2)" }, "-=0.4");
        } 
        // Resim ise bulanıktan netleşir
        else {
            const img = document.getElementById('lore-image');
            if(img) tl.from(img, { scale: 1.05, filter: "blur(10px)", duration: 1.2 }, "-=0.4");
        }
    }

    // G. Kağıt/Belge Metni (Masaya sürülme efekti)
    if (paperWrapper && paperWrapper.style.display !== 'none') {
        tl.from(paperWrapper, {
            y: 50,
            opacity: 0,
            duration: 1.0,
            ease: "power3.out"
        }, "-=0.6"); // Diğerleriyle biraz örtüşerek başla
    }

    // H. Redacted (Gizlenmiş) metinler varsa onlara dikkat çek
    const redactedItems = document.querySelectorAll('.bg-black.text-black');
    if(redactedItems.length > 0) {
        gsap.to(redactedItems, {
            backgroundColor: "#222", // Hafifçe grileşip
            duration: 0.5,
            repeat: 1,
            yoyo: true,
            delay: 1.5, // En sonda çalışsın
            ease: "sine.inOut",
            onComplete: () => gsap.set(redactedItems, { backgroundColor: "black" }) // Siyaha dön
        });
    }
};


export const loadLoreDetails = async () => {
    const container = document.getElementById('evidence-container'); 
    
    // FOUC Önleme: Konteyneri gizle
    if (container) {
        // İçerik kısmını gizle, loader kalsın
        const content = document.getElementById('doc-content');
        if(content) gsap.set(content, { autoAlpha: 0 });
    }

    // i18next kontrolü
    if (i18next.isInitialized) {
        updateStaticTranslations();
    } else {
        i18next.on('initialized', () => {
            updateStaticTranslations();
        });
    }

    const params = new URLSearchParams(window.location.search);
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
            renderLoreIntel(loreDoc);
        } else {
            console.error("Doküman bulunamadı.");
            const loader = document.getElementById('doc-loader');
            if(loader) loader.innerHTML = `<span class='text-red-500'>${i18next.t('lore_detail.error_not_found')}</span>`;
        }

    } catch (error) {
        console.error("Veri çekme hatası:", error);
        const loader = document.getElementById('doc-loader');
        if(loader) loader.innerHTML = `<span class='text-red-500'>${i18next.t('lore_detail.error_system')}</span>`;
    }
};