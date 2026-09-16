# Admin command center

The root app's Admin area now includes Users, Teams, Permissions, Feature rollout, Property governance, Data table, Targets and History. Only an active System Admin can call the management endpoints. Visible navigation is not a substitute for server authorization.

## Parity with the previous application

| Previous control | Current implementation |
| --- | --- |
| User directory and leadership/department counts | Hosted account directory, search, position, roles, active status, department scope and verification state |
| Team map | Hosted team creation, membership, editing and archival |
| Permission model | Role reference, per-account overrides and department scope |
| Feature switches and reset defaults | Hosted per-user navigation choices and reset; settings for older surfaces are retained for their return |
| Community manager / resident-services ownership | Hosted property creation, editing, ownership assignment and archival |
| Operating data table | Searchable, paginated metric updates, weekly drafts/submissions and submitted action items; CSV export of each page |
| New user creation | Protected Edge Function creates an Auth account and assigns membership; invitation is a separate explicit action |

Older queued-task and stuck tables are not silently imported. Current data tables reflect the records actually persisted by this app. The old property file explicitly described reconstructed assumptions, so those properties and default ownership assignments were not seeded.

## User creation

1. Open Admin → Users → Create a user.
2. Enter email, position, roles and department scope.
3. Create the account. Email remains unconfirmed; no password is collected or exposed.
4. Send an invitation if desired, or let the user request a sign-in email from Compass.

The browser invokes `compass-admin-users`; the server verifies the session with Auth and verifies current Admin membership before using the Auth Admin API. The server-only key never enters the browser bundle. The submitted request ID is retained across uncertain retries and stored in server-managed Auth metadata. Retrying cannot overwrite another existing account's assignment. Partial provisioning remains recoverable in the directory.

Unconfirmed users receive no scheduled weekly submission obligations. Confirmed active leadership users join the current cycle; old cycles are not backfilled. Invitation callbacks are handled with Supabase's implicit callback flow because the recipient has no local PKCE verifier; ordinary sign-in links retain PKCE.

## Releases and deployment

Apply after the September 18 metric/rollup releases:

1. `20260919_command_center.sql`
2. `20260919_user_provisioning.sql`
3. `20260919_provisioning_scope.sql`

Deploy `compass-admin-users` to development project `vbkjyiurvcnwnjxqvajr`. Built-in `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` stay on the Edge runtime. `COMPASS_APP_URL` configures the hosted app origin. Invitations return to `/auth/callback`; the local default is `http://127.0.0.1:4174/auth/callback`. Follow [hosted auth configuration](hosted-auth-configuration.md) to configure the redirect allowlist and hosted origin.

The third SQL release narrows position recalculation to the affected account's former/current assignments, satisfying the hosted HTTP database's safe-update requirement. The live endpoint smoke test caught this distinction from direct SQL test execution.

## Verification

- `npm run test:admin`: handler authentication, validation, retry and invitation behavior; browser form creation, team/property saves, visibility reset, and empty data views.
- `supabase/tests/command_center_lifecycle.sql`: rollback-only role denial, roster, team/property ownership, revision checks, visibility defaults and unconfirmed-user scoring exclusion.
- `node scripts/test-admin-hosted.mjs`: creates isolated temporary Auth identities, exercises the deployed function, and removes its accounts and assignments. It sends no invitations and logs no keys.

Property and team edits have optimistic revision checks. Membership, feature, team and property edits are audited. CSV fields are escaped and spreadsheet-formula prefixes neutralized.

Verified against the deployed development function and HTTP RPCs: user creation and retry, unconfirmed email state, anonymous rejection, existing-member editing, team/property revision updates, feature override and reset. Temporary test identities and assignments were removed. No invitation email was sent during verification. The full check completed with 93 passing tests and a successful build; the new Admin navigation and forms were also inspected at 390px and 1366px widths.
