import i18next from '../../lib/i18n.js';
import gsap from 'gsap';

export const initCookieConsent = () => {
    // Daha önce karar verildiyse tekrar sorma
    if (localStorage.getItem('tsof_cookie_consent')) return;

    // Eğer popup zaten varsa tekrar oluşturma (Dil değişimi sırasında duplicate olmasın)
    if (document.getElementById('cookie-popup')) return;

    const consentHTML = `
        <div id="cookie-popup" class="fixed bottom-0 right-0 m-4 md:m-8 max-w-sm w-full bg-obsidian border border-gold/30 shadow-[0_0_30px_rgba(0,0,0,0.8)] z-50 p-6 opacity-0 transform translate-y-10 backdrop-blur-md">
            <div class="absolute top-0 left-0 w-2 h-2 border-t border-l border-gold"></div>
            <div class="absolute top-0 right-0 w-2 h-2 border-t border-r border-gold"></div>
            <div class="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-gold"></div>
            <div class="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-gold"></div>

            <div class="flex items-start gap-4">
                <div class="text-gold text-2xl mt-1">
                    <i class="fas fa-shield-alt animate-pulse"></i>
                </div>
                <div>
                    <h4 class="text-gold font-serif text-sm uppercase tracking-widest mb-2 border-b border-white/10 pb-1" data-i18n="cookie_consent.title">
                        ${i18next.t('cookie_consent.title')}
                    </h4>
                    <p class="text-gray-400 font-mono text-[10px] leading-relaxed mb-4">
                        <span data-i18n="cookie_consent.text">${i18next.t('cookie_consent.text')}</span>
                        <a href="/pages/privacy.html" class="text-white underline hover:text-gold ml-1 transition-colors" data-i18n="cookie_consent.policy_link">${i18next.t('cookie_consent.policy_link')}</a>.
                    </p>
                    
                    <div class="flex gap-3">
                        <button id="btn-accept-cookies" class="flex-1 bg-gold/10 border border-gold text-gold hover:bg-gold hover:text-black text-[10px] font-bold uppercase py-2 tracking-wider transition-all" data-i18n="cookie_consent.accept">
                            ${i18next.t('cookie_consent.accept')}
                        </button>
                        <button id="btn-decline-cookies" class="flex-1 border border-white/20 text-gray-200 hover:text-white hover:border-white text-[10px] font-bold uppercase py-2 tracking-wider transition-all" data-i18n="cookie_consent.decline">
                            ${i18next.t('cookie_consent.decline')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', consentHTML);

    const popup = document.getElementById('cookie-popup');
    const btnAccept = document.getElementById('btn-accept-cookies');
    const btnDecline = document.getElementById('btn-decline-cookies');

    gsap.to(popup, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        delay: 2.5, 
        ease: "power3.out"
    });

    const closePopup = (consentStatus) => {
        localStorage.setItem('tsof_cookie_consent', consentStatus);
        
        gsap.to(popup, {
            opacity: 0,
            y: 20,
            duration: 0.5,
            ease: "power2.in",
            onComplete: () => popup.remove()
        });

        if (consentStatus === 'accepted') {
            console.log(" > System: Tracking Authorized.");
            // 👇 YENİ EKLENEN KISIM: Main.js'deki fonksiyonu tetikle ve Sentry'i başlat
            if (window.enableTrackingSystem) {
                window.enableTrackingSystem();
            }
        } else {
            console.log(" > System: Tracking Denied.");
        }
    };

    btnAccept.addEventListener('click', () => closePopup('accepted'));
    btnDecline.addEventListener('click', () => closePopup('declined'));
};