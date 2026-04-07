import { connectDatabase } from "./config/database";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { connectRedis } from "./config/redis";
import { createApp } from "./app";
import { ensureQueueConnection } from "./queue/queue";

async function start() {
  await connectDatabase();
  await connectRedis();
  await ensureQueueConnection();

  const app = createApp();
  app.listen(env.PORT, () => {
    logger.info("API server started", { port: env.PORT });
  });
}

void start();
