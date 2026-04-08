## Code Review: `feat: add document extraction endpoint`

I would not approve this as-is. The endpoint  gets a basic happy path working, but there are several production-blocking issues here around security, cost, reliability, and data handling.

The good part first: you pushed through the end-to-end flow and proved the basic idea. That matters. But for a backend handling sensitive maritime documents, we need a much tighter standard around credentials, failure handling, storage, and output validation.

### `[line 7] Hardcoded API key`

```ts
const client = new Anthropic({ apiKey: 'sk-ant-REDACTED' });
```

This cannot ship. Secrets should never live in source code, even temporarily.

Why this matters:

- it creates an immediate credential leak risk
- it makes provider swapping harder

Please move this to environment variables and fail fast at startup if the key is missing.

### `[line 20] Reading from local disk synchronously`

```ts
const fileData = fs.readFileSync(file.path);
```

This blocks the event loop. On a lightly used dev machine it looks harmless, but under concurrent uploads it becomes avoidable latency.

For this type of endpoint, I would avoid sync file I/O entirely. Either keep the uploaded content in memory if the file size limit is small, or use async file handling.

### `[lines 23-24] Saving user documents permanently to disk`

```ts
const savedPath = path.join('./uploads', file.originalname);
fs.copyFileSync(file.path, savedPath);
```

This is a serious problem.

These are user documents containing personal and potentially medical information. Persisting them to local disk by default is not a safe “just in case” behavior.

Why this is risky:

- local disk is not an intentional secure storage layer
- filenames can collide
- PII/medical data is now sitting on the app host 

### `[line 27] Model choice is not cost-aware`

```ts
model: 'claude-opus-4-6',
```

This is too expensive a default for document extraction.

I would start with a cheaper, faster vision-capable model for starting out.

This is a good place to think like an owner, not just like a developer. If the endpoint works but every upload is overpriced, we still made a bad system choice.

### `[lines 33-36] The prompt is too vague`

```ts
text: 'Extract all information from this maritime document and return as JSON.',
```

This prompt is too broad for a production extraction pipeline. It does not define:

- document taxonomy
- expected JSON schema
- allowed values
- handling of missing fields
- role detection rules
- compliance flags

With a prompt this open-ended, the shape of the JSON will drift constantly. That means downstream consumers will break or start adding defensive hacks everywhere.

We should use a structured prompt with an explicit response contract and then validate that output against a schema.

### `[line 42] Direct `JSON.parse` on model output`

```ts
const result = JSON.parse(response.content[0].text);
```
LLM output frequently changes. A straight `JSON.parse` will fail if the LLM responds with initial text and the the json output.

At minimum, this needs:
- boundary extraction of the outermost JSON object
- one repair attempt if parsing fails
- storage of the raw model response for debugging

### `[lines 45-46] Global in-memory storage`

```ts
global.extractions = global.extractions || [];
global.extractions.push(result);
```

This is not a safe persistence strategy.

Problems:

- data disappears on restart
- multiple processes will not share the same memory
- there is no indexing, session model, or durability

For a prototype demo, it may feel convenient. For a backend service, it is the wrong shape entirely.

### `[lines 48-51] Error handling is too generic`

```ts
console.log('Error:', error);
res.status(500).json({ error: 'Something went wrong' });
```

This hides useful failure details from the caller and gives us no structured way to debug issues.

We need:

- explicit error categories
- stable error response shape
- timeout handling for provider calls
- retryable vs non-retryable distinction

### Missing: timeout handling

I don’t see any timeout around the LLM request. That means a hung provider call can pin the request indefinitely.

This is a production issue, not a nice-to-have.

The service should enforce a request timeout and fail cleanly if the provider does not respond in time.

### Missing: async mode / queueing

### Missing: validation and storage model

The output is returned directly, but there is no:

- session model
- deduplication
- job state tracking
- stored extraction audit record

## Teaching Moment

One thing I want to call out because it comes up a lot in early backend work: a prototype that “works once” is not the same as a service that is safe to operate.

The tricky part with LLM endpoints is that the demo path is easy:

- upload file
- call model
- parse result
- return JSON

The hard part is everything around it:

- cost control
- schema drift
- retries
- raw response retention
- secure handling of sensitive input
- persistence and traceability

That is the difference between a proof of concept and backend ownership. When you’re writing code in this area, try to think about what happens on the 10,000th request, not just the first successful one.

## Summary

I would like to see this reworked before merge. The main changes I’d want are:

- move credentials to env config
- replace disk persistence with an intentional storage strategy or remove it
- replace Opus with a more appropriate default model
- use a structured extraction prompt and schema validation
- add timeout handling and better error mapping
- remove global in-memory state
- introduce durable persistence and async job handling

The endpoint is a useful prototype spike, but it is not ready to be the foundation of the service.
