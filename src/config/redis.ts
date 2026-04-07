import IORedis from "ioredis";

import { env } from "./env";

let redis: IORedis | null = null;

export function getRedis() {
  if (!redis) {
    redis = new IORedis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
    });
  }

  return redis;
}

export function duplicateRedis() {
  return getRedis().duplicate({
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
  });
}

export async function connectRedis() {
  const client = getRedis();
  if (client.status === "wait") {
    await client.connect();
  }
  return client;
}
