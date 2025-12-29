import i18next from 'https://esm.sh/i18next@23.7.6';
import i18nextHttpBackend from 'https://esm.sh/i18next-http-backend@2.4.1';
import i18nextBrowserLanguageDetector from 'https://esm.sh/i18next-browser-languagedetector@7.2.0';

/**
 * Sayfadaki tüm [data-i18n] elementlerini günceller.
 * Örn: <span data-i18n="nav.home"></span>
 */
export const updateContent = () => {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        let key = el.dataset.i18n;
        const options = {};

        // Handle specific keys with dynamic options
        if (key === 'footer.copyright') {
            options.year = new Date().getFullYear();
        }

        // Check for attribute targeting syntax: [placeholder]key
        let targetAttr = 'innerHTML';
        if (key.startsWith('[')) {
            const match = key.match(/^\[([^\]]+)\](.+)$/);
            if (match) {
                targetAttr = match[1];
                key = match[2];
            }
        }

        const translation = i18next.t(key, options);

        if (targetAttr === 'innerHTML') {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                // For inputs without specific targeting, generic fallback might be placeholder or value
                if (el.hasAttribute('placeholder')) {
                    el.setAttribute('placeholder', translation);
                } else {
                    el.value = translation;
                }
            } else {
                el.innerHTML = translation;
            }
        } else {
            el.setAttribute(targetAttr, translation);
        }
    });
};

/**
 * Dil Değiştirme Fonksiyonu
 * @param {string} lng - 'tr' veya 'en'
 */
export const changeLanguage = async (lng) => {
    await i18next.changeLanguage(lng);
    updateContent();
    localStorage.setItem('i18nextLng', lng);

    document.documentElement.setAttribute('lang', lng);

    document.querySelectorAll('.lang-btn').forEach(btn => {
        if (btn.dataset.lang === lng) {
            btn.classList.add('text-white', 'font-bold', 'underline');
            btn.classList.remove('text-gray-200');
        } else {
            btn.classList.remove('text-white', 'font-bold', 'underline');
            btn.classList.add('text-gray-200');
        }
    });
};

/**
 * Başlatıcı Fonksiyon
 */
export const initI18n = async () => {
    try {
        await i18next
            .use(i18nextHttpBackend)
            .use(i18nextBrowserLanguageDetector)
            .init({
                fallbackLng: 'en',
                debug: false,
                backend: {
                    loadPath: '/locales/{{lng}}/translation.json',
                },
                detection: {
                    order: ['querystring', 'localStorage', 'navigator'],
                    lookupQuerystring: 'lang',
                },
                interpolation: {
                    escapeValue: false
                }
            });

        updateContent();

        return i18next.language;

    } catch (err) {
        console.error('i18n Init Error:', err);
    }
};

export { default } from 'https://esm.sh/i18next@23.7.6';