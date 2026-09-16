# Hosted development inventory

Checked September 16, 2026 using a successful linked CLI schema-only export of `public` from project `vbkjyiurvcnwnjxqvajr`.

- Export contains public schema ownership and grants, but no application tables, functions, views or policies. This is direct schema evidence, beyond the earlier REST probe. Other schemas were not inventoried by this export.
- No public strategy or priority records can be retained from this hosted target because their tables do not exist there.
- Restored local database contains one strategic-plan row (`c254e584-34e4-4ddd-8d1b-c01387a6c6e0`, HDC MidAtlantic Strategic Plan), zero strategic pillars and zero priorities. This is not the populated plan visible in the prototype.
- Repository `src/data/mockData.js` supplies the five-pillar 2030 plan and five 2026-Q2 enterprise priority lanes. `OperatingDataContext` also loads browser-local overrides under `hdc_compass_operating_data`; repository records alone do not prove what the user last saved in the live app.

Run `node --import tsx scripts/export-planning-seed.mjs` to regenerate the planning-only candidate under `supabase/seeds`. It verifies unique priority IDs, valid reporting periods and pillar references. The candidate intentionally includes priority objectives but excludes unrelated operating collections. It is not automatically loaded by Supabase seed.sql or any hosted command.

Before import, compare the candidate with saved live-app/browser strategy changes. Do not reset browser storage. Preserve source IDs for a deterministic source-ID-to-UUID mapping. Do not treat the single local database plan header as the full strategic plan.

## Branch migration reconciliation

Seven baseline migrations are shared. Main additionally contains:

- `20260724100000_table_backed_application_data.sql`: persistence columns/tables for the old app; evaluate retained relationships, avoid importing every old surface by default.
- `20260724130000_username_identity.sql`: old username identity; reconcile with authenticated identities and Admin-managed roles.
- `20260724140000_simplify_strategic_pillars.sql`: inspect pillar compatibility before importing the five-pillar plan.
- `20260724150000_ensure_strategic_plan_persistence.sql`: inspect required strategy persistence behavior before choosing the new baseline.

The restored local database has all 11 migrations. Executing draft SQL there does not prove installation against dev's seven-migration baseline. Both clean-install and upgrade validation remain necessary. No hosted writes or deletions were performed during this inventory.
