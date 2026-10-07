# EngineerOS — Phased Implementation Plan

This document outlines the execution roadmap, quality gates, and verification criteria for **EngineerOS**, building a production-grade, horizontally scalable engineering student operating system.

---

## Roadmap Overview

```mermaid
gantt
    title EngineerOS Phased Execution Roadmap
    dateFormat  YYYY-MM-DD
    section Phases
    Phase 0: Architecture & Foundation Scaffold :done, p0, 2026-10-29, 1d
    Phase 1: Foundation & Core Infrastructure   :active, p1, after p0, 2d
    Phase 2: Dashboard & Academic Hub           :p2, after p1, 2d
    Phase 3: Coding Platform & GATE Hub         :p3, after p2, 3d
    Phase 4: AI Assistant & Mock Interviews     :p4, after p3, 2d
    Phase 5: Assessments & Community Network    :p5, after p4, 2d
    Phase 6: Admin, Security, QA & Production   :p6, after p5, 2d
```

---

## Phase 0: Design, Repository Scaffold & Tooling

### Scope & Deliverables

- [x] `docs/ARCHITECTURE.md`: High-level system design, domain module boundaries, Mermaid diagrams, scaling plan, capacity estimation, and resilience model.
- [x] `docs/DECISIONS.md`: ADRs covering modular monolith, dual process (`api`/`worker`), refresh token rotation, pre-aggregated progress, sandboxed execution, and SSE.
- [x] `docs/IMPLEMENTATION_PLAN.md`: Detailed phased roadmap with explicit quality gates and test strategies.
- [ ] Monorepo workspace configuration (`npm workspaces` with `client/` and `server/`).
- [ ] Root `package.json`, `.gitignore`, `.prettierrc`, ESLint configuration.
- [ ] `docker-compose.yml`: Multi-container topology defining:
  - `api` (Express Node.js 20)
  - `worker` (BullMQ consumer)
  - `mongo` (MongoDB replica set ready)
  - `redis` (Redis 7)
  - `judge0-stub` (Mock execution service)
  - `nginx` (Reverse proxy & load balancer)
- [ ] `.github/workflows/ci.yml`: Automated CI pipeline running linting, formatting check, type/JSDoc validation, unit & integration tests, and build validation.

### Verification Gate

- Repository structure initialized with workspaces.
- `npm run lint` and `npm run format:check` execute cleanly.
- `docker compose config` validates without syntax errors.

---

## Phase 1: Foundation & Core Infrastructure

### Scope & Deliverables

- **Config & Env Validation**: Zod-validated environment schema (`server/src/config/env.js`) with fail-fast boot validation.
- **Database & Cache**:
  - Resilient Mongoose connection with connection pooling and graceful reconnection.
  - Redis client with reconnect backoff and health checking.
- **Observability & Middleware**:
  - Pino structured JSON logger with request IDs.
  - Centralized error handling middleware with standardized error envelope: `{ error: { code, message, details, requestId } }`.
  - Rate limiting middleware with Redis store.
  - Helmet security headers and strict CORS configuration.
- **Authentication & RBAC**:
  - User model with `argon2id` (or high-cost bcrypt) password hashing.
  - JWT generation (15m expiry) and rotating refresh token mechanism in `httpOnly`, `Secure`, `SameSite=Strict` cookies.
  - Refresh token reuse detection with token family invalidation.
  - RBAC authorization middleware with permissions matrix (`student`, `senior`, `contentAdmin`, `platformAdmin`).
  - Auth endpoints: `/api/v1/auth/register`, `/api/v1/auth/login`, `/api/v1/auth/refresh`, `/api/v1/auth/logout`.
  - User profile endpoints: `GET /api/v1/users/me`, `PATCH /api/v1/users/me`.
- **Health Endpoints**: `/healthz` (liveness), `/readyz` (readiness checking Mongo + Redis).
- **Frontend Core Scaffold**:
  - Vite + React 18 setup with Tailwind CSS design tokens.
  - TanStack Query client with global retry and cache policies.
  - Axios instance with automatic token refresh and request/response interceptors.
  - Base UI components: `Button`, `Card`, `Input`, `Modal`, `Table`, `Skeleton`, `Toast`, `EmptyState`, `ErrorState`.
  - Public & Dashboard layouts with responsive sidebar navigation.
  - React Router configuration with protected routes and role guards.

### Verification Gate

- Unit tests pass for password hashing, JWT generation, token rotation, and Zod env validation.
- Integration tests pass for auth flows (register, login, refresh, token reuse revocation).
- Frontend builds cleanly via `npm run build` and UI kit renders in browser.

---

## Phase 2: Dashboard & Academic Hub

### Scope & Deliverables

- **Academic Domain**:
  - Models & Repositories: `subjects`, `academicResources` (notes, syllabus outline, lecture links, PYQs).
  - contentAdmin CRUD endpoints with draft/published state management.
  - Cursor-based paginated search and filters (university, branch, semester 1–8).
  - Redis cache-aside implementation for subject catalogue with versioned invalidation.
  - Comprehensive seed script with realistic engineering curricula (2 universities, 3 branches, semesters 1–8).
- **Activity Events & Progress Pipeline**:
  - `ActivityService.record()` emitting to `activityEvents` collection and enqueuing to BullMQ `progress` queue.
  - `progress` worker aggregating user metrics into `progressSummaries`.
- **Personalized Dashboard**:
  - `GET /api/v1/dashboard/summary` reading pre-aggregated progress data in < 30ms.
  - Deterministic recommendation engine (`dashboard/recommendation.service.js`) generating "What should I do today?" prioritized actionable items.
  - Frontend Dashboard feature with charts (Recharts), topic coverage, and action cards.

### Verification Gate

- `npm run seed` executes and populates academics and sample progress.
- Progress worker correctly updates `progressSummaries` upon activity event receipt.
- Dashboard API delivers summary in < 50ms.
- Frontend renders the Academic tree and Dashboard charts cleanly.

---

## Phase 3: Coding Platform & GATE Hub `[STATUS: COMPLETE]`

### Scope & Deliverables

- **Coding Domain**:
  - Models: [`codingProblems`](file:///c:/Users/Tusar/Desktop/Engineer_OS/server/src/modules/coding/codingProblem.model.js), [`codingTestCases`](file:///c:/Users/Tusar/Desktop/Engineer_OS/server/src/modules/coding/codingTestCase.model.js) (hidden), [`codingSubmissions`](file:///c:/Users/Tusar/Desktop/Engineer_OS/server/src/modules/coding/codingSubmission.model.js), [`submissionPayloads`](file:///c:/Users/Tusar/Desktop/Engineer_OS/server/src/modules/coding/submissionPayload.model.js).
  - Code execution adapter: Judge0 client + zero-key local mock adapter ([`mock.judge0.js`](file:///c:/Users/Tusar/Desktop/Engineer_OS/server/src/integrations/judge0/mock.judge0.js)).
  - Asynchronous submission flow: `POST /api/v1/coding/submissions` returns `202 Accepted` with BullMQ job ID.
  - `code-exec` worker processing test cases in sandbox, calculating runtime/memory, and updating status (`accepted`, `wrong_answer`, `tle`, `runtime_error`, `compile_error`).
  - Redis sorted sets contest leaderboard support.
  - Seed 26 real DSA problems spanning arrays, strings, two pointers, trees, graphs, dynamic programming, and greedy.
- **GATE Hub**:
  - Models: [`gateTests`](file:///c:/Users/Tusar/Desktop/Engineer_OS/server/src/modules/gate/gateTest.model.js), [`gateAttempts`](file:///c:/Users/Tusar/Desktop/Engineer_OS/server/src/modules/gate/gateAttempt.model.js).
  - GATE question engine ([`scoring.service.js`](file:///c:/Users/Tusar/Desktop/Engineer_OS/server/src/modules/gate/scoring.service.js)) supporting MCQ (+1/-0.33, +2/-0.66), MSQ (exact match, zero penalty), and NAT (range match, zero penalty).
  - Timed test attempt workflow, answer recording, weak topics identification, and instant performance analysis.
  - Seed official GATE CS mock test covering Algorithms, OS, DBMS, Networks, TOC, and Digital Logic.
- **Frontend Workspace**:
  - [`CodingCataloguePage.jsx`](file:///c:/Users/Tusar/Desktop/Engineer_OS/client/src/features/coding/CodingCataloguePage.jsx) with difficulty & tag filters, keyword search.
  - [`ProblemSolvePage.jsx`](file:///c:/Users/Tusar/Desktop/Engineer_OS/client/src/features/coding/ProblemSolvePage.jsx) with multi-language starter code, sample test runner, async submit polling, and verdict drawer.
  - [`GateCataloguePage.jsx`](file:///c:/Users/Tusar/Desktop/Engineer_OS/client/src/features/gate/GateCataloguePage.jsx) with available mock tests and attempt history.
  - [`GateTestPage.jsx`](file:///c:/Users/Tusar/Desktop/Engineer_OS/client/src/features/gate/GateTestPage.jsx) with countdown timer, question palette, review flags, and submission confirmation.
  - [`GateResultPage.jsx`](file:///c:/Users/Tusar/Desktop/Engineer_OS/client/src/features/gate/GateResultPage.jsx) with score overview, weak topic badges, and question-by-question solution explanations.

### Verification Gate (All Verified)

- 6 new coding integration tests + 5 new GATE integration tests (27 server tests passing total).
- 6 client unit tests passing (33 tests monorepo total).
- 0 lint errors, 0 warnings across monorepo (`npm run lint`).
- Prettier formatting validated (`npm run format:check`).
- Client bundle built cleanly with all chunks < 390 kB (`npm run build`).

---

## Phase 4: AI Academic Assistant & AI Mock Interviews `[STATUS: COMPLETE]`

### Scope & Deliverables

- **LLM Integration Layer**:
  - Universal provider interface: [`ILLMAdapter`](file:///c:/Users/Tusar/Desktop/Engineer_OS/server/src/integrations/llm/llm.interface.js).
  - Offline zero-key mock adapter: [`MockLLMAdapter`](file:///c:/Users/Tusar/Desktop/Engineer_OS/server/src/integrations/llm/mock.llm.js) with rich academic concept responses, token streaming, and structured rubric evaluations.
  - Production adapter: [`AnthropicLLMAdapter`](file:///c:/Users/Tusar/Desktop/Engineer_OS/server/src/integrations/llm/anthropic.llm.js) with Opossum circuit breaker fallback.
  - System prompts: [`academicAssistant.prompt.js`](file:///c:/Users/Tusar/Desktop/Engineer_OS/server/src/integrations/llm/prompts/academicAssistant.prompt.js), [`interviewEvaluator.prompt.js`](file:///c:/Users/Tusar/Desktop/Engineer_OS/server/src/integrations/llm/prompts/interviewEvaluator.prompt.js).
- **AI Academic Assistant**:
  - Grounded contextual retrieval over verified curriculum notes ([`assistant.service.js`](file:///c:/Users/Tusar/Desktop/Engineer_OS/server/src/modules/ai/assistant.service.js)).
  - Server-Sent Events (SSE) streaming endpoint: `POST /api/v1/ai/assistant/stream`.
  - Conversation persistence: [`AssistantConversation`](file:///c:/Users/Tusar/Desktop/Engineer_OS/server/src/modules/ai/assistantConversation.model.js) storing student messages and source document citations.
  - Rate limiting via `aiLimiter`.
- **AI Mock Interviews**:
  - Multi-turn session manager ([`interview.service.js`](file:///c:/Users/Tusar/Desktop/Engineer_OS/server/src/modules/ai/interview.service.js)) supporting Technical, DSA, Project, and HR modes.
  - Asynchronous rubric evaluation via BullMQ `ai-feedback` queue: [`AiFeedbackWorkerService`](file:///c:/Users/Tusar/Desktop/Engineer_OS/server/src/jobs/workers/aiFeedback.worker.js) scoring Technical Correctness, Relevance & Depth, Clarity & Communication, and Problem Solving (0-100).
  - Activity event piping updates user's `progressSummaries` readiness scores.
- **Frontend Workspaces**:
  - [`AiAssistantPage.jsx`](file:///c:/Users/Tusar/Desktop/Engineer_OS/client/src/features/ai-assistant/AiAssistantPage.jsx): Chat UI with SSE streaming tokens, source citation badges, subject dropdown, prompt shortcuts, and academic integrity disclaimer.
  - [`InterviewHubPage.jsx`](file:///c:/Users/Tusar/Desktop/Engineer_OS/client/src/features/interviews/InterviewHubPage.jsx): Mode selection cards, session configuration modal, and previous interview scorecard history.
  - [`InterviewSessionPage.jsx`](file:///c:/Users/Tusar/Desktop/Engineer_OS/client/src/features/interviews/InterviewSessionPage.jsx): Live interviewer dialogue, Web Speech API speech-to-text dictation, and comprehensive rubric scorecard.

### Verification Gate (All Verified)

- 3 new AI Assistant tests + 3 new Mock Interview tests (33 server tests passing total across 8 test files).
- 6 client unit tests passing (39 tests monorepo total).
- 0 lint errors, 0 warnings across monorepo (`npm run lint`).
- Prettier formatting validated (`npm run format:check`).
- Client bundle built cleanly (`npm run build`).

---

## Phase 5: Assessments & Community Network

### Scope & Deliverables

- **AI-Proctored Assessments**:
  - Assessment creator for contentAdmins/faculty with question bank selection, duration, window, and rules.
  - Student attempt engine: server-authoritative timer, periodic autosave (every 30s), network reconnection resumption, idempotent submission.
  - BullMQ delayed job for automatic submission upon timer expiry.
  - Consent disclosure screen detailing monitored events.
  - Client integrity monitoring emitting `monitoringEvents` (tab hidden, blur, fullscreen exit, paste).
  - Reviewer dashboard for faculty/admins displaying review signals (strictly "flagged for review", never "cheating detected").
- **Senior-Junior & Alumni Network**:
  - Community posts with separate `communityReplies` collection to prevent unbounded document growth.
  - Tags, upvotes, accepted answer marking, and "Ask a Senior" filter.
  - Senior and Alumni badges displayed across profiles and posts.
  - Anti-spam rate limiting and moderation queue for flagged content.
- **Notifications System**:
  - In-app notification center (assessment reminders, replies, submission results).
  - Email notification adapter (SES + local console mock).

### Verification Gate (Status: VERIFIED & COMPLETE)

- Assessment timer expiry test verifies automatic server-side submission.
- Network interruption and resumption test proves answers are preserved.
- Community thread tests verify threaded replies and moderation workflows.
- Quality gates passed:
  - `npm run format:check`: 100% compliant
  - `npm run lint`: 0 errors, 0 warnings
  - `npm run test:server`: 11 test suites passed, 44 tests green
  - `npm run test:client`: 6 tests green
  - `npm run build`: Production client and server build succeeded, chunks < 388 kB

---

## Phase 6: Admin Governance, Quality Assurance & Deployment

### Scope & Deliverables

- **Admin Console**:
  - Role management, content publishing/unpublishing, question bank management.
  - Assessment integrity flag review portal.
  - Platform configuration toggles (feature flags, AI rate limits).
  - Append-only audit logging for all administrative operations.
- **Testing & Security Hardening**:
  - Unit, integration, and API test suites with >= 80% coverage on core services.
  - Playwright E2E tests for 5 critical user journeys.
  - OWASP Top 10 security review (NoSQL injection, XSS, CSRF, rate limit verification).
  - Accessibility audit (WCAG AA contrast, keyboard navigation, ARIA attributes).
- **Load Testing**:
  - k6 scripts under `loadtest/` for Dashboard, Problem Listing, and Submission Enqueue targeting p95 < 100ms.
- **Documentation & Packaging**:
  - `README.md`, `docs/API.md` (OpenAPI 3 spec), `docs/INDEXES.md`, `docs/SECURITY.md`, `docs/PRIVACY.md`, `docs/SCALING.md`, `docs/RUNBOOK.md`.
  - Requirements Traceability Matrix mapping FR-01 through FR-12.
  - Production-ready Dockerfiles (multi-stage) and deployment guides for Vercel, Render/Railway, and AWS ECS.

### Verification Gate

- Complete test suite passes (`npm test`).
- Production build succeeds (`npm run build`).
- `docker compose up` brings up all services and completes health check.
