# Quiz App

A full-stack quiz platform built as an architecture-first learning project — designed the schema and API contract before writing code, then implemented phase by phase with AI-assisted pair programming.

## Stack

- **Backend:** Laravel (REST API only — no Blade/Inertia)
- **Frontend:** React (Vite), fully decoupled from the backend, communicating over HTTP
- **Database:** MySQL

## Why this project

This repo doubles as a personal learning project in software architecture and AI-assisted development. Every phase started with a design/planning pass (see [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)) before any code was written, and the commit history reflects that: docs and scaffolding first, features layered in afterward.

## Roles

- **Super Admin** — observes platform-wide stats (admin/quiz/attempt counts); not involved in day-to-day content creation.
- **Admin** — self-registers, builds a reusable question bank, creates quizzes from that bank, and generates shareable quiz links.
- **Guest** — no account. Opens a shared link, enters a name, takes the quiz, and sees their score immediately.

Full role responsibilities, auth flow, and authorization rules are documented in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Project structure

```
quiz-app/
├── backend/     Laravel API
├── frontend/    React (Vite) client
└── docs/
    └── ARCHITECTURE.md
```

## Getting started

### Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
# set your DB_* values in .env, then:
php artisan migrate
php artisan serve
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend expects the backend API to be reachable at the URL configured in `frontend/.env` (see `.env.example`).

## Build progress

- [x] **Phase 0** — Project skeleton: Laravel API + React app scaffolded, MySQL connected, cross-app connectivity verified via a test endpoint and a DB health-check endpoint.
- [ ] **Phase 1** — Auth (admin / super_admin registration & login)
- [ ] **Phase 2** — Question bank CRUD
- [ ] **Phase 3** — Quiz management (build quizzes from the question bank)
- [ ] **Phase 4** — Shareable quiz links
- [ ] **Phase 5** — Public guest quiz-taking flow
- [ ] **Phase 6** — Admin reporting (scores per quiz)
- [ ] **Phase 7** — Super admin dashboard

## License

Personal/portfolio project — no license applied yet.
