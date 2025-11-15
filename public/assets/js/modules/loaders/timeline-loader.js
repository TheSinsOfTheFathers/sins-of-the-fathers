// assets/js/modules/displayTimeline.js

import { client } from '../../../../../lib/sanityClient.js'; // Sanity istemcisini import ediyoruz

/**
 * Bu render fonksiyonu, Firebase'den gelen veriyle aynı yapıda veri beklediği için
 * HİÇBİR DEĞİŞİKLİK GEREKTİRMEZ. Sadece veri kaynağı değişti.
 */
const renderTimeline = (sections) => {
    const timelineContainer = document.getElementById('timeline-container');
    if (!timelineContainer) return;

    timelineContainer.innerHTML = ''; // Placeholder'ı temizle
    const lang = localStorage.getItem('language') || 'tr';

    sections.forEach((section, index) => {
        const side = index % 2 === 0 ? 'left' : 'right';
        const sectionDiv = document.createElement('div');
        sectionDiv.className = `timeline-item ${side}`;
        sectionDiv.setAttribute('data-aos', `fade-${side === 'left' ? 'right' : 'left'}`);

        let eventsHtml = '';
        // Sanity'den gelen events dizisini işle
        if (section.events && Array.isArray(section.events)) {
            section.events.forEach(event => {
                // Dil seçimine göre doğru başlığı ve metni al
                const title = event[`title_${lang}`] || event.title_en;
                const text = event[`text_${lang}`] || event.text_en;
                eventsHtml += `
                    <h3>${title}</h3>
                    <p>${text}</p>
                `;
            });
        }
        
        // Dil seçimine göre doğru dönem başlığını al
        const sectionTitle = section[`title_${lang}`] || section.title_en;

        sectionDiv.innerHTML = `
            <div class="timeline-content">
                <h2>${sectionTitle}</h2>
                ${eventsHtml}
            </div>
        `;
        timelineContainer.appendChild(sectionDiv);
    });
};

/**
 * Zaman çizelgesi verilerini Firebase yerine Sanity.io'dan çeker ve gösterir.
 */
export async function displayTimeline() {
    const timelineContainer = document.getElementById('timeline-container');
    if (!timelineContainer) return;

    // Sanity'den veri çekmek için GROQ sorgusu
    // Tüm 'timelineEra' belgelerini getir ve 'order' alanına göre artan şekilde sırala
    const query = '*[_type == "timelineEra"] | order(order asc)';

    try {
        const sections = await client.fetch(query);
        renderTimeline(sections);
    } catch (error) {
        console.error("Error fetching timeline data from Sanity:", error);
        timelineContainer.innerHTML = '<p class="text-red-500 text-center">Failed to load timeline from Sanity. Please check the schema name is "timelineEra".</p>';
    }
}