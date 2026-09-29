# Operational leadership tracker: alignment review and confirmatory questions

Reviewed September 29, 2026. Scope: all eight supplied, single-page scanned PDFs, the current application entry point and feature code, the latest weekly release SQL in this checkout, and existing confirmed product decisions. This is a requirements review, not a live-environment reproduction or an implementation release.

**Superseded proposals:** the user's subsequent answers are recorded in [Confirmed direction and reconciliation](2026-09-29-confirmed-direction.md). That record controls: five planning levels including project plans; preceding-Friday commitments; approved metric totals; one enterprise-priority owner; COO-approved biannual/ad hoc publication without fixed product cadence; and no separate monthly leadership view. The 56-minus-35 comparison below is a net display-row difference, not 21 verified new KPIs. Questions below are retained as review history, not as unanswered requirements. A one-time development points reset was subsequently completed as documented in the confirmed record.

## Recommended sequence

First stabilize the weekly leadership routine: review prior commitments, record outcomes, stage next week's priorities and action items, review the complete draft, and submit with an unambiguous deadline. Follow with a small usability pass. Then reconcile the metric roster and reporting rules before expanding the architecture.

The intended outcome appears to be a traceable operating rhythm connecting strategy, department execution, leadership commitments, actual results, and decisions. This is an interpretation for confirmation, not a new approved specification.

The attached documents are reference evidence. Their handwritten proposals, crossed-out labels, sample values, and the generic Board example do not automatically supersede the user's confirmed decisions. The 56-metric example is explicitly illustrative. No sample values should become actual observations.

## Each image and its requirements implications

| Source | What the image supports | Required adjustment or decision |
| --- | --- | --- |
| `1.pdf` — Annual Scorecard | Ten reporting domains; monthly enterprise review; printed count of 56 metrics; actuals and colored signals. Illustrative values and missing baselines are explicitly disclosed. A handwritten note appears to request goals surfaced; its full wording is uncertain. Some bottom rows are obscured by the scan/watermark. | Reconcile this broader example against the current 35-measure annual roster. Show target, reporting basis, source date, and assessment context alongside actuals. Keep department detail accessible without automatically promoting every department measure into the annual scorecard. |
| `2.pdf` — Sample Board Dashboard | A generic governance example organized around mission, finance, fundraising, strategy, capacity, and risk; selected trends and discussion questions. | Treat this as a presentation and decision-support reference, not HDC's approved metric list. Decide the Board's curated subset, commentary, publication cadence, and access. Published Board snapshots are an existing intended feature, documented as unfinished. |
| `3.pdf` — Finance and Community Relations notes | Finance includes cash, NOI, receivables, current ratio, deferred fees, vacancy loss, payment timeliness, controllable costs, occupancy, financial-close timeliness, and diverse spend. CR includes contributions, retention, renewal growth, grant success/yield, Board giving, capital raised, media and engagement. | Most labels already exist in the department catalog. Finish owner definitions: count versus dollars versus rate; parent versus property scope; denominators; deadlines; source; cadence. Keep grant success and grant yield distinct. Some handwritten date/threshold wording is uncertain and must not be inferred as approved. |
| `4.pdf` — 2030 Plan Scorecard | Five pillars, Sustain/Grow/Shift structure, nineteen long-term KPIs, targets and progress bars. Handwritten edits change parts of the status legend, including “at risk” and “not started.” | Preserve the strategic structure already represented in code. Separate target attainment from assessment of pace toward 2030. Confirm status vocabulary; missing data or an undefined target is different from work not started. The printed annual-review footer conflicts with the cadence notes in `kpi-7.pdf`. |
| `kpi-5.pdf` — Pipeline, Talent, Resident Impact, Enterprise Priorities | Pipeline stages and on-track/total projects; HR survey/leadership measures; resident outcomes; priority health and milestones. Several labels are crossed out or abbreviated. | Define projects versus units, stage entry/exit rules, CO milestone, and the population for the project denominator. Confirm separate resident outcomes and HR denominators. Enterprise-priority health needs an agreed relationship to milestones and weekly updates; a count of completed actions cannot automatically become an outcome KPI. |
| `kpi-6.pdf` — Advocacy, Brand, Operations, Financial Health | Policymaker engagement, policy wins, participants, op-eds; stories collected/shared, positive mentions, followers, donors; CRM and Compass engagement; cybersecurity; philanthropy benchmark and revenue diversity. | Split distinct measures where needed, notably stories collected/shared and CRM/Compass adoption. Assign accountable positions across departments. Define what qualifies as engagement, a policy win or positive coverage. Composite scores and external benchmarks need explicit methods and sources. |
| `kpi-7.pdf` — Enterprise structure, cadence and pillar notes | “4 levels”; limited visualization; KPI measurement cadence; strategic updates quarterly and reports “bi-annually”; annual monthly reporting; department weekly review; a 2025 baseline annotation beside pillar measures. | Confirm the four levels and the place of projects. Configure collection, review, and publication separately. Confirm that “bi-annually” means twice per year. Use 2025 only where it is the approved baseline for a particular KPI. A weekly workplan review should not require a new monthly/annual KPI observation every week. |
| `kpi-8.pdf` — Revenue and Portfolio Performance | Fee and contributed-revenue categories; noncompliance, collections, vacancy, excess cash, fee payment and vacancy loss. | Clarify fee earned versus deferred fee paid, excess cash owed versus received, and revenue categories versus the three-stream strategic mix. Reuse an observation across displays only when definition, period, scope and accounting basis are identical. Preserve earlier confirmed revenue mappings unless expressly changed. |

Sources are located in `../images-alignment/`. All eight pages were rendered and visually inspected. Unclear or obscured handwriting remains unconfirmed.

## Stabilization work before architectural expansion

### S1. Advance submission for the correct execution week

**Evidence:** `supabase/releases/20260925_departmental_priorities.sql:273` explicitly rejects a finalized submission before that week's Monday opening. `weekly_boundaries` sets Friday 17:00 and the following Monday 09:00 relative to the selected execution week. The earlier confirmed contract also describes this same-week cycle. The reported error therefore matches a rule in the checkout, although the deployed state was not inspected in this review.

**Adjustment:** distinguish the week the work will happen from the window in which leaders commit to it. Confirm whether Friday's deadline concerns the upcoming Monday or the current week. Do not simply remove the opening guard while leaving deadline, grace, points and enrollment inconsistent.

**Acceptance:** for the week of October 5, a valid submission made Friday October 2 at the agreed cutoff succeeds, appears under October 5 after refresh, and has exactly one correct scoring result. Verify exact cutoff, grace, time zone/DST, retries, advance-planning limit, and changes across the year boundary. Decide treatment of any first-week submissions or penalties affected by the old rule.

### S2. Prior commitments and recorded outcomes

**Evidence:** the current weekly UI already has a date input and a submitted team rollup. Prior-week availability is therefore not wholly absent in the code. However, priority progress is only On track / Watch / Off track, with no distinct completed/outcome field. Action items have their own completion statuses. After grace, the same save endpoint requires Director/Admin authority and a correction reason, so an ordinary outcome update is treated like a historical correction. The exact cause of the tester's inability to view history still needs reproduction with their role/week.

**Adjustment:** provide explicit Last week / This week / Next week navigation, show the original committed text, and allow an authorized owner to record actual result and outcome separately. Preserve commitment history and scoring. A deliberate correction to what was committed should remain distinguishable from a normal result update.

**Acceptance:** a leader opens last week's committed submission, records an outcome, refreshes and sees it in both their own and permitted shared views. The original commitment, first submission time and points remain intact. Verify access boundaries. Carry-forward selects unfinished priorities/action items without duplicating finished work; currently the code carries every prior priority and filters only completed/cancelled action items.

### S3. Review all staged priorities and action items

**Evidence:** draft action items render inside priority forms, but the current team rollup reads only submitted snapshots. There is no separate summary of the complete staged submission. The tester's “cannot see staged items” report may involve discoverability, another view, or lost state; it is not proof that draft fields do not exist.

**Adjustment:** add a review step showing all enterprise and departmental priorities, their desired results, alignment, owners, due dates, risks, and nested action items. Give each item an Edit action and make draft/submitted state explicit. Continue saving drafts separately from publication.

**Acceptance:** stage multiple enterprise and department priorities and multiple actions, review all of them, edit/remove an item, save, reload, and submit the complete record. Invalid or failed submissions retain the entered work. No draft leaks into a submitted-only audience. A successful whole-week submission produces one revision and one scoring outcome.

### S4. Modest UX polish

- Put execution week, commitment deadline/time zone, position and submission state together at the top.
- Offer visible previous/current/next-week controls and a clearly labeled history path.
- Use compact priority summaries with expandable action details and a persistent review/submit area.
- Show unsaved changes, saved draft, submitted, and unpublished edits as distinct text states.
- Put validation beside the relevant fields; move focus to errors; preserve keyboard access and text status labels.
- Show correction controls only for actual corrections. Keep routine outcome updates understandable.

No navigation redesign is needed to validate this stabilization pass.

## Base requirements for the subsequent iteration

1. **A confirmed hierarchy and evidence path.** Strategy/pillars, annual reporting, department workplans and weekly commitments should connect through stable references. Confirm whether projects/milestones are another planning level or supporting detail. The annual scorecard is a reporting surface; it should not need duplicate input for an identical source measure.
2. **Separate commitment, execution and measurement.** Weekly submission state, priority outcome, action status, KPI actual, KPI health and data freshness describe different things. Keep submission points separate from delivery performance and enterprise outcomes.
3. **An approved metric register.** Each active metric needs a definition, owner position, source, unit, scope, cadence, baseline where applicable, target, calculation, aggregation rule and surface membership. Many catalog entries currently have null cadence, unit or owner; their presence is not a finished measurement workflow.
4. **Explicit time interpretation.** Distinguish monthly actuals, year-to-date flows, point-in-time balances and cumulative strategic progress. The current scorecards read the selected month; they do not yet establish all these reporting modes. Rates, stocks and flows require different aggregation rules.
5. **Defensible status.** The current target comparator returns On track when a final target is met, otherwise Watch; the group rule uses the most adverse assessed member and requires complete green coverage for green. This is not a defined schedule-based assessment of progress toward 2030. Agree thresholds, milestone expectations, reviewer authority and the treatment of stale/unreported measures.
6. **Department ownership with cross-department visibility.** Preserve position-based accountability and prior confirmed treatment of Advocacy and Operations as tracking areas. Preserve independent department resident satisfaction and controllable-cost measures; do not force a new shared denominator.
7. **Governed leadership reporting.** A monthly operating scorecard and an Executive-published Board snapshot serve different review needs. Reports need as-of dates, contextual notes, evidence and the decisions/support requested, with authorized detail access.
8. **Simple routine entry.** Leaders should be able to update the required period and explain exceptions without configuring formulas or searching through all metrics. Put definition work in setup, keep charts selective, and expose deeper evidence on demand.

## Confirmatory questions

### Decisions needed for the immediate fixes

1. **Which Friday is the commitment deadline?** For work beginning Monday October 5, should the deadline be Friday October 2 at 5 PM Eastern, or Friday October 9? How early may a submission be finalized, and where does grace end? Recommendation: if this is advance planning, label both execution week and preceding-Friday deadline explicitly.
2. **What counts as a priority outcome, and who may update it?** Are Completed, Partially completed, Not completed, and Cancelled suitable, with a short actual-result note and a separate carry-forward action? Recommendation: allow assigned leaders to record results after week-end; reserve correction reasons for changing the original commitment. Confirm any outcome-update deadline.
3. **Is submission one complete package per position/week?** Should users see and edit every staged enterprise/department priority and nested action before one Submit action? Recommendation: yes; allow partial drafts and preserve existing role-based draft visibility.
4. **Should points remain a measure of timely commitment only?** Recommendation: outcome updates earn no additional points and do not alter the original timing score. Should any first-week penalties caused by the timing rule be reviewed for an audited correction?

### Decisions that guide the larger iteration

5. **Are the four operating levels 2030 strategy, annual enterprise scorecard, department workplans, and weekly priorities?** Should project plans/milestones sit inside that structure as linked delivery detail, or have a separate planning level?
6. **Which metric roster is authoritative now?** Does the 56-metric illustrative annual sheet replace the currently approved 35 measures, or are the handwritten lists mostly department detail? Recommendation: reconcile additions, removals and renamed measures explicitly; preserve prior confirmed decisions until changed.
7. **Is the intended cadence weekly workplan review, monthly annual-scorecard review, quarterly strategic updates and twice-yearly strategic publication?** Does the existing quarterly Board-snapshot intention remain, or change to twice yearly? Collection cadence may differ by metric.
8. **What should the selected reporting period mean for each kind of metric?** Should leaders see current month, year to date, latest observation or cumulative 2026–2030 progress? Is 2025 the baseline only for growth measures, or for additional strategic comparisons? Recommendation: define the basis per measure and display it.
9. **Which status vocabulary and rules should leaders use?** Do the annotations mean On track / At risk / Behind / Not started? Should No data, Awaiting target and Stale remain separate? Who determines pillar health when different KPIs disagree? Recommendation: do not equate an unmet 2030 target today with being behind schedule.
10. **What determines enterprise-priority health?** Is it an accountable owner's reviewed assessment supported by milestones and weekly evidence, or a computed rule? Recommendation: retain weekly updates as evidence; show milestone completion and initiative health separately.
11. **Can we assign metric-definition decisions to accountable owners?** Finance: parent/property scope, fee earned/paid and excess cash owed/received; RED: projects/units, pipeline stages, CO and LIHTC categories; HR/Resident Services: populations and denominators; CR/Advocacy: engagement, grant success/yield, stories, donors, benchmark and composite definitions. Recommendation: use one concise definition worksheet per owner instead of guessing formulas.
12. **How much detail should leaders enter in Compass?** Monthly department totals with a source reference, or individual property/project/engagement records? Recommendation: start with approved aggregates and evidence unless record-level entry is necessary for a decision or reliable calculation. This is a major architecture boundary.
13. **Should one saved observation feed multiple reporting surfaces when its definition matches exactly?** Recommendation: yes, while preserving independent departmental measures and the approved revenue bindings. Confirm whether collected/shared stories and CRM/Compass engagement must be separate measures.
14. **What must the Board report help decide?** Which exceptions, trends, risks, commentary and requests for action belong in the published snapshot, and who signs it off? Recommendation: use the sample's hierarchy and discussion prompts without importing its generic mission, metrics or values.

## Existing decisions to preserve unless explicitly revised

- One weekly obligation and points balance per accountable position, independent of overlapping roles.
- America/New_York server-authoritative time with DST; the commitment-window placement is now the question.
- Separate draft and submitted views, retained revisions and scoped permissions.
- Independent departmental satisfaction and controllable-cost measures.
- Advocacy and Operations are cross-department tracking areas.
- Previously confirmed revenue stream bindings and avoidance of contribution double-counting.
- Stable strategic identities and latest confirmed strategy wording.

Relevant records: `docs/mvp/access-and-launch-contract.md`, `docs/mvp/confirmed-metric-clarifications.md`, `docs/mvp/weekly-interaction-and-import.md`, and `docs/mvp/rollups-admin-handoff.md`. These include historical implementation notes; current code was used to distinguish proposed from implemented behavior. Application entry: `src/bootstrap.js`; weekly form: `src/features/weekly-accountability/view.js`; annual roster: `src/features/scorecards/annual2026.js`; current rollup rules: `src/features/scorecards/rollups.js`.
