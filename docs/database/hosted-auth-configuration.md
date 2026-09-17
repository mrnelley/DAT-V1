# Hosted authentication

## Microsoft work-account sign-in

Microsoft is the launch sign-in option. Supabase calls this provider `azure`. The browser requests the `email` scope and returns to `/auth/callback` on the origin where sign-in began. No authentication email is sent for this flow. The app has one sign-in screen; metric entry contains only the entry form. Existing email callbacks remain supported, but the normal login screen does not offer email requests while email delivery is unconfigured.

The workspace waits for both the Supabase session and Compass access assignment. Successful callbacks open scorecards, or the first permitted surface. Authenticated accounts without access see assignment guidance and Sign out. Session changes in another tab update the current tab on the same origin and browser profile; routine token refreshes preserve open forms. Email applications control where clicked links open, so Compass does not attempt to force an existing tab or close a user-opened tab.

In Entra, register a single-tenant application for HDC. Its Web redirect URI is `https://vbkjyiurvcnwnjxqvajr.supabase.co/auth/v1/callback`. In Supabase's Azure provider, set the client ID, client secret value, and tenant URL `https://login.microsoftonline.com/HDC-TENANT-ID`. Follow Supabase's Azure guide for the verified email claim (`xms_edov`). Keep the secret in Supabase, never frontend environment variables.

Microsoft establishes identity; Compass membership and role checks still control data access. Verify the existing Admin account and a scoped staff account before onboarding. Confirm the return host matches the initiating host, the position appears, refresh retains the session, and another department's writes remain forbidden. An HDC Microsoft account by itself does not grant Compass membership. Existing email-invitation buttons still require configured mail delivery.

The stable dev hostname is `https://hdc-compass.dev`; allow its exact callback below. Completing the Microsoft login is the remaining end-to-end check after provider setup and frontend deployment.

## URLs and deployment

Compass uses `/auth/callback` for sign-in links and Admin invitations. Vercel rewrites this route to the app entry point; Vite serves it through its SPA fallback. Query parameters and fragments reach the existing Supabase callback handler unchanged.

1. In Vercel project Settings → Domains, add `hdc-compass.dev` and assign it to the Preview environment and Git branch `dev`. Configure the exact DNS records Vercel displays at the domain registrar; wait for valid domain configuration and HTTPS. Deploy the updated `dev` frontend and bookmark `https://hdc-compass.dev`. Each random-suffix deployment address is a separate browser origin; start and finish sign-in on the custom domain.
2. In Supabase project `vbkjyiurvcnwnjxqvajr`, open Authentication → URL Configuration. Set Site URL to `https://hdc-compass.dev` and add the exact Redirect URL `https://hdc-compass.dev/auth/callback`.
3. In Edge Functions → Secrets, set `COMPASS_APP_URL` to `https://hdc-compass.dev`. The user-management function uses this origin for CORS and appends `/auth/callback` for invitations. A full callback URL also works.
4. Confirm Vercel's deployment environment has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for this project. Set `COMPASS_PUBLIC_URL=https://hdc-compass.dev` in the same Vercel Preview environment for server-generated Teams links. Changes require a redeployment. Service-role keys stay on the server.
5. Open the stable address and select Sign in with Microsoft. Confirm the return hostname is identical, your name and position appear, Admin access works, and refresh retains your session. Test a scoped account separately. Email invitations require configured delivery before testing.
6. Remove obsolete redirect allowlist entries after verification. Keep `http://127.0.0.1:4174/auth/callback` only if local sign-in is needed. The previous static URL remains a compatibility redirect for existing bookmarks, but new authentication requests never use it.

Deploy function changes with `npx supabase functions deploy compass-admin-users --project-ref vbkjyiurvcnwnjxqvajr --use-api`. Updating its secret alone does not require redeployment. Configure custom SMTP before onboarding recipients outside the Supabase project team if the project is still using built-in email delivery.

If Microsoft returns to an older deployment, compare the starting and return hostnames before debugging membership. A missing allowed callback can cause Supabase to fall back to Site URL. Browser verification storage does not travel between Vercel deployment hostnames; the old frontend also remains at its original deployment address. Fix the exact redirect allowlist, then start a fresh login from the stable address. Do not reuse the failed callback link or alter the user's roles to work around this.

`test/auth-browser-lifecycle.test.mjs` runs the actual Supabase client and bundled frontend against controlled API responses. It verifies callback exchange, identity, metric form rendering, reload persistence, and explicit recovery when the browser verifier is missing. The live Microsoft return still needs the deployment check above.
