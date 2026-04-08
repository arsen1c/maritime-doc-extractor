import express from "express";

import { asAppError } from "./lib/errors";
import { sendError } from "./lib/http";
import { extractRouter } from "./routes/extract.route";
import { healthRouter } from "./routes/health.route";
import { jobsRouter } from "./routes/jobs.route";
import { sessionsRouter } from "./routes/sessions.route";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json({ limit: "1mb" }));

  app.use("/api/extract", extractRouter);
  app.use("/api/jobs", jobsRouter);
  app.use("/api/sessions", sessionsRouter);
  app.use("/api/health", healthRouter);

  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const appError = asAppError(error);
    sendError(res, appError);
  });
  return app;
}
