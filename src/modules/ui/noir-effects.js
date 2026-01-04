import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TextPlugin } from 'gsap/TextPlugin';

gsap.registerPlugin(ScrollTrigger, TextPlugin);

// Noir Estetiği için Özel Easing (Keskin giriş, yavaş bitiş)
const NOIR_EASE = "power2.out";

export const NoirEffects = {

    /**
     * Kartlar veya bloklar için standart "Karanlıktan Çıkış" efekti
     * @param {string|Element} target - Animasyonlanacak hedef
     * @param {number} stagger - Çoklu elementler arası gecikme
     */
    revealCard: (target, stagger = 0.1) => {
        return gsap.fromTo(target,
            {
                autoAlpha: 0,
                y: 30,
                filter: "blur(5px)" // Noir bulanıklığı
            },
            {
                autoAlpha: 1,
                y: 0,
                filter: "blur(0px)",
                duration: 1.2,
                stagger: stagger,
                ease: NOIR_EASE,
                scrollTrigger: {
                    trigger: target,
                    start: "top 85%",
                    toggleActions: "play none none reverse"
                }
            }
        );
    },

    /**
     * 'Courier Prime' fontlu metinler için Daktilo/Deşifre efekti
     * @param {string|Element} target 
     * @param {string} textContent - Yazılacak metin (Opsiyonel)
     */
    typewriterEffect: (target, textContent = "") => {
        // Eğer textContent varsa, önce içeriği ayarla
        if (textContent) {
            if (target instanceof Element) target.textContent = "";
        }

        return gsap.to(target, {
            duration: 2,
            text: { value: textContent || target.textContent, delimiter: "" },
            ease: "none",
            scrollTrigger: {
                trigger: target,
                start: "top 90%",
            }
        });
    },

    /**
     * Başlıkların 'Gold' rengine parlayarak gelmesi
     */
    goldShimmer: (target) => {
        return gsap.fromTo(target,
            { color: "#4a0404" }, // Blood renginden başla
            {
                color: "#c5a059", // Gold rengine dön
                duration: 2,
                ease: "power2.inOut",
                scrollTrigger: {
                    trigger: target,
                    start: "top 80%"
                }
            }
        );
    },

    /**
     * Matrix/Decoder tarzı karışık harflerden metne dönüş
     */
    scrambleText: (target, finalText, duration = 1) => {
        const element = (typeof target === 'string') ? document.querySelector(target) : target;
        if (!element) return;

        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&";
        const originalText = finalText || element.textContent;
        const length = originalText.length;
        let obj = { value: 0 };

        return gsap.to(obj, {
            value: 1,
            duration: duration,
            ease: "none",
            onUpdate: () => {
                const progress = Math.floor(obj.value * length);
                let result = "";
                for (let i = 0; i < length; i++) {
                    if (i < progress) result += originalText[i];
                    else result += chars[Math.floor(Math.random() * chars.length)];
                }
                element.textContent = result;
            },
            onComplete: () => { element.textContent = originalText; }
        });
    },

    /**
     * Uydu görüntüsü netleştirme efekti (Bulanık/Grayscale -> Net)
     */
    revealImage: (target) => {
        return gsap.from(target, {
            scale: 1.1,
            filter: "grayscale(100%) blur(10px)",
            duration: 1.5,
            ease: "circ.out"
        });
    },

    /**
     * Liste elemanlarını sırayla açma
     */
    staggerList: (targets, stagger = 0.05) => {
        return gsap.to(targets, {
            opacity: 1,
            x: 0,
            startAt: { x: -10, opacity: 0 },
            duration: 0.4,
            stagger: stagger,
            ease: NOIR_EASE
        });
    },

    /**
     * Harita markerları gibi öğeleri scale ile açma
     */
    staggerScaleReveal: (targets, stagger = 0.1) => {
        return gsap.to(targets, {
            scale: 1,
            opacity: 1,
            duration: 0.6,
            stagger: {
                amount: 1.5,
                from: "random"
            },
            ease: "back.out(2)"
        });
    }
};
