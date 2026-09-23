require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const pdfParse = (() => {
  try { return require("pdf-parse"); } catch (_) { return null; }
})();

const { GoogleGenAI } = require("@google/genai");

const app = express();
const PORT = process.env.PORT || 3000;
const upload = multer({ dest: path.join(__dirname, "uploads"), limits: { fileSize: 10 * 1024 * 1024 } });

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname, "public")));

function getAI() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured. Add it to .env");
  }
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

async function generate(prompt) {
  const ai = getAI();
  const result = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt
  });
  return result.text || "No response generated.";
}

app.get("/api/health", (req, res) => {
  res.json({ ok: true, geminiConfigured: Boolean(process.env.GEMINI_API_KEY) });
});

app.post("/api/ask", async (req, res) => {
  try {
    const { question, subject = "General" } = req.body;
    if (!question?.trim()) return res.status(400).json({ error: "Question is required." });
    const prompt = `You are EduGenie, a student-friendly AI tutor.
Subject: ${subject}
Student question: ${question}

Answer in simple, accurate language. Use headings, examples, bullet points, and a short recap when useful.
Do not pretend to know facts that are uncertain.`;
    res.json({ answer: await generate(prompt) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/notes", async (req, res) => {
  try {
    const { topic, subject = "General", level = "College" } = req.body;
    if (!topic?.trim()) return res.status(400).json({ error: "Topic is required." });
    const prompt = `Create revision notes for a ${level} student.
Subject: ${subject}
Topic: ${topic}
Include: definition, key concepts, important points, a small example, common mistakes, and 5 quick revision questions.`;
    res.json({ answer: await generate(prompt) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/quiz", async (req, res) => {
  try {
    const { topic, subject = "General", difficulty = "Medium", count = 5 } = req.body;
    if (!topic?.trim()) return res.status(400).json({ error: "Topic is required." });
    const prompt = `Create ${Math.min(Number(count) || 5, 15)} multiple-choice questions.
Subject: ${subject}
Topic: ${topic}
Difficulty: ${difficulty}
Return ONLY valid JSON as an array:
[{"question":"...","options":["A","B","C","D"],"answer":0,"explanation":"..."}]
answer must be the zero-based option index.`;
    const raw = await generate(prompt);
    const clean = raw.replace(/```json|```/g, "").trim();
    let quiz;
    try { quiz = JSON.parse(clean); } catch (_) { quiz = []; }
    res.json({ quiz, raw });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/flashcards", async (req, res) => {
  try {
    const { topic, subject = "General", count = 8 } = req.body;
    if (!topic?.trim()) return res.status(400).json({ error: "Topic is required." });
    const prompt = `Create ${Math.min(Number(count) || 8, 20)} revision flashcards for ${subject}: ${topic}.
Return ONLY valid JSON:
[{"question":"...","answer":"..."}]`;
    const raw = await generate(prompt);
    let cards;
    try { cards = JSON.parse(raw.replace(/```json|```/g, "").trim()); } catch (_) { cards = []; }
    res.json({ cards, raw });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/exam", async (req, res) => {
  try {
    const { subject, topics, examDate } = req.body;
    const prompt = `Create an exam-preparation plan.
Subject: ${subject || "General"}
Topics: ${topics || "Major syllabus topics"}
Exam date: ${examDate || "not specified"}
Return: priority topics, 7-day revision strategy, important concepts, likely practice areas, and a final-day checklist.
Keep it practical and student-friendly.`;
    res.json({ answer: await generate(prompt) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/pdf", upload.single("pdf"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "PDF file is required." });
  if (!pdfParse) {
    fs.unlink(req.file.path, () => {});
    return res.status(500).json({ error: "PDF parser dependency is unavailable. Run npm install." });
  }
  try {
    const buffer = fs.readFileSync(req.file.path);
    const parsed = await pdfParse(buffer);
    const text = (parsed.text || "").slice(0, 30000);
    const action = req.body.action || "summary";
    const prompt = `You are EduGenie learning assistant.
The student uploaded study material. Perform this task: ${action}
Use ONLY the supplied material where possible. If the material is insufficient, clearly say so.
Study material:
${text}`;
    const answer = await generate(prompt);
    res.json({ filename: req.file.originalname, answer, extractedCharacters: text.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally {
    fs.unlink(req.file.path, () => {});
  }
});

app.get("*", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

app.listen(PORT, () => console.log(`EduGenie running at http://localhost:${PORT}`));