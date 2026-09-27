# Postman Test Plan: Phases 0-3

This document covers every currently registered API. Phase 4 link APIs are not implemented yet.

## Before testing

From the `backend` directory, confirm MySQL is running, then run:

```cmd
php artisan migrate:status
php artisan serve
```

The application currently uses the `.env` MySQL settings. If `migrate:status` reports `SQLSTATE[HY000] [2002]`, MySQL is not listening on the configured host/port; start the MySQL service or XAMPP, then rerun the command. Do not use `migrate:fresh` against a database containing your work.

Base URL:

```text
http://localhost:8000
```

Protected requests use:

```text
Accept: application/json
Content-Type: application/json
Authorization: Bearer {{token}}
```

Suggested Postman variables:

```text
base_url = http://localhost:8000
token = approved admin token
super_token = seeded super_admin token
admin_id = approved admin ID
question_1_id = own question ID
question_2_id = another own question ID
question_3_id = another own question ID
other_admin_question_id = another admin's question ID
quiz_id = own quiz ID
other_admin_quiz_id = another admin's quiz ID
```

## Test data setup

### Seed the super admin

Set your real credentials in `.env` first, then run once if needed:

```cmd
php artisan db:seed
```

Use the `SEED_SUPER_ADMIN_EMAIL` and `SEED_SUPER_ADMIN_PASSWORD` values from `.env` for the super admin login test.

### Create approved admin accounts

Register one or two admins through the API. Registration intentionally creates unapproved accounts. Until the future approval endpoint exists, approve them locally:

```cmd
php artisan tinker
```

```php
$admin = App\Models\User::where('email', 'admin@example.com')->first();
$admin->is_approved = true;
$admin->save();
exit
```

Repeat with a different email for the second admin. Use separate Postman tokens when testing ownership boundaries.

## Phase 0: connectivity

### P0-1 Ping

**GET** `{{base_url}}/api/ping`

No authentication is required.

Expected: **200**

```json
{
  "status": "ok"
}
```

### P0-2 CORS preflight

In Postman, send:

**OPTIONS** `{{base_url}}/api/ping`

Header:

```text
Origin: http://localhost:5173
Access-Control-Request-Method: GET
```

Expected: a successful preflight response with an `Access-Control-Allow-Origin` header matching the configured `FRONTEND_URL`. This confirms the React development origin is allowed.

## Phase 1: authentication

### A1 Register an admin

**POST** `{{base_url}}/api/admin/register`

```json
{
  "name": "Quiz Admin",
  "email": "admin@example.com",
  "password": "StrongPassword123!",
  "password_confirmation": "StrongPassword123!"
}
```

Expected: **201**. The response contains a profile but no password or token. Confirm the database row has `role = admin` and `is_approved = 0`.

Add `role: "super_admin"` and `is_approved: true` to a separate registration request. The request may still succeed, but the database must still contain `role = admin` and `is_approved = 0`.

### A2 Duplicate email

Repeat A1 using the same email.

Expected: **422**, with a validation error for `email`. No second user row is created.

### A3 Password mismatch

**POST** `{{base_url}}/api/admin/register`

```json
{
  "name": "Mismatch Admin",
  "email": "mismatch@example.com",
  "password": "StrongPassword123!",
  "password_confirmation": "DifferentPassword123!"
}
```

Expected: **422**, with a validation error for `password`.

### A4 Invalid registration fields

Use an empty name, invalid email, missing password, short password, and missing confirmation in separate requests.

Expected: **422** for each invalid request.

### A5 Login with wrong password

**POST** `{{base_url}}/api/admin/login`

```json
{
  "email": "approved-admin@example.com",
  "password": "WrongPassword123!"
}
```

Expected: **401** with `invalid credentials`.

### A6 Login before approval

Use a registered account that still has `is_approved = 0`.

**POST** `{{base_url}}/api/admin/login`

```json
{
  "email": "pending@example.com",
  "password": "StrongPassword123!"
}
```

Expected: **403** with `account pending approval`.

### A7 Approved admin login

**POST** `{{base_url}}/api/admin/login`

```json
{
  "email": "approved-admin@example.com",
  "password": "StrongPassword123!"
}
```

Expected: **200**. Save `token` from the response as a Postman variable.

### A8 Seeded super admin login

Use the seeded credentials from `.env`.

Expected: **200** and a token. Save it as `super_token`.

### A9 Current profile

**GET** `{{base_url}}/api/me`

Expected with `token`: **200**, containing only the authenticated user's `id`, `name`, `email`, and `role` profile fields.

Expected without a token or with `Bearer invalid-token`: **401**.

### A10 Logout and token reuse

**POST** `{{base_url}}/api/admin/logout`

Expected with `token`: **200** and `logged out`.

Immediately reuse the same token for `GET /api/me` and `POST /api/admin/logout`.

Expected for both reused-token requests: **401**.

## Phase 2: question bank

Only an approved `admin` token may pass these requests. The `super_admin` token must receive **403**.

### Q1 Create a valid single-choice question

**POST** `{{base_url}}/api/admin/questions`

```json
{
  "question_text": "What is 2 + 2?",
  "type": "single",
  "marks": 1,
  "options": [
    {"option_text": "3", "is_correct": false},
    {"option_text": "4", "is_correct": true}
  ]
}
```

Expected: **201**. Save the returned ID as `question_1_id`.

### Q2 Create a valid multiple-choice question

**POST** `{{base_url}}/api/admin/questions`

```json
{
  "question_text": "Which are programming languages?",
  "type": "multiple",
  "marks": 2,
  "options": [
    {"option_text": "PHP", "is_correct": true},
    {"option_text": "JavaScript", "is_correct": true},
    {"option_text": "HTML", "is_correct": false}
  ]
}
```

Expected: **201**. Save the returned ID as `question_2_id`. Create one more valid question as `question_3_id` for ordering tests.

### Q3 Question validation failures

Each request below must return **422** and create no question:

1. Only one option.
2. A `single` question with two correct options.
3. A `multiple` question with only one correct option.
4. Missing `question_text`, unsupported `type`, or `marks = 0`.
5. `options` not an array.
6. Missing `option_text` or `is_correct`.

### Q4 List own questions

**GET** `{{base_url}}/api/admin/questions`

Expected: **200**, containing only the authenticated admin's active questions.

### Q5 View own question

**GET** `{{base_url}}/api/admin/questions/{{question_1_id}}`

Expected: **200**, including `options`.

### Q6 Ownership protection

With admin A's token, request a question created by admin B:

**GET** `{{base_url}}/api/admin/questions/{{other_admin_question_id}}`

Expected: **403**. Repeat with PUT and DELETE; both must also return **403**, and the other admin's row must remain unchanged.

### Q7 Update own question

**PUT** `{{base_url}}/api/admin/questions/{{question_1_id}}`

```json
{
  "question_text": "Updated question",
  "type": "multiple",
  "marks": 3,
  "options": [
    {"option_text": "Updated A", "is_correct": true},
    {"option_text": "Updated B", "is_correct": true},
    {"option_text": "Updated C", "is_correct": false}
  ]
}
```

Expected: **200**. Old options are replaced atomically.

### Q8 Ownership injection attempt

Add `"created_by": 999999` to a valid create/update body. The request may succeed, but the stored question must still belong to the authenticated admin. Add `"question_id": 999999` inside an option; it must not override the relationship's question ID.

### Q9 Soft delete

**DELETE** `{{base_url}}/api/admin/questions/{{question_1_id}}`

Expected: **200** with `question deleted`.

Then list questions and request the deleted ID.

Expected: list **200** without the question; direct GET **404**; repeated DELETE **404**.

### Q10 Authentication and method boundaries

- No token on any question endpoint: **401**.
- Invalid token: **401**.
- Super admin token: **403**.
- `PATCH /api/admin/questions/{id}`: **405**.
- Nonexistent question ID: **404**.

## Phase 3: quiz management

Only an approved `admin` token may pass these requests. Quiz creation never accepts or trusts `owner_id` from JSON.

### Z1 Create a quiz

**POST** `{{base_url}}/api/admin/quizzes`

```json
{
  "title": "General Knowledge Quiz",
  "description": "A short practice quiz",
  "duration_minutes": 20
}
```

Expected: **201**. Save `id` as `quiz_id`; `owner_id` must equal the token's admin ID and `questions` must be empty.

### Z2 Nullable duration

```json
{
  "title": "Untimed Quiz",
  "description": "A quiz without a duration",
  "duration_minutes": null
}
```

Expected: **201**. The description is required during creation, while `duration_minutes` may be `null`.

### Z3 Required create fields

Create with no title:

```json
{
  "description": "Description without a title",
  "duration_minutes": 20
}
```

Expected: **422** with a validation error for `title`.

Create with no description:

```json
{
  "title": "Title without a description",
  "duration_minutes": 20
}
```

Expected: **422** with a validation error for `description`.

Create with both fields present: **201**.

Duration `0`, negative duration, non-integer duration, or non-string description also return **422**.

### Z4 List and view own quizzes

**GET** `{{base_url}}/api/admin/quizzes`

Expected: **200**, own active quizzes only.

**GET** `{{base_url}}/api/admin/quizzes/{{quiz_id}}`

Expected: **200**, including attached questions and each question's options.

### Z5 Update own quiz details

**PUT** `{{base_url}}/api/admin/quizzes/{{quiz_id}}`

```json
{
  "title": "Updated General Knowledge Quiz",
  "description": "Updated description",
  "duration_minutes": 30
}
```

Expected: **200**. Question assignments remain unchanged.

### Z6 Sync own questions and verify order

**POST** `{{base_url}}/api/admin/quizzes/{{quiz_id}}/questions`

```json
{
  "question_ids": [{{question_2_id}}, {{question_1_id}}, {{question_3_id}}]
}
```

Expected: **200**. Response order and database pivot order must be `question_2 = 0`, `question_1 = 1`, `question_3 = 2`.

### Z7 Verify replacement and clearing

Send the same endpoint with:

```json
{"question_ids": [{{question_1_id}}]}
```

Expected: **200**, only question 1 remains.

Then send:

```json
{"question_ids": []}
```

Expected: **200**, with an empty `questions` array. This confirms sync/replace behavior and that an empty array is valid.

### Z8 Reject invalid question assignments

Expected **422** and no change to existing assignments for each:

```json
{"question_ids": [{{question_1_id}}, {{other_admin_question_id}}]}
```

```json
{"question_ids": [{{question_1_id}}, {{question_1_id}}]}
```

```json
{"question_ids": [999999]}
```

If a question was soft-deleted, its ID must also return **422**. A mixed valid/invalid request must not partially attach the valid question.

### Z9 Quiz ownership protection

Using admin A's token against admin B's quiz:

- `GET /api/admin/quizzes/{{other_admin_quiz_id}}`: **403**
- `PUT /api/admin/quizzes/{{other_admin_quiz_id}}`: **403**
- `DELETE /api/admin/quizzes/{{other_admin_quiz_id}}`: **403**
- `POST /api/admin/quizzes/{{other_admin_quiz_id}}/questions`: **403** when the question payload itself is valid

### Z10 Soft delete quiz

**DELETE** `{{base_url}}/api/admin/quizzes/{{quiz_id}}`

Expected: **200** with `quiz deleted`.

Then list and view it.

Expected: list **200** without the quiz; direct GET **404**; repeated DELETE **404**. The pivot rows remain available in the database because the quiz is soft-deleted.

### Z11 Quiz authentication and method boundaries

- No token on any quiz endpoint: **401**.
- Invalid token: **401**.
- Super admin token: **403**.
- `PATCH /api/admin/quizzes/{id}`: **405**.
- Nonexistent quiz ID: **404**.
- Missing `question_ids` on sync: **422**.

## Final pass criteria

- Every expected status code above matches.
- No response exposes a password, token hash, or `is_correct` outside the authenticated admin question/quiz APIs.
- Admin A cannot read or modify admin B's questions or quizzes.
- `owner_id` and `created_by` cannot be controlled by request JSON.
- Duplicate emails, duplicate quiz questions, invalid question ownership, and invalid payloads return validation errors.
- Soft-deleted resources disappear from normal lists and return 404 by ID.
- Logout invalidates the token on a fresh request.
- `php artisan test` passes with zero failures.
