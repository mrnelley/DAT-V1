# Working application

The Vite entry point is now `index.html` → `src/bootstrap.js`. Feature code is bundled from `src/features`; styles and static assets are in `public/compass`. `public/scorecard-demo/index.html` preserves old email redirect links and forwards query parameters and fragments to the root. Learn contains the catalog and the existing Dictionary.

The previous working source was copied, without credentials, dependencies or Git internals, to `../Compass-Legacy-2026-09-16` before the entry point changed. Its App.jsx hash was verified. The archive includes its original package lock and startup instructions.

## Hosted releases

Apply the standalone releases in order after the metric and weekly releases; do not run the legacy migration chain against this database:

1. `20260918_rollups_admin.sql`
2. `20260918_strategic_measures.sql`
3. `20260918_scorecard_targets.sql`

All three were applied to development project `vbkjyiurvcnwnjxqvajr`. No production deployment or Git push was performed.

## Rollup rules

- Read the selected reporting month only. A missing source stays missing; it is not zero or last month's value.
- Ordinary measures retain one observation per department/month. Contributions sum their categorized entries once. Stream shares require all mapped sources and a positive denominator; component metrics are not added to the contributed total again.
- Keep multiple department observations separate. Do not average independent satisfaction populations or add repeated enterprise outcomes.
- The direct strategic bindings are HR satisfaction and NPS, Finance days cash, and Resident Services experience. Other outcomes are explicit metric updates. Blended metrics stay unassessed until a calculation is approved.
- Annual metric signals use an Admin-configured target for the selected year. Below a minimum or above a maximum is Watch; no fabricated thresholds. A group with missing assessments does not become green from its available subset.
- Enterprise priority signals summarize submitted linked weekly commitments for the current week, or the last week starting in a historical reporting month. They are not a percent-complete estimate for the objective. Objectives without updates remain visible and pending.

## Admin controls

Confirmed sign-ins appear in the Admin roster. Admin assigns active status, position title, multiple roles, department scope, additional positions and nullable metric/weekly permission overrides. Server-side authorization is enforced independently of navigation. Membership and target changes are audited. The final active Admin cannot be removed. Annual targets use revision checks against conflicting edits.

## Validation and limits

`supabase/tests/rollups_admin_lifecycle.sql` creates temporary accounts and one saved metric, checks rollup output, target revisions, permission overrides and non-Admin rejection, then rolls back. Browser integration tests cover the Admin form and scorecard drilldowns with mocked transport; they do not substitute for the user's signed-in browser acceptance check.

Normalized department workplan/project editing, staff task-only permissions, historical imports, published Board snapshots, and the broader structural-change approval workflow remain separate work. This release provides live scorecard reads, metric entry, weekly submissions/points and the listed Admin controls. It does not claim those other workflows are complete.
