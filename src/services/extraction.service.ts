import { v4 as uuid } from "uuid";

import { env } from "../config/env";
import { logger } from "../config/logger";
import { normalizeDocument } from "../documents/normalize";
import { sha256 } from "../documents/hash";
import { shouldForceAsync } from "../documents/validate";
import { llmProvider } from "../llm/factory";
import {
  buildLowConfidenceRetryPrompt,
  buildRepairPrompt,
  EXTRACTION_PROMPT,
  EXTRACTION_PROMPT_VERSION,
} from "../llm/prompts";
import { parseJsonBoundary } from "../llm/repair";
import { extractionOutputSchema, type ExtractionOutput } from "../llm/types";
import { AppError } from "../lib/errors";
import { ExtractionModel } from "../models/Extraction";
import { SessionModel } from "../models/Session";
import { JobModel } from "../models/Job";
import { extractionQueue } from "../queue/queue";

export type ExtractInput = {
  file: Express.Multer.File;
  sessionId?: string;
};

type CompletionContext = {
  extractionId: string;
  file: Express.Multer.File;
  sessionId: string;
  fileHash: string;
};

function confidenceRank(confidence: string | null | undefined) {
  switch (confidence) {
    case "HIGH":
      return 3;
    case "MEDIUM":
      return 2;
    case "LOW":
      return 1;
    default:
      return 0;
  }
}

function mapExtractionResult(result: ExtractionOutput) {
  const criticalFlagCount = result.flags.filter((flag) => flag.severity === "CRITICAL").length;
  const highFlagCount = result.flags.filter((flag) => flag.severity === "HIGH").length;

  return {
    detection: result.detection,
    holder: result.holder,
    fields: result.fields,
    validity: result.validity,
    compliance: result.compliance,
    medicalData: result.medicalData,
    flags: result.flags,
    summary: result.summary,
    documentType: result.detection.documentType,
    documentName: result.detection.documentName,
    category: result.detection.category,
    applicableRole: result.detection.applicableRole,
    confidence: result.detection.confidence,
    holderName: result.holder.fullName,
    dateOfBirth: result.holder.dateOfBirth,
    passportNumber: result.holder.passportNumber,
    sirbNumber: result.holder.sirbNumber,
    issuingAuthority: result.compliance.issuingAuthority,
    dateOfIssue: result.validity.dateOfIssue,
    dateOfExpiry: result.validity.dateOfExpiry,
    isExpired: result.validity.isExpired,
    daysUntilExpiry: result.validity.daysUntilExpiry,
    fitnessResult: result.medicalData.fitnessResult,
    drugTestResult: result.medicalData.drugTestResult,
    criticalFlagCount,
    highFlagCount,
  };
}

async function resolveSession(sessionId?: string) {
  if (!sessionId) {
    const generated = uuid();
    await SessionModel.create({ sessionId: generated });
    return generated;
  }

  const session = await SessionModel.findOne({ sessionId }).lean();

  if (!session) {
    throw new AppError({
      code: "SESSION_NOT_FOUND",
      message: "The provided session does not exist.",
      statusCode: 404,
    });
  }

  return sessionId;
}

async function findDuplicate(sessionId: string, fileHash: string) {
  return ExtractionModel.findOne({
    sessionId,
    fileHash,
    status: "COMPLETE",
  }).lean();
}

async function callExtractionPipeline(file: Express.Multer.File) {
  const normalized = await normalizeDocument({
    buffer: file.buffer,
    mimeType: file.mimetype,
    fileName: file.originalname,
  });

  const initialRaw = await llmProvider.extractDocument({
    mimeType: normalized.mimeType,
    fileName: normalized.fileName,
    parts: normalized.parts,
    prompt: EXTRACTION_PROMPT,
    timeoutMs: env.LLM_TIMEOUT_MS,
  });

  let parsedObject: Record<string, unknown>;
  let rawResponse = initialRaw.rawText;

  try {
    parsedObject = parseJsonBoundary(initialRaw.rawText);
  } catch {
    const repaired = await llmProvider.completeText({
      prompt: buildRepairPrompt(initialRaw.rawText),
      timeoutMs: env.LLM_TIMEOUT_MS,
    });
    rawResponse = repaired.rawText;
    parsedObject = parseJsonBoundary(repaired.rawText);
  }

  let validated = extractionOutputSchema.parse(parsedObject);

  if (validated.detection.confidence === "LOW") {
    const retried = await llmProvider.extractDocument({
      mimeType: normalized.mimeType,
      fileName: normalized.fileName,
      parts: normalized.parts,
      prompt: buildLowConfidenceRetryPrompt({
        fileName: file.originalname,
        mimeType: file.mimetype,
      }),
      timeoutMs: env.LLM_TIMEOUT_MS,
    });

    const retryParsed = extractionOutputSchema.parse(parseJsonBoundary(retried.rawText));
    if (confidenceRank(retryParsed.detection.confidence) > confidenceRank(validated.detection.confidence)) {
      validated = retryParsed;
      rawResponse = retried.rawText;
    }
  }

  return { validated, rawResponse };
}

async function completeExtraction(context: CompletionContext) {
  const started = Date.now();

  try {
    const { validated, rawResponse } = await callExtractionPipeline(context.file);
    const mapped = mapExtractionResult(validated);

    const updated = await ExtractionModel.findOneAndUpdate(
      { extractionId: context.extractionId },
      {
        ...mapped,
        provider: env.LLM_PROVIDER,
        model: env.LLM_MODEL,
        promptVersion: EXTRACTION_PROMPT_VERSION,
        rawLlmResponse: rawResponse,
        status: "COMPLETE",
        retryable: false,
        processingTimeMs: Date.now() - started,
        completedAt: new Date(),
      },
      { new: true },
    ).lean();

    await SessionModel.findOneAndUpdate(
      { sessionId: context.sessionId },
      {
        $set: { detectedRole: mapped.applicableRole },
        $inc: { documentCount: 1 },
      },
    );

    return updated;
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === "AbortError";
    const appError =
      error instanceof AppError
        ? error
        : new AppError({
            code: error instanceof SyntaxError ? "LLM_JSON_PARSE_FAIL" : "INTERNAL_ERROR",
            message: error instanceof Error ? error.message : "Unexpected extraction failure",
            statusCode: error instanceof AppError ? error.statusCode : error instanceof SyntaxError ? 422 : 500,
          });

    await ExtractionModel.findOneAndUpdate(
      { extractionId: context.extractionId },
      {
        status: "FAILED",
        provider: env.LLM_PROVIDER,
        model: env.LLM_MODEL,
        promptVersion: EXTRACTION_PROMPT_VERSION,
        errorCode: appError.code,
        errorMessage: appError.message,
        retryable: isTimeout,
        completedAt: new Date(),
      },
      { new: true },
    );

    throw new AppError({
      code: appError.code,
      message: appError.message,
      statusCode: appError.statusCode,
      extractionId: context.extractionId,
    });
  }
}

export class ExtractionService {
  async extractSync(input: ExtractInput) {
    const sessionId = await resolveSession(input.sessionId);
    const fileHash = sha256(input.file.buffer);
    const duplicate = await findDuplicate(sessionId, fileHash);

    if (duplicate) {
      return { duplicate: true, result: duplicate, sessionId };
    }

    const extractionId = uuid();

    await ExtractionModel.create({
      extractionId,
      sessionId,
      fileName: input.file.originalname,
      mimeType: input.file.mimetype,
      fileSizeBytes: input.file.size,
      fileHash,
      status: "PENDING",
    });

    const result = await completeExtraction({
      extractionId,
      file: input.file,
      sessionId,
      fileHash,
    });

    return { duplicate: false, result, sessionId };
  }

  async enqueueAsync(input: ExtractInput) {
    const sessionId = await resolveSession(input.sessionId);
    const fileHash = sha256(input.file.buffer);
    const duplicate = await findDuplicate(sessionId, fileHash);

    if (duplicate) {
      return { duplicate: true, result: duplicate, sessionId, jobId: null };
    }

    const extractionId = uuid();
    const jobId = uuid();
    const queuePosition = (await extractionQueue.count()) + 1;

    await ExtractionModel.create({
      extractionId,
      sessionId,
      fileName: input.file.originalname,
      mimeType: input.file.mimetype,
      fileSizeBytes: input.file.size,
      fileHash,
      status: "QUEUED",
    });

    await JobModel.create({
      jobId,
      sessionId,
      extractionId,
      status: "QUEUED",
      queuePosition,
    });

    await extractionQueue.add(
      "extract-document",
      {
        jobId,
        extractionId,
        sessionId,
        fileName: input.file.originalname,
        mimeType: input.file.mimetype,
        fileSizeBytes: input.file.size,
        bufferBase64: input.file.buffer.toString("base64"),
      },
      { jobId },
    );

    return { duplicate: false, sessionId, jobId };
  }

  async processQueuedExtraction(payload: {
    jobId: string;
    extractionId: string;
    sessionId: string;
    fileName: string;
    mimeType: string;
    fileSizeBytes: number;
    bufferBase64: string;
  }) {
    const file: Express.Multer.File = {
      fieldname: "document",
      originalname: payload.fileName,
      encoding: "7bit",
      mimetype: payload.mimeType,
      buffer: Buffer.from(payload.bufferBase64, "base64"),
      size: payload.fileSizeBytes,
      stream: undefined as never,
      destination: "",
      filename: "",
      path: "",
    };

    await JobModel.findOneAndUpdate(
      { jobId: payload.jobId },
      {
        status: "PROCESSING",
        startedAt: new Date(),
        $inc: { attempts: 1 },
      },
    );

    await ExtractionModel.findOneAndUpdate(
      { extractionId: payload.extractionId },
      { status: "PROCESSING" },
    );

    try {
      const result = await completeExtraction({
        extractionId: payload.extractionId,
        file,
        sessionId: payload.sessionId,
        fileHash: "",
      });

      await JobModel.findOneAndUpdate(
        { jobId: payload.jobId },
        {
          status: "COMPLETE",
          completedAt: new Date(),
          queuePosition: null,
        },
      );

      return result;
    } catch (error) {
      logger.error("Async extraction failed", {
        jobId: payload.jobId,
        extractionId: payload.extractionId,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      await JobModel.findOneAndUpdate(
        { jobId: payload.jobId },
        {
          status: "FAILED",
          errorCode: error instanceof AppError ? error.code : "INTERNAL_ERROR",
          errorMessage: error instanceof Error ? error.message : "Unexpected worker failure",
          retryable: error instanceof AppError ? error.code === "INTERNAL_ERROR" : true,
          completedAt: new Date(),
        },
      );

      throw error;
    }
  }

  shouldForceAsync(file: Express.Multer.File) {
    return shouldForceAsync(file);
  }
}
