import { onRequest } from "firebase-functions/v2/https";
import { genkit } from "genkit";
import { vertexAI } from "@genkit-ai/google-genai";
import { REGION, AI_LOCATION, PROJECT_ID, corsHandler, db } from "../config/firebase";

// --- KARAKTER VERİTABANI (SILVIO İÇİN) ---
const CHARACTER_DB: Record<string, string> = {
  silvio: "Silvio: 85 yaşında, anlatıcı, bilge, manipülatif akıl hocası. Racon keser.",
  roland: "Roland: Ana karakter, 'Karga'. Hırslı, duygusuzlaşmaya çalışan lider.",
  fabio: "Fabio: Umberto'nun oğlu. Onurlu olmaya çalıştı ama Roland'a karşı kaybetti.",
  umberto: "Umberto: Fabio'nun babası ve ailenin finansçısı (Muhasebeci).",
  aurelia: "Aurelia: Roland'ın geçmişindeki kadın, onun zayıf noktası.",
  riccardo: "Riccardo: Kas gücü, sadık tetikçi, sonu kötü biter.",
};

// --- GENKIT INIT ---
const ai = genkit({
  plugins: [
    vertexAI({ location: AI_LOCATION, projectId: PROJECT_ID }),
  ],
});


/**
 * 3. Silvio Chatbot (Gemini 3.0 + RAG)
 */
export const askTheNovel = onRequest({ 
  region: REGION, 
  timeoutSeconds: 60,
  memory: "1GiB"
}, async (req, res) => {
  
  corsHandler(req, res, async () => {
    
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

      // B. Embedding
      const embeddingResult = await ai.embed({
        embedder: "vertexai/text-embedding-004",
        content: question,
      });

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

      // E. Cevap Üret
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
