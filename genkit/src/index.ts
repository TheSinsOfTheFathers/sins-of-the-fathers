import { onCall, HttpsError } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { genkit } from "genkit";
import { vertexAI } from "@genkit-ai/google-genai";

// --- INITIALIZATION ---
try {
  initializeApp();
} catch (e) {}

const db = getFirestore();

// --- CONFIGURATION ---
const PROJECT_ID = "sins-of-the-fathers";
const AI_LOCATION = "global";
const CHAT_MODEL_NAME = "vertexai/gemini-3-pro-preview";

// --- GENKIT INIT ---
const ai = genkit({
  plugins: [
    vertexAI({
      location: AI_LOCATION,
      projectId: PROJECT_ID,
    }),
  ],
});

/**
 * askTheNovel Cloud Function (Gen 2)
 * Handles Silvio chatbot queries with RAG (Firestore Vector Search).
 */
export const askTheNovel = onCall({ 
    region: "europe-west3",
    cors: true, // Fixes the CORS error reported by the user
    invoker: "public" 
}, async (request) => {
  const { question } = request.data;

  if (!question) {
    throw new HttpsError("invalid-argument", "Evlat, bir sualin olmalı.");
  }

  try {
    // Embedding
    const embeddingResult = await ai.embed({
      embedder: "vertexai/text-embedding-004",
      content: question,
    });

    // Handle different embedding result shapes
    let vector: number[];
    if (Array.isArray(embeddingResult)) {
        // @ts-ignore
        vector = embeddingResult[0].embedding || embeddingResult[0];
    } else {
        // @ts-ignore
        vector = embeddingResult.embedding || embeddingResult;
    }

    // Vector Search
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

    // Prompt
    const prompt = `
      KİMLİK: Sen SİLVİO'sun. 85 yaşında, eski toprak, tehlikeli bir İtalyan mafya bilgesisin.
      DİL KURALI: Kullanıcı Türkçe sorarsa TÜRKÇE, İngilizce sorarsa İNGİLİZCE cevap ver.
      📚 HAFIZA: ${contextText}
      ÜSLUP: Ağırbaşlı, otoriter ve "Noir" havasında konuş. Asla yapay zeka olduğunu söyleme.
      SORU: ${question}
    `;

    // Generate Response
    const response = await ai.generate({
      model: CHAT_MODEL_NAME,
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

    return { response: response.text };
  } catch (error: any) {
    console.error("Silvio Error:", error);
    throw new HttpsError("internal", `Silvio cevap veremiyor: ${error.message}`);
  }
});
