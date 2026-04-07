import type { NextFunction, Request, Response } from "express";

import { env } from "../config/env";
import { connectRedis } from "../config/redis";
import { AppError } from "../lib/errors";

export async function extractRateLimit(req: Request, _res: Response, next: NextFunction) {
  try {
    const redis = await connectRedis();
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const key = `rate-limit:extract:${ip}`;
    const count = await redis.incr(key);
    let ttl = await redis.pttl(key);

    if (ttl < 0) {
      await redis.pexpire(key, env.REDIS_RATE_LIMIT_WINDOW_MS);
      ttl = env.REDIS_RATE_LIMIT_WINDOW_MS;
    }

    if (count > env.REDIS_RATE_LIMIT_MAX_REQUESTS) {
      throw new AppError({
        code: "RATE_LIMITED",
        message: "Too many extraction requests. Please retry later.",
        statusCode: 429,
        retryAfterMs: ttl,
      });
    }

    next();
  } catch (error) {
    next(error);
  }
}
