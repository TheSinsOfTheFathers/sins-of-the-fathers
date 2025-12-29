// --- IMPORTLAR ---
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFunctions } from "firebase/functions";
import { getStorage } from "firebase/storage";

/* --------------------------------------------------------------------------
    SECURITY CREDENTIALS
    -------------------------------------------------------------------------- */
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

const RECAPTCHA_SITE_KEY = "6LeoRfYrAAAAANpaxG70cHRmK5ciRKf7sVt9Crnz";

/* --------------------------------------------------------------------------
    SYSTEM INITIALIZATION (Only initialize what is needed immediately)
    -------------------------------------------------------------------------- */
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const auth = getAuth(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();
const functionsInstance = getFunctions(app, "europe-west3");

let analyticsInstance = null;

try {
    analyticsInstance = getAnalytics(app);
    console.log(
        "%c[SYSTEM] TSOF Secure Link :: ESTABLISHED",
        "color: #c5a059; background: #050505; padding: 4px; border-left: 2px solid #c5a0_59; font-family: monospace; font-display: swap;"
    );
} catch (error) {
    console.error(
        "%c[CRITICAL FAILURE] Analytics could not initialize.",
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
    analyticsInstance as analytics,
    auth,
    functionsInstance as functions,
    googleProvider,
    storage,
    RECAPTCHA_SITE_KEY
};