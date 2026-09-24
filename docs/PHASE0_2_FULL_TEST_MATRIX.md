# Phase 0-2 API Verification Matrix

This checklist covers every currently implemented API endpoint.

Base URL:

```text
http://localhost:8000
```

Use these Postman environment variables:

```text
base_url       = http://localhost:8000
admin_a_token  = token for Admin A
admin_b_token  = token for Admin B
super_token    = token for the seeded super_admin
admin_a_id     = Admin A user id
admin_b_id     = Admin B user id
question_a_id  = question created by Admin A
question_b_id  = question created by Admin B
```

For JSON requests, use these headers:

```text
Content-Type: application/json
Accept: application/json
```

For protected requests, also use Postman's Authorization tab with type `Bearer Token`. Paste only the token value, not the word `Bearer`.

## A. Environment and database checks

### A1. Start the API

From CMD:

```cmd
cd /d C:\Users\Ameer\Documents\ChatGPT\Quiz\backend
php artisan config:clear
php artisan serve --host=localhost --port=8000
```

Keep this terminal open.

### A2. Check migrations

In another CMD window:

```cmd
cd /d C:\Users\Ameer\Documents\ChatGPT\Quiz\backend
php artisan migrate:status
```

Confirm these migrations show `Ran`:

```text
create_users_table
create_personal_access_tokens_table
create_questions_table
create_question_options_table
```

### A3. Liveness endpoint

```text
GET {{base_url}}/api/ping
```

Expected: `200 OK`

```json
{
  "status": "ok"
}
```

## B. Authentication tests

### B1. Register Admin A

```text
POST {{base_url}}/api/admin/register
```

```json
{
  "name": "Admin A",
  "email": "admin.a@example.com",
  "password": "AdminA123!",
  "password_confirmation": "AdminA123!"
}
```

Expected: `201 Created`.

The returned user must have `role: admin`. The account is pending approval.

### B2. Register Admin B

Use the same request with:

```json
{
  "name": "Admin B",
  "email": "admin.b@example.com",
  "password": "AdminB123!",
  "password_confirmation": "AdminB123!"
}
```

Expected: `201 Created`.

### B3. Verify request cannot set role or approval

Register a new email and include these extra fields:

```json
{
  "name": "Spoof Admin",
  "email": "spoof@example.com",
  "password": "SpoofAdmin123!",
  "password_confirmation": "SpoofAdmin123!",
  "role": "super_admin",
  "is_approved": true,
  "created_by": 999
}
```

Expected: `201 Created`.

The returned role must still be `admin`. Login for this account must return `403 account pending approval`, proving the extra fields were ignored.

### B4. Approve Admin A and B for development testing

There is intentionally no approval API in this phase. Use Tinker only in the local development database:

```cmd
php artisan tinker
```

```php
$a = App\Models\User::where('email', 'admin.a@example.com')->first();
$a->is_approved = true;
$a->save();
$b = App\Models\User::where('email', 'admin.b@example.com')->first();
$b->is_approved = true;
$b->save();
exit
```

### B5. Login as Admin A

```text
POST {{base_url}}/api/admin/login
```

```json
{
  "email": "admin.a@example.com",
  "password": "AdminA123!"
}
```

Expected: `200 OK` with a token. Save it as `admin_a_token` and save the returned user id as `admin_a_id`.

Repeat for Admin B and save `admin_b_token` and `admin_b_id`.

### B6. Login with a wrong password

Expected: `401 Unauthorized` and message `invalid credentials`.

### B7. Login with an unknown email

```json
{
  "email": "does-not-exist@example.com",
  "password": "AdminA123!"
}
```

Expected: `401 Unauthorized`.

### B8. Login while unapproved

Register another admin but do not approve it, then login.

Expected: `403 Forbidden` and message `account pending approval`.

### B9. Login validation failures

Run each of these bodies:

```json
{}
```

```json
{"email":"not-an-email","password":"AdminA123!"}
```

```json
{"email":"admin.a@example.com"}
```

Expected for each: `422 Unprocessable Content` with an `errors` object.

### B10. Read the authenticated profile

```text
GET {{base_url}}/api/me
```

Use `admin_a_token`.

Expected: `200 OK` with only `id`, `name`, `email`, and `role`.

Repeat without a token and with a random token. Expected: `401 Unauthorized` with JSON, not a redirect or `Route [login] not defined` error.

### B11. Super admin profile

Login using the seeded credentials from `backend\.env`, save the token as `super_token`, and call `/api/me`.

Expected: `200 OK` and `role: super_admin`.

### B12. Logout

```text
POST {{base_url}}/api/admin/logout
```

Use a fresh `admin_a_token`.

Expected: `200 OK`:

```json
{
  "message": "logged out"
}
```

Call `/api/me` again with that token. Expected: `401 Unauthorized`. This proves the token was revoked. Login again to obtain a new token for the remaining tests.

## C. Question authorization tests

### C1. Super admin is blocked

Use `super_token` for each question endpoint.

Expected for list and create: `403 Forbidden`.

### C2. Missing or invalid token is blocked

Call the question list endpoint without Authorization and with a random token.

Expected: `401 Unauthorized` JSON.

## D. Question creation validation tests

Use `admin_a_token` for all requests in this section.

### D1. Valid single-choice question

```text
POST {{base_url}}/api/admin/questions
```

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

Expected: `201 Created`. Save the returned id as `question_a_id`.

Confirm the returned `created_by` equals `admin_a_id`.

### D2. Valid multiple-choice question

```json
{
  "question_text": "Which are programming languages?",
  "type": "multiple",
  "marks": 2,
  "options": [
    {"option_text": "PHP", "is_correct": true},
    {"option_text": "Laravel", "is_correct": true},
    {"option_text": "HTML", "is_correct": false}
  ]
}
```

Expected: `201 Created`.

### D3. One option

Expected: `422`. The `options` error must report at least two entries are required.

### D4. Empty or missing options

Test `options: []`, omit `options`, and use `options: "not-an-array"`.

Expected: `422` for each.

### D5. Single question with zero correct options

Expected: `422` with `A single question must have exactly one correct option.`

### D6. Single question with two correct options

Expected: `422` with `A single question must have exactly one correct option.`

### D7. Multiple question with zero or one correct option

Expected: `422` with `A multiple question must have at least two correct options.`

### D8. Invalid type

Use `type: "true_false"`.

Expected: `422`.

### D9. Invalid marks

Test each value: `0`, `-1`, `1.5`, and `"not-a-number"`.

Expected: `422` for each.

### D10. Missing question fields

Test missing `question_text`, missing `type`, and missing `marks` separately.

Expected: `422` for each.

### D11. Invalid option fields

Test an option with missing `option_text`, missing `is_correct`, and `is_correct: "yes"`.

Expected: `422` for each.

### D12. Option text over database length

Send an option text longer than 255 characters.

Expected: `422`, not a database `500`, because the request validates the database limit.

## E. Question read and ownership tests

### E1. List own questions

```text
GET {{base_url}}/api/admin/questions
```

Use `admin_a_token`.

Expected: `200 OK`; only Admin A questions appear, and every item has its options.

### E2. View own question

```text
GET {{base_url}}/api/admin/questions/{{question_a_id}}
```

Expected: `200 OK` with its options.

### E3. Admin B cannot view Admin A question

Use `admin_b_token` with `question_a_id`.

Expected: `403 Forbidden`.

### E4. Admin B list isolation

Create a question using Admin B, then list as Admin A and Admin B.

Expected: each list contains only that admin's questions.

### E5. Nonexistent question

Request an ID that does not exist.

Expected: `404 Not Found`.

## F. Question update tests

### F1. Update own question and replace options

```text
PUT {{base_url}}/api/admin/questions/{{question_a_id}}
```

```json
{
  "question_text": "What is 2 + 2? Updated",
  "type": "multiple",
  "marks": 2,
  "options": [
    {"option_text": "3", "is_correct": false},
    {"option_text": "4", "is_correct": true},
    {"option_text": "Four", "is_correct": true}
  ]
}
```

Expected: `200 OK`. Confirm the old options were replaced and the new options are present.

### F2. Admin B cannot update Admin A question

Use Admin B's token and `question_a_id`.

Expected: `403 Forbidden`.

### F3. Invalid update does not change the question

Send an update with one option or an invalid correct-option count.

Expected: `422`. Fetch the question afterward and confirm its previous data is unchanged.

## G. Soft-delete tests

### G1. Admin B cannot delete Admin A question

Expected: `403 Forbidden`.

### G2. Delete own question

```text
DELETE {{base_url}}/api/admin/questions/{{question_a_id}}
```

Expected: `200 OK` with `question deleted`.

### G3. Deleted question disappears from list

Call the list endpoint using Admin A's token.

Expected: `200 OK`, and `question_a_id` is absent.

### G4. Deleted question cannot be viewed normally

```text
GET {{base_url}}/api/admin/questions/{{question_a_id}}
```

Expected: `404 Not Found` because normal Eloquent queries exclude soft-deleted records.

### G5. Confirm soft-delete in Tinker

```cmd
php artisan tinker
```

```php
$q = App\Models\Question::withTrashed()->find(QUESTION_ID);
$q->deleted_at;
exit
```

`deleted_at` should contain a timestamp. The row should still exist; it must not have been hard-deleted.

## H. Transaction and database integrity checks

Postman can verify that valid create/update requests complete atomically, but it cannot safely force an internal database exception by itself because all normal fields are validated first.

After a successful create, verify that one question has exactly the submitted options. After an update, verify that the old option rows are gone and the new set is complete.

For a true rollback test, use a PHPUnit integration test that forces the option insert to throw an exception, then assert that no question row was committed. This is safer and more repeatable than damaging the development schema through Postman.

## I. Final security checks

- Send `created_by` for another user: it must be ignored.
- Use a `super_admin` token: question endpoints must return `403`.
- Use no token: protected endpoints must return `401` JSON.
- Use an expired, revoked, or random token: protected endpoints must return `401` JSON.
- Try another admin's question ID: view, update, and delete must return `403`.
- Confirm no response contains a password or access token.
- Confirm guest or frontend code cannot set `role`, `is_approved`, or `created_by`.
