import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { SecretManagerServiceClient } from "@google-cloud/secret-manager";
import cors from "cors";

// --- BAŞLATMA ---
// Eğer zaten başlatılmışsa tekrar başlatma
if (admin.apps.length === 0) {
  admin.initializeApp();
}

export const db = getFirestore();
export const secretManagerClient = new SecretManagerServiceClient();
export const corsHandler = cors({ origin: true });

// --- AYARLAR ---
export const PROJECT_ID = "sins-of-the-fathers";
export const REGION = "europe-west3"; // Fonksiyonların çalışacağı bölge
export const AI_LOCATION = "global";  // 🚨 Gemini 3.0 Preview için ZORUNLU
