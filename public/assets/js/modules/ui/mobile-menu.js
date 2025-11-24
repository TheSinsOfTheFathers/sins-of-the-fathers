/**
 * Mobil Navigasyon Kontrolcüsü
 * "System Override" Arayüzü için açılır/kapanır mantık
 */
export const initMobileMenu = () => {
    const menuButton = document.getElementById('hamburger-button');
    const mobileMenu = document.getElementById('mobile-menu');
    
    // Menü içindeki linkleri seç (Tıklanınca menüyü kapatmak için)
    const menuLinks = mobileMenu ? mobileMenu.querySelectorAll('a') : [];

    if (menuButton && mobileMenu) {
        
        const toggleMenu = () => {
            // 1. Görünürlük Durumu
            const isClosed = mobileMenu.classList.contains('hidden');
            
            if (isClosed) {
                // AÇILMA PROTOKOLÜ
                mobileMenu.classList.remove('hidden');
                mobileMenu.classList.add('flex'); // Flex layout'u koru
                
                // Buton Animasyonu için 'active' sınıfı ekle (CSS ile X şekline dönecek)
                menuButton.classList.add('active');
                menuButton.setAttribute('aria-expanded', 'true');
                
                // Arka planı kilitle
                document.body.style.overflow = 'hidden';
                
            } else {
                // KAPANMA PROTOKOLÜ
                mobileMenu.classList.add('hidden');
                mobileMenu.classList.remove('flex');
                
                // Butonu sıfırla
                menuButton.classList.remove('active');
                menuButton.setAttribute('aria-expanded', 'false');
                
                // Arka plan kilidini aç
                document.body.style.overflow = '';
            }
        };

        // Buton Tıklama Dinleyicisi
        menuButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Tıklamanın dışarı taşmasını engelle
            toggleMenu();
        });

        // Link Tıklama Dinleyicisi (UX: Bir yere gidince menüyü kapat)
        menuLinks.forEach(link => {
            link.addEventListener('click', () => {
                // Sadece menü açıksa kapatma işlemini yap
                if (!mobileMenu.classList.contains('hidden')) {
                    toggleMenu();
                }
            });
        });

        // İsteğe Bağlı: Menü açıkken "ESC" tuşuna basılırsa kapat
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !mobileMenu.classList.contains('hidden')) {
                toggleMenu();
            }
        });
    } else {
        console.warn('System UI Warning: Mobile navigation elements missing from DOM.');
    }
};