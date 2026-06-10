import { initializeApp, FirebaseApp } from "firebase/app";
import {
  getFirestore,
  Firestore,
} from "firebase/firestore";
import { getAnalytics, Analytics } from "firebase/analytics";
import { getAuth, Auth, GoogleAuthProvider } from "firebase/auth";
import { getFunctions, Functions } from "firebase/functions";
import { getStorage, FirebaseStorage } from "firebase/storage";

export const isLocal: boolean =
  globalThis.location.hostname === "localhost" ||
  globalThis.location.hostname === "127.0.0.1";

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  databaseURL: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId: string;
}

const firebaseConfig: FirebaseConfig = {
  apiKey: "AIzaSyB7Xa5tZYVenPEkkjB0KVJDkoV7pQ7_QcQ",
  authDomain: "sins-of-the-fathers.firebaseapp.com",
  databaseURL:
    "https://sins-of-the-fathers-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "sins-of-the-fathers",
  storageBucket: "sins-of-the-fathers.firebasestorage.app",
  messagingSenderId: "287213062167",
  appId: "1:287213062167:web:1f863b4e96641570f5b452",
  measurementId: "G-9H3782YN0N",
};

export const TURNSTILE_SITE_KEY: string = "0x4AAAAAACu8NLdKV-Ei7tAk";

const app: FirebaseApp = initializeApp(firebaseConfig);
const db: Firestore = getFirestore(app);
const auth: Auth = getAuth(app);
const storage: FirebaseStorage = getStorage(app);
const googleProvider: GoogleAuthProvider = new GoogleAuthProvider();
const functionsInstance: Functions = getFunctions(app, "europe-west3");

let analyticsInstance: Analytics | null = null;

try {
  analyticsInstance = getAnalytics(app);
  console.log(
    "%c[SYSTEM] TSOF Secure Link :: ESTABLISHED",
    "color: #c5a059; background: #050505; padding: 4px; border-left: 2px solid #c5a059; font-family: monospace;"
  );
} catch (error) {
  console.warn("[SYSTEM] Analytics could not initialize.");
}

export {
  app,
  db,
  analyticsInstance as analytics,
  auth,
  functionsInstance as functions,
  googleProvider,
  storage,
};
