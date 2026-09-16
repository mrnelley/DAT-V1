-- DRAFT: SQL execution validated locally; authorization and business-rule tests pending.
-- SUPERSEDED IN PART: access-and-launch-contract.md removes dated assignments,
-- separates ELT membership from Executive/Admin capabilities, and requires per-user controls.
-- Do not promote to migrations until docs/mvp/database-validation.md gates pass.
-- Position-owned weekly accountability and the first versioned scoring policy.
-- The server owns cycle boundaries, first-submission timing, and point events.

alter table public.organizations
  add column if not exists time_zone text not null default 'America/New_York';

create or replace function public.is_valid_time_zone(value text)
returns boolean
language sql
stable
set search_path = pg_catalog
as $$
  select exists (
    select 1
    from pg_catalog.pg_timezone_names
    where name = value
  );
$$;

alter table public.organizations
  drop constraint if exists organizations_time_zone_check;
alter table public.organizations
  add constraint organizations_time_zone_check
  check (public.is_valid_time_zone(time_zone));

create table if not exists public.positions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  department_id uuid references public.departments(id) on delete set null,
  slug text not null,
  title text not null,
  starts_on date not null default current_date,
  ends_on date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, slug),
  constraint positions_effective_dates_check
    check (ends_on is null or ends_on >= starts_on)
);

create table if not exists public.position_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  position_id uuid not null references public.positions(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  assignment_type text not null default 'primary'
    check (assignment_type in ('primary', 'acting', 'delegate')),
  starts_on date not null default current_date,
  ends_on date,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (position_id, profile_id, assignment_type, starts_on),
  constraint position_assignments_effective_dates_check
    check (ends_on is null or ends_on >= starts_on)
);

create unique index if not exists position_assignments_one_current_primary
  on public.position_assignments(position_id)
  where assignment_type = 'primary' and ends_on is null;
create index if not exists idx_position_assignments_profile
  on public.position_assignments(profile_id, starts_on, ends_on);
create index if not exists idx_positions_org_department
  on public.positions(organization_id, department_id, is_active);

create table if not exists public.weekly_scoring_policies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  effective_from date not null,
  effective_to date,
  starting_points integer not null default 100,
  deadline_local_time time not null default time '17:00',
  grace_end_local_time time not null default time '09:00',
  on_time_priority_points integer not null default 5,
  on_time_opt_out_points integer not null default 0,
  late_submission_points integer not null default -3,
  missed_submission_points integer not null default -10,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, effective_from),
  constraint weekly_scoring_policies_dates_check
    check (effective_to is null or effective_to >= effective_from),
  constraint weekly_scoring_policies_values_check
    check (
      starting_points >= 0
      and on_time_priority_points >= 0
      and on_time_opt_out_points = 0
      and late_submission_points <= 0
      and missed_submission_points <= late_submission_points
    )
);

insert into public.weekly_scoring_policies (
  organization_id,
  name,
  effective_from,
  starting_points,
  deadline_local_time,
  grace_end_local_time,
  on_time_priority_points,
  on_time_opt_out_points,
  late_submission_points,
  missed_submission_points
)
select
  organization.id,
  'Weekly accountability v1',
  date '2026-01-01',
  100,
  time '17:00',
  time '09:00',
  5,
  0,
  -3,
  -10
from public.organizations organization
on conflict (organization_id, effective_from) do nothing;

alter table public.weekly_action_reports
  add column if not exists cycle_opens_at timestamptz,
  add column if not exists grace_ends_at timestamptz,
  add column if not exists scoring_policy_id uuid references public.weekly_scoring_policies(id) on delete restrict;

create or replace function public.set_weekly_cycle_boundaries()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  organization_time_zone text;
  policy public.weekly_scoring_policies%rowtype;
begin
  if extract(isodow from new.week_start) <> 1 then
    raise exception 'Weekly cycles must begin on Monday';
  end if;

  select time_zone
  into organization_time_zone
  from public.organizations
  where id = new.organization_id;

  if organization_time_zone is null then
    raise exception 'Organization % does not have a valid time zone', new.organization_id;
  end if;

  select candidate.*
  into policy
  from public.weekly_scoring_policies candidate
  where candidate.organization_id = new.organization_id
    and candidate.effective_from <= new.week_start
    and (candidate.effective_to is null or candidate.effective_to >= new.week_start)
  order by candidate.effective_from desc
  limit 1;

  if policy.id is null then
    raise exception 'No weekly scoring policy covers week %', new.week_start;
  end if;

  new.week_end := new.week_start + 4;
  new.cycle_opens_at := new.week_start::timestamp at time zone organization_time_zone;
  new.submission_due_at := ((new.week_start + 4) + policy.deadline_local_time) at time zone organization_time_zone;
  new.grace_ends_at := ((new.week_start + 7) + policy.grace_end_local_time) at time zone organization_time_zone;
  new.scoring_policy_id := policy.id;
  new.review_meeting_at := coalesce(new.review_meeting_at, new.grace_ends_at);
  return new;
end;
$$;

drop trigger if exists set_weekly_cycle_boundaries on public.weekly_action_reports;
create trigger set_weekly_cycle_boundaries
before insert or update of organization_id, week_start
on public.weekly_action_reports
for each row execute function public.set_weekly_cycle_boundaries();

update public.weekly_action_reports
set week_start = week_start;

alter table public.weekly_action_reports
  alter column cycle_opens_at set not null,
  alter column grace_ends_at set not null,
  alter column scoring_policy_id set not null;

alter table public.weekly_action_reports
  drop constraint if exists weekly_action_reports_cycle_order_check;
alter table public.weekly_action_reports
  add constraint weekly_action_reports_cycle_order_check
  check (
    cycle_opens_at < submission_due_at
    and submission_due_at < grace_ends_at
  );

create table if not exists public.weekly_position_submissions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  report_id uuid not null references public.weekly_action_reports(id) on delete cascade,
  position_id uuid not null references public.positions(id) on delete restrict,
  status text not null default 'draft'
    check (status in ('draft', 'submitted', 'locked')),
  commitment_type text
    check (commitment_type is null or commitment_type in ('priority', 'opt_out')),
  context_note text,
  first_submitted_at timestamptz,
  last_submitted_at timestamptz,
  submitted_by uuid references public.profiles(id) on delete set null,
  submitted_snapshot jsonb,
  lock_version integer not null default 1 check (lock_version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (report_id, position_id),
  constraint weekly_position_submissions_state_check
    check (
      status = 'draft'
      or (
        commitment_type is not null
        and first_submitted_at is not null
        and last_submitted_at is not null
        and submitted_snapshot is not null
      )
    )
);

create table if not exists public.weekly_submission_revisions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  submission_id uuid not null references public.weekly_position_submissions(id) on delete cascade,
  revision_number integer not null check (revision_number > 0),
  commitment_type text not null check (commitment_type in ('priority', 'opt_out')),
  context_note text,
  snapshot jsonb not null,
  submitted_at timestamptz not null,
  submitted_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (submission_id, revision_number)
);

create table if not exists public.position_point_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  position_id uuid not null references public.positions(id) on delete restrict,
  report_id uuid not null references public.weekly_action_reports(id) on delete cascade,
  submission_id uuid references public.weekly_position_submissions(id) on delete set null,
  scoring_policy_id uuid not null references public.weekly_scoring_policies(id) on delete restrict,
  event_type text not null
    check (event_type in ('on_time_priority', 'on_time_opt_out', 'late_submission', 'missed_submission')),
  points integer not null,
  reason text not null,
  assessed_at timestamptz not null default now(),
  assessed_by uuid references public.profiles(id) on delete set null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique (report_id, position_id)
);

create index if not exists idx_weekly_position_submissions_position
  on public.weekly_position_submissions(position_id, report_id, status);
create index if not exists idx_weekly_submission_revisions_submission
  on public.weekly_submission_revisions(submission_id, revision_number desc);
create index if not exists idx_position_point_events_position
  on public.position_point_events(position_id, assessed_at desc);

alter table public.weekly_action_entries
  alter column owner_id drop not null;
alter table public.weekly_action_entries
  add column if not exists submission_id uuid references public.weekly_position_submissions(id) on delete cascade,
  add column if not exists owner_position_id uuid references public.positions(id) on delete restrict,
  add column if not exists desired_result text,
  add column if not exists support_needed text;

alter table public.weekly_action_entries
  drop constraint if exists weekly_action_entries_accountable_owner_check;
alter table public.weekly_action_entries
  add constraint weekly_action_entries_accountable_owner_check
  check (owner_position_id is not null or owner_id is not null);

create unique index if not exists weekly_action_entries_submission_rank_key
  on public.weekly_action_entries(submission_id, rank)
  where submission_id is not null;

alter table public.weekly_action_tasks
  add column if not exists owner_position_id uuid references public.positions(id) on delete set null;

create index if not exists idx_weekly_action_tasks_owner_position
  on public.weekly_action_tasks(owner_position_id, status, due_on);

create or replace function public.sync_weekly_entry_submission()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  parent public.weekly_position_submissions%rowtype;
begin
  if new.submission_id is null then
    return new;
  end if;

  select *
  into parent
  from public.weekly_position_submissions
  where id = new.submission_id;

  if parent.id is null then
    raise exception 'Weekly submission % does not exist', new.submission_id;
  end if;

  new.organization_id := parent.organization_id;
  new.report_id := parent.report_id;
  new.owner_position_id := parent.position_id;
  return new;
end;
$$;

drop trigger if exists sync_weekly_entry_submission on public.weekly_action_entries;
create trigger sync_weekly_entry_submission
before insert or update of submission_id, organization_id, report_id, owner_position_id
on public.weekly_action_entries
for each row execute function public.sync_weekly_entry_submission();

create or replace function public.can_manage_position(target_position_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.position_assignments assignment
    where assignment.position_id = target_position_id
      and assignment.profile_id = auth.uid()
      and assignment.starts_on <= current_date
      and (assignment.ends_on is null or assignment.ends_on >= current_date)
  );
$$;

create or replace function public.protect_weekly_submission_server_fields()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.status <> 'draft'
      or new.first_submitted_at is not null
      or new.last_submitted_at is not null
      or new.submitted_by is not null
      or new.submitted_snapshot is not null
    then
      raise exception 'Create weekly submissions as drafts and finalize them through the submission function';
    end if;
    return new;
  end if;

  if current_setting('compass.finalizing_weekly_submission', true) is distinct from 'on' then
    if new.status is distinct from old.status
      or new.first_submitted_at is distinct from old.first_submitted_at
      or new.last_submitted_at is distinct from old.last_submitted_at
      or new.submitted_by is distinct from old.submitted_by
      or new.submitted_snapshot is distinct from old.submitted_snapshot
      or new.lock_version is distinct from old.lock_version
      or (old.status <> 'draft' and (
        new.commitment_type is distinct from old.commitment_type
        or new.context_note is distinct from old.context_note
      ))
    then
      raise exception 'Finalize or revise weekly submissions through the submission function';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists protect_weekly_submission_server_fields on public.weekly_position_submissions;
create trigger protect_weekly_submission_server_fields
before insert or update on public.weekly_position_submissions
for each row execute function public.protect_weekly_submission_server_fields();

create or replace function public.build_weekly_submission_snapshot(
  target_submission_id uuid,
  target_commitment_type text,
  target_context_note text
)
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select jsonb_build_object(
    'commitmentType', target_commitment_type,
    'contextNote', coalesce(target_context_note, ''),
    'entries', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', entry.id,
          'rank', entry.rank,
          'title', entry.title,
          'desiredResult', entry.desired_result,
          'priorityId', entry.priority_id,
          'workplanId', entry.workplan_id,
          'keyObjectiveId', entry.key_objective_id,
          'status', entry.status,
          'dueOn', entry.due_on,
          'supportNeeded', coalesce(entry.support_needed, entry.risk_support_note),
          'carriedFromEntryId', entry.carried_from_entry_id,
          'tasks', coalesce((
            select jsonb_agg(
              jsonb_build_object(
                'id', task.id,
                'title', task.title,
                'ownerPositionId', task.owner_position_id,
                'status', task.status,
                'dueOn', task.due_on,
                'completedAt', task.completed_at,
                'carriedFromTaskId', task.carryover_from_task_id
              ) order by task.created_at, task.id
            )
            from public.weekly_action_tasks task
            where task.entry_id = entry.id
          ), '[]'::jsonb)
        ) order by entry.rank, entry.id
      )
      from public.weekly_action_entries entry
      where entry.submission_id = target_submission_id
    ), '[]'::jsonb)
  );
$$;

create or replace function public.finalize_weekly_submission(
  target_submission_id uuid,
  target_commitment_type text,
  target_context_note text default null
)
returns public.weekly_position_submissions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_submission public.weekly_position_submissions%rowtype;
  v_report public.weekly_action_reports%rowtype;
  v_policy public.weekly_scoring_policies%rowtype;
  v_submitted_at timestamptz := clock_timestamp();
  v_first_submitted_at timestamptz;
  v_event_type text;
  v_event_points integer;
  v_event_reason text;
  v_snapshot jsonb;
  v_next_revision integer;
begin
  if target_commitment_type not in ('priority', 'opt_out') then
    raise exception 'Commitment type must be priority or opt_out';
  end if;

  select *
  into v_submission
  from public.weekly_position_submissions
  where id = target_submission_id
  for update;

  if v_submission.id is null then
    raise exception 'Weekly submission % does not exist', target_submission_id;
  end if;

  select * into v_report
  from public.weekly_action_reports
  where id = v_submission.report_id;

  select * into v_policy
  from public.weekly_scoring_policies
  where id = v_report.scoring_policy_id;

  if not (
    public.is_admin()
    or public.is_elt_member(v_submission.organization_id)
    or public.can_manage_position(v_submission.position_id)
  ) then
    raise exception 'You cannot submit for this position' using errcode = '42501';
  end if;

  if v_submitted_at < v_report.cycle_opens_at then
    raise exception 'This weekly cycle has not opened';
  end if;

  if target_commitment_type = 'priority' and not exists (
    select 1
    from public.weekly_action_entries entry
    where entry.submission_id = v_submission.id
      and entry.priority_id is not null
  ) then
    raise exception 'An enterprise-priority submission requires at least one linked enterprise priority';
  end if;

  if target_commitment_type = 'opt_out' and exists (
    select 1
    from public.weekly_action_entries entry
    where entry.submission_id = v_submission.id
      and entry.priority_id is not null
  ) then
    raise exception 'An enterprise opt-out cannot include an enterprise priority';
  end if;

  v_first_submitted_at := coalesce(v_submission.first_submitted_at, v_submitted_at);

  if v_first_submitted_at <= v_report.submission_due_at then
    if target_commitment_type = 'priority' then
      v_event_type := 'on_time_priority';
      v_event_points := v_policy.on_time_priority_points;
      v_event_reason := 'On-time enterprise priority';
    else
      v_event_type := 'on_time_opt_out';
      v_event_points := v_policy.on_time_opt_out_points;
      v_event_reason := 'On-time enterprise opt-out';
    end if;
  elsif v_first_submitted_at <= v_report.grace_ends_at then
    v_event_type := 'late_submission';
    v_event_points := v_policy.late_submission_points;
    v_event_reason := 'Weekly submission received during the grace window';
  else
    v_event_type := 'missed_submission';
    v_event_points := v_policy.missed_submission_points;
    v_event_reason := 'Weekly submission received after the grace window';
  end if;

  v_snapshot := public.build_weekly_submission_snapshot(
    v_submission.id,
    target_commitment_type,
    target_context_note
  );

  perform set_config('compass.finalizing_weekly_submission', 'on', true);

  update public.weekly_position_submissions
  set
    status = 'submitted',
    commitment_type = target_commitment_type,
    context_note = target_context_note,
    first_submitted_at = v_first_submitted_at,
    last_submitted_at = v_submitted_at,
    submitted_by = auth.uid(),
    submitted_snapshot = v_snapshot,
    lock_version = lock_version + 1,
    updated_at = v_submitted_at
  where id = v_submission.id
  returning * into v_submission;

  select coalesce(max(revision.revision_number), 0) + 1
  into v_next_revision
  from public.weekly_submission_revisions revision
  where revision.submission_id = v_submission.id;

  insert into public.weekly_submission_revisions (
    organization_id,
    submission_id,
    revision_number,
    commitment_type,
    context_note,
    snapshot,
    submitted_at,
    submitted_by
  ) values (
    v_submission.organization_id,
    v_submission.id,
    v_next_revision,
    target_commitment_type,
    target_context_note,
    v_snapshot,
    v_submitted_at,
    auth.uid()
  );

  insert into public.position_point_events (
    organization_id,
    position_id,
    report_id,
    submission_id,
    scoring_policy_id,
    event_type,
    points,
    reason,
    assessed_at,
    assessed_by
  ) values (
    v_submission.organization_id,
    v_submission.position_id,
    v_submission.report_id,
    v_submission.id,
    v_report.scoring_policy_id,
    v_event_type,
    v_event_points,
    v_event_reason,
    v_first_submitted_at,
    auth.uid()
  )
  on conflict (report_id, position_id) do update
  set
    submission_id = excluded.submission_id,
    event_type = excluded.event_type,
    points = excluded.points,
    reason = excluded.reason,
    assessed_by = excluded.assessed_by,
    metadata = public.position_point_events.metadata || jsonb_build_object('updatedBeforeDeadlineAt', v_submitted_at)
  where public.position_point_events.event_type in ('on_time_priority', 'on_time_opt_out')
    and excluded.event_type in ('on_time_priority', 'on_time_opt_out')
    and v_submitted_at <= v_report.submission_due_at;

  return v_submission;
end;
$$;

create or replace function public.assess_missed_weekly_submissions(target_report_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  report public.weekly_action_reports%rowtype;
  policy public.weekly_scoring_policies%rowtype;
  inserted_count integer;
begin
  select * into report
  from public.weekly_action_reports
  where id = target_report_id;

  if report.id is null then
    raise exception 'Weekly report % does not exist', target_report_id;
  end if;

  if auth.role() <> 'service_role'
    and not public.is_admin()
    and not public.is_elt_member(report.organization_id)
  then
    raise exception 'Only the scoring job or organization leadership can assess missed submissions' using errcode = '42501';
  end if;

  if clock_timestamp() <= report.grace_ends_at then
    raise exception 'Missed submissions can be assessed after the grace window';
  end if;

  select * into policy
  from public.weekly_scoring_policies
  where id = report.scoring_policy_id;

  insert into public.position_point_events (
    organization_id,
    position_id,
    report_id,
    scoring_policy_id,
    event_type,
    points,
    reason,
    assessed_at,
    assessed_by
  )
  select
    position.organization_id,
    position.id,
    report.id,
    report.scoring_policy_id,
    'missed_submission',
    policy.missed_submission_points,
    'No weekly submission by the end of the grace window',
    clock_timestamp(),
    auth.uid()
  from public.positions position
  where position.organization_id = report.organization_id
    and position.is_active = true
    and position.starts_on <= report.week_end
    and (position.ends_on is null or position.ends_on >= report.week_start)
    and not exists (
      select 1
      from public.weekly_position_submissions submission
      where submission.report_id = report.id
        and submission.position_id = position.id
        and submission.first_submitted_at is not null
        and submission.first_submitted_at <= report.grace_ends_at
    )
  on conflict (report_id, position_id) do nothing;

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

create or replace view public.position_point_balances
with (security_invoker = true)
as
select
  position.id as position_id,
  position.organization_id,
  position.title,
  coalesce(latest_policy.starting_points, 100) as starting_points,
  coalesce(sum(event.points), 0)::integer as point_change,
  (coalesce(latest_policy.starting_points, 100) + coalesce(sum(event.points), 0))::integer as current_points
from public.positions position
left join lateral (
  select policy.starting_points
  from public.weekly_scoring_policies policy
  where policy.organization_id = position.organization_id
  order by policy.effective_from desc
  limit 1
) latest_policy on true
left join public.position_point_events event on event.position_id = position.id
group by position.id, position.organization_id, position.title, latest_policy.starting_points;

create or replace view public.position_annual_point_activity
with (security_invoker = true)
as
select
  event.position_id,
  event.organization_id,
  extract(year from report.week_start)::integer as activity_year,
  count(*)::integer as scored_cycles,
  sum(event.points)::integer as point_change,
  count(*) filter (where event.event_type = 'on_time_priority')::integer as on_time_priorities,
  count(*) filter (where event.event_type = 'on_time_opt_out')::integer as on_time_opt_outs,
  count(*) filter (where event.event_type = 'late_submission')::integer as late_submissions,
  count(*) filter (where event.event_type = 'missed_submission')::integer as missed_submissions
from public.position_point_events event
join public.weekly_action_reports report on report.id = event.report_id
group by event.position_id, event.organization_id, extract(year from report.week_start);

alter table public.positions enable row level security;
alter table public.position_assignments enable row level security;
alter table public.weekly_scoring_policies enable row level security;
alter table public.weekly_position_submissions enable row level security;
alter table public.weekly_submission_revisions enable row level security;
alter table public.position_point_events enable row level security;

create policy "org members read positions"
on public.positions for select
using (public.is_org_member(organization_id) or public.is_admin());

create policy "elt manages positions"
on public.positions for all
using (public.is_admin() or public.is_elt_member(organization_id))
with check (public.is_admin() or public.is_elt_member(organization_id));

create policy "users read their position assignments"
on public.position_assignments for select
using (
  profile_id = auth.uid()
  or public.is_admin()
  or public.is_elt_member(organization_id)
);

create policy "elt manages position assignments"
on public.position_assignments for all
using (public.is_admin() or public.is_elt_member(organization_id))
with check (public.is_admin() or public.is_elt_member(organization_id));

create policy "org members read scoring policy"
on public.weekly_scoring_policies for select
using (public.is_org_member(organization_id) or public.is_admin());

create policy "admins manage scoring policy"
on public.weekly_scoring_policies for all
using (public.is_admin())
with check (public.is_admin());

create policy "users read available weekly submissions"
on public.weekly_position_submissions for select
using (
  public.is_admin()
  or public.is_elt_member(organization_id)
  or public.can_manage_position(position_id)
  or (status in ('submitted', 'locked') and public.is_org_member(organization_id))
);

create policy "position holders create weekly submissions"
on public.weekly_position_submissions for insert
with check (
  public.is_admin()
  or public.is_elt_member(organization_id)
  or public.can_manage_position(position_id)
);

create policy "position holders update weekly submissions"
on public.weekly_position_submissions for update
using (
  public.is_admin()
  or public.is_elt_member(organization_id)
  or public.can_manage_position(position_id)
)
with check (
  public.is_admin()
  or public.is_elt_member(organization_id)
  or public.can_manage_position(position_id)
);

create policy "position holders delete weekly drafts"
on public.weekly_position_submissions for delete
using (
  status = 'draft'
  and (
    public.is_admin()
    or public.is_elt_member(organization_id)
    or public.can_manage_position(position_id)
  )
);

create policy "users read available weekly revisions"
on public.weekly_submission_revisions for select
using (
  exists (
    select 1
    from public.weekly_position_submissions submission
    where submission.id = weekly_submission_revisions.submission_id
      and (
        public.is_admin()
        or public.is_elt_member(submission.organization_id)
        or public.can_manage_position(submission.position_id)
        or (submission.status in ('submitted', 'locked') and public.is_org_member(submission.organization_id))
      )
  )
);

create policy "position holders read point events"
on public.position_point_events for select
using (
  public.is_admin()
  or public.is_elt_member(organization_id)
  or public.can_manage_position(position_id)
);

drop policy if exists "olt and owners manage weekly action entries" on public.weekly_action_entries;
create policy "position holders manage weekly action entries"
on public.weekly_action_entries for all
using (
  public.is_admin()
  or public.is_elt_member(organization_id)
  or owner_id = auth.uid()
  or public.can_manage_position(owner_position_id)
)
with check (
  public.is_admin()
  or public.is_elt_member(organization_id)
  or owner_id = auth.uid()
  or public.can_manage_position(owner_position_id)
);

drop policy if exists "task owners and olt manage weekly action tasks" on public.weekly_action_tasks;
create policy "position holders manage weekly action tasks"
on public.weekly_action_tasks for all
using (
  public.is_admin()
  or public.is_elt_member(organization_id)
  or owner_id = auth.uid()
  or created_by = auth.uid()
  or public.can_manage_position(owner_position_id)
  or exists (
    select 1
    from public.weekly_action_entries entry
    where entry.id = weekly_action_tasks.entry_id
      and (
        entry.owner_id = auth.uid()
        or public.can_manage_position(entry.owner_position_id)
      )
  )
)
with check (
  public.is_admin()
  or public.is_elt_member(organization_id)
  or owner_id = auth.uid()
  or created_by = auth.uid()
  or public.can_manage_position(owner_position_id)
  or exists (
    select 1
    from public.weekly_action_entries entry
    where entry.id = weekly_action_tasks.entry_id
      and (
        entry.owner_id = auth.uid()
        or public.can_manage_position(entry.owner_position_id)
      )
  )
);

drop trigger if exists set_positions_updated_at on public.positions;
create trigger set_positions_updated_at
before update on public.positions
for each row execute function public.set_updated_at();

drop trigger if exists set_position_assignments_updated_at on public.position_assignments;
create trigger set_position_assignments_updated_at
before update on public.position_assignments
for each row execute function public.set_updated_at();

drop trigger if exists set_weekly_scoring_policies_updated_at on public.weekly_scoring_policies;
create trigger set_weekly_scoring_policies_updated_at
before update on public.weekly_scoring_policies
for each row execute function public.set_updated_at();

drop trigger if exists set_weekly_position_submissions_updated_at on public.weekly_position_submissions;
create trigger set_weekly_position_submissions_updated_at
before update on public.weekly_position_submissions
for each row execute function public.set_updated_at();

grant select on public.positions, public.position_assignments, public.weekly_scoring_policies to authenticated;
grant select, insert, update, delete on public.weekly_position_submissions to authenticated;
grant select on public.weekly_submission_revisions, public.position_point_events to authenticated;
grant select on public.position_point_balances, public.position_annual_point_activity to authenticated;
grant insert, update, delete on public.positions, public.position_assignments, public.weekly_scoring_policies to authenticated;

revoke insert, update, delete on public.weekly_submission_revisions from anon, authenticated;
revoke insert, update, delete on public.position_point_events from anon, authenticated;
revoke all on function public.build_weekly_submission_snapshot(uuid, text, text) from public, anon, authenticated;
revoke all on function public.set_weekly_cycle_boundaries() from public, anon, authenticated;
revoke all on function public.protect_weekly_submission_server_fields() from public, anon, authenticated;
revoke all on function public.sync_weekly_entry_submission() from public, anon, authenticated;

grant execute on function public.can_manage_position(uuid) to authenticated;
grant execute on function public.finalize_weekly_submission(uuid, text, text) to authenticated;
grant execute on function public.assess_missed_weekly_submissions(uuid) to authenticated, service_role;

comment on table public.positions is
  'Stable organizational positions that own plans, submissions, and point history independently of their occupants.';
comment on table public.position_assignments is
  'Effective-dated links between authenticated profiles and accountable organizational positions.';
comment on table public.weekly_scoring_policies is
  'Versioned weekly scoring rules. Version 1 uses +5, 0, -3, and -10 with Friday and Monday local-time boundaries.';
comment on table public.weekly_position_submissions is
  'One position decision per weekly cycle, including enterprise priority or explicit opt-out.';
comment on table public.weekly_submission_revisions is
  'Immutable snapshots of every finalized weekly submission or revision.';
comment on table public.position_point_events is
  'Immutable weekly scoring ledger with one event per position and report.';
comment on function public.finalize_weekly_submission(uuid, text, text) is
  'Finalizes or revises a weekly submission using a server timestamp and idempotent scoring event.';
comment on function public.assess_missed_weekly_submissions(uuid) is
  'Adds one -10 event for each active position still missing after the Monday 9 a.m. grace boundary.';
