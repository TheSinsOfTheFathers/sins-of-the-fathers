import { client, urlFor } from '../../lib/sanityClient.js';

/**
 * Veri Dönüştürücü: Sanity -> TimelineJS Formatı
 * Timeline.js events dizisi bekler: [{ start_date, text, media, group }]
 */
const transformDataForTimeline = (eras) => {
    const allEvents = [];

    // Title Slide (İsteğe bağlı, ana giriş kartı)
    // İsterseniz buraya statik bir giriş ekleyebiliriz, şimdilik event'lere odaklanalım.

    eras.forEach(era => {
        const groupName = era.title_en || 'Unknown Era'; // "Old World", "New Dynasty" vb.
        
        if (era.events && Array.isArray(era.events)) {
            era.events.forEach(evt => {
                // Tarih Çözümleme (YYYY-MM-DD veya sadece YYYY kabul eder)
                let dateObj = { year: '0000' }; // Fallback
                
                if (evt.date) {
                    // Tarih string ise parse et (YYYY-MM-DD)
                    const parts = evt.date.split('-');
                    dateObj = {
                        year: parts[0],
                        month: parts[1] || '',
                        day: parts[2] || ''
                    };
                }

                // Medya Hazırlığı
                let mediaObj = null;
                if (evt.image) {
                    mediaObj = {
                        url: urlFor(evt.image).url(),
                        caption: evt.caption || '',
                        credit: evt.credit || ''
                    };
                }

                // HTML İçerik Formatlama (Noir Theme Uyumlu)
                const formattedText = `
                    <div class="font-lato text-gray-400">
                        ${evt.text_en || ''}
                    </div>
                `;

                const formattedHeadline = `
                    <span class="text-gold font-serif tracking-wide uppercase">
                        ${evt.title_en || 'Untitled Event'}
                    </span>
                `;

                // Event Objesi
                allEvents.push({
                    start_date: dateObj,
                    // End date eklenebilir: end_date: ...
                    text: {
                        headline: formattedHeadline,
                        text: formattedText
                    },
                    media: mediaObj,
                    group: groupName // Bu alan, olayları satır satır ayırır (Old World / New World)
                });
            });
        }
    });

    return {
        title: {
            text: {
                headline: "<span class='font-serif text-white'>THE BALLANTINE <span class='text-gold'>CHRONICLES</span></span>",
                text: "<p class='text-gray-400 font-mono'>A visual record of blood, betrayal, and empire.</p>"
            },
            media: {
                url: "https://images.unsplash.com/photo-1533052379315-29e969401a49?q=80&w=2070&auto=format&fit=crop",
                caption: "Archives",
                credit: "System"
            }
        },
        events: allEvents 
    };
};

export async function displayTimeline() {
    // HTML'de tanımlı kapsayıcı (Embed ID'si timeline.html içinde farklı olabilir, dikkat)
    const embedId = 'timeline-embed';
    const embedEl = document.getElementById(embedId);
    const loaderEl = document.getElementById('timeline-loading');

    if (!embedEl) return; // Yanlış sayfadayız

    try {
        console.log("> Fetching Historical Data...");

        // GROQ Query: Dönemleri (Eras) ve içindeki Olayları (Events) çek
        // Sıralamayı 'order' alanına göre yapıyoruz.
        const query = `*[_type == "timelineEra"] | order(order asc) {
            title_en,
            "events": events[] {
                title_en,
                text_en,
                date,
                caption,
                credit,
                image
            }
        }`;

        const eras = await client.fetch(query);

        if (eras && eras.length > 0) {
            
            // Veriyi Dönüştür
            const timelineData = transformDataForTimeline(eras);

            // Konfigürasyon Seçenekleri (Opsiyonel)
            const options = {
                font: null, // Fontları CSS (timeline.html) üzerinden yönetiyoruz
                marker_height_min: 30,
                scale_factor: 2,
                initial_zoom: 2,
                timenav_position: 'bottom',
                optimal_tick_width: 100
            };

            // Timeline.js Başlatma (Global window.TL objesi kullanılır)
            if (window.TL) {
                window.timelineInstance = new TL.Timeline(embedId, timelineData, options);
                
                // Loader Kaldır (Kütüphanenin render süresi için küçük bir bekleme)
                if(loaderEl) {
                    setTimeout(() => loaderEl.style.display = 'none', 1500);
                }
            } else {
                throw new Error("TimelineJS library not loaded.");
            }

        } else {
            // Veri yoksa
            embedEl.innerHTML = `
                <div class="flex h-full items-center justify-center text-red-500 font-mono border border-red-900/30">
                    ARCHIVES EMPTY. NO RECORDS FOUND.
                </div>`;
            if(loaderEl) loaderEl.style.display = 'none';
        }

    } catch (error) {
        console.error("Timeline Malfunction:", error);
        if(loaderEl) loaderEl.innerHTML = "<span class='text-red-500'>DATA CORRUPTION DETECTED</span>";
        if(embedEl) embedEl.innerHTML = "<p class='text-center pt-20 text-red-800'>SYSTEM FAILURE</p>";
    }
}