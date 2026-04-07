import { Router } from "express";

import { JobService } from "../services/job.service";

export const jobsRouter = Router();
const jobService = new JobService();

jobsRouter.get("/:jobId", async (req, res, next) => {
  try {
    const response = await jobService.getJobStatus(req.params.jobId);
    res.json(response);
  } catch (error) {
    next(error);
  }
});
