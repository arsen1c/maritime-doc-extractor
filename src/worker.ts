import { Worker } from "bullmq";

import { connectDatabase } from "./config/database";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { connectRedis, duplicateRedis } from "./config/redis";
import { ExtractionService } from "./services/extraction.service";

async function startWorker() {
  await connectDatabase();
  await connectRedis();

  const extractionService = new ExtractionService();

  const worker = new Worker(
    "document-extractions",
    async (job) => {
      await extractionService.processQueuedExtraction(job.data as {
        jobId: string;
        extractionId: string;
        sessionId: string;
        fileName: string;
        mimeType: string;
        fileSizeBytes: number;
        bufferBase64: string;
      });
    },
    {
      connection: duplicateRedis(),
      concurrency: env.WORKER_CONCURRENCY,
    },
  );

  worker.on("failed", (job, error) => {
    logger.error("Worker job failed", {
      jobId: job?.id,
      error: error.message,
    });
  });
}

void startWorker();
