import express from "express";
import cors from "cors";
import { askTheNovel } from "./chat-novel.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "alive" });
});

// AI Chat Endpoint
app.post("/api/ask", async (req, res) => {
  const { question } = req.body;

  if (!question) {
    return res.status(400).json({ error: "Sualin nedir evlat?" });
  }

  console.log(`[AI REQUEST]: ${question}`);

  try {
    const response = await askTheNovel(question);
    return res.json({ response });
  } catch (error: any) {
    console.error("[AI ERROR]:", error);
    return res.status(500).json({ 
      error: "Silvio şu an meşgul.",
      details: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`\n💀 SILVIO BACKEND ONLINE 💀`);
  console.log(`🚀 URL: http://localhost:${PORT}`);
  console.log(`📡 Endpoints: GET /health, POST /api/ask`);
  console.log(`-------------------------------------------`);
});
