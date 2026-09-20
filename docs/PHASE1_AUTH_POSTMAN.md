# Phase 1 Auth Postman Checklist

Base URL:

```text
http://localhost:8000
```

Use JSON bodies and set this header on request bodies:

```text
Content-Type: application/json
```

## 1. Duplicate email on register returns 422

Use the seeded super admin email so the email already exists.

```text
POST /api/admin/register
```

```json
{
  "name": "Duplicate Admin",
  "email": "superadmin@example.com",
  "password": "Password123!",
  "password_confirmation": "Password123!"
}
```

Expected status:

```text
422
```

## 2. Password mismatch on register returns 422

```text
POST /api/admin/register
```

```json
{
  "name": "Mismatch Admin",
  "email": "mismatch-admin@example.com",
  "password": "Password123!",
  "password_confirmation": "Different123!"
}
```

Expected status:

```text
422
```

## 3. Register an unapproved admin for the pending-login test

```text
POST /api/admin/register
```

```json
{
  "name": "Pending Admin",
  "email": "pending-admin@example.com",
  "password": "Password123!",
  "password_confirmation": "Password123!"
}
```

Expected status:

```text
201
```

## 4. Login with wrong password returns 401

```text
POST /api/admin/login
```

```json
{
  "email": "superadmin@example.com",
  "password": "WrongPassword123!"
}
```

Expected status:

```text
401
```

## 5. Login as an unapproved admin returns 403

```text
POST /api/admin/login
```

```json
{
  "email": "pending-admin@example.com",
  "password": "Password123!"
}
```

Expected status:

```text
403
```

Expected message:

```text
account pending approval
```

## 6. Login as seeded super admin returns 200 and a token

Use the email/password you set in `.env` before seeding.

```text
POST /api/admin/login
```

```json
{
  "email": "superadmin@example.com",
  "password": "ChangeMe123!"
}
```

Expected status:

```text
200
```

Save the returned `token` value.

## 7. GET /api/me with the token returns 200

```text
GET /api/me
```

Header:

```text
Authorization: Bearer paste_token_here
```

Expected status:

```text
200
```

Expected profile fields:

```text
id, name, email, role
```

## 8. Logout revokes the current token

```text
POST /api/admin/logout
```

Header:

```text
Authorization: Bearer paste_token_here
```

Expected status:

```text
200
```
