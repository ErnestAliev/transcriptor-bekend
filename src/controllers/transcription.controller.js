import mongoose from "mongoose";
import { Transcription } from "../models/transcription.model.js";
import { createTranscription, regenerateSummary } from "../services/transcription.service.js";
import { serializeHistoryItem, serializeTranscription } from "../utils/serializers.js";

const parseDuration = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function listTranscriptions(req, res) {
  const search = String(req.query.q ?? "").trim();
  const filter = { ownerId: req.userId };

  if (search) {
    const pattern = new RegExp(escapeRegex(search), "i");
    filter.$or = [{ fileName: pattern }, { transcriptText: pattern }];
  }

  const documents = await Transcription.find(filter).sort({ createdAt: -1 }).limit(100);

  res.json({
    items: documents.map(serializeHistoryItem)
  });
}

export async function getTranscription(req, res) {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({
      message: "Invalid transcription id."
    });
  }

  const document = await Transcription.findOne({
    _id: req.params.id,
    ownerId: req.userId
  });

  if (!document) {
    return res.status(404).json({
      message: "Transcription not found."
    });
  }

  return res.json({
    item: serializeTranscription(document)
  });
}

export async function uploadTranscription(req, res) {
  if (!req.file) {
    return res.status(400).json({
      message: "Audio file is required."
    });
  }

  const document = await createTranscription({
    ownerId: req.userId,
    file: req.file,
    requestedLanguage: String(req.body.language ?? "auto").trim() || "auto",
    durationSeconds: parseDuration(req.body.durationSeconds)
  });

  return res.status(201).json({
    item: serializeTranscription(document)
  });
}

export async function rerunSummary(req, res) {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({
      message: "Invalid transcription id."
    });
  }

  const document = await regenerateSummary({
    transcriptionId: req.params.id,
    ownerId: req.userId
  });

  return res.json({
    item: serializeTranscription(document)
  });
}
