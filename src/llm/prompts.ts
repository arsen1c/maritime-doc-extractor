export const EXTRACTION_PROMPT_VERSION = "v1";

export const EXTRACTION_PROMPT = `You are an expert maritime document analyst with deep knowledge of STCW, MARINA, IMO, and international seafarer certification standards.

A document has been provided. Perform the following in a single pass:
1. IDENTIFY the document type from the taxonomy below
2. DETERMINE if this belongs to a DECK officer, ENGINE officer, BOTH, or is role-agnostic (N/A)
3. EXTRACT all fields that are meaningful for this specific document type
4. FLAG any compliance issues, anomalies, or concerns

Document type taxonomy (use these exact codes):
COC | COP_BT | COP_PSCRB | COP_AFF | COP_MEFA | COP_MECA | COP_SSO | COP_SDSD |
ECDIS_GENERIC | ECDIS_TYPE | SIRB | PASSPORT | PEME | DRUG_TEST | YELLOW_FEVER |
ERM | MARPOL | SULPHUR_CAP | BALLAST_WATER | HATCH_COVER | BRM_SSBT |
TRAIN_TRAINER | HAZMAT | FLAG_STATE | OTHER

Return ONLY a valid JSON object. No markdown. No code fences. No preamble.

{
  "detection": {
    "documentType": "SHORT_CODE",
    "documentName": "Full human-readable document name",
    "category": "IDENTITY | CERTIFICATION | STCW_ENDORSEMENT | MEDICAL | TRAINING | FLAG_STATE | OTHER",
    "applicableRole": "DECK | ENGINE | BOTH | N/A",
    "isRequired": true,
    "confidence": "HIGH | MEDIUM | LOW",
    "detectionReason": "One sentence explaining how you identified this document"
  },
  "holder": {
    "fullName": "string or null",
    "dateOfBirth": "DD/MM/YYYY or null",
    "nationality": "string or null",
    "passportNumber": "string or null",
    "sirbNumber": "string or null",
    "rank": "string or null",
    "photo": "PRESENT | ABSENT"
  },
  "fields": [
    {
      "key": "snake_case_key",
      "label": "Human-readable label",
      "value": "extracted value as string",
      "importance": "CRITICAL | HIGH | MEDIUM | LOW",
      "status": "OK | EXPIRED | WARNING | MISSING | N/A"
    }
  ],
  "validity": {
    "dateOfIssue": "string or null",
    "dateOfExpiry": "string | 'No Expiry' | 'Lifetime' | null",
    "isExpired": false,
    "daysUntilExpiry": null,
    "revalidationRequired": null
  },
  "compliance": {
    "issuingAuthority": "string",
    "regulationReference": "e.g. STCW Reg VI/1 or null",
    "imoModelCourse": "e.g. IMO 1.22 or null",
    "recognizedAuthority": true,
    "limitations": "string or null"
  },
  "medicalData": {
    "fitnessResult": "FIT | UNFIT | N/A",
    "drugTestResult": "NEGATIVE | POSITIVE | N/A",
    "restrictions": "string or null",
    "specialNotes": "string or null",
    "expiryDate": "string or null"
  },
  "flags": [
    {
      "severity": "CRITICAL | HIGH | MEDIUM | LOW",
      "message": "Description of issue or concern"
    }
  ],
  "summary": "Two-sentence plain English summary of what this document confirms about the holder."
}`;

export function buildLowConfidenceRetryPrompt(input: { fileName: string; mimeType: string }) {
  return `${EXTRACTION_PROMPT}

Additional context for this retry:
- Original file name: ${input.fileName}
- MIME type: ${input.mimeType}

The previous answer had LOW confidence. Re-evaluate the document carefully and return the strongest valid JSON result you can support from the document.`;
}

export function buildRepairPrompt(rawText: string) {
  return `The following model output was intended to be a JSON object but is malformed.

Return only a corrected JSON object. Do not add explanation.

Malformed output:
${rawText}`;
}

export function buildValidationPrompt(input: {
  sessionId: string;
  documents: Array<Record<string, unknown>>;
}) {
  return `You are a maritime compliance reviewer assessing a seafarer document session.

You will receive summaries of extracted documents from one session.
Assess identity consistency, document coverage, expiries, medical concerns, and cross-document contradictions.
Be conservative. Do not invent missing facts. If data is unavailable, say so explicitly in the corresponding field.

Return ONLY a valid JSON object with this shape:
{
  "holderProfile": {},
  "consistencyChecks": [],
  "missingDocuments": [],
  "expiringDocuments": [],
  "medicalFlags": [],
  "overallStatus": "APPROVED | CONDITIONAL | REJECTED",
  "overallScore": 0,
  "summary": "string",
  "recommendations": ["string"]
}

Session ID: ${input.sessionId}

Documents:
${JSON.stringify(input.documents, null, 2)}`;
}
