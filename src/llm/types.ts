import { z } from "zod";

import type { NormalizedPart } from "../documents/normalize";

export const extractionOutputSchema = z.object({
  detection: z.object({
    documentType: z.string(),
    documentName: z.string(),
    category: z.string(),
    applicableRole: z.string(),
    isRequired: z.boolean(),
    confidence: z.enum(["HIGH", "MEDIUM", "LOW"]),
    detectionReason: z.string(),
  }),
  holder: z.object({
    fullName: z.string().nullable(),
    dateOfBirth: z.string().nullable(),
    nationality: z.string().nullable(),
    passportNumber: z.string().nullable(),
    sirbNumber: z.string().nullable(),
    rank: z.string().nullable(),
    photo: z.string().nullable(),
  }),
  fields: z.array(
    z.object({
      key: z.string(),
      label: z.string(),
      value: z.string(),
      importance: z.string(),
      status: z.string(),
    }),
  ),
  validity: z.object({
    dateOfIssue: z.string().nullable(),
    dateOfExpiry: z.union([z.string(), z.null()]),
    isExpired: z.boolean(),
    daysUntilExpiry: z.number().nullable(),
    revalidationRequired: z.union([z.boolean(), z.null()]),
  }),
  compliance: z.object({
    issuingAuthority: z.string().nullable(),
    regulationReference: z.string().nullable(),
    imoModelCourse: z.string().nullable(),
    recognizedAuthority: z.boolean(),
    limitations: z.string().nullable(),
  }),
  medicalData: z.object({
    fitnessResult: z.string(),
    drugTestResult: z.string(),
    restrictions: z.string().nullable(),
    specialNotes: z.string().nullable(),
    expiryDate: z.string().nullable(),
  }),
  flags: z.array(
    z.object({
      severity: z.string(),
      message: z.string(),
    }),
  ),
  summary: z.string(),
});

export const validationOutputSchema = z.object({
  holderProfile: z.record(z.any()),
  consistencyChecks: z.array(z.record(z.any())),
  missingDocuments: z.array(z.record(z.any())),
  expiringDocuments: z.array(z.record(z.any())),
  medicalFlags: z.array(z.record(z.any())),
  overallStatus: z.enum(["APPROVED", "CONDITIONAL", "REJECTED"]),
  overallScore: z.number().min(0).max(100),
  summary: z.string(),
  recommendations: z.array(z.string()),
});

export type ExtractionOutput = z.infer<typeof extractionOutputSchema>;
export type ValidationOutput = z.infer<typeof validationOutputSchema>;

export type LlmExtractInput = {
  mimeType: string;
  fileName: string;
  parts: NormalizedPart[];
  prompt: string;
  timeoutMs: number;
};

export type LlmTextInput = {
  prompt: string;
  timeoutMs: number;
};

export interface LlmProvider {
  extractDocument(input: LlmExtractInput): Promise<{ rawText: string }>;
  completeText(input: LlmTextInput): Promise<{ rawText: string }>;
  healthCheck(): Promise<"OK" | "DEGRADED" | "DOWN">;
}
