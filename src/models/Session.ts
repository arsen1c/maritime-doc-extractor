import { Schema, model } from "mongoose";

const sessionSchema = new Schema(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    detectedRole: { type: String, default: null },
    documentCount: { type: Number, default: 0 },
    latestValidationId: { type: Schema.Types.ObjectId, default: null, ref: "Validation" },
  },
  {
    timestamps: true,
  },
);

sessionSchema.index({ updatedAt: -1 });

export const SessionModel = model("Session", sessionSchema);
