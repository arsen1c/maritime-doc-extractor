import { Router } from "express";

import { env } from "../config/env";
import { connectDatabase } from "../config/database";
import { connectRedis } from "../config/redis";
import { llmProvider } from "../llm/factory";

export const healthRouter = Router();

healthRouter.get("/", async (_req, res) => {
  let database = "OK";
  let queue = "OK";

  try {
    await connectDatabase();
  } catch {
    database = "DEGRADED";
  }

  try {
    await connectRedis();
  } catch {
    queue = "DEGRADED";
  }

  const llmStatus = await llmProvider.healthCheck();
  const overall = [database, queue, llmStatus].every((value) => value === "OK") ? "OK" : "DEGRADED";

  res.json({
    status: overall,
    version: "1.0.0",
    uptime: process.uptime(),
    dependencies: {
      database,
      llmProvider: llmStatus,
      queue,
    },
    timestamp: new Date().toISOString(),
    provider: env.LLM_PROVIDER,
    model: env.LLM_MODEL,
  });
});
