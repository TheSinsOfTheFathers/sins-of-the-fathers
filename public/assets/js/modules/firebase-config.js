import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFunctions } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";
// 👇 YENİ İMPORTLAR
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-check.js";


/* --------------------------------------------------------------------------
    SECURITY CREDENTIALS
    -------------------------------------------------------------------------- */
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

/* --------------------------------------------------------------------------
    SYSTEM INITIALIZATION
    -------------------------------------------------------------------------- */
let app, db, analytics, auth, functionsInstance, googleProvider, storage;

try {
    // 👇 KRİTİK DEBUG ADIMI: Localhost için App Check debug token'ını etkinleştir
    // Bu, yerel geliştirme sırasında API çağrılarının engellenmesini önler.
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
        self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    }

    app = initializeApp(firebaseConfig);
    
    // 👇 APP CHECK BAŞLATMA
    // RECAPTCHA_SITE_KEY'i kullanarak App Check'i başlat
    initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(RECAPTCHA_SITE_KEY),
        isTokenAutoRefreshEnabled: true
    });
    
    db = getFirestore(app);
    auth = getAuth(app);
    storage = getStorage(app);
    analytics = getAnalytics(app);
    googleProvider = new GoogleAuthProvider();
    
    functionsInstance = getFunctions(app, "europe-west3");

    console.log(
        "%c[SYSTEM] TSOF Secure Link :: ESTABLISHED", 
        "color: #c5a059; background: #050505; padding: 4px; border-left: 2px solid #c5a059; font-family: monospace;"
    );

} catch (error) {
    console.error(
        "%c[CRITICAL FAILURE] Core services could not initialize.", 
        "color: #ef4444; background: #000; font-weight: bold;"
    );
    console.error(error);
}

/* --------------------------------------------------------------------------
    EXPORTS
    -------------------------------------------------------------------------- */
export { 
    app, 
    db, 
    analytics, 
    auth, 
    functionsInstance as functions, 
    googleProvider, 
    storage, 
    RECAPTCHA_SITE_KEY 
};