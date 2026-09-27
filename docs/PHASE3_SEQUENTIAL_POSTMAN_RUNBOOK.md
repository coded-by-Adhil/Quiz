# Phase 3 Quiz API - Sequential Postman Runbook

Run these requests in order. Phase 3 needs active questions owned by an approved `admin`.

## 0. Setup

From Command Prompt:

```cmd
cd C:\Users\Ameer\Documents\ChatGPT\Quiz\backend
php artisan migrate:status
php artisan serve
```

Base URL: `http://localhost:8000`

If MySQL connection is refused, start MySQL and rerun `php artisan migrate:status`. Do not run `migrate:fresh` on your working database.

Postman headers for protected requests:

```text
Accept: application/json
Content-Type: application/json
Authorization: Bearer {{admin_a_token}}
```

Create these Postman variables:

```text
base_url = http://localhost:8000
admin_a_token
admin_b_token
admin_a_id
admin_b_id
question_1_id
question_2_id
question_3_id
other_admin_question_id
quiz_id
other_admin_quiz_id
deleted_question_id
```

## 1. Login as two approved admins

Use real approved admin credentials. Registration creates `is_approved = false`; approve test accounts locally until the future approval API exists.

**POST** `{{base_url}}/api/admin/login`

```json
{
  "email": "admin-a@example.com",
  "password": "YourAdminAPassword"
}
```

Expected: **200**. Save `token` as `admin_a_token` and `user.id` as `admin_a_id`.

Repeat with admin B:

```json
{
  "email": "admin-b@example.com",
  "password": "YourAdminBPassword"
}
```

Expected: **200**. Save `token` as `admin_b_token` and `user.id` as `admin_b_id`. Use admin A's token from now on unless stated otherwise.

## 2. Prepare questions

If admin A already has three active questions, save their IDs and skip to Section 3. Otherwise create these with admin A's token.

### Question 1

**POST** `{{base_url}}/api/admin/questions`

```json
{
  "question_text": "Phase 3 question one: What is 2 + 2?",
  "type": "single",
  "marks": 1,
  "options": [
    {"option_text": "3", "is_correct": false},
    {"option_text": "4", "is_correct": true}
  ]
}
```

Expected: **201**. Save `id` as `question_1_id`.

### Question 2

**POST** `{{base_url}}/api/admin/questions`

```json
{
  "question_text": "Phase 3 question two: Which is a programming language?",
  "type": "single",
  "marks": 1,
  "options": [
    {"option_text": "PHP", "is_correct": true},
    {"option_text": "HTML", "is_correct": false}
  ]
}
```

Expected: **201**. Save `id` as `question_2_id`.

### Question 3

**POST** `{{base_url}}/api/admin/questions`

```json
{
  "question_text": "Phase 3 question three: Which number is even?",
  "type": "single",
  "marks": 2,
  "options": [
    {"option_text": "7", "is_correct": false},
    {"option_text": "8", "is_correct": true}
  ]
}
```

Expected: **201**. Save `id` as `question_3_id`.

### Question owned by admin B

Switch to `Bearer {{admin_b_token}}` and send the same question endpoint:

```json
{
  "question_text": "Admin B private question",
  "type": "single",
  "marks": 1,
  "options": [
    {"option_text": "Wrong", "is_correct": false},
    {"option_text": "Right", "is_correct": true}
  ]
}
```

Expected: **201**. Save `id` as `other_admin_question_id`, then switch back to admin A's token.

## 3. Create and read a quiz

### 3.1 Create quiz

**POST** `{{base_url}}/api/admin/quizzes`

```json
{
  "title": "Phase 3 Sequential Test Quiz",
  "description": "Quiz used to test the complete Phase 3 flow",
  "duration_minutes": 30
}
```

Expected: **201**. Save `id` as `quiz_id`. Verify `owner_id` equals `admin_a_id` and `questions` is empty.

### 3.2 List quizzes

**GET** `{{base_url}}/api/admin/quizzes`

Expected: **200**. Admin A's quiz appears. Admin B's quizzes do not appear.

### 3.3 View quiz before questions

**GET** `{{base_url}}/api/admin/quizzes/{{quiz_id}}`

Expected: **200** with the quiz fields and an empty `questions` array.

## 4. Update the quiz

**PUT** `{{base_url}}/api/admin/quizzes/{{quiz_id}}`

```json
{
  "title": "Phase 3 Updated Test Quiz",
  "description": "Updated description",
  "duration_minutes": 45
}
```

Expected: **200**. Verify title, description, and duration changed; `owner_id` remains admin A; questions remain empty.

For PUT requests, send all three editable fields so the final state is unambiguous.

## 5. Attach questions and verify order

### 5.1 Attach three questions

**POST** `{{base_url}}/api/admin/quizzes/{{quiz_id}}/questions`

```json
{
  "question_ids": [{{question_2_id}}, {{question_1_id}}, {{question_3_id}}]
}
```

Expected: **200**. Verify response order is question 2, question 1, question 3. Their pivot order values are zero-based: `0`, `1`, `2`. Each question includes its options.

### 5.2 Read after attachment

**GET** `{{base_url}}/api/admin/quizzes/{{quiz_id}}`

Expected: **200** with the same three questions in the same order.

### 5.3 List after attachment

**GET** `{{base_url}}/api/admin/quizzes`

Expected: **200** with the quiz and its attached questions.

## 6. Verify replacement and clearing

### 6.1 Replace the whole question set

**POST** `{{base_url}}/api/admin/quizzes/{{quiz_id}}/questions`

```json
{"question_ids": [{{question_1_id}}]}
```

Expected: **200**. Only question 1 remains; questions 2 and 3 are detached.

### 6.2 Clear all questions

**POST** `{{base_url}}/api/admin/quizzes/{{quiz_id}}/questions`

```json
{"question_ids": []}
```

Expected: **200** with an empty `questions` array.

### 6.3 Reattach one question for negative tests

```json
{"question_ids": [{{question_1_id}}]}
```

Expected: **200**.

## 7. Test invalid question assignments

Run each against `POST {{base_url}}/api/admin/quizzes/{{quiz_id}}/questions`.

### 7.1 Another admin's question

```json
{"question_ids": [{{question_1_id}}, {{other_admin_question_id}}]}
```

Expected: **422**. Question 1 remains attached and admin B's question is not attached. No partial change is allowed.

### 7.2 Duplicate question ID

```json
{"question_ids": [{{question_1_id}}, {{question_1_id}}]}
```

Expected: **422**.

### 7.3 Nonexistent question ID

```json
{"question_ids": [999999]}
```

Expected: **422**.

### 7.4 Missing question_ids

```json
{}
```

Expected: **422**. The field is required, but an empty array is valid.

### 7.5 Soft-deleted question

If you create and soft-delete a disposable question through Phase 2, send its ID:

```json
{"question_ids": [{{deleted_question_id}}]}
```

Expected: **422**.

## 8. Test quiz ownership

Switch to admin B's token and create a second quiz:

**POST** `{{base_url}}/api/admin/quizzes`

```json
{
  "title": "Admin B Private Quiz",
  "description": "Ownership test quiz",
  "duration_minutes": 10
}
```

Expected: **201**. Save `id` as `other_admin_quiz_id`, then switch back to admin A's token.

Using admin A's token, run all four requests:

```text
GET    {{base_url}}/api/admin/quizzes/{{other_admin_quiz_id}}
PUT    {{base_url}}/api/admin/quizzes/{{other_admin_quiz_id}}
DELETE {{base_url}}/api/admin/quizzes/{{other_admin_quiz_id}}
POST   {{base_url}}/api/admin/quizzes/{{other_admin_quiz_id}}/questions
```

For PUT use:

```json
{
  "title": "Unauthorized update",
  "description": "Must not be saved",
  "duration_minutes": 10
}
```

For POST use:

```json
{"question_ids": [{{question_1_id}}]}
```

Expected for all four: **403**. Verify with admin B that the quiz was not changed.

## 9. Test authentication and role boundaries

Run every Phase 3 endpoint once without Authorization. Expected: **401**.

Run any Phase 3 endpoint with `Bearer invalid-token`. Expected: **401**.

Run list, create, view, update, delete, and question sync using the seeded `super_admin` token. Expected: **403**. The super admin is authenticated but does not manage quizzes in this phase.

Send `PATCH {{base_url}}/api/admin/quizzes/{{quiz_id}}`. Expected: **405**.

Use a nonexistent quiz ID in GET, PUT, DELETE, and question sync. Expected: **404**.

## 10. Test owner_id injection

Create a temporary quiz with:

**POST** `{{base_url}}/api/admin/quizzes`

```json
{
  "owner_id": 999999,
  "title": "Owner Injection Test",
  "description": "Owner must come from the token",
  "duration_minutes": 5
}
```

Expected: **201**. The returned and stored `owner_id` must equal `admin_a_id`, never `999999`.

Update that quiz while sending `owner_id` equal to admin B's ID. Expected: **200**, but the owner must remain admin A.

## 11. Delete the main quiz last

### 11.1 Soft-delete

**DELETE** `{{base_url}}/api/admin/quizzes/{{quiz_id}}`

Expected: **200**.

```json
{"message": "quiz deleted"}
```

### 11.2 Confirm it disappeared from list

**GET** `{{base_url}}/api/admin/quizzes`

Expected: **200**, but `quiz_id` is absent.

### 11.3 Confirm direct access is gone

**GET** `{{base_url}}/api/admin/quizzes/{{quiz_id}}`

Expected: **404**.

### 11.4 Repeat delete

**DELETE** `{{base_url}}/api/admin/quizzes/{{quiz_id}}`

Expected: **404**.

## 12. Phase 3 pass criteria

- Create returns 201 and assigns the authenticated admin as owner.
- List returns only that admin's active quizzes.
- View returns questions and options in pivot order.
- Update changes title, description, and duration without changing owner or questions.
- Sync replaces the question set and uses zero-based order.
- Empty `question_ids` clears the set.
- Invalid, duplicate, deleted, or foreign question IDs return 422 with no partial changes.
- Other-admin quizzes return 403 for every protected action.
- Unauthenticated requests return 401; super-admin requests return 403.
- Delete is soft delete: list excludes the quiz and direct GET returns 404.
