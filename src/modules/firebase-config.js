/* --------------------------------------------------------------------------
    IMPORTLAR
-------------------------------------------------------------------------- */
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
} from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFunctions } from "firebase/functions";
import { getStorage } from "firebase/storage";

/* --------------------------------------------------------------------------
    SECURITY & CONFIGURATION
-------------------------------------------------------------------------- */
const isLocal =
  globalThis.location.hostname === "localhost" ||
  globalThis.location.hostname === "127.0.0.1";

const firebaseConfig = {
  apiKey: "AIzaSyB7Xa5tZYVenPEkkjB0KVJDkoV7pQ7_QcQ",
  authDomain: isLocal
    ? "sins-of-the-fathers.firebaseapp.com"
    : "thesinsofthefathers.com",
  databaseURL:
    "https://sins-of-the-fathers-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "sins-of-the-fathers",
  storageBucket: "sins-of-the-fathers.firebasestorage.app",
  messagingSenderId: "287213062167",
  appId: "1:287213062167:web:1f863b4e96641570f5b452",
  measurementId: "G-9H3782YN0N",
};

export const TURNSTILE_SITE_KEY = "0x4AAAAAACYllPxy3Qv5WB8q";

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
  console.warn("[SYSTEM] Analytics could not initialize.");
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
};
