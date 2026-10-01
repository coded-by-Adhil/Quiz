# Phase 5 Guest Quiz Postman Checklist

Base URL: `http://localhost:8000`

Guest endpoints do not use an `Authorization` header. Keep the `token` and `attemptId` values from earlier responses.

## 1. Prepare test data

Use the existing admin APIs to create one quiz with these questions, then attach all three questions to the quiz and create an active quiz link through the Phase 4 API:

| Question | Type | Marks | Correct options |
|---|---|---:|---|
| Single-choice question | `single` | 1 | exactly one |
| Multiple-choice question | `multiple` | 2 | exactly two |
| Unanswered test question | `single` | 3 | exactly one |

Save these values as Postman variables:

```text
{{token}}
{{single_question_id}}
{{single_correct_option_id}}
{{multiple_question_id}}
{{multiple_correct_option_a}}
{{multiple_correct_option_b}}
{{unanswered_question_id}}
```

The expected total for this quiz is `6` marks.

## 2. Read quiz metadata

**GET** `{{base_url}}/api/quiz/{{token}}`

Expected: `200`.

The response contains `title`, `description`, and `duration_minutes`. It must not contain questions, options, or `is_correct`.

## 3. Start an attempt

**POST** `{{base_url}}/api/quiz/{{token}}/start`

Body, raw JSON:

```json
{
  "participant_name": "Test Participant"
}
```

Expected: `201`. Save the returned UUID as `{{attempt_id}}`. The response includes the linked questions in order and their options, but no `is_correct` values.

Also verify that an empty or missing `participant_name` returns `422`.

## 4. Submit a fully scored attempt

**POST** `{{base_url}}/api/quiz/{{token}}/attempts/{{attempt_id}}/submit`

Body, raw JSON:

```json
{
  "answers": [
    {
      "question_id": {{single_question_id}},
      "option_ids": [{{single_correct_option_id}}]
    },
    {
      "question_id": {{multiple_question_id}},
      "option_ids": [{{multiple_correct_option_a}}, {{multiple_correct_option_b}}]
    }
  ]
}
```

The third question is intentionally omitted. Expected: `200`, with `score: 3` and `total_marks: 6`. The server calculates the score from stored correct answers; client-supplied score or correctness fields must not affect it.

## 5. Read the result

**GET** `{{base_url}}/api/quiz/{{token}}/attempts/{{attempt_id}}/result`

Expected: `200`.

Verify the breakdown shows:

- The first question is correct and awards 1 mark.
- The second question is correct and awards 2 marks.
- The omitted third question is incorrect and awards 0 marks.
- Selected and correct option details are present only in this submitted-result response.

## 6. Reject duplicate submission

Send the same submit request again with the same `{{attempt_id}}`.

Expected: `422`. No additional answer rows should be created.

## 7. Start another attempt

Repeat the start request with a different participant name.

Expected: `201` with a new UUID. This confirms separate attempts are supported.

## 8. Verify scoring rules

Create fresh attempts and submit these bodies:

```json
{
  "answers": [
    {
      "question_id": {{multiple_question_id}},
      "option_ids": [{{multiple_correct_option_a}}]
    }
  ]
}
```

Expected: `200`, but the multiple-choice question awards 0 because its complete correct set was not selected.

For a single-choice question, submit two option IDs. Expected: `422`.

Submit an option ID belonging to a different question, or a question ID not attached to the link. Expected: `422`.

## 9. Enforce the time limit

Create a short-duration quiz link using the admin quiz-link API, or use a link configured with a one-minute duration. Start an attempt, wait until the limit passes, and submit it.

Expected: `422` with a clear time-limit message. The attempt must not receive a score or persisted answer selections.

## 10. Inactive link

Use the admin link update endpoint to make the link inactive, then call:

**GET** `{{base_url}}/api/quiz/{{token}}`

Expected: `403` with `This quiz link is no longer available.` The start endpoint must return the same status for that token.

Restore the link to active before continuing with other tests.

## 11. Not-found and privacy checks

- Unknown token on metadata: `404`.
- Unknown token on start: `404`.
- Wrong attempt UUID for a valid token: `404`.
- Result requested before submission: `404`.
- Result requested with an attempt from another quiz link: `404`.

## 12. Rate-limit check

Send the start request 10 times within one minute from the same client. The first 10 should be accepted if the request data is valid. The next request should return `429`.

Repeat the same check for submit requests. The endpoint is configured with the same limit.

## Security checklist

- No guest endpoint requires Sanctum authentication.
- Start responses never reveal `is_correct`.
- Scores are calculated from database values, never from request data.
- Attempt UUIDs are used in URLs.
- Attempts and results are scoped to the quiz-link token.
- Inactive links are blocked before quiz data is returned.

The guest-result breakdown rule should also be added to `docs/ARCHITECTURE.md` so the architecture document remains aligned with the implementation.
