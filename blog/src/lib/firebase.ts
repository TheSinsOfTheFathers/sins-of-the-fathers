import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyB7Xa5tZYVenPEkkjB0KVJDkoV7pQ7_QcQ",
  authDomain: "sins-of-the-fathers.firebaseapp.com",
  projectId: "sins-of-the-fathers",
  storageBucket: "sins-of-the-fathers.firebasestorage.app",
  messagingSenderId: "287213062167",
  appId: "1:287213062167:web:1f863b4e96641570f5b452",
};

export const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
