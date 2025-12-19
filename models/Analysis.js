import mongoose from "mongoose";

const analysisSchema = new mongoose.Schema(
  {
    resumeText: String,
    jobDescription: String,

    resumeSkills: [String],
    jdSkills: [String],
    matchedSkills: [String],
    missingSkills: [String],
    matchPercentage: Number,
  },
  { timestamps: true }
);

const Analysis = mongoose.model("Analysis", analysisSchema);

export default Analysis;
