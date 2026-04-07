import { v4 as uuid } from "uuid";

import { env } from "../config/env";
import { llmProvider } from "../llm/factory";
import { buildRepairPrompt, buildValidationPrompt } from "../llm/prompts";
import { parseJsonBoundary } from "../llm/repair";
import { validationOutputSchema } from "../llm/types";
import { AppError } from "../lib/errors";
import { ExtractionModel } from "../models/Extraction";
import { SessionModel } from "../models/Session";
import { ValidationModel } from "../models/Validation";

export class ValidationService {
  async validateSession(sessionId: string) {
    const session = await SessionModel.findOne({ sessionId }).lean();
    if (!session) {
      throw new AppError({
        code: "SESSION_NOT_FOUND",
        message: "The provided session does not exist.",
        statusCode: 404,
      });
    }

    const extractions = await ExtractionModel.find({
      sessionId,
      status: "COMPLETE",
    })
      .sort({ createdAt: 1 })
      .lean();

    if (extractions.length < 2) {
      throw new AppError({
        code: "INSUFFICIENT_DOCUMENTS",
        message: "At least two completed documents are required for validation.",
        statusCode: 400,
      });
    }

    const prompt = buildValidationPrompt({
      sessionId,
      documents: extractions.map((doc) => ({
        extractionId: doc.extractionId,
        fileName: doc.fileName,
        documentType: doc.documentType,
        applicableRole: doc.applicableRole,
        holderName: doc.holderName,
        dateOfBirth: doc.dateOfBirth,
        passportNumber: doc.passportNumber,
        sirbNumber: doc.sirbNumber,
        validity: doc.validity,
        compliance: doc.compliance,
        medicalData: doc.medicalData,
        flags: doc.flags,
        summary: doc.summary,
      })),
    });

    const initial = await llmProvider.completeText({
      prompt,
      timeoutMs: env.LLM_TIMEOUT_MS,
    });

    let parsed: Record<string, unknown>;

    try {
      parsed = parseJsonBoundary(initial.rawText);
    } catch {
      const repaired = await llmProvider.completeText({
        prompt: buildRepairPrompt(initial.rawText),
        timeoutMs: env.LLM_TIMEOUT_MS,
      });
      parsed = parseJsonBoundary(repaired.rawText);
    }

    const validated = validationOutputSchema.parse(parsed);
    const validationId = uuid();

    const validation = await ValidationModel.create({
      validationId,
      sessionId,
      sourceExtractionIds: extractions.map((doc) => doc.extractionId),
      ...validated,
      validatedAt: new Date(),
    });

    await SessionModel.findOneAndUpdate(
      { sessionId },
      { latestValidationId: validation._id },
    );

    return {
      sessionId,
      ...validated,
      validatedAt: validation.validatedAt,
    };
  }
}
