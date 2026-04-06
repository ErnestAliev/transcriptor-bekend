import { env } from "../config/env.js";
import { Transcription } from "../models/transcription.model.js";
import { summarizeTranscript, transcribeAudioFile } from "./openai.service.js";

function normalizeStringArray(items) {
  return Array.isArray(items) ? items.filter(Boolean).map((item) => String(item).trim()) : [];
}

function normalizeFactArray(items) {
  return Array.isArray(items)
    ? items
        .filter((item) => item?.value || item?.context)
        .map((item) => ({
          value: String(item.value ?? "").trim(),
          context: String(item.context ?? "").trim()
        }))
    : [];
}

function normalizeParticipants(items) {
  return Array.isArray(items)
    ? items
        .filter((item) => item?.name || item?.role)
        .map((item) => ({
          name: String(item.name ?? "").trim(),
          role: String(item.role ?? "").trim()
        }))
    : [];
}

function normalizeSummary(summary) {
  return {
    headline: String(summary.headline ?? "").trim(),
    overview: String(summary.overview ?? "").trim(),
    language: String(summary.language ?? "").trim(),
    keyFacts: normalizeStringArray(summary.keyFacts),
    dates: normalizeFactArray(summary.dates),
    amountsAndNumbers: normalizeFactArray(summary.amountsAndNumbers),
    participants: normalizeParticipants(summary.participants),
    actionItems: normalizeStringArray(summary.actionItems),
    tags: normalizeStringArray(summary.tags),
    cautionNotes: normalizeStringArray(summary.cautionNotes)
  };
}

export async function createTranscription({ ownerId, file, requestedLanguage, durationSeconds }) {
  const document = await Transcription.create({
    ownerId,
    fileName: file.originalname,
    fileSize: file.size,
    mimeType: file.mimetype,
    requestedLanguage: requestedLanguage || "auto",
    durationSeconds: Number.isFinite(durationSeconds) ? durationSeconds : null,
    status: "processing",
    transcriptModel: env.transcriptionModel,
    summaryModel: env.summaryModel
  });

  try {
    const transcription = await transcribeAudioFile({
      file,
      language: requestedLanguage
    });

    if (!transcription.text) {
      throw Object.assign(new Error("OpenAI returned an empty transcript."), {
        statusCode: 502
      });
    }

    const summary = await summarizeTranscript(transcription.text);

    document.status = "completed";
    document.transcriptText = transcription.text;
    document.detectedLanguage = summary.language;
    document.summary = normalizeSummary(summary);
    document.errorMessage = "";

    await document.save();

    return document;
  } catch (error) {
    document.status = "failed";
    document.errorMessage = error.message ?? "Transcription failed";

    await document.save();

    throw error;
  }
}

export async function regenerateSummary({ transcriptionId, ownerId }) {
  const document = await Transcription.findOne({
    _id: transcriptionId,
    ownerId
  });

  if (!document) {
    throw Object.assign(new Error("Transcription not found."), {
      statusCode: 404
    });
  }

  if (!document.transcriptText) {
    throw Object.assign(new Error("There is no transcript text to summarize."), {
      statusCode: 400
    });
  }

  const summary = await summarizeTranscript(document.transcriptText);

  document.status = "completed";
  document.detectedLanguage = summary.language;
  document.summary = normalizeSummary(summary);
  document.summaryModel = env.summaryModel;
  document.errorMessage = "";

  await document.save();

  return document;
}
