# Frontend — Class Schedule Management System

React 18 + TypeScript + Vite, TanStack Query, React Router, i18next (KZ / RU / EN).

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # Vitest + React Testing Library
npm run build    # type check + production build
```

By default the app uses an in-browser **mock API** (`src/api/mockClient.ts`) with synthetic data.
To use the real backend, copy `.env.example` to `.env.local` and set `VITE_USE_MOCK=false`.

Demo accounts (mock only, password `demo123`): `student@demo.kz`, `teacher@demo.kz`, `admin@demo.kz`.

## Structure

```
src/
├── api/          # types (API contract), mock client, HTTP client, React Query hooks
├── auth/         # session storage, AuthProvider, role guard
├── components/   # Layout, ScheduleGrid, EntryForm, WeekSelect
├── i18n/         # kk.json, ru.json, en.json
├── lib/          # conflict rules, week parity, next lesson, lookups (pure, unit-tested)
├── pages/        # Login, Schedule, My schedule, Free rooms, Admin editor
└── test/         # test setup and render helper
```

## Pages

| Route | Role | Requirements |
|---|---|---|
| `/schedule` | everyone | FR-10, FR-11 |
| `/login` | everyone | FR-01 |
| `/my` | student, teacher | FR-12 |
| `/rooms/free` | teacher, admin | FR-13 |
| `/admin` | admin | FR-07, FR-08, FR-09 |
| `/admin/load` | admin | FR-23, FR-24, FR-31 (AI assistant) |
| `/admin/generate` | admin | FR-25 – FR-28, FR-30, FR-32 |

In the mock, generation uses a greedy algorithm (`src/lib/generator.ts`) and the AI assistant is a keyword matcher (`src/api/mockAssistant.ts`); the real backend uses CP-SAT and an LLM with the same API.
