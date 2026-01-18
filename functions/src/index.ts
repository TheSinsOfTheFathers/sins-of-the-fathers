/**
 * BABALARIN GÜNAHLARI (THE SINS OF THE FATHERS)
 * Backend Core v2.0
 * * Includes:
 * 1. Security (reCAPTCHA v3)
 * 2. Communications (Resend Email)
 * 3. Intelligence (Silvio AI / Gemini 3.0 Pro)
 */

import { onRequest, onCall, HttpsError, CallableRequest } from "firebase-functions/v2/https";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import axios, { AxiosResponse } from "axios";
import { SecretManagerServiceClient } from "@google-cloud/secret-manager";
import { Resend } from "resend";
import { genkit } from "genkit";
import { vertexAI } from "@genkit-ai/google-genai";
import cors from "cors";

// --- BAŞLATMA ---
admin.initializeApp();
const db = getFirestore();
const secretManagerClient = new SecretManagerServiceClient();
const corsHandler = cors({ origin: true });

// --- AYARLAR ---
const PROJECT_ID = "sins-of-the-fathers";
const REGION = "europe-west3"; // Fonksiyonların çalışacağı bölge
const AI_LOCATION = "global";  // 🚨 Gemini 3.0 Preview için ZORUNLU

// --- TİPLER (INTERFACES) ---
interface RecaptchaVerificationData {
  token: string;
  action: string;
  uid?: string;
  email?: string;
}

interface AssessmentResponseV3 {
  success: boolean;
  score?: number;
  "error-codes"?: string[];
  action?: string;
}

interface SubscriberData {
  email: string;
  name?: string;
}

// --- KARAKTER VERİTABANI (SILVIO İÇİN) ---
const CHARACTER_DB: Record<string, string> = {
  silvio: "Silvio: 85 yaşında, anlatıcı, bilge, manipülatif akıl hocası. Racon keser.",
  roland: "Roland: Ana karakter, 'Karga'. Hırslı, duygusuzlaşmaya çalışan lider.",
  fabio: "Fabio: Umberto'nun oğlu. Onurlu olmaya çalıştı ama Roland'a karşı kaybetti.",
  umberto: "Umberto: Fabio'nun babası ve ailenin finansçısı (Muhasebeci).",
  aurelia: "Aurelia: Roland'ın geçmişindeki kadın, onun zayıf noktası.",
  riccardo: "Riccardo: Kas gücü, sadık tetikçi, sonu kötü biter.",
};

// --- GENKIT (YAPAY ZEKA) INIT ---
const ai = genkit({
  plugins: [
    vertexAI({ location: AI_LOCATION, projectId: PROJECT_ID }),
  ],
});

// Global değişken ile secret'i önbelleğe alıyoruz
let cachedRecaptchaSecret: string | null = null;


// ==========================================================================
//  BÖLÜM 1: YARDIMCI FONKSİYONLAR (HELPERS)
// ==========================================================================

async function getRecaptchaSecret(): Promise<string> {
  if (cachedRecaptchaSecret) return cachedRecaptchaSecret;

  try {
    const SECRET_NAME = "projects/287213062167/secrets/RECAPTCHA_SECRET_KEY/versions/latest";
    const [version] = await secretManagerClient.accessSecretVersion({ name: SECRET_NAME });

    if (!version.payload?.data) throw new Error("reCAPTCHA secret not found.");

    const secret = version.payload.data.toString();
    cachedRecaptchaSecret = secret;
    return secret;
  } catch (error) {
    logger.error("Failed to access Secret Manager:", error);
    throw new HttpsError("internal", "Could not retrieve security keys.");
  }
}

async function verifyRecaptchaLogic(token: string): Promise<{ isValid: boolean; score: number }> {
  try {
    const secretKey = await getRecaptchaSecret();
    const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`;
    
    const response: AxiosResponse<AssessmentResponseV3> = await axios.post(verificationUrl);
    const { success, score } = response.data;
    const finalScore = score ?? 0;

    return { isValid: success && finalScore >= 0.5, score: finalScore };
  } catch (error) {
    logger.error("reCAPTCHA verification error:", error);
    return { isValid: false, score: 0 };
  }
}

const getNoirEmailTemplate = (title: string, message: string, ctaLink?: string, ctaText?: string) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { margin: 0; padding: 0; background-color: #050505; color: #d4d4d4; font-family: 'Courier New', Courier, monospace; }
        .container { max-width: 600px; margin: 0 auto; background-color: #0a0a0a; border: 1px solid #c5a059; }
        .header { background-color: #080808; padding: 20px; text-align: center; border-bottom: 1px solid #333; }
        .logo { color: #c5a059; font-size: 20px; font-weight: bold; text-decoration: none; letter-spacing: 4px; }
        .content { padding: 40px 30px; text-align: left; }
        h1 { color: #ffffff; font-size: 24px; margin-bottom: 20px; border-left: 3px solid #c5a059; padding-left: 15px; }
        .btn { display: inline-block; background-color: #c5a059; color: #000; padding: 14px 28px; text-decoration: none; font-weight: bold; margin-top: 20px; }
        .footer { background-color: #080808; padding: 20px; text-align: center; font-size: 10px; color: #444; border-top: 1px solid #333; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header"><a href="https://thesinsofthefathers.com" class="logo">TSOF // INTEL</a></div>
        <div class="content">
          <h1>${title}</h1>
          <p>${message}</p>
          ${ctaLink ? `<div style="text-align:center"><a href="${ctaLink}" class="btn">${ctaText || "ACCESS"}</a></div>` : ""}
        </div>
        <div class="footer">
          <p>TOP SECRET // EYES ONLY</p>
          <p>&copy; 2026 The Sins of the Fathers.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};


// ==========================================================================
//  BÖLÜM 2: CLOUD FUNCTIONS
// ==========================================================================

/**
 * 1. reCAPTCHA Doğrulama
 */
export const verifyRecaptchaToken = onCall(
  { region: REGION, cors: true },
  async (request: CallableRequest<RecaptchaVerificationData>) => {
    const { token, action } = request.data;
    const uid = request.auth?.uid;

    if (!token || !action) throw new HttpsError("invalid-argument", "Token/action required.");

    const result = await verifyRecaptchaLogic(token);

    if (!result.isValid) {
      logger.warn(`Security check failed. Score: ${result.score}`);
      throw new HttpsError("permission-denied", "Bot detected.");
    }

    logger.info(`reCAPTCHA Success for User: ${uid || "Guest"} Action: ${action}`);
    return { success: true, score: result.score };
  }
);


/**
 * 2. Yeni Abone Tetikleyicisi (Email Gönderimi)
 */
export const onNewSubscriber = onDocumentCreated(
  {
    region: REGION,
    document: "subscribers/{subscriberId}",
    secrets: ["RESEND_API_KEY"],
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const data = snapshot.data() as SubscriberData;
    const email = data.email;

    if (!email) {
      logger.warn("No email found.");
      return;
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      logger.error("RESEND_API_KEY is missing.");
      return;
    }

    const resend = new Resend(resendApiKey);

    try {
      const { data: emailData, error } = await resend.emails.send({
        from: "The Sins of the Fathers <intel@thesinsofthefathers.com>",
        to: [email],
        subject: "Access Granted: Welcome to the Network",
        html: getNoirEmailTemplate(
          "IDENTITY CONFIRMED",
          "Your clearance level has been established. You are now part of the inner circle.<br><br>Expect further instructions via this secure channel.",
          "https://thesinsofthefathers.com/",
          "ENTER ARCHIVES"
        ),
      });

      if (error) {
        logger.error("Resend Error:", error);
        return;
      }
      logger.info(`Welcome email sent to ${email}. ID: ${emailData?.id}`);
    } catch (err) {
      logger.error("Error in onNewSubscriber:", err);
    }
  }
);


/**
 * 3. Silvio Chatbot (Gemini 3.0 + RAG)
 * Not: 'onRequest' kullanarak standart HTTP endpoint yaptık.
 * Frontend'den 'fetch' ile doğrudan erişilebilir.
 */
export const askTheNovel = onRequest({ 
  region: REGION, 
  timeoutSeconds: 60, // Gemini'ye düşünme süresi
  memory: "1GiB"
}, async (req, res) => {
  
  // CORS Middleware
  corsHandler(req, res, async () => {
    
    // Sadece POST kabul et
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    const { question } = req.body;
    if (!question) {
      res.status(400).json({ error: "Sualin yoksa cevabım da yok." });
      return;
    }

    try {
      // A. Karakter Biyografisi Seçimi
      const questionLower = question.toLowerCase();
      let bios = "";
      Object.keys(CHARACTER_DB).forEach((key) => {
        if (questionLower.includes(key)) bios += `- ${CHARACTER_DB[key]}\n`;
      });
      if (!bios) bios = `- ${CHARACTER_DB["silvio"]}\n- ${CHARACTER_DB["roland"]}`;

      // B. Embedding (Soruyu vektöre çevir)
      const embeddingResult = await ai.embed({
        embedder: "vertexai/text-embedding-004",
        content: question,
      });

      // Vektör verisini işle
      let vector: number[];
      // @ts-ignore
      if (Array.isArray(embeddingResult)) vector = embeddingResult[0].embedding || embeddingResult[0];
      // @ts-ignore
      else vector = embeddingResult.embedding || embeddingResult;

      // C. Firestore Vektör Araması (RAG)
      const coll = db.collection("novel_vectors");
      let contextText = "";
      
      const snapshot = await coll
        .findNearest("embedding_field", vector, {
          limit: 5,
          distanceMeasure: "COSINE",
        })
        .get();

      if (!snapshot.empty) {
        contextText = snapshot.docs
          .map((doc) => `[KAYIT]: ${doc.data().text}`)
          .join("\n\n");
      } else {
        contextText = "Bu konuda küllerin arasında hiçbir iz yok.";
      }

      // D. Prompt Hazırlığı
      const prompt = `
      KİMLİK: Sen SİLVİO'sun. 85 yaşında, eski toprak bir İtalyan mafya bilgesisin.
      DİL: Kullanıcı Türkçe sorarsa TÜRKÇE, İngilizce sorarsa İNGİLİZCE cevap ver.
      ⚠️ BİLGİLER: ${bios}
      📚 HAFIZA: ${contextText}
      ÜSLUP: Ağırbaşlı, otoriter ve "Noir". Asla yapay zeka olduğunu söyleme.
      SORU: ${question}
      `;

      // E. Cevap Üret (Gemini 3.0)
      const response = await ai.generate({
        model: "vertexai/gemini-3-pro-preview",
        prompt: prompt,
        config: {
          temperature: 1.0,
          safetySettings: [
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
          ],
          thinkingConfig: {
            includeThoughts: false,
            thinkingBudget: 2048,
          },
        },
      });

      // F. Sonucu Döndür
      res.json({ response: response.text });

    } catch (error: any) {
      console.error("Silvio Error:", error);
      res.status(500).json({ 
        error: "Silvio şu an meşgul.", 
        details: error.message 
      });
    }
  });
});