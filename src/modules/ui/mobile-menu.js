/**
 * MOBILE MENU UI CONTROLLER
 * GSAP Timeline ile sinematik açılış/kapanış.
 */

import gsap from 'gsap';

export function initMobileMenu() {
    const btn = document.getElementById('hamburger-button');
    const menu = document.getElementById('mobile-menu');
    
    // Elementler yoksa dur (Hata vermemesi için)
    if (!btn || !menu) return;

    const links = menu.querySelectorAll('a');
    let isOpen = false;

    // ---------------------------------------------------------
    // 1. GSAP TIMELINE OLUŞTURMA (Başlangıçta duraklatılmış)
    // ---------------------------------------------------------
    // Timeline'ı bir değişkene atayıp 'paused: true' yapıyoruz.
    // Böylece her tıklamada animasyonu baştan hesaplamak yerine
    // sadece oynat (play) veya geri sar (reverse) deriz.
    const tl = gsap.timeline({ paused: true, reversed: true });

    // A. Menü Konteynerini Aç
    tl.to(menu, {
        duration: 0.1,
        display: 'flex', // Tailwind 'hidden' class'ını ezer
        onStart: () => {
            menu.classList.remove('hidden'); // Güvenlik için class'ı da kaldır
        }
    })
    .to(menu, {
        duration: 0.5,
        opacity: 1, // Tailwind'in opacity-0'ını ezer
        backdropFilter: "blur(20px)", // Arka planı bulanıklaştır
        ease: "power2.inOut"
    }, "<") // Öncekiyle aynı anda başla

    // B. Linkleri Sırayla Getir (Stagger)
    .from(links, {
        y: 40,          // 40px aşağıdan
        opacity: 0,     // Görünmezden
        duration: 0.6,
        stagger: 0.1,   // 0.1sn arayla
        ease: "back.out(1.7)" // Hafif yaylanarak (Pop efekti)
    }, "-=0.3"); // Menü açılmaya devam ederken linkler gelmeye başlasın

    // ---------------------------------------------------------
    // 2. CLICK EVENT (HAMBURGER)
    // ---------------------------------------------------------
    btn.addEventListener('click', (e) => {
        e.stopPropagation(); // Tıklamanın body'ye gitmesini engelle
        isOpen = !isOpen;

        // İkon Animasyonu (CSS class'ı 'active' üzerinden dönüyor)
        btn.classList.toggle('active');
        btn.setAttribute('aria-expanded', isOpen);

        if (isOpen) {
            // Menüyü Oynat
            tl.play();
            document.body.style.overflow = 'hidden'; // Arka plan kaymasını engelle
        } else {
            // Menüyü Geri Sar
            tl.reverse();
            document.body.style.overflow = ''; 
        }
    });

    // ---------------------------------------------------------
    // 3. LINK CLICK EVENT (Menüyü Kapat)
    // ---------------------------------------------------------
    // Linklerden birine tıklanınca menü otomatik kapansın
    links.forEach(link => {
        link.addEventListener('click', () => {
            if (isOpen) {
                isOpen = false;
                btn.classList.remove('active');
                btn.setAttribute('aria-expanded', 'false');
                tl.reverse();
                document.body.style.overflow = '';
            }
        });
    });

    // ---------------------------------------------------------
    // 4. ESCAPE KEY (Erişilebilirlik)
    // ---------------------------------------------------------
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isOpen) {
            isOpen = false;
            btn.classList.remove('active');
            btn.setAttribute('aria-expanded', 'false');
            tl.reverse();
            document.body.style.overflow = '';
        }
    });
}