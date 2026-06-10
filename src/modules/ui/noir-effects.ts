import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TextPlugin } from 'gsap/TextPlugin';

gsap.registerPlugin(ScrollTrigger, TextPlugin);

const NOIR_EASE = "power2.out";

export const NoirEffects = {

    revealCard: (target: string | Element | Element[], stagger: number = 0.1): gsap.core.Tween => {
        return gsap.fromTo(target,
            {
                autoAlpha: 0,
                y: 30,
                filter: "blur(5px)"
            },
            {
                autoAlpha: 1,
                y: 0,
                filter: "blur(0px)",
                duration: 1.2,
                stagger: stagger,
                ease: NOIR_EASE,
                scrollTrigger: {
                    trigger: target as gsap.DOMTarget,
                    start: "top 85%",
                    toggleActions: "play none none reverse"
                }
            }
        );
    },

    typewriterEffect: (target: string | Element, textContent: string = ""): gsap.core.Tween => {
        if (textContent) {
            if (target instanceof Element) target.textContent = "";
        }

        return gsap.to(target, {
            duration: 2,
            text: { value: textContent || (target as Element).textContent, delimiter: "" },
            ease: "none",
            scrollTrigger: {
                trigger: target as gsap.DOMTarget,
                start: "top 90%",
            }
        });
    },

    goldShimmer: (target: string | Element | Element[]): gsap.core.Tween => {
        return gsap.fromTo(target,
            { color: "#4a0404" },
            {
                color: "#c5a059",
                duration: 2,
                ease: "power2.inOut",
                scrollTrigger: {
                    trigger: target as gsap.DOMTarget,
                    start: "top 80%"
                }
            }
        );
    },

    scrambleText: (target: string | Element, finalText: string, duration: number = 1): gsap.core.Tween | undefined => {
        const element = (typeof target === 'string') ? document.querySelector(target) : target;
        if (!element) return;

        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&";
        const originalText = finalText || element.textContent;
        const length = (originalText as string).length;
        const obj: { value: number } = { value: 0 };

        return gsap.to(obj, {
            value: 1,
            duration: duration,
            ease: "none",
            onUpdate: () => {
                const progress = Math.floor(obj.value * length);
                let result = "";
                for (let i = 0; i < length; i++) {
                    if (i < progress) result += (originalText as string)[i];
                    else result += chars[Math.floor(Math.random() * chars.length)];
                }
                element.textContent = result;
            },
            onComplete: () => { element.textContent = originalText; }
        });
    },

    revealImage: (target: string | Element | Element[]): gsap.core.Tween => {
        return gsap.from(target, {
            scale: 1.1,
            filter: "grayscale(100%) blur(10px)",
            duration: 1.5,
            ease: "circ.out"
        });
    },

    staggerList: (targets: string | Element | Element[], stagger: number = 0.05): gsap.core.Tween => {
        return gsap.to(targets, {
            opacity: 1,
            x: 0,
            startAt: { x: -10, opacity: 0 },
            duration: 0.4,
            stagger: stagger,
            ease: NOIR_EASE
        });
    },

    staggerScaleReveal: (targets: string | Element | Element[], stagger: number = 0.1): gsap.core.Tween => {
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
