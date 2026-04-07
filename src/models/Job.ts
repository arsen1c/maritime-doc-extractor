import { Schema, model } from "mongoose";

const jobSchema = new Schema(
  {
    jobId: { type: String, required: true, unique: true, index: true },
    sessionId: { type: String, required: true, index: true },
    extractionId: { type: String, required: true, index: true },
    status: { type: String, required: true, index: true },
    attempts: { type: Number, default: 0 },
    queuePosition: { type: Number, default: null },
    errorCode: { type: String, default: null },
    errorMessage: { type: String, default: null },
    retryable: { type: Boolean, default: false },
    queuedAt: { type: Date, default: Date.now },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  },
);

jobSchema.index({ sessionId: 1, createdAt: -1 });
jobSchema.index({ status: 1, createdAt: 1 });

export const JobModel = model("Job", jobSchema);
