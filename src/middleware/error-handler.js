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

  console.error(
    JSON.stringify(
      {
        level: "error",
        method: req.method,
        url: req.originalUrl,
        message: error?.message,
        statusCode: error?.statusCode,
        status: error?.status,
        name: error?.name,
        cause: error?.cause?.message
      },
      null,
      2
    )
  );

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
