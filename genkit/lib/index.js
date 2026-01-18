"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.askTheNovel = void 0;
const https_1 = require("firebase-functions/v2/https");
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const genkit_1 = require("genkit");
const google_genai_1 = require("@genkit-ai/google-genai");
// --- INITIALIZATION ---
try {
    (0, app_1.initializeApp)();
}
catch (e) { }
const db = (0, firestore_1.getFirestore)();
// --- CONFIGURATION ---
const PROJECT_ID = "sins-of-the-fathers";
const AI_LOCATION = "global";
const CHAT_MODEL_NAME = "vertexai/gemini-3-pro-preview";
// --- CHARACTER DATABASE ---
const CHARACTER_DB = {
    silvio: "Silvio: 85 yaşında, anlatıcı, bilge, manipülatif akıl hocası. Racon keser.",
    roland: "Roland: Ana karakter, 'Karga'. Hırslı, duygusuzlaşmaya çalışan lider.",
    fabio: "Fabio: Umberto'nun oğlu. Onurlu olmaya çalıştı ama Roland'a karşı kaybetti.",
    umberto: "Umberto: Fabio'nun babası ve ailenin finansçısı (Muhasebeci).",
    aurelia: "Aurelia: Roland'ın geçmişindeki kadın, onun zayıf noktası.",
    riccardo: "Riccardo: Kas gücü, sadık tetikçi, sonu kötü biter.",
};
// --- GENKIT INIT ---
const ai = (0, genkit_1.genkit)({
    plugins: [
        (0, google_genai_1.vertexAI)({
            location: AI_LOCATION,
            projectId: PROJECT_ID,
        }),
    ],
});
/**
 * askTheNovel Cloud Function (Gen 2)
 * Handles Silvio chatbot queries with RAG (Firestore Vector Search).
 */
exports.askTheNovel = (0, https_1.onCall)({
    region: "europe-west3",
    cors: true, // Fixes the CORS error reported by the user
    invoker: "public"
}, async (request) => {
    const { question } = request.data;
    if (!question) {
        throw new https_1.HttpsError("invalid-argument", "Evlat, bir sualin olmalı.");
    }
    try {
        // 1. Character Bios
        const questionLower = question.toLowerCase();
        let bios = "";
        Object.keys(CHARACTER_DB).forEach((key) => {
            if (questionLower.includes(key))
                bios += `- ${CHARACTER_DB[key]}\n`;
        });
        if (!bios)
            bios = `- ${CHARACTER_DB["silvio"]}\n- ${CHARACTER_DB["roland"]}`;
        // 2. Embedding
        const embeddingResult = await ai.embed({
            embedder: "vertexai/text-embedding-004",
            content: question,
        });
        // Handle different embedding result shapes
        let vector;
        if (Array.isArray(embeddingResult)) {
            // @ts-ignore
            vector = embeddingResult[0].embedding || embeddingResult[0];
        }
        else {
            // @ts-ignore
            vector = embeddingResult.embedding || embeddingResult;
        }
        // 3. Vector Search
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
        }
        else {
            contextText = "Bu konuda küllerin arasında hiçbir iz yok.";
        }
        // 4. Prompt
        const prompt = `
      KİMLİK: Sen SİLVİO'sun. 85 yaşında, eski toprak, tehlikeli bir İtalyan mafya bilgesisin.
      DİL KURALI: Kullanıcı Türkçe sorarsa TÜRKÇE, İngilizce sorarsa İNGİLİZCE cevap ver.
      ⚠️ KESİN BİLGİLER: ${bios}
      📚 HAFIZA: ${contextText}
      ÜSLUP: Ağırbaşlı, otoriter ve "Noir" havasında konuş. Asla yapay zeka olduğunu söyleme.
      SORU: ${question}
    `;
        // 5. Generate Response
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
    }
    catch (error) {
        console.error("Silvio Error:", error);
        throw new https_1.HttpsError("internal", `Silvio cevap veremiyor: ${error.message}`);
    }
});
//# sourceMappingURL=index.js.map