const shorten = (value, maxLength = 180) => {
  const text = value?.trim() ?? "";
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength).trim()}...`;
};

export function serializeHistoryItem(document) {
  return {
    id: document.id,
    fileName: document.fileName,
    fileSize: document.fileSize,
    durationSeconds: document.durationSeconds,
    requestedLanguage: document.requestedLanguage,
    detectedLanguage: document.detectedLanguage,
    status: document.status,
    headline: document.summary?.headline ?? "",
    excerpt: shorten(document.transcriptText),
    errorMessage: document.errorMessage,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt
  };
}

export function serializeTranscription(document) {
  return {
    id: document.id,
    fileName: document.fileName,
    fileSize: document.fileSize,
    mimeType: document.mimeType,
    requestedLanguage: document.requestedLanguage,
    detectedLanguage: document.detectedLanguage,
    durationSeconds: document.durationSeconds,
    status: document.status,
    transcriptText: document.transcriptText,
    transcriptModel: document.transcriptModel,
    summaryModel: document.summaryModel,
    summary: document.summary,
    errorMessage: document.errorMessage,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt
  };
}
