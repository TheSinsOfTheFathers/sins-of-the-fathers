import i18next from 'i18next';
import i18nextHttpBackend from 'i18next-http-backend';
import i18nextBrowserLanguageDetector from 'i18next-browser-languagedetector';

export const updateContent = (): void => {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        let key = (el as HTMLElement).dataset.i18n as string;
        const options: Record<string, unknown> = {};

        if (key === 'footer.copyright') {
            options.year = new Date().getFullYear();
        }

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
            if ((el as HTMLElement).tagName === 'INPUT' || (el as HTMLElement).tagName === 'TEXTAREA') {
                if (el.hasAttribute('placeholder')) {
                    el.setAttribute('placeholder', translation);
                } else {
                    (el as HTMLInputElement | HTMLTextAreaElement).value = translation;
                }
            } else {
                (el as HTMLElement).innerHTML = translation;
            }
        } else {
            el.setAttribute(targetAttr, translation);
        }
    });
};

export const changeLanguage = async (lng: string): Promise<void> => {
    await i18next.changeLanguage(lng);
    updateContent();
    localStorage.setItem('i18nextLng', lng);

    document.documentElement.setAttribute('lang', lng);

    document.querySelectorAll('.lang-btn').forEach(btn => {
        if ((btn as HTMLElement).dataset.lang === lng) {
            btn.classList.add('text-white', 'font-bold', 'underline');
            btn.classList.remove('text-gray-200');
        } else {
            btn.classList.remove('text-white', 'font-bold', 'underline');
            btn.classList.add('text-gray-200');
        }
    });
};

export const initI18n = async (): Promise<string | undefined> => {
    try {
        await i18next
            .use(i18nextHttpBackend)
            .use(i18nextBrowserLanguageDetector)
            .init({
                fallbackLng: 'en',
                supportedLngs: ['en', 'tr'],
                load: 'languageOnly',
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

export { default } from 'i18next';
