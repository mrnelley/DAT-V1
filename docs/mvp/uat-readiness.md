# UAT readiness

Current checkpoint, September 21, 2026. This supersedes the remaining-work estimates in the original implementation index.

## Latest completed batch

- Separate OLT and Department Director position roles. Existing directors retain both; new positions can select either or both.
- Name/avatar entry to the profile and working dashboard. Dashboard access defaults off and was enabled only for pkelley@hdcweb.org. Admin remains on the main hub. Profile changes persist with revision checks.
- Restore the original 35 annual measures, with Enterprise Priorities as the tenth domain. Additional measures appear below the annual scorecard and do not affect its domain signals.
- Seed 16 supplied property records with structured addresses and codes, without invented unit counts.
- Development release `20260923_workspace_roles.sql` and `seeds/2026/properties.sql` applied to linked dev. Frontend deployment and signed-in browser acceptance remain to verify.
- Focused checks: 27 passing tests, local database lifecycle/permission checks, successful production build.

## Remaining work, in order

1. **Finish hosted release acceptance.** Verify the deployed dev commit, Microsoft login, refresh/reopen persistence, position switching, avatar/profile access, Admin controls, original annual roster and separate additional measures. Check desktop, mobile and keyboard navigation. Validate accounts without dashboard rollout cannot read its RPCs.
2. **Activate the 2026 structural seed.** Reconcile stable IDs; import vacant positions, Q3 priority detail and approved department objectives. Persist KPI definitions, ownership, manual statuses, lookback windows and separate component fields. Connect these fields to the metric entry form. Keep early workplans as references, Q1/Q2 as archive, and unknown/default values distinguishable from observations. Confirm the effective cutoff for the $750,000 opening contributed-revenue balance to prevent double counting.
3. **Complete the delivery chain.** Department objective → project plan/milestones → weekly priority → action item needs persisted links and editing surfaces. Project references are currently text; source workplan references are not a completed workplan/project editor. Verify staff can update only assigned action statuses, and leadership can inspect other positions' work.
4. **Finish weekly review and history.** Keep My priorities separate from Everyone's priorities. Add position/department filters, week navigation and clear draft/submitted/capacity states. Implement the Admin historical CSV preview, validation, duplicate/conflict handling, atomic import and audit trail. Do not generate retroactive penalties or overwrite live submissions.
5. **Prove multi-user behavior and scoring.** Two sessions sharing a position must see updates without losing unsaved work. Add authorized refresh/change notification and reconnect behavior; retain revision checks. Check the hosted scheduled job, Friday deadline, Monday grace, retries, annual position totals, reassignment and opt-out neutrality.
6. **Package the UAT run.** Provide role-based scenarios for Admin, Executive, ELT, OLT-only, Director+OLT, Director-only and Staff. Run one complete persisted record through submission, reporting and correction; refresh and reopen it. Track defects and acceptance against the hosted commit. Begin with Admin and a small leadership group, then expand to the 15 launch users.

## Outside the first internal UAT

Outlook calendar integration, Teams messaging, checklists, badges, and a broad personal-dashboard rollout. The working dashboard currently shows Compass weekly deadlines and property map links; it does not synchronize Microsoft calendars. Board/external publication and structural-approval workflows require their own acceptance before those audiences are enabled.
