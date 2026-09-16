# Hosted authentication

Compass uses `/auth/callback` for sign-in links and Admin invitations. Vercel rewrites this route to the app entry point; Vite serves it through its SPA fallback. Query parameters and fragments reach the existing Supabase callback handler unchanged.

1. Deploy the updated frontend to your stable hosted development address.
2. In Supabase project `vbkjyiurvcnwnjxqvajr`, open Authentication → URL Configuration. Set Site URL to `https://YOUR-DEV-HOST` and add the exact Redirect URL `https://YOUR-DEV-HOST/auth/callback`.
3. In Edge Functions → Secrets, set `COMPASS_APP_URL` to `https://YOUR-DEV-HOST`. The user-management function uses this origin for CORS and appends `/auth/callback` for invitations. A full callback URL also works.
4. Confirm Vercel's deployment environment has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for this project. Changes require a frontend rebuild. Service-role keys stay on the server.
5. Request a fresh sign-in link from the hosted app and open it in the same browser. Confirm your position, Admin access, and session after refresh. Test an invitation with a limited-access account.
6. Remove obsolete redirect allowlist entries after verification. Keep `http://127.0.0.1:4174/auth/callback` only if local sign-in is needed. The previous static URL remains a compatibility redirect for existing bookmarks, but new authentication requests never use it.

Deploy function changes with `npx supabase functions deploy compass-admin-users --project-ref vbkjyiurvcnwnjxqvajr --use-api`. Updating its secret alone does not require redeployment. Configure custom SMTP before onboarding recipients outside the Supabase project team if the project is still using built-in email delivery.
