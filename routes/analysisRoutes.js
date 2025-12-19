import express from "express";
import multer from "multer";
import {
  uploadResume,
  getAllAnalyses,
} from "../controllers/analysisController.js";

const router = express.Router();

/* =========================
   Multer configuration
   ========================= */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

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
