# Phase 6 Admin Reporting Postman Checklist

Base URL: http://localhost:8000

All reporting requests require:

```
Authorization: Bearer {{admin_token}}
Accept: application/json
```

The reporting endpoints are:

```
GET /api/admin/quizzes
GET /api/admin/quizzes/{quiz_id}/attempts
```

## 1. Prepare test data

Use two approved admin accounts:

- Admin A: the account used in the requests below.
- Admin B: a separate account used to verify ownership protection.

Using the existing Phase 3, Phase 4, and Phase 5 requests, create:

- At least 16 quizzes owned by Admin A, with titles such as Alpha quiz 01 through Alpha quiz 16.
- One quiz owned by Admin B.
- One Admin A quiz with an active quiz link and at least two submitted attempts.
- One in-progress attempt on the same link. Start it, but do not submit it.
- One submitted attempt with persisted answer rows, so the response can be checked for answer-data leakage.

Save these Postman variables:

```
{{base_url}}
{{admin_token}}
{{admin_a_quiz_id}}
{{admin_b_quiz_id}}
{{active_link_id}}
{{submitted_attempt_id}}
{{in_progress_attempt_id}}
```

## 2. List Admin A quizzes

GET {{base_url}}/api/admin/quizzes

Expected: 200.

Verify:

- The response has data, links, and meta.
- meta.per_page is 15.
- Only Admin A's quizzes appear.
- Admin B's quiz does not appear.
- The default order is alphabetical by title.
- Soft-deleted quizzes do not appear in this list.

## 3. Search quizzes by partial title

GET {{base_url}}/api/admin/quizzes?search=Alpha

Expected: 200.

Every returned quiz title should contain Alpha, and the result must still contain only Admin A's quizzes.

## 4. Sort quizzes by creation time

GET {{base_url}}/api/admin/quizzes?sort=created_at&direction=desc

Expected: 200.

The newest Admin A quiz should appear first.

Invalid values such as sort=owner_id must return 422.

## 5. View submitted attempts for an owned quiz

GET {{base_url}}/api/admin/quizzes/{{admin_a_quiz_id}}/attempts

Expected: 200.

Each item in data contains only:

```
participant_name
score
total_marks
submitted_at
quiz_link_id
```

Confirm that the submitted participant and score are correct, and that the originating quiz_link_id is present.

The response must not contain any of these keys anywhere:

```
answers
selected_options
question
questions
options
is_correct
breakdown
```

This endpoint returns aggregate report data only. It never returns selected answers, option IDs, option text, or per-question correctness.

## 6. Search attempts by participant name

GET {{base_url}}/api/admin/quizzes/{{admin_a_quiz_id}}/attempts?search=Alice

Expected: 200.

Only submitted attempts whose participant_name contains Alice should appear.

## 7. Sort attempts by score descending

GET {{base_url}}/api/admin/quizzes/{{admin_a_quiz_id}}/attempts?sort=score&direction=desc

Expected: 200.

The highest score must be first. Use direction=asc to verify the reverse order.

The default order is alphabetical by participant_name:

GET {{base_url}}/api/admin/quizzes/{{admin_a_quiz_id}}/attempts

## 8. Confirm in-progress attempts are excluded

Start an attempt through the Phase 5 endpoint and do not submit it. Then request:

GET {{base_url}}/api/admin/quizzes/{{admin_a_quiz_id}}/attempts

Expected: 200, but the in-progress participant must not appear in data.

Only attempts with a non-null submitted_at are included.

## 9. Block another admin's quiz

Log in as Admin A and request Admin B's quiz:

GET {{base_url}}/api/admin/quizzes/{{admin_b_quiz_id}}/attempts

Expected: 403.

The response must not reveal Admin B's attempt records.

## 10. Preserve historical reporting after soft deletion

Using an Admin A quiz with a submitted attempt, call the existing admin delete endpoint:

DELETE {{base_url}}/api/admin/quizzes/{{admin_a_quiz_id}}

Then request its report:

GET {{base_url}}/api/admin/quizzes/{{admin_a_quiz_id}}/attempts

Expected: 200, with the previously submitted attempt still available. This verifies that reporting can read history for an owned soft-deleted quiz.

The regular quiz list should no longer contain that deleted quiz.

## 11. Authentication and validation checks

- Missing or invalid bearer token on either reporting endpoint: 401.
- sort=owner_id on the quiz list: 422.
- sort=answers on the attempts endpoint: 422.
- Unknown quiz ID: 404.

## Final security confirmation

The attempts endpoint response contains participant and score aggregates only. It does not expose quiz_attempt_answers, quiz_attempt_answer_options, selected options, answer text, option text, or per-question correctness.
