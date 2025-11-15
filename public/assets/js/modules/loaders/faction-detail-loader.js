// 1. ADIM: Gerekli kütüphaneleri ve Sanity istemcisini import et
import { client } from '../../../../../lib/sanityClient.js';
import { toHTML } from 'https://esm.sh/@portabletext/to-html@2.0.13'; // Zengin metni HTML'e çevirmek için

/**
 * Sanity'den gelen fraksiyon verisini alıp sayfadaki HTML'i günceller.
 * @param {object} faction - Sanity'den çekilen ve tüm alanları içeren fraksiyon objesi.
 */
const renderFactionDetails = (faction) => {
    const contentDiv = document.getElementById('faction-detail-content');
    
    // Sayfa başlığını ve meta açıklamasını dinamik olarak güncelle (SEO için kritik)
    document.title = `${faction.name} - The Sins of the Fathers`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
        // Meta açıklama için özel olarak oluşturduğumuz 'summary' alanını kullanıyoruz.
        metaDesc.setAttribute('content', faction.summary || `Explore the details of the ${faction.name} faction.`);
    }

    // Sanity'nin zengin metin ('history') alanını güvenli bir şekilde HTML'e çevir
    const historyHtml = faction.history 
        ? toHTML(faction.history) 
        : '<p>No detailed history available for this faction.</p>';

    // Ana HTML içeriğini oluştur ve sayfaya yerleştir
    contentDiv.innerHTML = `
        <div class="animate-fade-in">
            <h1 class="text-5xl lg:text-6xl font-serif text-yellow-500 mb-4">${faction.name}</h1>
            <p class="text-xl text-neutral-400 italic mb-8">"${faction.motto || ''}"</p>

            <div class="faction-detail-card">
                <div class="faction-meta">
                    <strong>Leader:</strong> <span>${faction.leaderName || 'Unknown'}</span>
                </div>
                <div class="faction-meta">
                    <strong>Philosophy:</strong> <span>${faction.philosophy || 'Not defined'}</span>
                </div>
                <div class="faction-meta">
                    <strong>Economic Domain:</strong> <span>${faction.economy || 'Not defined'}</span>
                </div>
            </div>

            <div class="prose prose-invert max-w-none text-neutral-300 mt-8">
                ${historyHtml}
            </div>
        </div>
    `;
};

/**
 * Sayfa yüklendiğinde URL'den slug'ı alarak ilgili fraksiyonun verilerini Sanity'den çeker.
 */
export const loadFactionDetails = async () => {
    const contentDiv = document.getElementById('faction-detail-content');
    if (!contentDiv) {
        console.error('Target content element "faction-detail-content" not found.');
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const factionSlug = params.get('slug'); // ID yerine SEO dostu 'slug' kullanıyoruz

    if (!factionSlug) {
        contentDiv.innerHTML = '<p class="text-red-500 text-center">No faction specified in the URL.</p>';
        return;
    }

    // 2. ADIM: Sanity'den veri çekmek için GROQ sorgusu
    // Bu sorgu, ihtiyacımız olan tüm alanları ve liderin adını tek seferde getirir.
    const query = `*[_type == "faction" && slug.current == $slug][0]{
        name,
        motto,
        philosophy,
        economy,
        summary,
        history,
        "leaderName": leader->name 
    }`;
    const queryParams = { slug: factionSlug };

    try {
        const faction = await client.fetch(query, queryParams);

        if (faction) {
            renderFactionDetails(faction);
        } else {
            contentDiv.innerHTML = '<p class="text-red-500 text-center">Faction not found.</p>';
            document.title = 'Faction Not Found - The Sins of the Fathers';
        }
    } catch (error) {
        console.error("Error fetching faction details from Sanity:", error);
        contentDiv.innerHTML = '<p class="text-red-500 text-center">Failed to load faction details. Please try again later.</p>';
    }
};