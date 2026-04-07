import { ExtractionModel } from "../models/Extraction";
import { SessionModel } from "../models/Session";
import { ValidationModel } from "../models/Validation";
import { AppError } from "../lib/errors";

export class ReportService {
  async getReport(sessionId: string) {
    const session = await SessionModel.findOne({ sessionId }).lean();
    if (!session) {
      throw new AppError({
        code: "SESSION_NOT_FOUND",
        message: "The provided session does not exist.",
        statusCode: 404,
      });
    }

    const documents = await ExtractionModel.find({ sessionId, status: "COMPLETE" }).sort({ createdAt: 1 }).lean();
    const latestValidation = await ValidationModel.findOne({ sessionId }).sort({ validatedAt: -1 }).lean();

    const expiredDocuments = documents
      .filter((doc) => doc.isExpired)
      .map((doc) => ({ extractionId: doc.extractionId, fileName: doc.fileName, documentType: doc.documentType }));

    const expiringDocuments = documents
      .filter((doc) => (doc.daysUntilExpiry ?? 9999) <= 90 && !doc.isExpired)
      .map((doc) => ({
        extractionId: doc.extractionId,
        fileName: doc.fileName,
        documentType: doc.documentType,
        daysUntilExpiry: doc.daysUntilExpiry,
      }));

    const finalDecision =
      latestValidation?.overallStatus === "REJECTED"
        ? "DO_NOT_PROGRESS"
        : latestValidation?.overallStatus === "CONDITIONAL"
          ? "CONDITIONAL_REVIEW"
          : "HIRE_READY";

    return {
      sessionId,
      sessionOverview: {
        detectedRole: session.detectedRole ?? "N/A",
        documentCount: documents.length,
        validatedAt: latestValidation?.validatedAt ?? null,
        finalDecision,
      },
      holderIdentity: latestValidation?.holderProfile ?? {
        fullName: documents[0]?.holderName ?? null,
        dateOfBirth: documents[0]?.dateOfBirth ?? null,
      },
      documentCoverage: documents.map((doc) => ({
        extractionId: doc.extractionId,
        fileName: doc.fileName,
        documentType: doc.documentType,
        confidence: doc.confidence,
        isExpired: doc.isExpired,
        flags: doc.flags,
      })),
      expiredDocuments,
      expiringDocuments,
      medicalAndComplianceConcerns: latestValidation?.medicalFlags ?? [],
      consistencyIssues: latestValidation?.consistencyChecks ?? [],
      recommendations: latestValidation?.recommendations ?? [],
      summary: latestValidation?.summary ?? "Validation has not been run yet for this session.",
    };
  }
}
