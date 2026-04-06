import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { requireUserId } from "./middleware/auth.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import transcriptionRoutes from "./routes/transcription.routes.js";

function buildCorsOrigin(originConfig) {
  if (originConfig === "*") {
    return true;
  }

  const allowedOrigins = originConfig
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("CORS origin is not allowed."));
  };
}

const app = express();

app.use(
  cors({
    origin: buildCorsOrigin(env.corsOrigin),
    credentials: true,
    allowedHeaders: ["Content-Type", env.userIdHeader]
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    now: new Date().toISOString()
  });
});

app.use("/api/transcriptions", requireUserId, transcriptionRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
