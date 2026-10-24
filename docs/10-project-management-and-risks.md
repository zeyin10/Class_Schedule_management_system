# Project Management and Risks

## 1. Tools and links

| Tool | Purpose | Link |
|---|---|---|
| GitHub | Source code, documentation, diagrams, reviews (pull requests) | https://github.com/zeyin10/Class_Schedule_management_system |
| YouTrack | Task tracking, priorities, deadlines | https://zeyin.youtrack.cloud/projects/CSM |
| Figma | UI/UX prototype | _TODO: Figma URL_ |

## 2. Team and responsibilities

| Member | Role | Main responsibilities | Reviews PRs of |
|---|---|---|---|
| Zeyin Abdikassym | Backend Developer (Database and API) | Data model, PostgreSQL schema & constraints, FastAPI services, timetable generator (CP-SAT), LLM constraint assistant, RBAC, API spec, backend tests, generator benchmarks, performance tests, CI | Nurzhaina |
| Nurzhaina Kuralbay | Frontend Developer (UI/UX) | User scenarios, Figma prototype, React application (incl. teaching load, AI assistant chat, generation and draft review screens), API integration, E2E & usability tests, accessibility | Zeyin |
| Toleu Altynbek | Supervisor | Reviews key deliverables and decisions at agreed checkpoints | — |

Shared: proposal, requirements, use cases, evaluation plan, README, interviews.

## 3. Workflow

- `main` is the reviewed baseline; work is done in branches named `CSM-<id>-<short-name>`.
- Commit messages start with the task ID: `CSM-12: Add ER diagram draft`.
- Every change is merged through a pull request that references the YouTrack task, explains how it was checked, and is reviewed by the other team member.
- A YouTrack task is closed only when its acceptance criteria are met and the PR/commit link is added to the task.
- Each pre-defense submission is tagged: `pre-defense-1`, `pre-defense-2`, `final-pre-defense`.

## 4. Milestones

| # | Milestone | Target date | Main deliverables |
|---|---|---|---|
| M0 | Project start | 2026-10-14 | Topic, roles, justification letters |
| M1 | **Pre-defense 1** | **2026-10-24** | Proposal, relevance evidence, literature review, comparisons, requirements, diagrams, prototype, evaluation plan, YouTrack backlog (`pre-defense-1` tag) |
| M2 | Design freeze & skeleton | 2026-11-15 | DB schema with constraints + migrations, OpenAPI spec v1, React project skeleton, CI pipeline, Docker Compose; **CP-SAT spike**: model with hard constraints solved on a synthetic faculty; **LLM spike**: first 20 labelled sentences, model chosen |
| M3 | Core features | 2026-12-20 | Auth/RBAC, reference data and teaching load CRUD, schedule entries with conflict prevention, schedule views, search/filters; **generator v1** (hard constraints, one faculty, draft + publish), greedy baseline |
| M4 | **Pre-defense 2** | _TBD by university_ | Working core prototype with generation, test reports (`pre-defense-2` tag) |
| M5 | Extended features | _TBD_ | **Whole-university generation** (decomposition), soft constraints and weights, partial regeneration, infeasibility report; **AI assistant** (NL constraints, explanations); free rooms, history, recent changes, iCal export, import |
| M6 | Evaluation | _TBD_ | Generator benchmarks (vs. B-3, B-4), AI parser accuracy, performance tests, usability study, comparison with baseline |
| M7 | **Final pre-defense** | _TBD by university_ | Complete system, documentation, thesis text (`final-pre-defense` tag) |

## 5. Initial backlog for Pre-defense 1

YouTrack tasks (created in the [CSM project](https://zeyin.youtrack.cloud/projects/CSM) with the same IDs).

| ID | Task | Owner | Priority | Deadline | Acceptance criteria |
|---|---|---|---|---|---|
| CSM-1 | Create repository structure, README, .gitignore | Zeyin | Critical | 2026-10-19 | Structure per Git requirements; README contains all required sections |
| CSM-2 | Create YouTrack project and backlog; give access to supervisor | Nurzhaina | Critical | 2026-10-19 | Tasks have owner, priority, deadline, acceptance criteria |
| CSM-3 | Write project proposal and scope | Zeyin | Critical | 2026-10-20 | `docs/01-project-proposal.md` reviewed by partner |
| CSM-4 | Prepare interview guide and conduct 3–5 interviews | Both | Critical | 2026-10-22 | Notes for each interview; verified findings vs assumptions table |
| CSM-5 | Literature review (≥12 sources, ≥8 scientific) | Both | Critical | 2026-10-22 | Analysis table complete; all references verifiable |
| CSM-6 | Existing system comparison (3–5 systems, 6–10 criteria) | Nurzhaina | High | 2026-10-21 | Every claim has a source |
| CSM-7 | Technology comparison (≥3 decisions × 2–3 alternatives) | Zeyin | High | 2026-10-21 | Choices linked to requirements |
| CSM-8 | Requirements specification with priorities and acceptance criteria | Both | Critical | 2026-10-22 | Every Must requirement has a verifiable acceptance criterion |
| CSM-9 | System context and use case diagrams | Nurzhaina | High | 2026-10-22 | Editable sources + PNG exports in `diagrams/` |
| CSM-10 | Component diagram (draft) and architecture description | Zeyin | High | 2026-10-22 | Consistent with requirements and use cases |
| CSM-11 | ER diagram (draft) with conflict-prevention design | Zeyin | High | 2026-10-22 | Entities cover all reference data; constraint concept documented |
| CSM-12 | Figma prototype of key scenarios | Nurzhaina | Critical | 2026-10-23 | Mockups for student view, search, admin editor with conflict message |
| CSM-13 | Verification and evaluation plan | Zeyin | High | 2026-10-23 | Tests mapped to requirements; metrics, conditions, baseline defined |
| CSM-14 | Risk register and milestones | Nurzhaina | Medium | 2026-10-23 | This document complete |
| CSM-15 | Supervisor review of deliverables and response to comments | Both | Critical | 2026-10-23 | Comments and actions recorded in `docs/11-supervisor-feedback.md` |
| CSM-16 | Tag `pre-defense-1` and prepare submission summary | Both | Critical | 2026-10-24 | Tag created; summary of done work, limitations, outstanding tasks |
| CSM-17 | Frontend prototype with mock API | Nurzhaina | High | 2026-10-22 | Key screens for student, teacher and admin work on the mock API; conflict and room warnings shown; KZ/RU/EN; tests pass (PR #1) |
| CSM-18 | Update scope after supervisor feedback: automatic generation and AI | Zeyin | Critical | 2026-10-23 | Documents 01, 03–07, 09–11, README and diagrams consistent with generation and AI assistant; reviewed by partner |
| CSM-19 | Frontend: teaching load, AI assistant and generation screens (mock) | Nurzhaina | High | 2026-10-23 | Admin can enter a constraint in plain language and confirm it; generate a draft, see the quality report and AI explanation, publish it; infeasible input explained; KZ/RU/EN; tests pass (PR #4) |

## 6. Risk register

Probability (P) and impact (I): Low / Medium / High.

| ID | Risk | P | I | Mitigation | Owner |
|---|---|---|---|---|---|
| R-1 | Real schedule data is not available | M | M | Synthetic data generator based on the structure of the public schedule; document assumption A-1 | Zeyin |
| R-2 | Difficulty finding interview participants (especially schedulers) | M | H | Contact dean's office early via supervisor; accept teachers/curators as proxies; record limitations. **Occurred for pre-defense 1:** no scheduler interviewed; three teachers and a student were interviewed and the limitation is recorded in `02`, section 6 | Both |
| R-3 | Domain complexity underestimated (subgroups, odd/even weeks, joint lectures) | M | H | Clarify in interviews; model joint lectures via `schedule_entry_group`; keep edge cases in Should/Could | Zeyin |
| R-4 | Frontend–backend integration delays | M | M | Contract-first OpenAPI spec; mock server for frontend; weekly integration | Both |
| R-5 | Generator does not reach a feasible timetable for the whole university in time (NFR-12) | M | H | Spike at M2; pre-checks; decomposition by faculty (AD-9); time limit with best found solution; greedy baseline as fallback; report limits honestly | Zeyin |
| R-11 | Too many soft constraints and institution-specific "nuances" (scope creep) | H | M | Hard constraints first; soft constraints added one by one by MoSCoW priority; list agreed with supervisor and schedulers | Both |
| R-12 | LLM output is wrong or unavailable; cost; data privacy | M | M | Fixed JSON schema, validation, human confirmation (AD-8); forms as fallback (FR-33); minimal data sent (NFR-14); provider configurable; accuracy measured (M-14) | Zeyin |
| R-13 | No realistic teaching-load data for the university | M | H | Ask the dean's office via the supervisor; otherwise a synthetic load generated from public curricula; record as limitation | Both |
| R-6 | Unfamiliar technologies (FastAPI, React specifics) | M | M | Short spikes in first two weeks; follow official tutorials; pair sessions | Both |
| R-7 | Workload from other courses / exams | H | M | Buffer in milestones; tasks small enough for 1–3 days | Both |
| R-8 | One member unavailable for a period | L | H | Shared documentation, code review keeps both familiar with the codebase | Both |
| R-9 | Security flaws (broken access control) | M | H | RBAC tests for every endpoint; OWASP checklist; no secrets in repo | Zeyin |
| R-10 | Performance targets not met on large dataset | L | M | Indexing, query plans (`EXPLAIN ANALYZE`), caching of read endpoints | Zeyin |

## 7. Dependencies

| Dependency | Needed for | Status |
|---|---|---|
| Access to users for interviews (students, teachers, schedulers) | Evidence of relevance, usability study | Teachers and a student: done (4 interviews, `02`); scheduler: not reached, request via supervisor before M2 |
| Sample of the current university schedule | Data model validation, realistic test data, baseline B-4 | _TODO_ |
| Teaching load and teacher availability data (or rules to synthesise them) | Generator development and benchmarks | _TODO_ |
| LLM provider account / API key, or a machine for a self-hosted model | AI assistant (FR-31, FR-32) | Planned at M2 |
| Supervisor availability for checkpoint reviews | Supervisor feedback, milestone approval | First comment received 2026-09-30 (`11`); next review at pre-defense 1 |
| GitHub and YouTrack access for supervisor and committee | Pre-defense assessment | GitHub: public repository; YouTrack: access to be confirmed with the supervisor |
| OpenAPI spec (backend) → API integration (frontend) | Frontend development | Planned at M2 |
