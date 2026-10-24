# Class Schedule Management System

A web-based system for managing university class schedules. It **generates the university timetable automatically with AI** (a constraint programming solver, plus a language-model assistant for constraints written in plain language), stores it centrally, **prevents teacher, room and group double-booking at the moment of editing**, and gives students, teachers and schedule administrators fast, role-based access to an always-current schedule.

> Bachelor diploma project — Software Engineering, group SE-2431.

## Problem

Class schedules are usually built by hand in spreadsheets. Conflicts (the same teacher, room or group booked twice) are discovered late, changes reach teachers and students through messengers at the last moment, teachers' wishes are often forgotten, and students get long gaps and uneven days. Our interviews with teachers and a student confirmed these problems; an interviewed teacher expects automatic generation to produce 80–90% of a correct timetable, with the rest corrected by hand — which is how the system is designed. See [Project proposal](docs/01-project-proposal.md) and [Evidence of relevance](docs/02-evidence-of-relevance.md).

## Target users

- **Students** — view their group's schedule on any device, search, export to a personal calendar.
- **Teachers** — view their personal schedule, find free rooms.
- **Schedule administrators** — enter the teaching load and constraints, generate the timetable automatically, review, edit and publish it with automatic conflict detection.
- **External systems** — read schedule data via a documented REST API.

## Expected outcomes

- Working web prototype (React frontend, FastAPI backend, PostgreSQL) started with one command via Docker Compose.
- Timetable generator (Google OR-Tools CP-SAT) for the whole university: zero hard-constraint violations, optimised soft constraints, compared with a greedy baseline.
- AI assistant (LLM) that turns constraints written in Kazakh, Russian or English into structured constraints confirmed by the administrator.
- Database-level guarantee of conflict-free schedules, including under concurrent edits.
- Documented REST API (OpenAPI / Swagger UI).
- Evaluation against the current spreadsheet-based process (time to find information, time to make a correct change, conflicts introduced, SUS score).

## Team

| Member | Role | Responsibilities |
|---|---|---|
| Zeyin Abdikassym | Backend Developer (Database and API) | Data model, PostgreSQL schema and constraints, FastAPI services, timetable generator (CP-SAT), LLM constraint assistant, RBAC, API specification, backend and performance tests |
| Nurzhaina Kuralbay | Frontend Developer (UI/UX) | User scenarios, UX prototype, React application (schedule views, admin editor, teaching load, AI assistant, generation and draft review), API integration, E2E and usability tests |

**Supervisor:** Toleu Altynbek

## Scope

**In scope:** reference data management (groups, teachers, rooms, courses, terms, time slots); teaching load and teacher availability; **automatic timetable generation for the whole university** (draft → review → publish, partial regeneration); **AI assistant for constraints in natural language**; manual schedule editing with conflict prevention and capacity/room-type checks; schedule views by group, teacher and room; search and filters; free-room lookup; authentication and role-based access; change history; iCalendar export; REST API; responsive web UI in Kazakh, Russian and English.

**Out of scope:** native mobile apps, exam timetabling and individual student sectioning, real SSO/LMS integration, attendance and grades.

## Current status

🟡 **Stage: Analysis and design (Pre-defense 1, 24 October 2026).**

| Deliverable | Status |
|---|---|
| Project proposal and scope | ✅ Draft |
| Evidence of relevance (interviews) | ✅ 3 interviews (2 teachers, 1 student); scheduler not reached yet |
| Literature review | ✅ Draft |
| Existing system comparison | ✅ Draft |
| Technology comparison | ✅ Draft |
| Requirements and acceptance criteria | ✅ v0.3 (generation and AI from supervisor feedback, updated after interviews) |
| Architecture diagrams | ✅ Draft |
| UX prototype | ✅ Working React prototype on a mock API + screenshots of 11 screens; Figma planned for M2 |
| Verification and evaluation plan | ✅ Draft |
| Project management and risks | ✅ Draft |
| Supervisor feedback | 🟡 First comment recorded and addressed |
| Implementation | 🟡 Frontend prototype (mock API, 43 tests); backend, CP-SAT generator and LLM assistant from M2 |

## Technologies

| Layer | Technology |
|---|---|
| Database | PostgreSQL 16 (range types, exclusion constraints) |
| Backend | Python 3.12, FastAPI, SQLAlchemy 2, Alembic, Pydantic v2 |
| API | REST, OpenAPI 3 |
| Auth | JWT, role-based access control |
| Timetable generation | Google OR-Tools CP-SAT (background worker) |
| AI assistant | LLM API with JSON-schema output (cloud or self-hosted) |
| Frontend | React 18, TypeScript, Vite, TanStack Query |
| Testing | pytest, Vitest, React Testing Library, Playwright, k6/Locust |
| DevOps | Docker, Docker Compose, GitHub Actions |
| Design | Figma, PlantUML |

Justification: [Technology comparison](docs/05-technology-comparison.md).

## Links

- **GitHub:** https://github.com/zeyin10/Class_Schedule_management_system
- **YouTrack:** https://zeyin.youtrack.cloud/projects/CSM
- **Prototype:** working React application in [`src/frontend`](src/frontend) (run it as shown below) and screens in [UX / prototype](docs/08-ux-prototype.md); Figma mockups are planned for milestone M2

## Documentation

| # | Document |
|---|---|
| 01 | [Project proposal](docs/01-project-proposal.md) |
| 02 | [Evidence of relevance](docs/02-evidence-of-relevance.md) |
| 03 | [Literature review](docs/03-literature-review.md) |
| 04 | [Existing system comparison](docs/04-existing-systems-comparison.md) |
| 05 | [Technology comparison](docs/05-technology-comparison.md) |
| 06 | [Requirements specification](docs/06-requirements-specification.md) |
| 07 | [Architecture and diagrams](docs/07-architecture.md) |
| 08 | [UX / prototype](docs/08-ux-prototype.md) |
| 09 | [Verification and evaluation plan](docs/09-verification-and-evaluation-plan.md) |
| 10 | [Project management and risks](docs/10-project-management-and-risks.md) |
| 11 | [Supervisor feedback](docs/11-supervisor-feedback.md) |

## Repository structure

```
├── docs/            # Proposal, reviews, comparisons, requirements, plans
├── diagrams/
│   ├── src/         # Editable PlantUML sources (.puml)
│   └── export/      # PNG / SVG exports
├── src/
│   ├── backend/     # FastAPI application (planned)
│   └── frontend/    # React prototype on a mock API (KZ/RU/EN)
├── tests/
│   ├── backend/     # (planned)
│   └── frontend/    # Test description; tests live next to the code in src/frontend
├── config/          # Configuration examples (no real secrets)
└── README.md
```

## Setup, run and test

### Frontend prototype (available now)

Requirements: Node.js 18 or newer (LTS).

```bash
cd src/frontend
npm install
npm run dev        # http://localhost:5173
npm test           # 43 unit and component tests (Vitest + React Testing Library)
npm run build      # type check + production build
```

Demo accounts (password `demo123`): `student@demo.kz`, `teacher@demo.kz`, `admin@demo.kz`. All data is synthetic.

The prototype runs on an in-browser **mock API** with the same REST contract as the planned backend. In the mock, timetable generation uses a simple greedy algorithm and the AI assistant is a keyword matcher; the real system will use the CP-SAT generator and an LLM on the backend (milestone M2). See [UX / prototype](docs/08-ux-prototype.md), section 4.

### Full system (planned, milestone M2)

```bash
cp config/.env.example .env
docker compose up --build
# Backend API docs: http://localhost:8000/docs
# Frontend:         http://localhost:5173
```

## Contribution workflow

Branches `CSM-<id>-<short-name>`, commits `CSM-<id>: <message>`, pull requests reviewed by the other team member before merging into `main`. Details: [Project management](docs/10-project-management-and-risks.md#3-workflow).
