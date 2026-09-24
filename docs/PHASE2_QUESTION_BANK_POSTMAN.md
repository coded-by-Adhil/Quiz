# Phase 2 Question Bank Postman Checklist

Base URL:

```text
http://localhost:8000
```

All requests use these headers:

```text
Content-Type: application/json
Accept: application/json
Authorization: Bearer YOUR_ADMIN_TOKEN
```

Do not send `created_by`. The API always derives it from the authenticated admin.

## Test setup

The seeded `super_admin` cannot use the question bank. Register an admin through Phase 1, then approve that admin manually during development because the approval endpoint belongs to a later phase.

From the `backend` directory:

```cmd
php artisan tinker
```

Inside Tinker, replace the email with the admin you registered:

```php
$admin = App\Models\User::where('email', 'your-admin-email@example.com')->first();
$admin->is_approved = true;
$admin->save();
exit
```

Log in as that admin and save the returned token.

## 1. Create a valid single-choice question

```text
POST /api/admin/questions
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

Expected status: `201 Created`.

Save the returned question `id` as `QUESTION_ID`.

## 2. Create with one option

```text
POST /api/admin/questions
```

```json
{
  "question_text": "Invalid question",
  "type": "single",
  "marks": 1,
  "options": [
    {"option_text": "Only option", "is_correct": true}
  ]
}
```

Expected status: `422 Unprocessable Content`.

## 3. Single-choice question with two correct options

```json
{
  "question_text": "Invalid single-choice question",
  "type": "single",
  "marks": 1,
  "options": [
    {"option_text": "Answer A", "is_correct": true},
    {"option_text": "Answer B", "is_correct": true}
  ]
}
```

Expected status: `422 Unprocessable Content`.

Expected validation message:

```text
A single question must have exactly one correct option.
```

## 4. Multiple-choice question with one correct option

```json
{
  "question_text": "Invalid multiple-choice question",
  "type": "multiple",
  "marks": 2,
  "options": [
    {"option_text": "Answer A", "is_correct": true},
    {"option_text": "Answer B", "is_correct": false}
  ]
}
```

Expected status: `422 Unprocessable Content`.

Expected validation message:

```text
A multiple question must have at least two correct options.
```

## 5. List your questions

```text
GET /api/admin/questions
```

Expected status: `200 OK`.

The response contains only questions where `created_by` equals the authenticated admin. Soft-deleted questions are excluded.

## 6. View your question

```text
GET /api/admin/questions/QUESTION_ID
```

Expected status: `200 OK` with the question and its options.

## 7. View another admin's question

Create and approve a second admin, create a question using the second admin's token, then request that question using the first admin's token:

```text
GET /api/admin/questions/OTHER_ADMIN_QUESTION_ID
```

Expected status: `403 Forbidden`.

This phase uses `403` because the requirement prioritizes a clear ownership/authorization response. The tradeoff is that it confirms the question exists; a future security-hardening decision could use `404` to avoid that existence disclosure.

## 8. Update your question and replace its options

```text
PUT /api/admin/questions/QUESTION_ID
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

Expected status: `200 OK`.

The old options are replaced inside the same database transaction as the question update.

## 9. Soft-delete your question

```text
DELETE /api/admin/questions/QUESTION_ID
```

Expected status: `200 OK`.

Expected response:

```json
{
  "message": "question deleted"
}
```

## 10. Confirm the soft-deleted question is hidden

```text
GET /api/admin/questions
```

Expected status: `200 OK`.

Confirm `QUESTION_ID` is not in the response. A direct request for the deleted question should also return `404 Not Found` because normal Eloquent queries exclude soft-deleted records.

## Additional boundary tests

### 11. Missing authentication

Remove the `Authorization` header and call any question endpoint:

```text
GET /api/admin/questions
```

Expected status: `401 Unauthorized`.

### 12. Super admin access

Use a valid `super_admin` token:

```text
GET /api/admin/questions
POST /api/admin/questions
```

Expected status for both: `403 Forbidden`.

### 13. Missing or invalid basic fields

```text
POST /api/admin/questions
```

```json
{
  "question_text": "",
  "type": "unsupported",
  "marks": 0,
  "options": [
    {"option_text": "A", "is_correct": true},
    {"option_text": "B", "is_correct": false}
  ]
}
```

Expected status: `422 Unprocessable Content`.

The response should contain validation errors for `question_text`, `type`, and `marks`.

### 14. Invalid option structure

Test each body separately:

```json
{
  "question_text": "Invalid options",
  "type": "single",
  "marks": 1,
  "options": "not-an-array"
}
```

```json
{
  "question_text": "Invalid option fields",
  "type": "single",
  "marks": 1,
  "options": [
    {"option_text": "A"},
    {"option_text": "B", "is_correct": false}
  ]
}
```

Expected status for each: `422 Unprocessable Content`.

### 15. Attempt to change ownership

Add this field to a valid create or update body:

```json
"created_by": 999999
```

Expected result: the request may succeed, but the stored `created_by` must still be the authenticated admin's ID. The API must never use this request field.

Also add this field inside an option:

```json
"question_id": 999999
```

The option must still be stored under the route question's ID.

### 16. Non-owner update and delete

Using admin A's token, target a question created by admin B:

```text
PUT /api/admin/questions/OTHER_ADMIN_QUESTION_ID
DELETE /api/admin/questions/OTHER_ADMIN_QUESTION_ID
```

Expected status for both: `403 Forbidden`.

### 17. Repeated deletion

Delete an owned question successfully, then repeat the same request:

```text
DELETE /api/admin/questions/QUESTION_ID
```

Expected status for the first request: `200 OK`.

Expected status for the repeated request: `404 Not Found`.

### 18. Unsupported update method

The question API defines `PUT` for updates. Send a `PATCH` request instead:

```text
PATCH /api/admin/questions/QUESTION_ID
```

Expected status: `405 Method Not Allowed`.

### 19. Transaction rollback verification

A database write failure cannot be forced safely through normal Postman data. It is covered by the automated tests in `tests/Feature/QuestionBankTest.php`:

- failed option creation leaves no question row;
- failed option replacement restores the original question and options.
