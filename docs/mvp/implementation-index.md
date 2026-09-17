# Compass MVP implementation index

Prepared September 14, 2026. Planning estimate; no implementation or deployment is authorized by this document itself.

## Current checkpoint

The estimates and baseline findings below describe the original planning stage, not the remaining workload. Hosted Microsoft sign-in, metric persistence, weekly drafts/submissions/scoring, scorecard rollups, Admin management and audited View as user are now implemented; frontend deployment status follows the deployed `dev` commit.

Next: reconcile existing seed data, then import positions/departments, Q3 enterprise priorities, department objectives, 2026 KPI definitions and approved formulas, followed by linked weekly actions. Preserve source IDs and make repeated imports update or skip the same record rather than create duplicates. Historical weekly imports need explicit provenance and scoring treatment; the ordinary submission endpoint rejects weeks before the tracking start date. Do not invent missing formulas or submission times.

Positions are now independently manageable, including vacancies without an email or Auth account. Admin configures position roles, navigation and scorecard access, and assigns metric read/write permissions to multiple positions per reporting department. Account assignments remain many-to-many, with a default and selectable working position. Weekly records and points retain their position/week identity through renaming and handoffs. Individual restrictions can narrow access; System Admin remains an explicit account privilege. The database release and account-connection function are deployed to development; deploy the matching frontend before using the new controls. Admin assignment changes remain undated controls, with an audit history of who changed them and when.

Live collaboration is pending: private change notifications should trigger authorized refetches, preserve dirty forms, and retain revision checks. Reconcile on reconnect; a notification does not grant access or replace conflict handling. Checklist and finding workflows are deferred.

## Outcome and estimate

A testable MVP connects five planning surfaces to one persisted data model: 2030 Strategic Plan, Annual Scorecard, Department Workplans, Project Plans, and Weekly Accountability. A tester can create and approve work, enter actual results, submit a week, switch test positions, and verify the same records in another session. Scores, permissions, history, and rollups must survive refresh and cannot depend on browser-local data.

Estimated implementation and validation effort:

- Packaging and cleanup alone: **8–13 focused engineering hours**, included in the full estimate. This covers code organization, shared styling, copy cleanup, build/test entrypoints, and basic accessibility work; it does not deliver the backend.
- Complete MVP: **50–80 focused engineering hours**, roughly **6–10 eight-hour working days** for one implementation stream. These are planning ranges, not measured task timings or a promise of autonomous elapsed completion.
- First connected testing release: **18–28 hours**, a subset of the full estimate, after the database target and access are working. It covers position access, one complete persisted planning path, weekly submissions/capacity, and a real team rollup. Full scorecard editing, approval coverage, and scoring hardening follow.
- This-week delivery is realistic for that first connected release if environment recovery is prompt. The complete MVP this week is a stretch target, not a reliable commitment. External access/approval delays and extensive historical data repair are outside these effort ranges.

## Evidence behind the estimate

1. `public/scorecard-demo/index.html` combines data fixtures, string-rendered components, navigation and drill-through logic. Weekly logic is separated into two scripts but remains a browser-only system.
2. The current prototype has 19 strategic metrics and 37 annual metrics. The executive summary expects more than 50 annual metrics. The remaining definitions and targets are a content dependency, not something to fabricate.
3. Prototype positions are derived from role-title strings; project IDs are reused as initiative IDs. The weekly validator currently requires those IDs to be equal. This must become actual relationships supporting multiple projects per tactic and multiple contributions to an outcome.
4. `dev` uses mock records/localStorage in `src/context/OperatingDataContext.jsx`; `main` contains Supabase adapters, authentication and table-backed loading. There are substantial differences between the branches. Reuse selected code; do not merge the branches wholesale to recover a backend.
5. `main:src/api/supabaseData.js` loads 26 datasets together, including unrelated property/contact/huddle data. Replace that dependency with queries scoped to each MVP surface and period.
6. The intended Supabase project is linked and reachable, but its migration history is empty and the weekly/priority API endpoints return `PGRST205`. Treat it as a clean development bootstrap until a schema inventory proves otherwise.
7. Prototype tests cover DST boundaries, on-time rewards, opt-outs, grace deductions, missed deductions, idempotency, draft snapshots, carry-forward and initiative drill-through. They remain browser-level regression cases and do not replace database transaction, permission, or concurrency tests.

## 1. Work breakdown and dependency order

Hours are additive, include implementation and relevant verification, and assume reusing the existing React/Vite stack.

| ID | Work package | Required deliverables | Depends on | Hours |
| --- | --- | --- | --- | --- |
| MVP-01 | Dev environment and source baseline | Confirm branch and Supabase project; restore reachable isolated database; reconcile migration history; check existing data before edits; preserve rollback path | Access | 3–6 |
| MVP-02 | Domain model and workflow decisions | Relationship map, canonical vocabulary, permissions matrix, KPI definitions, scoring and submission rules | 01 | 4–6 |
| MVP-03 | Migrations and database contracts | Additive schema, constraints, indexes, RLS, submission transaction, seed fixtures, database acceptance tests | 01–02 | 6–10 |
| MVP-04 | Code packaging and shared UI | Feature modules, reusable components/tokens, routing, typed contracts or JSDoc, query boundaries, build/test scripts | 02 | 5–8 |
| MVP-05 | Identity and position access | Stable positions, occupant mapping, dev test-position selection, server-enforced permissions, session handling | 03–04 | 3–5 |
| MVP-06 | Scorecards and KPI entry | Both live scorecards, title-bar status signals, initiative registry drill-through, actual/target editor, reporting periods, missing/stale data states | 03–05 | 5–8 |
| MVP-07 | Workplans and project plans | Department tactic CRUD, alignment, ownership, milestones, approval/return flow; linked project CRUD and delivery details | 03–05 | 6–9 |
| MVP-08 | Weekly input and task workflow | Drafts, submission/revision, capacity declaration, priorities/tasks, reorder, carry-forward, history, error/conflict handling | 03–05, project links from 07 | 5–8 |
| MVP-09 | Rollups and position points | Submitted team views, metric reconciliation, server timestamps, versioned rules, unique ledger events, annual review | 02–03, 06–08 | 4–6 |
| MVP-10 | Product copy and accessibility | Strip prototype narration, unify terminology, keyboard/focus/labels/status text, responsive layouts, readable forms | 04–09 | 3–5 |
| MVP-11 | Integration testing and release package | Multi-session tests, permission/concurrency checks, migration smoke test, Vercel dev release, smoke checks, tester script, developer runbook | All | 6–9 |
| | **Total** | | | **50–80** |

## 2. Surface-to-component map

| Surface | Proposed components | Reuse / replacement | Completion test |
| --- | --- | --- | --- |
| Shared navigation | `AppShell`, `PlanningNav`, `PeriodSelect`, `PositionMenu` | Adapt existing layout/routing; retain the new visual styling | Five destinations, direct URLs, browser Back, selected position and period remain coherent |
| 2030 Strategic Plan | `StrategicScorecard`, `PillarCard`, `HealthSignals`, `MetricRow`, `MetricDetails`, `StrategyDetails` | Port the prototype's visuals; reuse strategic reference content after verification | Five pillars and their true KPI records; drill into goals, strategies and objectives |
| Annual Scorecard | `AnnualScorecard`, `DomainCard`, shared metric components, `InitiativeStatusList`, `MetricValueForm` | Port prototype; replace fixed values/statuses with query results | Ten domains, actuals and targets by period; initiative numerator/denominator agree with the displayed list |
| Department Workplans | `DepartmentWorkplan`, `TacticList`, `TacticForm`, `MilestoneEditor`, `ApprovalPanel` | Extract useful existing workplan validation and fields, not the entire old screen | Create aligned tactic, designate one accountable position, return/revise/approve workplan, retain history |
| Project Plans | `ProjectList`, `ProjectDetails`, `ProjectForm`, `DeliverableList`, `ProjectMilestones` | Replace the current fixed drill-through narrative with real records | Multiple projects can support a tactic; scope, team, deliverables, dates and risks persist |
| Weekly Accountability | `WeeklyWorkspace`, `CapacityChoice`, `PriorityEditor`, `ActionItemEditor`, `SubmissionControls` | Adapt old weekly field semantics and prototype layout; replace direct DOM rendering/localStorage | Save a draft, submit, edit/resubmit, reload from another session, carry work forward |
| Leadership review | `WeeklyRollup`, `PositionSubmissionRow`, `SubmissionHistory`, `AnnualPositionReview` | Promote prototype read views into period-scoped queries | Missing, capacity-only, on-time and late records are distinguishable and auditable |
| Shared primitives | `StatusBadge`, `ProgressBar`, `DetailDrawer`, `Field`, `EmptyState`, `ErrorState`, `SaveStatus` | Consolidate once; avoid parallel MUI and custom implementations of the same control | One visual language, text plus color, stable keyboard/focus behavior, consistent error messages |

## 3. Data model and schema adjustments

These are conceptual entities; final physical tables should reuse suitable existing tables rather than duplicate them.

### Organization and accountability

- Organizations and departments: retain stable tenant IDs.
- Positions: stable identity independent of display title; a renamed position must not lose history.
- Position assignments: profile/account, position, effective start/end, and authorization. Support occupant turnover and acting/delegated roles without transferring accountability history incorrectly.
- Keep authenticated actor and accountable position as distinct fields on changes/submissions.

### Strategy and scorecards

- Strategic plan, pillars, goals, strategies and enterprise objectives: preserve the supplied topology; validate whether goals and strategies are sibling classifications under pillars or a strict parent-child chain before enforcing a relationship.
- Annual scorecard and its ten domains: separate from the pillar tree. A domain is a reporting category, not a department or strategic pillar.
- Metrics: definition, unit, owner, polarity, cadence, aggregation method, source, display order and active status.
- Metric targets: year/period-specific target, baseline where meaningful, thresholds, and effective dates.
- Metric observations: recorded period, actual, provenance, entered-by actor, revision/audit fields. Distinguish zero, missing, pending target and stale data.
- Metric contribution links: associate department KPIs, tactics and project evidence with enterprise metrics without assuming they can be summed.
- Enterprise initiative registry: explicitly identifies the priorities included in the annual initiative count, their status and accountable position. Do not manufacture one initiative per annual domain.

### Planning and delivery

- Annual department workplans with approval state/history.
- Tactics linked to enterprise objectives, one accountable position, department KPIs, month-based start/end dates and quarterly milestones.
- Project plans linked to tactics, with separate IDs, scope, outcomes, supporting positions, deliverables, dates and risks. One tactic can have several project plans.
- Decide whether project-plan approval is independent of workplan approval. The references describe both; do not collapse them into health status.
- Retain ID mappings for any old record import. Do not silently overwrite existing database data with fixtures.

### Weekly records and scoring

- Weekly reporting period: organization, week start/end, timezone, deadline, review/lock state.
- Position submission: one per position/week, capacity choice/context, draft revision, first-submitted time, last-updated time and actor. Zero-entry capacity declarations must be valid.
- Weekly priorities: ranked entries, project link, desired result, health, due date, support request and carry-forward lineage.
- Action items: priority parent, assignee position, status, due/completion dates and carry-forward lineage.
- Submitted revisions: preserve what leadership reviewed separately from a person's next draft.
- Score policy versions: start balance, penalty rules, effective dates and approved amounts.
- Score ledger: unique position/week/rule event, amount/policy snapshot, source submission, actor/system provenance and reversal support. Balance is derived; a browser must not be able to write its own score.
- Expected participation: establish which positions owe a report each week and how vacancies/leave/exemptions are represented. A missing submission cannot be inferred solely from rows that already exist.

### Database integrity

- Foreign keys and same-organization checks for all linked records.
- Unique position/week submission and stable rank rules; transactional reordering.
- Server-owned first-submission timestamps and transactional publication of the submission, priorities, tasks and scoring event.
- Optimistic concurrency/revision checks so one editor does not silently overwrite another.
- Index the access patterns: organization + year/period, department, position, parent record and active status.
- Database-enforced authorization, separate test identities and a scoped dev environment. A name/position switcher is a testing convenience, not an authorization mechanism for live records.

## 4. Mathematical and workflow decision register

| Area | Established requirement | Decision or implementation still needed |
| --- | --- | --- |
| Submission cycle | Monday 12 a.m. through Friday 5 p.m. in the organization timezone | Server derives report timestamps with IANA/DST handling |
| On-time priority | A real enterprise priority submitted by Friday 5 p.m. | +5 points; requires at least one linked enterprise priority |
| On-time opt-out | People may explicitly declare no enterprise priority this week | 0 points; neutral and still counts as submitted |
| Grace window | Friday after 5 p.m. through Monday 9 a.m. | -3 points for the first valid submission in this window |
| Missed | No valid submission when Monday 9 a.m. passes | -10 points, assessed once by a server job/function |
| Edit behavior | People may iterate before the deadline | 0 edit penalty; one weekly ledger key prevents duplicate score events |
| Starting points | 100 per position | Carries forward; no automatic reset is currently defined |
| Carry-forward | Points carry forward and are evaluated yearly by position | Annual reporting groups activity without resetting the lifetime balance |
| Submission timing | Server records the first valid submission | Ordinary revisions preserve the first timestamp and immutable snapshots |
| Point calculation | Start less established deductions | `balance = 100 + sum(signed ledger events)`; year review separates opening balance, annual changes and closing balance |
| Initiative count | List all tracked priorities and color each status | `on_track_count / tracked_count`; agree archived/completed/pending treatment, handle empty denominator explicitly |
| KPI bars | Show actual relative to target | Define per-metric interpretation: higher/lower is better, ceiling usage, target range and negative/zero targets; preserve raw values even if bar length is capped |
| Annual actuals | Reviewed monthly on annual horizon | Stocks use latest observation; flows may sum; rates often need weighted numerators/denominators. Do not average percentages indiscriminately |
| Pillar/domain health | Color signals on cards and title bars | Agree explicit health rule or recorded review judgment, thresholds, stale-data behavior and documented overrides. Do not average color codes |
| Delivery vs outcomes | Weekly work supports strategy | Task completion is execution evidence, not automatic revenue/resident-impact/KPI attainment |
| Carry work forward | Keep history while planning next week | Preserve lineage, avoid duplicate copies, handle completed/cancelled work and due dates deliberately; don't automatically turn carried work amber without an agreed rule |
| Approval and locking | COO review before workplan activation | Define return/revise/reapprove, amendments to approved work, locked-week corrections and audit visibility |

## 5. Intentional code organization

Recommended structure, retaining React/Vite and the existing package manager:

```text
src/
  app/                 routes, providers, shell, environment configuration
  components/ui/       status, cards, drawers, form fields, loading/error states
  features/
    strategy/
    scorecards/
    workplans/
    projects/
    weekly/
    accountability/    scoring and annual position review
    identity/
  domain/              shared types, validation and pure calculation functions
  data/                database client, row adapters, query/mutation functions
  styles/              tokens and shared styling
supabase/
  migrations/
  tests/
test/
  domain/
  integration/
  ui/
```

- Use the existing React Query dependency for server data, targeted invalidation and period-scoped loading. Context remains for session/view preferences, not a second copy of the database.
- Replace global script variables, giant HTML template strings and whole-page re-rendering with named, readable components and state.
- Keep calculation/validation code outside UI components. Test behavior and boundary conditions, not implementation details.
- Use one API naming convention and one status adapter. Avoid treating legacy `steady/watch/alert` and new `good/watch/risk` as separate business concepts.
- Prefer explicit types for the new data boundary; a whole-repository TypeScript conversion is not required for this MVP.
- Load the requested screen's data rather than every old feature at startup. Remove unused routes from the MVP bundle and lazy-load secondary screens where useful.
- Consolidate lint, formatting, build and test commands; include the new `.mjs` tests in a normal verification command. They are not currently included in the old `npm test` JSX glob.
- Keep fixtures in a separate dev seed module. Remove fake tokens and mock-data fallbacks from the connected path. localStorage may hold preferences, not authoritative submissions, scores or permissions.
- Remove tracked generated build artifacts from source control deliberately, keep reproducible builds, and document environment setup, migrations, seed/reset boundaries and release/rollback steps.

## 6. Copy and human accessibility

Product copy:

- Remove repeated “demo,” “prototype,” “illustrative,” browser-storage explanations, and implementation commentary from normal screens.
- Use product language: “Position,” “Weekly priorities,” “Submit week,” “Saved,” “Needs attention,” “Supporting work.”
- Keep at most a discreet development-environment indicator outside task content; identify seeded data in setup/admin documentation so fixture values are not mistaken for approved results.
- Replace hard-coded July 2027 snapshots and fixed dates with selected reporting periods. Use the final agreed status vocabulary everywhere.
- Explain actions/errors at the point of use; success messages follow confirmed server saves.

Interaction accessibility:

- Keyboard navigation, visible focus, predictable drawer return focus, Escape/Back behavior and properly announced dialogs.
- Every signal uses text as well as color. Verify contrast on navy headers, status badges and muted labels.
- Proper tab/navigation semantics, labeled fields, grouped radios, field-level errors and live save/error announcements.
- Preserve focus/cursor during edits; no full form recreation on keystrokes.
- Reordering through buttons as well as any drag gesture.
- Responsive forms/tables, 200% zoom, comfortable touch targets and reduced-motion support.
- Human-readable component/file names, short functions, documented business decisions and examples in the developer runbook.

## 7. This-week execution sequence

1. **Database gate and baseline:** identify the correct project/migration history and prove a small authenticated create/read/update flow before schema expansion.
2. **Connected vertical slice:** one real position, objective, tactic and project; save and submit weekly priorities or a capacity declaration; verify the rollup in a second session. Release this for early user testing.
3. **Complete planning surfaces:** workplan/project authoring and approvals; connect both scorecards and KPI entry; reconcile the initiative count/list.
4. **Scoring and annual review:** apply agreed policy through server transactions and a ledger; verify time boundaries, retries, position turnover and year boundaries.
5. **Accessibility and release hardening:** remove demo narration, complete error/empty/loading states, run integration/permission checks, and deploy the scoped dev app with a tester guide.

## 8. Full MVP acceptance criteria

- All five surfaces are reachable and operate on shared database records.
- The supplied strategic structure and all agreed annual metric definitions are loaded; absent values are honestly shown as pending.
- A department can author a tactic and route its workplan through approval; approved work can be traced through projects to weekly commitments.
- A position can create, edit, rank and carry priorities/tasks forward, submit with or without enterprise capacity, and see correct history after refresh or another session.
- Leadership sees real submitted rollups with missing and capacity-only states separated.
- Scorecard numbers reconcile with their source records; status summaries reconcile with the same data used by cards/lists.
- Deadline, scoring and permissions are enforced server-side; repeats/concurrent submissions do not duplicate points or records.
- Relevant inaccessible-state, keyboard, zoom, small-screen, loading and error cases pass.
- The dev deployment, environment instructions, migration sequence, test commands, basic audit/error visibility and rollback process are documented and reproducible.

## 9. Deferred beyond this MVP

Teams notifications/cards, Captain Compass AI authoring, elaborate rewards/leaderboards, a broad reporting builder, unrelated property/contact/huddle features, enterprise SSO rollout, extensive historical cleanup and full offline synchronization. Basic task support notes, KPI entry, history, approval, traceability and permissions are part of the MVP rather than optional extras.

## 10. Inputs that unlock the schedule

- Confirmed development database bootstrap and successful application of the baseline migration chain.
- Approved strategic/objective mapping, authoritative annual metric inventory and targets, and position roster.
- Authorized exception/reversal process, participation exemptions, future score floor, and group-health rules. Milestone badges are deferred.
- Confirmed dev deployment target and the testers' expected access. Preserve the old Compass as a comparison reference.

These decisions can be consolidated into one short review. Environment work, component packaging and fixtures can proceed while business-rule answers are being finalized, but scores and rollups should not ship with unexplained assumptions.
