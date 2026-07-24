-- Complete the persistence contract for application surfaces that previously
-- relied on browser state or frontend seed modules.

alter table public.profiles
  add column teams text[] not null default '{}',
  add column primary_dashboard text
    check (primary_dashboard is null or primary_dashboard in ('individual', 'company'));

alter table public.departments
  add column lead_id uuid references public.profiles(id) on delete set null;

alter table public.properties
  add column metadata jsonb not null default '{}';

alter table public.initiatives
  add column metadata jsonb not null default '{}';

alter table public.workplans
  add column metadata jsonb not null default '{}';

alter table public.priorities
  add column metadata jsonb not null default '{}';

alter table public.metrics
  add column metadata jsonb not null default '{}';

alter table public.huddles
  add column description text,
  add column agenda jsonb not null default '[]',
  add column metadata jsonb not null default '{}';

alter table public.action_items
  add column queue_order integer not null default 0,
  add column pinned boolean not null default false,
  add column metadata jsonb not null default '{}';

alter table public.stucks
  add column pinned boolean not null default false;

alter table public.contacts
  add column profile_summary text,
  add column profile_url text,
  add column context_history text,
  add column profile_goals jsonb not null default '[]',
  add column target_completion_date date,
  add column metadata jsonb not null default '{}';

alter table public.touchpoints
  add column status text not null default 'active'
    check (status in ('active', 'deleted')),
  add column next_step text,
  add column target_completion_date date,
  add column calendar_event_id uuid references public.calendar_events(id) on delete set null,
  add column metadata jsonb not null default '{}';

alter table public.calendar_events
  drop constraint calendar_events_type_check,
  add constraint calendar_events_type_check
    check (
      type in (
        'Touchpoint',
        'Checkpoint',
        'Milestone',
        'Commitment',
        'Conference',
        'Celebration',
        'Holiday',
        'HR Training',
        'Pulse Survey',
        'New Hire'
      )
    );

alter table public.calendar_events
  add column submission_state public.review_state not null default 'private';

create table public.property_operating_snapshots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  reporting_period_id uuid not null references public.reporting_periods(id) on delete restrict,
  occupancy numeric(5, 2),
  open_work_orders integer,
  aged_work_orders integer,
  leasing_exposure integer,
  resident_service_open integer,
  compliance_risk text,
  notes text,
  recorded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (property_id, reporting_period_id)
);

create table public.board_reports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  reporting_period_id uuid not null references public.reporting_periods(id) on delete restrict,
  content jsonb not null default '{
    "mission": "",
    "preparedFor": "",
    "discussionQuestions": [],
    "scorecards": []
  }',
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, reporting_period_id)
);

create table public.user_feature_overrides (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  feature_key text not null,
  enabled boolean not null,
  set_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, feature_key)
);

create index idx_departments_lead on public.departments(lead_id);
create index idx_action_items_queue on public.action_items(owner_id, queue_order);
create index idx_contacts_owner on public.contacts(owner_id);
create index idx_touchpoints_contact_date on public.touchpoints(contact_id, occurred_on desc);
create index idx_property_snapshots_period
  on public.property_operating_snapshots(reporting_period_id, property_id);
create index idx_board_reports_period on public.board_reports(reporting_period_id);
create index idx_feature_overrides_profile on public.user_feature_overrides(profile_id);

create trigger set_property_operating_snapshots_updated_at
before update on public.property_operating_snapshots
for each row execute function public.set_updated_at();

create trigger set_board_reports_updated_at
before update on public.board_reports
for each row execute function public.set_updated_at();

create trigger set_user_feature_overrides_updated_at
before update on public.user_feature_overrides
for each row execute function public.set_updated_at();

alter table public.property_operating_snapshots enable row level security;
alter table public.board_reports enable row level security;
alter table public.user_feature_overrides enable row level security;

create policy "org members read property operating snapshots"
on public.property_operating_snapshots
for select
using (public.is_org_member(organization_id));

create policy "olt manages property operating snapshots"
on public.property_operating_snapshots
for all
using (public.is_olt_member(organization_id))
with check (public.is_olt_member(organization_id));

create policy "org members read board reports"
on public.board_reports
for select
using (public.is_org_member(organization_id));

create policy "elt manages board reports"
on public.board_reports
for all
using (public.is_elt_member(organization_id) or public.is_admin())
with check (public.is_elt_member(organization_id) or public.is_admin());

create policy "users read own feature overrides and admins read all"
on public.user_feature_overrides
for select
using (
  public.is_org_member(organization_id)
  and (profile_id = auth.uid() or public.is_admin())
);

create policy "admins manage feature overrides"
on public.user_feature_overrides
for all
using (public.is_admin())
with check (public.is_admin());

-- Q2 2026 is the first reportable historical period for Compass.
delete from public.reporting_periods
where starts_on < date '2026-04-01';

-- PostgreSQL privileges are evaluated before row-level policies. Supabase clients
-- use the authenticated role, while RLS continues to constrain each operation.
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant usage, select on sequences to authenticated;

comment on table public.board_reports is
  'Period-bound board reporting drafts. The JSON content preserves the editable report layout while the reporting period remains relational.';
comment on table public.property_operating_snapshots is
  'Quarterly property operating signals used by the portfolio dashboard.';
comment on table public.user_feature_overrides is
  'Administrator-managed user feature exceptions; the feature catalog itself remains application configuration.';
