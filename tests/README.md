# TEST DOCUMENTS README

## Maritime Document Extraction Test Suite

This folder contains comprehensive markdown test documents representing various maritime certification types. These documents can be converted to PDF and images for testing the extraction endpoints.

---

## Document Types Included

### 1. **COC - Certificate of Competency**
- **File:** `01_COC_Master.md`
- **Document Type:** Master - Unlimited Tonnage
- **Applicable Role:** DECK
- **Key Fields:** CoC Number, Training Records, Medical Status, Endorsements
- **Use Case:** Test main certification extraction and date validation

### 2. **PEME - Pre-Employment Medical Examination**
- **File:** `02_PEME_Medical.md`
- **Document Type:** Medical Fitness Certificate
- **Applicable Role:** ENGINE/DECK (role-agnostic)
- **Key Fields:** Medical findings, labs, blood type, fitness classification
- **Use Case:** Test medical data extraction and compliance flags

### 3. **Drug Test Certificate**
- **File:** `03_DrugTest.md`
- **Document Type:** Drug & Alcohol Screening
- **Applicable Role:** All roles
- **Key Fields:** Test results, screening panels, MRO certification
- **Use Case:** Test screening validation and negative result extraction

### 4. **Passport**
- **File:** `04_Passport.md`
- **Document Type:** International Travel Document
- **Applicable Role:** Identity/N/A (role-agnostic)
- **Key Fields:** Passport number, visa pages, validity dates
- **Use Case:** Test identity document OCR and multi-page handling

### 5. **Yellow Fever Vaccination**
- **File:** `05_YellowFever.md`
- **Document Type:** Medical Vaccination Certificate
- **Applicable Role:** All roles
- **Key Fields:** Vaccination date, validity periods, medical authority
- **Use Case:** Test date parsing and vaccination validity checks

### 6. **SIRB - Seafarer Identity Record Book**
- **File:** `06_SIRB.md`
- **Document Type:** Seafarer Identity Document
- **Applicable Role:** Identity/All roles
- **Key Fields:** SIRB number, employment history, background checks
- **Use Case:** Test complex multi-section document with history tables

### 7. **ECDIS Certificate**
- **File:** `07_ECDIS.md`
- **Document Type:** ECDIS Type Approval & Competency
- **Applicable Role:** DECK
- **Key Fields:** System type ratings, training hours, simulator scores
- **Use Case:** Test technical training certificate extraction

### 8. **COC - Chief Officer**
- **File:** `08_COC_ChiefOfficer.md`
- **Document Type:** Chief Officer - Unlimited Tonnage
- **Applicable Role:** DECK
- **Key Fields:** CoC number, performance ratings, seagoing service
- **Use Case:** Test management-level certification extraction

### 9. **Advanced Fire Fighting**
- **File:** `09_FireFighting.md`
- **Document Type:** Mandatory Safety Training Certificate
- **Applicable Role:** All roles
- **Key Fields:** Training modules, practical assessments, simulator scores
- **Use Case:** Test training certificate extraction with multiple modules

### 10. **Oil Tanker Endorsement**
- **File:** `10_OilTanker.md`
- **Document Type:** Specialized Cargo Training Endorsement
- **Applicable Role:** ENGINE/DECK
- **Key Fields:** Cargo type authorizations, simulator exercises, experience
- **Use Case:** Test specialized endorsement extraction

### 11. **Radar Observation Certificate**
- **File:** `11_Radar.md`
- **Document Type:** Navigation Systems Training
- **Applicable Role:** DECK
- **Key Fields:** System type-ratings, exam scores, ARPA competency
- **Use Case:** Test equipment certification and type-rating extraction

### 12. **Seaman's Book**
- **File:** `12_SeamansBook.md`
- **Document Type:** Maritime Employment Record Book
- **Applicable Role:** All roles
- **Key Fields:** Employment history, vessel records, performance ratings
- **Use Case:** Test complex employment history and multi-vessel extraction

---

## File Conversion Instructions

### Convert MD to PDF

**Option 1: Using Pandoc**
```bash
pandoc 01_COC_Master.md -o 01_COC_Master.pdf
```

**Option 2: Using VS Code**
- Install "Markdown PDF" extension
- Right-click on .md file → "Markdown PDF: Export (pdf)"

**Option 3: Using Online converter**
- Upload to https://pandoc.org/try/

### Convert PDF to Images

**Using ImageMagick (batch conversion):**
```bash
convert -density 300 01_COC_Master.pdf -quality 85 01_COC_Master.png
```

**Using Ghostscript (better quality):**
```bash
gs -q -dNOPAUSE -dBATCH -dSAFER -sDEVICE=png16m -r300 \
   -sOutputFile=01_COC_Master-%d.png 01_COC_Master.pdf
```

---

## Testing Scenarios

### Scenario 1: Single Document Extraction
**Purpose:** Test basic extraction pipeline
- Upload `02_PEME_Medical.md` (PDF/image)
- Verify extraction of medical data
- Validate compliance flags detection

### Scenario 2: Multi-Document Session
**Purpose:** Test session management and validation
1. Upload `01_COC_Master.md` - Expected: COC document, DECK role
2. Upload `02_PEME_Medical.md` - Expected: Medical document, Class A fitness
3. Upload `03_DrugTest.md` - Expected: Drug test, Negative result
4. Call `/api/sessions/{sessionId}/validate` - Expected: Cross-document validation

### Scenario 3: Expired Documents
**Purpose:** Test compliance flag detection
- Upload `05_YellowFever.md` with modified expiry date
- Verify system detects expiration and sets appropriate flags

### Scenario 4: Async Processing
**Purpose:** Test job queue and polling
- Upload large set of documents with `?mode=async`
- Poll `/api/jobs/{jobId}` for status
- Verify completion and result retrieval

### Scenario 5: Deduplication
**Purpose:** Test hash-based deduplication
- Upload `01_COC_Master.md` 
- Upload same file again
- Verify `X-Deduplicated: true` header response

### Scenario 6: Multi-Person Session
**Purpose:** Test handling multiple seafarers in one session
- Upload documents for Officer 1 (Ricardo Santos)
- Upload documents for Officer 2 (Francisco Salonoy)
- Verify session correctly identifies both holders

### Scenario 7: Missing Endorsements
**Purpose:** Test validation of missing required documents
- Upload only COC and Passport
- Call validate - Expected: Flag missing PEME and medical documents
- Expected overall status: CONDITIONAL or REJECTED

### Scenario 8: Error Handling
**Purpose:** Test error response handling
- Upload corrupted file (if testing error handling)
- Upload unsupported format
- Verify appropriate error codes returned

---

## Document Details by Role

### DECK Officers
Required Documents:
- ✓ COC (Certificate of Competency) - Deck
- ✓ PEME (Medical Examination)
- ✓ Passport & Travel Documents
- ✓ SIRB (Seafarer Identity Book)
- ✓ Yellow Fever Vaccination
- ✓ Drug Test Certificate
- ✓ ECDIS Certificate (if using electronic charts)
- ✓ Radar Certificate (for navigation)
- ✓ Advanced Fire Fighting

**Test Files:** 01, 02, 04, 05, 06, 07, 08, 09, 11, 12

### ENGINE Officers
Required Documents:
- ✓ COC (Certificate of Competency) - Engine
- ✓ PEME (Medical Examination)
- ✓ Passport & Travel Documents
- ✓ SIRB (Seafarer Identity Book)
- ✓ Yellow Fever Vaccination
- ✓ Drug Test Certificate
- ✓ Oil Tanker Endorsement (if applicable)
- ✓ Advanced Fire Fighting

**Test Files:** 02, 03, 04, 05, 06, 09, 10, 12

---

## Expected Extraction Structure

Each document when processed should return:

```json
{
  "detection": {
    "documentType": "CODE",
    "documentName": "Full name",
    "category": "CERTIFICATION | MEDICAL | IDENTITY | etc",
    "applicableRole": "DECK | ENGINE | BOTH | N/A",
    "confidence": "HIGH | MEDIUM | LOW"
  },
  "holder": {
    "fullName": "Name from document",
    "dateOfBirth": "DD/MM/YYYY format",
    "nationality": "Country",
    "passportNumber": "if applicable",
    "sirbNumber": "if applicable"
  },
  "fields": [
    {
      "key": "field_name",
      "label": "Human readable label",
      "value": "extracted value",
      "importance": "CRITICAL | HIGH | MEDIUM | LOW",
      "status": "OK | EXPIRED | WARNING | MISSING | N/A"
    }
  ],
  "validity": {
    "dateOfIssue": "date",
    "dateOfExpiry": "date or 'No Expiry' or 'Lifetime'",
    "isExpired": false,
    "daysUntilExpiry": number,
    "revalidationRequired": boolean
  },
  "flags": [
    {
      "severity": "CRITICAL | HIGH | MEDIUM | LOW",
      "message": "Description of issue"
    }
  ]
}
```

---

## Holder Information Reference

### Holder 1: Ricardo Mariano Santos
- **DOB:** 15 March 1985 (Age 39)
- **SIRB:** C0869326
- **Passport:** E123456789
- **Nationality:** Philippine
- **Rank:** Master/Captain
- **Roles:** DECK
- **Medical Status:** Class A (Unlimited)

**Documents:**
- 01_COC_Master.md
- 02_PEME_Medical.md
- 04_Passport.md
- 05_YellowFever.md
- 06_SIRB.md
- 07_ECDIS.md
- 11_Radar.md

### Holder 2: Francisco Javier Salonoy
- **DOB:** 28 August 1990 (Age 34)
- **SIRB:** C0824567
- **Passport:** F234567890
- **Nationality:** Philippine
- **Rank:** Chief Officer
- **Roles:** DECK
- **Medical Status:** Class A (Unlimited)

**Documents:**
- 03_DrugTest.md
- 08_COC_ChiefOfficer.md
- 12_SeamansBook.md

### Holder 3: Samuel Pablo Samoya
- **DOB:** 12 March 1988 (Age 36)
- **SIRB:** C0869326
- **Nationality:** Philippine
- **Rank:** Chief Engineer
- **Roles:** ENGINE
- **Medical Status:** Class A (with notes)

**Documents:**
- 02_PEME_Medical.md (alternative holder)
- 03_DrugTest.md (alternative holder)
- 10_OilTanker.md

### Holder 4: Maria Rosa Santos
- **DOB:** 22 July 1992 (Age 32)
- **Nationality:** Philippine
- **Rank:** 2nd Engineer
- **Roles:** ENGINE

**Documents:**
- 05_YellowFever.md (alternative holder)
- 09_FireFighting.md

---

## Validation Criteria

### Critical Flags to Test
- ✓ Expired documents (dates in past)
- ✓ Documents expiring within 90 days
- ✓ Missing critical endorsements
- ✓ Medical fitness issues
- ✓ Drug test failures (or alternatives: substitutions)
- ✓ Incomplete training records

### Compliance Checks
- ✓ Officer has required certifications for rank
- ✓ Medical fitness valid and current
- ✓ All vaccinations current
- ✓ Training records complete
- ✓ No disciplinary issues
- ✓ Port State Control clean record

---

## Endpoint Testing Checklist

### `/api/extract` (POST)
- [ ] Sync mode - returns result immediately
- [ ] Async mode - returns jobId for polling
- [ ] Deduplication - same file returns cached result
- [ ] Large files - handles PDFs efficiently
- [ ] Unsupported formats - returns 400 error

### `/api/jobs/{jobId}` (GET)
- [ ] Queued state - shows queue position
- [ ] Processing state - shows progress
- [ ] Complete state - returns full result
- [ ] Failed state - returns error details
- [ ] Timeout handling - graceful timeout

### `/api/sessions/{sessionId}` (GET)
- [ ] Returns all documents in session
- [ ] Populates document summary
- [ ] Calculates overall health
- [ ] Lists pending jobs

### `/api/sessions/{sessionId}/validate` (POST)
- [ ] Cross-document validation
- [ ] Generates consistency checks
- [ ] Identifies missing documents
- [ ] Returns overall status and score

### `/api/sessions/{sessionId}/report` (GET)
- [ ] Generates human-readable report
- [ ] Includes all session data
- [ ] Formatted for Manning Agent review
- [ ] Clear hire/no-hire recommendation

### `/api/health` (GET)
- [ ] Returns OK status
- [ ] Lists all dependencies
- [ ] Shows version and uptime

---

## Troubleshooting

### Common Issues

**Issue:** Document not recognized
- **Solution:** Verify document type is in the provided taxonomy
- **Check:** Font clarity, table structure preserved in PDF/image

**Issue:** LLM returning LOW confidence
- **Solution:** May need retry with better image quality
- **Check:** Ensure PDF/image is high resolution (300 DPI minimum)

**Issue:** Dates not parsed correctly
- **Solution:** Verify date format consistency (DD/MM/YYYY)
- **Check:** No special date formats (e.g., "One thousand and..." text)

**Issue:** Medical data incomplete
- **Solution:** Check if tables rendered correctly in PDF
- **Check:** All lab values tables are visible

---

## Best Practices for Testing

1. **Organize by Scenario:** Group documents into logical session tests
2. **Validate Incrementally:** Add documents one-by-one and validate
3. **Test Error Cases:** Include edge cases (expired, missing, incomplete)
4. **Performance Testing:** Time async operations with multiple documents
5. **Cache Testing:** Re-upload to verify deduplication works
6. **Cross-Validation:** Validate logical consistency across documents

---

## PDF/Image Conversion Batch Scripts

### Convert All MD to PDF (Bash)
```bash
#!/bin/bash
for file in *.md; do
    if [ -f "$file" ]; then
        echo "Converting $file..."
        pandoc "$file" -o "${file%.md}.pdf"
    fi
done
echo "All files converted!"
```

### Convert All PDF to Images (Bash)
```bash
#!/bin/bash
for file in *.pdf; do
    if [ -f "$file" ]; then
        echo "Converting $file to images..."
        convert -density 300 "$file" -quality 85 "${file%.pdf}.png"
    fi
done
echo "All PDFs converted to images!"
```

---

## Document Statistics

| Category | Count |
|----------|-------|
| **Total Test Documents** | 12 |
| **Certification Documents** | 8 |
| **Medical Documents** | 3 |
| **Identity Documents** | 1 |
| **Training Certificates** | 5 |
| **Endorsements** | 6 |
| **Role Types Covered** | 2 (DECK, ENGINE) |
| **Holder Profiles** | 4 |

---

## Next Steps

1. **Convert Documents:** Use markdown-to-PDF conversion tools
2. **Generate Images:** Convert PDFs to images (300 DPI recommended)
3. **Upload to API:** Test each endpoint with the documents
4. **Validate Results:** Verify structured data extraction quality
5. **Performance Test:** Measure processing times and accuracy
6. **Iterate:** Refine extraction prompts based on results

---

**Ready for Testing!** All documents are now available in markdown format and ready for conversion to PDF and image formats for comprehensive maritime document extraction testing.
