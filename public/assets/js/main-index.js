// --- GERİ SAYIM SAYACI ---
const countdownDate = new Date("2026-01-01T00:00:00").getTime();

const countdownFunction = setInterval(function() {
    const now = new Date().getTime();
    const distance = countdownDate - now;

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
    
    document.getElementById("days").innerText = days.toString().padStart(2, '0');
    document.getElementById("hours").innerText = hours.toString().padStart(2, '0');
    document.getElementById("minutes").innerText = minutes.toString().padStart(2, '0');
    document.getElementById("seconds").innerText = seconds.toString().padStart(2, '0');

    if (distance < 0) {
        clearInterval(countdownFunction);
        document.getElementById("countdown").innerHTML = "<p class='text-2xl text-yellow-500 font-serif'>The story has begun.</p>";
    }
}, 1000);

// --- HAREKETLİ PARTİKÜL ARKA PLANI ---
tsParticles.load("particles-container", {
    fpsLimit: 60,
    particles: {
        number: { value: 60, density: { enable: true, value_area: 800 } },
        color: { value: "#ffffff" },
        shape: { type: "circle" },
        opacity: { value: 0.3, random: true, anim: { enable: true, speed: 0.4, opacity_min: 0.05, sync: false } },
        size: { value: 1.5, random: true },
        move: { enable: true, speed: 0.5, direction: "none", random: true, straight: false, out_mode: "out" }
    },
    interactivity: { events: { onhover: { enable: true, mode: "bubble" }, resize: true }, modes: { bubble: { distance: 100, size: 2, duration: 2, opacity: 0.8 } } },
    detectRetina: true
});

// --- ABONELİK FORMU İŞLEYİCİSİ ---
import { db } from './modules/firebase-config.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const subscribeForm = document.getElementById('subscribe-form');
const subscribeMessage = document.getElementById('subscribe-message');

if (subscribeForm) {
    subscribeForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const emailInput = document.getElementById('email-input');
        const email = emailInput.value;

        if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            try {
                await addDoc(collection(db, "subscribers"), {
                    email: email,
                    subscribedAt: serverTimestamp()
                });
                
                subscribeMessage.textContent = 'Thank you for subscribing!';
                subscribeMessage.className = 'success';
                emailInput.value = '';
            } catch (error) {
                console.error("Error adding document: ", error);
                subscribeMessage.textContent = 'Something went wrong. Please try again.';
                subscribeMessage.className = 'error';
            }
        } else {
            subscribeMessage.textContent = 'Please enter a valid email address.';
            subscribeMessage.className = 'error';
        }

        setTimeout(() => {
            subscribeMessage.textContent = '';
            subscribeMessage.className = '';
        }, 5000);
    });
}
