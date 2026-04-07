import { JobModel } from "../models/Job";
import { ExtractionModel } from "../models/Extraction";
import { AppError } from "../lib/errors";

export class JobService {
  async getJobStatus(jobId: string) {
    const job = await JobModel.findOne({ jobId }).lean();

    if (!job) {
      throw new AppError({
        code: "JOB_NOT_FOUND",
        message: "The requested job does not exist.",
        statusCode: 404,
      });
    }

    if (job.status === "COMPLETE") {
      const result = await ExtractionModel.findOne({ extractionId: job.extractionId }).lean();
      return {
        jobId: job.jobId,
        status: "COMPLETE",
        extractionId: job.extractionId,
        result,
        completedAt: job.completedAt,
      };
    }

    if (job.status === "FAILED") {
      return {
        jobId: job.jobId,
        status: "FAILED",
        error: job.errorCode,
        message: job.errorMessage,
        failedAt: job.completedAt,
        retryable: job.retryable,
      };
    }

    return {
      jobId: job.jobId,
      status: job.status,
      queuePosition: job.queuePosition,
      startedAt: job.startedAt,
      estimatedCompleteMs: job.status === "QUEUED" ? Math.max((job.queuePosition ?? 1) * 3000, 3000) : 3000,
    };
  }
}
