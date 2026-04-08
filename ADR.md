# ADR: Smart Maritime Document Extractor

I optimized for a design that is simple to reason about, credible under load, and easy to extend. 

## 1. Sync vs Async

In production, I would make `async` the default mode.

Because the slowest part of this system is the LLM call, not the API framework or the database. Vision-capable extraction is variable in latency, 
pdfs are heavier than images, and once multiple users starts uploading at the same time, the nodejs event loop is blocked and it becomes the bottleneck.

Async gives better handling, doesnt block the event loop, cleaner retries.

I still implemented `sync` because it is useful for small documents, local testing, admin tooling, and simpler client integrations. For very small image uploads, sync is fine. But I would force async regardless of the mode param in two cases:

- file size above roughly `4MB`
- queue depth above roughly `10` jobs, or when active worker concurrency is saturated

For PDFs specifically, I would force async because they are more expensive in both preprocessing and model input cost.

## 2. Queue Choice

I used `BullMQ` with Redis.

I picked it because it gives me a real job state machine quickly: `QUEUED -> PROCESSING -> COMPLETE/FAILED`, plus retries, backoff, worker concurrency, and a clean path to separate API and worker processes. For this kind of assessment, that is more defensible than inventing a custom queue.

If this system needed to handle `500 concurrent extractions per minute`, I would keep the same logical model but change the deployment flow:

- dedicated Redis instance or managed Redis
- API and worker deployed separately
- multiple worker replicas
- file payloads moved out of Redis job bodies and into object storage

At that scale I would still be comfortable with BullMQ, but I would also consider a more infrastructure heavy setup if the org already had stronger queue in place.

Current failure modes:

- if Redis is down, async extraction and rate limiting are affected
- if the worker is not running, jobs remain queued
- if large files are pushed into Redis job payloads, memory pressure becomes a concern
- if the process dies mid-job, job recovery depends on BullMQ/Redis behavior and worker restart

So the current setup is good for this assessment and an MVP, but not the final shape I would run for a high-volume production workload.

## 3. LLM Provider Abstraction

I built a provider interface instead of hardcoding one provider directly.

The assignment explicitly calls this out, but I would have done it anyway. LLM providers change quickly, pricing changes quickly, and vision support is not uniform. I did not want extraction logic coupled to a single SDK.

The provider interface is intentionally narrow:

- `extractDocument(...)`
- `completeText(...)`
- `healthCheck()`

That is enough for this service. The extraction service does not need to know whether the provider is Gemini, OpenAI, Groq, or Ollama. It only needs a document extraction path and a text completion path. That keeps the business logic stable while letting the integration layer change independently.

## 4. Schema Design

The suggested SQL schema stores dynamic fields in JSON/TEXT blobs. That is workable for a prototype, but at scale it becomes painful fast.

Main risks:

- poor queryability for nested dynamic fields
- harder indexing strategy

That is why I used MongoDB with Mongoose and stored both:

- the full nested extraction payload
- flattened top-level fields such as `documentType`, `holderName`, `isExpired`, `dateOfExpiry`, and flag counts

MongoDB gives flexibility without sacrificing query performance on important fields.

If I needed queries like “all sessions where any document has an expired COC”, I would rely on indexed top-level fields like `documentType` and `isExpired`, not parse nested JSON at query time.

## 5. What I Skipped

I deliberately skipped a few production-grade concerns because I wanted to finish the core service properly instead of half-building everything.

### 1. Auth

This is a P0 concern in a real system because the documents are sensitive. I skipped it because the assignment focuses more on extraction architecture, queueing, and leadership judgment than user management.

### 2. Object storage

Right now async jobs carry file content through the queue for simplicity. In production I would move file payloads to object storage and enqueue references instead. I left that out because it adds infrastructure and wiring that was not critical to proving the core backend shape.

### 3. Full automated test coverage

I prioritized the main service implementation and docs first. Given more time, I would add unit tests around JSON repair/coercion and integration tests around sync extraction, async job lifecycle, validation, and reporting.