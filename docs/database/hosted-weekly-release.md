# Hosted weekly accountability — September 16, 2026

Deployed to the approved development project `vbkjyiurvcnwnjxqvajr` using the versioned standalone release files dated `20260917`. Legacy `supabase/migrations` were not replayed.

## Connected behavior

- Weekly drafts and submitted snapshots live in `compass_private.weekly_records`. Each finalized revision is retained separately with author and timestamp. Draft saves do not publish changes to the team rollup.
- Positions have stable IDs and undated user assignments. Membership creation establishes the initial position assignment; Admin can grant/remove additional assignments using `compass_set_weekly_assignment`. Switching positions does not create a second balance.
- The initial active position comes from the authenticated membership. Additional occupied leadership positions become available as Admin onboards their members. Unassigned hypothetical positions are not penalized.
- Q3's 14 named enterprise objectives are seeded as actual alignment choices. A project/workplan reference is optional free text until relational project/workplan records are implemented; the UI no longer treats a fake project and an enterprise initiative as one entity.
- Save draft, submit, resubmit, bring forward prior work, action-item fields, team rollup, and annual points review use authenticated APIs. Existing browser-only weekly records are not silently imported.

## Scoring and schedule

Opening points are 100 per position. One unique position/week outcome is updated only before the Friday deadline. An on-time enterprise priority earns +5; on-time opt-out earns 0; a grace-window first submission earns -3; missed grace earns -10. Post-deadline edits retain the established outcome.

Boundaries are derived by PostgreSQL from America/New_York: Monday 00:00, Friday 17:00 inclusive, next Monday 09:00 inclusive grace. Annual activity follows the cycle's Monday year. Existing point outcomes carry forward with no annual reset.

The `compass-weekly-accountability` database job runs every minute. It enrolls currently assigned active leadership positions in the current cycle, then scores recorded overdue obligations once. It does not invent historical obligations. A pre-created future draft is enrolled when that cycle starts. Cron syntax is timezone-independent here; the database function evaluates Eastern time with DST.

Installation follows [Supabase Cron documentation](https://supabase.com/docs/guides/cron/install). The schedule is managed in `supabase/releases/20260917_weekly_schedule.sql`, not by an assistant reminder.

## Permissions and corrections

Anonymous callers and staff/external roles cannot use weekly submission APIs. Active Admin can manage all positions; other authorized users edit only assigned positions. Executive/ELT can read drafts. Directors see their assigned drafts and other submitted rollups. Points oversight is limited to Admin/Executive and assigned positions. Per-user weekly read/write deny fields override role defaults.

After grace, a Director/Admin correction needs a reason and the normal assignment scope. Scoring is not rewritten by a correction. Admin may exempt a recorded, unscored obligation with an audited reason. A scored-week exemption requires a separate correction workflow, which is not implemented yet.

## Verification and limits

`supabase/tests/weekly_lifecycle.sql` passed locally and on hosted development within rollback transactions: DST spring/fall, exact deadline/grace, all four outcomes, duplicate retries, draft isolation, cumulative points, and permission denials. `test/weekly-hosted.test.mjs` checks client save/reload, rollup, error handling and absence of local-storage saves. No synthetic test accounts remain.

The Admin UI for assigning users/positions and exemptions is not yet built; only protected APIs are available. Staff action-item status editing requires its own scoped UI/API and remains outstanding. Project/workplan persistence, historical import, scorecard rollup integration, and the final two front-end cleanup passes are still outstanding. The old scorecard examples are not live results and must be replaced or withheld before removing their disclosure labels.

The legacy weekly-model tests remain as scoring reference tests; the actual weekly page loads `weekly-hosted.js`, not `weekly.js`. Run `npm run test:weekly-hosted` for the connected form tests and `npm run build:hosted-metrics` after changing the bundled hosted adapter.
