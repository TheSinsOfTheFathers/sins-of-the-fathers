/**
 * Çeviri fonksiyonu (t() helper)
 */
export function t(translations: any, key: string): string {
    const keys = key.split('.');
    let result = translations;

    for (const k of keys) {
        if (!result || typeof result !== 'object') {
            return key; 
        }
        result = result[k];
    }

    return typeof result === 'string' ? result : key;
}