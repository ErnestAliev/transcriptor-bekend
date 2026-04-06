import multer from "multer";
import path from "path";
import { env } from "../config/env.js";

const allowedExtensions = new Set([
  ".mp3",
  ".mp4",
  ".mpeg",
  ".mpga",
  ".m4a",
  ".wav",
  ".webm",
  ".ogg"
]);

const allowedMimeTypes = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/x-m4a",
  "audio/mpga",
  "audio/wav",
  "audio/x-wav",
  "audio/webm",
  "audio/ogg",
  "video/mp4",
  "application/octet-stream"
]);

function fileFilter(req, file, callback) {
  const extension = path.extname(file.originalname || "").toLowerCase();

  if (allowedExtensions.has(extension) || allowedMimeTypes.has(file.mimetype)) {
    return callback(null, true);
  }

  return callback(
    Object.assign(new Error("Unsupported audio format."), {
      statusCode: 400
    })
  );
}

export const uploadAudio = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.maxFileSizeMb * 1024 * 1024
  },
  fileFilter
});
