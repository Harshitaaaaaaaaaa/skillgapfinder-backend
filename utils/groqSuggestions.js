import Groq from "groq-sdk";

/* =========================
   Clean Markdown JSON
   ========================= */
function cleanJSON(text) {
  if (!text || typeof text !== "string") return "";
  return text.replace(/```json|```/g, "").trim();
}

/* =========================
   Remove Empty / Placeholder Lines
   ========================= */
function cleanList(arr) {
  if (!Array.isArray(arr)) return [];

  return arr.filter(
    (item) =>
      typeof item === "string" &&
      item.trim().length > 10 &&
      !/^(tip|task):?$/i.test(item.trim())
  );
}

/* =========================
   Fallback Response
   ========================= */
const FALLBACK_RESPONSE = {
  evaluation: "AI suggestions are temporarily unavailable.",
  prioritySkills: [],
  roadmap: [],
  resumeTips: [],
};

/* =========================
   Generate Groq Suggestions
   ========================= */
async function generateGroqSuggestions({
  matchedSkills,
  missingSkills,
  finalMatchPercentage,
  jobDescription,
}) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY not found");
  }

  const groq = new Groq({ apiKey });

  const prompt = `
You are an AI career assistant.

Job Description:
${jobDescription}

Matched Skills:
${matchedSkills.join(", ") || "None"}

Missing Skills:
${missingSkills.join(", ") || "None"}

Overall Match Percentage:
${finalMatchPercentage}%

TASK:
Respond ONLY in valid JSON.

Rules (VERY IMPORTANT):
- DO NOT use placeholders like "Task:" or "Tip:"
- EVERY line must contain meaningful text
- Keep responses SHORT (1 line each)

Required JSON format:
{
  "evaluation": "1 short sentence",
  "prioritized_skills": [
    "Skill – Priority – Reason"
  ],
  "learning_roadmap": [
    "One clear actionable learning task"
  ],
  "resume_improvement_tips": [
    "One concrete resume improvement tip"
  ]
}

Limits:
- prioritized_skills: exactly 3 items
- learning_roadmap: exactly 3 items
- resume_improvement_tips: exactly 3 items

JSON ONLY. No markdown.
`;

  /* ---------- Call Groq ---------- */
  let completion;
  try {
    completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      max_tokens: 300,
    });
  } catch (error) {
    console.error("❌ Groq API error:", error.message);
    return FALLBACK_RESPONSE;
  }

  const raw = completion?.choices?.[0]?.message?.content;
  if (!raw) {
    console.warn("⚠️ Empty AI response");
    return FALLBACK_RESPONSE;
  }

  /* ---------- Parse JSON Safely ---------- */
  let parsed;
  try {
    const cleaned = cleanJSON(raw);
    parsed = JSON.parse(cleaned);
  } catch (error) {
    console.error("❌ JSON parse failed:", error.message);
    return FALLBACK_RESPONSE;
  }

  /* =========================
     Normalize AI Output
     ========================= */

  const evaluation =
    typeof parsed.evaluation === "string"
      ? parsed.evaluation
      : FALLBACK_RESPONSE.evaluation;

  const prioritySkills = cleanList(parsed.prioritized_skills);
  const roadmap = cleanList(parsed.learning_roadmap);
  const resumeTips = cleanList(parsed.resume_improvement_tips);

  /* ---------- Final Safe Object ---------- */
  return {
    evaluation,
    prioritySkills,
    roadmap,
    resumeTips,
  };
}

export default generateGroqSuggestions;
