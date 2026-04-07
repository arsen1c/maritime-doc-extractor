import { env } from "../config/env";
import { AppError } from "../lib/errors";

const SUPPORTED_MIME_TYPES = new Set(["image/jpeg", "image/png", "application/pdf"]);

export function validateUpload(file: Express.Multer.File) {
  if (!SUPPORTED_MIME_TYPES.has(file.mimetype)) {
    throw new AppError({
      code: "UNSUPPORTED_FORMAT",
      message: "Only JPEG, PNG, and PDF documents are supported.",
      statusCode: 400,
    });
  }

  if (file.size > env.MAX_FILE_SIZE_BYTES) {
    throw new AppError({
      code: "FILE_TOO_LARGE",
      message: `File exceeds ${(env.MAX_FILE_SIZE_BYTES / (1024 * 1024)).toFixed(0)}MB limit.`,
      statusCode: 413,
    });
  }
}

export function shouldForceAsync(file: Express.Multer.File) {
  return file.size > env.SYNC_MAX_FILE_SIZE_BYTES || file.mimetype === "application/pdf";
}
