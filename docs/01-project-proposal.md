# Project Proposal

## 1. General information

| Item | Value |
|---|---|
| **Project title** | Development of a Class Schedule Management System |
| **Programme** | Software Engineering, group SE-2431 |
| **Team members** | Zeyin Abdikassym — Backend Developer (Database and API Development)<br>Nurzhaina Kuralbay — Frontend Developer (UI/UX Design and Implementation) |
| **Supervisor** | Toleu Altynbek |
| **Project type** | Team diploma project (2 students) |

## 2. Problem statement

At most universities the class schedule is prepared by a small number of staff in spreadsheets or desktop timetabling tools and then published as static files (PDF/Excel) or images. This causes several recurring problems:

1. **Conflicts are detected late.** When the schedule is edited manually (room change, teacher replacement, moved lesson), double-bookings of a teacher, a room or a student group are often discovered only when students and teachers arrive at the room.
2. **Information is fragmented and quickly outdated.** Students and teachers have to look through several files or messenger channels to find their current schedule; changes are communicated informally and are easy to miss.
3. **Search and personalisation are poor.** A static file cannot easily answer simple questions such as *"Where is my next lesson?"*, *"When is room C1.3.234 free?"* or *"What does teacher X teach on Wednesday?"*.
4. **Building and editing the timetable is labour-intensive.** Schedulers place hundreds of lessons by hand at the start of every term, and then check every later change against teacher, room and group availability. Teacher wishes (free days, preferred hours) and student comfort (few gaps between lessons) are hard to take into account manually.
5. **No integration.** Schedule data is not available through an API, so it cannot be reused by other services (LMS, mobile apps, calendars).

> Note: the statements above started as working hypotheses. Interviews with two teachers and one student (`02-evidence-of-relevance.md`) **confirmed** late discovery of double bookings, late information about changes, forgotten teacher wishes and long gaps for students; they **partly confirmed** problem 3 (the university already has a mobile app, but its data is not updated quickly). An interviewed teacher expects a generator to produce 80–90% of a correct timetable, which supports our "draft → manual correction → publish" design. The time schedulers spend on building the timetable is **not yet verified**, because no scheduler was interviewed.

## 3. Target users

| User group | Main needs |
|---|---|
| **Students** | Quickly see their own group's schedule on a phone, find rooms, receive notice about changes, export to a personal calendar. |
| **Teachers** | See their personal teaching schedule, check free rooms, be informed about changes. |
| **Schedule administrators (schedulers / dean's office staff)** | Enter the teaching load once and get a conflict-free timetable generated automatically; review and adjust it by hand; manage reference data (groups, teachers, rooms, courses, time slots); be warned immediately about conflicts; publish changes. |
| **External systems (secondary)** | Read schedule data through a documented REST API (e.g. iCal subscription, other university services). |

## 4. Aim

To design and develop a web-based class schedule management system that uses **artificial intelligence to automatically generate a conflict-free university timetable** (constraint programming for the search, a large language model for working with constraints in natural language) from the teaching load and constraints, lets administrators review and edit it with **conflict prevention at the moment of editing**, stores it centrally, and gives students, teachers and administrators fast, role-appropriate access to an always-current schedule.

## 5. Objectives

1. Analyse the scheduling process and the needs of students, teachers and administrators (interviews, existing schedule data).
2. Review literature on university course timetabling, and compare existing timetabling systems and candidate technologies.
3. Specify functional and non-functional requirements with priorities and acceptance criteria.
4. Design the system architecture, the relational data model and the REST API (OpenAPI specification).
5. Formulate timetable generation as a constraint optimisation problem (hard and soft constraints) and implement a generator based on a constraint programming solver (Google OR-Tools CP-SAT); add an LLM assistant that converts constraints written in plain language into structured constraints and explains generation results.
6. Design UI/UX prototypes for the key user scenarios.
7. Implement the backend: database with integrity constraints that prevent teacher/room/group double-booking, the generation service, business logic, role-based access control and the REST API.
8. Implement the responsive frontend: teaching load input, generation and draft review, schedule views, search and filters, administrator editing interface with conflict feedback.
9. Verify the system through automated tests, generator quality and performance measurements, and a usability evaluation against baselines (the current manual process and a simple greedy generator).

## 6. Expected outcomes

- A working prototype of the web system deployed with Docker Compose.
- A timetable generator that builds a timetable for a university-size dataset (≥ 200 groups, 300 teachers, 150 rooms) with zero hard-constraint violations and reports the quality of soft constraints (gaps, teacher preferences), or explains why no timetable exists.
- A PostgreSQL database schema with constraints guaranteeing conflict-free schedules, plus seed/test data.
- A documented REST API (OpenAPI/Swagger).
- A responsive React web interface for three roles: student, teacher, administrator.
- Project documentation: requirements, architecture and diagrams, test reports, evaluation results.
- Evaluation results comparing the system with the current process (time to build a timetable, time to find information, time to make a correct change, number of undetected conflicts) and comparing the generator with a greedy baseline.

## 7. Project scope

### In scope

- Management of reference data: faculties/departments, groups, teachers, rooms (with capacity and type), courses, lesson types (lecture/practice/lab), time slots, academic terms.
- Teaching load: which course, lesson type and teacher, for which group(s), how many lessons per week (every / odd / even week); teacher unavailability and preferences.
- **Automatic timetable generation for the whole university** per term (or, on request, for one faculty or a selected set of groups), with hard constraints (no teacher/room/group overlap, room capacity and type, teacher unavailability, locked lessons) and weighted soft constraints (gaps in group schedules, teacher preferences, daily load balance). The result is saved as a draft.
- Review of the draft, manual adjustment, partial regeneration with locked lessons, and publication.
- **AI assistant (LLM):** constraints and wishes entered in plain language (KZ/RU/EN) are converted into structured constraints that the administrator confirms; plain-language explanations of infeasible inputs and of the quality report. The system also works without the LLM.
- Manual creation and editing of schedule entries by administrators.
- **Automatic conflict detection and prevention** for teachers, rooms and groups; capacity and room-type checks.
- Schedule views by group, teacher and room (day / week), search and filtering.
- Authentication and role-based access control (student, teacher, administrator).
- Change history (audit log) and display of recent changes to affected users.
- Export of a personal schedule to iCalendar (.ics).
- REST API with OpenAPI documentation.
- Responsive web UI (desktop and mobile browsers) in Kazakh, Russian and English.

### Out of scope (for this diploma)

- Native mobile applications (the web UI is responsive instead).
- Individual student sectioning (assigning each student to a section) and exam timetabling.
- A new optimisation algorithm; the project uses an existing solver (CP-SAT) and contributes the problem model, the integration and the evaluation.
- Integration with real university SSO/LMS systems (a mock or import from CSV/Excel is used instead).
- Exam scheduling, attendance tracking, grade management.
- Push/SMS notifications (in-app change indicators and optional e-mail only).

## 8. Engineering complexity

The project goes beyond a simple CRUD application:

- **Combinatorial optimisation at university scale:** course timetabling is NP-hard. The generator must model hard and soft constraints, odd/even weeks and joint lectures for several groups, and teachers and rooms shared between faculties. To stay within a time limit for the whole university it decomposes the problem by faculty while keeping shared resources consistent, and it explains infeasible inputs.
- **Reliable use of a language model:** LLM output is unreliable by nature (hallucinations). It must be forced into a strict schema, validated against the database, confirmed by a person, and measured on a labelled test set.
- **Data integrity under concurrency:** conflicts must be impossible even if two administrators edit the schedule at the same time. This is enforced at the database level (PostgreSQL range types and exclusion constraints) and reported clearly in the API and UI.
- **Non-trivial domain model:** recurring weekly lessons, academic terms, odd/even weeks, groups and subgroups, rooms of different types and capacities.
- **Query performance:** fast filtering and search over the whole timetable (indexes, query optimisation, measured response times).
- **Security:** authentication, role-based authorisation, protection against OWASP API Top 10 risks.
- **Full-stack integration:** a contract-first REST API shared between two independently developed components.
- **Measurable evaluation:** automated tests, performance metrics and a usability study against a baseline.

## 9. Responsibilities

| Area | Zeyin Abdikassym (Backend) | Nurzhaina Kuralbay (Frontend) |
|---|---|---|
| Analysis | Data and integrity requirements | User scenarios, UX requirements |
| Design | ER model, DB schema, API specification, component architecture, generator model (constraints, objective) | Information architecture, wireframes, Figma prototype |
| Implementation | FastAPI service, PostgreSQL, conflict detection, timetable generator (CP-SAT), LLM constraint parser and validation, RBAC, audit log, iCal export | React application, teaching load input, AI assistant chat for constraints, generation and draft review screens, schedule views, search/filters, admin editor, API integration |
| Testing | Unit and integration tests for API and DB constraints, generator tests and benchmarks, LLM parser accuracy test set, performance tests | Component tests, end-to-end tests, usability testing |
| Shared | Requirements, use cases, evaluation plan, README, code review of each other's pull requests | |
