# EngineerOS — Database Schema & Compound Indexes Specification

This document details the compound indexes, unique constraints, and TTL policies designed for every MongoDB collection in **EngineerOS**, along with the exact hot queries and access patterns they serve.

---

## 1. Index Design Principles

1. **Equality, Sort, Range (ESR Rule)**: All compound indexes place equality filters first, sort attributes second, and range filters last.
2. **Lean & Projection Aware**: Indexes cover high-frequency queries to allow index-only scans where possible.
3. **Cursor-Based Pagination**: Paginated lists sort by `{ occurredAt: -1, _id: -1 }` or `{ submittedAt: -1, _id: -1 }` with cursor indexes.
4. **TTL Collections**: Automated expiration for high-volume append-only collections (`activityEvents`, `monitoringEvents`).

---

## 2. Collection Index Matrix

### 2.1 `users`

| Index Fields                 | Type     | Purpose / Query Served                                                |
| ---------------------------- | -------- | --------------------------------------------------------------------- |
| `{ email: 1 }`               | Unique   | User lookup on login, password reset, and registration deduplication. |
| `{ role: 1, university: 1 }` | Compound | Admin filtering of users by institution and role.                     |
| `{ isAlumni: 1, branch: 1 }` | Compound | Community senior/alumni directory queries.                            |

### 2.2 `refreshTokens`

| Index Fields               | Type                        | Purpose / Query Served                                   |
| -------------------------- | --------------------------- | -------------------------------------------------------- |
| `{ tokenHash: 1 }`         | Unique                      | O(1) token lookup on `/api/v1/auth/refresh`.             |
| `{ userId: 1, family: 1 }` | Compound                    | Instant token family revocation on detected token reuse. |
| `{ expiresAt: 1 }`         | TTL (expireAfterSeconds: 0) | Automatic cleanup of expired refresh tokens.             |

### 2.3 `subjects`

| Index Fields                                                | Type            | Purpose / Query Served                        |
| ----------------------------------------------------------- | --------------- | --------------------------------------------- |
| `{ university: 1, branch: 1, semester: 1, code: 1 }`        | Unique Compound | Primary subject syllabus lookup per semester. |
| `{ university: 1, branch: 1, semester: 1, isPublished: 1 }` | Compound        | Student-facing subject catalogue listings.    |
| `{ name: "text", code: "text" }`                            | Text            | Free-text search across academic subjects.    |

### 2.4 `academicResources`

| Index Fields                                               | Type     | Purpose / Query Served                                      |
| ---------------------------------------------------------- | -------- | ----------------------------------------------------------- |
| `{ subjectId: 1, type: 1, isPublished: 1, createdAt: -1 }` | Compound | Filter notes, PYQs, and syllabus resources per subject.     |
| `{ title: "text", description: "text" }`                   | Text     | AI Assistant grounded retrieval over course notes and PYQs. |

### 2.5 `codingProblems`

| Index Fields                                   | Type     | Purpose / Query Served                          |
| ---------------------------------------------- | -------- | ----------------------------------------------- |
| `{ slug: 1 }`                                  | Unique   | Problem statement lookup by URL slug.           |
| `{ difficulty: 1, tags: 1, isPublished: 1 }`   | Compound | Filterable problem catalogue with tag matching. |
| `{ title: "text", statementMarkdown: "text" }` | Text     | Problem search bar queries.                     |

### 2.6 `codingSubmissions`

| Index Fields                              | Type     | Purpose / Query Served                                          |
| ----------------------------------------- | -------- | --------------------------------------------------------------- |
| `{ userId: 1, submittedAt: -1, _id: -1 }` | Compound | Student's personal submission history (cursor paginated).       |
| `{ problemId: 1, userId: 1, status: 1 }`  | Compound | Quick check whether student has already solved a given problem. |
| `{ problemId: 1, submittedAt: -1 }`       | Compound | Problem-specific submission feed.                               |
| `{ status: 1, submittedAt: 1 }`           | Compound | Queue watchdog checking for stuck or orphaned submissions.      |

### 2.7 `submissionPayloads`

| Index Fields          | Type   | Purpose / Query Served                                    |
| --------------------- | ------ | --------------------------------------------------------- |
| `{ submissionId: 1 }` | Unique | Fetching raw source code and compilation trace on-demand. |

### 2.8 `gateResources` & `gateTests`

| Index Fields                            | Type     | Purpose / Query Served                        |
| --------------------------------------- | -------- | --------------------------------------------- |
| `{ subject: 1, topic: 1, year: -1 }`    | Compound | PYQ and topic-wise GATE preparation browsing. |
| `{ isPublished: 1, scheduledDate: -1 }` | Compound | Upcoming and active GATE mock test catalogue. |

### 2.9 `gateAttempts`

| Index Fields                              | Type     | Purpose / Query Served                         |
| ----------------------------------------- | -------- | ---------------------------------------------- |
| `{ userId: 1, testId: 1, createdAt: -1 }` | Compound | Student GATE attempt history and score review. |

### 2.10 `assessments`

| Index Fields                                  | Type     | Purpose / Query Served                                          |
| --------------------------------------------- | -------- | --------------------------------------------------------------- |
| `{ status: 1, windowStart: 1, windowEnd: 1 }` | Compound | Assessment lifecycle transitions (scheduled -> live -> closed). |
| `{ createdBy: 1, createdAt: -1 }`             | Compound | Faculty / ContentAdmin management dashboard.                    |

### 2.11 `assessmentAttempts`

| Index Fields                                | Type            | Purpose / Query Served                                    |
| ------------------------------------------- | --------------- | --------------------------------------------------------- |
| `{ assessmentId: 1, userId: 1 }`            | Unique Compound | Enforces strictly one attempt per student per assessment. |
| `{ assessmentId: 1, status: 1, score: -1 }` | Compound        | Assessment leaderboard and submission audit review.       |
| `{ status: 1, expiresAt: 1 }`               | Compound        | Worker query to auto-submit expired student attempts.     |

### 2.12 `monitoringEvents`

| Index Fields                      | Type                              | Purpose / Query Served                                      |
| --------------------------------- | --------------------------------- | ----------------------------------------------------------- |
| `{ attemptId: 1, occurredAt: 1 }` | Compound                          | Chronological integrity review timeline for human proctors. |
| `{ occurredAt: 1 }`               | TTL (expireAfterSeconds: 5184000) | 60-day automatic retention purge.                           |

### 2.13 `communityPosts`

| Index Fields                                       | Type     | Purpose / Query Served                       |
| -------------------------------------------------- | -------- | -------------------------------------------- |
| `{ tags: 1, createdAt: -1, _id: -1 }`              | Compound | Tag-based community feed (cursor paginated). |
| `{ authorId: 1, createdAt: -1 }`                   | Compound | User profile post history.                   |
| `{ isPinned: -1, upvoteCount: -1, createdAt: -1 }` | Compound | Top and trending community feed.             |
| `{ title: "text", content: "text" }`               | Text     | Community discussion search.                 |

### 2.14 `communityReplies`

| Index Fields                                    | Type     | Purpose / Query Served                      |
| ----------------------------------------------- | -------- | ------------------------------------------- |
| `{ postId: 1, parentReplyId: 1, createdAt: 1 }` | Compound | Hierarchical threaded replies under a post. |
| `{ authorId: 1, createdAt: -1 }`                | Compound | User reply history.                         |

### 2.15 `activityEvents`

| Index Fields                    | Type                              | Purpose / Query Served                                              |
| ------------------------------- | --------------------------------- | ------------------------------------------------------------------- |
| `{ userId: 1, occurredAt: -1 }` | Compound                          | Fetching recent activity feed for student dashboard.                |
| `{ occurredAt: 1 }`             | TTL (expireAfterSeconds: 7776000) | 90-day retention purge (summaries retained in `progressSummaries`). |

### 2.16 `progressSummaries`

| Index Fields    | Type   | Purpose / Query Served                                           |
| --------------- | ------ | ---------------------------------------------------------------- |
| `{ userId: 1 }` | Unique | O(1) instant read of pre-aggregated stats for dashboard summary. |

### 2.17 `notifications`

| Index Fields                              | Type     | Purpose / Query Served                                 |
| ----------------------------------------- | -------- | ------------------------------------------------------ |
| `{ userId: 1, isRead: 1, createdAt: -1 }` | Compound | Fetching unread notifications badge and dropdown list. |

### 2.18 `auditLogs`

| Index Fields                         | Type     | Purpose / Query Served                 |
| ------------------------------------ | -------- | -------------------------------------- |
| `{ targetDomain: 1, createdAt: -1 }` | Compound | Administrative audit trail filtering.  |
| `{ actorId: 1, createdAt: -1 }`      | Compound | Actions performed by a specific admin. |
