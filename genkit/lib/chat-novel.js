"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.askTheNovel = askTheNovel;
const readline = __importStar(require("readline"));
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const genkit_1 = require("genkit");
const google_genai_1 = require("@genkit-ai/google-genai");
// --- AYARLAR ---
const PROJECT_ID = "sins-of-the-fathers";
// 🚨 KRİTİK: Gemini 3.0 Preview modelleri sadece "global" konumunda çalışır.
// "us-central1" yaparsan 404 hatası alırsın.
const AI_LOCATION = "global";
// 🚀 MODEL İSMİ: Gemini 3 Pro Preview
const CHAT_MODEL_NAME = "vertexai/gemini-3-pro-preview";
// --- KARAKTER VERİTABANI ---
const CHARACTER_DB = {
    silvio: "Silvio: 85 yaşında, anlatıcı, bilge, manipülatif akıl hocası. Racon keser.",
    roland: "Roland: Ana karakter, 'Karga'. Hırslı, duygusuzlaşmaya çalışan lider.",
    fabio: "Fabio: Umberto'nun oğlu. Onurlu olmaya çalıştı ama Roland'a karşı kaybetti.",
    umberto: "Umberto: Fabio'nun babası ve ailenin finansçısı (Muhasebeci).",
    aurelia: "Aurelia: Roland'ın geçmişindeki kadın, onun zayıf noktası.",
    riccardo: "Riccardo: Kas gücü, sadık tetikçi, sonu kötü biter.",
};
// --- BAŞLATMA ---
try {
    (0, app_1.initializeApp)({ projectId: PROJECT_ID });
}
catch (e) { }
const db = (0, firestore_1.getFirestore)();
// ✅ GENKIT BAŞLATMA (Global Konumda)
const ai = (0, genkit_1.genkit)({
    plugins: [
        (0, google_genai_1.vertexAI)({
            location: AI_LOCATION, // "global" yaptık
            projectId: PROJECT_ID,
        }),
    ],
});
async function askTheNovel(question) {
    // 1. Karakter Analizi
    const questionLower = question.toLowerCase();
    let relevantCharacterBios = "";
    Object.keys(CHARACTER_DB).forEach((key) => {
        if (questionLower.includes(key)) {
            relevantCharacterBios += `- ${CHARACTER_DB[key]}\n`;
        }
    });
    if (!relevantCharacterBios) {
        relevantCharacterBios = `- ${CHARACTER_DB["silvio"]}\n- ${CHARACTER_DB["roland"]}`;
    }
    // 2. Embedding (Vektör)
    // Global konumda da "vertexai/" prefix'i ile çalışır.
    const embeddingResult = await ai.embed({
        embedder: "vertexai/text-embedding-004",
        content: question,
    });
    // Veriyi güvenli alma
    let vector;
    // @ts-ignore
    if (Array.isArray(embeddingResult)) {
        // @ts-ignore
        vector = embeddingResult[0].embedding || embeddingResult[0];
    }
    else {
        // @ts-ignore
        vector = embeddingResult.embedding || embeddingResult;
    }
    // 3. Firestore Arama (RAG)
    const coll = db.collection("novel_vectors");
    let contextText = "";
    try {
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
      
      DİL KURALI:
      - Kullanıcı Türkçe sorarsa TÜRKÇE cevap ver.
      - Kullanıcı İngilizce sorarsa İNGİLİZCE cevap ver.
      
      ⚠️ KESİN BİLGİLER:
      ${relevantCharacterBios}

      📚 HAFIZA:
      ${contextText}

      ÜSLUP:
      - Ağırbaşlı, otoriter ve "Noir" havasında konuş.
      - Asla "Ben bir yapay zekayım" deme.
      - Tehditkar olmaktan veya ölümden bahsetmekten çekinme.
      
      SORU: ${question}
    `;
        // 5. Cevap Üretme (GÜVENLİK + DÜŞÜNME AYARLARI EKLENDİ)
        const response = await ai.generate({
            model: CHAT_MODEL_NAME,
            prompt: prompt,
            config: {
                temperature: 1.0,
                // 🛡️ GÜVENLİK (SAFETY): Silvio'yu özgür bırakıyoruz.
                // Standart filtreler "silah", "ölüm", "mafya" kelimelerini engellemesin.
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
                // 🧠 SOTA DÜŞÜNME (THINKING):
                // Gemini 3.0'ın "Reasoning" yeteneğini açıyoruz.
                thinkingConfig: {
                    includeThoughts: false, // Düşünceleri kullanıcıya gösterme (Sır kalsın)
                    thinkingBudget: 2048, // Düşünme kapasitesi (Token sınırı)
                },
            },
        });
        return response.text;
    }
    catch (error) {
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
            }
            catch (e) {
                console.error("💥 HATA:", e.message);
            }
            askLoop();
        });
    };
    askLoop();
}
else {
    // If imported as a module, close the readline to prevent it from hanging the process
    rl.close();
}
//# sourceMappingURL=chat-novel.js.map