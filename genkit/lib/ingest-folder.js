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
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
const app_1 = require("firebase-admin/app");
const genkit_1 = require("genkit");
const google_genai_1 = require("@genkit-ai/google-genai");
// --- AYARLAR ---
const PROJECT_ID = "sins-of-the-fathers";
// ÖNEMLİ: Gemini 3 ve yeni modeller için ABD merkezini kullanmak en garantisidir.
const LOCATION = "us-central1";
const TARGET_DIRECTORY = String.raw `C:\Users\SOFT\iCloudDrive\iCloud~md~obsidian\Benim Kasam\Babaların Günahları\Kitap\Babaların Günahları\Bölümler`;
// --- BAŞLATMA ---
try {
    (0, app_1.initializeApp)({ projectId: PROJECT_ID });
}
catch (e) { }
const db = (0, firestore_1.getFirestore)();
const ai = (0, genkit_1.genkit)({
    plugins: [(0, google_genai_1.vertexAI)({ location: LOCATION, projectId: PROJECT_ID })],
});
// --- YARDIMCI FONKSİYONLAR ---
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function getAllFiles(dirPath, arrayOfFiles = []) {
    const files = fs.readdirSync(dirPath);
    files.forEach((file) => {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
        }
        else {
            if (file.endsWith(".md") || file.endsWith(".txt")) {
                arrayOfFiles.push(fullPath);
            }
        }
    });
    return arrayOfFiles;
}
function chunkText(text, maxCharLength = 1000) {
    const paragraphs = text.split(/\n\s*\n/);
    const chunks = [];
    let currentChunk = "";
    for (const para of paragraphs) {
        if ((currentChunk + para).length > maxCharLength) {
            if (currentChunk.trim().length > 0)
                chunks.push(currentChunk.trim());
            currentChunk = para;
        }
        else {
            currentChunk += "\n\n" + para;
        }
    }
    if (currentChunk.trim().length > 0)
        chunks.push(currentChunk.trim());
    return chunks;
}
async function processChunkWithRetry(chunkText, metadata, collectionRef, retryCount = 0) {
    const MAX_RETRIES = 5;
    const safeFileName = metadata.source_file.replace(/[^a-zA-Z0-9]/g, "_");
    const docId = `${safeFileName}_chunk_${metadata.chunk_index}`;
    try {
        // Gemini Embedding
        const embeddingResult = await ai.embed({
            embedder: "vertexai/text-embedding-004",
            content: chunkText,
        });
        const rawData = embeddingResult;
        let vector;
        if (Array.isArray(rawData))
            vector = rawData[0].embedding;
        else if (rawData.embedding)
            vector = rawData.embedding;
        else
            vector = rawData;
        // Firestore Vektör Formatında Kaydet
        await collectionRef.doc(docId).set({
            text: chunkText,
            embedding_field: firestore_1.FieldValue.vector(vector),
            metadata: Object.assign(Object.assign({}, metadata), { ingested_at: admin.firestore.FieldValue.serverTimestamp() }),
        });
        return true;
    }
    catch (error) {
        const errString = JSON.stringify(error) + error.toString();
        if ((errString.includes("429") || errString.includes("Quota")) &&
            retryCount < MAX_RETRIES) {
            const waitTime = 10000 * Math.pow(2, retryCount);
            console.log(`   🛑 Kota Limiti! ${waitTime / 1000}sn bekleniyor...`);
            await sleep(waitTime);
            return processChunkWithRetry(chunkText, metadata, collectionRef, retryCount + 1);
        }
        else {
            throw error;
        }
    }
}
async function ingestFolder() {
    console.log(`📂 Klasör taranıyor... Bölge: ${LOCATION}`);
    if (!fs.existsSync(TARGET_DIRECTORY)) {
        console.error(`❌ Klasör bulunamadı.`);
        return;
    }
    const files = getAllFiles(TARGET_DIRECTORY);
    const collectionRef = db.collection("novel_vectors");
    let totalChunks = 0;
    for (const filePath of files) {
        const fileName = path.basename(filePath);
        console.log(`\n📄 İşleniyor: ${fileName}`);
        const rawContent = fs.readFileSync(filePath, "utf-8");
        const chunks = chunkText(rawContent);
        for (const [index, chunkText] of chunks.entries()) {
            if (chunkText.length < 50)
                continue;
            await processChunkWithRetry(chunkText, {
                source_file: fileName,
                chunk_index: index,
                file_path: filePath,
            }, collectionRef);
            totalChunks++;
            await sleep(1000);
        }
    }
    console.log(`\n✅ Yükleme Tamamlandı! Toplam Vektör: ${totalChunks}`);
}
ingestFolder().catch(console.error);
//# sourceMappingURL=ingest-folder.js.map