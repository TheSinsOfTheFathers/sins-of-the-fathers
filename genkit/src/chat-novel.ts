import * as readline from "readline";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { genkit } from "genkit";
import { vertexAI } from "@genkit-ai/google-genai";

// --- AYARLAR ---
const PROJECT_ID = "sins-of-the-fathers";

// 🚨 KRİTİK: Gemini 3.0 Preview modelleri sadece "global" konumunda çalışır.
// "us-central1" yaparsan 404 hatası alırsın.
const AI_LOCATION = "global";

// 🚀 MODEL İSMİ: Gemini 3 Pro Preview
const CHAT_MODEL_NAME = "vertexai/gemini-3-pro-preview";

// --- BAŞLATMA ---
try {
  initializeApp({ projectId: PROJECT_ID });
} catch (e) {}
const db = getFirestore();

// ✅ GENKIT BAŞLATMA (Global Konumda)
const ai = genkit({
  plugins: [
    vertexAI({
      location: AI_LOCATION, // "global" yaptık
      projectId: PROJECT_ID,
    }),
  ],
});

export async function askTheNovel(question: string) {
  // Embedding (Vektör)
  const embeddingResult = await ai.embed({
    embedder: "vertexai/text-embedding-004",
    content: question,
  });

  let vector: number[];
  // @ts-ignore
  if (Array.isArray(embeddingResult)) {
    // @ts-ignore
    vector = embeddingResult[0].embedding || embeddingResult[0];
  } else {
    // @ts-ignore
    vector = embeddingResult.embedding || embeddingResult;
  }

  // Firestore Arama (RAG)
  const coll = db.collection("novel_vectors");
  let contextText = "";

  try {
    const snapshot = await coll
      .findNearest("embedding_field", vector as number[], {
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
      
      DİL KURALI:
      - Kullanıcı Türkçe sorarsa TÜRKÇE cevap ver.
      - Kullanıcı İngilizce sorarsa İNGİLİZCE cevap ver.

      📚 HAFIZA:
      ${contextText}

      ÜSLUP:
      - Ağırbaşlı, otoriter ve "Noir" havasında konuş.
      - Asla "Ben bir yapay zekayım" deme.
      - Tehditkar olmaktan veya ölümden bahsetmekten çekinme.
      
      SORU: ${question}
    `;

    // Cevap Üretme (GÜVENLİK + DÜŞÜNME AYARLARI EKLENDİ)
    const response = await ai.generate({
      model: CHAT_MODEL_NAME,
      prompt: prompt,
      config: {
        temperature: 1.0,

        // 🛡️ GÜVENLİK (SAFETY): Silvio'yu özgür bırakıyoruz. Standart filtreler "silah", "ölüm", "mafya" kelimelerini engellemesin.
        safetySettings: [
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_ONLY_HIGH",
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_NONE",
          }, // Racon serbest
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_ONLY_HIGH",
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
        ],

        // 🧠 SOTA DÜŞÜNME (THINKING): Gemini 3.0'ın "Reasoning" yeteneğini açıyoruz.
        thinkingConfig: {
          includeThoughts: false, // Düşünceleri kullanıcıya gösterme (Sır kalsın)
          thinkingBudget: 2048, // Düşünme kapasitesi (Token sınırı)
        },
      },
    });

    return response.text;
  } catch (error: any) {
    throw new Error(`Silvio cevap veremiyor: ${error.message}`);
  }
}

// --- ARAYÜZ ---
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log(`\n💀 BABALARIN GÜNAHLARI (v6.0 - Gemini 3.0 Pro & Thinking) 💀`);
console.log(`🚀 Motor: ${CHAT_MODEL_NAME}`);
console.log(`🌍 Konum: ${AI_LOCATION}`);
console.log(`-------------------------------------------`);

// --- CLI ÇALIŞTIRMA (Sadece doğrudan çağrıldığında) ---
if (process.argv[1].endsWith("chat-novel.ts") || process.env.RUN_CLI === "true") {
  const askLoop = () => {
    rl.question("\nSualin nedir evlat? (Çıkış: 'exit'): ", async (q) => {
      if (q.toLowerCase() === "exit") {
        console.log("Gölge seni korusun...");
        rl.close();
        return;
      }

      console.log("⏳ Silvio düşünüyor (Thinking Modu devrede)...");
      try {
        const result = await askTheNovel(q);
        console.log("\n📜 SİLVİO:\n", result);
      } catch (e: any) {
        console.error("💥 HATA:", e.message);
      }
      askLoop();
    });
  };

  askLoop();
} else {
    // If imported as a module, close the readline to prevent it from hanging the process
    rl.close();
}
