import "dotenv/config";

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: toNumber(process.env.PORT, 8080),
  mongoUri: process.env.MONGODB_URI ?? "",
  openAiApiKey: process.env.OPENAI_API_KEY ?? "",
  transcriptionModel: process.env.OPENAI_TRANSCRIPTION_MODEL ?? "gpt-4o-transcribe",
  summaryModel: process.env.OPENAI_SUMMARY_MODEL ?? "gpt-4.1-mini",
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  userIdHeader: (process.env.USER_ID_HEADER ?? "x-user-id").toLowerCase(),
  maxFileSizeMb: toNumber(process.env.MAX_FILE_SIZE_MB, 25)
};

export function validateEnv() {
  const missing = ["MONGODB_URI", "OPENAI_API_KEY"].filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}
