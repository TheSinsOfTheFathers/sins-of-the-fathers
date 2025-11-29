import i18next from 'https://esm.sh/i18next@23.7.6';
import i18nextHttpBackend from 'https://esm.sh/i18next-http-backend@2.4.1';
import i18nextBrowserLanguageDetector from 'https://esm.sh/i18next-browser-languagedetector@7.2.0';

/**
 * Sayfadaki tüm [data-i18n] elementlerini günceller.
 * Örn: <span data-i18n="nav.home"></span>
 */
export const updateContent = () => {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const options = {};

        // Anahtara özel değişkenleri (interpolation) yönet
        if (key === 'footer.copyright') {
            options.year = new Date().getFullYear();
        }
        
        // Çeviriyi al
        const translation = i18next.t(key, options);
        
        // Eğer HTML içeriği varsa (örn: <b>Bold</b>) html olarak, yoksa text olarak bas
        el.innerHTML = translation; 
        
        // Eğer input ise placeholder'ı güncelle
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
    localStorage.setItem('i18nextLng', lng); // Tercihi hatırla
    
    // Dil butonlarını güncelle (Aktif olanı parlat)
    document.querySelectorAll('.lang-btn').forEach(btn => {
        if(btn.dataset.lang === lng) {
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
            .use(i18nextHttpBackend) // JSON dosyalarını yüklemek için
            .use(i18nextBrowserLanguageDetector) // Tarayıcı dilini anlamak için
                    .init({
                        fallbackLng: 'en',
                        debug: false, // Konsol kirliliğini önlemek için false yapabilirsin
                        backend: {
                            // loadPath must be resolvable from the page (not the module file).
                            // Compute a sensible base so it works both when serving project
                            // root and when previewing `/public/index.html` (live-server).
                            loadPath: (function(){
                                const path = window.location.pathname || '/';
                                // If URL contains /public/ (live-server preview), use /public/locales
                                if (path.indexOf('/public/') === 0 || path.includes('/public/')) {
                                    return '/public/locales/{{lng}}/translation.json';
                                }
                                // Otherwise assume locales are available under /locales at site root
                                return '/locales/{{lng}}/translation.json';
                            })(),
                        },
                detection: {
                    order: ['querystring', 'localStorage', 'navigator'],
                    lookupQuerystring: 'lang',
                },
                interpolation: {
                    escapeValue: false // Do not escape HTML values
                }
            });

        // İlk yükleme
        updateContent();
        
        // Mevcut dili dön (UI güncellemesi için)
        return i18next.language;

    } catch (err) {
        console.error('i18n Init Error:', err);
    }
};

// i18next instance'ını dışarı açıyoruz (Gerekirse başka yerden erişmek için)
export default i18next;