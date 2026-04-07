import { ExtractionModel } from "../models/Extraction";
import { JobModel } from "../models/Job";
import { SessionModel } from "../models/Session";
import { AppError } from "../lib/errors";

function deriveOverallHealth(documents: Array<Record<string, any>>) {
  const hasCritical = documents.some((doc) => doc.criticalFlagCount > 0 || doc.isExpired === true);
  if (hasCritical) {
    return "CRITICAL";
  }

  const hasWarn = documents.some((doc) => (doc.highFlagCount ?? 0) > 0 || ((doc.daysUntilExpiry ?? 9999) <= 90));
  if (hasWarn) {
    return "WARN";
  }

  return "OK";
}

export class SessionService {
  async getSession(sessionId: string) {
    const session = await SessionModel.findOne({ sessionId }).lean();

    if (!session) {
      throw new AppError({
        code: "SESSION_NOT_FOUND",
        message: "The provided session does not exist.",
        statusCode: 404,
      });
    }

    const documents = await ExtractionModel.find({ sessionId })
      .sort({ createdAt: -1 })
      .lean();

    const pendingJobs = await JobModel.find({
      sessionId,
      status: { $in: ["QUEUED", "PROCESSING"] },
    })
      .sort({ createdAt: -1 })
      .lean();

    return {
      sessionId,
      documentCount: documents.length,
      detectedRole: session.detectedRole ?? "N/A",
      overallHealth: deriveOverallHealth(documents),
      documents: documents.map((doc) => ({
        id: doc.extractionId,
        fileName: doc.fileName,
        documentType: doc.documentType,
        applicableRole: doc.applicableRole,
        holderName: doc.holderName,
        confidence: doc.confidence,
        isExpired: doc.isExpired,
        flagCount: doc.flags?.length ?? 0,
        criticalFlagCount: doc.criticalFlagCount ?? 0,
        createdAt: doc.createdAt,
      })),
      pendingJobs: pendingJobs.map((job) => ({
        jobId: job.jobId,
        extractionId: job.extractionId,
        status: job.status,
      })),
    };
  }
}
