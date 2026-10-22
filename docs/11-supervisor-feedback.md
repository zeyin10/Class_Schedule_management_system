# Supervisor Feedback

**Supervisor:** Toleu Altynbek

Comments are recorded as given (original language) with an English translation, followed by the decision taken and where it is implemented.

| # | Date | Deliverable reviewed | Comment | Decision / action taken | Task ID / commit |
|---|---|---|---|---|---|
| 1 | 2026-09-30 | Topic and initial idea (oral discussion) | See [comment 1](#comment-1) below | Scope changed: automatic generation of the whole university timetable and an AI layer are now core features | CSM-18 |
| 2 | | | | | |
| 3 | | | | | |

## Comment 1

**Original (Kazakh):**
> «Тақырып өте жақсы, әлі күнге барлық университеттер расписаниені қолмен жасайды. Егер сіздер автоматтандырсаңыздар өте үлкен жетістік болады. Міндетті түрде ИИ қосу керек, басқалай болмайды. Ескеретін нюанстары өте көп. Зерттеуді бастай беріңіздер.»

**Translation:**
> "The topic is very good; to this day all universities make the timetable by hand. If you automate it, it will be a great achievement. You must add AI, it will not work otherwise. There are very many nuances to take into account. Start the research."

**How the comment was addressed**

| Point of the comment | Decision | Where |
|---|---|---|
| Universities still build timetables by hand; automate it | Automatic generation of the whole university timetable (per term; also per faculty or selected groups) moved from a stretch goal into scope; generated timetable is a draft that the administrator reviews, edits and publishes | `01` §4, §7; `06` FR-23 – FR-30, NFR-12, NFR-13 |
| AI is mandatory | Two AI layers: (1) the generator is a constraint satisfaction and optimisation engine (Google OR-Tools CP-SAT), a classical AI search method; (2) an LLM assistant turns constraints written in plain language into structured constraints and explains infeasible inputs and the quality report. LLM output is validated and confirmed by the administrator; the solver and the Conflict Checker remain the authority | `01` §7, `03` §2.7, `05` Decisions 7–8, `06` FR-31 – FR-33, `07` AD-6 – AD-8 |
| Many nuances | Constraints listed explicitly (odd/even weeks, joint lectures, room type and capacity, teacher unavailability and preferences, gaps, shared rooms and teachers between faculties); open questions added to the interview guide for schedulers | `06` FR-25, FR-26, A-3, A-4; `02` |
| Start the research | Literature review extended with sources on solvers [6]–[9], [17] and on LLMs for optimisation modelling [21]–[24] | `03` |

> The comment was given orally; the wording above was written down by the team. Later comments will be recorded here with the reviewed deliverable and the resulting commit.
