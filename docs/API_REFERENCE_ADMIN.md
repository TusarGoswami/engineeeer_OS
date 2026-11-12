# EngineerOS Admin & Faculty REST API Reference

All routes require `Authorization: Bearer <token>` and role `contentAdmin` or `platformAdmin`.

### 1. Dashboard Analytics
- `GET /api/v1/admin/stats` -> Returns aggregate counts for users, problems, scheduled exams, integrity flags.

### 2. Coding Problem Authoring
- `GET /api/v1/admin/problems` -> List problems with optional `?difficulty=` and `?search=` filters.
- `POST /api/v1/admin/problems` -> Create algorithm problem with title, slug, statement, starter templates.
- `PUT /api/v1/admin/problems/:id` -> Update problem specification or constraints.
- `POST /api/v1/admin/problems/:id/testcases` -> Add hidden or standard execution test cases.

### 3. Assessment Scheduler & Moderation
- `GET /api/v1/admin/assessments` -> List all scheduled exams.
- `POST /api/v1/admin/assessments` -> Create exam with proctoring rules (`fullScreenRequired`, `trackTabSwitches`).
- `GET /api/v1/admin/integrity-queue` -> List proctoring violation alerts pending faculty review.
- `PATCH /api/v1/admin/integrity-verdict/:attemptId` -> Resolve violation: `approve`, `penalize`, or `void`.

### 4. User & Alumni Governance
- `PATCH /api/v1/admin/users/:userId/role` -> Update user role.
- `POST /api/v1/admin/users/:userId/alumni-status` -> Verify alumni profile and award Gold Badge.
