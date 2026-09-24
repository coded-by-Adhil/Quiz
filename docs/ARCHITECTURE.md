# Architecture

This document defines the system design for Quiz App: role model, authentication and authorization, database schema, API contract, and security posture. It is the source of truth for the data model and API shape — any implementation detail that diverges from this document should be reconciled deliberately, not silently.

## 1. Roles & Responsibilities

| Role | Authenticated? | Responsibilities |
|---|---|---|
| **super_admin** | Yes | Platform-level oversight: total admins, quizzes, and attempts. Approves/suspends admin accounts. Not involved in quiz authoring. |
| **admin** | Yes | Owns a question bank and a set of quizzes. Assembles quizzes from bank questions, generates shareable links with a link-specific question subset, and reviews participant scores for quizzes they own. |
| **guest** | No | Accesses a quiz via link, submits a display name, completes the quiz, and receives a score. No persistent identity beyond the attempt record. May re-attempt. |

There is no separate authenticated "participant" account — quiz-taking is intentionally frictionless and unauthenticated by design, scoped entirely by possession of a valid link token.

## HEAD
Admin self-registration requires `super_admin` approval before activation. Until an approval endpoint exists, a pre-approved `super_admin` account is provisioned out-of-band via a database seeder.

## 2. Authentication

- **Admin / super admin:** Laravel Sanctum auth between the React client and Laravel API. Phase 1 issues personal access tokens for API/Postman testing; SPA cookie-based auth can be introduced later when the frontend auth UI is built.
  - `POST /api/admin/register` — creates an `admin` account. Role is assigned server-side and is never client-controlled.
  - `POST /api/admin/login`
  - `POST /api/admin/logout`
  - `GET /api/me` — returns the authenticated admin/super_admin profile.

## 3. Authorization

| Action | Rule |
|---|---|
| Manage own questions / quizzes / links | `role = admin` AND resource `owner_id = auth user` |
| View attempt scores for a quiz | `role = admin` AND owns the quiz |
| View platform-wide stats | `role = super_admin` |
| Approve/suspend admin accounts | `role = super_admin` |
| Access a quiz via link | Public — token-validated, rate-limited |
| Submit answers / view a result | Requires the `attempt_id` issued at start (non-guessable UUID) |

Enforced via Laravel Policies (`QuestionPolicy`, `QuizPolicy`, `QuizLinkPolicy`) applied per-resource in controllers, not solely through route middleware, since ownership — not just role — determines access.

## 4. Data Model

```
users
├── id
├── name
├── email (unique)
├── password
├── role              enum('super_admin','admin')
├── is_approved       boolean default false
└── timestamps

questions
├── id
├── created_by         FK -> users.id
├── question_text
├── type                enum('single','multiple')
├── marks               int default 1
└── timestamps (+ soft deletes)

question_options
├── id
├── question_id         FK -> questions.id
├── option_text
├── is_correct          boolean
└── timestamps

quizzes
├── id
├── owner_id             FK -> users.id
├── title
├── description
├── duration_minutes     nullable
└── timestamps

quiz_questions
├── quiz_id               FK -> quizzes.id
├── question_id           FK -> questions.id
└── order

quiz_links
├── id
├── quiz_id                FK -> quizzes.id
├── token                  string unique
├── is_active               boolean default true
└── timestamps

quiz_link_questions
├── quiz_link_id            FK -> quiz_links.id
├── question_id             FK -> questions.id
└── order

quiz_attempts
├── id (UUID)
├── quiz_link_id             FK -> quiz_links.id
├── participant_name         string
├── started_at
├── submitted_at              nullable
├── score                     nullable
├── total_marks
└── timestamps

quiz_attempt_answers
├── id
├── quiz_attempt_id            FK -> quiz_attempts.id
├── question_id                FK -> questions.id
└── timestamps

quiz_attempt_answer_options
├── quiz_attempt_answer_id      FK -> quiz_attempt_answers.id
└── question_option_id          FK -> question_options.id
```

**Relationships**
- Admin 1—N Questions, 1—N Quizzes
- Quiz N—N Questions via `quiz_questions` (questions are reusable across quizzes)
- Quiz 1—N QuizLinks; each link defines an independent question subset via `quiz_link_questions`
- QuizLink 1—N QuizAttempts (reusable, unlimited attempts, no expiry)
- QuizAttempt 1—N QuizAttemptAnswers 1—N QuizAttemptAnswerOptions

**Scoring**
- Single-select: correct if the selected option's `is_correct = true`.
- Multi-select: correct only if the selected option set exactly matches the full correct-option set — no partial credit, no negative marking.
- Computed server-side on submission; the client never transmits a score.
- Admins see aggregate scores only. Answer-level detail is persisted for future analytics but not currently exposed via API.

## 5. API Surface

### Auth
```
POST /api/admin/register
POST /api/admin/login
POST /api/admin/logout
GET  /api/me
```

### Question bank
```
GET/POST/PUT/DELETE /api/admin/questions[/{id}]
```

### Quizzes
```
GET/POST/PUT/DELETE /api/admin/quizzes[/{id}]
POST /api/admin/quizzes/{id}/questions   { question_ids: [] }
```

### Links
```
POST  /api/admin/quizzes/{id}/links   { question_ids: [] }
GET   /api/admin/quizzes/{id}/links
PATCH /api/admin/links/{id}           { is_active }
```

### Reporting
```
GET /api/admin/quizzes/{id}/attempts
```

### Platform administration
```
GET   /api/superadmin/stats
GET   /api/superadmin/admins
PATCH /api/superadmin/admins/{id}   { is_approved }
```

### Guest quiz flow
```
GET  /api/quiz/{token}
POST /api/quiz/{token}/start                            { participant_name }
POST /api/quiz/{token}/attempts/{attemptId}/submit      { answers: [{question_id, option_ids: []}] }
GET  /api/quiz/{token}/attempts/{attemptId}/result
```

### Diagnostics
```
GET /api/test     -- static liveness check
GET /api/health   -- verifies database connectivity
```

## 6. Security

1. `is_correct` is stripped from all guest-facing payloads via dedicated API Resources.
2. Scoring is exclusively server-side.
3. Link tokens are cryptographically random; the resolution endpoint is rate-limited against enumeration.
4. Attempt identifiers are UUIDs, not sequential — attempt data is not accessible without the issued ID.
5. `start` and `submit` endpoints are rate-limited per IP given the absence of an auth layer on the guest flow.
6. Submission is idempotent-guarded: once `submitted_at` is set, further submits to that attempt are rejected.
7. `role` and `is_approved` are excluded from mass assignment on all client-facing write paths.
8. All write endpoints validate via Form Requests (option count minimums, correct-option presence, etc.).
9. CORS is restricted to known frontend origins.
10. Sanctum cookies use `Secure`, `HttpOnly`, and `SameSite` flags; HTTPS is enforced in production.
11. `questions` and `quizzes` use soft deletes to preserve referential integrity for historical attempts.
12. Links do not expire by design — a leaked link remains valid until manually deactivated by its owner. This is surfaced in the admin UI.

## 7. Implementation Roadmap

1. Project scaffolding and connectivity (API ↔ DB ↔ client)
2. Authentication (admin / super admin)
3. Question bank CRUD
4. Quiz management
5. Shareable links
6. Guest quiz-taking flow
7. Admin reporting
8. Super admin dashboard
