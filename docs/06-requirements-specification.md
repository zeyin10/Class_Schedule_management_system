# Requirements Specification

**Version:** 0.4 (scope from supervisor feedback, checked against four user interviews)
**Prioritisation:** MoSCoW — **M**ust, **S**hould, **C**ould, **W**on't (this release).
**Traceability:** each requirement has an ID used in YouTrack tasks, tests and diagrams.

> Version 0.4 takes into account four interviews with three teachers and one student (`02-evidence-of-relevance.md`). No scheduler has been interviewed yet, so requirements for the administrator's work are still partly based on assumptions (`02`, section 6). Every change is recorded in the version history at the end of this document.

## 1. Actors

| Actor | Description |
|---|---|
| Guest | Unauthenticated visitor (may view the public schedule if enabled). |
| Student | Views the schedule of their group, searches, exports. |
| Teacher | Views personal schedule and room availability. |
| Administrator | Manages reference data and the teaching load, runs timetable generation, reviews, edits and publishes the timetable. |
| External system | Consumes the read-only API / iCal feed. |

## 2. Functional requirements

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| FR-01 | The system shall authenticate users by login and password. | M | Given valid credentials, the user receives an access token and sees the page for their role; invalid credentials return HTTP 401 and an error message; passwords are stored only as hashes (bcrypt/argon2). |
| FR-02 | The system shall restrict operations by role (student, teacher, admin). | M | A student or teacher calling any create/update/delete endpoint receives HTTP 403; an admin can perform them; verified by automated tests for every protected endpoint. |
| FR-03 | Admin shall manage groups (create, edit, delete, list). | M | CRUD operations work via API and UI; a group with scheduled lessons cannot be deleted without confirmation (HTTP 409 with explanation). |
| FR-04 | Admin shall manage teachers. | M | Same as FR-03 for teachers. |
| FR-05 | Admin shall manage rooms with capacity and type (lecture hall, computer lab, classroom). | M | Rooms have name, building, capacity and type; validation rejects capacity ≤ 0. |
| FR-06 | Admin shall manage courses, lesson types and time slots for an academic term. | M | A term has start/end dates; time slots do not overlap within a day; courses can be linked to groups and teachers. |
| FR-07 | Admin shall create, edit and delete schedule entries (course, lesson type, teacher, group(s), room, day, time slot, week pattern). | M | A valid entry is saved and immediately visible in group, teacher and room views. |
| FR-08 | The system shall prevent conflicts: the same teacher, room or group cannot be booked in overlapping time. | M | An attempt to save a conflicting entry is rejected (HTTP 409) with a description of the conflicting entry; the rule holds when two admins save conflicting entries concurrently (verified by a concurrency test); 0 conflicts in the database after the full test suite. |
| FR-09 | The system shall warn when room capacity is smaller than the group size or the room type does not match the lesson type. | S | The entry can be saved only after explicit confirmation; the warning is shown in the UI. |
| FR-10 | Users shall view the schedule by group, teacher or room in day and week mode. | M | Selecting a group/teacher/room shows its lessons for the chosen week; switching week updates the view. |
| FR-11 | Users shall search and filter the schedule (by group, teacher, room, course, day). | M | Search returns matching results; filters can be combined; results appear within NFR-01 limits. |
| FR-12 | A logged-in student/teacher shall see "My schedule" by default and the next upcoming lesson. | S | After login, the personal schedule for the current week is shown with the next lesson highlighted. |
| FR-13 | Users shall see free rooms for a selected time slot. | S | The list contains only rooms without bookings in that slot; can be filtered by type and minimum capacity. |
| FR-14 | The system shall provide a documented REST API. | M | An OpenAPI 3 specification is generated and available via Swagger UI; every endpoint has request/response schemas. |
| FR-15 | The system shall keep a change history of schedule entries (who, when, what). | S | Every create/update/delete produces an audit record; admin can view history of an entry. |
| FR-16 | Users shall export their schedule to iCalendar (.ics). | S | The exported file imports correctly into Google Calendar and Outlook with correct times and time zone (Asia/Almaty). |
| FR-17 | Affected users shall see recent changes to their schedule. | M | Lessons changed in the last 7 days are marked in the user's view; a "Recent changes" list is available. |
| FR-18 | Admin shall import reference data and schedule entries from CSV/Excel. | C | A file in the documented template is imported; invalid rows are reported with line numbers; conflicting rows are not imported. |
| FR-19 | The system shall suggest free (teacher, room, slot) combinations for a lesson being scheduled manually. | S | For a selected lesson, the system lists conflict-free options ordered by soft-constraint penalty; choosing one fills the form. |
| FR-20 | The system shall send e-mail notifications on schedule changes. | S | Affected users receive an e-mail within 5 minutes of the change. Source: interview P4 (`02`). |
| FR-21 | Exam timetabling and individual student sectioning. | W | — (out of scope) |
| FR-22 | Native mobile applications. | W | — (out of scope; replaced by responsive UI) |

### 2.1 Automatic timetable generation

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| FR-23 | Admin shall enter the teaching load for a term: course, lesson type, teacher, group(s), number of lessons per week, week pattern (every / odd / even), required room type. | M | Load items can be created, edited, imported (FR-18) and listed per group and per teacher; validation rejects unknown teachers/groups and a non-positive number of lessons. |
| FR-24 | Admin shall enter teacher unavailability (hard) and teacher preferences (soft) by weekday and time slot. | M | Unavailable slots are never used by the generator (checked by T-GEN-02); preferences appear in the soft-constraint report. |
| FR-25 | The system shall generate a timetable for the whole university for a term, or for a selected faculty or set of groups, that satisfies all hard constraints: no teacher, room or group overlap (with odd/even weeks); room capacity ≥ total size of the groups; room type matches lesson type; teacher unavailability; locked lessons unchanged; every load item scheduled exactly as many times as required. | M | On the reference dataset (NFR-12) the generated timetable has **0 hard-constraint violations**, confirmed by the independent Conflict Checker and by inserting it into PostgreSQL with the EXCLUDE constraints active. |
| FR-26 | The generator shall optimise soft constraints with weights the admin can change: gaps (windows) in group timetables, teacher preferences, maximum lessons per day for a group, balanced load across the week, avoiding the last time slot, **difficult courses in early slots** and **at most N difficult courses per group and day** (courses have a difficulty mark set by the admin). | S | A quality report lists each soft-constraint penalty; on the reference dataset the weighted penalty is lower than that of the greedy baseline B-3 (`09`, M-11). |
| FR-27 | The generator shall run as a background job with progress and a time limit; the result shall be saved as a **draft** timetable, separate from the published one. | M | Starting generation returns a job ID immediately; status is `queued / running / done / infeasible / failed`; the published timetable stays visible and unchanged while a draft is generated. |
| FR-28 | Admin shall review the draft (views by group, teacher, room, quality report), edit it manually with the usual conflict checks (FR-07 – FR-09) and **publish** it. | M | After publication the draft becomes the current timetable in all views in one transaction; the previous version is kept in history. |
| FR-29 | Admin shall lock selected lessons and regenerate the rest (partial regeneration), e.g. when a teacher is ill or on a business trip. | M | Locked lessons keep their slot and room; the number of other changed lessons is reported (minimal perturbation, see `03`, [10]). |
| FR-30 | When no timetable satisfies the hard constraints, the system shall explain why. | S | Pre-checks report overloaded resources (e.g. "teacher X: 22 lessons, 18 available slots", "no lab room for 60 students") and missing or inconsistent input data (teacher without availability, group without size, course without room type); if the solver proves infeasibility, the report names the groups/teachers/rooms involved. |
| FR-34 | Consecutive lessons of a teacher or a group in different buildings shall leave a configurable transfer time. | S | Buildings have a transfer time matrix; the generator never places such lessons closer than the transfer time (hard constraint, checked by the Independent Validator); a manual edit that breaks it shows a warning. Source: interviews P1, P3 (`02`). |

### 2.2 AI assistant (LLM)

The generator itself is an AI search and optimisation method (constraint programming). In addition, a large language model (LLM) helps the administrator work with constraints in natural language. The LLM never writes to the timetable directly.

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| FR-31 | Admin shall enter constraints and wishes in plain language (KZ / RU / EN), e.g. "Ivanov does not teach on Friday afternoon", "SE-2431 should not have more than 3 lessons on Monday"; the assistant converts them into structured constraints. | M | The assistant returns constraints in a fixed JSON schema (type, subject, weekday, slots, hard/soft, weight); every constraint is validated against reference data and shown to the admin for **confirmation** before it is saved; on a test set of ≥ 50 labelled sentences, ≥ 85% are converted correctly (M-14). Unrecognised text is reported, not guessed. |
| FR-32 | The assistant shall explain the generation result in plain language: why the input is infeasible (based on FR-30) and the main soft-constraint penalties, with suggested actions. | S | Explanations only use facts from the solver report (every number and name in the text appears in the report); checked on the test set by the team. |
| FR-33 | The system shall work without the LLM. | M | If the LLM is disabled or unavailable, constraints can be entered with forms and generation works as usual; no personal data other than the names needed for the constraint is sent to the LLM provider. |

## 3. Non-functional requirements

| ID | Category | Requirement | Priority | Acceptance criteria / metric |
|---|---|---|---|---|
| NFR-01 | Performance | Schedule views and search respond quickly. | M | 95th percentile API response time ≤ 300 ms for schedule queries with a dataset of ≥ 200 groups, 300 teachers, 150 rooms, 5,000 entries, under 100 concurrent users (load test). |
| NFR-02 | Performance | Pages load quickly on mobile. | S | First contentful paint ≤ 2 s on a simulated 4G connection (Lighthouse). |
| NFR-03 | Data integrity | No conflicting schedule entries can be stored, including under concurrent edits. | M | Enforced by DB constraints; concurrency test with parallel requests results in exactly one success and others HTTP 409. |
| NFR-04 | Security | Protect against common API threats. | M | Passwords hashed; JWT with expiry ≤ 30 min; all write endpoints require admin role; input validated; no secrets in repository; checked against OWASP API Security Top 10 checklist. |
| NFR-05 | Usability / responsiveness | UI works on screens from 360 px to 1920 px wide. | M | All key scenarios can be completed on a 360 px wide viewport without horizontal scrolling (manual + Playwright mobile test). |
| NFR-06 | Usability | Users can complete key tasks easily. | S | In usability testing with ≥ 5 participants, task success rate ≥ 90% and SUS score ≥ 70. |
| NFR-07 | Maintainability | Code is tested and consistently structured. | S | Backend test coverage ≥ 70% of business logic; linting (ruff, eslint) passes in CI; every change goes through a reviewed pull request. |
| NFR-08 | Portability / deployment | The system can be started with a single command. | M | `docker compose up` starts DB, backend and frontend on a clean machine; setup steps documented in README. |
| NFR-09 | Accessibility | Basic accessibility. | C | Lighthouse accessibility score ≥ 90; sufficient colour contrast (WCAG 2.1 AA). |
| NFR-10 | Localisation | Interface available in Kazakh, Russian and English. | S | All UI strings externalised (i18n); KZ/RU/EN translations complete for key scenarios; language switch persists per user. Motivation: no compared system has confirmed Kazakh support (see `04-existing-systems-comparison.md`). |
| NFR-11 | Availability | Read access remains available during edits and generation. | S | Editing the schedule or running the generator does not block viewing (no table-level locks; generation runs outside the request–response cycle). |
| NFR-12 | Performance (generation) | The generator produces a timetable for the whole university within a time limit. | M | Reference dataset (as in NFR-01: ≥ 200 groups, 300 teachers, 150 rooms, ≈ 5,000 weekly lessons, about 6 faculties): a feasible timetable within **30 minutes**; one faculty within **5 minutes**, on the machine recorded in the test report. |
| NFR-13 | Reproducibility | Generation results can be repeated. | S | With the same input, weights, random seed and single-worker mode, the generator returns the same timetable; the parameters of every run are stored. |
| NFR-14 | Privacy (AI) | Data sent to an external LLM is minimised. | M | Only the constraint text and the reference names needed to resolve it are sent; teacher/student e-mails, user accounts and the full timetable are never sent; the LLM provider is configurable (cloud API or self-hosted model); API keys only in environment variables. |

## 4. Constraints and assumptions

- C-1: Development time is limited to the diploma timeline (until final defence).
- C-2: Team of two developers; no real integration with university SSO/LMS.
- A-1 (assumption): Real schedule data or a realistic anonymised sample can be obtained for testing; otherwise synthetic data is generated.
- A-2 (assumption): A weekly recurring schedule (with optional odd/even weeks) covers the university's needs.
- A-3 (assumption): The teaching load (who teaches what to which groups, how many lessons per week) is known before the term and can be entered or imported; the generator does not decide *who* teaches a course, only *when* and *where*.
- A-4 (assumption): Faculties share some rooms and teachers, so a university-wide run must keep shared resources consistent across faculties.
- A-5 (finding, `02` P1): Input data from schools will be incomplete or inaccurate, and a generated timetable will still need manual corrections (the interviewed teacher expected 80–90% of a correct timetable). The system is therefore designed as "generate a draft → correct by hand with conflict checks → publish", not as a fully automatic replacement of the scheduler.

## 5. Version history

| Version | Date | Change |
|---|---|---|
| 0.1 | 2026-10-18 | Initial requirements based on the project proposal. |
| 0.2 | 2026-10-22 | Supervisor feedback (`11-supervisor-feedback.md`, #1): automatic generation of the whole university timetable moved into scope. Added FR-23 – FR-30 (generation), FR-31 – FR-33 (AI assistant), NFR-12 – NFR-14, A-3, A-4; FR-19 raised from C to S; FR-21 now covers only exam timetabling and student sectioning. |
| 0.3 | 2026-10-24 | Interviews with two teachers and one student (`02`): FR-17 and FR-29 raised from S to M; FR-26 extended with difficult courses in early slots and per day; FR-30 extended with input data checks; new FR-34 (transfer time between buildings); new A-5. |
| 0.4 | 2026-10-24 | Interview P4 (teacher): FR-20 (notifications about changes) raised from C to S. |
