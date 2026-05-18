# Supabase Implementation Plan

## First Persistence Pass

The initial migration creates the shared operating model for Pulse:

- `organizations`, `departments`, `profiles`: account identity, dashboard focus, admin state, and departmental ownership.
- `properties`, `property_assignments`: HDC communities, ownership/management flags, coordinates, and PM assignments.
- `strategic_plans`, `strategic_pillars`: HDC Strategic Plan 2030 and its organizing pillars.
- `initiatives`, `workplans`, `priorities`: the core accountability hierarchy.
- `metrics`, `metric_values`: KPI definitions and periodic values.
- `huddles`, `huddle_members`, `action_items`, `stucks`: operating rhythm and blocker tracking.
- `waypoints`, `review_requests`: org/personal Pulse Calendar items and approval queues.
- `checklist_templates`, `checklist_sections`, `checklist_items`, `checklist_submissions`, `checklist_responses`: reusable checklist workflows such as the quarterly curb appeal commitment.
- `workflow_definitions`, `workflow_runs`, `teams_accounts`, `adaptive_card_deliveries`: Teams/Vercel automation plumbing.
- `contacts`, `touchpoints`: Dana's advocacy CRM surface.
- `brand_assets`: Cloudinary-backed logos, marks, photography, and UI assets.

## Auth Direction

Supabase Auth should become the source of truth for login. `auth.users.id` maps directly to `profiles.id`.

Initial roles can stay simple:

- `is_admin = true`: can administer users, approve org-wide items, manage properties, and see pending org submissions.
- Department leads: own their dashboard, workplans, priorities, and review queues.
- Property managers: submit assigned property checklists and see their own workflow obligations.
- Standard staff: see organization-visible work and their own assigned commitments.

The current demo user selector should become a development-only impersonation control after Supabase Auth is connected.

## Landing Page Direction

Logged-out users should see a branded HDC Pulse landing page with:

- HDC Pulse product identity.
- Short explanation of Pulse as the operating rhythm for priorities, workplans, beats, and review commitments.
- `Sign in with Microsoft` as the primary action.
- Secondary support copy for Teams-driven workflows: users can arrive from a Teams card and sign in before completing the task.

## Quarterly Curb Appeal Workflow

The quarterly curb appeal checklist should be generated as `checklist_submissions` for every active property assignment.

The source of truth should be:

- one `checklist_template`
- sections and items from the PDF
- one `checklist_submission` per property per quarter
- one `review_request` for Jaime after submission
- priority credit only when `checklist_submissions.credited_at` is set

Teams delivery should be recorded in `adaptive_card_deliveries` so we can show what was sent, when, and whether it received a response.

## Calendar Pane Direction

The Pulse Calendar should move out of the inline dashboard section and into a persistent off-screen pane.

Behavior:

- available from any module view
- opens from a calendar icon/button in the top bar
- slides in from the right on desktop
- uses a swipe-left story on tablet/mobile
- shows personal calendar events by default
- allows sending a personal calendar event to the organization calendar for review

This avoids making every dashboard heavier while keeping personal commitments close to the user.

## Cloudinary Direction

Use `brand_assets` to store Cloudinary URLs and usage context:

- primary logo
- compact mark
- landing hero imagery
- background texture/pattern if approved
- department or initiative imagery if available

Runtime UI should consume the Supabase `brand_assets` table, with local fallbacks while assets are being cataloged.
