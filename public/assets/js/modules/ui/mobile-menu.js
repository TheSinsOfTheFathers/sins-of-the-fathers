/**
 * Mobil Navigasyon Kontrolcüsü
 * "System Override" Arayüzü için açılır/kapanır mantık
 */
export const initMobileMenu = () => {
    const menuButton = document.getElementById('hamburger-button');
    const mobileMenu = document.getElementById('mobile-menu');
    
    const menuLinks = mobileMenu ? mobileMenu.querySelectorAll('a') : [];

    if (menuButton && mobileMenu) {
        
        const toggleMenu = () => {
            const isClosed = mobileMenu.classList.contains('hidden');
            
            if (isClosed) {
                mobileMenu.classList.remove('hidden');
                mobileMenu.classList.add('flex'); 
                
                menuButton.classList.add('active');
                menuButton.setAttribute('aria-expanded', 'true');
                
                document.body.style.overflow = 'hidden';
                
            } else {
                mobileMenu.classList.add('hidden');
                mobileMenu.classList.remove('flex');
                
                menuButton.classList.remove('active');
                menuButton.setAttribute('aria-expanded', 'false');
                
                document.body.style.overflow = '';
            }
        };

        menuButton.addEventListener('click', (e) => {
            e.stopPropagation(); 
            toggleMenu();
        });

        menuLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (!mobileMenu.classList.contains('hidden')) {
                    toggleMenu();
                }
            });
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !mobileMenu.classList.contains('hidden')) {
                toggleMenu();
            }
        });
    } else {
        console.warn('System UI Warning: Mobile navigation elements missing from DOM.');
    }
};