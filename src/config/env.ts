import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  REDIS_URL: z.string().min(1, "REDIS_URL is required"),
  LLM_PROVIDER: z.enum(["gemini", "openai", "groq", "ollama"]).default("gemini"),
  LLM_MODEL: z.string().min(1).default("gemini-2.0-flash"),
  LLM_API_KEY: z.string().optional(),
  WORKER_CONCURRENCY: z.coerce.number().int().positive().default(4),
  MAX_FILE_SIZE_BYTES: z.coerce.number().int().positive().default(10 * 1024 * 1024),
  SYNC_MAX_FILE_SIZE_BYTES: z.coerce.number().int().positive().default(4 * 1024 * 1024),
  SYNC_MAX_PDF_PAGES: z.coerce.number().int().positive().default(5),
  LLM_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),
  REDIS_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  REDIS_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(10)
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(`Invalid environment: ${parsed.error.message}`);
}

export const env = parsed.data;

export type AppEnv = typeof env;
