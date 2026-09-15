# Repository and release workflow

## Canonical source

`DAT` is the working Compass repository. It is connected to `mrnelley/DAT-V1` and contains the application, database migrations, tests, and the current scorecard proof of concept. `DAT-Practice` is a separate historical practice repository and should remain a reference rather than a second place to implement Compass features.

The application currently has two important code histories. `dev` contains the current mock-data Compass and the new scorecard work. `main` contains earlier Supabase-backed authentication and data adapters. Recover useful production code through small reviewed ports into `dev`; do not merge the branches wholesale because their application and data-loading layers have diverged.

## Intended layout

```text
DAT/
├── api/                         Vercel serverless endpoints
├── docs/
│   ├── architecture/            Repository, system, and release decisions
│   ├── database/                Schema and persistence plans
│   ├── mvp/                     MVP scope and validation gates
│   ├── product/                 Role stories and product behavior
│   └── source-alignment/        Validation against source materials
├── public/
│   └── scorecard-demo/          Browser-only proof of concept
├── scripts/                     Repeatable developer and validation commands
├── src/
│   ├── api/                     Runtime data access boundaries
│   ├── components/              Existing shared and legacy UI
│   ├── context/                 Existing application state
│   ├── data/                    Fixtures and reference data
│   ├── hooks/                   Shared runtime hooks
│   └── pages/                   Existing routed screens
├── supabase/
│   └── migrations/              Ordered, versioned database changes
└── test/                        Application and prototype regression checks
```

The proof of concept stays under `public/scorecard-demo/` until its screens are moved into React feature modules. During that move, organize new production code around the five user-facing planning surfaces: scorecards, department workplans, project plans, weekly accountability, and leadership rollups. Keep shared status, period, position, and form controls in one shared component layer.

## Branch and environment mapping

| Branch | Purpose | Vercel | Supabase |
| --- | --- | --- | --- |
| `dev` | Active feature integration and user testing | Preview deployment | Development project or isolated branch |
| `main` | Reviewed production releases | Production deployment | Production project |

Keep secrets in local or Vercel environment settings. Commit `.env.example`, never `.env`. Link the Supabase CLI locally to the intended project; the generated `.temp/` link state remains ignored.

The intended project ref is `vbkjyiurvcnwnjxqvajr`. At the time this workflow was recorded, the signed-in CLI account could not access that project and the local `.env` still targeted another Supabase host. Do not push migrations until both the CLI link and environment values resolve to the intended development target.

## Iteration loop

1. Pull `dev` and confirm a clean tree.
2. Implement one vertical slice, including its UI, query boundary, migration, and meaningful tests.
3. Run `npm run check` and any database acceptance checks required by that slice.
4. Commit the slice to `dev` with a focused message and push it for a Vercel preview.
5. Test the preview using at least two positions and two sessions when permissions or weekly submissions change.
6. Open a pull request from `dev` to `main`. Review the application diff and migration diff together.
7. Merge only after the preview, migration, row-level security, and production smoke checklist pass.

For urgent production fixes, branch from `main`, validate the focused fix, merge it to `main`, and immediately reconcile the same commit back into `dev`.

## Database migration rules

- Treat committed migrations as the schema source of truth.
- Inspect the linked project's migration history and schema before creating a repair migration.
- Prefer additive migrations. Use staged backfills before enforcing new non-null constraints.
- Make row-level security, indexes, constraints, and server-side scoring part of the same reviewed change as the feature that needs them.
- Apply and test migrations in development before production.
- Do not reset the production project, rewrite applied migration files, or use browser timestamps for deadline and scoring decisions.
- Keep account identity separate from accountable organizational position so annual history survives staff changes.

## Promotion checklist

- Working tree is clean and the intended commits are on `dev`.
- `npm run check` passes.
- The Vercel preview loads direct routes and the scorecard drill-through flow.
- Required Supabase migrations apply cleanly to development.
- Authenticated create/read/update tests and cross-position denial checks pass.
- Weekly submission timing uses Friday at 5:00 PM in `America/New_York` and a server timestamp.
- Data and migration backups exist before a production schema change.
- The `dev` to `main` pull request includes the migration order and smoke-test steps.
