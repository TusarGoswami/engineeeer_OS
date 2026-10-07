# EngineerOS — Architectural Decision Records (ADRs)

This document records the critical architectural, security, and infrastructure decisions made during the design and development of **EngineerOS**.

---

## ADR-001: Modular Monolith Pattern over Microservices

### Context

EngineerOS encompasses 12 functional domains (Auth, Users, Dashboard, Academics, Coding, GATE, AI Assistant, Assessments, Community, Mock Interviews, Progress, and Admin). A microservices architecture introduces distributed transaction overhead, complex service discovery, network latency, and deployment complexity, which is unnecessary and detrimental at the current stage. Conversely, an unstructured monolith risks code entanglement where models and controllers directly access arbitrary database collections.

### Decision

Adopt a **Modular Monolith** architecture within a single Express repository:

1. Each domain resides in its own isolated module under `server/src/modules/<module-name>`.
2. Each module encapsulates its own routes, controller, service, repository, Mongoose model, and Zod validation schemas.
3. **No direct cross-module model imports**: Module A must never import Module B's Mongoose model directly. If Module A requires data or operations from Module B, it calls Module B's exported public service or emits an asynchronous event (`activityEvents`).

### Consequences

- **Positive**: Simplified deployment, unified transactions when needed, minimal network latency, shared utilities, and high developer velocity.
- **Positive**: Clean boundaries make future extraction into standalone microservices straightforward if a module needs separate autoscaling.
- **Negative**: Requires strict discipline and lint rules to avoid accidental cross-domain imports.

---

## ADR-002: Dual Process Architecture (`api` and `worker`)

### Context

Operations such as batch test case execution in Judge0, AI mock interview grading, complex progress aggregations, and email dispatches are CPU-heavy and I/O-intensive. Executing these operations inside the Express HTTP request-response cycle blocks Node's event loop, spiking p95/p99 request latencies and degrading user experience.

### Decision

Split the backend into two distinct runtime entry points sharing the same codebase:

1. **`api` process (`server/src/server.js`)**: Purely stateless HTTP/SSE server. Validates requests, enforces RBAC, reads from cache or database, dispatches asynchronous jobs to Redis, and returns immediate responses (e.g., `202 Accepted`).
2. **`worker` process (`server/src/worker.js`)**: Dedicated BullMQ consumer process. Consumes jobs from distinct queues (`code-exec`, `ai-feedback`, `progress`, `notifications`), handles retries with exponential backoff, and updates state in MongoDB.

### Consequences

- **Positive**: HTTP API remains lightning-fast and responsive under load.
- **Positive**: Workers can be scaled independently in container environments (e.g. 2 API nodes + 6 Worker nodes during coding contests).
- **Negative**: Requires Redis infrastructure and handling of asynchronous job state on the client (polling or SSE).

---

## ADR-003: JWT Access Token in Memory + Rotating Refresh Token in httpOnly Cookie

### Context

Storing JWT access tokens in browser `localStorage` or `sessionStorage` exposes users to token theft via Cross-Site Scripting (XSS) attacks. Storing all tokens solely in cookies without rotation exposes users to Cross-Site Request Forgery (CSRF) and long-lived replay vulnerabilities.

### Decision

Implement a hybrid token strategy:

1. **Access Token**: Short-lived (15 minutes), signed with HMAC-SHA256, containing user ID, role, and permissions. Kept in frontend React memory (not in `localStorage`).
2. **Refresh Token**: Long-lived (7 days), cryptographically secure random token stored in the database (`refreshTokens` collection) and transmitted to the client in an `httpOnly`, `Secure`, `SameSite=Strict` cookie path-restricted to `/api/v1/auth/refresh`.
3. **Token Rotation & Reuse Detection**: Every refresh request invalidates the old refresh token and issues a new one. If an invalidated refresh token is ever presented, the backend assumes a breach, immediately revokes the entire token family, and terminates all active sessions for that user.

### Consequences

- **Positive**: Maximum resilience against both XSS (access token cannot be read from storage) and CSRF (refresh cookie is `SameSite=Strict` and only targets the refresh endpoint).
- **Positive**: Immediate breach containment via family invalidation.
- **Negative**: Client must execute a silent refresh flow on app load and handle token expiration gracefully.

---

## ADR-004: Pre-Aggregated Progress Summaries via Event Pipeline

### Context

The personalized Dashboard displays real-time statistics: total coding problems solved, acceptance rates, GATE test scores, academic syllabus completion percentages, and interview readiness scores. Calculating these metrics on every dashboard request by scanning raw tables (`codingSubmissions`, `activityEvents`, `academicProgress`) results in O(N) queries that degrade database performance as user activity grows.

### Decision

Implement an event-driven progress architecture:

1. Every domain module records user activity through a centralized `ActivityService.record()` method, which writes an append-only event into `activityEvents`.
2. The `progress` BullMQ queue asynchronously processes the event and computes updated metrics in a dedicated `progressSummaries` document per user.
3. The Dashboard endpoint (`GET /api/v1/dashboard/summary`) reads **exclusively** from the pre-aggregated `progressSummaries` collection, returning in < 20ms.
4. An aggressive 90-day TTL index is placed on `activityEvents` to purge historical raw logs while keeping the summaries intact.

### Consequences

- **Positive**: O(1) dashboard read time, predictable database load, and instant dashboard rendering.
- **Positive**: Clear audit trail of user activity.
- **Negative**: Eventual consistency (dashboard stats update within ~500ms to 1s of action completion).

---

## ADR-005: Sandboxed Code Execution via Judge0 Adapter with Local Mock

### Context

Running arbitrary user-submitted code (C++, Java, Python, JavaScript) directly on the host machine presents severe security hazards: remote code execution (RCE), fork bombs, resource exhaustion, and network tampering.

### Decision

1. Delegate all code execution to an isolated sandbox engine (Judge0 CE/PE) running with strict Linux cgroups, seccomp filters, CPU/memory limits, and network isolation.
2. Build an **Adapter Pattern** (`server/src/integrations/judge0/`) that abstracts execution behind a standard interface.
3. Provide a fully functional **Local Mock Adapter** (`server/src/integrations/judge0/mock.judge0.js`) enabled by default or via `CODE_EXEC_PROVIDER=mock`, allowing all test cases, submissions, and contests to run offline without external API keys or Judge0 containers during development and automated tests.

### Consequences

- **Positive**: Zero security risk to host server.
- **Positive**: Full developer portability: any engineer or CI runner can clone the repo and immediately run tests with the mock adapter.
- **Negative**: Production requires managing Judge0 instances or subscribing to an external Judge0 provider.

---

## ADR-006: Server-Sent Events (SSE) over WebSockets for AI & Real-Time Updates

### Context

The AI Academic Assistant requires token-by-token streaming to minimize perceived latency. Real-time updates are also beneficial for tracking code execution progress. WebSockets introduce stateful, bidirectional TCP connections that complicate horizontal scaling, sticky sessions, and ingress load balancing across multiple API nodes.

### Decision

Use **Server-Sent Events (SSE)** for streaming AI responses and real-time submission progress:

- SSE operates over standard HTTP/1.1 and HTTP/2 connections.
- Fully compatible with stateless Nginx reverse proxies without sticky session overhead.
- Simple client consumption via standard `EventSource` or `fetch` stream readers.

### Consequences

- **Positive**: Lightweight, stateless, firewall-friendly, and naturally compatible with horizontal API load balancing.
- **Negative**: Unidirectional only (client-to-server messages still use standard REST endpoints, which is perfectly aligned with our RESTful architecture).

---

## ADR-007: Cursor-Based Pagination on All Unbounded Lists

### Context

Offset-based pagination (`skip(N).limit(M)`) suffers from poor performance on large collections (MongoDB must scan and discard `N` documents) and produces "page drift" when items are inserted or deleted during browsing.

### Decision

Enforce **cursor-based pagination** using the document's unique `_id` and sort timestamp for all unbounded lists (submissions, posts, replies, resources, audit logs).

- API format: `?limit=20&cursor=66c8a4f9...`
- Return envelope: `{ data: [...], pagination: { nextCursor, hasMore, limit } }`.

### Consequences

- **Positive**: Consistent O(1) index-backed query performance regardless of how deep the user paginates.
- **Positive**: Immune to item duplication or skipping due to concurrent writes.
- **Negative**: Cannot jump directly to arbitrary page numbers (e.g. "jump to page 47").

---

## ADR-008: External Storage & Submissions Payload Separation

### Context

Storing multi-kilobyte source code strings and execution traces directly inside the main `codingSubmissions` document leads to rapid BSON document bloat, poor index cache locality, and inefficient queries during list operations.

### Decision

Decompose submission data:

- `codingSubmissions`: Stores lightweight metadata (IDs, language, status, runtime, memory, score, timestamp). Fits in RAM, queried frequently.
- `submissionPayloads`: Separate collection or S3 object storage storing the raw source code, compiler error strings, and verbose test run traces. Loaded on-demand only when a user opens submission details.

### Consequences

- **Positive**: Maximizes MongoDB working set efficiency; listing submissions is ultra-fast.
- **Negative**: Requires a secondary lookup when viewing complete source code.

---

## ADR-009: Consent-Driven Assessment Integrity Review Signals

### Context

Automated proctoring software often makes erroneous decisions ("student disqualified for looking away"), causing extreme stress, anxiety, and unfair academic penalties due to lighting or room conditions.

### Decision

1. Assessment monitoring is **strictly consent-driven**: students must explicitly consent to integrity monitoring before launching a test.
2. The client records objective events (tab change, window blur, fullscreen exit, copy/paste) and transmits them to `monitoringEvents`.
3. System UI and copy **never declare "Cheating Detected"**. Events are presented as **"Review Signals"** in the Content Admin / Faculty review portal.
4. Human reviewers must inspect signals, add notes, and manually decide whether to dismiss or escalate.

### Consequences

- **Positive**: Ethical, transparent, legally compliant, and protects students against false positives.
- **Negative**: Requires faculty/admin review workflows instead of automatic disqualification.

---

## ADR-010: Deterministic Multi-Factor Recommendation Engine for Dashboard

### Context

Engineering students often experience cognitive overload when navigating distinct portals (curriculum, coding, exams, placements). An opaque AI/ML recommendation model can hallucinate non-existent tasks, produce non-deterministic results on each refresh, and add 200–500ms of LLM latency to the primary dashboard endpoint.

### Decision

Implement a **deterministic, rules-based recommendation engine** (`dashboard/recommendation.service.js`):

1. Evaluates 5 explicit priority rules: pending academic topics in the student's current semester, daily coding challenge calibrated by difficulty, weak GATE topics, AI mock interview readiness, and stated career goals.
2. Generates strictly 3 to 5 prioritized, actionable items with deep links, priority badges, and estimated completion times.
3. Operates in $< 5$ms directly in-memory from pre-aggregated progress data, enabling deterministic recommendations and effortless cache-aside storage in Redis (`cache:dashboard:summary:{userId}`).

### Consequences

- **Positive**: Zero latency overhead, 100% deterministic, transparent rationale for students, and instantly testable.
- **Negative**: Requires rule updates if new platform modules are introduced.

---

## ADR-011: Segregated Community Reply Subcollection Architecture

### Context

In collaborative discussion forums with hundreds of replies, embedding replies directly into `communityPosts.replies` array causes the parent post BSON document to grow unboundedly, eventually hitting MongoDB's 16MB document limit and generating severe memory fragmentation during frequent in-place updates.

### Decision

Segregate community replies into an independent `communityReplies` collection:

- `communityPosts`: Retains post title, markdown body, author reference, category, tags, `isAskSenior` flag, total `repliesCount`, and `hasAcceptedAnswer`.
- `communityReplies`: Normalized documents referencing `postId` and `authorId`, indexed by `(postId, createdAt)`. Supports independent upvoting and accepted answer flag without rewriting the parent document.

### Consequences

- **Positive**: Post documents remain constant size; zero risk of hitting 16MB limit. Fast pagination and threaded indexing.
- **Negative**: Requires two index-backed queries or `$lookup` to fetch a thread with its replies.
