# Literature Review

**Project:** Development of a Class Schedule Management System
**Team:** Zeyin Abdikassym (backend), Nurzhaina Kuralbay (frontend)

This chapter reviews the sources relevant to a web-based system that generates university class schedules with AI methods and stores, publishes and edits them. It asks three questions, which the committee also uses for evaluation: *what approaches exist*, *what is already known*, and *which limitations our project takes into account*.

---

## 1. Scope and search method

**Databases and sources searched.** Google Scholar, IEEE Xplore, ScienceDirect (Elsevier), SpringerLink, ACM Digital Library, arXiv, RePEc/IDEAS and university repositories (for open-access copies). For technical standards we used the official documentation sites: PostgreSQL, Google OR-Tools, the OpenAPI Initiative, OWASP and W3C.

**Search keywords (combined with AND/OR):** "university course timetabling", "educational timetabling survey", "International Timetabling Competition 2019", "metaheuristic timetabling", "integer programming / MaxSAT / CP-SAT timetabling", "minimal perturbation timetabling", "system usability scale", "REST API design", "RESTful API testing", "role-based access control", "exclusion constraint range types", "API security", "large language models optimization modeling", "natural language to optimization formulation", "LLM hallucination survey". Proceedings of NeurIPS and ICML (PMLR) were added to the databases for the AI part.

**Inclusion criteria.**
- Peer-reviewed journal or conference papers, or official specifications and documentation from the organisation that maintains the standard or tool.
- Directly relevant to at least one part of the system: the timetabling problem and its constraints, how timetables are solved or repaired, usability, web/API architecture, data integrity, or security.
- Published 2021–2026 for fast-moving topics (solvers, benchmarks, API practice, security guidance). Older works were kept only if they are foundational and still widely cited: the timetabling surveys of 1999 and 2002, REST (2000), RBAC (1996), and two later works on schedule repair and usability measurement.

**Exclusion criteria.** Non-peer-reviewed blogs and vendor marketing. Student theses, unless no peer-reviewed alternative existed (none were needed in the end). Papers we could not verify bibliographically (title, authors, venue and DOI/URL). Papers about other scheduling domains (nurse rostering, sports) with no transfer to course timetabling.

**Result.** 24 sources are used: **18 scientific publications** (13 journal articles, 3 conference papers, 1 doctoral dissertation, 1 magazine-style peer-reviewed article in *IEEE Computer*), **1 standard textbook** and **5 official technical documents**. 12 of the 18 scientific works are from 2021–2026. All 5 technical documents are current versions.

*Version note (2026-10-22).* After the supervisor's comment that automatic generation and AI are mandatory (`11-supervisor-feedback.md`, #1), sources [21]–[24] were added (section 2.7) and the implications in sections 2.2, 4 and 5 were updated: generation is now a core feature, not a stretch goal.

---

## 2. Thematic review

### 2.1 The university course timetabling problem and its constraints

The foundational survey by Schaerf [1] defines the three classic educational timetabling problems: school timetabling, course timetabling and examination timetabling. It describes course timetabling as assigning lectures to time periods (and rooms) so that conflicts between courses sharing students or teachers are avoided. Schaerf separates **hard constraints**, which must hold for a timetable to be feasible (no teacher, room or student group in two places at once; room capacity), from **soft constraints**, which express preferences and quality (compactness, teacher preferences, spreading lectures over the week). Burke and Petrovic [2] keep this distinction. They add that real university timetabling is a **multi-criteria decision problem**, where the relative weight of soft constraints differs between institutions and stakeholders.

Two decades later, Ceschia, Di Gaspero and Schaerf [4] review educational timetabling through its **standard formulations and benchmark datasets**. They select six formulations and collect the best known results for each. They also stress *reproducibility*: published results are often hard to compare because formulations and instances differ slightly. Chen et al. [3] reach a similar conclusion for course timetabling only. Abdipoor et al. [5] restate that the problem is **NP-hard** because of the large number of constraints and the huge search space. The most realistic formulation today is the one from the International Timetabling Competition 2019 (ITC 2019), described by Müller, Rudová and Müllerová [6]. It was built from real university data and, for the first time, combines **student sectioning** (assigning individual students to class sections) with time and room assignment, across 30 real-world instances.

**Critical comparison.** The early surveys [1], [2] describe the problem conceptually. The recent works [4], [6] focus on precise, machine-readable formulations and benchmarks. All authors agree on the same core hard constraints: teacher, room and group conflicts plus room capacity. They differ in how many institution-specific soft constraints they model. One limitation is shared by all of them: they treat timetabling as a one-time *construction* task. The everyday *maintenance* of a published timetable gets far less attention.

**Implication for our project.** The core hard constraints found in every source (teacher, room and group double-booking, and room capacity) are exactly what our generator must *satisfy* and our editor must *detect*. Soft constraints vary between institutions [2], so the generator optimises them with weights that the administrator can change, and in manual editing they stay warnings, not blocking errors. Our data model (groups, teachers, rooms, courses, time slots, teaching load, schedule entries) follows the entities used in the standard formulations [4], [6], so the same data feeds both the solver and the web views.

### 2.2 Solution approaches: exact methods vs. heuristics and metaheuristics

Two families of methods dominate the literature.

**Heuristics and metaheuristics.** Chen et al. [3] classify recent course-timetabling methods by publication date and dataset. They report that **metaheuristics are the most popular approach**, with hybrid methods close behind and hyper-heuristics also giving effective results. Abdipoor et al. [5] review metaheuristics in more depth (population-based and single-solution methods) and propose a classification of hybrid metaheuristics. They also analyse the strengths and limitations of these methods and list open challenges. Weaknesses commonly noted for metaheuristics are that they depend on parameter tuning, give no proof of optimality, and are often evaluated only on specific benchmark sets. Burke and Petrovic [2] had already described heuristic, evolutionary and case-based reasoning methods twenty years earlier, so this direction has a long history.

**Exact and declarative methods.** Integer programming (IP/MIP), Boolean satisfiability (SAT/MaxSAT) and constraint programming (CP) describe the problem declaratively and leave the search to a general-purpose solver. Holm et al. [7] propose a graph-based MIP formulation for ITC 2019 that uses conflict graphs and a data-reduction step. It became the state-of-the-art MIP model for that competition, but many of the 30 instances remain hard to solve to optimality. Lemos, Monteiro and Lynce [8] built *UniCorT*, which combines preprocessing, a MaxSAT solver and local search, and was one of the five ITC 2019 finalists. Most recently, Moreira and Freitas [9] use Google's **CP-SAT** solver [17] with a *room-wise decomposition*: each room is solved as a subproblem, and instructor clashes across rooms are prevented by a global blocking mechanism. On 11 real instances from a large Brazilian university (up to 6,278 lectures), they solved the largest instance in 4.45 s with 89.6% preference satisfaction. They also note that their fallback mode guarantees full coverage *at the cost of possibly creating instructor conflicts*.

**Critical comparison.** Metaheuristics [3], [5] are flexible and scale well, but they need tuning and give no guarantee of optimality. Exact methods [7], [8] give bounds or proofs, but they can be slow on large instances and need modelling expertise. Hybrids and decompositions [8], [9] try to get the best of both. None of these works evaluates its solver *inside* a production information system with real administrators, and the reported speed comes from benchmark runs, not from day-to-day use.

**Implication for our project.** Automatic generation is a core feature. We do not design a new metaheuristic, which would need the tuning effort described in [5]. Instead we model the problem declaratively for **CP-SAT** [17], the most practical choice for a two-person team: it has a free, documented Python API, it handles hard constraints declaratively and optimises a weighted objective for soft constraints, and recent work [9] shows it can solve realistic university instances in seconds. For the whole university we follow the idea of decomposition from [9]: faculties are solved in turn, while rooms and teachers already used by other faculties are blocked, so shared resources stay consistent. A simple greedy generator is implemented as a baseline for comparison. Because generators can still produce conflicts in fallback modes [9], **the conflict detector in our system is the final authority**. Every timetable, whether generated or edited by hand, passes through the same validation before it is published.

### 2.3 Timetabling software in practice, editing, and usability

A recurring finding is the **gap between research and practice**. Chen et al. [3] state that state-of-the-art methods are rarely used in real-world settings, possibly because they are not flexible enough. Müller et al. [6] partly address this: the ITC 2019 instances were built from real-world university data (the authors are connected with the UniTime timetabling system), which brings competition research closer to real university needs.

In practice, a timetable is not built once and then frozen. Rooms become unavailable and teachers are replaced during the semester. Phillips et al. [10] formalise this as the **minimal perturbation problem**: when a change makes the timetable infeasible, repair it with as few changes as possible to the rest, because every move affects students and staff who already rely on the published schedule. The authors of UniCorT [8] have also worked on minimal perturbation with MaxSAT, which shows that this concern is active in current research. This turns the focus from "find the best timetable" to "keep the existing timetable correct while it is being edited", which is exactly the situation of a dean's office administrator.

**Usability.** The optimisation literature [3]–[9] rarely evaluates how end users interact with timetables. To measure perceived usability in a standard, comparable way, Lewis [11] reviews the **System Usability Scale (SUS)**. It is a short ten-item questionnaire created in the 1980s. Lewis reviews its history, its psychometric properties and how its scores can be interpreted, which makes it a well-established instrument for comparing a system against others. Accessibility for all students, including those using screen readers or mobile devices, is defined by **WCAG 2.2** [20].

**Critical comparison.** The optimisation papers [7]–[9] measure success with objective scores (penalty values, run time). Users of a schedule system care about other things: finding their lessons quickly, trusting that the schedule is current, and, for administrators, being warned before they make a mistake. Phillips et al. [10] are among the few to model the cost of *changing* a timetable, but they do not study the user interface. The literature we reviewed contains little peer-reviewed evidence on the usability of student-facing timetable viewers, so we treat this area as under-researched.

**Implication for our project.** (1) Besides full generation at the start of a term, we support **incremental editing with immediate conflict feedback** and **partial regeneration with locked lessons**, because this matches the maintenance scenario described in [10]; the number of changed lessons is reported. (2) We will evaluate the prototype with the SUS questionnaire [11] with students, teachers and at least one administrator, and report the score against published benchmarks. (3) The React frontend will follow WCAG 2.2 level AA criteria [20] (contrast, keyboard navigation, responsive layout for phones).

### 2.4 Architecture of web-based information systems and REST API design

Fielding's dissertation [12] defines **REST** as a set of architectural constraints: client–server, statelessness, cacheability, a uniform interface, a layered system, and optional code-on-demand. It explains how each constraint produces properties such as scalability and independent evolution of client and server. In practice, many APIs called "RESTful" follow these constraints only partly. Neumann, Laranjeiro and Bernardino [13] analysed 500 public APIs of popular websites. JSON support and generated documentation were widespread, but design was very diverse, and **only 0.8% of the services fully complied with all REST principles** they checked. Golmohammadi, Zhang and Arcuri [14] surveyed 92 articles on **testing RESTful APIs** and found growing research interest since 2017. Automated test generation for REST APIs typically works from a machine-readable API description such as **OpenAPI** [18]. The OpenAPI Specification [18] is a language-neutral standard format for describing HTTP APIs, so that people and tools can understand a service without reading its source code.

**Critical comparison.** Fielding [12] is normative: it says what REST *should* be. Neumann et al. [13] show what developers actually do. Golmohammadi et al. [14] show why a formal description matters for quality assurance. A limitation of [13] is that it studies large public APIs, not internal institutional systems. Still, its main lesson applies to us: consistency and documentation matter more than strict REST purity.

**Implication for our project.** Our backend is a stateless REST API with resource-oriented URLs (`/groups`, `/teachers`, `/rooms`, `/schedule-entries`) and consistent JSON error formats. FastAPI generates an **OpenAPI 3.1** description [18] automatically from the Python code. This gives (a) a contract between the backend and frontend developers, (b) interactive documentation for external systems such as an LMS or mobile apps, and (c) a basis for automated API testing as described in [14]. Docker containerisation makes the deployment reproducible, but it is an engineering choice and not a research contribution.

### 2.5 Data integrity and conflict detection

The timetabling literature [1], [4], [6] defines conflicts as overlapping assignments of the same resource. In a multi-user web system, checking this only in application code can fail when two administrators save overlapping entries at the same moment (a race condition). PostgreSQL offers a declarative solution. With **range types** and **exclusion constraints** (`EXCLUDE USING GIST (room WITH =, during WITH &&)`, using the `btree_gist` extension), the database itself rejects any row whose time range overlaps another row for the same room [16]. The official documentation uses exactly a room-reservation example.

**Critical comparison.** Solver papers [7]–[9] check conflicts inside the optimisation model. That is the right place during generation, but it does not protect data that is later edited by hand. Database constraints [16] protect integrity at all times, but they only produce a generic error. They do not explain to the user *which* entry causes the conflict, and they cannot express soft preferences.

**Implication for our project.** We use **two layers of conflict detection**. (1) An application-level check in FastAPI, run before saving, returns a readable explanation ("Teacher X already teaches group Y in room Z at this slot") so the frontend can show it. (2) PostgreSQL exclusion constraints on teacher, room and group [16] act as the final safety net against concurrent writes. Soft constraints stay as warnings in the application layer only.

### 2.6 Security and access control

Sandhu et al. [15] introduced the RBAC96 family of **role-based access control** models. Permissions are assigned to roles and users are assigned to roles, which simplifies administration compared with assigning permissions to each user. It remains the conceptual basis of access control in most information systems. For web APIs specifically, the **OWASP API Security Top 10 (2023)** [19] lists the most critical risks. The top one is **Broken Object Level Authorization**, followed by Broken Authentication, Broken Object Property Level Authorization and **Broken Function Level Authorization**, the last of which covers unclear separation between administrative and regular functions.

**Critical comparison.** RBAC [15] is a model, not an implementation guide. OWASP [19] is practice-oriented but not peer-reviewed. Used together, they cover both "who may do what" and "how this typically goes wrong in APIs". RBAC alone cannot express rules such as "a department scheduler may edit only their own faculty's entries". That would need role constraints or attribute-based checks.

**Implication for our project.** We define a small set of roles (guest/student, teacher, scheduler/administrator), following [15]. Every write endpoint checks both the role (function-level authorisation, OWASP API5) and, where relevant, ownership of the object (object-level authorisation, OWASP API1) [19]. Authentication uses tokens with expiry, and requests are rate-limited (OWASP API4). Public, read-only schedule viewing does not require login, because the schedule is not confidential information.

### 2.7 Artificial intelligence: constraint solving and large language models

**Timetabling as an AI problem.** Constraint satisfaction is one of the classic areas of artificial intelligence. Russell and Norvig [24] describe a constraint satisfaction problem (CSP) as a set of variables, domains and constraints, solved by search with constraint propagation and heuristics. Timetabling fits this form directly: each lesson is a variable, its domain is the set of (day, slot, room) options, and conflicts are constraints. Schaerf's survey [1] was published in *Artificial Intelligence Review*, and solvers such as CP-SAT [17] combine constraint propagation, SAT techniques and search. In this sense, the generator of our system is itself an AI component.

**Large language models and optimisation modelling.** The main obstacle to using solvers is not the solver but the *modelling*: someone has to translate a real-world description into variables and constraints. The NL4Opt competition [21] was created "to increase the accessibility and usability of optimization solvers by allowing non-experts to interface with them using natural language". It splits the task into recognising the entities of an optimisation problem in text and generating a formal representation for a solver. OptiMUS [22] goes further: an LLM-based agent formulates (mixed integer) linear programs from natural-language descriptions, writes and debugs solver code and evaluates the solutions; the authors report that it outperforms previous methods by more than 20% on easy datasets and more than 30% on hard ones. Their motivation matches our domain: most optimisation problems "are still solved heuristically by hand" because of the expertise needed to formulate them.

**Reliability.** LLMs can produce fluent text that is not supported by the input. Ji et al. [23] survey this **hallucination** problem in natural language generation, its causes, metrics and mitigation methods. For a timetable, a hallucinated constraint (a wrong teacher, a wrong day) is worse than no constraint at all.

**Critical comparison.** NL4Opt [21] and OptiMUS [22] let the LLM produce the whole model, and they are evaluated on benchmark word problems, not on a deployed system with real users. Both report accuracy well below 100%, so a fully automatic text-to-solver pipeline is not safe for a university timetable. Constraint solvers [17], [24], on the other hand, are exact about the constraints they receive but cannot read human wishes.

**Implication for our project.** We combine the two kinds of AI and give each the part it is good at. (1) The **CP-SAT generator** [17], [24] searches for the timetable and guarantees the hard constraints. (2) An **LLM assistant** handles only the language part: it converts wishes written in Kazakh, Russian or English ("Ivanov does not teach on Friday afternoon") into constraints of a **small fixed schema**, not into solver code as in [22]. Each constraint is validated against the reference data and confirmed by the administrator before it reaches the solver, which follows from the hallucination risk described in [23]. The assistant also explains infeasibility and quality reports in plain language using only facts from the solver report. The accuracy of the parser is measured on a labelled test set, following the evaluation idea of [21].

---

## 3. Structured analysis table

| # | Reference (short) | Year | Type | Problem addressed | Method / approach | Key findings | Limitations | Relevance to our project |
|---|---|---|---|---|---|---|---|---|
| 1 | Schaerf, *A survey of automated timetabling* | 1999 | Journal (AI Review) | Defining school, course and exam timetabling | Literature survey of formulations and algorithms | Classic hard/soft constraint distinction; course timetabling = avoid conflicts between courses sharing students/teachers | Pre-dates modern solvers and benchmarks | Foundational definitions of the conflicts our system detects |
| 2 | Burke & Petrovic, *Recent research directions in automated timetabling* | 2002 | Journal (EJOR) | Directions in university timetabling research | Survey of heuristic, evolutionary, multi-criteria and case-based methods | Timetabling is multi-criteria; weights depend on institution | Focused on one research group's work; older | Justifies treating soft constraints as configurable warnings |
| 3 | Chen et al., *A survey of UCTP: perspectives, trends and opportunities* | 2021 | Journal (IEEE Access) | State of UCTP methods | Systematic survey by date and dataset | Metaheuristics most popular; hybrids next; state-of-the-art rarely used in practice | Mainly benchmark-oriented; little on deployment | Evidence of the research–practice gap our system targets |
| 4 | Ceschia, Di Gaspero & Schaerf, *Educational timetabling: problems, benchmarks, state-of-the-art* | 2023 | Journal (EJOR, invited review) | Standard formulations and comparability | Review of six formulations, datasets and best-known results | Clear formal problem definitions; reproducibility issues | Does not address end-user software | Guides our data model so a solver can be added later |
| 5 | Abdipoor et al., *Meta-heuristic approaches for the UCTP* | 2023 | Journal (Intelligent Systems with Applications) | Metaheuristics for UCTP | Systematic review; classification of hybrid metaheuristics | UCTP is NP-hard; metaheuristics perform well on benchmarks | Parameter tuning, no optimality guarantee, benchmark-specific | Explains why we use a declarative solver instead of hand-crafting a metaheuristic |
| 6 | Müller, Rudová & Müllerová, *Real-world UCT at ITC 2019* | 2024/2025 | Journal (J. Scheduling) | Realistic benchmark for university timetabling | Competition design using real university (UniTime) data | First to combine student sectioning with time and room assignment; 30 real instances | Very complex formulation; beyond typical small faculties | Shows real data structures; supports our entity model |
| 7 | Holm et al., *Graph-based MIP formulation of ITC 2019* | 2022 | Journal (J. Scheduling) | Exact solving of ITC 2019 | MIP with conflict graphs and data reduction | New state-of-the-art MIP for ITC 2019 | Many instances still hard to solve to optimality | Shows limits of exact methods on large instances |
| 8 | Lemos, Monteiro & Lynce, *UniCorT* | 2022 | Journal (J. Scheduling) | Solving ITC 2019 | Preprocessing + MaxSAT + local search | ITC 2019 finalist; hybrid exact/heuristic works well | Tailored to ITC format | Example of a hybrid solver as a separate component |
| 9 | Moreira & Freitas, *Room-wise CP-SAT decomposition* | 2026 | Conference (SEMISH/SBC) | Fast timetabling for a real university | CP-SAT per room + global instructor blocking + repair | 6,278 lectures solved in 4.45 s; 89.6% preferences met | Fallback may create instructor conflicts; one institution | Supports CP-SAT and decomposition for our generator; shows the need for independent validation |
| 10 | Phillips et al., *IP for minimal perturbation in UCT* | 2017 | Journal (Annals of OR) | Repairing a timetable after changes | Integer programming minimising changes | Repairs infeasibility while limiting disruption | Older; tested on one university's data | Supports incremental editing with conflict feedback |
| 11 | Lewis, *The System Usability Scale: past, present, future* | 2018 | Journal (IJHCI) | Measuring perceived usability | Review of SUS research | SUS is short, well-established and has a long research record supporting score interpretation | Measures perception, not task efficiency | Our usability evaluation method |
| 12 | Fielding, *Architectural styles … (REST)* | 2000 | Doctoral dissertation (UC Irvine) | Architecture of the Web | Derivation of REST from architectural constraints | Statelessness, uniform interface, cacheability, etc. | Normative; many details left to implementers | Basis of our API design |
| 13 | Neumann, Laranjeiro & Bernardino, *Analysis of public REST APIs* | 2021 | Journal (IEEE TSC) | How REST is applied in practice | Empirical analysis of 500 public APIs | Only 0.8% fully REST-compliant; JSON and generated docs common | Public APIs only, not institutional systems | Motivates consistent conventions and generated docs |
| 14 | Golmohammadi, Zhang & Arcuri, *Testing RESTful APIs: a survey* | 2023 | Journal (ACM TOSEM) | Testing of REST APIs | Survey of 92 articles | Growing field since 2017; open challenges remain in automated REST API testing | Research tools, not all production-ready | Justifies OpenAPI contract and API tests |
| 15 | Sandhu et al., *Role-based access control models* | 1996 | Peer-reviewed magazine (IEEE Computer) | Access control administration | RBAC96 family of reference models | Permissions to roles, users to roles | No fine-grained/object-level rules | Our role model (student, teacher, admin) |
| 16 | PostgreSQL Docs, *Range types / exclusion constraints* | 2025 (v18) | Official docs | Preventing overlapping bookings in the DB | `EXCLUDE USING GIST` with range types | Database rejects overlapping room reservations | Generic error messages; hard constraints only | Final safety net for conflict detection |
| 17 | Google OR-Tools, *CP-SAT Solver* | current | Official docs | Constraint/integer optimisation | CP-SAT solver with Python API | Faster than MPSolver for integer problems; reports feasibility status | Requires integer modelling expertise | Engine of our timetable generator |
| 18 | OpenAPI Initiative, *OpenAPI Specification 3.1.0* | 2021 | Specification | Describing HTTP APIs | Language-neutral, machine-readable API description | Enables docs, client generation, testing | Describes, but does not enforce, good design | API contract generated by FastAPI |
| 19 | OWASP, *API Security Top 10 – 2023* | 2023 | Industry standard | Most critical API security risks | Expert/community risk ranking | BOLA, broken authentication and function-level authorisation are top risks | Not peer-reviewed; general, not domain-specific | Security checklist for our endpoints |
| 20 | W3C, *WCAG 2.2* | 2023 (rev. 2024) | W3C Recommendation | Web accessibility | Testable success criteria (A/AA/AAA) | International accessibility baseline | Conformance testing takes effort | Accessibility target for the React UI |
| 21 | Ramamonjison et al., *NL4Opt Competition* | 2023 | Conference (NeurIPS 2022 Competition Track, PMLR) | Formulating optimisation problems from natural language | Shared tasks: entity recognition + generation of a formal representation; LP word-problem dataset | Natural language can make solvers accessible to non-experts; task split into recognition and formulation | Linear programs only; benchmark word problems | Basis of our text-to-constraint assistant and its accuracy test set |
| 22 | Ahmaditeshnizi, Gao & Udell, *OptiMUS* | 2024 | Conference (ICML, PMLR) | LLM agent for optimisation modelling | LLM formulates MILP, writes and debugs solver code, evaluates solutions | > 20% (easy) and > 30% (hard datasets) better than previous methods | Accuracy below 100%; LLM writes the whole model | Shows LLM + solver is feasible; we restrict the LLM to a fixed constraint schema |
| 23 | Ji et al., *Survey of hallucination in NLG* | 2023 | Journal (ACM Computing Surveys) | Unfaithful LLM output | Survey of causes, metrics, mitigation | Hallucination is common across NLG tasks; mitigation and evaluation methods exist | General NLG, not optimisation | Justifies schema validation and human confirmation of LLM output |
| 24 | Russell & Norvig, *Artificial Intelligence: A Modern Approach* (ch. "Constraint Satisfaction Problems") | 2021 (4th ed.) | Textbook | Foundations of AI | CSP definition, propagation, backtracking search, local search | Constraint satisfaction is a core AI method | Textbook, not new research | Positions the generator as an AI component |

---

## 4. Research gap and how the project addresses it

The literature leaves the following gap:

1. **Optimisation focus vs. information-system focus.** Most recent scientific work [3]–[9] tries to improve solution quality or speed on benchmark instances. Very few papers describe *the information system around the timetable*: how data is stored, published, searched, edited and protected. Chen et al. [3] explicitly note that state-of-the-art methods are rarely used in practice.
2. **Construction vs. maintenance.** Research mostly addresses building a timetable from scratch. Ongoing editing during the semester, which is the daily work of administrators, is covered by a smaller line of work on minimal perturbation [10], and that work does not address the user interface or multi-user data integrity.
3. **Validation of generated timetables.** Even modern generators can return timetables with conflicts in fallback modes [9]. This shows the need for an independent, always-on validation layer.
4. **Little user-centred evidence.** The timetabling papers we reviewed rarely evaluate usability with students and teachers, although standard instruments such as SUS [11] and WCAG [20] exist.
5. **Modelling barrier.** Solvers need formal constraints, but schedulers express wishes in natural language. LLM-based modelling [21], [22] lowers this barrier, but its output is not fully reliable [23], and it has not been evaluated inside a timetabling information system.

**How our project addresses the gap.** We do not claim a new optimisation algorithm. Our contribution is an engineering one, built on evidence from the literature: an **open, documented system** that (a) **generates the university timetable automatically** with a CP-SAT model of the hard and soft constraints [9], [17], [24], decomposed by faculty with shared resources kept consistent, and compares it with a greedy baseline; (b) lets the administrator enter constraints in natural language through an **LLM assistant** restricted to a fixed, validated schema with human confirmation [21]–[23]; (c) stores timetable data centrally in a relational model aligned with standard formulations [4], [6]; (d) supports **incremental editing and partial regeneration with two-layer conflict detection**, with readable application-level checks plus PostgreSQL exclusion constraints [16], so that the maintenance scenario of [10] is handled safely; (e) gives students and teachers fast search and filtering on any device, following WCAG 2.2 [20]; and (f) exposes a REST API with an OpenAPI contract [12], [13], [18], secured by RBAC [15] and the OWASP API Top 10 [19]. The system will be evaluated with generator quality and run-time benchmarks, parser accuracy, a SUS survey [11] and functional tests of conflict detection.

---

## 5. Limitations the project takes into account

- **No claim of optimality.** Following [3], [5], [7], the generator aims for *feasible* timetables that satisfy all hard constraints and good soft-constraint scores within a time limit, not proven optimal ones. Decomposition by faculty makes the whole-university run tractable but may give a worse result than solving everything at once.
- **LLM accuracy.** Following [21]–[23], the assistant will make mistakes. It is limited to a fixed schema, its output is validated and confirmed by a person, and its accuracy is reported on a test set, not assumed.
- **Simplified problem model.** We model teacher, room and group conflicts plus room capacity. We do not model student sectioning at the level of individual students, as ITC 2019 does [6], or multi-week patterns beyond a simple weekly or two-week cycle. Soft constraints are warnings only.
- **Single institution, small scale.** Our test data and user evaluation come from one university and a limited number of participants. SUS results [11] give an indication of usability, not a statistically general conclusion.
- **Database-level checks cover only hard constraints.** Exclusion constraints [16] cannot express preferences, and their raw errors are not user-friendly. This is why we add the application-level check layer.
- **RBAC granularity.** Plain RBAC [15] does not cover faculty-specific editing rights. If they are needed, we will add ownership checks in the API rather than a full attribute-based access control model.
- **Security scope.** We follow the OWASP API Top 10 [19] as a checklist. A formal penetration test is outside the scope of a bachelor project.
- **Integration.** The OpenAPI contract [18] makes integration with an LMS or calendar possible, but actual integration with university systems depends on institutional access and is left for future work.

---

## References

[1] A. Schaerf, "A survey of automated timetabling," *Artificial Intelligence Review*, vol. 13, no. 2, pp. 87–127, 1999, doi: 10.1023/A:1006576209967.

[2] E. K. Burke and S. Petrovic, "Recent research directions in automated timetabling," *European Journal of Operational Research*, vol. 140, no. 2, pp. 266–280, 2002, doi: 10.1016/S0377-2217(02)00069-3.

[3] M. C. Chen, S. N. Sze, S. L. Goh, N. R. Sabar, and G. Kendall, "A survey of university course timetabling problem: Perspectives, trends and opportunities," *IEEE Access*, vol. 9, pp. 106515–106529, 2021, doi: 10.1109/ACCESS.2021.3100613.

[4] S. Ceschia, L. Di Gaspero, and A. Schaerf, "Educational timetabling: Problems, benchmarks, and state-of-the-art results," *European Journal of Operational Research*, vol. 308, no. 1, pp. 1–18, 2023, doi: 10.1016/j.ejor.2022.07.011.

[5] S. Abdipoor, R. Yaakob, S. L. Goh, and S. Abdullah, "Meta-heuristic approaches for the University Course Timetabling Problem," *Intelligent Systems with Applications*, vol. 19, Art. no. 200253, 2023, doi: 10.1016/j.iswa.2023.200253.

[6] T. Müller, H. Rudová, and Z. Müllerová, "Real-world university course timetabling at the International Timetabling Competition 2019," *Journal of Scheduling*, vol. 28, no. 2, pp. 247–267, 2025 (online 2024), doi: 10.1007/s10951-023-00801-w.

[7] D. S. Holm, R. Ø. Mikkelsen, M. Sørensen, and T. J. R. Stidsen, "A graph-based MIP formulation of the International Timetabling Competition 2019," *Journal of Scheduling*, vol. 25, no. 4, pp. 405–428, 2022, doi: 10.1007/s10951-022-00724-y.

[8] A. Lemos, P. T. Monteiro, and I. Lynce, "Introducing UniCorT: An iterative university course timetabling tool with MaxSAT," *Journal of Scheduling*, vol. 25, no. 4, pp. 371–390, 2022, doi: 10.1007/s10951-021-00695-6.

[9] É. J. B. Moreira and S. A. A. de Freitas, "Fast university timetabling via room-wise CP-SAT decomposition and incremental repair," in *Anais do Seminário Integrado de Software e Hardware (SEMISH)*, Gramado, Brazil: Sociedade Brasileira de Computação, 2026, pp. 346–357, doi: 10.5753/semish.2026.20823.

[10] A. E. Phillips, C. G. Walker, M. Ehrgott, and D. M. Ryan, "Integer programming for minimal perturbation problems in university course timetabling," *Annals of Operations Research*, vol. 252, no. 2, pp. 283–304, 2017, doi: 10.1007/s10479-015-2094-z.

[11] J. R. Lewis, "The System Usability Scale: Past, present, and future," *International Journal of Human–Computer Interaction*, vol. 34, no. 7, pp. 577–590, 2018, doi: 10.1080/10447318.2018.1455307.

[12] R. T. Fielding, "Architectural styles and the design of network-based software architectures," Ph.D. dissertation, Dept. Inf. Comput. Sci., Univ. of California, Irvine, CA, USA, 2000. [Online]. Available: https://ics.uci.edu/~fielding/pubs/dissertation/top.htm

[13] A. Neumann, N. Laranjeiro, and J. Bernardino, "An analysis of public REST web service APIs," *IEEE Transactions on Services Computing*, vol. 14, no. 4, pp. 957–970, 2021, doi: 10.1109/TSC.2018.2847344.

[14] A. Golmohammadi, M. Zhang, and A. Arcuri, "Testing RESTful APIs: A survey," *ACM Transactions on Software Engineering and Methodology*, vol. 33, no. 1, 2023, doi: 10.1145/3617175.

[15] R. S. Sandhu, E. J. Coyne, H. L. Feinstein, and C. E. Youman, "Role-based access control models," *Computer*, vol. 29, no. 2, pp. 38–47, 1996, doi: 10.1109/2.485845.

[16] PostgreSQL Global Development Group, "Range types — 8.17.10 Constraints on ranges," *PostgreSQL 18 Documentation*. [Online]. Available: https://www.postgresql.org/docs/current/rangetypes.html (accessed Oct. 18, 2026).

[17] Google, "CP-SAT solver," *OR-Tools Documentation*. [Online]. Available: https://developers.google.com/optimization/cp/cp_solver (accessed Oct. 18, 2026).

[18] OpenAPI Initiative, "OpenAPI Specification v3.1.0," Feb. 15, 2021. [Online]. Available: https://spec.openapis.org/oas/v3.1.0

[19] OWASP Foundation, "OWASP API Security Top 10 – 2023." [Online]. Available: https://owasp.org/API-Security/editions/2023/en/0x11-t10/ (accessed Oct. 18, 2026).

[20] A. Campbell, C. Adams, R. Bradley Montgomery, M. Cooper, and A. Kirkpatrick, Eds., "Web Content Accessibility Guidelines (WCAG) 2.2," W3C Recommendation, Dec. 12, 2024. [Online]. Available: https://www.w3.org/TR/WCAG22/

[21] R. Ramamonjison, T. Yu, R. Li, H. Li, G. Carenini, B. Ghaddar, S. He, M. Mostajabdaveh, A. Banitalebi-Dehkordi, Z. Zhou, and Y. Zhang, "NL4Opt competition: Formulating optimization problems based on their natural language descriptions," in *Proc. NeurIPS 2022 Competition Track*, PMLR, vol. 220, pp. 189–203, 2023. [Online]. Available: https://proceedings.mlr.press/v220/ramamonjison23a.html

[22] A. Ahmaditeshnizi, W. Gao, and M. Udell, "OptiMUS: Scalable optimization modeling with (MI)LP solvers and large language models," in *Proc. 41st Int. Conf. Machine Learning (ICML)*, PMLR, vol. 235, pp. 577–596, 2024. [Online]. Available: https://proceedings.mlr.press/v235/ahmaditeshnizi24a.html

[23] Z. Ji, N. Lee, R. Frieske, T. Yu, D. Su, Y. Xu, E. Ishii, Y. J. Bang, A. Madotto, and P. Fung, "Survey of hallucination in natural language generation," *ACM Computing Surveys*, vol. 55, no. 12, pp. 1–38, 2023, doi: 10.1145/3571730.

[24] S. Russell and P. Norvig, *Artificial Intelligence: A Modern Approach*, 4th ed. Hoboken, NJ, USA: Pearson, 2021, ch. 6 "Constraint Satisfaction Problems".
