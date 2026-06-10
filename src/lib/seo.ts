interface CharImage {
    url?: string;
}

interface CharFaction {
    title?: string;
}

interface Char {
    name: string;
    image?: CharImage;
    description?: string;
    faction?: CharFaction;
    role?: string;
}

interface LoreMainImageAsset {
    url?: string;
}

interface LoreMainImage {
    asset?: LoreMainImageAsset;
}

interface Lore {
    title: string;
    mainImage?: LoreMainImage;
    date?: string;
    author?: string;
}

export const injectSchema = (data: object): void => {
    const existingSchema = document.getElementById('dynamic-schema');
    if (existingSchema) existingSchema.remove();

    const script = document.createElement('script');
    script.id = 'dynamic-schema';
    script.type = 'application/ld+json';
    script.text = JSON.stringify(data);

    document.head.appendChild(script);
};

export const generateCharacterSchema = (char: Char): object => {
    return {
        "@context": "https://schema.org",
        "@type": "Person",
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

export const generateLoreSchema = (lore: Lore): object => {
    return {
        "@context": "https://schema.org",
        "@type": "Article",
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
                "url": globalThis.location.origin + "/assets/images/logo/logo.svg"
            }
        },
        "description": "Classified document retrieved from the archives.",
        "url": globalThis.location.href
    };
};
