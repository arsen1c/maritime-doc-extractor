import { AppError } from "../lib/errors";

export function extractJsonBoundary(raw: string) {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    return null;
  }

  return raw.slice(start, end + 1);
}

export function parseJsonBoundary(raw: string) {
  const boundary = extractJsonBoundary(raw);

  if (!boundary) {
    throw new AppError({
      code: "LLM_JSON_PARSE_FAIL",
      message: "Document extraction failed after retry. The raw response has been stored for review.",
      statusCode: 422,
    });
  }

  return JSON.parse(boundary) as Record<string, unknown>;
}
