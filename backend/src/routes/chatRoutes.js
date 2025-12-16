const express = require("express");
const router = express.Router();
const OpenAI = require("openai");

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1", 
});

router.post("/", async (req, res) => {
  try {
    const { history = [], message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "message is required" });
    }

    const messages = [
      ...history.map(h => ({
        role: h.role,      
        content: h.content 
      })),
      { role: "user", content: message }
    ];

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile", 
      messages,
      temperature: 0.7,
    });

    const answer = completion.choices?.[0]?.message?.content || "No response";
    return res.json({ answer });

  } catch (err) {
    console.error("GROQ CHAT ERROR:", err?.message || err);

    
    if (String(err?.message || "").includes("429")) {
      return res.status(429).json({
        error: "Groq: превышена free-квота. Подожди или смени ключ/план."
      });
    }

    return res.status(500).json({ error: "Groq request failed" });
  }
});

module.exports = router;
