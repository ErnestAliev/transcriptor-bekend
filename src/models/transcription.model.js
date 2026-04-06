import mongoose from "mongoose";

const factSchema = new mongoose.Schema(
  {
    value: { type: String, default: "" },
    context: { type: String, default: "" }
  },
  { _id: false }
);

const participantSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    role: { type: String, default: "" }
  },
  { _id: false }
);

const summarySchema = new mongoose.Schema(
  {
    headline: { type: String, default: "" },
    overview: { type: String, default: "" },
    language: { type: String, default: "" },
    keyFacts: { type: [String], default: [] },
    dates: { type: [factSchema], default: [] },
    amountsAndNumbers: { type: [factSchema], default: [] },
    participants: { type: [participantSchema], default: [] },
    actionItems: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    cautionNotes: { type: [String], default: [] }
  },
  { _id: false }
);

const transcriptionSchema = new mongoose.Schema(
  {
    ownerId: { type: String, required: true, index: true },
    fileName: { type: String, required: true },
    fileSize: { type: Number, required: true },
    mimeType: { type: String, default: "" },
    requestedLanguage: { type: String, default: "auto" },
    detectedLanguage: { type: String, default: "" },
    durationSeconds: { type: Number, default: null },
    status: {
      type: String,
      enum: ["processing", "completed", "failed"],
      default: "processing"
    },
    transcriptText: { type: String, default: "" },
    transcriptModel: { type: String, default: "" },
    summaryModel: { type: String, default: "" },
    summary: { type: summarySchema, default: null },
    errorMessage: { type: String, default: "" }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

transcriptionSchema.index({ ownerId: 1, createdAt: -1 });
transcriptionSchema.index({ ownerId: 1, fileName: "text", transcriptText: "text" });

export const Transcription = mongoose.model("Transcription", transcriptionSchema);
