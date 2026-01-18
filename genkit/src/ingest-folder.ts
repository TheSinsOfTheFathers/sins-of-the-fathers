import * as fs from "fs";
import * as path from "path";
import * as admin from "firebase-admin";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { initializeApp } from "firebase-admin/app";
import { genkit } from "genkit";
import { vertexAI } from "@genkit-ai/google-genai";

// --- AYARLAR ---
const PROJECT_ID = "sins-of-the-fathers";
// ÖNEMLİ: Gemini 3 ve yeni modeller için ABD merkezini kullanmak en garantisidir.
const LOCATION = "us-central1";
const TARGET_DIRECTORY = String.raw`C:\Users\SOFT\iCloudDrive\iCloud~md~obsidian\Benim Kasam\Babaların Günahları\Kitap\Babaların Günahları\Bölümler`;

// --- BAŞLATMA ---
try {
  initializeApp({ projectId: PROJECT_ID });
} catch (e) {}

const db = getFirestore();
const ai = genkit({
  plugins: [vertexAI({ location: LOCATION, projectId: PROJECT_ID })],
});

// --- YARDIMCI FONKSİYONLAR ---
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []) {
  const files = fs.readdirSync(dirPath);
  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      if (file.endsWith(".md") || file.endsWith(".txt")) {
        arrayOfFiles.push(fullPath);
      }
    }
  });
  return arrayOfFiles;
}

function chunkText(text: string, maxCharLength = 1000): string[] {
  const paragraphs = text.split(/\n\s*\n/);
  const chunks: string[] = [];
  let currentChunk = "";
  for (const para of paragraphs) {
    if ((currentChunk + para).length > maxCharLength) {
      if (currentChunk.trim().length > 0) chunks.push(currentChunk.trim());
      currentChunk = para;
    } else {
      currentChunk += "\n\n" + para;
    }
  }
  if (currentChunk.trim().length > 0) chunks.push(currentChunk.trim());
  return chunks;
}

async function processChunkWithRetry(
  chunkText: string,
  metadata: any,
  collectionRef: any,
  retryCount = 0
) {
  const MAX_RETRIES = 5;
  const safeFileName = metadata.source_file.replace(/[^a-zA-Z0-9]/g, "_");
  const docId = `${safeFileName}_chunk_${metadata.chunk_index}`;

  try {
    // Gemini Embedding
    const embeddingResult = await ai.embed({
      embedder: "vertexai/text-embedding-004",
      content: chunkText,
    });

    const rawData = embeddingResult as any;
    let vector: number[];
    if (Array.isArray(rawData)) vector = rawData[0].embedding;
    else if (rawData.embedding) vector = rawData.embedding;
    else vector = rawData as number[];

    // Firestore Vektör Formatında Kaydet
    await collectionRef.doc(docId).set({
      text: chunkText,
      embedding_field: FieldValue.vector(vector),
      metadata: {
        ...metadata,
        ingested_at: admin.firestore.FieldValue.serverTimestamp(),
      },
    });
    return true;
  } catch (error: any) {
    const errString = JSON.stringify(error) + error.toString();
    if (
      (errString.includes("429") || errString.includes("Quota")) &&
      retryCount < MAX_RETRIES
    ) {
      const waitTime = 10000 * Math.pow(2, retryCount);
      console.log(`   🛑 Kota Limiti! ${waitTime / 1000}sn bekleniyor...`);
      await sleep(waitTime);
      return processChunkWithRetry(
        chunkText,
        metadata,
        collectionRef,
        retryCount + 1
      );
    } else {
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
      if (chunkText.length < 50) continue;
      await processChunkWithRetry(
        chunkText,
        {
          source_file: fileName,
          chunk_index: index,
          file_path: filePath,
        },
        collectionRef
      );
      totalChunks++;
      await sleep(1000);
    }
  }
  console.log(`\n✅ Yükleme Tamamlandı! Toplam Vektör: ${totalChunks}`);
}

ingestFolder().catch(console.error);
