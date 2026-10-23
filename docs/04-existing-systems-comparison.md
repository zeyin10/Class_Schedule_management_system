# Existing System Comparison

**Project:** Development of a Class Schedule Management System
**Team:** Zeyin Abdikassym (backend), Nurzhaina Kuralbay (frontend)

This chapter compares existing timetabling systems against one fixed set of criteria. It answers the committee's question: *why is the proposed solution needed, and is what we say about existing systems backed by evidence?*

**Evidence rule used in this chapter.** Every statement about what a system can or cannot do cites a source we opened on 2026-10-18 (official site, official documentation, the official GitHub repository, a government procurement listing, or a university page that runs the system). Where we could not find a statement in an opened source, the matrix says **? (not stated / unverified)** instead of guessing. "Not stated" means only that **we found no evidence**. It does **not** mean the feature is missing.

---

## 1. Selection of systems

### 1.1 How the systems were found

- Web search for "university timetabling software", "school timetable generator", "open source timetabling", "WebUntis iCal", "CELCAT iCalendar feed" and the Russian query "программа составления расписания".
- Systems mentioned in the timetabling literature reviewed in *03-literature-review.md* (for example, UniTime's link to the International Timetabling Competition 2019).
- Systems that universities and schools in the CIS region and Europe actually use. We confirmed use from public university pages, e.g. CELCAT feed pages at UAL and Imperial College London, and a Russian-language aSc manual.

### 1.2 Inclusion criteria

A system was included only if it (a) is built specifically for **educational timetabling**, (b) is **actively maintained** (new release or live product page in 2026), and (c) has **enough public documentation** to assess most criteria.

### 1.3 Selected systems (5)

| # | System | Type | Why it is relevant to us |
|---|--------|------|--------------------------|
| S1 | **aSc Timetables** (with EduPage online) | Commercial, desktop + web | Widely used school/college timetabler with a strong generator and a Russian-language manual. This is the "classic" tool a scheduler in our region would know. |
| S2 | **FET** | Free/open source, desktop | The best-known free timetable generator. It shows what a free tool offers and what it lacks. |
| S3 | **Untis / WebUntis** | Commercial, desktop + web + mobile | A large commercial ecosystem with separate planning (Untis) and publishing (WebUntis + mobile app). |
| S4 | **UniTime** | Open source (Apache 2.0), web | Built for **universities**. It is the closest open-source match to our scope (web, roles, iCal, export API). |
| S5 | **CELCAT Timetabler** | Commercial SaaS | Built for **universities and colleges**. It is the reference point for what a full commercial university product offers. |

### 1.4 Systems considered but excluded

- **Generic calendars (Google Calendar, Microsoft Bookings) and LMS calendars (Moodle).** These are general calendar or booking tools. They have no data model for groups, teachers, rooms and time slots in a semester timetable, so comparing them on timetabling criteria would be unfair. We use them only as **targets for iCal export**, not as competitors.
- **Platonus (Kazakhstan).** This is a national university information system. Its website offers Russian, English and Kazakh and calls it an "automated information system for managing universities and colleges" [S21]. However, the public page does not describe a timetable module, so we could not assess it on our criteria. We say this openly instead of guessing.
- **Mimosa and others.** We left these out to keep the list at five systems that are well documented.

---

## 2. Comparison criteria

We use **9 criteria** (the committee asks for 6–10). Each one comes from a requirement of our users (students, teachers, administrators/schedulers at a Kazakhstani university).

| # | Criterion | Definition (what we check) | Why it matters for our users |
|---|-----------|----------------------------|------------------------------|
| C1 | **Deployment model** | Desktop application, web application, SaaS cloud, or a mix. | Students and teachers need access from any device without installing anything. Schedulers need a shared central copy, not files on one PC. |
| C2 | **Self-hosting & data ownership** | Can the university run it on its own servers and keep the database? | Universities in Kazakhstan often prefer to keep student data on their own infrastructure. A self-hosted database also allows direct integration. |
| C3 | **Licensing & cost** | Licence type, public price, free trial. | Budget is limited. Hidden or high prices make adoption hard. |
| C4 | **Automatic generation** | Can the system build a timetable automatically from constraints? | Saves scheduler time. For our project this is a core feature (supervisor feedback, `11`, #1). |
| C5 | **Conflict detection during manual edits** | When a scheduler moves or changes a class by hand, does the system detect teacher/room/group double-booking? | In practice most changes after the semester starts are manual. Conflicts that go unnoticed cause real double-bookings. |
| C6 | **Role-based access & self-service views** | Separate roles (student/teacher/admin), personal timetable views. | Students and teachers should see *their own* schedule. Only admins may edit. |
| C7 | **Mobile access** | Mobile app or a web UI documented as mobile-friendly. | Students mostly check the schedule on their phones. |
| C8 | **Integration: API & calendar export** | Documented API, iCal/ICS feed, PDF/CSV export. | Integration with the university portal and with personal calendars (Google/Outlook). |
| C9 | **Localization (Kazakh / Russian)** | Interface or documentation available in Kazakh and/or Russian. | The users are Kazakh- and Russian-speaking. |

*Note on "usability / learning curve".* We considered it as a criterion but dropped it. A fair, evidence-based usability rating would require our own user tests on each product, which is outside our scope. Vendor claims such as "user-friendly" are not evidence.

---

## 3. System overviews

### S1. aSc Timetables
aSc Timetables is a commercial timetable generator. It comes as a Windows application that "works without internet connection" and as an online version (EduPage) that runs on macOS, Windows, Linux and ChromiumOS with no installation. Several users can work on the same timetable at once, and data can be moved between the online and offline versions [S1][S2]. The vendor says the generator evaluates "over 5,000,000 possibilities". Timetables can be shared with teachers, students and parents, and substitution changes are "published on the website and mobile phones" with notifications to the people affected [S1]. When a lesson card is moved by hand, "the program checks for collisions of classes, teachers and classrooms". However, the program will still let the user place a card in a not-allowed position, and only marks it with a red stripe as a warning [S3]. No prices are shown on the official pricing page. The free trial "performs all the functions of the paid version apart from Export" and adds a watermark to printouts [S2]. An official Russian-language manual is published on the vendor's help site [S4]. We found no public API documentation.

### S2. FET (Free Timetabling Software)
FET is free software licensed under the **GNU AGPL v3**. It is "for automatically scheduling the timetable of a school, high-school or university" and usually solves a complex timetable in 5–20 minutes [S5]. It is a **desktop** Qt application for GNU/Linux, Windows and macOS. Timetables are exported "into HTML, XML and CSV formats". Its constraints include teacher and room "not available periods" and "not overlapping" activities. Russian is among its translations, Kazakh is not [S6]. The latest version at the time of writing is FET 7.12.0 (14 October 2026) [S5]. We found no mention of a web interface, user roles, a mobile app or iCal export.

### S3. Untis / WebUntis
Untis is a commercial platform for timetabling, a digital class register and school communication. **WebUntis** is its online extension, and the **Untis Mobile** app shows the timetable on smartphones [S7]. Untis builds several candidate timetables automatically, and "the scheduler selects the best timetable from several possibilities". Users "can schedule or change periods manually at any time", and an integrated **diagnosis tool** "shows any discrepancies in your timetable", "especially after manual editing" [S8]. A browser version, **vUntis**, needs no local installation [S8]. Teachers and students can publish a private **iCal** link. Administrators cannot. Student iCal feeds must be specially ordered, and the vendor warns they raise server load and may raise hosting charges [S9]. Products are offered "in over 35 languages", and pricing is quote-based with a 3-month free trial [S7]. The official site links to "interfaces" pages but gives no public API specification. Third-party developers say the JSON-RPC specification has to be requested from Untis [S10]. We treat that last point as unverified.

### S4. UniTime
UniTime is an open-source (**Apache 2.0**) university timetabling system and a sponsored project of the Apereo Foundation. It has "a user-friendly web-based interface" with distributed and centralized data entry. Its five modules are course timetabling, examination timetabling, student scheduling, instructor scheduling and event management [S11][S12]. On the **Class Assignment** screen, a scheduler changes a class's time and room by hand. The screen shows student conflicts, rooms already in use appear "in red and stroked through", and there is a list of conflict-checked instructors [S13]. The Suggestions screen lists conflicting assignments "together with the constraint that causes the conflict (such as room, instructor, ...)" [S14]. Students and instructors get a **Personal Schedule** page, and its iCalendar URL "always returns an up-to-date calendar" [S15]. An export servlet supports iCalendar, CSV, PDF and JSON with API-token authentication (documentation for v4.4, 2019) [S16]. The official build includes only English, Czech and Polish. Russian and Kazakh are not available [S17].

### S5. CELCAT Timetabler
CELCAT is "purpose-designed for universities and colleges", is used by over 200 institutions, and is "delivered as a modern SaaS service" with "no local infrastructure to manage" [S18]. It offers automated scheduling (the *Automated Premium* extension and exam scheduling) and aims at "clash-free schedules" [S18]. The UK G-Cloud 14 listing describes "interactive and automated timetabling" hosted on Microsoft Azure. It also lists a REST API with create/read/update/delete access controlled by user role, self-service portals for students, a design for mobile devices (back-office features excepted), and a price of **£48,815 per licence** with no free trial or educational discount [S19]. A university that uses CELCAT says its "dynamic clash-checking module ... not only eliminates clashes but suggests workable alternatives" [S20]. Universities publish personal timetables through the "CELCAT iCalendar Feed", which can be shown "on your phone, online calendar" [S22]. We found no information on Russian or Kazakh localization.

---

## 4. Comparison matrix

Legend: **✔** supported (documented) · **◐** partial / with limitations · **✖** not supported or not offered according to the source · **?** not stated / unverified

| Criterion | S1 aSc Timetables | S2 FET | S3 Untis / WebUntis | S4 UniTime | S5 CELCAT |
|-----------|-------------------|--------|---------------------|------------|-----------|
| **C1 Deployment** | ✔ Windows desktop + online (EduPage) [S1][S2] | ◐ Desktop only (Qt: Linux/Win/macOS). No web version mentioned [S6] | ✔ Desktop Untis + browser vUntis + WebUntis + mobile app [S7][S8] | ✔ Web application [S11] | ✔ SaaS on Azure [S18][S19] |
| **C2 Self-hosting & data ownership** | ◐ Desktop files are local. Online version hosting not stated [S1] | ✔ Runs locally. Data stays with the user (free software) [S5][S6] | ? Not stated. The iCal page mentions vendor "hosting charges", which suggests vendor hosting [S9] | ✔ Open source, installed by the institution [S11][S12] | ✖ SaaS, "no local infrastructure". No on-premise option mentioned [S18][S19] |
| **C3 Licensing & cost** | ◐ Commercial. Price not shown publicly. Free trial without Export [S2] | ✔ Free, AGPL v3 [S5] | ◐ Commercial, quote-based. 3-month trial [S7] | ✔ Free, Apache 2.0 [S11] | ✖ Commercial, £48,815 per licence, no trial (G-Cloud) [S19] |
| **C4 Automatic generation** | ✔ Generator [S1] | ✔ Core purpose [S5] | ✔ Optimisation, several candidate timetables [S8] | ✔ Course timetabling solver, "state-of-the-art algorithms" [S11] | ✔ Automated Premium extension, exam scheduling [S18] |
| **C5 Conflict detection on manual edits** | ◐ Checks class/teacher/room collisions, but lets you place a card in a not-allowed position with only a warning stripe [S3] | ? Not stated. Conflicts are handled as generator constraints [S6] | ◐ Diagnosis tool reports discrepancies after manual editing [S8] | ✔ Class Assignment shows student/room conflicts. Suggestions name the conflicting constraint [S13][S14] | ✔ "Dynamic clash-checking" with alternatives (university source) [S20] |
| **C6 Roles & self-service views** | ◐ Sharing with teachers, students, parents. Role model not documented [S1] | ✖ No user accounts or roles described. Output is exported files [S6] | ✔ Teachers, students, parents, administrators. iCal for teachers and students only [S7][S9] | ✔ Personal schedules for students/instructors. Permission-based lookup. Departmental managers [S12][S15] | ✔ Student self-service portals. API access by user role [S19] |
| **C7 Mobile access** | ✔ Mobile application [S1] | ? Not mentioned | ✔ Untis Mobile app [S7] | ? Not stated | ✔ "Designed for use on mobile devices" (back-office excluded) [S19] |
| **C8 API & calendar export** | ? Export is a paid feature. Formats and API not stated [S1][S2] | ◐ HTML/XML/CSV export. No API, no iCal mentioned [S6] | ◐ Personal iCal feed (student feeds on request). No public API spec [S9][S10] | ✔ iCalendar URL. Export servlet (ICS/CSV/PDF/JSON) with API token [S15][S16] | ✔ REST API (CRUD, JSON) and iCalendar feed [S19][S22] |
| **C9 Localization (KZ/RU)** | ◐ Russian manual published. Kazakh not found [S4] | ◐ Russian ✔, Kazakh ✖ [S6] | ? "Over 35 languages", but RU/KZ not confirmed [S7] | ✖ Only EN, CS, PL in official build [S17] | ? Not stated |

---

## 5. Analysis

### 5.1 Strengths of existing systems

- **Automatic generation is a mature feature.** All five systems have it (C4). aSc, FET and Untis are built around it. This confirms that generation is expected by users; our project does not try to beat these generators on solution quality, but to combine generation with the other criteria (Section 5.3).
- **Commercial products cover the full workflow.** Untis/WebUntis and CELCAT combine planning, publishing, mobile access and calendar feeds (C1, C6, C7, C8).
- **UniTime shows that an open-source web system can work at university scale.** It provides roles, personal schedules, iCal and an export API (C6, C8) under a free licence.

### 5.2 Limitations and gaps (supported by the matrix)

1. **No system has confirmed Kazakh-language support (C9).** FET and aSc have Russian resources. UniTime officially offers only English, Czech and Polish [S17]. Untis and CELCAT do not say which languages they offer.
2. **The free options are each incomplete for our case.** FET is a desktop generator with no web access, roles or iCal (C1, C6, C8). UniTime is web-based and rich in features, but it has no Russian or Kazakh interface and is a large Java system with five modules [S11][S12]. For a small faculty that only needs to *store, publish and safely edit* a timetable, it is likely too heavy (our judgement, not a measured fact).
3. **The commercial options are expensive or have no public price, and are often vendor-hosted (C2, C3).** CELCAT costs £48,815 per licence on G-Cloud and is SaaS only [S19]. aSc and Untis do not publish prices [S2][S7]. Untis may charge extra hosting for student iCal feeds [S9].
4. **Manual edits are not always strictly protected (C5).** aSc lets a card be placed in a not-allowed position with only a warning [S3]. Untis finds discrepancies with a diagnosis tool *after* manual editing [S8]. In both cases the documented behaviour is a warning in the user interface, not a guarantee that no conflict can be saved. (We do not claim to know how these products store data internally. We only describe their documented behaviour.)
5. **Open, documented integration is uneven (C8).** CELCAT (REST API) and UniTime (export servlet) document their APIs. For aSc we found no API, and the official Untis API specification is not publicly published [S10].

### 5.3 What no system covers well for our context

No single system that we reviewed combines **all** of the following:
**(a)** a free, lightweight, self-hosted web application,
**(b)** a Kazakh/Russian interface,
**(c)** a documented open REST API with iCal export, and
**(d)** conflict prevention that cannot be bypassed when the timetable is edited by hand, and
**(e)** automatic generation in the same web system, so that generated and hand-edited timetables pass the same checks.

UniTime comes closest on (a)(c)(d)(e) but fails (b) and is heavy. The commercial tools cover more features but fail (a). FET fails almost everything except generation.

In the documentation we reviewed ([S1]–[S22]) we did not find a way to enter constraints in natural language; constraints are entered through forms and dialogs. We did not test the products ourselves, so this describes the documentation, not a confirmed absence of the feature.

---

## 6. Justification of the proposed solution

### 6.1 What we reuse as ideas

- **Personal, subscribable timetables** (UniTime Personal Schedule, WebUntis/CELCAT iCal feeds) → our per-user iCal feed and PDF export.
- **Conflict feedback that names the cause** (UniTime Suggestions: "the constraint that causes the conflict") → our API returns which teacher/room/group is double-booked and with which class.
- **Separation of planning and publishing** (Untis vs. WebUntis) → admin editing UI vs. read-only student/teacher views.
- **Role-scoped API access** (CELCAT REST API by user role) → role-based access control on every REST endpoint.

### 6.2 What we do differently, and why

| Our design decision | Gap it addresses (Section 5.2) |
|---------------------|--------------------------------|
| **Automatic generation of the whole university timetable inside the web system** (CP-SAT), with the result saved as a draft and checked by the same conflict rules as manual edits | Section 5.3 (e); FET generates only on the desktop, without web access or roles |
| **AI assistant for constraints in natural language** (KZ/RU/EN), restricted to a validated schema and confirmed by the administrator | Section 5.3: not found in the reviewed documentation; lowers the modelling barrier described in `03`, [21], [22] |
| **Conflict prevention at the database level** (PostgreSQL constraints on teacher/room/group + time slot), plus friendly checks in the API and UI. An invalid timetable entry cannot be saved, even through the API. | Gap 4: UI-level warnings that can be bypassed or arrive after the edit |
| **Lightweight, self-hosted web stack** (PostgreSQL + FastAPI + React), deployable on one university server | Gaps 2, 3: heavy open-source alternative; costly or vendor-hosted commercial tools |
| **Open, documented REST API** (OpenAPI/Swagger generated by FastAPI) + **iCal and PDF export** | Gap 5: closed or undocumented APIs |
| **Kazakh / Russian / English interface** from the start | Gap 1: no confirmed Kazakh support |
| **Mobile-first responsive web UI** instead of a native app | Student phone access without app-store distribution |
| **Change notifications** to affected students/teachers | aSc and Untis show this is expected in practice [S1][S7] |

### 6.3 What we deliberately do not compete on

- **Generator quality against mature products.** aSc, FET, Untis, UniTime and CELCAT all have mature generators (C4), developed over many years. We build our own generator on CP-SAT, but we do not claim it will produce better timetables than these products; we compare it with a greedy baseline and with the manual process (`09`).
- **Full university management** (exams, attendance, enrolment, as in CELCAT and UniTime). This is out of scope.

**Conclusion.** The proposed system is not a "better aSc" or a "smaller CELCAT". Its value is narrower and, according to the evidence above, not covered by any single existing system: a **free, self-hosted, localized (KZ/RU) web system that generates the university timetable with AI, lets administrators state constraints in natural language, and stores, publishes and safely edits the timetable with database-enforced conflict prevention and an open REST API**.

---

## 7. Sources

All sources accessed **2026-10-18**.

1. [S1] aSc Timetables, official home page. https://www.asctimetables.com/
2. [S2] aSc Timetables, Prices / free trial page. https://www.asctimetables.com/a/prices
3. [S3] aSc TimeTables Online Help, "Moving the cards manually" (served via EduPage Help). https://help.edupage.org/?p=u1/u3/u65/t538&lang_id=1 (original link: https://help.asctimetables.com/text.php?id=538)
4. [S4] aSc Timetables, Russian-language user manual (PDF), official help site. https://help.asctimetables.com/pdf/asc_timetables_ru_P1.pdf
5. [S5] FET, official home page (licence, purpose, latest version). https://www.lalescu.ro/liviu/fet/
6. [S6] FET, Features page (platforms, export formats, constraints, translations). https://www.lalescu.ro/liviu/fet/features.html
7. [S7] Untis, official site (WebUntis, Untis Mobile, languages, trial). https://www.untis.at/en
8. [S8] Untis, "Untis timetable scheduling" product page (optimisation, manual editing, diagnosis tool, vUntis). https://www.untis.at/en/products/untis-timetable-scheduling ; see also https://www.untis.at/en/products/untis-timetabling
9. [S9] Untis WebHelp, "iCal calendar subscription". https://webhelp.untis.at/HTML/WebHelp/uk/untis/wu_ical_kalender_abonnement.htm
10. [S10] Third-party WebUntis API wrappers, statements on API documentation availability (unofficial). https://webuntis.noim.me/ ; https://cdn.jsdelivr.net/npm/untis-api-client@1.1.0/README.md
11. [S11] Apereo Foundation, UniTime project page. https://www.apereo.org/projects/unitime
12. [S12] UniTime, official home page. https://www.unitime.org/ ; source code: https://github.com/UniTime/unitime
13. [S13] UniTime Help, "Class Assignment". https://help.unitime.org/class-assignment
14. [S14] UniTime Help, "Suggestions". https://help.unitime.org/suggestions
15. [S15] UniTime Help, "Personal Schedule". https://help.unitime.org/personal-schedule
16. [S16] UniTime Help, "Exports" (v4.4, last updated April 2019). https://help.unitime.org/manuals/exports
17. [S17] UniTime Help, "Localization". https://help.unitime.org/localization
18. [S18] CELCAT, official home page. https://www.celcat.com/
19. [S19] UK Government Digital Marketplace, G-Cloud 14 listing "Celcat Timetabler". https://www.applytosupply.digitalmarketplace.service.gov.uk/g-cloud/services/849552944755278
20. [S20] The University of the West Indies, Mona, MITS "Time-Tabling" page. https://www.mona.uwi.edu/mits/time-tabling
21. [S21] Platonus, official site. https://platonus.kz/
22. [S22] University of the Arts London, "CELCAT iCalendar Feed" sign-up page. https://mytimetable.arts.ac.uk/CalendarFeed/
