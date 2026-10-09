# Frontend Architecture

Design for the React client of Quiz App. The backend contract (schema, endpoints, authorization rules) is defined in [`ARCHITECTURE.md`](ARCHITECTURE.md) and is the source of truth for everything the client consumes. This document covers how the client is structured, how it talks to the API, and the order in which it is built.

## 1. Stack

| Concern | Choice | Rationale |
|---|---|---|
| Build / UI | Vite + React + TypeScript (strict) | Fast dev loop; types mirror the API contract |
| Routing | React Router | Four access zones with route guards |
| Server state | TanStack Query | Caching, pagination, invalidation after mutations |
| HTTP | Axios (single instance) | One place for auth header and error handling |
| Forms | React Hook Form + Zod | Dynamic field arrays; server 422 errors map to fields |
| Styling | Tailwind CSS | Consistent utility-based styling |

## 2. Principles

- **Contract-first.** TypeScript types mirror backend responses. Types are derived from real responses, never guessed.
- **Server state is not client state.** Server data lives in TanStack Query. The only global client state is authentication.
- **Frontend guards are UX, not security.** Every authorization decision is enforced by the API. The client only avoids showing screens a user cannot use.
- **Feature-based structure.** Code is grouped by feature, not by file type.
- **No `any`.** Unknown data is typed `unknown` and narrowed.

## 3. Project Structure

```
frontend/src/
├── api/            Axios instance + one module per resource
├── features/
│   ├── auth/
│   ├── questions/
│   ├── quizzes/
│   ├── links/
│   ├── guest-quiz/
│   ├── reports/
│   └── superadmin/
├── components/     Shared UI primitives (Button, Input, Card, Spinner, Toast, ...)
├── routes/         Router configuration, layouts, guards
├── lib/            Token storage, error normalization, helpers
└── types/          Cross-feature types (e.g. Paginated<T>, ApiError)
```

Each feature owns its pages, components, hooks, Zod schemas, and types.

## 4. Routing & Access Zones

| Zone | Routes | Guard |
|---|---|---|
| Auth | `/login`, `/register` | Redirect away if already authenticated |
| Guest | `/q/:token` | None (public) |
| Admin | `/admin/questions`, `/admin/quizzes`, `/admin/quizzes/:id`, `/admin/quizzes/:id/attempts` | `role = admin` |
| Super admin | `/superadmin`, `/superadmin/admins`, `/superadmin/admins/:id` | `role = super_admin` |

After login the user is redirected by role: admin to the admin zone, super admin to the super admin zone. A user who navigates to the other zone's URL is redirected back. Guards are implemented as `RequireAuth` and `RequireRole` route wrappers.

## 5. Authentication & Token Handling

- Authentication uses Sanctum personal access tokens sent as `Authorization: Bearer <token>`.
- The token is read and written through a single module (`lib/tokenStorage.ts`) backed by `localStorage`, with every access wrapped in `try/catch`. The Axios request interceptor attaches it.
- A `401` on an authenticated request clears the token and auth state and redirects to `/login` with a "session ended" notice. This also covers admins whose tokens were revoked on suspension.
- A `403` on login for an unapproved admin shows a "pending approval" message and does not create a session.
- The token is never logged and never placed in a URL.
- **Trade-off:** `localStorage` is readable by injected scripts. The mitigation is strict output handling: user-generated text (question text, option text, quiz titles, participant names) is always rendered as plain text and `dangerouslySetInnerHTML` is not used. A Content-Security-Policy is applied at deployment. If the backend moves to Sanctum SPA cookie mode, this decision should be revisited.

## 6. API Layer

- One Axios instance; base URL from `VITE_API_BASE_URL`.
- One module per resource under `api/`. Functions return typed, unwrapped data.
- Response types live beside each feature and mirror the backend API Resources. Two guarantees are reflected at the type level:
  - Guest-facing question and option types contain no `is_correct` field.
  - Admin attempt-report types contain no answer-level fields (score and participant name only).
- Errors are normalized into an `ApiError` (`status`, `message`, optional `fieldErrors`). A `422` populates `fieldErrors`, which forms apply via React Hook Form's `setError`.
- Paginated responses are typed once as a generic `Paginated<T>`, derived from the backend's actual envelope.

## 7. State Management

- **Server state:** TanStack Query. Query keys follow `[resource, filters]`. Mutations invalidate the affected keys. Retries are disabled for `4xx` responses.
- **Auth state:** a single React context holding the user and role.
- **Forms:** React Hook Form with Zod schemas colocated per feature.
- **Guest quiz state:** a reducer local to the `guest-quiz` feature, mirrored to `sessionStorage` (see section 9).

## 8. UI Conventions

- Shared primitives live in `components/`; features do not define their own buttons or inputs.
- Every data-driven screen implements loading, empty, and error states.
- Destructive actions (delete, suspend) require a confirmation dialog.
- Lists are paginated, and expose search, sort, and page size where the API supports them.
- Accessibility baseline: labelled inputs, visible focus, focus management in dialogs, keyboard navigation through the quiz flow.

## 9. Guest Quiz Flow

1. `GET /api/quiz/{token}` returns quiz metadata, or an error if the link is inactive.
2. The guest enters a display name; `POST /api/quiz/{token}/start` returns the `attempt_id` and the question set.
3. Questions are presented one at a time with Next/Previous. Navigation is purely client-side; the API returns the full set at once.
4. Answers are submitted in a single request; the result screen shows the score and the per-question breakdown.

Handling:

| Case | Response |
|---|---|
| Inactive link | `403`, "this quiz link is no longer available" |
| Time limit exceeded | `422`, clear message; the attempt is not scored |
| Duplicate submission | `422` |
| Rate limited | `429`, retry-later message |

The countdown timer is display-only. The server is authoritative: the client auto-submits at zero and handles a `422` gracefully.

**Known limitation:** the API has no endpoint to resume an in-progress attempt. To limit the impact of an accidental refresh, answers are mirrored to `sessionStorage` keyed by `attempt_id` and a `beforeunload` warning is shown. A fully lost session cannot be recovered.

## 10. Testing Strategy

- Unit and component tests: Vitest + React Testing Library (forms, option editor, score display).
- Network boundary: MSW for API mocking in tests.
- End-to-end: one Playwright test covering the guest flow (open link, enter name, answer, submit, view result).
- Type-check and lint run on every change.

## 11. Security Considerations

1. Route guards are UX only; the API enforces authorization.
2. Token handling is confined to one module and never logged or put in URLs.
3. All user-generated text is rendered as plain text; no raw HTML injection.
4. The client never receives or stores correct-answer data before submission.
5. Admin screens never request or display answer-level data.
6. The API base URL comes from environment configuration only.

## 12. Implementation Roadmap

| Phase | Deliverable | Endpoints consumed |
|---|---|---|
| **F0 Foundation** | TypeScript setup, folder structure, router with layouts, Axios client, error normalization, token storage, shared primitives, status page | `GET /api/test`, `GET /api/health` |
| **F1 Authentication** | Register, login, logout, auth context, route guards, role-based redirect, 401/403 handling | `/api/admin/register`, `/login`, `/logout`, `/api/me` |
| **F2 Question bank** | Paginated list, create/edit form with dynamic options (single = 1 correct, multiple = 2+), delete with confirmation | `/api/admin/questions` |
| **F3 Quizzes** | Quiz CRUD, question picker with search and ordering | `/api/admin/quizzes`, `/quizzes/{id}/questions` |
| **F4 Links** | Select 1-10 of the quiz's questions, list links, copy URL, toggle active | `/api/admin/quizzes/{id}/links`, `/api/admin/links/{id}` |
| **F5 Guest quiz** | Name entry, one-at-a-time navigation, timer, submit, result breakdown | `/api/quiz/{token}` and its `start`, `submit`, `result` routes |
| **F6 Admin reports** | Quiz list, attempts table with search, sort, pagination | `/api/admin/quizzes`, `/quizzes/{id}/attempts` |
| **F7 Super admin** | Stats, admin list with filter/search/page size, detail view, approve/suspend | `/api/superadmin/*` |
| **F8 Hardening** | Error boundary, 404, loading/empty states, responsive pass, tests, deployment, documentation | n/a |

## 13. Open Items

- Pagination query-parameter names and response envelope are confirmed against the real backend responses in F0/F2, not assumed.
- The "no resume endpoint" limitation (section 9) stands unless the backend gains one.
- Token storage is revisited if authentication moves to cookies.
