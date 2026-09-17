# Microsoft workspace UX direction

Status: proposed implementation sequence. Calendar, profile and Teams integrations are not implemented by this document. Preserve these decisions as the role-specific frontend is built.

## Experience

The account menu should open My profile: position selection, department, notification preferences, Microsoft connection status and My calendar. Begin with a useful upcoming-week agenda and an Open in Outlook action. Add a full calendar grid only when it helps the workflow.

My calendar shows the signed-in person's Microsoft events privately. An event offers Share to Compass: the person chooses a Compass title, date/time, description and related work, previews exactly what others will see, then submits it. Recommend a publication queue owned by Admin, building on the previous app's personal-to-organization review flow. The publication authority remains a product decision before implementation.

Compass Calendar is a separate shared schedule of published events. It contains only the approved event fields. Sharing does not invite the organization to the Outlook meeting, expose the original attendee list, or copy attachments. Start with an explicitly shared snapshot and source reference; provide Update shared event and Unpublish. Automatic source updates, cancellations and recurring-series synchronization need a later, explicit policy. Publication audience must be defined before including Board / External accounts.

On an action item, Message owner in Teams opens the assigned person's chat with a short editable draft and an authenticated Compass record link. The user sends it in Teams. Opening that link does not prove a message was sent and gives Compass no conversation transcript. A stuck remains a Compass record with its action-item link, requested help, owner and status. A huddle links the stuck, participants, decisions and follow-up actions. A user may attach a Teams conversation link as supporting context.

Checklist and finding workflows are deferred. Preserve reusable record links without adding checklist work to the current implementation scope.

## Foundations for the next schema/component changes

| Foundation | Contract to preserve |
| --- | --- |
| Identity | Compass user UUID links to a verified Microsoft tenant/object ID. Keep current UPN/email as a contact address, not the permanent identity key. Never accept a client-edited Microsoft ID as verified identity. |
| Ownership | Retain responsible position and resolve its current assigned user when messaging. If a position has several assignees, ask which person; if unassigned, show that state. Keep attribution snapshots for completed work. |
| Record identity | Give action items stable, individually addressable records and permission-checked detail URLs. Current tasks are embedded in weekly JSON; preserve their IDs and carry-forward lineage when normalizing them. Keep submitted weekly snapshots intact. |
| Shared references | Calendars, stucks, huddles and checklists refer to the same action-item IDs, with optional project, objective and property references. Do not match by titles or create disconnected copies of tasks. |
| Event records | Keep private Microsoft source references separate from published Compass content. Model owner, publisher, publication status/audience, source ID, start/end, timezone, all-day flag, revision and cancellation state. |
| Integration state | Keep Microsoft connection/consent/refresh state separate from the Compass login session. UI components call an integration service; they do not manage Microsoft credentials. |
| Record actions | Reserve one reusable place for Open details, Message owner, Raise stuck and Add to huddle. Render only actions that are actually available and authorized. |
| Later notifications | Use an outbox with an idempotency key, retry state and delivery result when automated Teams delivery is introduced. A record save must remain successful if notification delivery is unavailable. |

## Microsoft access and rollout

1. Build the user/profile and action-item ownership/detail foundations with the role workspaces. Keep the current Compass sign-in working unchanged.
2. Add the Teams chat link first. Microsoft's documented link accepts a recipient UPN and draft text; the person chooses to send. This does not require implementing a bot or message-reading integration. [Microsoft Teams chat links](https://learn.microsoft.com/en-us/microsoftteams/platform/concepts/build-and-test/deep-link-teams)
3. Add My calendar with delegated access when the user connects it. Microsoft Graph supports a date-range agenda through calendarView, including recurring occurrences, with Calendars.ReadBasic as the least-privileged delegated permission. Assess additional fields before requesting more access. [Microsoft Graph calendarView](https://learn.microsoft.com/en-us/graph/api/user-list-calendarview?view=graph-rest-1.0)
4. Implement Share to Compass and the publication queue against Compass records. Test recurrence, daylight-saving transitions, updates, cancellation, and disconnect behavior before automatic synchronization.
5. Add huddle links and, later, Teams cards or notifications after record ownership and record URLs work end to end. Checklist and finding workflows remain deferred.

The current Azure login requests email identity only. Calendar access needs Graph consent and a Microsoft token lifecycle. Supabase does not refresh provider tokens; keep any retained provider credentials in a protected server-side integration layer, with disconnect/reconnect behavior. [Supabase provider tokens](https://supabase.com/docs/guides/auth/social-login#provider-tokens)

Admin View as user authorizes Compass data operations only. It must not retrieve that person's private Outlook data or send messages as them. During workspace testing, disable personal Microsoft actions or explicitly return to the real Admin's Microsoft context; never imply that the selected user's Microsoft account has been delegated.

## Decisions before calendar implementation

- Who publishes shared events: Admin only, Executive as well, or designated publishers?
- Should a changed Outlook event require an explicit shared-event update, or enter a review queue automatically? Begin with explicit updates.
- Which Compass roles can see the shared calendar, particularly Board / External accounts?

No new Graph scopes, tenant permissions, integrations, or schema migrations were enabled as part of recording this direction.
