import express from "express";
import multer from "multer";
import {
  uploadResume,
  getAllAnalyses,
} from "../controllers/analysisController.js";

const router = express.Router();

/* =========================
   Multer configuration (RENDER SAFE)
   ========================= */
const upload = multer({
  storage: multer.memoryStorage(), // ✅ IMPORTANT
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});

/* =========================
   Routes
   ========================= */

// GET → fetch all saved analyses
// URL: /api/resume
router.get("/", getAllAnalyses);

// POST → upload resume PDF
// URL: /api/resume/upload
router.post("/upload", upload.single("resume"), uploadResume);

export default router;
