# Architecture

Design decisions for the Quiz App, made before implementation began. This document is the source of truth for schema and API shape — if an implementation detail contradicts this doc, either the code or this doc is wrong, and it should be resolved deliberately, not silently.

## 1. Roles & Responsibilities

| Role | Account? | Responsibilities |
|---|---|---|
| **super_admin** | Yes, logs in | Views platform-wide stats: total admins, total quizzes, total attempts. Not involved in quiz creation. Approves/suspends admin accounts (if approval gate is enabled). |
| **admin** | Yes, self-registers, logs in | Builds a personal question bank, creates quizzes by pulling questions from that bank, generates shareable links per quiz (selecting a question subset per link), views attempt scores for quizzes they own. |
| **guest (quiz taker)** | No account | Opens a shared link, enters a name, takes the quiz, sees their own score. Nothing else is stored about them beyond the attempt. Can re-attempt the same quiz. |

There is no separate authenticated "user" role — anyone taking a quiz is an anonymous guest tied only to a single attempt record.

**Open decision:** whether new admin self-registrations require super_admin approval before they can log in and create content. Not yet resolved — revisit before building Phase 1's registration flow.

## 2. Authentication Flow

- **Admin / Super Admin:** Laravel Sanctum, SPA cookie-based auth (React and Laravel are separate apps, same top-level domain assumed — adjust to token-based Sanctum if hosted cross-domain).
  - `POST /api/admin/register` → creates an `admin` account (role forced server-side, never trusted from client input).
  - `POST /api/admin/login` → issues session/token.
  - `POST /api/admin/logout` → revokes it.
  - Super admin accounts are **not** self-registrable — seeded via an artisan command/seeder.
- **Guests:** no authentication. A guest's only "session" is the `attempt_id` (UUID) issued when they start a quiz — used to submit answers and fetch their result, and nothing else.

## 3. Authorization Rules

| Action | Rule |
|---|---|
| Manage own questions / quizzes / links | `role = admin` AND resource `owner_id = auth()->id()` |
| View attempt scores for a quiz | `role = admin` AND owns the quiz |
| View platform-wide stats | `role = super_admin` only |
| Approve/suspend admin accounts | `role = super_admin` only |
| Take a quiz via link | Public, no auth — rate-limited and token-validated |
| Submit answers / view own result | Must present the `attempt_id` issued at start — not guessable (UUID) |

Enforce via Laravel Policies (`QuestionPolicy`, `QuizPolicy`, `QuizLinkPolicy`) checked in controllers with `$this->authorize()`, not just route middleware — ownership checks need per-resource logic, not just role checks.

## 4. Database Schema

```
users
├── id
├── name
├── email (unique)
├── password
├── role              enum('super_admin','admin')
├── is_approved       boolean default false   -- if approval gate is enabled
└── timestamps

questions                         -- the question bank
├── id
├── created_by         FK -> users.id (admin who owns it)
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
├── owner_id             FK -> users.id (admin)
├── title
├── description
├── duration_minutes     nullable  -- admin-set time limit
└── timestamps

quiz_questions            -- questions pulled from the bank into this quiz
├── quiz_id               FK -> quizzes.id
├── question_id           FK -> questions.id
└── order

quiz_links
├── id
├── quiz_id                FK -> quizzes.id
├── token                  string unique (UUID / random 40 chars)
├── is_active               boolean default true   -- manual on/off, no expiry
└── timestamps

quiz_link_questions        -- subset of quiz_questions selected for THIS link
├── quiz_link_id            FK -> quiz_links.id
├── question_id             FK -> questions.id
└── order

quiz_attempts
├── id (UUID)                -- doubles as the guest's session reference
├── quiz_link_id             FK -> quiz_links.id
├── participant_name         string   -- guest only, no user_id
├── started_at
├── submitted_at              nullable
├── score                     nullable, computed server-side on submit
├── total_marks
└── timestamps

quiz_attempt_answers          -- stored for scoring integrity; not exposed via admin UI
├── id
├── quiz_attempt_id            FK -> quiz_attempts.id
├── question_id                FK -> questions.id
└── timestamps

quiz_attempt_answer_options   -- handles single- and multi-select uniformly
├── quiz_attempt_answer_id      FK -> quiz_attempt_answers.id
└── question_option_id          FK -> question_options.id
```

**Relationships:**
- Admin 1—N Questions, 1—N Quizzes
- Quiz N—N Questions (via `quiz_questions`) — questions are reusable across quizzes
- Quiz 1—N QuizLinks; each link defines its own question subset (via `quiz_link_questions`)
- QuizLink 1—N QuizAttempts (multi-use, no expiry, no per-user limit — guests can re-attempt)
- QuizAttempt 1—N QuizAttemptAnswers 1—N QuizAttemptAnswerOptions

**Scoring rule:**
- `single`-type question: correct if the one selected option's `is_correct = true`.
- `multiple`-type question: correct **only if** the selected option set exactly equals the full set of `is_correct = true` options — no partial credit, no negative marking. 1 mark either way.
- Score is always computed server-side on submit. The client never sends or influences the score value.
- Admins see only the final `score` per attempt — not the answer-level breakdown. The answer data is still stored (for future analytics, e.g. per-question failure rates) but no endpoint currently exposes it.

## 5. API Endpoints

### Auth
```
POST /api/admin/register
POST /api/admin/login
POST /api/admin/logout
```

### Admin — Question Bank
```
GET/POST/PUT/DELETE /api/admin/questions[/{id}]
```

### Admin — Quizzes
```
GET/POST/PUT/DELETE /api/admin/quizzes[/{id}]
POST /api/admin/quizzes/{id}/questions   { question_ids: [] }
```

### Admin — Links
```
POST  /api/admin/quizzes/{id}/links   { question_ids: [] }
GET   /api/admin/quizzes/{id}/links
PATCH /api/admin/links/{id}           { is_active }
```

### Admin — Reporting
```
GET /api/admin/quizzes/{id}/attempts   -- participant_name + score list only
```

### Super Admin
```
GET   /api/superadmin/stats
GET   /api/superadmin/admins
PATCH /api/superadmin/admins/{id}   { is_approved }
```

### Public — Guest Quiz Taking
```
GET  /api/quiz/{token}                                 -- validate link, return quiz meta
POST /api/quiz/{token}/start                            { participant_name } -> attempt_id + questions (no is_correct)
POST /api/quiz/{token}/attempts/{attemptId}/submit      { answers: [{question_id, option_ids: []}] }
GET  /api/quiz/{token}/attempts/{attemptId}/result
```

### Phase 0 (connectivity only)
```
GET /api/test     -- returns a static success payload, no DB access
GET /api/health   -- checks DB connectivity, returns connected/disconnected status
```

## 6. Security Considerations

1. **Never expose `is_correct`** in any guest-facing question/option payload — control field visibility with API Resources.
2. **Server-side scoring only.**
3. **Link tokens** are cryptographically random, not sequential — rate-limit `GET /api/quiz/{token}` to prevent brute-forcing valid tokens.
4. **`attempt_id` is a UUID**, not sequential — guessing another guest's attempt ID must not be feasible.
5. **Rate-limit** `POST /{token}/start` and `/submit` per IP to prevent attempt-spamming, since there's no auth wall in front of the guest flow.
6. **Duplicate submission guard:** once `submitted_at` is set, reject further submits to that attempt.
7. **Mass assignment protection:** `role` and `is_approved` must never be settable via a client-supplied field on any admin-facing write endpoint.
8. **Input validation** via Form Requests on every write endpoint (option counts ≥ 2, at least one correct option per question, etc.).
9. **CORS** restricted to the known frontend origin(s) only.
10. **HTTPS enforced**, secure cookie flags (`Secure`, `HttpOnly`, `SameSite`) for Sanctum cookies.
11. **Soft deletes** on `questions`/`quizzes` — hard-deleting a question referenced by historical attempts would corrupt reporting.
12. **No expiry on links** is an intentional product decision — a leaked link stays valid until an admin manually deactivates it. Surface this clearly in the admin UI.

## 7. Build Phases

1. Project skeleton (Laravel API + React app + MySQL connectivity) — **done**
2. Auth (admin / super_admin)
3. Question bank CRUD
4. Quiz management (build from question bank)
5. Shareable links
6. Public guest attempt flow
7. Admin reporting
8. Super admin dashboard
