import { z } from "zod";

import type { NormalizedPart } from "../documents/normalize";

const nullableString = z.preprocess((value) => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string") {
    const normalized = value.trim();
    return normalized === "" ? null : normalized;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return value;
}, z.union([z.string(), z.null()]));

const looseString = z.preprocess((value) => {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return value;
}, z.string());

const llmBoolean = z.preprocess((value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    const compact = normalized.replace(/[._-]/g, " ");

    if (
      ["true", "yes", "y", "1", "required", "present"].includes(normalized) ||
      compact.includes("revalidation required") ||
      compact.includes("is required")
    ) {
      return true;
    }

    if (
      ["false", "no", "n", "0", "not required", "absent", "n/a", "na", "none", "null"].includes(normalized) ||
      compact.includes("not required") ||
      compact.includes("no revalidation") ||
      compact.includes("revalidation not required") ||
      compact.includes("not applicable") ||
      compact.includes("n/a") ||
      compact.includes("na")
    ) {
      return false;
    }

    return null;
  }

  return null;
}, z.union([z.boolean(), z.null()]));

const stringEnum = <T extends [string, ...string[]]>(values: T) =>
  z.preprocess((value) => {
    if (typeof value === "string") {
      return value.trim().toUpperCase();
    }

    return value;
  }, z.enum(values));

const nullableNumber = z.preprocess((value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["n/a", "na", "none", "null", "unknown"].includes(normalized)) {
      return null;
    }

    const parsed = Number(value);
    return Number.isNaN(parsed) ? value : parsed;
  }

  return value;
}, z.union([z.number(), z.null()]));

const numberInRange = (min: number, max: number) =>
  z.preprocess((value) => {
    if (typeof value === "number") {
      return value;
    }

    if (typeof value === "string") {
      const normalized = value.trim();
      const parsed = Number(normalized);
      return Number.isNaN(parsed) ? value : parsed;
    }

    return value;
  }, z.number().min(min).max(max));

const looseObject = z.record(z.any());

const looseObjectArray = z.preprocess((value) => {
  if (value === null || value === undefined) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map((item) => {
      if (item && typeof item === "object" && !Array.isArray(item)) {
        return item;
      }

      if (typeof item === "string") {
        return { value: item };
      }

      return { value: item };
    });
  }

  if (value && typeof value === "object" && !Array.isArray(value)) {
    return [value];
  }

  return [{ value }];
}, z.array(looseObject));

const looseStringArray = z.preprocess((value) => {
  if (value === null || value === undefined) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map((item) => (typeof item === "string" ? item : JSON.stringify(item)));
  }

  if (typeof value === "string") {
    return [value];
  }

  return [JSON.stringify(value)];
}, z.array(z.string()));

export const extractionOutputSchema = z.object({
  detection: z.object({
    documentType: looseString,
    documentName: looseString,
    category: looseString,
    applicableRole: looseString,
    isRequired: llmBoolean,
    confidence: stringEnum(["HIGH", "MEDIUM", "LOW"]),
    detectionReason: looseString,
  }),
  holder: z.object({
    fullName: nullableString,
    dateOfBirth: nullableString,
    nationality: nullableString,
    passportNumber: nullableString,
    sirbNumber: nullableString,
    rank: nullableString,
    photo: nullableString,
  }),
  fields: z.array(
    z.object({
      key: looseString,
      label: looseString,
      value: looseString,
      importance: looseString,
      status: looseString,
    }),
  ),
  validity: z.object({
    dateOfIssue: nullableString,
    dateOfExpiry: nullableString,
    isExpired: llmBoolean,
    daysUntilExpiry: nullableNumber,
    revalidationRequired: llmBoolean,
  }),
  compliance: z.object({
    issuingAuthority: nullableString,
    regulationReference: nullableString,
    imoModelCourse: nullableString,
    recognizedAuthority: llmBoolean,
    limitations: nullableString,
  }),
  medicalData: z.object({
    fitnessResult: looseString,
    drugTestResult: looseString,
    restrictions: nullableString,
    specialNotes: nullableString,
    expiryDate: nullableString,
  }),
  flags: z.array(
    z.object({
      severity: looseString,
      message: looseString,
    }),
  ),
  summary: looseString,
});

export const validationOutputSchema = z.object({
  holderProfile: looseObject,
  consistencyChecks: looseObjectArray,
  missingDocuments: looseObjectArray,
  expiringDocuments: looseObjectArray,
  medicalFlags: looseObjectArray,
  overallStatus: stringEnum(["APPROVED", "CONDITIONAL", "REJECTED"]),
  overallScore: numberInRange(0, 100),
  summary: looseString,
  recommendations: looseStringArray,
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
