# Smart Maritime Document Extractor

Production-oriented backend assessment for the **Senior Backend Engineer** role.

This service accepts maritime documents such as certificates, passports, PEME reports, and drug tests, extracts structured data using a vision-capable LLM, supports both sync and async processing, validates multi-document sessions, and generates a final compliance report from persisted data.

## What This Includes

- `POST /api/extract` for sync and async document extraction
- `GET /api/jobs/:jobId` for async job polling
- `GET /api/sessions/:sessionId` for session-level document summary
- `POST /api/sessions/:sessionId/validate` for cross-document compliance validation
- `GET /api/sessions/:sessionId/report` for a derived compliance report
- `GET /api/health` for service and dependency health

Core stack:

- Bun + TypeScript
- Express.js
- MongoDB + Mongoose
- Redis + BullMQ
- Gemini/OpenAI-compatible LLM provider abstraction

## Quick Start

1. Install dependencies:

```bash
bun install
```

2. Create your env file:

```bash
cp .env.example .env
```

3. Make sure these are running:

- MongoDB
- Redis

4. Fill the required env vars in `.env`:

- `MONGODB_URI`
- `REDIS_URL`
- `LLM_PROVIDER`
- `LLM_MODEL`
- `LLM_API_KEY`

5. Start the API:

```bash
bun run start
```

6. Start the worker in a separate terminal:

```bash
bun run worker
```

7. Optional validation:

```bash
bun run check
```

## Basic App Flow

1. Client uploads a maritime document to `POST /api/extract`.
2. Server validates the file, computes SHA-256, resolves/creates a session, and checks deduplication.
3. In `sync` mode, extraction runs immediately and returns the structured result.
4. In `async` mode, a BullMQ job is created and processed by the worker.
5. Multiple extracted documents can be grouped under one `sessionId`.
6. Once a session has enough completed documents, `POST /api/sessions/:sessionId/validate` runs cross-document compliance validation.
7. `GET /api/sessions/:sessionId/report` returns a final derived report without another LLM call.

## Postman

Use the included Postman collection:

- [skyclad_assessment.postman_collection.json](/home/arsenic/Workspace/Projects/Assessments/maritime-doc-extractor/skyclad_assessment.postman_collection.json)

Import it into Postman, set your base URL and environment variables, and use it to exercise the endpoints quickly.

## Project Notes

- JPEG, PNG, and PDF uploads are accepted.
- Async jobs require both Redis and the worker process.
- Duplicate uploads in the same session are deduplicated by SHA-256 hash.
- Validation and reporting are session-based.
- The implementation favors clear service boundaries, explicit error handling, and a queue-backed extraction pipeline over a “single-file demo” style solution.