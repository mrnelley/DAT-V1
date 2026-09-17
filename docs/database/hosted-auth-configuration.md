# Hosted authentication

## Microsoft work-account sign-in

Microsoft is the launch sign-in option. Supabase calls this provider `azure`. The browser requests the `email` scope and returns to `/auth/callback` on the origin where sign-in began. No authentication email is sent for this flow. The app has one sign-in screen; metric entry contains only the entry form. Existing email callbacks remain supported, but the normal login screen does not offer email requests while email delivery is unconfigured.

The workspace waits for both the Supabase session and Compass access assignment. Successful callbacks open scorecards, or the first permitted surface. Authenticated accounts without access see assignment guidance and Sign out. Session changes in another tab update the current tab on the same origin and browser profile; routine token refreshes preserve open forms. Email applications control where clicked links open, so Compass does not attempt to force an existing tab or close a user-opened tab.

In Entra, register a single-tenant application for HDC. Its Web redirect URI is `https://vbkjyiurvcnwnjxqvajr.supabase.co/auth/v1/callback`. In Supabase's Azure provider, set the client ID, client secret value, and tenant URL `https://login.microsoftonline.com/HDC-TENANT-ID`. Follow Supabase's Azure guide for the verified email claim (`xms_edov`). Keep the secret in Supabase, never frontend environment variables.

Microsoft establishes identity; Compass membership and role checks still control data access. Verify the existing Admin account and a scoped staff account before onboarding. Confirm the return host matches the initiating host, the position appears, refresh retains the session, and another department's writes remain forbidden. An HDC Microsoft account by itself does not grant Compass membership. Existing email-invitation buttons still require configured mail delivery.

Use a stable dev hostname for testing and allow its exact callback below. Completing the Microsoft login is the remaining end-to-end check after provider setup and frontend deployment.

## URLs and deployment

Compass uses `/auth/callback` for sign-in links and Admin invitations. Vercel rewrites this route to the app entry point; Vite serves it through its SPA fallback. Query parameters and fragments reach the existing Supabase callback handler unchanged.

1. Deploy the updated frontend to your stable hosted development address.
2. In Supabase project `vbkjyiurvcnwnjxqvajr`, open Authentication → URL Configuration. Set Site URL to `https://YOUR-DEV-HOST` and add the exact Redirect URL `https://YOUR-DEV-HOST/auth/callback`.
3. In Edge Functions → Secrets, set `COMPASS_APP_URL` to `https://YOUR-DEV-HOST`. The user-management function uses this origin for CORS and appends `/auth/callback` for invitations. A full callback URL also works.
4. Confirm Vercel's deployment environment has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for this project. Changes require a frontend rebuild. Service-role keys stay on the server.
5. Request a fresh sign-in link from the hosted app and open it in the same browser. Confirm your position, Admin access, and session after refresh. Test an invitation with a limited-access account.
6. Remove obsolete redirect allowlist entries after verification. Keep `http://127.0.0.1:4174/auth/callback` only if local sign-in is needed. The previous static URL remains a compatibility redirect for existing bookmarks, but new authentication requests never use it.

Deploy function changes with `npx supabase functions deploy compass-admin-users --project-ref vbkjyiurvcnwnjxqvajr --use-api`. Updating its secret alone does not require redeployment. Configure custom SMTP before onboarding recipients outside the Supabase project team if the project is still using built-in email delivery.
