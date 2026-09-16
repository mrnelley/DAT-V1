# Hosted metric entry release — September 16, 2026

Development target: `vbkjyiurvcnwnjxqvajr`. Deployed releases:

1. `supabase/releases/20260916_metric_entry.sql`: private tables, authenticated RPCs, per-user metric controls, revision audit, idempotent submissions.
2. `supabase/releases/20260916_metric_catalog.sql`: 91 measures, six departments, five contribution categories.

These standalone transactional releases are recorded in `compass_private.releases`. They do not mark the seven legacy migrations as installed. **Do not run an unreviewed `supabase db push`**: its legacy baseline still represents the old app and different role/department assumptions. Consolidation into the final migration chain is pending. Repeat release execution is idempotent; never reset hosted data to revise this release.

No access to private tables is granted to browser roles. Public RPCs explicitly reject anonymous access. Director writes are department-scoped; staff/external roles do not get metric access by default. Read/write overrides are stored server-side. The Admin-only membership function audits changes and prevents removal of the last active Admin. This is the metric surface's authorization boundary, not yet the full application's permissions system.

Only the explicitly reserved confirmed Admin email may claim the initial Manager, Enterprise Initiatives assignment. It is not an unrestricted first-user bootstrap. Membership setup for other users and the administrative controls UI remain to be connected.

Local and hosted rollback tests cover metric create, correction, revision history, retry idempotency, stale updates, categorized contributions, direct-table rejection, cross-department rejection, privilege escalation rejection, staff read denial and per-user write denial. Test users and observations are rolled back. The user confirmed the verified sign-in displays Manager, Enterprise Initiatives connected to Compass. A real-user browser save/reload has not yet been independently observed; hosted SQL lifecycle and mocked browser-adapter tests have passed.

## Browser integration

`Record progress` uses Supabase RPCs exclusively. Its old local-storage records are left intact but not silently imported. The client requests a sign-in email and verifies a code or callback. Add `https://YOUR-DEV-HOST/auth/callback` to hosted Auth Redirect URLs. Local development uses `http://127.0.0.1:4174/auth/callback`. See [hosted auth configuration](hosted-auth-configuration.md).

`npm run build:hosted-metrics` bundles the hosted client using only the publishable/anon key. The script refuses a service-role JWT. It also regenerates the catalog seed. `npm run build` includes that build step. The generated bundle is ignored in Git and must be rebuilt on new checkouts. No server credentials are shipped.

## Verification commands

- `npm run test:planning`: form tests against a mocked hosted adapter and domain tests.
- `node scripts/validate-hosted-metrics.mjs`: live HTTP checks for anonymous denial; no login emails sent.
- `npx supabase db query --linked --file supabase/tests/metric_entry_lifecycle.sql`: rollback-only hosted lifecycle tests; needs the linked CLI credentials.

The live scorecard rollups, weekly submission backend, final unified schema, and full role-selector workflow remain separate work. The existing scorecards still contain sample values and must not be relabeled as real outcomes. After those are replaced or withheld, perform the two requested front-end passes: responsive interaction/accessibility, then copy/navigation cleanup. Keep Learn with Dictionary and Planning Catalog; walkthrough and documentation rewrites are deferred.
