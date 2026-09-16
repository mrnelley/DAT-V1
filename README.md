# Compass

Compass is HDC MidAtlantic's planning and accountability application. This repository is the canonical application codebase for the 2030 Strategic Plan, Annual Scorecard, department workplans, project plans, and weekly accountability workflow.

## Repository boundary

- Local repository: `AccountabilityTracker/DAT`
- Git remote: `https://github.com/mrnelley/DAT-V1.git`
- Production branch: `main`
- Active development branch: `dev`
- Vercel builds the Vite application with `npm run build`; generated `dist/` files are not source files.

`DAT-Practice` is a separate historical practice application with its own Git remote. The sibling `PM` and `supabase` folders are not part of this repository. Product code, migrations, automated checks, and operating documentation for Compass belong here.

## Local development

```bash
npm install
npm run dev -- --host 127.0.0.1 --port 4174
```

The working application is served at `/`. Its entry point is `src/features/scorecards/app.js`, with interface assets in `public/compass/`. Scorecards, metric updates, weekly accountability and Admin controls use hosted Supabase persistence. Authentication uses `/auth/callback`; see [hosted auth configuration](docs/database/hosted-auth-configuration.md). The previous address remains a compatibility redirect for existing links.

The previous app was preserved in `../Compass-Legacy-2026-09-16` before replacing the entry point. See [rollup and Admin handoff](docs/mvp/rollups-admin-handoff.md) for the release sequence, calculation rules and remaining workflows.

Run the complete local verification gate with:

```bash
npm run check
```

The database probe is read-only and uses the Supabase URL and publishable key in `.env`:

```bash
npm run validate:database
```

The intended Supabase project ref is `vbkjyiurvcnwnjxqvajr`. After the signed-in Supabase account has project access, link this checkout with:

```bash
npx supabase link --project-ref vbkjyiurvcnwnjxqvajr
```

Confirm the project ref before running any migration command. Local CLI link files under `supabase/.temp/` are ignored.

## Delivery path

1. Make and review changes on `dev`.
2. Let the Vercel `dev` preview prove the UI, migrations, and smoke tests against the development Supabase environment.
3. Promote a reviewed commit from `dev` to `main` through a pull request.
4. Let Vercel deploy `main` to production.

Database changes travel as additive, versioned files under `supabase/migrations/`. Apply them to a development database first, validate row-level security and rollback behavior, and promote the same migration files with the application commit. Never use generated output or a manual production dashboard change as the source of truth.

See [Repository and release workflow](docs/architecture/repository-and-release-workflow.md) and [MVP implementation index](docs/mvp/implementation-index.md).
