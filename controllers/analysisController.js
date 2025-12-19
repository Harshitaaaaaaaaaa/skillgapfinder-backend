import { createRequire } from "module";
import Analysis from "../models/Analysis.js";
import extractSkills from "../utils/extractSkills.js";
import generateGroqSuggestions from "../utils/groqSuggestions.js";
import axios from "axios";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

/* =========================
   Upload Resume & Analyze
   ========================= */
const uploadResume = async (req, res) => {
  try {
    if (!req.file || !req.body.jobDescription) {
      return res.status(400).json({
        message: "PDF resume or job description missing",
      });
    }

    /* ---------- 1️⃣ Read PDF (RENDER SAFE) ---------- */
    const pdfData = await pdfParse(req.file.buffer);

    const resumeText = pdfData.text || "";
    const jobDescription = req.body.jobDescription;

    /* ---------- 2️⃣ Extract skills ---------- */
    const resumeSkills = extractSkills(resumeText);
    const jdSkills = extractSkills(jobDescription);

    /* ---------- 3️⃣ Matched & missing skills ---------- */
    const matchedSkills = resumeSkills.filter((skill) =>
      jdSkills.includes(skill)
    );

    const missingSkills = jdSkills.filter(
      (skill) => !resumeSkills.includes(skill)
    );

    /* ---------- 4️⃣ Skill match % ---------- */
    const skillMatchPercentage = jdSkills.length
      ? Math.round((matchedSkills.length / jdSkills.length) * 100)
      : 0;

    /* ---------- 5️⃣ Call Python ML Service ---------- */
    console.log("ML_SERVICE_URL =", process.env.ML_SERVICE_URL);

    const mlResponse = await axios.post(
      `${process.env.ML_SERVICE_URL}/analyze`,
      {
        resumeText,
        jobDescription,
      }
    );

    const mlMatchPercentage = mlResponse.data.matchPercentage || 0;

    /* ---------- 6️⃣ Final hybrid score ---------- */
    const finalMatchPercentage = Math.round(
      0.6 * skillMatchPercentage + 0.4 * mlMatchPercentage
    );

    /* ---------- 7️⃣ Save to MongoDB ---------- */
    const analysis = await Analysis.create({
      resumeText,
      jobDescription,
      resumeSkills,
      jdSkills,
      matchedSkills,
      missingSkills,
      matchPercentage: finalMatchPercentage,
    });

    /* ---------- 8️⃣ Groq AI Suggestions ---------- */
    let aiSuggestions = {};
    try {
      aiSuggestions = await generateGroqSuggestions({
        matchedSkills,
        missingSkills,
        finalMatchPercentage,
        jobDescription,
      });
    } catch (err) {
      console.error("Groq AI error:", err.message);
    }

    /* ---------- 9️⃣ Send response ---------- */
    return res.status(201).json({
      message: "Analysis completed successfully 🎉",
      result: {
        resumeSkills,
        jdSkills,
        matchedSkills,
        missingSkills,
        skillMatchPercentage,
        mlMatchPercentage,
        finalMatchPercentage,
        aiSuggestions,
      },
      id: analysis._id,
    });
  } catch (error) {
    console.error("UPLOAD ERROR:", error);
    return res.status(500).json({
      message: "Resume analysis failed",
    });
  }
};

/* =========================
   Get All Analyses
   ========================= */
const getAllAnalyses = async (req, res) => {
  try {
    const analyses = await Analysis.find().sort({ createdAt: -1 });
    res.json(analyses);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch analyses",
    });
  }
};

export { uploadResume, getAllAnalyses };
