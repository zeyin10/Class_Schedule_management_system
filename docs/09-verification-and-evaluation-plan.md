# Verification and Evaluation Plan

The plan answers two questions:
1. **Verification** — is the system built correctly (does it meet each requirement)?
2. **Evaluation** — does it achieve the project aim better than the current way of working (baseline)?

## 1. Baseline for comparison

| Baseline | Description |
|---|---|
| **B-1: Current process** | The schedule published as a static spreadsheet/PDF file and edited manually in Excel (or the form used at the university, confirmed during interviews). |
| **B-2: Naive application check** (technical baseline) | Version of the backend that checks conflicts only in application code (`SELECT` then `INSERT`) without DB constraints — used to show the effect of AD-2 under concurrency. |
| **B-3: Greedy generator** (algorithmic baseline) | First-fit generator: lessons sorted by difficulty (fewest possible slots first) are placed in the first free (day, slot, room) that satisfies the hard constraints, without optimisation. Used to show the value of CP-SAT for completeness and soft-constraint quality. |
| **B-4: Real manual timetable** (if available) | A published timetable of the university for one term, re-entered as data; its soft-constraint penalties (gaps, daily load) are computed with the same metrics as generated timetables. |
| **B-5: Forms only** (AI baseline) | Constraints entered with forms instead of the AI assistant; used to compare time to enter a set of constraints. |

## 2. Test levels

| Level | Tools | Scope | Responsible |
|---|---|---|---|
| Unit tests | pytest; Vitest + React Testing Library | Services, validation, conflict rules, iCal generation; UI components | Zeyin (BE), Nurzhaina (FE) |
| Generator tests | pytest on small hand-made instances with known answers, plus generated instances | Each hard constraint separately, infeasible instances, locked lessons, determinism | Zeyin |
| Generator benchmarks | Script on the reference dataset, CP-SAT vs. B-3 (and B-4) | Run time, completeness, soft-constraint penalties | Zeyin |
| AI assistant evaluation | Labelled test set of ≥ 50 sentences (KZ/RU/EN) with expected JSON; LLM calls mocked in unit tests | Parser accuracy, rejection of unknown names, no invented facts in explanations | Both |
| Integration tests | pytest + httpx + PostgreSQL in Docker (testcontainers) | API endpoints with real DB, constraints, RBAC | Zeyin |
| Concurrency tests | pytest + asyncio (parallel requests) | Simultaneous conflicting writes | Zeyin |
| End-to-end tests | Playwright (desktop + mobile viewport) | Key user scenarios through the UI | Nurzhaina |
| Performance tests | k6 or Locust | NFR-01 response times under load | Zeyin |
| Frontend quality | Lighthouse | NFR-02, NFR-09 | Nurzhaina |
| Usability testing | Moderated sessions + SUS questionnaire | NFR-06, comparison with B-1 | Both |
| Security checks | OWASP API Security Top 10 checklist, dependency audit (pip-audit, npm audit) | NFR-04 | Zeyin |

All automated tests run in **GitHub Actions** on every pull request; a PR cannot be merged if tests fail.

## 3. Test cases mapped to requirements (initial)

| Test ID | Requirement | Description | Expected result |
|---|---|---|---|
| T-INT-01 | FR-01 | Login with valid / invalid credentials | 200 + token / 401 |
| T-INT-02 | FR-02 | Student calls every write endpoint | 403 for all |
| T-INT-03 | FR-08 | Create entry overlapping an existing one for same teacher / room / group | 409 with conflicting entry details |
| T-INT-04 | FR-08 | Odd-week and even-week entries in same slot | Both accepted |
| T-CON-01 | FR-08, NFR-03 | 20 parallel requests creating the same conflicting entry | Exactly 1 × 201, 19 × 409; no overlaps in DB |
| T-INT-05 | FR-13 | Free-rooms query | Only rooms without bookings returned |
| T-INT-06 | FR-15 | Update entry → history | Audit record with old/new values |
| T-INT-07 | FR-16 | Export .ics | Valid RFC 5545 file; correct Asia/Almaty times |
| T-INT-08 | FR-09 | Room capacity smaller than group size | 422 warning; accepted with confirmation |
| T-E2E-01 | FR-10, FR-11 | Student finds group schedule and filters by day | Correct lessons shown |
| T-E2E-02 | FR-07, FR-08 | Admin creates conflicting entry in UI | Conflict message shown, entry not saved |
| T-E2E-03 | NFR-05 | Key scenarios at 360 px viewport | No horizontal scroll, all actions available |
| T-PERF-01 | NFR-01 | Load test on reference dataset | p95 ≤ 300 ms at 100 concurrent users |
| T-INT-09 | FR-23, FR-24 | Create load items and teacher unavailability | Saved; invalid teacher/group or lessons ≤ 0 rejected (422) |
| T-INT-10 | FR-28 | Publish a draft | Draft becomes published in one transaction; previous version archived; views show the new version |
| T-GEN-01 | FR-25 | Generate on the reference dataset; validate with the Independent Validator and insert with EXCLUDE constraints active | 0 hard-constraint violations; every load item placed the required number of times |
| T-GEN-02 | FR-24, FR-25 | Small instances, one per hard constraint (teacher, room, group overlap; odd/even; capacity; room type; unavailability) | Each constraint respected; odd and even lessons may share a slot |
| T-GEN-03 | FR-26 | Same input, CP-SAT vs. B-3 | Weighted soft penalty of CP-SAT lower than B-3 |
| T-GEN-04 | FR-29 | Lock 50% of lessons, change one teacher's availability, regenerate | Locked lessons unchanged; number of other changes reported |
| T-GEN-05 | FR-30 | Instance where a teacher has more lessons than available slots | Status `infeasible`; report names the teacher and the numbers |
| T-GEN-06 | NFR-13 | Run twice with the same input, seed, single worker | Identical timetables |
| T-GEN-07 | FR-34 | Two buildings with a 20-minute transfer time and 10-minute breaks | No teacher or group has consecutive lessons in different buildings |
| T-PERF-02 | NFR-12 | Whole-university generation on the reference dataset; one faculty | Feasible timetable ≤ 30 min (university), ≤ 5 min (faculty) |
| T-AI-01 | FR-31 | Labelled test set (≥ 50 sentences, KZ/RU/EN) | ≥ 85% exactly correct constraints (M-14) |
| T-AI-02 | FR-31, AD-8 | Sentences with unknown or ambiguous teacher names, or nonsense | No constraint saved without confirmation; unknown names reported, never guessed |
| T-AI-03 | FR-33 | LLM disabled / provider unavailable | Forms work; generation works; clear message in the assistant |

## 4. Evaluation metrics

| # | Metric | How measured | Target | Baseline compared |
|---|---|---|---|---|
| M-1 | Requirement coverage | Share of Must requirements with passing acceptance tests | 100% of Must | — |
| M-2 | Conflicts stored | Number of overlapping entries in DB after concurrency test | 0 (B-2 expected > 0) | B-2 |
| M-3 | API response time | p95 latency, load test | ≤ 300 ms | — |
| M-4 | Time to find information | Seconds for a user to answer "Where and when is my next lesson?" and "Is room X free at slot Y?" | ≥ 50% faster than baseline | B-1 |
| M-5 | Time to make a correct change | Seconds for an admin to move a lesson to another room/slot without creating a conflict | Faster than baseline, 0 conflicts introduced | B-1 |
| M-6 | Errors introduced during editing | Conflicts left after a set of 5 editing tasks | 0 (vs. count in B-1) | B-1 |
| M-7 | Task success rate | Completed tasks / attempted tasks in usability test | ≥ 90% | — |
| M-8 | System Usability Scale (SUS) | Standard 10-item questionnaire | ≥ 70 | B-1 (SUS of current process) |
| M-9 | Backend test coverage | pytest-cov on service layer | ≥ 70% | — |
| M-10 | Hard-constraint violations in generated timetables | Independent Validator + DB constraints | 0 | B-3 (also 0 by construction, but may leave lessons unplaced) |
| M-11 | Soft-constraint quality | Weighted penalty and its parts: group gaps (windows), unmet teacher preferences, days over the daily limit | Lower than B-3; reported next to B-4 | B-3, B-4 |
| M-12 | Completeness | Share of load items placed | 100% (CP-SAT) | B-3 |
| M-13 | Generation time | Wall-clock time per run (median of 3) | ≤ 30 min university, ≤ 5 min faculty | B-3 |
| M-14 | AI parser accuracy | Exactly correct constraints / sentences in the labelled test set, per language | ≥ 85% | — |
| M-15 | Time to build a timetable | Hours to obtain a publishable timetable for a test faculty: with the system vs. the scheduler's estimate or record for the manual process | Much shorter than baseline (reported, no fixed target before interviews) | B-1 |
| M-16 | Time to enter constraints | Seconds to enter 10 typical wishes with the assistant vs. forms | Faster with the assistant | B-5 |
| M-17 | Manual correction after generation | Share of lessons the administrator moves by hand before publishing a generated draft (test faculty) | Reported; an interviewed teacher expects 10–20% (`02`, P1), we aim for less | — |

## 5. Measurement conditions

- **Dataset:** reference dataset of ≥ 200 groups, 300 teachers, 150 rooms and 5,000 schedule entries (anonymised real data if available, otherwise generated by a seed script that is stored in the repository so results are reproducible).
- **Environment:** Docker Compose on a single machine; hardware specification recorded in the test report.
- **Load:** 100 virtual users, 5-minute ramp-up, 10-minute steady state; 80% read requests, 20% search.
- **Usability study:** ≥ 5 participants (students, teachers, at least one person who edits schedules); the same task list performed with baseline B-1 and with the system, in alternating order to reduce learning effect; time recorded with a stopwatch/screen recording; SUS filled after each condition.
- **Repetition:** performance tests run 3 times; the median is reported.
- **Generation dataset:** the same reference dataset plus a teaching load (≈ 5,000 weekly lessons, about 6 faculties, shared rooms and some teachers working in two faculties), teacher unavailability for ≈ 20% of teachers, and odd/even-week lessons. Generated by a stored script with a fixed seed. Time limits, weights and the CP-SAT version are recorded with every result.
- **AI test set:** sentences written by the team and, where possible, collected from schedulers during interviews; each labelled with the expected JSON before the test is run; the LLM model and prompt version are recorded.

## 6. Reporting

Results are recorded in `docs/test-reports/` for each pre-defense: date, version (git tag), environment, raw numbers, comparison with targets and baseline, known limitations.

## 7. Demonstrating the aim

The project aim is considered achieved if: all Must requirements pass their acceptance tests (M-1); the generator produces complete timetables for the whole university with zero hard-constraint violations within the time limit and better soft-constraint quality than the greedy baseline (M-10 – M-13); the AI assistant reaches the target accuracy (M-14); no conflicting entries can be stored even under concurrency (M-2); performance targets are met (M-3); and users build timetables, find information and make changes faster and with fewer errors than with the baseline (M-4 – M-8, M-15, M-16).
