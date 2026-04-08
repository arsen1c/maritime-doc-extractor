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

/**
 * Helper: Convert confidence enum to numeric rank for comparison.
 * 
 * Enables: confidenceRank(retry) > confidenceRank(original)
 * Used In: Retry logic to decide which extraction result to keep
 * 
 * Ranking:
 * - HIGH: 3 (highest confidence)
 * - MEDIUM: 2
 * - LOW: 1 (lowest confidence)
 * - null/undefined: 0 (invalid)
 * 
 * @param confidence - "HIGH" | "MEDIUM" | "LOW" | null | undefined
 * @returns number - 0 to 3 where higher is better confidence
 */
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

/**
 * Flattens and denormalizes LLM extraction output for database persistence and efficient querying.
 * 
 * This function serves a critical architectural purpose:
 * 1. Preserves original nested structure from LLM (audit trail for compliance)
 * 2. Creates denormalized flat fields for indexed MongoDB queries
 * 3. Computes aggregates (flag counts) for analytics and risk assessment
 * 4. Maps deeply nested LLM fields to top-level for API responses
 * 
 * Design Pattern: Denormalization for Read Efficiency
 * - Trade-off: Increased storage (nested + flat fields) for query speed improvement
 * - Justification: Extraction is write-once, read-many pattern
 *   * One write from expensive LLM call
 *   * Hundreds of reads via queries, APIs, reports
 *   * Worth paying storage to optimize reads
 * 
 * Field Mapping Strategy:
 * - detection.* → documentType, documentName, category, applicableRole, confidence
 * - holder.* → holderName, dateOfBirth, passportNumber, sirbNumber
 * - validity.* → dateOfIssue, dateOfExpiry, isExpired, daysUntilExpiry
 * - compliance.* → issuingAuthority
 * - medicalData.* → fitnessResult, drugTestResult
 * - flags → computed as criticalFlagCount, highFlagCount
 * 
 * @param result - ExtractionOutput from Zod validation
 *   Guaranteed to have all required fields from schema
 * 
 * @returns Flattened object with both nested and denormalized fields
 *   Can query: ExtractionModel.find({ holderName, documentType, confidence })
 *   And access: result.holder.fullName (nested), result.holderName (flat)
 * 
 * @example
 * const llmOutput = {
 *   holder: { fullName: "Jane Doe", dateOfBirth: "01/01/1990", ... },
 *   detection: { documentType: "COC", confidence: "HIGH", ... },
 *   flags: [{ severity: "CRITICAL" }, { severity: "HIGH" }, ...],
 *   ...
 * };
 * 
 * const mapped = mapExtractionResult(llmOutput);
 * // Flat access: mapped.holderName === "Jane Doe"
 * // Nested access: mapped.holder === original object
 * // Aggregates: mapped.criticalFlagCount === 1, mapped.highFlagCount === 1
 * 
 * @remarks
 * - Does NOT modify input object (immutable)
 * - All fields are optional from LLM (allowed nulls), can be safely set
 * - Returned object ready for direct Database.create() call
 */
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

/**
 * Helper: Resolve or create a session for grouping related extractions.
 * 
 * Purpose: Sessions group multiple document extractions from one user/workflow
 * Example: User uploads 5 maritime documents → all belong to same session
 * 
 * Logic:
 * - If sessionId provided and exists in DB: Return it (for existing workflow)
 * - If no sessionId: Generate new UUID and create empty session (new workflow)
 * - If sessionId provided but not found: Throw error (invalid request)
 * 
 * @param sessionId - optional | undefined
 * @returns Promise<string> - existing or newly created session ID
 * @throws AppError if sessionId provided but doesn't exist
 */
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

/**
 * Helper: Check if exact file has already been processed.
 * 
 * Purpose: Content-based deduplication to avoid redundant LLM calls
 * Strategy: Files are identified by SHA256 hash (not filename)
 * 
 * Query: Find completed extraction with same hash in same session
 * Returns: Full extraction document if found (use as cached result)
 * Returns: null if not found (need to process)
 * 
 * @param sessionId - session to check within
 * @param fileHash - SHA256 hash of file buffer
 * @returns Promise<Extraction | null>
 */
async function findDuplicate(sessionId: string, fileHash: string) {
  return ExtractionModel.findOne({
    sessionId,
    fileHash,
    status: "COMPLETE",
  }).lean();
}

/**
 * Executes the complete document extraction pipeline with robust error handling and
 * confidence-based retry logic.
 * 
 * Pipeline Steps:
 * 1. Normalize document format (PDF/image → standard format with Base64 encoding)
 * 2. Extract data using LLM with detailed maritime taxonomy prompt
 * 3. Parse JSON response with boundary detection (handles markdown wrapping)
 * 4. If parsing fails, auto-repair malformed JSON and retry
 * 5. Validate against extractionOutputSchema (Zod validation)
 * 6. If confidence is LOW, retry extraction with enhanced prompt including file context
 * 7. Return result with highest confidence score from both attempts
 * 
 * Retry Logic (Confidence-Based):
 * - First attempt confidence is assessed (HIGH/MEDIUM/LOW)
 * - If LOW: Retry with buildLowConfidenceRetryPrompt for additional context
 * - Compare confidence ranks: HIGH(3) > MEDIUM(2) > LOW(1)
 * - Use whichever attempt has higher confidence
 * 
 * @param file - Express Multer file object
 *   - buffer: Raw file bytes from user upload
 *   - mimetype: "image/png" | "image/jpeg" | "application/pdf"
 *   - originalname: User-provided filename for context
 * 
 * @returns Promise<{ validated, rawResponse }>
 *   - validated: ExtractionOutput (Zod-validated extraction data)
 *   - rawResponse: string (raw LLM response, best attempt for audit trail)
 * 
 * @throws AppError if:
 *   - Extraction pipeline fails permanently
 *   - JSON cannot be repaired after retry
 *   - Timeout occurs (AbortError)
 *   - Schema validation fails
 *   - LLM API authentication fails
 * 
 * @example
 * const { validated, rawResponse } = await callExtractionPipeline(multerFile);
 * // validated.detection.documentType === "COC"
 * // validated.detection.confidence === "HIGH"
 * // rawResponse contains full LLM output for debugging
 */
async function callExtractionPipeline(file: Express.Multer.File) {
  //parts: [{ type: "image/document", mimeType: input.mimeType, dataBase64 }],
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

  logger.info("Initial LLM response received", {
    fileName: file.originalname,
    textLength: initialRaw.rawText.length,
    preview: initialRaw.rawText.slice(0, 500),
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

  logger.info("Parsed validity field preview", {
    fileName: file.originalname,
    revalidationRequiredValue:
      parsedObject && typeof parsedObject === "object" && "validity" in parsedObject
        ? (parsedObject as { validity?: { revalidationRequired?: unknown } }).validity?.revalidationRequired
        : undefined,
    revalidationRequiredType:
      parsedObject && typeof parsedObject === "object" && "validity" in parsedObject
        ? typeof (parsedObject as { validity?: { revalidationRequired?: unknown } }).validity?.revalidationRequired
        : "undefined",
  });

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

/**
 * Orchestrates the complete extraction workflow for a document.
 * 
 * Responsibilities:
 * 1. Execution of LLM extraction pipeline with all retries/repairs
 * 2. Result mapping and flattening for database storage
 * 3. Database persistence with provider/model/version tracking
 * 4. Session state updates (detected role, document count)
 * 5. Comprehensive error handling with retry metadata
 * 
 * Success Path:
 * - callExtractionPipeline() returns validated extraction
 * - mapExtractionResult() flattens for database
 * - ExtractionModel.findOneAndUpdate() marks COMPLETE
 * - SessionModel.findOneAndUpdate() increments document count
 * - Return extraction document to caller
 * 
 * Failure Path:
 * - Any error in pipeline caught
 * - Error classified into severity category
 * - ExtractionModel marked FAILED with error details
 * - Error re-thrown with extraction context
 * - Caller receives error but database has failure record
 * 
 * Error Classification:
 * - Timeout (AbortError): Sets retryable=true (transient network issue)
 * - JSON Parse (SyntaxError): Sets retryable=false (data issue, repair failed)
 * - App Error: Uses provided retryable flag
 * - Unknown Error: Sets retryable=true (assume transient for safety)
 * - Status Code: 422 for JSON, 500 for others
 * 
 * @param context - Extraction context
 *   - extractionId: Unique extraction identifier for database lookup/update
 *   - file: Express Multer file (buffer, mimetype, originalname)
 *   - sessionId: Session grouping for multi-document workflows
 *   - fileHash: SHA256 hash for record-keeping and debugging
 * 
 * @returns Promise<Extraction>
 *   Updated extraction document from database with:
 *   - status: "COMPLETE"
 *   - All extraction fields flattened and nested
 *   - processingTimeMs: Latency measurement
 *   - provider/model/promptVersion: Reproducibility tracking
 *   - rawLlmResponse: Full LLM output for audit trail
 * 
 * @throws AppError with:
 *   - code: Error classification code
 *   - message: Human-readable error description
 *   - statusCode: HTTP status code (422 or 500)
 *   - extractionId: For error tracking in logs
 * 
 * @example
 * try {
 *   const result = await completeExtraction({
 *     extractionId: "uuid",
 *     file: multerFile,
 *     sessionId: "uuid",
 *     fileHash: "sha256hash"
 *   });
 *   // result.status === "COMPLETE"
 *   // result.documentType === "COC"
 * } catch (error) {
 *   // error.extractionId available for tracking
 *   // error.code === "LLM_JSON_PARSE_FAIL" or similar
 *   // Extraction record in DB has status "FAILED"
 * }
 * 
 * @remarks
 * - Database writes happen EVEN on failure (for debugging)
 * - Session updates only on success (state consistency)
 * - Timing includes LLM call + parsing + validation + retries
 * - Does not include normalization/prep time (called inside pipeline)
 */
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
  /**
   * SYNC MODE: Blocking extraction with immediate response to client.
   * 
   * Flow:
   * 1. Resolve or create session for grouping related extractions
   * 2. Compute SHA256 hash of file buffer for deduplication
   * 3. Check if exact document already extracted in this session
   *    ├─ If yes: Return cached result immediately (no LLM call)
   *    └─ If no: Continue to processing
   * 4. Create PENDING extraction record in database
   * 5. Call completeExtraction() which blocks until LLM finishes
   * 6. Return result to waiting client
   * 
   * Timeline: 5-30 seconds (client waits for everything)
   * Use Case: Small documents, real-time requirements, simple integrations
   * Forced to Async: If file size > limit (via shouldForceAsync check)
   * 
   * @param input - ExtractInput
   *   - file: Express Multer file from upload
   *   - sessionId?: optional, creates new session if not provided
   * 
   * @returns Promise<{
   *   duplicate: boolean,
   *   result: Extraction document from database,
   *   sessionId: string
   * }>
   * 
   * @throws Propagates from completeExtraction() error handling
   * 
   * @example
   * const response = await extractionService.extractSync({
   *   file: req.file,
   *   sessionId: "existing-session-id"
   * });
   * 
   * if (response.duplicate) {
   *   // Same file, used cached result
   * }
   * 
   * console.log(response.result.documentType); // "COC"
   */
  async extractSync(input: ExtractInput) {
    const sessionId = await resolveSession(input.sessionId);
    const fileHash = sha256(input.file.buffer); // generate a hash for the file
    const duplicate = await findDuplicate(sessionId, fileHash); // check for file duplicate

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

  /**
   * ASYNC MODE: Non-blocking extraction with job tracking.
   * 
   * Flow:
   * 1. Resolve or create session for grouping
   * 2. Compute file hash for deduplication (same as sync)
   * 3. Check if document already processed
   *    ├─ If duplicate: Return cached result with 202 status
   *    └─ If new: Continue to queue
   * 4. Create QUEUED extraction and job records
   * 5. Serialize file: Buffer → Base64 (required for Redis queue)
   * 6. Add job to Redis queue with unique jobId
   * 7. Return 202 ACCEPTED immediately to client
   * 
   * Background Processing:
   * - Worker picks up job from queue
   * - Deserializes Base64 → Buffer
   * - Calls processQueuedExtraction() with same data
   * - Updates job status to COMPLETE/FAILED
   * 
   * Timeline: <100ms response, processing happens in background
   * Use Case: Large documents, batch processing, non-blocking APIs
   * Client Polling: GET /api/jobs/{jobId} to check status
   * 
   * @param input - ExtractInput (same as extractSync)
   * 
   * @returns Promise<{
   *   duplicate: boolean,
   *   result: Extraction | null,
   *   sessionId: string,
   *   jobId: string | null
   * }>
   *   - result: Only if duplicate found (cached)
   *   - jobId: null if duplicate, uuid if new job queued
   * 
   * @example
   * const response = await extractionService.enqueueAsync({
   *   file: req.file,
   *   sessionId: "session-id"
   * });
   * 
   * // Immediate response (< 100ms)
   * return res.status(202).json({
   *   jobId: response.jobId,
   *   pollUrl: `/api/jobs/${response.jobId}`,
   *   estimatedWaitMs: 6000
   * });
   * 
   * // Client polls
   * // GET /api/jobs/jobId
   * // Returns: { status: "QUEUED" | "PROCESSING" | "COMPLETE" | "FAILED" }
   */
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

  /**
   * WORKER PROCESSOR: Handles extraction job picked up from Redis queue.
   * 
   * Called by: BullMQ worker processing jobs from extraction queue
   * Triggered by: enqueueAsync() which added job to queue
   * 
   * Workflow:
   * 1. Deserialize payload from queue
   *    - Base64 file buffer → Binary Buffer (queue only stores strings)
   *    - Reconstruct Multer file object from payload
   * 2. Update job status to PROCESSING (for UI/client polling)
   * 3. Update extraction status to PROCESSING
   * 4. Call completeExtraction() with reconstructed file
   *    (Uses same logic as sync mode)
   * 5. On success:
   *    - Update job status to COMPLETE
   *    - Clear queuePosition (no longer in queue)
   * 6. On failure:
   *    - Extract error metadata
   *    - Update job with error info
   *    - Set retryable flag based on error type
   *    - Re-throw for BullMQ retry logic
   * 
   * Note: fileHash is empty string here (already checked in enqueueAsync)
   * 
   * @param payload - from queue
   *   - jobId: unique job reference
   *   - extractionId: unique extraction reference
   *   - sessionId: session grouping
   *   - fileName, mimeType, fileSizeBytes: file metadata
   *   - bufferBase64: Base64-encoded file buffer from Redis
   * 
   * @returns Promise<Extraction>
   *   Complete extraction document after processing
   * 
   * @throws AppError (with error handling)
   *   - Error info saved to JobModel
   *   - BullMQ handles retry based on error
   * 
   * @example
   * // Called by BullMQ worker
   * extractionQueue.process("extract-document", async (job) => {
   *   return await extractionService.processQueuedExtraction(job.data);
   * });
   * 
   * @remarks
   * - This runs on worker process (separate from API server)
   * - Can be scaled independently (add more workers for performance)
   * - fileHash not used (deduplication already checked in enqueueAsync)
   * - If processing fails, job can be configured for auto-retry
   */
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

  /**
   * Determines if sync mode should be forced to async.
   * 
   * Some files are too large/complex for synchronous processing
   * within reasonable timeout windows. This checks file properties.
   * 
   * @param file - Multer file object
   * @returns boolean - true if file requires async processing
   * 
   * @see shouldForceAsync function in validate.ts for implementation
   */
  shouldForceAsync(file: Express.Multer.File) {
    return shouldForceAsync(file);
  }
}
