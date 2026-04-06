import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { env } from "../config/env.js";

const client = new OpenAI({
  apiKey: env.openAiApiKey
});

const factSchema = z.object({
  value: z.string(),
  context: z.string()
});

const participantSchema = z.object({
  name: z.string(),
  role: z.string()
});

const transcriptSummarySchema = z.object({
  headline: z.string(),
  overview: z.string(),
  language: z.string(),
  keyFacts: z.array(z.string()),
  dates: z.array(factSchema),
  amountsAndNumbers: z.array(factSchema),
  participants: z.array(participantSchema),
  actionItems: z.array(z.string()),
  tags: z.array(z.string()),
  cautionNotes: z.array(z.string())
});

export async function transcribeAudioFile({ file, language }) {
  const payload = {
    file: new File([file.buffer], file.originalname, {
      type: file.mimetype || "application/octet-stream"
    }),
    model: env.transcriptionModel,
    response_format: "json"
  };

  if (language && language !== "auto") {
    payload.language = language;
  }

  const transcription = await client.audio.transcriptions.create(payload);

  return {
    text: transcription.text?.trim() ?? ""
  };
}

export async function summarizeTranscript(transcriptText) {
  const response = await client.responses.parse({
    model: env.summaryModel,
    max_output_tokens: 1400,
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text:
              "You convert noisy transcripts into clean structured business notes. " +
              "Keep the output in the same language as the transcript. " +
              "Extract only information present in the transcript. " +
              "When dates, amounts, or numbers are present, preserve them exactly as stated. " +
              "If a section is missing, return an empty array or an empty string instead of inventing details."
          }
        ]
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: `Transcript:\n\n${transcriptText}`
          }
        ]
      }
    ],
    text: {
      format: zodTextFormat(transcriptSummarySchema, "transcript_summary")
    }
  });

  if (!response.output_parsed) {
    throw Object.assign(new Error("The summary response could not be parsed."), {
      statusCode: 502
    });
  }

  return response.output_parsed;
}
