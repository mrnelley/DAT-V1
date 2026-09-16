# Weekly accountability: database validation gate

Checked September 16, 2026. **Connection gate passed; schema gate not passed. No remote database schema or row data was changed.**

Access follow-up: the checkout is linked to `vbkjyiurvcnwnjxqvajr`, the local `.env` targets that host, and the CLI can connect to its database. `supabase migration list` reports the local migrations with no corresponding remote versions. Inventory the actual hosted schemas before choosing a bootstrap or reconciliation migration; missing API endpoints do not establish an empty database.

## Local validation and remaining gates

- The pre-reset backup restored successfully with original ownership into a clean database and was activated as local `postgres`. The interrupted restore is retained separately. Full local API services still need restarting; database recovery alone does not establish API availability.
- The proposed SQL executed successfully against an isolated restored database. This establishes DDL compatibility only, not authorization or business-rule correctness.
- The proposal lives in `supabase/drafts/position_weekly_accountability_scoring.sql`, outside the deployable migration directory.
- Before promotion: enforce organization consistency across every foreign-key relationship; scope administrator access; protect submitted records and locked reports; explicitly restrict RPC execution; test direct writes and revoked assignments.
- Freeze expected weekly participants and policy starting balances. Serialize submission versus missed assessment, and test exactly-once scoring under retries and concurrency.
- Define commitment changes across the deadline, validate real priority content, and cover DST, year boundaries, late opt-outs, and the interval immediately after 17:00 before 17:01.
- Reconcile the four main-only migrations against the actual hosted inventory before selecting a baseline. Then test a clean install and an upgrade, with row counts and rollback evidence.

## Execution evidence

- The configured hosted Supabase API returned HTTP 404 / `PGRST205` for `weekly_action_reports`, `weekly_action_entries`, `weekly_action_tasks`, and `priorities`, with “Could not find the table ... in the schema cache.” These were public-key, zero-row read probes. This establishes that the configured API does not currently expose these endpoints; it does not prove whether the underlying physical tables exist.
- The remote connection succeeds, but the project currently exposes none of the probed Compass tables and has no applied migration history.
- Reproduce the hosted checks with `node scripts/validate-weekly-database.mjs`. It uses the configured public key without printing it, requests zero rows, and exits nonzero if any endpoint fails.
- `dev` is the development source of truth. Four legacy persistence migrations remain only on `main` and are not part of this bootstrap; useful production adapters should be ported deliberately rather than restored through a wholesale merge.

## Existing source contract

The migrations define weekly reports with organization/week uniqueness and a timestamp deadline; entries with report/owner/rank uniqueness, health, carry-forward lineage, enterprise and department alignment; and action items with assignee, due date, completion status, and lineage. Row-level security policies exist in source. The department-objective trigger verifies organization and alignment consistency when an objective is selected. The required-alignment constraint accepts an enterprise priority, workplan, or department objective.

This is a source audit, not a passing runtime validation. Several new fields and behaviors are absent from this checkout's weekly schema:

| Requirement | Required contract before production |
| --- | --- |
| Organizational position ownership | Stable position IDs and occupant history. A profile's free-text role title is not sufficient for annual score history. |
| Capacity declaration | One submission per position/week, with an explicit enterprise commitment or no-enterprise-capacity choice. A declaration must be valid with zero priority entries. Do not create a fake priority to satisfy the existing alignment constraint. |
| Timeliness | Immutable, server-recorded first submission time and separate update time. Deadline: Friday 17:00 in `America/New_York`, including DST. At exactly 17:00 is on time. |
| Weekly results | Persist desired result, support required, project relationship, priority health, and action items. Current entry schema has no dedicated desired-result field. |
| Team rollup | Read submitted snapshots, separately display drafts/missing submissions/capacity declarations/late submissions, and preserve prior weeks. |
| Points | Start at 100 per position. On-time priority `+5`; on-time opt-out `0`; grace-window submission `-3`; missed after Monday 9 a.m. `-10`. Carry balance forward and group activity yearly. |
| Ledger integrity | Unique position/week/rule event, transactional with submission, server-assessed timing, policy version/amount snapshot, no duplicate penalty on edit or concurrent retry. Clients cannot assign themselves scores. |
| Capacity and points | An on-time opt-out is neutral. A late submission, including a late opt-out, receives the same `-3` grace-window event. |
| Annual priority scorecard | Count the same tracked initiative records displayed in the drill-through list. Do not derive initiative health or KPI actuals from weekly task completion. |

## Runtime acceptance checks still required

1. Create/read/update a weekly report, position submission, priority entry, and action item in an isolated database. Reload from another session and verify persistence.
2. Test same-position ownership, delegated leadership access, unauthorized users, and cross-organization denial. Verify every linked parent belongs to the same organization, including report/owner/priority/workplan/task links. Source policy presence alone is insufficient.
3. Submit an on-time capacity declaration without enterprise links or entries. Verify inclusion in the rollup, a distinct missing-submission state, and no capacity penalty.
4. Exercise Friday deadline boundaries in winter and summer; protect the first submission timestamp from edits and client backdating.
5. Retry and concurrently submit a late record. Verify one ledger event, one deduction, and stable amounts after policy changes. Verify policy changes do not silently rewrite established historical deductions.
6. Carry entries/tasks forward while preserving the prior week's snapshot, excluding completed/cancelled tasks and retaining lineage.
7. Verify report locking, transaction rollback on partial failure, stable ordering, position occupant changes, and year-boundary reporting.

## Prototype boundary

`public/scorecard-demo/` contains a browser-only demonstration of the forms, submissions, capacity declarations, rollup, scoring ledger, and annual review. It uses a separate localStorage key and illustrative positions/projects. It does not read or write old Compass records or hosted Supabase. Browser time and editable local storage are acceptable only for this demonstration; these are not production scoring or identity controls.

The browser prototype now mirrors the approved `+5 / 0 / -3 / -10` matrix and DST-aware boundaries. It remains illustrative because browser time and local storage cannot enforce production scoring.
