"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const chat_novel_js_1 = require("./chat-novel.js");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
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
        const response = await (0, chat_novel_js_1.askTheNovel)(question);
        return res.json({ response });
    }
    catch (error) {
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
//# sourceMappingURL=server.js.map