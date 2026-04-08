# TEST DOCUMENTS INDEX

## Quick Reference Guide for Maritime Document Extraction Testing

---

## 📑 Document Manifest

### Document 1: COC - Master Certificate
- **File:** `01_COC_Master.md`
- **Type Code:** COC
- **Full Type:** Certificate of Competency - Master
- **Holder:** Ricardo Mariano Santos
- **Date of Birth:** 15/03/1985
- **SIRB:** C0869326
- **Passport:** E123456789
- **Role:** DECK
- **Category:** CERTIFICATION
- **Issue Date:** 18/06/2023
- **Expiry Date:** 17/06/2028
- **Days to Expiry:** 846 (as of 2025)
- **Status:** CURRENT ✓
- **Rank Level:** Master - Unlimited Tonnage, Unlimited Geographical Area
- **Key Fields:** Certificate number, training records (12 courses), medical status Class A, medical certificate valid until 12/05/2026
- **Test Purpose:** Master-level certification extraction, complex field parsing
- **Compliance Flags:** None - all current
- **Recommended For:** Full COC extraction testing, field validation

---

### Document 2: PEME - Medical Examination
- **File:** `02_PEME_Medical.md`
- **Type Code:** PEME
- **Full Type:** Pre-Employment Medical Examination Certificate
- **Holder:** Samuel Pablo Samoya
- **Date of Birth:** 12/03/1988
- **SIRB:** C0869326
- **Age:** 36 years
- **Role:** ENGINE / BOTH (role-agnostic for medical)
- **Category:** MEDICAL
- **Issue Date:** 06/01/2025
- **Expiry Date:** 06/01/2027
- **Days to Expiry:** 682
- **Status:** CURRENT ✓
- **Fitness Classification:** Class A - Unlimited Maritime Service
- **Key Fields:** Lab results (CBC, chemistry, liver function, lipids), vital signs, medical findings, special notes
- **Medical Data:** Fitness=FIT, Drug Test=NEGATIVE, Cardiac history cleared, Schistosomiasis cleared
- **Restrictions:** Contact lenses permitted for vision correction, BP monitoring at 6-month intervals
- **Test Purpose:** Medical data extraction, lab table parsing, flag extraction
- **Compliance Flags:** MEDIUM - "Schistosomiasis (cleared)", "History of cardiac dysrhythmia (Class B, cleared)"
- **Recommended For:** Medical data extraction, lab value parsing, flag detection

---

### Document 3: Drug Test Certificate
- **File:** `03_DrugTest.md`
- **Type Code:** DRUG_TEST
- **Full Type:** Drug & Alcohol Screening Certificate
- **Holder:** Francisco Javier Salonoy
- **Date of Birth:** 28/08/1990
- **SIRB:** C0824567
- **Rank:** Chief Officer - Deck
- **Role:** ALL (role-agnostic)
- **Category:** MEDICAL
- **Test Date:** 04/03/2025
- **Certificate Valid From:** 04/03/2025
- **Certificate Valid Until:** 03/03/2027
- **Days to Expiry:** 707
- **Status:** CURRENT ✓
- **Overall Result:** NEGATIVE - FIT FOR DUTY ✓
- **Test Type:** 12-Panel Extended Screen + Alcohol Test
- **Key Substances Tested:** THC, Cocaine, Amphetamines, Methamphetamine, Opioids, PCP, Benzodiazepines, Barbiturates, MDMA, Methadone, Propoxyphene, Tramadol
- **All Results:** NEGATIVE
- **Alcohol Test:** Negative (BAC <0.01%)
- **MRO Review:** Certified Negative (Dr. Robert Catalino)
- **Test Purpose:** Screening result extraction, negative certification, compliance verification
- **Compliance Flags:** None - Passed all tests
- **Recommended For:** Drug test extraction, pass/fail determination, MRO certification validation

---

### Document 4: International Passport
- **File:** `04_Passport.md`
- **Type Code:** PASSPORT
- **Full Type:** International Travel Document / Passport
- **Holder:** Ricardo Mariano Santos
- **Date of Birth:** 15/03/1985
- **Nationality:** PHILIPPINE
- **Gender:** Male
- **Passport Number:** E123456789
- **Type:** Regular Passport (Official Travel)
- **Issue Date:** 18/06/2022
- **Expiry Date:** 17/06/2032
- **Days to Expiry:** 2,170+
- **Status:** CURRENT ✓
- **Validity Period:** 10 Years
- **Role:** Identity / N/A (role-agnostic)
- **Category:** IDENTITY
- **Attached Visas:** USA (B-1/B-2), Schengen, Japan, South Korea, UAE (all current)
- **Travel History:** Multiple port calls in Asia, Europe, Middle East (last 24 months documented)
- **Photo:** Present (compliant with ICAO standards)
- **Test Purpose:** Identity/travel document extraction, multi-visa parsing, passport validity verification
- **Compliance Flags:** None - Valid for 7+ additional years
- **Recommended For:** Passport OCR testing, visa validation, travel history extraction

---

### Document 5: Yellow Fever Vaccination
- **File:** `05_YellowFever.md`
- **Type Code:** YELLOW_FEVER
- **Full Type:** International Yellow Fever Vaccination Certificate
- **Holder:** Maria Rosa Santos
- **Date of Birth:** 22/07/1992
- **Age:** 32 years
- **Nationality:** PHILIPPINE
- **Gender:** Female
- **Passport:** F234567890
- **SIRB:** SB-PH-2024-847392
- **Vaccine Type:** YF-Vax (Live Attenuated, 17D-204)
- **Issue Date:** 28/01/2025
- **Expiry Date:** 27/01/2035
- **Days to Expiry:** 3,648 (10 years)
- **Status:** CURRENT ✓
- **Role:** ALL (role-agnostic)
- **Category:** MEDICAL - VACCINATION
- **Vaccination Date:** 28/01/2025 at 10:30 AM
- **Provider:** Metropolitan Yellow Fever Vaccination Center
- **Physician:** Dr. Antonio Reyes, MD, MPH
- **Protection Onset:** Day 10 post-vaccination (full immunity)
- **Key Fields:** Vaccination date, validity dates, provider details, physician license
- **Test Purpose:** Vaccination date parsing, 10-year expiry validation, WHO certificate extraction
- **Compliance Flags:** None - Full 10-year coverage for maritime service
- **Recommended For:** Date parsing validation, simple structured data extraction

---

### Document 6: SIRB - Seafarer Identity Record Book
- **File:** `06_SIRB.md`
- **Type Code:** SIRB
- **Full Type:** Certificate of Seafarer's Identity Record Book (Seafarer Identity Document)
- **Holder:** Samuel Pablo Samoya
- **Date of Birth:** 12/03/1988
- **Age:** 36 years
- **SIRB Number:** C0869326
- **Nationality:** PHILIPPINE
- **Rank:** Chief Engineer
- **Role:** ENGINE / Identity (role depends on position)
- **Category:** IDENTITY / EMPLOYMENT
- **Issue Date:** 15/01/2025
- **Expiry Date:** 14/01/2035
- **Days to Expiry:** 3,650 (10 years)
- **Status:** CURRENT ✓
- **Employment Status:** Engineering Department, Unlimited Maritime Service
- **Vessel Type:** General Cargo, Container Ship, Tanker
- **Key Fields:** SIRB number, current rank, employment history (5+ years), certificates held, visas, security clearances, performance ratings
- **Certificates Held:** COC-Chief Engineer, ECDIS, Oil Tanker, Advanced Fire Fighting, Medical
- **Seagoing Service:** 36+ years total experience, 6+ years as Chief Engineer
- **Recent Vessels:** MV Petrosia (Oil Tanker), MV Gulf Leader (Oil Tanker), MT Ocean Star (Oil Tanker)
- **Performance Rating:** Excellent
- **Disciplinary Record:** Clean - No violations, No PSC detentions
- **Test Purpose:** Complex multi-section document extraction, employment history parsing, certificate cross-reference
- **Compliance Flags:** None - Excellent standing
- **Recommended For:** Complex document handling, table extraction, employment history validation, certificate cross-checking

---

### Document 7: ECDIS Certificate - Type Approval
- **File:** `07_ECDIS.md`
- **Type Code:** ECDIS_GENERIC (or ECDIS_TYPE for Type B systems)
- **Full Type:** ECDIS Type Approval & Familiarization Certificate
- **Holder:** Ricardo Mariano Santos
- **Date of Birth:** 15/03/1985
- **SIRB:** C0869326
- **Current Rank:** Master
- **Role:** DECK
- **Category:** CERTIFICATION / TRAINING
- **Course Completion Date:** 14/02/2023
- **Issue Date:** 15/02/2023
- **Expiry Date:** 14/02/2026
- **Days to Expiry:** -30 (EXPIRED!)
- **Status:** EXPIRED ✗
- **Course Duration:** 40 hours (5 days) - Simulator-based
- **ECDIS Types Approved:** 
  - Class B CNS-3000 (Integrated)
  - Transas Navi-Sailor 4000 (Standalone)
  - Furuno ARPATarget (Hybrid)
  - Sperry Marine SeaNav 3G (Integrated)
- **Exam Scores:** Theory avg 90.2%, Practical Excellent
- **Simulator Hours:** 32 hours complete
- **Scenarios Passed:** 18 complete scenarios
- **Key Fields:** System type ratings, exam scores, practical assessments, simulator performance
- **Test Purpose:** Training certificate with complex type-ratings extraction, exam score parsing, expiry flag detection (CRITICAL!)
- **Compliance Flags:** CRITICAL - Certificate has EXPIRED (14/02/2026 was target but document shows 14/02/2026 = expired by 30 days as of 04/2025)
- **Recommended For:** Expired document detection, flag severity assessment, training certificate validation

---

### Document 8: COC - Chief Officer
- **File:** `08_COC_ChiefOfficer.md`
- **Type Code:** COC
- **Full Type:** Certificate of Competency - Chief Officer / Chief Mate
- **Holder:** Francisco Javier Salonoy
- **Date of Birth:** 28/08/1990
- **SIRB:** C0824567
- **Passport:** F234567890
- **Age:** 34 years
- **Role:** DECK
- **Category:** CERTIFICATION
- **Issue Date:** 22/05/2024
- **Expiry Date:** 21/05/2029
- **Days to Expiry:** 1,503
- **Status:** CURRENT ✓
- **Rank:** Chief Officer / Chief Mate - Unlimited Tonnage & Geographical Area
- **Key Fields:** Multiple endorsements (Chief Officer, Officer in Charge), training courses (12 completed), medical fitness Class A, seagoing service record
- **Seagoing Service:** 12+ years total, 5+ years at officer level
- **Recent Vessels:** MV Pacifica Express (Container, 65,000 GT), MV Philippines Pride (Bulk, 45,000 GT), MV Cargo Quest (General, 12,500 GT)
- **Performance Rating:** EXCELLENT - "Ready for Master promotion"
- **Training Courses:** Chief Officer Program, Advanced BRM, ECDIS, Radar, Fire Fighting, Cargo Ops, Crisis Management (12 total)
- **Medical Status:** Class A Unlimited, valid until 18/05/2027
- **PSC Status:** 3 inspections, zero major deficiencies, clean record
- **Test Purpose:** Management-level certification extraction, performance ratings parsing, advancement tracking
- **Compliance Flags:** None - Excellent for advancement
- **Recommended For:** Chief Officer/management-level certificate testing, promotion readiness assessment

---

### Document 9: Advanced Fire Fighting Certificate
- **File:** `09_FireFighting.md`
- **Type Code:** TRAIN_TRAINER (or could be considered TRAINING)
- **Full Type:** Advanced Fire Fighting Course Certificate
- **Holder:** Maria Rosa Santos
- **Date of Birth:** 22/07/1992
- **Current Rank:** 2nd Engineer
- **Company:** Global Maritime Services Ltd
- **Vessel Type:** Oil Tanker
- **Role:** ALL
- **Category:** TRAINING / CERTIFICATION
- **Course Dates:** 10-14/03/2025
- **Issue Date:** 14/03/2025
- **Expiry Date:** 13/03/2030
- **Days to Expiry:** 1,810
- **Status:** CURRENT ✓
- **Course Duration:** 40 hours (5 days)
- **Training Provider:** PAGCOR Port Authority Training Center
- **Lead Instructor:** Captain Antonio Reyes (Master Mariner & Fire Safety Specialist)
- **Key Fields:** 5 modules (Fire Science, Equipment, Procedures, Leadership, Tanker-specific), exam scores, practical assessments
- **Exam Scores:** Module 1=87/100, Module 2=89/100, Module 3=91/100, Overall=89/100
- **Practical Assessment:** Excellent - 6 simulator scenarios all PASS
- **Simulator Exercises:** Class A Fire, Class B Fire, Class C Fire, Containment, Rescue, Environmental Emergency
- **Test Purpose:** Module-based training structure extraction, exam score parsing, practical certification validation
- **Compliance Flags:** None - All requirements met
- **Recommended For:** Multi-module training certificate testing, exam score validation, practical assessment extraction

---

### Document 10: Oil Tanker Endorsement
- **File:** `10_OilTanker.md`
- **Type Code:** COP_MEFA (Tanker-specific endorsement variant)
- **Full Type:** Oil Tanker - Procedures and Responsibilities Endorsement
- **Holder:** Samuel Pablo Samoya
- **Date of Birth:** 12/03/1988
- **Current Rank:** Chief Engineer
- **SIRB:** C0869326
- **Certificate Number:** PHIL-CE-2024-087432 (main CoC)
- **Endorsement Number:** TANKER-PROC-CE-2023-0847
- **Role:** ENGINE
- **Category:** ENDORSEMENT / CERTIFICATION
- **Issue Date:** 15/04/2023
- **Expiry Date:** 14/04/2028
- **Days to Expiry:** 1,131
- **Status:** CURRENT ✓
- **Course Provider:** Shell International Training & Certification Center, Houston TX
- **Course Duration:** 40 hours (5 days)
- **Key Fields:** 5 modules (Tanker design, cargo handling, safety, environmental, engine room), simulator exercises, cargo type authorizations
- **Authorized Cargo Types:** Crude Oil ✓, Product Oil ✓, Refined Products ✓, Heavy Fuel Oil ✓, Bitumen ✓
- **Restricted Cargo:** Vegetable Oil ✗, Chemical Products ✗
- **Tanker Experience:** 6+ years (MT Petrosia, MT Gulf Leader, MT Ocean Star)
- **Simulator Exercises:** 6 scenarios (Loading, Discharge, Tank Cleaning, Emergency Shutdown, IGS Failure, Environmental Emergency)
- **Performance:** Excellent with particular strength in emergency procedures
- **Test Purpose:** Endorsement extraction with cargo type restrictions, simulator scenario parsing, specialization validation
- **Compliance Flags:** None - Excellent standing for tanker operations
- **Recommended For:** Endorsement-specific field extraction, cargo authorization parsing, specialization testing

---

### Document 11: Radar Observation Certificate
- **File:** `11_Radar.md`
- **Type Code:** ECDIS_GENERIC (navigation-related training)
- **Full Type:** Radar Observation & ARPA Certificate
- **Holder:** Ricardo Mariano Santos
- **Date of Birth:** 15/03/1985
- **Current Rank:** Master
- **SIRB:** C0869326
- **Role:** DECK
- **Category:** CERTIFICATION / TRAINING
- **Course Dates:** 28/01 - 01/02/2025
- **Issue Date:** 01/02/2025
- **Expiry Date:** 31/01/2030
- **Days to Expiry:** 1,796
- **Status:** CURRENT ✓
- **Course Provider:** Transas Marine Training Academy, Manila
- **Course Duration:** 40 hours (5 days)
- **Training Method:** Classroom + Full Mission Bridge Simulator
- **Key Fields:** 5 modules (Theory, Equipment, Navigation/Collision Avoidance, ARPA, Regulations), exam scores, simulator scenarios
- **Radar Systems Type-Rated:** Transas Navigat X, Furuno FR-2125, Sperry Marine NUCLEUS, Raytheon/Anritsu, Kelvin Hughes, others IMO-approved
- **Exam Scores:** Theory=92/100, Equipment=89/100, ARPA=94/100, Regulations=96/100, Overall=92.75/100
- **Simulator Performance:** 32 hours, 18 scenarios, 94% average, Best=98% (head-on), Lowest=87% (harbor)
- **Collision Avoidance Scenarios:** Head-on ✓, Overtaking ✓, Crossing ✓, Harbor ✓, Traffic Separation Scheme ✓
- **Test Purpose:** Navigation equipment certification extraction, ARPA type-ratings, simulator performance scoring
- **Compliance Flags:** None - Excellent performance
- **Recommended For:** Navigation equipment certification, type-rating matrix parsing, performance scoring validation

---

### Document 12: Seaman's Book - Employment Record
- **File:** `12_SeamansBook.md`
- **Type Code:** SIRB variant / SB
- **Full Type:** Seaman's Book & Employment Record
- **Holder:** Francisco Javier Salonoy
- **Date of Birth:** 28/08/1990
- **Age:** 34 years
- **Book Number:** SB-PH-2024-847291
- **SIRB:** C0824567
- **Passport:** F234567890
- **Gender:** Male
- **Nationality:** PHILIPPINE
- **Role:** ALL
- **Category:** EMPLOYMENT / IDENTITY
- **Issue Date:** 03/01/2025
- **Expiry Date:** 02/01/2030
- **Days to Expiry:** 1,825 (5 years)
- **Status:** CURRENT ✓
- **Current Employment:** Seatrade Shipping Ltd - Chief Officer on MV Pacifica Express (embark 15/01/2025)
- **Contract Duration:** 8 months
- **Key Fields:** Photo, fingerprints, identification, current employment, CoC records (2 - Chief Officer + OICNW), endorsements (4), medical (3), seagoing service summary
- **Total Seagoing Service:** 12+ years (4,565 days / 150 months)
- **Ship Types:** General Cargo, Container, Bulk Carrier
- **Vessel Tonnage Range:** 3,000 - 76,000 GT
- **Vessels Served:** 18 vessels
- **Recent Employment:** Seatrade (2024-present), Global Maritime (2022-2023), Ocean Logistics (2021-2022), Maritime Operations (2020-2021)
- **Performance Rating:** EXCELLENT - "Recommended for Master promotion"
- **Disciplinary Record:** Clean - No incidents, No detentions
- **Family Information:** Wife (Anna Maria), 2 children (Juan age 6, Maria age 4)
- **Test Purpose:** Complex employment history extraction, multi-vessel record parsing, performance rating validation
- **Compliance Flags:** None - Excellent standing
- **Recommended For:** Employment history complex extraction, multi-table parsing, career progression tracking

---

## 🎯 Quick Selection Guide by Test Purpose

### Testing Document Type Detection
- COC_Master (01) - Large complex certificate
- PEME_Medical (02) - Medical data with tables
- ECDIS (07) - Training with type ratings

### Testing Date Parsing & Expiry Detection
- COC_Master (01) - 2028 expiry
- YellowFever (05) - 10-year certificate
- ECDIS (07) - EXPIRED! (for flag testing)
- Radar (11) - 2030 expiry

### Testing Medical Data Extraction
- PEME (02) - Comprehensive medical record with labs
- DrugTest (03) - Screening results and panels
- YellowFever (05) - Vaccination details

### Testing Complex Tables & Structured Data
- PEME (02) - Lab results tables
- SIRB (06) - Employment history tables
- SeamansBook (12) - Multiple employment records

### Testing Role Detection (DECK vs ENGINE)
- COC_Master (01) - DECK
- COC_ChiefOfficer (08) - DECK
- OilTanker (10) - ENGINE
- FireFighting (09) - ALL

### Testing Endorsement/Specialization
- OilTanker (10) - Single complex endorsement
- ECDIS (07) - Multiple system type-ratings
- Radar (11) - Multiple radar types

### Testing Flag & Compliance Detection
- PEME (02) - Medical flags present
- ECDIS (07) - EXPIRED (critical flag)
- SeamansBook (12) - No flags (clean record)

### Testing Confidence Levels
- COC_Master (01) - HIGH confidence (clear structure)
- PEME (02) - MEDIUM confidence (dense data)
- SeamansBook (12) - MEDIUM-HIGH confidence (complex format)

---

## 📊 Statistics Summary

### Total Documents
- **All Documents:** 12
- **Certification Documents:** 8
- **Medical Documents:** 3
- **Identity Documents:** 2
- **Training Certificates:** 5
- **Endorsements:** 6

### By Role
- **DECK:**  06 documents (01, 04, 07, 08, 11, + shared)
- **ENGINE:** 03 documents (02, 09, 10 + shared)
- **ALL/N/A:** 05 documents (03, 05, 06, 09, 12)

### By Status
- **CURRENT:** 11 documents ✓
- **EXPIRED:** 1 document (07_ECDIS - for testing flag detection) ✗

### By Holder
- **Ricardo Santos:** 5 documents
- **Francisco Salonoy:** 3 documents
- **Samuel Samoya:** 3 documents
- **Maria Rosa Santos:** 2 documents

---

## 🚀 Getting Started

1. **Review this index** for document overview
2. **Read README.md** for detailed testing guidelines
3. **Convert documents:** `bash convert_documents.sh`
4. **Use TEST_SCENARIOS.md** to plan tests
5. **Start with high-confidence documents** (01, 03, 05)
6. **Progress to complex documents** (02, 06, 12)
7. **Test error scenarios** (07_ECDIS for expiry flags)

---

**Document Index Version:** 1.0  
**Created:** March 2025  
**Maritime Extract Test Suite