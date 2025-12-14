import { client, urlFor } from '../../lib/sanityClient.js';
import i18next from '../../lib/i18n.js';
// 👇 SEO İMPORTU
import { injectSchema } from '../../lib/seo.js';

// 👇 1. GSAP IMPORT
import gsap from 'gsap';

/**
 * Veri Dönüştürücü: Sanity -> TimelineJS Formatı
 * Timeline.js events dizisi bekler: [{ start_date, text, media, group }]
 */
const transformDataForTimeline = (eras) => {
    const allEvents = [];

    eras.forEach(era => {
        const groupName = era.title_en || i18next.t('timeline_loader.unknown_era');

        if (era.events && Array.isArray(era.events)) {
            era.events.forEach(evt => {
                let dateObj = { year: '0000' };

                if (evt.date) {
                    const parts = evt.date.split('-');
                    dateObj = {
                        year: parts[0],
                        month: parts[1] || '',
                        day: parts[2] || ''
                    };
                }

                let mediaObj = null;
                if (evt.image) {
                    mediaObj = {
                        url: urlFor(evt.image).url(),
                        caption: evt.caption || '',
                        credit: evt.credit || ''
                    };
                }

                const formattedText = `
                    <div class="font-lato text-gray-400">
                        ${evt.text_en || ''}
                    </div>
                `;

                const formattedHeadline = `
                    <span class="text-gold font-serif tracking-wide uppercase">
                        ${evt.title_en || i18next.t('timeline_loader.untitled_event')}
                    </span>
                `;

                allEvents.push({
                    start_date: dateObj,
                    text: {
                        headline: formattedHeadline,
                        text: formattedText
                    },
                    media: mediaObj,
                    group: groupName,
                    _raw_date: evt.date
                });
            });
        }
    });

    return {
        title: {
            text: {
                headline: i18next.t('timeline_loader.title_headline'),
                text: i18next.t('timeline_loader.title_text')
            },
            media: {
                url: "https://images.unsplash.com/photo-1533052379315-29e969401a49?q=80&w=2070&auto.format&fit=crop",
                caption: i18next.t('timeline_loader.title_media_caption'),
                credit: i18next.t('timeline_loader.title_media_credit')
            }
        },
        events: allEvents
    };
};

/* --------------------------------------------------------------------------
   HELPER FUNCTIONS (Cognitive Complexity Reduction)
   -------------------------------------------------------------------------- */

const injectTimelineSeo = (timelineData) => {
    try {
        const itemList = timelineData.events.map((evt, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "item": {
                "@type": "Event",
                "name": evt.text.headline.replaceAll(/<[^>]*>/g, '').trim(),
                "description": evt.text.text.replaceAll(/<[^>]*>/g, '').trim(),
                "startDate": evt._raw_date,
                "image": evt.media?.url
            }
        }));

        const schemaData = {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": i18next.t('timeline_loader.meta_title'),
            "description": i18next.t('timeline_loader.title_text').replaceAll(/<[^>]*>/g, '').trim(),
            "mainEntity": {
                "@type": "ItemList",
                "itemListElement": itemList
            }
        };
        injectSchema(schemaData);
        console.log("> SEO Protocol: Timeline Schema Injected.");
    } catch (e) {
        console.warn("Schema Error:", e);
    }
};

const initializeTimeline = (embedId, timelineData, lang, loaderEl) => {
    const options = {
        font: null,
        marker_height_min: 30,
        scale_factor: 2,
        initial_zoom: 2,
        timenav_position: 'bottom',
        optimal_tick_width: 100,
        lang: lang
    };

    if (globalThis.TL) {
        globalThis.timelineInstance = new TL.Timeline(embedId, timelineData, options);

        if (loaderEl) {
            setTimeout(() => loaderEl.style.display = 'none', 1500);
        }
    } else {
        throw new Error("TimelineJS library not loaded.");
    }
};

export async function displayTimeline() {
    const embedId = 'timeline-embed';
    const embedEl = document.getElementById(embedId);
    const loaderEl = document.getElementById('timeline-loading');
    const lang = i18next.language.startsWith('tr') ? 'tr' : 'en';

    if (!embedEl) return;

    try {
        console.log("> Fetching Historical Data...");

        const query = `*[_type == "timelineEra"] | order(order asc) {
            title_en,
            "events": events[] {
                title_en,
                text_en,
                date,
                caption,
                credit,
                image {
                    asset->{
                        url,
                        "blurHash": metadata.blurHash
                    }
                }
            }
        }`;

        const eras = await client.fetch(query);

        if (eras && eras.length > 0) {

            const timelineData = transformDataForTimeline(eras);

            // 👇 SEO SCHEMA ENJEKSİYONU (Helper Function)
            injectTimelineSeo(timelineData);
            // -----------------------------------------------------

            initializeTimeline(embedId, timelineData, lang, loaderEl);

        } else {
            if (loaderEl) loaderEl.style.display = 'none';
            embedEl.innerHTML = `
                <div class="flex h-full items-center justify-center text-red-500 font-mono border border-red-900/30">
                    ${i18next.t('timeline_loader.archives_empty')}
                </div>`;
            if (loaderEl) loaderEl.style.display = 'none';
        }

    } catch (error) {
        console.error("Timeline Malfunction:", error);
        if (loaderEl) loaderEl.innerHTML = `<span class='text-red-500'>${i18next.t('timeline_loader.data_corruption')}</span>`;
        if (embedEl) embedEl.innerHTML = `<p class='text-center pt-20 text-red-800'>${i18next.t('timeline_loader.system_failure')}</p>`;
    }
}