# Quiz App

A full-stack quiz platform with role-based access control, a reusable question bank, and shareable quiz links for anonymous participants.

## Overview

Quiz App decouples quiz authoring from quiz taking. Admins build a reusable bank of questions, assemble quizzes from that bank, and generate shareable links scoped to a specific question set. Participants require no account — they access a quiz via link, submit a name, and receive their score immediately. Platform oversight (admin accounts, aggregate usage) is handled through a separate super admin role.

## Stack

- **Backend:** Laravel (REST API)
- **Frontend:** React (Vite), decoupled SPA client
- **Database:** MySQL
- **Auth:** Laravel Sanctum

## Architecture

The system is designed around three roles with distinct access boundaries — super admin, admin, and unauthenticated guest — with authorization enforced per-resource via Laravel Policies rather than route-level role checks alone. Full schema, API contract, and security design are documented in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

Key design decisions:
- Questions live in a reusable bank, decoupled from any single quiz (many-to-many via pivot tables)
- Each shareable link defines its own question subset, independent of the parent quiz's default set
- Scoring is always computed server-side; the client never transmits or influences a score
- Guest attempts are identified by non-sequential UUIDs to prevent enumeration

## Project structure

```
quiz-app/
├── backend/     Laravel API
├── frontend/    React (Vite) client
└── docs/
    └── ARCHITECTURE.md
```

## Getting started

### Prerequisites

- PHP 8.2+, Composer
- Node.js 18+, npm
- MySQL 8+

### Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
# configure DB_* in .env
php artisan migrate
php artisan serve
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Configure the API base URL in `frontend/.env` to match the backend's address.

## Roadmap

- [ ] Project scaffolding — API/DB connectivity verified via test and health-check endpoints
- [ ] Authentication (admin / super admin)
- [ ] Question bank CRUD
- [ ] Quiz management
- [ ] Shareable quiz links
- [ ] Guest quiz-taking flow
- [ ] Reporting dashboard (admin)
- [ ] Platform dashboard (super admin)
