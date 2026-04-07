import type { Response } from "express";

import { AppError } from "./errors";

export function sendError(res: Response, error: AppError) {
  if (error.code === "RATE_LIMITED" && error.retryAfterMs) {
    res.setHeader("Retry-After", Math.ceil(error.retryAfterMs / 1000).toString());
  }

  return res.status(error.statusCode).json({
    error: error.code,
    message: error.message,
    extractionId: error.extractionId,
    retryAfterMs: error.retryAfterMs,
  });
}
