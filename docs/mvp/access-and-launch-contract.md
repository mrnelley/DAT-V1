# Access and development launch contract

Confirmed September 16, 2026. This supersedes earlier assumptions in the draft scoring SQL. This document describes intended behavior, not completed enforcement.

## Identity and authority

Organizational position, leadership membership, and application permissions are separate. CEO, COO, and CFO are ELT members with Executive application capabilities. ELT membership alone never grants System Admin access. Manager, Enterprise Initiatives is the initial System Admin position.

Admin assigns and removes multiple roles per user without effective dates or acting-coverage terminology. The navigation role selector changes the active working context, not the user's assignments. The server validates that context on every protected operation. Switching between ELT and Executive does not create another weekly obligation or points balance for the same position.

Role templates provide defaults. Admin controls individual capabilities through explicit grants and denials. Proposed resolution: active assigned role grants plus explicit user grants, with explicit user denials taking precedence. Capability scope remains organization/department/assigned-record specific. A grant to update a task does not confer access to other departments' tasks. Removing a role takes effect on subsequent requests.

Navigation preferences are separate from authorization: hiding an authorized section simplifies the interface; disabling a capability also blocks its API operations. Administrative changes require server authorization and an audit record. Preserve at least one active System Admin to prevent lockout.

## Role defaults

| Role | Default authority |
| --- | --- |
| System Admin | All application records, users, roles, capabilities, configuration, audited corrections; versioned schema deployment |
| Executive | All internal records including unfinished drafts; structural approvals, escalation resolution, external publication and audience access |
| ELT | Strategy, enterprise objectives and quarterly priorities; all department workplans and rollups; calculation definitions and enterprise observations; no department tactic or milestone edits |
| OLT Director | Own department tactics, targets, observations, milestones and weekly submissions; other departments' published workplans and rollups read-only; both live scorecards |
| Department Staff | Own department published workplan; status-only updates to assigned action items; no weekly submissions or points view |
| Board / External | Only Executive-published quarterly snapshots authorized for that audience |

Directors own department targets and source observations. ELT owns calculation definitions and validation. Executive approves structural changes, targets and calculation changes; routine progress does not require approval. Calculations and published reports retain versions. Post-grace corrections require Director/Admin authority, record scope, and a reason.

Departments: Property Management, Community Relations, Human Resources, Real Estate Development, Finance, Advocacy, Resident Services.

## Simple surface

Default landing page: My Week, with current position, deadline, submission state and points. Keep the primary choices to My Week, Plans and Scorecards. Reveal department/team views and approval work when relevant; place administration in a separate authorized area. Show position title rather than personal name as the accountable identity. Keep role switching available without duplicating dashboards.

Use short labels, clear save/submission feedback, keyboard-accessible controls and text alongside color. A capability does not require its own navigation item. Show advanced calculations and history on demand. Executive users can receive a reduced navigation configuration while keeping their explicitly assigned authority.

## Weekly accountability and points

Required role types: OLT, ELT and Executive. One obligation per accountable position per cycle, regardless of overlapping roles. Points are required in MVP: opening 100, carry forward, annual activity by position. Badges are deferred. A personal points number and authorized oversight views are sufficient; leaderboard scope is deferred.

Use America/New_York with DST. Cycle opens Monday 00:00. A valid enterprise priority through Friday 17:00:00 earns +5; departmental-only priorities earn +3; an on-time opt-out without priorities earns 0. A mixed submission earns +5 total, never +8. After that cutoff through next Monday 09:00:00, either submission type earns -3. Missing after grace earns -10. Pre-deadline edits have no penalty. Freeze the scoring choice at cutoff. The scheduled assessment must be safe under retries and concurrent submissions.

## Hosted development reset and seed

Project vbkjyiurvcnwnjxqvajr is development, with production transition planned soon. Preserve the existing strategic plan and preset quarterly priorities, including the reference records required to keep their relationships valid. Other records need not survive. Inventory and identify the retained record IDs before executing cleanup; capture a recovery export before the authorized reset.

Validate one complete linked seed example: strategic plan/pillar, quarterly priority, departmental objective and KPI, project/milestone, weekly priority/action item, finalized submission, rollup and points. Verify create, read, scoped update, correction, draft deletion, refresh persistence, and rejection of unauthorized operations. Scorecard values must derive from configured metric observations/calculations, not an invented task-completion percentage.

Use targeted scenarios around the same seed for opt-out, late, missed, retries, role switching, capability denial and quarterly publication. Prove the Board view cannot reach drafts or live underlying records. Restore the seed to a known state between scenarios.

Before go-live, provide an Admin historical-priority import with preview, validation, duplicate detection, original reporting dates and an explicit scoring treatment. Imports must not silently generate retroactive late/missed penalties. Import scoring behavior remains to be specified before enabling import.

## Measured implementation sequence

1. Reconcile actual hosted tables and retained strategy/priority IDs; compare all 11 historical migrations with dev's baseline.
2. Replace dated assignment and broad role checks in draft SQL with the contract above; implement server capability checks and test denials.
3. Validate the complete seed lifecycle locally, including scoring and scheduled assessment concurrency.
4. Apply the validated development reset/migration and repeat the lifecycle against hosted persistence.
5. Connect the weekly UI first, then workplans/projects and scorecards. Add import before production transition.

Current gaps: FeatureAccessContext grants administration to ELT/CEO and persists feature switches in localStorage. usePermissions checks one user.role. Neither is suitable as the hosted authorization boundary. The draft SQL still uses effective-dated assignments and requires replacement before promotion. No hosted migration is authorized by technical validation alone; the retained-record reconciliation and tested reset must first be concrete.
