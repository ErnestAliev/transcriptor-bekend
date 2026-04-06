import { env } from "../config/env.js";

export function requireUserId(req, res, next) {
  const userId = req.header(env.userIdHeader);

  if (!userId) {
    return res.status(401).json({
      message: `Missing ${env.userIdHeader} header`
    });
  }

  req.userId = userId;
  return next();
}
