import { Schema, model } from "mongoose";

const validationSchema = new Schema(
  {
    validationId: { type: String, required: true, unique: true, index: true },
    sessionId: { type: String, required: true, index: true },
    sourceExtractionIds: { type: [String], default: [] },
    holderProfile: { type: Schema.Types.Mixed, required: true },
    consistencyChecks: { type: [Schema.Types.Mixed], default: [] },
    missingDocuments: { type: [Schema.Types.Mixed], default: [] },
    expiringDocuments: { type: [Schema.Types.Mixed], default: [] },
    medicalFlags: { type: [Schema.Types.Mixed], default: [] },
    overallStatus: { type: String, required: true },
    overallScore: { type: Number, required: true },
    summary: { type: String, required: true },
    recommendations: { type: [String], default: [] },
    validatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  },
);

validationSchema.index({ sessionId: 1, validatedAt: -1 });

export const ValidationModel = model("Validation", validationSchema);
