import { Queue } from "bullmq";

import { connectRedis, duplicateRedis } from "../config/redis";

export const extractionQueue = new Queue("document-extractions", {
  connection: duplicateRedis(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2_000 },
    removeOnComplete: 100,
    removeOnFail: 100,
  },
});

export async function ensureQueueConnection() {
  await connectRedis();
  return extractionQueue;
}
