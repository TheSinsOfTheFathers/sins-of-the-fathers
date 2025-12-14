import i18next from 'https://esm.sh/i18next@23.7.6';
import i18nextHttpBackend from 'https://esm.sh/i18next-http-backend@2.4.1';
import i18nextBrowserLanguageDetector from 'https://esm.sh/i18next-browser-languagedetector@7.2.0';

/**
 * Sayfadaki tüm [data-i18n] elementlerini günceller.
 * Örn: <span data-i18n="nav.home"></span>
 */
export const updateContent = () => {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        const options = {};

        if (key === 'footer.copyright') {
            options.year = new Date().getFullYear();
        }

        const translation = i18next.t(key, options);

        el.innerHTML = translation;

        if (el.tagName === 'INPUT' && el.getAttribute('placeholder')) {
            el.setAttribute('placeholder', translation);
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

    document.querySelectorAll('.lang-btn').forEach(btn => {
        if (btn.dataset.lang === lng) {
            btn.classList.add('text-white', 'font-bold', 'underline');
            btn.classList.remove('text-gray-500');
        } else {
            btn.classList.remove('text-white', 'font-bold', 'underline');
            btn.classList.add('text-gray-500');
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