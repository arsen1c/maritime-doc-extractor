import { Schema, model } from "mongoose";

const extractionSchema = new Schema(
  {
    extractionId: { type: String, required: true, unique: true, index: true },
    sessionId: { type: String, required: true, index: true },
    fileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    fileSizeBytes: { type: Number, required: true },
    fileHash: { type: String, required: true },
    status: { type: String, required: true, index: true },
    provider: { type: String, default: null },
    model: { type: String, default: null },
    promptVersion: { type: String, default: "v1" },
    documentType: { type: String, default: null, index: true },
    documentName: { type: String, default: null },
    category: { type: String, default: null },
    applicableRole: { type: String, default: null },
    confidence: { type: String, default: null },
    holderName: { type: String, default: null, index: true },
    dateOfBirth: { type: String, default: null, index: true },
    passportNumber: { type: String, default: null },
    sirbNumber: { type: String, default: null },
    issuingAuthority: { type: String, default: null },
    dateOfIssue: { type: String, default: null },
    dateOfExpiry: { type: String, default: null, index: true },
    isExpired: { type: Boolean, default: false, index: true },
    daysUntilExpiry: { type: Number, default: null },
    fitnessResult: { type: String, default: null },
    drugTestResult: { type: String, default: null },
    criticalFlagCount: { type: Number, default: 0 },
    highFlagCount: { type: Number, default: 0 },
    summary: { type: String, default: null },
    detection: { type: Schema.Types.Mixed, default: null },
    holder: { type: Schema.Types.Mixed, default: null },
    fields: { type: [Schema.Types.Mixed], default: [] },
    validity: { type: Schema.Types.Mixed, default: null },
    compliance: { type: Schema.Types.Mixed, default: null },
    medicalData: { type: Schema.Types.Mixed, default: null },
    flags: { type: [Schema.Types.Mixed], default: [] },
    rawLlmResponse: { type: String, default: null },
    errorCode: { type: String, default: null },
    errorMessage: { type: String, default: null },
    retryable: { type: Boolean, default: false },
    processingTimeMs: { type: Number, default: null },
    completedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  },
);

extractionSchema.index({ sessionId: 1, fileHash: 1 }, { unique: true });
extractionSchema.index({ sessionId: 1, createdAt: -1 });
extractionSchema.index({ sessionId: 1, status: 1 });
extractionSchema.index({ documentType: 1, isExpired: 1 });
extractionSchema.index({ holderName: 1, dateOfBirth: 1 });

export const ExtractionModel = model("Extraction", extractionSchema);
