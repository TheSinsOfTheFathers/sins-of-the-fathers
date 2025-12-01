import en from './locales/en/en.json'; // veya '../../locales/en/en.json'
import tr from './locales/tr/tr.json';

const translations = {
    en: en,
    tr: tr,
};

// Çeviri dosyalarını okuma bloğunu (try-catch) tamamen SİL.
// Çünkü import ettiğimizde veriler zaten hafızada hazır.

/**
 * Çeviri fonksiyonu (t() helper)
 */
export function t(lang: 'en' | 'tr', key: string): string {
    const keys = key.split('.');
    // TypeScript uyarısı alırsan buraya 'any' veya uygun tip ekleyebilirsin
    let result: any = translations[lang];

    for (const k of keys) {
        if (!result || typeof result !== 'object') {
            return key; 
        }
        result = result[k];
    }

    return typeof result === 'string' ? result : key;
}