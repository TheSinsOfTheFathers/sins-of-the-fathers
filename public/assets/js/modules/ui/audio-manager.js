/**
 * AUDIO MANAGER (Howler.js Wrapper)
 * UI etkileşimlerini (tıklama, hover) ve arka plan ambiyansını yönetir.
 */

const Howl = window.Howl;

let uiSounds = {};
let ambienceSound = null;
let isMuted = localStorage.getItem('tsof_muted') === 'true';

const SOUND_PATHS = {
    hover: '/assets/audio/hover.mp3',
    click: '/assets/audio/click.mp3',
    denied: '/assets/audio/error.mp3',
    ambience: '/assets/audio/ambience.mp3'
};

/**
 * Sesleri yükle ve hazırla
 */
const loadSounds = () => {
    if (!Howl) {
        console.warn("Howler.js not found!");
        return;
    }

    // UI Sesleri (Bunlar da kısıldı)
    uiSounds = {
        hover: new Howl({ src: [SOUND_PATHS.hover], volume: 0.03, preload: true }), 
        click: new Howl({ src: [SOUND_PATHS.click], volume: 0.15, preload: true }), // %15
        denied: new Howl({ src: [SOUND_PATHS.denied], volume: 0.1, preload: true })
    };

    // Ambiyans
    ambienceSound = new Howl({
        src: [SOUND_PATHS.ambience],
        html5: false, 
        loop: true,
        volume: 0, 
        autoplay: false,
        pool: 5
    });
};

export const playSfx = (key) => {
    if (isMuted || !uiSounds[key]) return;
    uiSounds[key].play();
};

export const startAmbience = () => {
    if (isMuted || !ambienceSound || ambienceSound.playing()) return;
    
    // Ses seviyesini garantiye al
    ambienceSound.volume(0);
    ambienceSound.play();
    
    // 👇 RADİKAL DÜZELTME:
    // Seviye: 0.005 (%0.5 - Binde beş). Neredeyse sessizlik.
    // Süre: 10000ms (10 saniye). Çok çok yavaş girecek.
    ambienceSound.fade(0, 0.005, 10000); 
    
    console.log(" > Audio Protocol: Ambience Initiated (Level: 0.5% - Subliminal).");
};

export const toggleMute = () => {
    isMuted = !isMuted;
    localStorage.setItem('tsof_muted', isMuted);
    window.Howler.mute(isMuted);
    return isMuted;
};

const initGlobalListeners = () => {
    
    document.addEventListener('click', () => {
        startAmbience();
    }, { once: true });

    document.body.addEventListener('mouseover', (e) => {
        const target = e.target.closest('a, button, .clickable');
        
        if (target && !target.dataset.soundPlayed) {
            playSfx('hover');
            target.dataset.soundPlayed = "true"; 
            
            target.addEventListener('mouseleave', () => {
                delete target.dataset.soundPlayed;
            }, { once: true });
        }
    });

    document.body.addEventListener('click', (e) => {
        const target = e.target.closest('a, button, .clickable');
        if (target) {
            playSfx('click');
        }
    });
};

export const initAudioSystem = () => {
    loadSounds();
    initGlobalListeners();
    
    if (isMuted) window.Howler.mute(true);
    
    console.log(" > Audio System: ONLINE");
};