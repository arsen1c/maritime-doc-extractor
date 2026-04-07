export type AppErrorCode =
  | "UNSUPPORTED_FORMAT"
  | "INSUFFICIENT_DOCUMENTS"
  | "FILE_TOO_LARGE"
  | "SESSION_NOT_FOUND"
  | "JOB_NOT_FOUND"
  | "LLM_JSON_PARSE_FAIL"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: AppErrorCode;
  readonly extractionId: string | null;
  readonly retryAfterMs: number | null;

  constructor(params: {
    code: AppErrorCode;
    message: string;
    statusCode: number;
    extractionId?: string | null;
    retryAfterMs?: number | null;
  }) {
    super(params.message);
    this.code = params.code;
    this.statusCode = params.statusCode;
    this.extractionId = params.extractionId ?? null;
    this.retryAfterMs = params.retryAfterMs ?? null;
  }
}

export function asAppError(error: unknown) {
  if (error instanceof AppError) {
    return error;
  }

  return new AppError({
    code: "INTERNAL_ERROR",
    message: error instanceof Error ? error.message : "Unexpected server error",
    statusCode: 500,
  });
}
