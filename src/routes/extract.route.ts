import { Router } from "express";
import multer from "multer";
import { z } from "zod";

import { validateUpload } from "../documents/validate";
import { AppError } from "../lib/errors";
import { ExtractionService } from "../services/extraction.service";
import { extractRateLimit } from "../middleware/rate-limit";

const upload = multer({ storage: multer.memoryStorage() });
const querySchema = z.object({
  mode: z.enum(["sync", "async"]).default("sync"),
});

export const extractRouter = Router();
const extractionService = new ExtractionService();

extractRouter.post("/", extractRateLimit, upload.single("document"), async (req, res, next) => {
  try {
    const query = querySchema.parse(req.query);
    const file = req.file;

    if (!file) {
      throw new AppError({
        code: "UNSUPPORTED_FORMAT",
        message: "A document file is required.",
        statusCode: 400,
      });
    }

    validateUpload(file);

    const requestedMode = query.mode;
    const mode = requestedMode === "sync" && extractionService.shouldForceAsync(file) ? "async" : requestedMode;
    const sessionId = typeof req.body.sessionId === "string" ? req.body.sessionId : undefined;

    if (mode === "sync") {
      const response = await extractionService.extractSync({ file, sessionId });
      if (response.duplicate) {
        res.setHeader("X-Deduplicated", "true");
      }
      return res.status(200).json({
        id: response.result?.extractionId,
        sessionId: response.sessionId,
        fileName: response.result?.fileName,
        documentType: response.result?.documentType,
        documentName: response.result?.documentName,
        applicableRole: response.result?.applicableRole,
        category: response.result?.category,
        confidence: response.result?.confidence,
        holderName: response.result?.holderName,
        dateOfBirth: response.result?.dateOfBirth,
        sirbNumber: response.result?.sirbNumber,
        passportNumber: response.result?.passportNumber,
        fields: response.result?.fields ?? [],
        validity: response.result?.validity ?? null,
        compliance: response.result?.compliance ?? null,
        medicalData: response.result?.medicalData ?? null,
        flags: response.result?.flags ?? [],
        isExpired: response.result?.isExpired ?? false,
        processingTimeMs: response.result?.processingTimeMs ?? null,
        summary: response.result?.summary ?? null,
        createdAt: response.result?.createdAt ?? new Date().toISOString(),
      });
    }

    const response = await extractionService.enqueueAsync({ file, sessionId });
    if (response.duplicate) {
      res.setHeader("X-Deduplicated", "true");
      return res.status(200).json(response.result);
    }

    return res.status(202).json({
      jobId: response.jobId,
      sessionId: response.sessionId,
      status: "QUEUED",
      pollUrl: `/api/jobs/${response.jobId}`,
      estimatedWaitMs: 6000,
    });
  } catch (error) {
    next(error);
  }
});
