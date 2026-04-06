import multer from "multer";

export function notFoundHandler(req, res) {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof multer.MulterError) {
    const statusCode = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    return res.status(statusCode).json({
      message:
        error.code === "LIMIT_FILE_SIZE"
          ? "Audio file exceeds the 25 MB limit supported by the transcription API."
          : error.message
    });
  }

  const statusCode = error.statusCode ?? 500;

  return res.status(statusCode).json({
    message: error.message || "Internal server error"
  });
}
