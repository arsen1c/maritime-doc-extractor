import { Router } from "express";

import { ReportService } from "../services/report.service";
import { SessionService } from "../services/session.service";
import { ValidationService } from "../services/validation.service";

export const sessionsRouter = Router();

const sessionService = new SessionService();
const validationService = new ValidationService();
const reportService = new ReportService();

sessionsRouter.get("/:sessionId", async (req, res, next) => {
  try {
    const response = await sessionService.getSession(req.params.sessionId);
    res.json(response);
  } catch (error) {
    next(error);
  }
});

sessionsRouter.post("/:sessionId/validate", async (req, res, next) => {
  try {
    const response = await validationService.validateSession(req.params.sessionId);
    res.json(response);
  } catch (error) {
    next(error);
  }
});

sessionsRouter.get("/:sessionId/report", async (req, res, next) => {
  try {
    const response = await reportService.getReport(req.params.sessionId);
    res.json(response);
  } catch (error) {
    next(error);
  }
});
