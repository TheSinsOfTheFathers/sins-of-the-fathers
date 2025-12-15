// --- IMPORTLAR (SÜRÜMLER EŞİTLENDİ - v10.12.2) ---
// Firebase config'i doğrudan CDN'den yükle
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Firebase Config (landing page için)
const firebaseConfig = {
    apiKey: "AIzaSyB7Xa5tZYVenPEkkjB0KVJDkoV7pQ7_QcQ",
    authDomain: "thesinsofthefathers.com",
    databaseURL: "https://sins-of-the-fathers-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "sins-of-the-fathers",
    storageBucket: "sins-of-the-fathers.appspot.com",
    messagingSenderId: "287213062167",
    appId: "1:287213062167:web:1f863b4e96641570f5b452",
    measurementId: "G-9H3782YN0N"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- GERİ SAYIM SAYACI ---
const countdownDate = new Date("2026-01-01T00:00:00Z").getTime();

const countdownFunction = setInterval(function () {
    const now = Date.now();
    const distance = countdownDate - now;

    if (distance < 0) {
        clearInterval(countdownFunction);
        const countdownContainer = document.getElementById("countdown");
        if (countdownContainer) countdownContainer.innerHTML = "<p class='text-2xl text-yellow-500 font-serif'>The story has begun.</p>";
        return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    const elDays = document.getElementById("days");
    if (elDays) {
        elDays.innerText = days.toString().padStart(2, '0');
        document.getElementById("hours").innerText = hours.toString().padStart(2, '0');
        document.getElementById("minutes").innerText = minutes.toString().padStart(2, '0');
        document.getElementById("seconds").innerText = seconds.toString().padStart(2, '0');
    }
}, 1000);

// --- HAREKETLİ PARTİKÜL ARKA PLANI ---
// tsParticles global olarak yüklendiği için window üzerinden kontrol ediyoruz
if (window.tsParticles) {
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
}

// --- ABONELİK FORMU İŞLEYİCİSİ ---
const subscribeForm = document.getElementById('subscribe-form');
const emailInput = document.getElementById('email-input');
const subscribeMessage = document.getElementById('subscribe-message');

if (subscribeForm) {
    subscribeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = emailInput.value.trim();

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            subscribeMessage.textContent = 'Please enter a valid email.';
            subscribeMessage.className = 'mt-3 text-sm h-4 text-red-500 font-mono error';
            return;
        }

        subscribeMessage.textContent = 'Processing...';
        subscribeMessage.className = 'mt-3 text-sm h-4 text-neutral-400 font-mono';

        try {
            const subscribersRef = collection(db, "subscribers");
            const q = query(subscribersRef, where("email", "==", email));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                subscribeMessage.textContent = 'This email is already subscribed.';
                subscribeMessage.className = 'mt-3 text-sm h-4 text-yellow-500 font-mono error';
            } else {
                await addDoc(subscribersRef, {
                    email: email,
                    subscribedAt: serverTimestamp()
                });
                subscribeMessage.textContent = 'Success! Welcome to the watchlist.';
                subscribeMessage.className = 'mt-3 text-sm h-4 text-green-500 font-mono success';
                emailInput.value = '';
            }
        } catch (error) {
            console.error("Error managing subscription: ", error);
            if (error.code === 'permission-denied') {
                subscribeMessage.textContent = 'Access Denied: Firewall blocking connection.';
            } else {
                subscribeMessage.textContent = 'A system error occurred. Try again.';
            }
            subscribeMessage.className = 'mt-3 text-sm h-4 text-red-500 font-mono error';
        } finally {
            setTimeout(() => {
                if (!subscribeMessage.classList.contains('success')) {
                    subscribeMessage.textContent = '';
                    subscribeMessage.className = 'mt-3 text-sm h-4 text-neutral-400 font-mono';
                }
            }, 5000);
        }
    });
}