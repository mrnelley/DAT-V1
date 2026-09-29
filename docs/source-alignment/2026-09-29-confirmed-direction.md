# Confirmed direction and reconciliation - September 29, 2026

This record captures the user's answers to the 12 questions in the chat response. It supersedes conflicting proposals in the earlier alignment review and older requirements documents. Requirements recorded here are not all implemented.

## Confirmed decisions

1. Weekly commitments for Monday October 5 are due Friday October 2 at 5 PM America/New_York: the Friday before the execution week. Opening-window and grace details were not separately answered.
2. Priority outcomes: Completed, Partially completed, Not completed, Cancelled; an actual-result note; and a separate carry-forward action. Assigned leaders can record normal results after week-end, while corrections to original commitments remain distinct.
3. One complete submission per position/week, with review/edit of all staged enterprise and departmental priorities and nested action items before submission. Partial drafts remain supported.
4. Reset points. Applied to the linked development database on September 29: every one of 15 position balances is 100. Eleven original score records were preserved in the audit history before their point contributions were neutralized. Twenty-one weekly records and eight revisions were retained unchanged. This is a one-time reset, not a recurring reset or scoring redesign. Subsequent scoring continues under the existing rules until the timing fix is deployed.
5. Five planning levels: **5-year strategic plan (Board) -> Annual -> Department workplans -> Project plans -> Weekly**.
6. The user has now approved specific roster changes in the subsequent KPI decisions below. The historical comparison remains evidence of the earlier display difference, not the new target roster.
7. Board reports are biannual, with ad hoc reports allowed. Provide reporting space and selectable coverage/as-of dates without prescribing a fixed publication cadence in the product. The earlier cadence discussion does not authorize creating a separate monthly leadership view.
8. Explain reporting-period questions using specific metrics; do not ask for one global time basis for all measures. No new baseline or aggregation policy was approved by this answer.
9. Keep **On track / At risk / Behind / Not started** as the intended performance terms. Handle missing data and missing targets as validation/remediation conditions, so point-in-time values can be completed through authorized backend administration. Do not convert missing data into an invented measurement, a performance state, or an apparently successful assessment.
10. Each enterprise priority has one accountable person and an owning department or, for cross-department work, the applicable tracking area. Operations remains a cross-department tracking area governed by Manager, Enterprise Initiatives; it is not a new formal department. Action items, workplans and reporting contributions may cross departments without transferring accountability. Stable position records can preserve history, but the accountable person must be unambiguous; multiple contributors are not multiple owners.
11. Metric entry consists of **approved totals only**. The existing seed also records user-confirmed owner-reported values and manually maintained status. Property/project/engagement transaction registers and automatic formula design are outside this iteration's metric-entry scope. Project plans remain a required planning level.
12. **COO approves publication.** There is no separate monthly leadership view requirement.

## Subsequent KPI and ownership decisions

The following user clarifications supersede unresolved proposals and ownership questions elsewhere in this record.

### Data, goals, human signals and AI interpretation

- Compass surfaces approved data and progress against stated goals. People set the KPI signals; target comparisons must not automatically prescribe concern or override the human signal.
- Retain the **33/33/33 revenue-stream goal** and consistent measurement against it. ELT judges whether the observed mix is appropriate in context. Do not invent a second “balanced-ness” KPI or automatic balance threshold.
- Treat diverse-spend interpretation as a future embedded-AI analysis topic, not a newly approved deterministic KPI or software-generated judgment. No supplier classification, spend formula or additional input requirement was approved here.
- “Philanthropic growth” remains undefined: the current strategic definition says “above national average,” but does not identify donor counts, sponsor counts, dollar amounts, population, comparator or benchmark source. Do not silently equate these. The user favors surfacing documented changes in individual donors and corporate sponsorship as evidence for later analysis. Separate counts from dollars and keep those potential inputs subject to specific definition; do not invent a composite.
- Embedded AI is an intended future interpretation capability. Its analysis should be visibly separate from approved data and the human-maintained signal. This discussion does not authorize implementing the agent now or letting it change authoritative data/signals.
- Implementation gap confirmed in `src/features/scorecards/rollups.js`: `targetStatus` still derives good/watch from target comparisons and `groupStatus` derives group colors. Replace these as authoritative signals when implementing the confirmed manual-signal workflow; numerical goal comparisons can remain informative.

### Roster and input surfaces

| Area | Confirmed direction |
| --- | --- |
| Resident Impact | Add Evictions prevented and Non-renewals as KPIs; retain resident engagement. Reuse existing department definitions where they fit rather than creating duplicate identities. |
| HR / Talent | Surface Open positions, Employee NPS and Leadership development plans / total alongside existing HR measures. Provide Michele, Director of HR, a simple dashboard entry surface for approved figures used in weekly team meetings. Suggested form: period/as-of date, approved value, human-set signal, optional brief update; definitions and formulas do not belong in the recurring entry flow. |
| Pipeline | Active pipeline runs from site control through CO and must state that boundary wherever surfaced. Closed means financial closing. Housing delivered is a raw count of units developed and occupied. See confirmed definitions below. |
| Portfolio Performance | Placeholder only for now. Asset Management software is the authoritative source of portfolio reporting records. Future Compass display/import should retain provenance and as-of dates; no parallel portfolio transaction register or new Compass-owned portfolio reporting workflow. Integration method is not decided. |
| Brand Visibility | Accept separate Stories collected / Stories shared, plus Followers and Donors, as discussed in the reconciliation. Precise definitions still follow approved source measures. |
| Advocacy | Accept Policy wins and Resident leaders / participants on the annual surface. Reuse existing strategic/department definitions where appropriate. |
| Operational Efficiency | Retain Cost savings from technology. Separate **CRM engagement** and **Compass engagement** because they concern different applications. Do not reuse the current combined “CRM & AM” label or presume that its historical total can be split retroactively. |
| Enterprise Priorities | Improve the existing priority reporting/rollup rather than introducing duplicate KPI records for the same summary counts. Human ownership and signals remain authoritative. |

**Future context only:** the Salesforce CRM engagement calculation is changing from individual participants to participating households. The user explicitly requested no Compass implementation work for that information. Retain this context for future conversations; do not change calculations, labels, integrations or historical values solely on this note.

### Ownership resolved and Operations configuration finding

- **Strengthen Property Management Financial Sustainability:** owning department **Property Management**; accountable owner **Director of Property Management**; **Finance is a partner/contributor**. The earlier dual-owner question is resolved.
- **Complete CRM Design and Validation** and **Advance Enterprise AI Strategy:** accountable person **Parnell**, through **Manager, Enterprise Initiatives**; **Operations is the cross-department tracking area**, not a department.
- **Strengthen Leadership knowledge around Resident Experience:** accountable owner remains **COO**. Keep organization-wide accountability separate from a formal department assignment; grouping under Operations must not create shared initiative ownership.

Initial live inspection on September 29 found exactly six department records: Community Relations, Finance, Human Resources, Property Management, Real Estate Development, Resident Services. Operations is absent by design. Manager, Enterprise Initiatives was assigned to Real Estate Development; the user explicitly requested removal. COO, CFO, Director of HR and Director of PM had blank department fields. These findings are distinct from the richer ownership information in the structural seed.

The user reaffirmed that Operations is a cross-department tracking area governed by Manager, Enterprise Initiatives. This supersedes the proposed creation of an Operations department. The intended Operations home is an organizational grouping, not a new formal department or an access grant.

**Applied correction:** `20260929_operations_affiliation.sql` removed the RED department from the existing Manager, Enterprise Initiatives position in development and incremented its revision. The position now uses the app's existing organization-wide affiliation. The change is audited with the user's authorization and execution context. Account department access scopes, metric grants, roles, position identity and history are preserved. In particular, account access to RED records is different from RED departmental affiliation. No Operations department was added; no COO affiliation or unrelated director mapping was changed.

### Confirmed pipeline definitions

Keep approved totals as inputs. The user resolved the three main boundaries:

| Reporting grouping | Definition | Display / entry requirement |
| --- | --- | --- |
| Active pipeline | Site control through certificate of occupancy (CO) | Explicitly state “site control through CO” wherever active pipeline appears, including cards, detail views and reports. Keep project counts and unit counts distinct. |
| Closed | Financial closing | Use explicit financial-closing language rather than implying housing delivery or an in-progress closing. |
| Housing delivered | Raw count of units developed and occupied | Approved whole-unit total, not a percentage, CO count alone, or a software-derived estimate. Both developed and occupied are part of the definition. |

The active-pipeline metric label has been updated in the hosted development catalog, local planning catalog and generated structural seed to **Active pipeline units (site control through certificate of occupancy [CO])**. The clarification changes no recorded totals. Local catalog changes require frontend deployment for any bundled displays; database-backed entry labels use the hosted catalog. Financial-closing and delivered-housing definitions are recorded for the broader pipeline implementation; do not silently reinterpret older acquired/placed-in-service observations as developed-and-occupied totals. LIHTC category design remains separate from these confirmed boundaries. Project performance signals remain human-set.

## What the 21-row difference actually contains

Comparison: the scanned annual example in `../images-alignment/1.pdf` versus `src/features/scorecards/annual2026.js`. The example labels itself illustrative. The current file contains 35 annual measures; Enterprise Priorities is rendered through a separate rollup rather than entries in that metric array.

The difference is **56 displayed rows minus 35 metric definitions**, not 21 verified missing unique KPIs. Counts are useful for reconciliation but do not establish equivalence of units, populations or meanings.

| Domain | Scan rows | Current metric rows | Net difference | Reconciliation |
| --- | ---: | ---: | ---: | --- |
| Resident Impact | 8 | 7 | +1 | Scan includes Evictions prevented and Non-renewals; current roster instead includes Household (Resident) Engagement Rate. Two scan-only rows minus one current-only row. Positive move-outs is a count in the scan versus a rate in the current roster. |
| Financial Health | 8 | 5 | +3 | Total diversity spend, Philanthropic growth, and Balanced diverse revenue streams are additional scan rows. A/R balance in the scan is not automatically equivalent to Accounts Receivable Reduction in the current roster. |
| Talent Management | 6 | 3 | +3 | Open positions, Employee net promoter score, and LDP / total are extra annual display rows. These measures already exist in the broader catalog. |
| Pipeline | 6 | 4 | +2 | Scan: Active site projects to CO, LIHTC applied for, LIHTC submitted, New units, Rehab units, Closed. Current: New Units Acquired or Placed in Service, Existing Units Rehabbed, Units Under Development (LIHTC Applied/Awarded), Units in Closing. This is a stage/count-definition difference, not two safely identifiable additions. Projects and applications cannot be treated as unit counts; “closed” is not the same event as “in closing.” |
| Portfolio Performance | 6 | 5 | +1 | Excess cash to parent is shown here as well as under Revenue in the scan. It is already present under Revenue in the current roster. This additional display is not a new underlying metric. The scan also shows fee-payment timeliness, whereas the current deferred-fee measure is USD. |
| Brand Visibility | 6 | 3 | +3 | Scan separates Stories collected and Stories shared where the current roster combines them (+1), and adds Followers / outlet and Donors (+2). “Mentions” versus “Positive News Mentions” also needs semantic care. |
| Revenue | 4 | 4 | 0 | Same four broad row labels: PM fee, developer fee, contributed revenue and excess cash. Definitions remain subject to established fee/revenue decisions. |
| Advocacy | 4 | 2 | +2 | Policy wins and Resident leaders / participants are extra annual rows. Those strategic measures already exist elsewhere in the catalog. |
| Operational Efficiency | 4 | 2 | +2 | Cybersecurity risk, user engagement and technologies adopted are legible. The fourth scan label is physically obscured, with a visible 54% value. Current rows are User Engagement Rate (CRM & AM) and Cost Savings from Technology. A count comparison is possible; an exact match for the obscured row is not. |
| Enterprise Priorities | 4 | 0 | +4 | Priorities on track, Milestones completed, Priorities at risk, Priorities behind. These are summary counts; the current annual metric array has no rows here, but the application does already have a separate enterprise-priority rollup. The milestone qualifier is partly obscured. |
| **Total** | **56** | **35** | **+21** | **Net display-row difference, not 21 entirely new KPIs.** |

Most recognizable added measures already exist as department or strategic definitions. The actual decision is which belong on the annual surface, which need separate display rows, and which labels/counting units must be corrected. Do not expand the annual roster to 56 simply to match a printed count.

## Enterprise-priority ownership: specific findings

This subsection preserves the initial investigation. The subsequent decisions above resolve the PM owner and identify Parnell's intended Operations affiliation; remaining configuration work is described there.

The structural seed already provides one owner for 13 of 14 active Q3 objectives. The principal ambiguity is one dual-owner record, not a general lack of ownership.

| Priority | Existing source ownership | Remaining issue |
| --- | --- | --- |
| Strengthen Property Management Financial Sustainability | Finance and Property Management; CFO and Director of Property Management both in `ownerPositionIds` | Select one accountable owner and owning department; retain the other as contributor. |
| Complete CRM Design and Validation | Manager, Enterprise Initiatives | Single owner exists; `departmentIds` is empty. Confirm the owning department label without inventing an Operations department. |
| Advance Enterprise AI Strategy | Manager, Enterprise Initiatives | Single owner exists; `departmentIds` is empty. Same department-label issue. |
| Strengthen Leadership knowledge around Resident Experience | COO | Single owner exists; `departmentIds` is empty. Confirm the owning department label for this executive-owned work. |

The remaining ten priorities already have one source owner and a department:

- PM contract exit, new-community lease-up, and Digitize the Leasing Experience: Property Management / Director of Property Management.
- Asset Management Strategy: Finance / CFO.
- Secure contributed revenue: Community Relations / its source owner position, with existing VP of Impact and Advancement coverage to resolve to the responsible current person.
- Underwriting Guidelines, College Ave Phase 2 Closing, and Cornerstone Closing: Real Estate Development / its senior VP owner; Project Management contributes.
- Improve Employee Retention and Reduce Open Positions: Human Resources / Director of Human Resources.

**Implementation gap:** the live `compass_private.enterprise_objectives` table was inspected read-only. It currently has `id`, `title`, `pillar_id`, `area`, `period`, `active`, and no owning-department or accountable-owner columns. The current frontend catalog also omits those fields. Existing source ownership therefore needs to be persisted and enforced; it should not be guessed from who submits a weekly action.

Evidence: `supabase/seeds/2026/quarterly-source.mjs`, `supabase/seeds/2026/compass-2026.seed.json`, `supabase/seeds/2026/RECONCILIATION.md`, and live schema inspection on September 29. Historical/source ownership is not itself proof of a current personal assignment.

## Clarification of the time-basis question

This question concerned the meaning of the entered approved total, not the reporting schedule or collection of individual transactions. Examples:

- **Days Cash on Hand:** a snapshot as of a date; adding monthly snapshots would be meaningless.
- **Contributed Revenue:** an approved total covering a stated interval. The structural seed already has a user-confirmed $750,000 YTD opening balance. The relevant outstanding detail is its effective cutoff before combining it with subsequent totals, not whether to invent a new fundraising calculation.
- **New units / units created, acquired or preserved:** the annual figure and cumulative strategic figure can cover different intervals even when they concern the same underlying activity.

Implementation should label each approved total with its existing definition and covered/as-of period. Ask a focused question only for a specific measure whose approved period is unresolved. There is no new blanket requirement to obtain raw components or derive totals automatically.

## Implementation status and next work

- **Complete:** item-by-item metric reconciliation; source/live-schema ownership review; confirmed decision record; one-time development points reset.
- **Pending stabilization work:** preceding-Friday deadline and related timing rules, last-week outcome update workflow, complete draft review before submission, and modest UX polish. These were not deployed by the points reset.
- **Later architecture:** five-level linkage, single enterprise-priority owner persistence, approved-total reporting with remediation for missing data/targets, and COO-approved report publication supporting biannual and ad hoc reports.

Reset implementation: `supabase/releases/20260929_testing_points_reset.sql`. It locks affected tables, stores each position's original point rows and balance in `weekly_audit`, neutralizes existing point contributions, asserts all balances are 100 and commitment/revision content is unchanged, and records a release marker to prevent repeat execution. A rollback validation passed before application. No production deployment is claimed.
