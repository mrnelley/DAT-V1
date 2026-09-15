# Role-Based Walkthrough Stories

Living product notes for Compass walkthroughs, priority click-throughs, and first-use practice flows.

This document exists so the onboarding and tutorial experience can grow with the real operating model instead of becoming one generic tour for everyone. The current first-login practice overlay should not be changed from this document alone. Use this as the source of walkthrough intent as we learn what each user type actually needs.

## Product Principle

Compass should teach people the next useful move for their role.

The walkthrough should not explain every feature. It should help the user understand:

- what they are accountable for
- what they need to update
- what they should inspect before acting
- when to create a one-off action
- when to submit a stuck
- when to escalate or unblock someone else
- which click-through pages matter for their daily rhythm

The company dashboard is an executive signal. Department and individual dashboards are operating surfaces. Priority detail pages are where the story of work should become traceable.

## Interaction Model

Company dashboard priority cards should click through to a full organizational priority page. That page is for exploration, context, and accountability.

Editing should remain explicit:

- users with permission see an Edit button
- clicking Edit opens a modal
- ordinary card clicks should never feel like they might accidentally change data

This keeps browsing, learning, and editing mentally separate.

## Weekly Priority Operating Assumption

OLT members generally set their own weekly priorities and Action Items. Other people can assign work to them, but the default workflow should not feel like OLT is simply receiving assignments from above.

The walkthrough posture should be:

- this is where you decide your weekly priorities
- this is how you assign tasks pursuant to that week's priorities
- this is how you connect the work back to an organizational priority when it matters
- this is how you submit a stuck when the work cannot move
- this is how you close, carry forward, or reframe the priority before next week
- this is your Friday reminder to update next week's priorities

This matters because the app is not only an accountability tracker. It is also a weekly operating rhythm. The tutorial should teach the user to plan the week, assign the work, update the work, and prepare the next week.

### Friday Reminder Pattern

Friday should not feel like a generic notification. It should feel like the weekly reset point:

- review this week's priorities
- mark what was completed
- identify what carries forward
- create next week's priorities
- assign any supporting tasks
- flag stucks before the next leadership rhythm

For OLT, this reminder is especially important because their weekly priorities become part of the operating signal for ELT and the company dashboard.

## Weekly Tracker vs Task Views

Weekly priorities should be defined in Weekly Tracker or through a Friday reminder that deep-links into Weekly Tracker.

Action views are better suited for inspecting, filtering, working, and following up on actions after they exist. They should answer questions like:

- what is assigned to me?
- what did I assign to someone else?
- what is due this week?
- what is tied to this weekly priority?
- what is tied to this organizational priority?
- what is stuck, late, or waiting on someone?

Task Views hold standalone queued tasks. Weekly Action Items should be created and experienced under the weekly priority they support in Weekly Tracker; they do not become Task View records.

One-off or unplanned tasks can still be created outside Weekly Tracker when needed. If they become part of a weekly commitment, the product should prompt the user to attach them to a weekly priority.

## Walkthrough Story Format

Use this structure when adding or revising a walkthrough:

- Persona or role
- What they are trying to accomplish
- First screen they should understand
- Primary click-through path
- Practice action they should complete
- What success feels like
- What is still missing from the experience

## Classroom-Style First Useful Path Scripts

These scripts translate the first useful paths into literal training instructions. They should eventually become role-aware guided walkthroughs, but for now they define the teaching order.

Each step should answer three questions:

- Where do I click?
- What should I look at?
- What action am I practicing?

### Function: Operations Team Member Daily Update

Example user: Parnell

Training goal: teach the user how to log daily activity, update OLT-facing work, and raise a stuck without hunting through the app.

1. Click Weekly Tracker in the left navigation.
2. Look for the current week.
3. If this week's priorities have not been created yet, practice action: create the weekly priorities first.
4. Enter the intended outcome for each weekly priority.
5. Choose whether each priority aligns to an organizational priority, a department workplan, or neither.
6. Add Action Items under the weekly priority.
7. Assign each Action Item to the person responsible for moving it.
8. Trainer says: "Weekly priorities are authored here. Actions should sit underneath the priority they support."
9. Click Dashboards in the left navigation.
10. Click My Dashboard.
11. Look for the weekly priorities and Action Items that now appear in the user's Weekly Tracker.
12. Trainer says: "This page is the readout. Weekly Tracker is where the week was planned."
13. Open the relevant action view for the user: assigned to me, assigned by me, due this week, or tied to this priority.
14. Practice action: update the task status or add a short progress note from the action view.
15. Trainer says: "Action views are where you work the list. Weekly Tracker is where you create the weekly commitment."
16. If the work is blocked, click Stucks in the left navigation.
17. Click Issue a Stuck.
18. Practice action: enter what is blocked, who is stuck, who can help, and what decision or support is needed.
19. Return to My Dashboard.
20. Confirm that the user's weekly priorities, action updates, and blockers now tell a coherent story.

Success check: the user can say, "I know where to update my work, where to confirm my tasks, and where to raise my hand when I am blocked."

### Function: OLT Department Leader Weekly Priority Setting

Example users: Jaime, Michele, Angie, Kelly

Training goal: teach the OLT user that they author their weekly priorities, assign tasks under those priorities, connect the work to organizational priorities when appropriate, and use Friday as the reset.

1. Click Dashboards in the left navigation.
2. Click My Dashboard.
3. Look for the user's personal dashboard title and department-specific workplan alignment.
4. Trainer says: "This is not just a report. This is where your department's weekly operating rhythm starts."
5. Click Weekly Tracker in the left navigation.
6. Look for the current week.
7. Practice action: create or select this week's top department priority.
8. Enter the intended outcome for the week.
9. Choose whether the priority aligns to an organizational priority, a department workplan, or neither.
10. Assign the priority owner.
11. Add supporting tasks under that weekly priority.
12. Assign each task to the person responsible for moving it.
13. Add a due date that fits the week's rhythm.
14. Trainer says: "Tasks are pursuant to the weekly priority. The priority explains the why; the tasks explain who is doing what."
15. Click Workplans in the left navigation.
16. Look for the department workplan connected to the weekly priority.
17. Confirm that the weekly priority supports the right department workplan or organizational priority.
18. Click Company Dashboard if the priority is tied to an organizational priority.
19. Click the relevant organizational priority card.
20. Look at Departmental Plans and Tasks on the organizational priority detail page.
21. Confirm that the department's work appears in the broader priority story.
22. If the weekly priority is blocked, click Stucks.
23. Practice action: create a stuck with a named helper and a clear support need.
24. Friday training step: click Notifications.
25. Open the Friday reminder to update next week's priorities.
26. Practice action: mark current priorities as complete, carried forward, or reframed.
27. Create next week's priority list.
28. Assign next week's supporting tasks.
29. Trainer says: "Friday is the reset. It closes the loop on this week and prepares next week before Monday arrives."

Success check: the OLT leader can say, "I know where I set my weekly priorities, how I assign tasks under them, and how I prepare next week's priorities on Friday."

### Function: Executive Operator Company Execution Review

Example user: Tammie

Training goal: teach the executive operator how to scan company execution, inspect an organizational priority, and identify where follow-up is needed.

1. Click Dashboards in the left navigation.
2. Click Company Dashboard.
3. Look first at Organizational Priority Health.
4. Look at the status summary: On Track, Needs Attention, Off Track.
5. Look at Percent to Goal.
6. Trainer says: "This is the executive read. Do not start by hunting through tasks. Start with the signal."
7. Choose one organizational priority that needs attention.
8. Click View Detail on that priority card.
9. Look at the priority owner, health, percent-to-goal, and Q2 goal.
10. Scroll to Departmental Plans.
11. Review which departments are connected to the priority.
12. Scroll to Tasks.
13. Review the weekly commitments and related actions attached to the priority.
14. Scroll to Blockers.
15. Identify any stucks tied to owners or helpers.
16. Trainer says: "The question is not 'what exists?' The question is 'what needs follow-up?'"
17. Click Stucks in the left navigation.
18. Review the stuck list for blockers that need executive support.
19. Optional practice action: identify one owner who needs a follow-up conversation.
20. Return to Company Dashboard.

Success check: the executive operator can say, "I can move from company signal to priority detail to the owner or blocker that needs attention."

### Function: Executive Priority Owner Review and Edit

Example users: Dana, Sam, Kim, Meg

Training goal: teach the executive owner to inspect the work behind a priority before editing the executive signal.

1. Click Dashboards in the left navigation.
2. Click My Dashboard or Company Dashboard, depending on the user's landing view.
3. Find a priority owned or sponsored by the user.
4. Click View Detail on the priority card.
5. Look at Priority Health, Percent to Goal, and Q2 Goal.
6. Trainer says: "Clicking the card is for reading and understanding. Editing is separate."
7. Scroll to Departmental Plans.
8. Review the objective cards and department ownership.
9. Scroll to Tasks.
10. Review whether current actions support the priority outcome.
11. Scroll to Blockers.
12. Review whether any stucks require executive intervention.
13. If the executive-level signal needs to change, click Edit.
14. Practice action: update health, goal, or executive note in the modal.
15. Click Save.
16. Confirm the page still shows the priority detail after the modal closes.
17. Trainer says: "Inspect first. Edit second. The signal should change only after the owner understands the work underneath."

Success check: the executive owner can say, "I know how to inspect my priority and where to edit the executive-level signal when it is truly needed."

### Function: Team Member / Contributor Task Completion

Example users: Michael, Shar, Ann, Chris, Abby, Ibrahim, Gigi

Training goal: teach the contributor to find assigned work, understand what priority it supports, update the work, and submit a stuck if blocked.

1. Click Dashboards in the left navigation.
2. Click My Dashboard.
3. Look for "what is mine": assigned actions, related weekly priorities, and any task cards.
4. Trainer says: "You do not need to understand every organizational priority to use Compass. Start with your assigned work."
5. Click Task Views in the left navigation.
6. Find a task assigned to the user.
7. Look at the task owner, due date, status, and priority label.
8. Practice action: update the task status.
9. If the priority label is unfamiliar, click the related priority detail when available.
10. Look at the Q2 goal and department plan only long enough to understand why the task matters.
11. Return to Task Views.
12. If the task cannot move, click Stucks.
13. Click Issue a Stuck.
14. Practice action: name the blocker and who can help.
15. Return to My Dashboard.
16. Confirm that assigned work and blockers are visible.

Success check: the contributor can say, "I know what I need to do, what priority it supports, and where to raise a blocker."

### Function: Administrator Feature Rollout

Example user: app administrator

Training goal: teach the administrator how to slow-walk adoption by enabling features intentionally and understanding how feature access changes the user experience.

1. Click Administration in the top navigation or left navigation area where admin tools are exposed.
2. Click Feature Rollout.
3. Look at the list of users and available features.
4. Trainer says: "This page controls the user's Compass surface area. More features means more responsibility and more walkthrough needs."
5. Select a pilot user.
6. Review the base features every user receives.
7. Practice action: enable one additional feature for the pilot user.
8. Confirm the feature is enabled.
9. Navigate to the user's relevant dashboard or preview surface when available.
10. Confirm that the newly enabled feature appears in navigation.
11. Return to Feature Rollout.
12. Practice action: disable a feature that should not be part of the user's rollout yet.
13. Confirm the feature disappears from the user's enabled surface.
14. Trainer says: "Rollout is part of change management. The app should grow into the user, not overwhelm them on day one."
15. Review whether guided practice should be enabled for the user.

Success check: the administrator can say, "I know how to intentionally turn features on and understand what that means for a user's walkthrough."

## Persona: Operations Team Member

Example user: Parnell  
Likely pattern: logs daily activity, updates OLT on actions, submits stucks, connects work to operational priorities.

### User Need

I need to quickly record what I did, show progress on assigned work, and raise blockers without having to explain the same thing in multiple places.

### First Useful Path

1. Start on personal dashboard or operation view.
2. Review assigned weekly priorities and actions.
3. Open the relevant organizational priority page if the task connects to an organizational priority.
4. Add or update the action.
5. Submit a stuck if progress is blocked by someone, something, or a missing decision.

### Walkthrough Steps

- Show where the user's assigned work appears.
- Show that actions roll up to priorities and can be seen by leadership.
- Show the difference between updating work and submitting a stuck.
- Practice creating a stuck with a named helper.
- Practice marking an action as moved forward.

### Click-Through Surfaces

- My Dashboard
- Weekly Tracker
- Task Views
- Stucks
- Organizational Priority Detail

### Success Feeling

The user should feel, "I can update my work once and leadership can see the right version of it."

### Missing Questions

- Should daily activity logging live in Weekly Tracker, Task Views, or a lighter daily check-in surface?
- Should users be prompted to connect every action to a priority, or only certain actions?
- What is the minimum required information for a stuck?

## Persona: Executive Operator

Example user: Tammie  
Likely pattern: scans company execution, watches operational pressure, follows department workplans, unblocks leaders, checks whether OLT activity supports company priorities.

### User Need

I need to see whether the organization is moving on the right work, where execution is slipping, and who needs help before a priority becomes a crisis.

### First Useful Path

1. Start on Company Dashboard.
2. Scan organizational priority health and percent-to-goal.
3. Click into an organizational priority page.
4. Review departmental plans and actions connected to that priority.
5. Identify stucks or owners that need follow-up.

### Walkthrough Steps

- Show that the company dashboard is not a task list; it is an executive signal.
- Practice opening a priority detail page.
- Show how departmental plans ladder into the priority.
- Show where blockers appear.
- Practice using the page to decide who needs a follow-up conversation.

### Click-Through Surfaces

- Company Dashboard
- Organizational Priority Detail
- Department Workplan Alignment
- Stucks
- Team Health

### Success Feeling

Tammie should feel, "I can tell where the operating system needs attention without hunting through every department's work."

### Missing Questions

- Should Tammie get a default Operations view after company dashboard, or always start on Company Dashboard?
- Which stucks should be elevated to her view automatically?
- Should she see OLT activity by person, by department, or by organizational priority first?

## Persona: Executive Priority Owner

Example users: Dana, Sam, Kim, Meg  
Likely pattern: owns or sponsors company priorities, checks status, reviews related plans, and decides whether priorities need adjustment.

### User Need

I need to understand the status of the priorities I own, see supporting work, and know whether teams are blocked or drifting from the intended outcome.

### First Useful Path

1. Start on executive view.
2. Review owned or sponsored operational priorities.
3. Click into a priority detail page.
4. Review departmental objectives and KPI progress.
5. Use Edit only when changing the priority's executive-level status, goal, or note.

### Walkthrough Steps

- Show owned priority cards.
- Explain that clicking a card opens the detail page.
- Show the distinction between priority health and workplan progress.
- Show where department plans and tasks appear.
- Practice opening the edit modal from an explicit Edit button.

### Click-Through Surfaces

- Executive View
- Company Dashboard
- Organizational Priority Detail
- Strategic Plan / Roadmap
- Task Views

### Success Feeling

The executive owner should feel, "I can inspect the work behind my priority before I change the signal."

### Missing Questions

- Which ELT users can edit which priority fields?
- Do edits require approval or history tracking?
- Should executive notes be visible to all users or only ELT/OLT?

## Persona: OLT Department Leader

Example users: Jaime, Michele, Angie, Kelly  
Likely pattern: manages department commitments, translates company priorities into department workplans, clears team blockers, updates progress for leadership visibility.

### User Need

I need to know what my department owes to company priorities, what my team has committed to this week, and which issues need escalation.

### First Useful Path

1. Start on the user's personal dashboard.
2. Decide this week's department priorities.
3. Assign tasks pursuant to those weekly priorities.
4. Review department workplan alignment.
5. Open related company priority detail when context is needed.
6. Submit or resolve stucks tied to department execution.
7. Respond to the Friday reminder by closing, carrying forward, or setting next week's priorities.

### Walkthrough Steps

- Show department workplans first.
- Show linked organizational priorities.
- Practice setting a weekly priority.
- Practice assigning a supporting task under that weekly priority.
- Practice drilling into a company priority.
- Practice updating an action or creating a one-off action.
- Practice identifying a stuck that should be raised to leadership.
- Practice responding to the Friday next-week priority reminder.

### Click-Through Surfaces

- Personal dashboard
- Department Workplan Alignment
- Weekly Tracker
- Organizational Priority Detail
- Stucks

### Success Feeling

The OLT leader should feel, "My department's work is visible, connected, and easy to escalate when something is blocked."

### Missing Questions

- Should each OLT leader have a default department dashboard configuration?
- Which department workplan fields are editable by OLT?
- Should department leaders get a weekly review prompt before huddles?
- What is the exact Friday cutoff for setting next week's priorities?
- Should the reminder require the user to close/carry forward each current-week priority before creating next week's list?
- Should OLT-created weekly priorities require alignment to an organizational priority, or should unaligned and department-workplan priorities remain frictionless?

## Persona: Team Member / Contributor

Example users: Michael, Shar, Ann, Chris, Abby, Ibrahim, Gigi  
Likely pattern: completes assigned work, responds to tasks, surfaces blockers, and needs only enough company-priority context to understand why the work matters.

### User Need

I need to see my tasks, know what priority they support, and update or raise issues with the least possible friction.

### First Useful Path

1. Start on My Dashboard.
2. Review assigned actions.
3. Open task detail or related priority only when context is needed.
4. Update task status.
5. Submit a stuck if blocked.

### Walkthrough Steps

- Show "what is mine."
- Show the priority label attached to work.
- Practice completing or updating a task.
- Practice submitting a stuck.
- Avoid overwhelming the user with executive dashboards unless their work calls for it.

### Click-Through Surfaces

- My Dashboard
- Task Views
- Weekly Tracker
- Stucks
- Related Priority Detail

### Success Feeling

The contributor should feel, "I know what I need to do today and how to raise my hand when I cannot move it."

### Missing Questions

- Should contributors see company dashboard by default, or only through linked priority context?
- What is the simplest task update interaction?
- Should stuck submission be available from every task card?

## Persona: Administrator

Likely pattern: controls rollout, permissions, and feature access; supports intentional adoption by user group.

### User Need

I need to control what each user can access so Compass can be rolled out intentionally without overwhelming the organization.

### First Useful Path

1. Start on Feature Rollout.
2. Review base access.
3. Enable or disable modules for selected users.
4. Preview what a user will see.
5. Confirm guided practice is enabled for the right rollout group.

### Walkthrough Steps

- Show base features that every user receives.
- Show how to enable a feature for one user.
- Show how feature access changes navigation.
- Practice turning on a module for a pilot user.

### Click-Through Surfaces

- Feature Rollout
- Admin Users
- Admin Permissions
- Profile / User Preview

### Success Feeling

The administrator should feel, "I can slow-walk adoption without creating confusion."

### Missing Questions

- Do admins need a preview-as-user mode?
- Should feature changes trigger a new walkthrough step for that user?
- Should guided practice completion be resettable by admin?

## Walkthrough Backlog

- Build role-specific first-login flows after the core user journeys stabilize.
- Add click-through practice stories for company priority cards.
- Add "edit vs view" training for users with priority edit permissions.
- Add a stuck-submission practice flow for contributors and OLT.
- Add a department workplan practice flow for OLT.
- Add an admin rollout practice flow for feature access.
- Decide whether guided practice should be mandatory once per user, once per feature, or once per major workflow.

## Open Product Questions

- What is the canonical daily update action for a contributor?
- What information must be captured for an update to be useful to OLT?
- What information must be captured for a stuck to be actionable?
- Which roles should start on Company Dashboard versus My Dashboard?
- Which users can edit priority health, goal, owner, and executive note?
- Should walkthroughs adapt to feature flags?
- Should walkthrough completion be tracked by user, role, feature, or workflow?

## Change Log

- 2026-06-03: Added classroom-style first useful path scripts with literal clicks, views, and practice actions by user function.
- 2026-06-02: Created initial living document for role-based walkthrough stories and priority click-through behavior.
