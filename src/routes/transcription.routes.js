import { Router } from "express";
import {
  getTranscription,
  listTranscriptions,
  rerunSummary,
  uploadTranscription
} from "../controllers/transcription.controller.js";
import { uploadAudio } from "../middleware/upload.js";
import { asyncHandler } from "../utils/async-handler.js";

const router = Router();

router.get("/", asyncHandler(listTranscriptions));
router.get("/:id", asyncHandler(getTranscription));
router.post("/", uploadAudio.single("audio"), asyncHandler(uploadTranscription));
router.post("/:id/summarize", asyncHandler(rerunSummary));

export default router;
