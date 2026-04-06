import OpenAI, { APIConnectionError, APIConnectionTimeoutError, toFile } from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { env } from "../config/env.js";

const client = new OpenAI({
  apiKey: env.openAiApiKey,
  maxRetries: 4,
  timeout: 10 * 60 * 1000
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

const transientStatusCodes = new Set([408, 409, 429, 500, 502, 503, 504]);

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isRetryableError(error) {
  return (
    error instanceof APIConnectionError ||
    error instanceof APIConnectionTimeoutError ||
    transientStatusCodes.has(error?.status)
  );
}

function normalizeOpenAiError(error, actionLabel) {
  const baseMessage =
    error?.error?.message ||
    error?.cause?.message ||
    error?.message ||
    `OpenAI ${actionLabel} request failed.`;

  if (error instanceof APIConnectionError || error instanceof APIConnectionTimeoutError) {
    return Object.assign(
      new Error(
        `OpenAI connection failed during ${actionLabel}. Please retry the upload once more.`
      ),
      {
        statusCode: 503,
        cause: error
      }
    );
  }

  if (transientStatusCodes.has(error?.status)) {
    return Object.assign(new Error(`OpenAI temporarily failed during ${actionLabel}. ${baseMessage}`), {
      statusCode: error.status || 503,
      cause: error
    });
  }

  return Object.assign(new Error(baseMessage), {
    statusCode: error?.status || error?.statusCode || 500,
    cause: error
  });
}

async function withRetry(task, actionLabel) {
  let attempt = 0;

  while (true) {
    try {
      return await task();
    } catch (error) {
      if (!isRetryableError(error) || attempt >= 3) {
        throw normalizeOpenAiError(error, actionLabel);
      }

      await sleep(800 * 2 ** attempt);
      attempt += 1;
    }
  }
}

export async function transcribeAudioFile({ file, language }) {
  const payload = {
    file: await toFile(file.buffer, file.originalname, {
      type: file.mimetype || "application/octet-stream"
    }),
    model: env.transcriptionModel,
    response_format: "json"
  };

  if (language && language !== "auto") {
    payload.language = language;
  }

  const transcription = await withRetry(
    () => client.audio.transcriptions.create(payload),
    "transcription"
  );

  return {
    text: transcription.text?.trim() ?? ""
  };
}

export async function summarizeTranscript(transcriptText) {
  const response = await withRetry(
    () =>
      client.responses.parse({
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
      }),
    "summary generation"
  );

  if (!response.output_parsed) {
    throw Object.assign(new Error("The summary response could not be parsed."), {
      statusCode: 502
    });
  }

  return response.output_parsed;
}
