# TEST SCENARIOS & RESULTS TRACKER

## Overview

This file serves as a tracker for testing the maritime document extraction API endpoints. Use this to document test runs, expected vs actual results, and any issues encountered.

---

## Quick Reference: Test Documents

| # | Document | Type | Role | Holder | Valid Till |
|---|----------|------|------|--------|-----------|
| 1 | 01_COC_Master.md | COC | DECK | Ricardo Santos | 17/06/2028 |
| 2 | 02_PEME_Medical.md | PEME | BOTH | Samuel Samoya | 06/01/2027 |
| 3 | 03_DrugTest.md | Drug Test | ALL | Francisco Salonoy | 03/03/2027 |
| 4 | 04_Passport.md | Passport | Identity | Ricardo Santos | 17/06/2032 |
| 5 | 05_YellowFever.md | Vaccination | ALL | Maria Rosa Santos | 27/01/2035 |
| 6 | 06_SIRB.md | SIRB | Identity | Samuel Samoya | 14/01/2035 |
| 7 | 07_ECDIS.md | Training | DECK | Ricardo Santos | 14/02/2026 |
| 8 | 08_COC_ChiefOfficer.md | COC | DECK | Francisco Salonoy | 21/05/2029 |
| 9 | 09_FireFighting.md | Training | ALL | Maria Rosa Santos | 13/03/2030 |
| 10 | 10_OilTanker.md | Endorsement | ENGINE | Samuel Samoya | 14/04/2028 |
| 11 | 11_Radar.md | Training | DECK | Ricardo Santos | 31/01/2030 |
| 12 | 12_SeamansBook.md | Employment | ALL | Francisco Salonoy | 02/01/2030 |

---

## Test Scenario 1: Single Document Extraction (PEME Medical)

### Setup
- **Document:** 02_PEME_Medical.md (convert to PDF/image)
- **Holder:** Samuel Pablo Samoya
- **Endpoint:** POST /api/extract
- **Mode:** sync (default)

### Expected Extraction
```json
{
  "documentType": "PEME",
  "documentName": "Pre-Employment Medical Examination",
  "applicableRole": "ENGINE",
  "category": "MEDICAL",
  "confidence": "HIGH",
  "holderName": "SAMUEL PABLO SAMOYA",
  "dateOfBirth": "12/03/1988",
  "fitnessResult": "FIT",
  "medicalData": {
    "fitnessResult": "FIT",
    "drugTestResult": "NEGATIVE",
    "expiryDate": "06/01/2027"
  },
  "flags": [
    {
      "severity": "MEDIUM",
      "message": "Schistosomiasis - cleared by hematologist on 05/03/2025"
    },
    {
      "severity": "MEDIUM",
      "message": "History of cardiac dysrhythmia - Class B functional status"
    }
  ]
}
```

### Test Results
- **Date:** _______________
- **Time:** _______________
- **Confidence:** HIGH / MEDIUM / LOW
- **Extraction Accuracy:** _______________
- **Processing Time:** _______________
- **Status:** ✓ PASS / ✗ FAIL
- **Notes:** _________________________________________________________________

---

## Test Scenario 2: COC Certificate Extraction (Master)

### Setup
- **Document:** 01_COC_Master.md (convert to PDF/image)
- **Holder:** Ricardo Mariano Santos
- **Endpoint:** POST /api/extract
- **Mode:** sync

### Expected Extraction
```json
{
  "documentType": "COC",
  "documentName": "Certificate of Competency - Master",
  "applicableRole": "DECK",
  "category": "CERTIFICATION",
  "confidence": "HIGH",
  "holderName": "RICARDO MARIANO SANTOS",
  "dateOfBirth": "15/03/1985",
  "sirbNumber": "C0869326",
  "fields": [
    {
      "key": "certificate_number",
      "value": "PHIL-MS-2024-087432",
      "importance": "CRITICAL",
      "status": "OK"
    },
    {
      "key": "rank",
      "value": "Master - Unlimited",
      "importance": "CRITICAL",
      "status": "OK"
    }
  ],
  "validity": {
    "dateOfIssue": "18/06/2023",
    "dateOfExpiry": "17/06/2028",
    "isExpired": false,
    "daysUntilExpiry": 846,
    "revalidationRequired": false
  }
}
```

### Test Results
- **Date:** _______________
- **Time:** _______________
- **Confidence:** HIGH / MEDIUM / LOW
- **Certificate Number Extraction:** _______________
- **Expiry Date Parsing:** _______________
- **Processing Time:** _______________
- **Status:** ✓ PASS / ✗ FAIL
- **Notes:** _________________________________________________________________

---

## Test Scenario 3: Multi-Document Session (Complete Officer Profile)

### Setup
- **Documents:**
  1. 01_COC_Master.md
  2. 02_PEME_Medical.md
  3. 04_Passport.md
  4. 05_YellowFever.md
  5. 07_ECDIS.md
  6. 11_Radar.md
  
- **Holder:** Ricardo Mariano Santos
- **Endpoint:** POST /api/extract (multiple calls), then GET /api/sessions/{sessionId}

### Expected Session Summary
```json
{
  "sessionId": "uuid",
  "documentCount": 6,
  "detectedRole": "DECK",
  "overallHealth": "OK",
  "documents": [
    {
      "id": "uuid",
      "fileName": "01_COC_Master.pdf",
      "documentType": "COC",
      "applicableRole": "DECK",
      "holderName": "RICARDO MARIANO SANTOS",
      "isExpired": false,
      "flagCount": 0
    }
    // ... more documents
  ]
}
```

### Test Results
- **Date:** _______________
- **SessionId Created:** _______________
- **Documents Uploaded:** 6 / 6 ✓
- **All Extractions Successful:** ✓ YES / ✗ NO
- **Detected Role:** DECK ✓
- **Overall Health Calculated:** OK / WARN / CRITICAL
- **Status:** ✓ PASS / ✗ FAIL
- **Issues:** _________________________________________________________________

---

## Test Scenario 4: Cross-Document Validation

### Setup
- **Session:** From Scenario 3 (Ricardo Santos - complete profile)
- **Endpoint:** POST /api/sessions/{sessionId}/validate

### Expected Validation Result
```json
{
  "sessionId": "uuid",
  "holderProfile": {
    "name": "RICARDO MARIANO SANTOS",
    "dateOfBirth": "15/03/1985",
    "nationality": "PHILIPPINE",
    "rank": "Master - Unlimited",
    "applicableRole": "DECK"
  },
  "consistencyChecks": [
    {
      "check": "Name consistency",
      "status": "PASS",
      "message": "All documents list same holder name"
    },
    {
      "check": "Date of birth consistency",
      "status": "PASS",
      "message": "DOB consistent across PEME, SIRB, and Passport"
    }
  ],
  "overallStatus": "APPROVED",
  "overallScore": 92,
  "recommendations": [
    "Officer cleared for unlimited maritime service",
    "All mandatory certifications current",
    "Medical fitness confirmed for next 24 months"
  ]
}
```

### Test Results
- **Date:** _______________
- **Validation Completed:** ✓ YES / ✗ NO
- **Consistency Checks Passed:** ___ / ___ ✓
- **Overall Status:** APPROVED / CONDITIONAL / REJECTED
- **Score:** _____ / 100
- **Processing Time:** _______________
- **Status:** ✓ PASS / ✗ FAIL
- **Notes:** _________________________________________________________________

---

## Test Scenario 5: Async Processing & Job Polling

### Setup
- **Document:** 02_PEME_Medical.md (convert to PDF/image)
- **Endpoint:** POST /api/extract?mode=async

### Step 1: Submit Async Job
- **Expected Response:** 202 Accepted
```json
{
  "jobId": "uuid",
  "sessionId": "uuid",
  "status": "QUEUED",
  "pollUrl": "/api/jobs/uuid",
  "estimatedWaitMs": 6000
}
```

### Test Results - Submission
- **Date:** _______________
- **Response Code:** 202 / ___
- **JobId Received:** ✓ YES / ✗ NO
- **JobId:** _______________
- **Status:** ✓ PASS / ✗ FAIL

### Step 2: Poll Job Status - Queued
- **Endpoint:** GET /api/jobs/{jobId}
- **Expected State:** QUEUED

### Test Results - Queued Poll
- **Poll Time:** _______________
- **Response Code:** 200
- **Status:** QUEUED ✓
- **Queue Position:** ___ / ___
- **Status:** ✓ PASS / ✗ FAIL

### Step 3: Poll Job Status - Processing
- **Endpoint:** GET /api/jobs/{jobId}
- **Expected State:** PROCESSING

### Test Results - Processing Poll
- **Poll Time:** _______________
- **Response Code:** 200
- **Status:** PROCESSING ✓
- **Estimated Time Remaining:** ___ ms
- **Status:** ✓ PASS / ✗ FAIL

### Step 4: Poll Job Status - Complete
- **Endpoint:** GET /api/jobs/{jobId}
- **Expected State:** COMPLETE

### Test Results - Complete Poll
- **Poll Time:** _______________
- **Response Code:** 200
- **Status:** COMPLETE ✓
- **ExtractionId Returned:** ✓ YES / ✗ NO
- **Total Processing Time:** ___ ms
- **Status:** ✓ PASS / ✗ FAIL
- **Overall Scenario Status:** ✓ PASS / ✗ FAIL
- **Notes:** _________________________________________________________________

---

## Test Scenario 6: Document Deduplication

### Setup
- **Document:** 04_Passport.md (convert to PDF/image)
- **Holder:** Ricardo Mariano Santos
- **Endpoint:** POST /api/extract (twice)

### Test Results - First Upload
- **Date/Time:** _______________
- **File Hash Generated:** ✓ YES / ✗ NO
- **Response Code:** 200 / 202
- **ExtractionId:** _______________
- **X-Deduplicated Header:** Not present ✓
- **Status:** ✓ PASS / ✗ FAIL

### Test Results - Second Upload (Same File)
- **Date/Time:** _______________
- **Response Code:** 200 ✓
- **X-Deduplicated Header:** Present ✓
- **ExtractionId:** Same as first upload ✓
- **Processing Time:** Instant (cached) ✓
- **Status:** ✓ PASS / ✗ FAIL
- **Overall Deduplication Test:** ✓ PASS / ✗ FAIL
- **Notes:** _________________________________________________________________

---

## Test Scenario 7: Missing Documents & Compliance Gaps

### Setup
- **Documents:** (Only CoreRequirements)
  1. 08_COC_ChiefOfficer.md
  2. 12_SeamansBook.md
  
- **Missing (Required for DECK role):**
  - PEME/Medical
  - Passport/Identity
  - Vaccinations
  
- **Endpoint:** POST /api/sessions/{sessionId}/validate

### Expected Validation Result
```json
{
  "missingDocuments": [
    {
      "type": "PEME",
      "requirement": "CRITICAL",
      "reason": "Medical fitness required for all maritime officers"
    },
    {
      "type": "PASSPORT",
      "requirement": "CRITICAL",
      "reason": "Travel document required for international service"
    },
    {
      "type": "YELLOW_FEVER",
      "requirement": "HIGH",
      "reason": "Vaccination required for service in endemic areas"
    }
  ],
  "overallStatus": "REJECTED",
  "overallScore": 45,
  "recommendations": [
    "Cannot clear officer for service - missing critical documents",
    "Obtain PEME from approved medical facility",
    "Obtain current passport and vaccinations"
  ]
}
```

### Test Results
- **Date:** _______________
- **Missing Documents Identified:** 3 / 3 ✓
- **Overall Status:** REJECTED ✓
- **Score:** < 60 ✓
- **Recommendations Generated:** ✓ YES / ✗ NO
- **Status:** ✓ PASS / ✗ FAIL
- **Notes:** _________________________________________________________________

---

## Test Scenario 8: Expired Document Detection

### Setup
- **Document:** 07_ECDIS.md
- **Modification:** Change expiry date to past date (e.g., 14/02/2024)
- **Endpoint:** POST /api/extract

### Expected Extraction
```json
{
  "validity": {
    "dateOfExpiry": "14/02/2024",
    "isExpired": true,
    "daysUntilExpiry": -457,
    "revalidationRequired": true
  },
  "flags": [
    {
      "severity": "CRITICAL",
      "message": "ECDIS certificate has expired"
    }
  ]
}
```

### Test Results
- **Date:** _______________
- **Expiry Detection:** ✓ YES / ✗ NO
- **isExpired Flag:** true ✓
- **Critical Flag Set:** ✓ YES / ✗ NO
- **Days Until Expiry:** Negative ✓
- **Status:** ✓ PASS / ✗ FAIL
- **Notes:** _________________________________________________________________

---

## Test Scenario 9: High Confidence vs Low Confidence Handling

### Setup
- **Document Options:**
  - Option A: Clear, high-quality PDF/image (expected HIGH confidence)
  - Option B: Blurry/low-quality image (expected LOW/MEDIUM confidence)
  
- **Endpoint:** POST /api/extract

### Test Results - High Quality Document
- **Date:** _______________
- **Source Quality:** Clear/High-Res ✓
- **Confidence Level:** HIGH ✓
- **Extraction Complete:** ✓ YES / ✗ NO
- **Status:** ✓ PASS / ✗ FAIL

### Test Results - Low Quality Document
- **Date:** _______________
- **Source Quality:** Blurry/Low-Res
- **Confidence Level Reported:** LOW / MEDIUM
- **Retry Triggered:** ✓ YES / ? (LLM-dependent)
- **Final Confidence:** HIGH / MEDIUM / LOW
- **Extraction Complete:** ✓ YES / ✗ NO
- **Status:** ✓ PASS / ✗ FAIL
- **Notes:** _________________________________________________________________

---

## Test Scenario 10: Rate Limiting

### Setup
- **Endpoint:** POST /api/extract
- **Rate Limit:** 10 requests per minute per IP
- **Test Method:** Submit requests rapidly

### Test Results
- **Date:** _______________
- **Requests 1-10:** All 200/202 ✓
- **Request 11:** 429 RATE_LIMITED ✓
- **Retry-After Header:** Present ✓
- **RetryAfterMs in body:** Present ✓
- **Response Example:**
  ```json
  {
    "error": "RATE_LIMITED",
    "message": "10 requests per minute exceeded",
    "retryAfterMs": 52000
  }
  ```
- **Status:** ✓ PASS / ✗ FAIL
- **Notes:** _________________________________________________________________

---

## Test Scenario 11: Error Handling - Unsupported Format

### Setup
- **File Type:** .txt or other unsupported format
- **Endpoint:** POST /api/extract
- **Expected Response:** 400 UNSUPPORTED_FORMAT

### Test Results
- **Date:** _______________
- **File Uploaded:** document.txt
- **Response Code:** 400 ✓
- **Error Code:** UNSUPPORTED_FORMAT ✓
- **Error Message Present:** ✓ YES / ✗ NO
- **Response Structure Correct:** ✓ YES / ✗ NO
- **Status:** ✓ PASS / ✗ FAIL

---

## Test Scenario 12: Error Handling - File Too Large

### Setup
- **File Size:** > 10MB (simulate if possible)
- **Endpoint:** POST /api/extract
- **Expected Response:** 413 FILE_TOO_LARGE

### Test Results
- **Date:** _______________
- **File Size:** _____ MB
- **Response Code:** 413 ✓
- **Error Code:** FILE_TOO_LARGE ✓
- **Error Message:** Clear and helpful ✓
- **Status:** ✓ PASS / ✗ FAIL

---

## Test Scenario 13: LLM Failure Recovery

### Setup
- **Condition:** LLM returns malformed JSON
- **Expected Behavior:** Retry with repair prompt
- **Endpoint:** POST /api/extract

### Test Results
- **Date:** _______________
- **LLM Response Status:** Observed ✓ YES / ✗ NO
- **Retry Attempted:** ✓ YES / ✗ NO
- **Repair Prompt Sent:** ✓ YES / ✗ NO
- **Final Result:** Valid JSON ✓
- **Raw Response Stored:** ✓ YES / ✗ NO
- **Status:** ✓ PASS / ✗ FAIL
- **Notes:** _________________________________________________________________

---

## Test Scenario 14: Health Check Endpoint

### Setup
- **Endpoint:** GET /api/health
- **Expected Response:** 200 OK with dependency status

### Test Results
- **Date:** _______________
- **Response Code:** 200 ✓
- **Health Status:** OK / WARN / ERROR
- **Database Dependency:** OK / WARN / ERROR
- **LLM Provider Dependency:** OK / WARN / ERROR
- **Queue Dependency:** OK / WARN / ERROR
- **Response Structure:** Correct ✓
- **Status:** ✓ PASS / ✗ FAIL

---

## Summary Report

### Overall Test Status

| Scenario | Status | Date | Notes |
|----------|--------|------|-------|
| 1. Single Document Extraction | ⬜ / ✓ / ✗ | ___ | |
| 2. COC Certificate Extraction | ⬜ / ✓ / ✗ | ___ | |
| 3. Multi-Document Session | ⬜ / ✓ / ✗ | ___ | |
| 4. Cross-Document Validation | ⬜ / ✓ / ✗ | ___ | |
| 5. Async Processing & Polling | ⬜ / ✓ / ✗ | ___ | |
| 6. Document Deduplication | ⬜ / ✓ / ✗ | ___ | |
| 7. Missing Documents & Gaps | ⬜ / ✓ / ✗ | ___ | |
| 8. Expired Document Detection | ⬜ / ✓ / ✗ | ___ | |
| 9. Confidence Level Handling | ⬜ / ✓ / ✗ | ___ | |
| 10. Rate Limiting | ⬜ / ✓ / ✗ | ___ | |
| 11. Error - Unsupported Format | ⬜ / ✓ / ✗ | ___ | |
| 12. Error - File Too Large | ⬜ / ✓ / ✗ | ___ | |
| 13. LLM Failure Recovery | ⬜ / ✓ / ✗ | ___ | |
| 14. Health Check Endpoint | ⬜ / ✓ / ✗ | ___ | |

### Summary Statistics

- **Total Scenarios:** 14
- **Passed:** ___ / 14
- **Failed:** ___ / 14
- **Not Yet Started:** ⬜ ___ / 14
- **Pass Rate:** ____ %

### Critical Issues Found

1. ___________________________________________________________________________
2. ___________________________________________________________________________
3. ___________________________________________________________________________

### Recommendations

1. ___________________________________________________________________________
2. ___________________________________________________________________________
3. ___________________________________________________________________________

### Sign-Off

**Tested By:** _____________________  
**Date:** _____________________  
**Approved By:** _____________________  
**Date:** _____________________

---

## Legend

- ✓ = PASS / Success
- ✗ = FAIL / Error
- ⬜ = Not Yet Tested / Pending

---

**Last Updated:** _______________  
**Next Review Date:** _______________
