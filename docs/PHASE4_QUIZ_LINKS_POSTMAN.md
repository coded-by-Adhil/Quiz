# Phase 4 Quiz Links - Postman Checklist

This phase contains only authenticated admin link management. Do not test a public guest URL yet; that belongs to the next phase.

## Setup

From Command Prompt:

```cmd
cd C:\Users\Ameer\Documents\ChatGPT\Quiz\backend
php artisan migrate:status
php artisan serve
```

Base URL:

```text
http://localhost:8000
```

Protected request headers:

```text
Accept: application/json
Content-Type: application/json
Authorization: Bearer {{admin_token}}
```

Create these Postman variables:

```text
base_url = http://localhost:8000
admin_token
other_admin_token
quiz_id
empty_quiz_id
link_id
other_admin_link_id
question_1_id
question_2_id
question_3_id
unattached_question_id
other_admin_question_id
question_1_to_question_11_ids
```

Use approved accounts. The Phase 1 approval endpoint does not exist yet, so locally approve test admins before login.

## 1. Prepare a quiz and questions

Use the Phase 2 and Phase 3 APIs first:

1. Login as admin A with `POST /api/admin/login`; save the token as `admin_token`.
2. Create at least three questions owned by admin A; save their IDs as `question_1_id`, `question_2_id`, and `question_3_id`.
3. Create a quiz with `POST /api/admin/quizzes`.
4. Attach the three questions with `POST /api/admin/quizzes/{id}/questions`.
5. Save the quiz ID as `quiz_id`.

The quiz must already have at least one question before a link can be created.

Example quiz creation body:

```json
{
  "title": "Phase 4 Link Test Quiz",
  "description": "Quiz used to test admin link management",
  "duration_minutes": 30
}
```

Example Phase 3 question attachment:

```json
{
  "question_ids": [{{question_1_id}}, {{question_2_id}}, {{question_3_id}}]
}
```

## 2. Create a valid link

**POST** `{{base_url}}/api/admin/quizzes/{{quiz_id}}/links`

```json
{
  "question_ids": [{{question_2_id}}, {{question_1_id}}]
}
```

Expected: **201**.

Verify:

- `quiz_id` equals `{{quiz_id}}`.
- `is_active` is `true`.
- `token` is present and is 40 characters long.
- The returned question order is question 2, then question 1.
- The token is not supplied by the request body.

Save the returned link `id` as `link_id`.

## 3. List links for the quiz

**GET** `{{base_url}}/api/admin/quizzes/{{quiz_id}}/links`

Expected: **200**.

Verify the response contains `link_id`, the generated token, `is_active: true`, and the selected question subset. Only links belonging to admin A's quiz may appear.

## 4. Create a second link with a different subset

**POST** `{{base_url}}/api/admin/quizzes/{{quiz_id}}/links`

```json
{
  "question_ids": [{{question_3_id}}]
}
```

Expected: **201**.

Verify the second link has a different token and a different question subset. This confirms one quiz can have multiple links.

## 5. Toggle a link inactive

**PATCH** `{{base_url}}/api/admin/links/{{link_id}}`

```json
{
  "is_active": false
}
```

Expected: **200**.

Verify the response and database state contain `is_active: false`.

Run the list request again:

**GET** `{{base_url}}/api/admin/quizzes/{{quiz_id}}/links`

Expected: **200**, with the same link showing `is_active: false`.

Toggle it back on:

```json
{
  "is_active": true
}
```

Expected: **200** and `is_active: true`.

## 6. Validate the 1-10 question limit

### 6.1 Empty subset

**POST** `{{base_url}}/api/admin/quizzes/{{quiz_id}}/links`

```json
{
  "question_ids": []
}
```

Expected: **422**. No link is created.

### 6.2 Eleven-question subset

Prepare eleven questions that are all owned by admin A and all attached to `quiz_id` through Phase 3. Send:

```json
{
  "question_ids": [
    {{question_1_id}},
    {{question_2_id}},
    {{question_3_id}},
    {{question_4_id}},
    {{question_5_id}},
    {{question_6_id}},
    {{question_7_id}},
    {{question_8_id}},
    {{question_9_id}},
    {{question_10_id}},
    {{question_11_id}}
  ]
}
```

Expected: **422**. No link or pivot rows are created.

## 7. Reject a quiz with no attached questions

Create a second quiz with the Phase 3 endpoint, but do not attach any questions. Save its ID as `empty_quiz_id`.

**POST** `{{base_url}}/api/admin/quizzes/{{empty_quiz_id}}/links`

```json
{
  "question_ids": [{{question_1_id}}]
}
```

Expected: **422** with a clear validation message that the quiz needs an attached question. Confirm no link was created for `empty_quiz_id`.

## 8. Reject an owned question not attached to this quiz

Create `unattached_question_id` owned by admin A, but do not attach it to `quiz_id`.

**POST** `{{base_url}}/api/admin/quizzes/{{quiz_id}}/links`

```json
{
  "question_ids": [{{question_1_id}}, {{unattached_question_id}}]
}
```

Expected: **422**. Confirm no link was created and no link pivot rows were written.

## 9. Reject another admin's question

Login as admin B, create a question, and save its ID as `other_admin_question_id`. Return to admin A's token.

**POST** `{{base_url}}/api/admin/quizzes/{{quiz_id}}/links`

```json
{
  "question_ids": [{{question_1_id}}, {{other_admin_question_id}}]
}
```

Expected: **422**. Confirm no link was created and the valid question was not partially attached to a new link.

## 10. Reject malformed question arrays

Run each request against the create-link endpoint.

Missing field:

```json
{}
```

Expected: **422**.

Non-array value:

```json
{
  "question_ids": "not-an-array"
}
```

Expected: **422**.

Duplicate question IDs:

```json
{
  "question_ids": [{{question_1_id}}, {{question_1_id}}]
}
```

Expected: **422**.

Non-integer ID:

```json
{
  "question_ids": ["not-an-integer"]
}
```

Expected: **422**.

## 11. Verify server-controlled fields

Send a valid create request with forged fields:

```json
{
  "quiz_id": 999999,
  "token": "forged-token",
  "is_active": false,
  "question_ids": [{{question_1_id}}]
}
```

Expected: **201**. Verify the link uses the route quiz ID, has a server-generated token, and starts active. `quiz_id`, `token`, and initial active state must not be controlled by request JSON.

For PATCH, send `quiz_id` and `token` alongside `is_active`. Expected: **200**, but only `is_active` changes.

## 12. Ownership and role checks

Create a link owned by admin B and save its ID as `other_admin_link_id`. Use admin A's token for these requests:

**GET** `{{base_url}}/api/admin/quizzes/{{other_admin_quiz_id}}/links`

Expected: **403**.

**PATCH** `{{base_url}}/api/admin/links/{{other_admin_link_id}}`

```json
{
  "is_active": false
}
```

Expected: **403**. Confirm admin B's link remains active.

Use a `super_admin` token on link list and toggle requests.

Expected: **403**.

Remove the Authorization header from create, list, and PATCH requests.

Expected: **401**.

Use `Authorization: Bearer invalid-token`.

Expected: **401**.

## 13. Endpoint and response checklist

| Request | Expected |
|---|---:|
| `POST /api/admin/quizzes/{id}/links` valid 1-10 subset | 201 |
| `GET /api/admin/quizzes/{id}/links` owned quiz | 200 |
| `PATCH /api/admin/links/{id}` with boolean `is_active` | 200 |
| Empty subset | 422 |
| Eleven-question subset | 422 |
| Quiz with no attached questions | 422 |
| Owned but unattached question | 422 |
| Another admin's question | 422 |
| Another admin's link list/toggle | 403 |
| Super-admin link list/toggle | 403 |
| Missing or invalid token | 401 |

The public route `GET /api/quiz/{token}` is intentionally not present in this phase.
