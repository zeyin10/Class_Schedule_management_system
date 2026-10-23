# UX / Prototype

**Owner:** Nurzhaina Kuralbay (Frontend, UI/UX)
**Figma link:** _TODO_
**Working prototype:** [`src/frontend`](../src/frontend) — React application running on a mock API (see [How to run](#5-how-to-run-the-prototype)).

The prototype covers the key scenarios of all three roles, including **automatic timetable generation** and the **AI assistant** added to the scope after the supervisor's feedback (`11-supervisor-feedback.md`, #1). Until the backend is available (milestone M2), the frontend uses an in-browser mock that follows the same REST contract and error format as the planned API (`docs/07-architecture.md`, section 6), including conflict detection with odd/even weeks. Switching to the real backend only requires `VITE_USE_MOCK=false`.

## 1. Key user scenarios

| # | Scenario | Actor | Use case | Requirements | Screen |
|---|---|---|---|---|---|
| S1 | Find my group's schedule for the current week on a phone | Student / Guest | UC02, UC03 | FR-10, FR-11, NFR-05 | 2, 7 |
| S2 | See my personal schedule and the next lesson after logging in | Student, Teacher | UC01, UC04 | FR-01, FR-12 | 1, 3 |
| S3 | Find a free room of a given type and size for a time slot | Teacher | UC05 | FR-13 | 4 |
| S4 | Add a lesson and get an immediate, readable message about a double booking | Admin | UC09, UC10 | FR-07, FR-08 | 5 |
| S5 | Get a warning when the room is too small or of the wrong type, and decide whether to save | Admin | UC11 | FR-09 | 6 |
| S6 | Use the interface in Kazakh, Russian or English | All | — | NFR-10 | 7 |
| S7 | Write a constraint in plain language ("Омаров жұма күні түстен кейін сабақ бере алмайды"), check how the AI understood it, confirm | Admin | UC16, UC17 | FR-24, FR-31 | 8 |
| S8 | Generate the timetable for the whole university, read the quality report and the AI explanation, check a group's draft, publish | Admin | UC18 – UC20 | FR-25 – FR-28, FR-32 | 9, 11 |
| S9 | Understand why no timetable is possible and what to change | Admin | UC18, UC20 | FR-30, FR-32 | 10 |

### S8 step by step (generation)

1. The administrator opens **Generation**, chooses the scope (whole university or one group), the time limit and the importance of wishes (gaps, teacher wishes, daily load, last slot).
2. Presses **Generate**. The frontend sends `POST /api/v1/generation-runs` and gets a job ID at once; a progress bar shows the job status (`queued` → `running`), polled every 0.5 s.
3. When the job is `done`, the page shows the **quality report**: lessons placed, hard-constraint violations (must be 0), gaps, lessons outside wishes, days over the limit, total penalty.
4. **Explain (AI)** gives the same facts in plain language with a suggestion what to change.
5. The administrator looks at the draft for any group (same week grid as the public schedule) and presses **Publish**. Until then students and teachers keep seeing the old timetable.

If the job is `infeasible` (S9), the page lists the reasons from the pre-check (e.g. "SE-2431 has 8 lessons, but only 5 fit into its daily limit") and the AI explanation suggests what to relax.

### S4 step by step (main scenario of the project)

1. The administrator opens **Schedule editor** and presses **New entry**.
2. Selects course, lesson type, teacher, room, day, time slot, week pattern (every / odd / even) and one or more groups.
3. Presses **Save**. The frontend sends `POST /api/v1/schedule-entries`.
4. If the backend returns `409 SCHEDULE_CONFLICT`, the form stays open and lists **every** conflict in plain language: which teacher, room or group is already busy and with which lesson. Nothing is saved.
5. The administrator changes the slot or room and saves again; the new lesson immediately appears in group, teacher and room views.

## 2. Screens

| # | Screen | File |
|---|---|---|
| 1 | Login (with demo accounts for the prototype) | ![](assets/ux/01-login.png) |
| 2 | Public schedule by group — week grid, week parity, day filter, search | ![](assets/ux/02-group-schedule.png) |
| 3 | Student: "My schedule" with the next lesson | ![](assets/ux/03-student-my-schedule.png) |
| 4 | Teacher: free rooms for a time slot | ![](assets/ux/04-teacher-free-rooms.png) |
| 5 | Admin: conflict message when saving a double-booked lesson | ![](assets/ux/05-admin-conflict.png) |
| 6 | Admin: capacity / room type warning with "Save anyway" | ![](assets/ux/06-admin-room-warning.png) |
| 7 | Mobile (360 px), Kazakh interface — schedule as a list of days | ![](assets/ux/07-mobile-kk-schedule.png) |
| 8 | Admin: AI assistant — a Kazakh sentence understood as a hard rule, waiting for confirmation; teaching load below | ![](assets/ux/08-admin-ai-assistant.png) |
| 9 | Admin: generation — weights, quality report, AI explanation, draft of a group, Publish | ![](assets/ux/09-admin-generation-draft.png) |
| 10 | Admin: infeasible input — reasons and AI explanation | ![](assets/ux/10-admin-generation-infeasible.png) |
| 11 | Mobile (360 px), Kazakh interface — generation result | ![](assets/ux/11-mobile-kk-generation.png) |

## 3. Design decisions

| Decision | Reason | Requirement |
|---|---|---|
| Week grid on desktop, list of days on phones | A 6-column table does not fit a 360 px screen; students mostly use phones (hypothesis H5, to be checked in interviews) | NFR-05 |
| Current week parity (odd / even) is selected automatically and labelled "current" | Odd/even lessons are a common source of confusion | FR-10, A-2 |
| A lesson card shows only what the viewer does not already know (group view → room and teacher; teacher view → room and groups; room view → groups and teacher) | Less noise on small screens | FR-10 |
| Lesson types are colour-coded (lecture / practice / lab) and also written in text | Colour is not the only carrier of information | NFR-09 |
| Conflicts are shown inside the form, all at once, with the conflicting lesson named | The administrator can fix the entry without searching the schedule | FR-08 |
| Capacity / room type problems are warnings, not errors | Real situations sometimes require an exception; the decision stays with the administrator | FR-09 |
| Language switch in the header, remembered in the browser | Users choose once | NFR-10 |
| Pages are shown according to role; the API enforces the same rules | The interface does not offer actions the user cannot perform | FR-02 |
| The AI assistant shows **what it understood** in plain words (teacher, day, time, hard/wish) and saves nothing until the admin presses **Confirm** | LLMs can be wrong; the admin must see and approve every rule (AD-8) | FR-31 |
| Unknown names are reported, never guessed ("Иванов was not found") | A wrong teacher in a rule is worse than no rule | FR-31, AD-8 |
| Rules from the assistant keep the original sentence under the rule (✦ «…») | The admin can check later where a rule came from | FR-31 |
| AI elements share one accent colour and the ✦ mark | Users can always tell AI suggestions from system facts | FR-31, FR-32 |
| Wishes are set with 0–5 sliders in plain words ("Few gaps for groups"), not as penalty formulas | Admins do not need to know the optimisation model | FR-26 |
| The generation result is a **draft** with its own Publish button; the quality report comes first, "hard-constraint violations" is highlighted | Publishing changes what hundreds of people see; the admin checks quality first | FR-27, FR-28 |
| The AI explanation is labelled "based only on the generator report" | Makes clear the text adds no new facts | FR-32 |

## 4. Interaction with the API

| Screen | Request | Handled responses |
|---|---|---|
| Login | `POST /auth/login` | 200 → token and user; 401 → "Invalid e-mail or password" |
| Schedule, My schedule | `GET /schedule?group_id=|teacher_id=|room_id=` + reference data (`/groups`, `/teachers`, `/rooms`, `/courses`, `/time-slots`) | 200 |
| Free rooms | `GET /rooms/free?weekday=&slot=&week=&type=&min_capacity=` | 200 |
| Schedule editor | `POST /schedule-entries`, `PUT /schedule-entries/{id}`, `DELETE /schedule-entries/{id}`; `?force_capacity=true` after a warning | 201/200/204; 409 `SCHEDULE_CONFLICT` with `details.conflicts`; 422 `ROOM_WARNING` with `details.warnings` |
| Load & constraints | `GET /teaching-load`, `GET/POST/DELETE /constraints`, `POST /assistant/parse-constraint` `{text}` | 200; parse result `ok` (constraint), `unknown_name`, `not_understood` |
| Generation | `POST /generation-runs` `{group_ids, weights, time_limit_s}`, `GET /generation-runs/{id}` (polling), `GET /schedule?timetable_id=&group_id=` (draft), `POST /timetables/{id}/publish`, `POST /assistant/explain/{run_id}` `{language}` | 202 + job; status `queued / running / done / infeasible`; `report`, `reasons` |

Example of a conflict response the UI expects:

```json
{
  "error": {
    "code": "SCHEDULE_CONFLICT",
    "message": "The entry conflicts with existing lessons",
    "details": {
      "conflicts": [
        { "type": "teacher", "entry": { "id": 1, "course_id": 1, "teacher_id": 1, "room_id": 1, "weekday": 1, "time_slot_id": 1, "week_pattern": "every", "group_ids": [1, 2] } },
        { "type": "group", "group_id": 1, "entry": { "id": 1 } }
      ]
    }
  }
}
```

> Open points for the backend (to agree with Zeyin in the OpenAPI spec): login response field names (`access_token`, `user`), the `week` parameter of `/rooms/free`, the exact shape of `details.conflicts`, the JSON schema of constraints, and the fields of the generation report.

**How generation and AI work in the prototype.** The mock API cannot run CP-SAT or call a language model in the browser. It uses a small greedy generator (`src/lib/generator.ts`, the same idea as baseline B-3 in `docs/09`) and a keyword matcher instead of the LLM (`src/api/mockAssistant.ts`). Both return data in the same format as the planned backend, so the screens will work unchanged with the real CP-SAT worker and LLM assistant.

## 5. How to run the prototype

```bash
cd src/frontend
npm install
npm run dev        # http://localhost:5173
npm test           # unit and component tests (Vitest + React Testing Library)
```

Demo accounts (password `demo123`): `student@demo.kz`, `teacher@demo.kz`, `admin@demo.kz`. All data is synthetic.

## 6. Next steps

- Figma: high-fidelity mockups based on these screens; add the link above.
- Usability test of S1–S5 with ≥ 5 participants after the interviews (NFR-06, `docs/09`).
- Not yet in the prototype: editing the teaching load and teacher availability with forms (FR-23, FR-24, FR-33), partial regeneration with locked lessons (FR-29), comparison of two drafts, iCal export (FR-16), recent changes (FR-17), change history (FR-15), reference data management screens (FR-03 – FR-06).
- Usability check of S7–S9 with a real scheduler (does the quality report make sense? are the weight names clear?).
- Playwright end-to-end tests on desktop and 360 px viewports (T-E2E-01 … 03) once the backend is running.
