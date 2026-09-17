# Weekly interaction and historical import

## Weekly surfaces

**My priorities** is the submission surface for the selected working position. The user selects the week, records enterprise capacity or a neutral opt-out, adds priorities and their desired results, links an enterprise objective or department work, and adds action items with responsible positions, due dates and status. Save draft and Submit remain distinct. Carry-forward copies unfinished work into the next week without changing the original record. The Friday 5 PM organization-time deadline and current position points remain visible.

**Everyone's priorities** is the proposed label for the existing Team rollup. OLT, ELT and Executive positions can read the week's submitted priorities across departments. Each priority shows its objective, project/workplan reference, desired result, due date, risks and expandable action items. Action details now include responsible position, due date and status, rather than only a completion count. The server remains responsible for draft visibility and editing permissions. Viewing another position does not grant permission to edit its submission.

Keep submitting and reviewing separate. Add department/position filters and an expanded priority drawer in the next surface pass. Preserve the selected week while switching between the two views. Missing submission, saved draft, submitted enterprise priority and capacity-only submission need distinct text labels. Published history should be browsable using the same week controls; Q1/Q2 source notes remain in the Admin archive.

## Admin historical archive

Admin → Data table → Archived records exposes Q1 2026 and Q2 2026. It reads a private archive table through an Admin-only RPC. No editing endpoint exists; database triggers reject updates and deletes. Seed replay refuses changed content instead of overwriting history. These records do not enter live metric totals, weekly submissions or scoring. Archives are not bundled into the public website.

The archive release and 78 source records have been applied to the development database. The matching frontend needs deployment from `dev`. Rollback database checks verified Admin reads, denied staff/anonymous reads, and denied updates/deletes. The remaining structural metric seed has not been activated in hosted metric-entry forms.

## Proposed weekly CSV

Template: `supabase/seeds/templates/weekly-history.csv`. One row per action item; repeat the priority fields for additional actions under the same priority. A priority without action items uses one row with the action columns blank. A capacity-only week can leave priority/action columns blank.

| Fields | Meaning and validation |
| --- | --- |
| source_record_id | Stable ID for this source row. Re-importing unchanged rows skips them; conflicting content requires review. |
| week_start | Monday, YYYY-MM-DD, in America/New_York. Do not infer from an undated quarterly note. |
| position_id | Existing accountable position ID; never a person's name or email. The UI should export a position lookup before import. |
| capacity | `enterprise` or `capacity`; enterprise requires at least one linked enterprise priority. |
| priority_id | Stable ID grouping repeated action rows into one priority. Required when a priority is supplied. |
| priority_title, desired_result | The commitment and intended result. Repeated rows must agree. |
| enterprise_objective_id | Existing objective ID, or blank for department-only work. The Q3 College Ave alias resolves to `2026-Q3-7`. |
| project_reference | Optional project/workplan reference. It may reference related work across departments. |
| priority_due, priority_status | Due date in YYYY-MM-DD; status `good`, `watch` or `risk`. |
| action_id, action_title | Stable action ID and description; both required when an action is supplied. |
| action_owner_position_id | Existing responsible position, potentially different from the priority owner. |
| action_due, action_status | Date and one of `open`, `in_progress`, `complete`, `blocked`, `cancelled`. |
| context, support | Week-level context and priority-level help/risk notes; repeated values must agree. |
| submitted_at | Optional genuine historical submission timestamp with timezone offset. Blank stays unknown; import time is never substituted. |

Dates, IDs and unknown statuses are not filled with numeric zero. The zero-default decision applies to numeric reporting inputs and baselines.

## Import behavior to implement after agreement

1. Admin uploads UTF-8 CSV and sees an error list plus preview grouped by week → position → priority → action. No records save during preview.
2. Validate all IDs, dates, enum values and repeated-field consistency. No new accounts or positions are inferred from text. Reject duplicate action IDs attached to different priorities and dates with an ambiguous format.
3. Display new, unchanged and conflicting rows separately. Import confirmed rows in one transaction with source-file hash, stable source IDs and the importing Admin's audit identity. Former occupants require no accounts.
4. Historical imports are unscored by default, even when a submission time exists. Applying historical points requires a separate decision. Never overwrite current drafts, submissions or points as a side effect of import.
5. Q1/Q2 history routes into the immutable Admin archive. Q3 historical submissions use a dedicated historical-import path and remain visible in the shared weekly view. The current live submission endpoint deliberately rejects pre-tracking weeks and must not be repurposed to fake old submissions.

The template is a proposed contract, not a working upload endpoint. The structural seed already keeps historical notes, opening metric balances and current weekly records separate.
