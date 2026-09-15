# Compass database

`config.toml` defines the local Supabase services. `migrations/` is the versioned schema source of truth.

The intended remote project ref is `vbkjyiurvcnwnjxqvajr`. Link only after the signed-in Supabase account has access:

```bash
npx supabase login
npx supabase link --project-ref vbkjyiurvcnwnjxqvajr
```

Then compare local and remote migration history before applying anything:

```bash
npx supabase migration list
```

Do not run `db push`, `db reset`, or create repair migrations until the target project, existing tables, and applied migration history have been reconciled. See [`docs/mvp/database-validation.md`](../docs/mvp/database-validation.md).
