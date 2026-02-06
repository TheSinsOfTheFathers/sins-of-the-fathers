import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB7Xa5tZYVenPEkkjB0KVJDkoV7pQ7_QcQ",
  authDomain: "thesinsofthefathers.com",
  databaseURL:
    "https://sins-of-the-fathers-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "sins-of-the-fathers",
  storageBucket: "sins-of-the-fathers.appspot.com",
  messagingSenderId: "287213062167",
  appId: "1:287213062167:web:1f863b4e96641570f5b452",
  measurementId: "G-9H3782YN0N",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);



if (window.tsParticles) {
  tsParticles.load("particles-container", {
    fpsLimit: 60,
    particles: {
      number: { value: 60, density: { enable: true, value_area: 800 } },
      color: { value: "#ffffff" },
      shape: { type: "circle" },
      opacity: {
        value: 0.3,
        random: true,
        anim: { enable: true, speed: 0.4, opacity_min: 0.05, sync: false },
      },
      size: { value: 1.5, random: true },
      move: {
        enable: true,
        speed: 0.5,
        direction: "none",
        random: true,
        straight: false,
        out_mode: "out",
      },
    },
    interactivity: {
      events: { onhover: { enable: true, mode: "bubble" }, resize: true },
      modes: { bubble: { distance: 100, size: 2, duration: 2, opacity: 0.8 } },
    },
    detectRetina: true,
  });
}

const subscribeForm = document.getElementById("subscribe-form");
const emailInput = document.getElementById("email-input");
const subscribeMessage = document.getElementById("subscribe-message");

if (subscribeForm) {
  subscribeForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      subscribeMessage.textContent = "Please enter a valid email.";
      subscribeMessage.className =
        "mt-3 text-sm h-4 text-red-500 font-mono error";
      return;
    }

    subscribeMessage.textContent = "Processing...";
    subscribeMessage.className = "mt-3 text-sm h-4 text-neutral-400 font-mono";

    try {
      const subscribersRef = collection(db, "subscribers");

      await addDoc(subscribersRef, {
        email: email,
        subscribedAt: serverTimestamp(),
      });

      subscribeMessage.textContent = "Success! Welcome to the watchlist.";
      subscribeMessage.className =
        "mt-3 text-sm h-4 text-green-500 font-mono success";
      emailInput.value = "";
    } catch (error) {
      console.error("Error managing subscription: ", error);
      if (error.code === "permission-denied") {
        subscribeMessage.textContent =
          "Access Denied: Firewall blocking connection.";
      } else {
        subscribeMessage.textContent = "A system error occurred. Try again.";
      }
      subscribeMessage.className =
        "mt-3 text-sm h-4 text-red-500 font-mono error";
    } finally {
      setTimeout(() => {
        if (!subscribeMessage.classList.contains("success")) {
          subscribeMessage.textContent = "";
          subscribeMessage.className =
            "mt-3 text-sm h-4 text-neutral-400 font-mono";
        }
      }, 5000);
    }
  });
}
