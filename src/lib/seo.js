// lib/seo.js

/**
 * Sayfaya JSON-LD Schema verisini enjekte eder.
 * @param {Object} data - Schema verisi
 */
export const injectSchema = (data) => {
    // Varsa eski schemayı temizle (Tek sayfa uygulaması gibi davrandığımız için)
    const existingSchema = document.getElementById('dynamic-schema');
    if (existingSchema) existingSchema.remove();

    const script = document.createElement('script');
    script.id = 'dynamic-schema';
    script.type = 'application/ld+json';
    script.text = JSON.stringify(data);

    document.head.appendChild(script);
};

/**
 * Karakterler için Schema Şablonu
 */
export const generateCharacterSchema = (char) => {
    return {
        "@context": "https://schema.org",
        "@type": "Person", // veya "FictionalCharacter"
        "name": char.name,
        "image": char.image?.url,
        "description": char.description ? char.description.substring(0, 150) + "..." : "",
        "affiliation": {
            "@type": "Organization",
            "name": char.faction?.title || "Unknown"
        },
        "jobTitle": char.role || "Operative",
        "url": globalThis.location.href
    };
};

/**
 * Lore/Belgeler için Schema Şablonu
 */
export const generateLoreSchema = (lore) => {
    return {
        "@context": "https://schema.org",
        "@type": "Article", // Ses dosyasıysa "AudioObject" de eklenebilir
        "headline": lore.title,
        "image": lore.mainImage?.asset?.url ? [lore.mainImage.asset.url] : [],
        "datePublished": lore.date,
        "author": {
            "@type": "Person",
            "name": lore.author || "Unknown"
        },
        "publisher": {
            "@type": "Organization",
            "name": "The Sins of the Fathers Archive",
            "logo": {
                "@type": "ImageObject",
                "url": globalThis.location.origin + "/assets/images/logo/logo.svg" // Logonun tam yolu
            }
        },
        "description": "Classified document retrieved from the archives.",
        "url": globalThis.location.href
    };
};