# Transcriptor Backend

Express API for audio transcription, structured summaries, and private history storage in MongoDB.

## Stack

- Node.js + Express
- MongoDB + Mongoose
- OpenAI Audio API for transcription
- OpenAI Responses API for structured summaries

## Features

- Upload an audio file and get a transcript
- Generate a structured summary with dates, numbers, participants, and next steps
- Store transcript history per user
- Keep the auth boundary ready for future Google OAuth

## Environment

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

Required variables:

- `MONGODB_URI`
- `OPENAI_API_KEY`

## Run locally

```bash
npm install
npm run dev
```

The API starts on `http://localhost:8080`.

## Auth model for MVP

Google OAuth is intentionally deferred. For now, the frontend sends a stable `x-user-id` header generated in the browser. Every record is stored under that `ownerId`, so the database contract is already aligned with future real auth.

## API

### `GET /api/health`

Health check.

### `GET /api/transcriptions`

Returns the current user's history. Supports optional `q` search.

### `GET /api/transcriptions/:id`

Returns one full transcription record.

### `POST /api/transcriptions`

Multipart upload:

- `audio`: required file
- `language`: optional (`auto`, `ru`, `en`, etc.)
- `durationSeconds`: optional number

### `POST /api/transcriptions/:id/summarize`

Regenerates the structured summary from the saved transcript.

## Supported audio formats

The OpenAI transcription endpoint officially supports:

- `mp3`
- `mp4`
- `mpeg`
- `mpga`
- `m4a`
- `wav`
- `webm`

The backend also accepts `ogg` uploads at validation level for convenience, but final acceptance still depends on the upstream transcription API.
