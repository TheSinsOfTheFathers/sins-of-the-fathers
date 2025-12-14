import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFunctions } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

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

/* --------------------------------------------------------------------------
   SYSTEM INITIALIZATION
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
        "color: #c5a059; background: #050505; padding: 4px; border-left: 2px solid #c5a059; font-family: monospace;"
    );
} catch (error) {
    console.error(
        "%c[CRITICAL FAILURE] Analytics could not initialize.",
        "color: #ef4444; background: #000; font-weight: bold;"
    );
    console.error(error);
}

const analytics = analyticsInstance;

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
    storage
};