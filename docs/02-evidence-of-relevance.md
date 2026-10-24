# Evidence of Relevance

This document records the discussions with potential users that inform the requirements, and separates **verified findings** from **assumptions**.

## 1. Method

- **Goal.** Check the problems stated in the project proposal (`01`, section 2) and the scope set after the supervisor's feedback (`11`, #1): automatic generation of the timetable with AI, natural-language constraints, conflict prevention, mobile access.
- **Instrument.** A one-page questionnaire per role with a short description of the project and two open questions with hints (teacher: how they learn about the timetable and changes, whether their wishes are taken into account; student: how they read the timetable, what disturbs them). The first teacher was asked one open question about the feasibility of the project instead, because no scheduler was available (see section 6).
- **Recording.** Answers were written down in the participants' words (Russian); quotes below are short excerpts, the full answers are kept by the team. Participation was anonymous.
- **Analysis.** Each statement was compared with the hypotheses H1–H8 (section 4) and marked as *confirmed*, *partly confirmed*, *not confirmed* or *new finding*. Changes to the requirements are listed in section 5.

## 2. Participants

| # | Role | Date | Format | Conducted by |
|---|---|---|---|---|
| P1 | Teacher (asked as an expert on whether the system is feasible) | 2026-10-24 | Conversation, answer written down | Zeyin |
| P2 | Teacher | 2026-10-24 | Written questionnaire | Team |
| P3 | Student | 2026-10-24 | Written questionnaire | Team |

Three discussions meet the minimum of 3–5. **No schedule administrator (scheduler) took part**; this limitation is discussed in section 6.

## 3. Findings

### P1 — Teacher: feasibility of automatic generation

- **Automation is hard but possible with modern methods.** "Сделать автоматическое расписание крайне сложно… это относится к… NP задачам… Через чур большой перебор." Without AI it was almost impossible; "сейчас можно конечно использовать генетические алгоритмы".
- **Expected result: a strong draft, not a final timetable.** "Ваше расписание может составиться на 80–90 процентов правильно, но остальные 10–20 процентов все равно будет вручную редактировать." "Ваша программа может выдать шаблон, остальное меняется вручную."
- **Constraints named:** teacher availability ("окно занятости"); lectures must not be in small rooms; streams and groups cannot be in two places at once; **difficult subjects should be in the morning, in the first slots**; avoiding gaps under high load is hard; **several buildings — a teacher cannot teach in one building at 10:00 and in the main building at 10:15**.
- **Frequent changes:** illness and business trips change the timetable constantly.
- **Data quality:** "Не возможно чтоб все школы в универе могут предоставить идеальные данные."

### P2 — Teacher

- The timetable is sent **as a file or published on the portal** before the trimester.
- Changes come **through group leaders or the dispatcher in a messenger, often at the last moment**.
- **Double bookings happen regularly:** "пару раз приходил в аудиторию, а она оказывается уже занята другой дисциплиной"; after a move a lesson "накладывается" on another course.
- Wishes are taken into account "по возможности" if sent in advance (official memo or message), but "про них часто забывают при составлении итоговой сетки".
- On writing wishes as plain text that the system takes into account automatically: **"это идеальное решение"**.

### P3 — Student

- Reads the timetable **mostly on the phone, in the university app**; it is more convenient than Excel files, but the app sometimes freezes when updating.
- **Urgent changes are not updated quickly:** "бывали случаи, когда о переносе занятия узнавали уже придя к кабинету".
- **Long gaps of 2–3 hours** between lessons are the biggest problem.
- **Uneven load:** 4–5 difficult subjects with labs in one day and only one lesson the next day.
- **Short breaks between buildings:** hard to move quickly from one block/building to another.

## 4. Verified findings vs. assumptions

| # | Statement (hypothesis from `01`) | Status | Evidence |
|---|---|---|---|
| H1 | Double bookings of rooms/teachers/groups are discovered late | **Confirmed** (teacher view) | P2: rooms already occupied, overlapping lessons after moves |
| H2 | Information about changes is fragmented and late | **Confirmed** | P2: messenger, group leaders, last moment; P3: learned about a move at the room door |
| H3 | The timetable is published only as static files (PDF/Excel) | **Partly confirmed** | P2: file or portal; P3: there is already a mobile app, but updates are slow and it freezes. Our value is not "an app instead of Excel" but **up-to-date data and change marks** |
| H4 | Teachers' wishes are hard to take into account manually | **Confirmed** | P2: wishes are often forgotten; P1: availability windows of every teacher |
| H5 | Students mostly use phones | **Confirmed** (1 student) | P3 |
| H6 | Gaps and uneven daily load are a problem for students | **Confirmed** | P3: 2–3 hour gaps, 4–5 difficult subjects in one day; P1: gaps are hard to avoid |
| H7 | Users would accept constraints written in plain language | **Confirmed** (1 teacher) | P2: "идеальное решение" |
| H8 | Full automatic generation can replace manual work | **Not confirmed** | P1: 80–90% automatic, the rest manual. Supports our design: generated **draft** + manual editing with conflict checks + publication |
| N1 | Teachers and students need time to move between buildings | **New finding** | P1, P3 |
| N2 | Difficult subjects should be early in the day and spread over the week | **New finding** | P1 (morning), P3 (not 4–5 per day) |
| N3 | The timetable changes often during the term (illness, business trips) | **New finding** | P1 |
| N4 | Input data from schools will be incomplete or inaccurate | **New finding** | P1 |
| A1 | Building the timetable takes schedulers a lot of time | **Assumption** (not verified) | No scheduler interviewed |
| A2 | Schedulers would trust a generated draft | **Assumption** (not verified) | No scheduler interviewed; P1 expects manual correction |

## 5. Impact on requirements

Requirements were updated to version 0.3 (`06`, version history):

| Finding | Change |
|---|---|
| H8, P1 "80–90%, the rest manually" | No change in scope, but the decision "draft → manual editing → publish" (FR-27, FR-28) is now based on evidence; the evaluation reports the share of lessons changed by hand after generation (`09`, M-17). |
| N1 buildings | **New FR-34 (S):** consecutive lessons of a teacher or a group in different buildings need a configurable transfer time; the generator treats it as a hard constraint, manual edits show a warning. |
| N2 difficult subjects | **FR-26 extended:** new soft constraints "difficult courses in early slots" and "at most N difficult courses per day"; courses get a difficulty mark. |
| N3 frequent changes | **FR-29** (partial regeneration with locked lessons) raised from S to **M**. |
| H2 late information | **FR-17** (recent changes marked for affected users) raised from S to **M**. |
| N4 data quality | **FR-30** extended: pre-checks also report missing or inconsistent input data (teacher without availability, group without size, course without room type). |
| H7 | FR-31 (natural-language constraints) kept as M. |

## 6. Limitations

- **No scheduler was interviewed.** The person who builds the timetable is the main user of generation, but we could not reach one before pre-defense 1. Teachers were asked instead; P1 answered as an expert on feasibility. Assumptions A1 and A2 stay unverified. Action: contact the dean's office through the supervisor before milestone M2 (risk R-2 in `10`).
- **Small sample:** two teachers and one student from one university. The findings show the main problems but are not statistically general.
- Answers were given after reading the project description, which may make participants more positive about the proposed solution.
