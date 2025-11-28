import { client, urlFor } from '../../lib/sanityClient.js';
import { toHTML } from 'https://esm.sh/@portabletext/to-html@2.0.13';
import { renderBlurHash, applyBlurToStaticImage } from '../../lib/imageUtils.js';

/* --------------------------------------------------------------------------
   RENDER LOGIC (GÖRÜNTÜLEME MOTORU)
   -------------------------------------------------------------------------- */
const renderLoreIntel = (doc) => {
    
    // --- DEBUG ---
    console.log("🔥 RENDER BAŞLADI. Tür:", doc.audioURL ? "AUDIO" : "TEXT/IMAGE");

    // 1. METİN GÜNCELLEMELERİ
    const setText = (id, val) => {
        const el = document.getElementById(id);
        if(el) el.textContent = val || 'Unknown';
    };

    setText('lore-title', doc.title);
    setText('lore-id', `#${doc._id.slice(-6).toUpperCase()}`); 
    setText('lore-source', doc.source || 'Anonymous Source');
    
    if (document.getElementById('lore-date')) {
        const dateStr = doc.date 
            ? new Date(doc.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
            : 'Undated Record';
        document.getElementById('lore-date').textContent = dateStr;
    }

    setText('lore-author', doc.author || 'REDACTED');

    // 2. ETİKETLER
    const tagsContainer = document.getElementById('lore-tags');
    if (tagsContainer && doc.relatedEntities) {
        tagsContainer.innerHTML = doc.relatedEntities.map(ref => {
            const typeSlug = ref._type === 'character' ? 'character-detail' : 'faction-detail'; 
            return `
                <a href="${typeSlug}.html?slug=${ref.slug}" class="text-[10px] font-mono uppercase border border-gray-700 bg-white/5 px-2 py-1 hover:border-gold hover:text-gold transition text-gray-400">
                    #${ref.title || ref.name}
                </a>
            `;
        }).join('');
    } else if(tagsContainer) {
        tagsContainer.innerHTML = '<span class="text-[10px] text-gray-600 font-mono">// No associated links</span>';
    }

    // 3. MEDYA YÖNETİMİ
    const mediaContainer = document.getElementById('lore-media-container');
    const imageWrapper = document.getElementById('image-wrapper');
    const audioWrapper = document.getElementById('audio-player-wrapper');
    
    // Metin Alanının Kapsayıcısını Seç (Kağıt Görünümü)
    const paperWrapper = document.querySelector('.paper-bg'); 

    // Reset: Hepsini gizle
    if (mediaContainer) mediaContainer.classList.add('hidden');
    if (imageWrapper) imageWrapper.classList.add('hidden');
    if (audioWrapper) audioWrapper.classList.add('hidden');
    if (paperWrapper) paperWrapper.style.display = 'block'; // Varsayılan olarak göster

    // --- SENARYO A: SES DOSYASI VARSA ---
    if (doc.audioURL) {
        console.log("✅ Ses Modu: Metin alanı gizleniyor.");
        
        // 1. Oynatıcıyı Göster
        if (mediaContainer) mediaContainer.classList.remove('hidden');
        if (audioWrapper) {
            audioWrapper.classList.remove('hidden');
            
            // Audio Player Logic...
            const audio = document.getElementById('lore-audio-source');
            const playBtn = document.getElementById('audio-play-btn');
            const progressBar = document.getElementById('audio-progress-bar');
            const timeDisplay = document.getElementById('audio-current-time');
            const statusText = document.getElementById('audio-status-text');
            const progressContainer = document.getElementById('audio-progress-container');
            
            audio.src = doc.audioURL;
            audio.load();

            const togglePlay = () => {
                if (audio.paused) {
                    audio.play().catch(e => console.error(e));
                    playBtn.innerHTML = '<i class="fas fa-pause text-xl ml-0"></i>'; // Pause ikonu ortala
                    statusText.textContent = "PLAYING...";
                    statusText.classList.add("animate-pulse", "text-red-500");
                } else {
                    audio.pause();
                    playBtn.innerHTML = '<i class="fas fa-play text-xl ml-1"></i>';
                    statusText.textContent = "PAUSED";
                    statusText.classList.remove("animate-pulse", "text-red-500");
                }
            };
            
            const newPlayBtn = playBtn.cloneNode(true);
            playBtn.parentNode.replaceChild(newPlayBtn, playBtn);
            newPlayBtn.addEventListener('click', togglePlay);

            // Click to Seek
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
                statusText.textContent = "TRANSMISSION ENDED";
                statusText.classList.remove("animate-pulse", "text-red-500");
                progressBar.style.width = '0%';
            };
        }

        // 2. METİN ALANINI GİZLE (Kritik Değişiklik)
        if (paperWrapper) {
            paperWrapper.style.display = 'none';
        }

    } 
    // --- SENARYO B: SADECE RESİM VEYA METİN VARSA ---
    else {
        // 1. Resim Kontrolü
        if (doc.mainImage && doc.mainImage.asset) {
            if (mediaContainer) mediaContainer.classList.remove('hidden');
            if (imageWrapper) imageWrapper.classList.remove('hidden');
            
            const imageUrl = urlFor(doc.mainImage).width(800).quality(80).url();
            const blurHash = doc.mainImage.asset.blurHash;
            applyBlurToStaticImage('lore-image', imageUrl, blurHash);
        }

        // 2. İÇERİK (BODY) KONTROLÜ - KRİTİK GÜNCELLEME
        const bodyContainer = document.getElementById('lore-body');
        
        // İçerik var mı kontrol et (Sanity body array'i dolu mu?)
        const hasContent = doc.body && doc.body.length > 0;

        if (paperWrapper) {
            if (hasContent) {
                // İçerik VARSA kağıdı göster
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
                                redact: ({children}) => `<span class="bg-black text-black px-1 select-none hover:text-gray-300 transition-colors cursor-help" title="Classified Info">${children}</span>`,
                                em: ({children}) => `<em class="text-gray-400">${children}</em>`
                            }
                        }
                    });
                }
            } else {
                // İçerik YOKSA kağıdı GİZLE (Sadece fotoğraf kalsın)
                paperWrapper.style.display = 'none';
            }
        }
    }

    // Loader Kapat
    setTimeout(() => {
        const loader = document.getElementById('doc-loader');
        const content = document.getElementById('doc-content');
        if(loader) loader.classList.add('hidden');
        if(content) content.classList.remove('opacity-0');
    }, 800); 
};


export const loadLoreDetails = async () => {
    const container = document.getElementById('evidence-container'); 
    if (!container) return; 

    const params = new URLSearchParams(window.location.search);
    const loreSlug = params.get('slug');

    if (!loreSlug) return;

    try {
        console.log(`> Retrieving File: ${loreSlug}`);

        // --- DİKKAT: Query Kısmı ---
        // audioFile, audio, file veya sound olabilir. Bunu kontrol etmek için raw veriyi de çekelim.
        const query = `*[_type == "lore" && slug.current == $slug][0]{
            "title": title_en,
            "body": content_en,
            _id,
            "date": date,
            source,
            author,
            
            // ⚠️ BURASI ÖNEMLİ: Alan adınız 'audioFile' mı?
            // Değilse burayı 'audio.asset->url' veya 'file.asset->url' yapmalısınız.
            "audioURL": audioFile.asset->url, 

            mainImage {
                asset->{
                    url,
                    "blurHash": metadata.blurHash
                }
            },
            "relatedEntities": coalesce(relatedCharacters[]->{name, "title": name, "slug": slug.current, _type}, []) 
                             + coalesce(relatedFactions[]->{"title": title, "slug": slug.current, _type}, [])
        }`;
        
        const loreDoc = await client.fetch(query, { slug: loreSlug });

        if (loreDoc) {
            renderLoreIntel(loreDoc);
        } else {
            console.error("Doküman bulunamadı.");
        }

    } catch (error) {
        console.error("Veri çekme hatası:", error);
    }
};