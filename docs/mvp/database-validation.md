# Weekly accountability: database validation gate

Checked September 14, 2026. **Gate not passed. No database schema or row data was changed.**

Access follow-up on September 15, 2026: the intended project ref is `vbkjyiurvcnwnjxqvajr`, but `supabase link` returned `LegacyLinkProjectStatusError` because the signed-in account does not have permission to access the project-status endpoint. The checkout's previous ignored link cache pointed to a different production project and was cleared to prevent accidental migration commands against that target. The checked-in CLI config is ready; the repository remains deliberately unlinked until the account is granted access and the link command succeeds.

## Execution evidence

- The configured hosted Supabase API returned HTTP 404 / `PGRST205` for `weekly_action_reports`, `weekly_action_entries`, `weekly_action_tasks`, and `priorities`, with “Could not find the table ... in the schema cache.” These were public-key, zero-row read probes. This establishes that the configured API does not currently expose these endpoints; it does not prove whether the underlying physical tables exist.
- Docker was stopped. Starting Docker Desktop did not produce a reachable Linux engine during this validation attempt. No local database CRUD or permission tests ran.
- Reproduce the hosted checks with `node scripts/validate-weekly-database.mjs`. It uses the configured public key without printing it, requests zero rows, and exits nonzero if any endpoint fails.
- The current local `.env` still targets a different Supabase host. Replace its URL and publishable key together with values from the intended project before treating API probe results as evidence about `vbkjyiurvcnwnjxqvajr`.
- The checked-out `dev` migrations differ from the main branch previously deployed to Vercel. Confirm the intended source of truth and project before applying migrations. Do not reset or push the current migrations into the hosted project as a repair shortcut.

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
| Points | Start at 100 per position. Carry balance forward, report annual activity, and do not reset automatically without an explicit rule. The user has not specified the deduction amount. |
| Ledger integrity | Unique position/week/rule event, transactional with submission, server-assessed timing, policy version/amount snapshot, no duplicate penalty on edit or concurrent retry. Clients cannot assign themselves scores. |
| Capacity and points | The capacity choice itself has no penalty. A late submission, including a late capacity declaration, follows the same late-submission rule once a deduction amount is agreed. |
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

The optional demo deduction setting starts unset. Late events remain pending until an amount is supplied; applying an amount settles pending demo events once. No other penalty categories were invented.
