# Phase 7 Super Admin Postman Checklist

Base URL: http://localhost:8000

All super-admin requests use:

```
Authorization: Bearer {{super_admin_token}}
Accept: application/json
Content-Type: application/json
```

## 1. Prepare accounts and variables

Create or use:

- One approved super_admin account.
- One approved admin account.
- One pending admin account.
- A second super_admin account for target-protection tests.

Save these values:

```
{{base_url}}
{{super_admin_token}}
{{regular_admin_token}}
{{approved_admin_id}}
{{pending_admin_id}}
{{super_admin_id}}
```

Create at least one non-deleted quiz and quiz link for the approved admin. Submit one guest attempt so the platform stats have known data. If you test deleted-resource counting, create a second quiz and link, delete the quiz through the existing admin endpoint, and confirm those resources are not counted.

## 2. Role protection

Use the approved regular admin token for each request:

```
GET {{base_url}}/api/superadmin/stats
GET {{base_url}}/api/superadmin/admins
GET {{base_url}}/api/superadmin/admins/{{approved_admin_id}}
PATCH {{base_url}}/api/superadmin/admins/{{approved_admin_id}}
```

Expected: `403` for every request.

Without a bearer token, the endpoints return `401`.

## 3. Platform statistics

GET {{base_url}}/api/superadmin/stats

Expected: `200`.

Expected response fields:

```json
{
  "total_admins": 2,
  "approved_admins": 1,
  "pending_admins": 1,
  "total_quizzes": 1,
  "total_quiz_links": 1,
  "total_submitted_attempts": 1
}
```

The exact values depend on your test data. Super-admin rows are never included. Soft-deleted quizzes, their links, and their resource counts are excluded.

## 4. List admins

GET {{base_url}}/api/superadmin/admins

Expected: `200`.

Verify the response has data, links, and meta, with meta.per_page equal to `20` by default. Only role=admin accounts appear; no super-admin email should be present.

## 5. Filter pending admins

GET {{base_url}}/api/superadmin/admins?status=pending

Expected: `200`.

Every item must have is_approved=false. Approved admins and super-admins must not appear.

## 6. Filter approved admins

GET {{base_url}}/api/superadmin/admins?status=approved

Expected: `200`.

Every item must have is_approved=true.

## 7. Search by partial email

GET {{base_url}}/api/superadmin/admins?search=approved

Expected: `200`.

Only matching name or email values should appear.

## 8. Pagination limit

GET {{base_url}}/api/superadmin/admins?per_page=100

Expected: `200`, with meta.per_page equal to `100`.

Then request:

GET {{base_url}}/api/superadmin/admins?per_page=101

Expected: `422`. Values above 100 are rejected.

## 9. Admin detail

GET {{base_url}}/api/superadmin/admins/{{approved_admin_id}}

Expected: `200`.

The data object contains name, email, is_approved, created_at, questions_count, quizzes_count, and quiz_links_count. Counts include only non-deleted questions, quizzes, and links belonging to non-deleted quizzes.

Password and token data must not appear.

## 10. Approve a pending admin

PATCH {{base_url}}/api/superadmin/admins/{{pending_admin_id}}

Body, raw JSON:

```json
{
  "is_approved": true
}
```

Expected: `200`, with is_approved=true.

Now log in using the approved admin's credentials:

POST {{base_url}}/api/admin/login

Expected: `200` with a token.

## 11. Suspend an approved admin and revoke their existing token

First log in as the approved admin and save the returned token as {{admin_before_suspend_token}}. Confirm it works:

GET {{base_url}}/api/me

Expected: `200`.

Using the super-admin token, suspend the admin:

PATCH {{base_url}}/api/superadmin/admins/{{approved_admin_id}}

Body, raw JSON:

```json
{
  "is_approved": false
}
```

Expected: `200`, with is_approved=false.

Reuse the old admin token immediately:

GET {{base_url}}/api/me

Expected: `401`. This proves existing Sanctum tokens were revoked, not merely blocked for future logins.

Try a new login with the same admin credentials:

POST {{base_url}}/api/admin/login

Expected: `403` with the pending-approval message.

## 12. Super-admin target protection

Use the second super-admin ID:

```
GET {{base_url}}/api/superadmin/admins/{{super_admin_id}}
PATCH {{base_url}}/api/superadmin/admins/{{super_admin_id}}
```

Expected: `404` for both requests. A super-admin must not be returned, approved, suspended, or detailed through these endpoints.

## 13. Validation and not-found checks

- PATCH without is_approved: `422`.
- PATCH with a non-boolean is_approved value: `422`.
- Unknown admin ID on detail: `404`.
- Unknown admin ID on PATCH: `404`.
- Invalid status filter: `422`.

## Final confirmation

Suspending an admin deletes all of that admin's active Sanctum tokens in the same request. Therefore, an already-issued token fails on its next authenticated request, and the admin also cannot log in again until a super-admin approves the account.
