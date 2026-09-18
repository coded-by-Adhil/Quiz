# Quiz App


## Stack

- **Backend:** Laravel (REST API only — no Blade/Inertia)
- **Frontend:** React (Vite), fully decoupled from the backend, communicating over HTTP
- **Database:** MySQL

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

## License

Personal/portfolio project — no license applied yet.
