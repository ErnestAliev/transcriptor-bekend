export const asyncHandler =
  (handler) =>
  async (req, res, next) =>
    Promise.resolve(handler(req, res, next)).catch(next);
