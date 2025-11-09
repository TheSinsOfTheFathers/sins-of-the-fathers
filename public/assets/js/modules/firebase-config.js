import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const RECAPTCHA_SITE_KEY = "6LeoRfYrAAAAANpaxG70cHRmK5ciRKf7sVt9Crnz"; 

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
const analytics = getAnalytics(app);
const auth = getAuth(app);
const functionsInstance = getFunctions(app, "europe-west3");
const googleProvider = new GoogleAuthProvider();
const storage = getStorage(app);

if (app && db && analytics && auth && functionsInstance && googleProvider && storage) {
  console.info("🔥 [Firebase Init SUCCESS] Core services initialized (App, DB, Auth, Storage, Functions, Analytics).");
} 

else {
  console.error("❌ [Firebase ERROR] One or more core services failed to initialize!");
}

if (app && db && auth && functionsInstance && storage) {
  console.info("✅ [Export SUCCESS] All core instances ready for use in modules.");
} 

else {
  console.error("❌ [Export ERROR] Missing core dependency in export!");
}

export { app };
export { db };
export { analytics };
export { auth };
export { functionsInstance as functions }; 
export { googleProvider };
export { storage };
export { RECAPTCHA_SITE_KEY };