# Phase 3 Quiz Management - Postman Tests

## Setup

Start Laravel from the backend directory:

```cmd
php artisan serve
```

Use these Postman variables:

```text
base_url = http://localhost:8000
token = token returned by POST /api/admin/login
quiz_id = id returned by POST /api/admin/quizzes
question_1_id = an existing question owned by the logged-in admin
question_2_id = another existing question owned by the logged-in admin
question_3_id = another existing question owned by the logged-in admin
other_admin_question_id = a question owned by a different admin
other_admin_quiz_id = a quiz owned by a different admin
```

For every protected request, add these headers:

```text
Accept: application/json
Content-Type: application/json
Authorization: Bearer {{token}}
```

Before the quiz tests, create at least two questions using the Phase 2 question endpoint. The question IDs used in the requests below must belong to the authenticated admin unless the test explicitly says it is testing another admin's question.

## 1. Login and obtain a token

**POST** `{{base_url}}/api/admin/login`

Body:

```json
{
  "email": "approved-admin@example.com",
  "password": "your-password"
}
```

Expected: **200**. Copy the returned token into the `token` variable.

## 2. Create a quiz

**POST** `{{base_url}}/api/admin/quizzes`

Body:

```json
{
  "title": "General Knowledge Quiz",
  "description": "A short practice quiz",
  "duration_minutes": 20
}
```

Expected: **201**. Save the returned `id` as `quiz_id`. The response should contain `owner_id` equal to the logged-in admin ID and an empty `questions` array. Do not send `owner_id`; the API derives it from the token.

## 3. Create an untimed quiz

**POST** `{{base_url}}/api/admin/quizzes`

Body:

```json
{
  "title": "Untimed Quiz",
  "description": null,
  "duration_minutes": null
}
```

Expected: **201**. Both nullable fields should be `null` in the response.

## 4. List your quizzes

**GET** `{{base_url}}/api/admin/quizzes`

Expected: **200**. Only quizzes owned by the logged-in admin appear. Soft-deleted quizzes and another admin's quizzes do not appear.

## 5. View one quiz

**GET** `{{base_url}}/api/admin/quizzes/{{quiz_id}}`

Expected: **200**. The response includes the quiz and its `questions` array. Each question includes its options.

## 6. Update quiz details

**PUT** `{{base_url}}/api/admin/quizzes/{{quiz_id}}`

Body:

```json
{
  "title": "Updated General Knowledge Quiz",
  "description": "Updated description",
  "duration_minutes": 30
}
```

Expected: **200**. The title, description, and duration change. The owner does not change, and the question set is not changed by this endpoint.

## 7. Attach and order questions

**POST** `{{base_url}}/api/admin/quizzes/{{quiz_id}}/questions`

Body:

```json
{
  "question_ids": [
    {{question_2_id}},
    {{question_1_id}},
    {{question_3_id}}
  ]
}
```

Expected: **200**. The response order must be question 2, question 1, question 3. The stored pivot order values are zero-based: 0, 1, 2.

This endpoint replaces the complete question set; it does not append to the existing set.

## 8. Replace the question set

**POST** `{{base_url}}/api/admin/quizzes/{{quiz_id}}/questions`

Body:

```json
{
  "question_ids": [{{question_1_id}}]
}
```

Expected: **200**. Only question 1 remains attached. The other previously attached questions are removed from this quiz.

## 9. Clear all questions

**POST** `{{base_url}}/api/admin/quizzes/{{quiz_id}}/questions`

Body:

```json
{
  "question_ids": []
}
```

Expected: **200**. The response contains an empty `questions` array, and the quiz has no rows in `quiz_questions`.

## 10. Reject another admin's question

First attach one valid own question so there is an existing assignment. Then send:

**POST** `{{base_url}}/api/admin/quizzes/{{quiz_id}}/questions`

Body:

```json
{
  "question_ids": [{{question_1_id}}, {{other_admin_question_id}}]
}
```

Expected: **422** with a validation error on `question_ids`. The existing question assignment must remain unchanged and the other admin's question must not be attached.

## 11. Invalid question ID cases

Use **POST** `{{base_url}}/api/admin/quizzes/{{quiz_id}}/questions` for each body below.

Duplicate ID:

```json
{
  "question_ids": [{{question_1_id}}, {{question_1_id}}]
}
```

Expected: **422**.

Nonexistent ID:

```json
{
  "question_ids": [999999]
}
```

Expected: **422**.

Missing field:

```json
{}
```

Expected: **422**. An empty array is valid, but the `question_ids` field itself must be present.

## 12. Ownership protection

Use a quiz owned by another admin.

**GET** `{{base_url}}/api/admin/quizzes/{{other_admin_quiz_id}}`

Expected: **403**.

**PUT** `{{base_url}}/api/admin/quizzes/{{other_admin_quiz_id}}`

Body:

```json
{
  "title": "Should be blocked"
}
```

Expected: **403**.

**DELETE** `{{base_url}}/api/admin/quizzes/{{other_admin_quiz_id}}`

Expected: **403**. Confirm the other admin's quiz was not changed.

## 13. Soft-delete a quiz

**DELETE** `{{base_url}}/api/admin/quizzes/{{quiz_id}}`

Expected: **200** with:

```json
{
  "message": "quiz deleted"
}
```

Then run:

**GET** `{{base_url}}/api/admin/quizzes`

Expected: **200**, and the deleted quiz is absent.

Finally run:

**GET** `{{base_url}}/api/admin/quizzes/{{quiz_id}}`

Expected: **404**. The quiz row is soft-deleted, not hard-deleted.

## 14. Authentication and role checks

| Request | Expected |
|---|---:|
| Any quiz endpoint without `Authorization` | 401 |
| Any quiz endpoint with an invalid/expired token | 401 |
| `GET /api/admin/quizzes` using a `super_admin` token | 403 |
| `POST /api/admin/quizzes` using a `super_admin` token | 403 |

## Expected response meanings

| Status | Meaning |
|---:|---|
| 200 | Authenticated admin request succeeded |
| 201 | Quiz was created |
| 401 | No valid Sanctum token was supplied |
| 403 | The authenticated account is not an admin or does not own the quiz |
| 404 | The quiz or question does not exist, or the quiz was soft-deleted |
| 422 | Request validation failed; no question sync is performed |
