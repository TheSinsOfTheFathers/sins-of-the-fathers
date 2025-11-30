/**
 * SITEMAP GENERATOR (Updated)
 * Sanity'den dinamik verileri çeker ve public/sitemap.xml oluşturur.
 * Çalıştırmak için: node scripts/generate-sitemap.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@sanity/client');
const builder = require('xmlbuilder');

// 1. SANITY AYARLARI
const client = createClient({
    projectId: '8cfeoaz2', // ⚠️ Burayı kendi Project ID'nizle değiştirmeyi unutmayın
    dataset: 'production',
    useCdn: true,
    apiVersion: '2023-05-03',
});

// Site ana adresi
const BASE_URL = 'https://thesinsofthefathers.com';

// 2. STATİK SAYFALAR (Tree çıktınıza göre güncellendi)
const staticPages = [
    '', // index.html
    '/pages/characters.html',
    '/pages/timeline.html',
    '/pages/factions.html',
    '/pages/locations.html',
    '/pages/lore.html',
    '/pages/login.html',
    '/pages/privacy.html',
    '/pages/terms.html',
    '/pages/profile.html' // 👈 EKLENDİ
];

async function generateSitemap() {
    console.log('🗺️  Sitemap generation started...');

    try {
        // 3. SANITY'DEN VERİLERİ ÇEK
        const query = `
            {
                "characters": *[_type == "character"] { "slug": slug.current, _updatedAt },
                "factions": *[_type == "faction"] { "slug": slug.current, _updatedAt },
                "locations": *[_type == "location"] { "slug": slug.current, _updatedAt },
                "lore": *[_type == "lore"] { "slug": slug.current, _updatedAt }
            }
        `;
        const data = await client.fetch(query);

        // 4. XML OLUŞTURMA
        const urlset = builder.create('urlset', { encoding: 'UTF-8' })
            .att('xmlns', 'http://www.sitemaps.org/schemas/sitemap/0.9');

        // A. Statik Sayfaları Ekle
        staticPages.forEach(page => {
            const url = urlset.ele('url');
            url.ele('loc', `${BASE_URL}${page}`);
            url.ele('changefreq', 'weekly');
            // Profil ve Login sayfalarının önceliğini düşük tutuyoruz
            const priority = (page.includes('profile') || page.includes('login')) ? '0.5' : '0.8';
            url.ele('priority', page === '' ? '1.0' : priority);
        });

        // B. Dinamik Karakterler
        data.characters.forEach(char => {
            if (char.slug) {
                const url = urlset.ele('url');
                url.ele('loc', `${BASE_URL}/pages/character-detail.html?slug=${char.slug}`);
                url.ele('lastmod', char._updatedAt.split('T')[0]);
                url.ele('priority', '0.7');
            }
        });

        // C. Dinamik Fraksiyonlar
        data.factions.forEach(faction => {
            if (faction.slug) {
                const url = urlset.ele('url');
                url.ele('loc', `${BASE_URL}/pages/faction-detail.html?slug=${faction.slug}`);
                url.ele('lastmod', faction._updatedAt.split('T')[0]);
                url.ele('priority', '0.7');
            }
        });

        // D. Dinamik Lokasyonlar
        data.locations.forEach(loc => {
            if (loc.slug) {
                const url = urlset.ele('url');
                url.ele('loc', `${BASE_URL}/pages/location-detail.html?slug=${loc.slug}`);
                url.ele('lastmod', loc._updatedAt.split('T')[0]);
                url.ele('priority', '0.6');
            }
        });

        // E. Dinamik Arşiv (Lore)
        data.lore.forEach(doc => {
            if (doc.slug) {
                const url = urlset.ele('url');
                url.ele('loc', `${BASE_URL}/pages/lore-detail.html?slug=${doc.slug}`);
                url.ele('lastmod', doc._updatedAt.split('T')[0]);
                url.ele('priority', '0.6');
            }
        });

        // 5. DOSYAYI KAYDET
        const xml = urlset.end({ pretty: true });
        const outputPath = path.resolve(__dirname, '../public/sitemap.xml');
        
        fs.writeFileSync(outputPath, xml);
        
        console.log(`✅ Sitemap generated successfully at: ${outputPath}`);
        console.log(`📊 Total URLs: ${staticPages.length + data.characters.length + data.factions.length + data.locations.length + data.lore.length}`);

    } catch (error) {
        console.error('❌ Sitemap generation failed:', error);
        process.exit(1);
    }
}

generateSitemap();