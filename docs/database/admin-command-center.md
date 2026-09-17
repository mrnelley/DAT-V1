# Admin command center

The root app's Admin area includes Users, Positions, Metric governance, Teams, Permissions, Feature rollout, Property governance, Data table, Targets and History. Only an active System Admin can call the management endpoints. Visible navigation is not a substitute for server authorization.

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
| Open another person's workspace | Admin → Users → select account → View as user; server checks the selected account's permissions for every operation |

Older queued-task and stuck tables are not silently imported. Current data tables reflect the records actually persisted by this app. The old property file explicitly described reconstructed assumptions, so those properties and default ownership assignments were not seeded.

## Set up positions before connecting people

1. Open Admin → Positions → Create position. Set its title, department, roles, scorecard access and navigation. No email or Auth account is needed.
2. Open Metric governance. Select a measure and reporting department; assign View and Record updates to any number of positions. Cross-department measures have separate grants for each reporting department. Leadership scorecard access can separately grant broad read access; it does not grant metric editing. System Admin retains full access.
3. When ready, open Users → Connect a person. Enter their work email and select existing positions. This creates an unconfirmed Auth account and assignments without sending an email. For an existing account, edit its assignments in Users instead.
4. Choose the person's default position in Users. People with multiple positions can select their working position in the top navigation. Server authorization validates the selection on every request; individual restrictions can further limit position access.
5. The person signs in with Microsoft. Supabase can link matching verified email identities; Compass assignments determine their workspace. An email alias mismatch requires reconciliation, not an automatic role grant.

Position IDs remain stable through title changes. Multiple occupants share the same position's weekly records and points. Removing one assignment preserves the person's other positions and historical records. Archive unused positions instead of deleting their history. Position roles do not grant System Admin; that privilege remains an explicit account control.

Position edits and metric-governance edits use revision checks to reject stale saves. Active leadership positions acquire weekly obligations only when occupied by an active, confirmed account. Vacancies can therefore be configured before launch without accumulating missed submissions.

## Testing another user's workspace

Select an active account in Users and choose **View as user**. Viewing is read-only by default. Select **Allow saving as this user** before opening to test real metric and weekly saves. Changes affect hosted records and can affect rollups and weekly points. A persistent banner identifies the selected account and saving mode; **Return to my Admin workspace** exits without another Microsoft login.

The original Supabase session is retained. No target-user password, access token, or Microsoft credentials are generated or exposed. A private, one-hour workspace session belongs to the initiating Admin. Every delegated request rechecks the Admin, session ownership, expiry, target activity, and target permissions. Only named scorecard, metric and weekly operations are accepted; management controls require returning to the original Admin account. An Admin target's management navigation is also withheld in this mode.

Start, end and successful saves appear in Admin History. Saved records retain the target user's normal attribution, with an additional Admin event recording the actual actor, target, workspace session, operation and returned record reference. Reloading returns to the original account; the server session expires automatically. An expired or revoked session rejects requests rather than falling back to Admin permissions.

The legacy command center was checked against `Compass-Legacy-2026-09-16`: its directory, team map, permissions, feature rollout, property ownership and operating data controls are represented above. Older product surfaces retained as feature settings still require their own frontend integration; enabling a saved switch does not create a missing screen.

The browser invokes `compass-admin-users`; the server verifies the session with Auth and verifies current Admin membership before using the Auth Admin API. The server-only key never enters the browser bundle. The submitted request ID is retained across uncertain retries and stored in server-managed Auth metadata. Retrying cannot overwrite another existing account's assignment. Partial provisioning remains recoverable in the directory.

Unconfirmed users receive no scheduled weekly submission obligations. Confirmed active leadership users join the current cycle; old cycles are not backfilled. Invitation callbacks are handled with Supabase's implicit callback flow because the recipient has no local PKCE verifier; ordinary sign-in links retain PKCE.

## Releases and deployment

Apply after the September 18 metric/rollup releases:

1. `20260919_command_center.sql`
2. `20260919_user_provisioning.sql`
3. `20260919_provisioning_scope.sql`
4. `20260920_admin_view_as.sql`
5. `20260921_independent_positions.sql`

Deploy `compass-admin-users` to development project `vbkjyiurvcnwnjxqvajr`. Built-in `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` stay on the Edge runtime. `COMPASS_APP_URL` configures the hosted app origin. Invitations return to `/auth/callback`; the local default is `http://127.0.0.1:4174/auth/callback`. Follow [hosted auth configuration](hosted-auth-configuration.md) to configure the redirect allowlist and hosted origin.

The third SQL release narrows position recalculation to the affected account's former/current assignments, satisfying the hosted HTTP database's safe-update requirement. The live endpoint smoke test caught this distinction from direct SQL test execution.

The workspace-switching release is deployed to the linked development database. Its rollback lifecycle checks and hosted API tests passed: scoped staff reads, denied operations, session closure, original Admin retention, and an enabled metric save/correction. Temporary test accounts, sessions, audit events and metric records were removed. Deploy the matching `dev` frontend to expose the control at `https://hdc-compass.dev`.

## Verification

- `npm run test:admin`: handler authentication, validation, retry and invitation behavior; browser form creation, team/property saves, visibility reset, and empty data views.
- `supabase/tests/command_center_lifecycle.sql`: rollback-only role denial, roster, team/property ownership, revision checks, visibility defaults and unconfirmed-user scoring exclusion.
- `supabase/tests/admin_view_as_lifecycle.sql`: rollback-only target scope, save attribution, read-only rejection, expiry, session ownership, Admin revocation, and identity restoration checks.
- `supabase/tests/independent_positions_lifecycle.sql`: rollback-only vacant setup, shared occupants, position selection, metric permissions, stale-save rejection, renaming and handoff checks.
- `node scripts/test-admin-hosted.mjs`: creates isolated temporary Auth identities, exercises the deployed function, and removes its accounts and assignments. It sends no invitations and logs no keys.

Property and team edits have optimistic revision checks. Membership, feature, team and property edits are audited. CSV fields are escaped and spreadsheet-formula prefixes neutralized.

Verified against the deployed development function and HTTP RPCs: user creation and retry, unconfirmed email state, anonymous rejection, existing-member editing, team/property revision updates, feature override and reset. Temporary test identities and assignments were removed. No invitation email was sent during verification. The full check completed with 93 passing tests and a successful build; the new Admin navigation and forms were also inspected at 390px and 1366px widths.

The independent-position release and updated account-connection Edge Function are deployed to development. Hosted verification created a vacant position, connected a temporary account, assigned an isolated measure to that position, and saved and corrected an entry through delegated access. All test records were removed. The corresponding frontend must be deployed from `dev` to expose these controls.
