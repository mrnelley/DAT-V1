create extension if not exists pgcrypto;

do $$
begin
  create type public.work_signal_status as enum ('steady', 'watch', 'alert', 'complete', 'paused', 'no_data');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.review_state as enum ('private', 'pending', 'approved', 'declined', 'needs_follow_up', 'returned');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.workflow_frequency as enum ('once', 'daily', 'weekly', 'monthly', 'quarterly', 'annual');
exception when duplicate_object then null;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  website text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, slug)
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  department_id uuid references public.departments(id) on delete set null,
  full_name text not null,
  display_name text,
  initials text,
  email text unique,
  role_title text,
  working_group text,
  dashboard_focus text,
  avatar_url text,
  is_admin boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.is_admin = true
  );
$$;

create or replace function public.is_org_member(org_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.organization_id = org_id
      and p.is_active = true
  );
$$;

create or replace function public.is_elt_member(org_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.organization_id = org_id
      and p.is_active = true
      and p.working_group = 'ELT'
  );
$$;

create or replace function public.is_olt_member(org_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.organization_id = org_id
      and p.is_active = true
      and p.working_group in ('ELT', 'OLT')
  );
$$;

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  slug text not null,
  status text,
  ownership_type text,
  management_type text,
  address text,
  city text,
  county text,
  state text,
  zip_code text,
  estimated_units integer,
  is_active_portfolio boolean not null default true,
  housing_type text,
  resident_focus text[] not null default '{}',
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  coordinate_quality text,
  source_url text,
  validation_status text not null default 'needs_internal_validation',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, slug)
);

create table if not exists public.property_assignments (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  assignment_role text not null default 'property_manager',
  starts_on date,
  ends_on date,
  created_at timestamptz not null default now(),
  unique (property_id, profile_id, assignment_role)
);

create table if not exists public.strategic_plans (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  starts_on date,
  ends_on date,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.planning_cycles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  strategic_plan_id uuid references public.strategic_plans(id) on delete set null,
  label text not null,
  year integer not null,
  quarter text not null,
  starts_on date not null,
  ends_on date not null,
  status text not null default 'draft',
  set_by uuid references public.profiles(id) on delete set null,
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, year, quarter)
);

create table if not exists public.strategic_pillars (
  id uuid primary key default gen_random_uuid(),
  strategic_plan_id uuid not null references public.strategic_plans(id) on delete cascade,
  title text not null,
  description text,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quarterly_pillars (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  planning_cycle_id uuid not null references public.planning_cycles(id) on delete cascade,
  strategic_pillar_id uuid references public.strategic_pillars(id) on delete set null,
  owner_id uuid references public.profiles(id) on delete set null,
  title text not null,
  description text,
  status text not null default 'draft',
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.strategic_success_metrics (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  strategic_plan_id uuid not null references public.strategic_plans(id) on delete cascade,
  strategic_pillar_id uuid not null references public.strategic_pillars(id) on delete cascade,
  title text not null,
  target_label text not null,
  metric_kind text not null default 'outcome',
  start_value numeric,
  current_value numeric,
  target_value numeric,
  unit text,
  source text,
  notes text,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.initiatives (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  strategic_plan_id uuid references public.strategic_plans(id) on delete set null,
  strategic_pillar_id uuid references public.strategic_pillars(id) on delete set null,
  owner_id uuid references public.profiles(id) on delete set null,
  title text not null,
  description text,
  year integer,
  quarter text,
  status public.work_signal_status not null default 'steady',
  progress numeric(5, 2) not null default 0,
  target_value numeric,
  current_value numeric,
  starts_on date,
  due_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workplans (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  strategic_plan_id uuid references public.strategic_plans(id) on delete set null,
  strategic_pillar_id uuid references public.strategic_pillars(id) on delete set null,
  quarterly_pillar_id uuid references public.quarterly_pillars(id) on delete set null,
  department_id uuid references public.departments(id) on delete set null,
  lead_id uuid references public.profiles(id) on delete set null,
  initiative_id uuid references public.initiatives(id) on delete set null,
  title text not null,
  scope text,
  outcome text,
  status public.work_signal_status not null default 'steady',
  approval_status text not null default 'draft' check (approval_status in ('draft', 'pending', 'approved', 'returned')),
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  path_forward text,
  progress numeric(5, 2) not null default 0,
  starts_on date,
  due_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.priorities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  strategic_plan_id uuid references public.strategic_plans(id) on delete set null,
  strategic_pillar_id uuid references public.strategic_pillars(id) on delete set null,
  quarterly_pillar_id uuid references public.quarterly_pillars(id) on delete set null,
  department_id uuid references public.departments(id) on delete set null,
  owner_id uuid references public.profiles(id) on delete set null,
  workplan_id uuid references public.workplans(id) on delete set null,
  initiative_id uuid references public.initiatives(id) on delete set null,
  title text not null,
  description text,
  priority_type text not null default 'task',
  status public.work_signal_status not null default 'steady',
  period_label text,
  starts_on date,
  due_on date,
  target_value numeric,
  current_value numeric,
  progress numeric(5, 2) not null default 0,
  is_company_priority boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.key_objectives (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  strategic_plan_id uuid references public.strategic_plans(id) on delete set null,
  strategic_pillar_id uuid references public.strategic_pillars(id) on delete set null,
  priority_id uuid references public.priorities(id) on delete cascade,
  owner_id uuid references public.profiles(id) on delete set null,
  department_id uuid references public.departments(id) on delete set null,
  workplan_id uuid references public.workplans(id) on delete set null,
  title text not null,
  description text,
  status public.work_signal_status not null default 'steady',
  lifecycle_status text not null default 'active',
  progress numeric(5, 2) not null default 0,
  due_on date,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.objective_kpis (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  key_objective_id uuid not null references public.key_objectives(id) on delete cascade,
  owner_id uuid references public.profiles(id) on delete set null,
  title text not null,
  target_label text,
  current_label text,
  target_value numeric,
  current_value numeric,
  progress numeric(5, 2) not null default 0,
  status public.work_signal_status not null default 'steady',
  due_on date,
  source text,
  children jsonb not null default '[]',
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.metrics (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  owner_id uuid references public.profiles(id) on delete set null,
  department_id uuid references public.departments(id) on delete set null,
  priority_id uuid references public.priorities(id) on delete set null,
  title text not null,
  subtitle text,
  source text,
  start_value numeric,
  current_value numeric,
  target_value numeric,
  yellow_threshold numeric,
  green_threshold numeric,
  last_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.metric_values (
  id uuid primary key default gen_random_uuid(),
  metric_id uuid not null references public.metrics(id) on delete cascade,
  value numeric not null,
  recorded_for date not null,
  recorded_by uuid references public.profiles(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.huddles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  department_id uuid references public.departments(id) on delete set null,
  name text not null,
  recurrence text,
  starts_at timestamptz,
  owner_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.huddle_members (
  huddle_id uuid not null references public.huddles(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  member_role text not null default 'member',
  created_at timestamptz not null default now(),
  primary key (huddle_id, profile_id)
);

create table if not exists public.workplan_huddle_reviews (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  workplan_id uuid not null references public.workplans(id) on delete cascade,
  huddle_id uuid references public.huddles(id) on delete set null,
  requested_by uuid references public.profiles(id) on delete set null,
  reviewed_by uuid references public.profiles(id) on delete set null,
  decision text not null default 'pending' check (decision in ('pending', 'approved', 'returned', 'deferred')),
  path_forward text,
  decision_note text,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.action_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  strategic_plan_id uuid references public.strategic_plans(id) on delete set null,
  strategic_pillar_id uuid references public.strategic_pillars(id) on delete set null,
  department_id uuid references public.departments(id) on delete set null,
  owner_id uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  workplan_id uuid references public.workplans(id) on delete set null,
  priority_id uuid references public.priorities(id) on delete set null,
  huddle_id uuid references public.huddles(id) on delete set null,
  title text not null,
  description text,
  status text not null default 'open',
  visibility text not null default 'private' check (visibility in ('private', 'department', 'olt', 'organization')),
  due_on date,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.weekly_action_reports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  planning_cycle_id uuid references public.planning_cycles(id) on delete set null,
  week_start date not null,
  week_end date not null,
  submission_due_at timestamptz not null,
  review_meeting_at timestamptz not null,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'reviewed', 'locked')),
  created_by uuid references public.profiles(id) on delete set null,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  locked_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, week_start)
);

create table if not exists public.weekly_action_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  report_id uuid not null references public.weekly_action_reports(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  department_id uuid references public.departments(id) on delete set null,
  rank integer not null check (rank between 1 and 3),
  previous_rank integer check (previous_rank between 1 and 3),
  carried_from_entry_id uuid references public.weekly_action_entries(id) on delete set null,
  priority_id uuid references public.priorities(id) on delete set null,
  workplan_id uuid references public.workplans(id) on delete set null,
  stuck_id uuid references public.stucks(id) on delete set null,
  title text not null,
  alignment_type text not null default 'enterprise' check (alignment_type in ('enterprise', 'department')),
  aligned_priority_label text,
  risk_support_note text,
  status public.work_signal_status not null default 'steady',
  due_on date,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (report_id, owner_id, rank)
);

create table if not exists public.weekly_action_tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entry_id uuid not null references public.weekly_action_entries(id) on delete cascade,
  action_item_id uuid references public.action_items(id) on delete set null,
  carryover_from_task_id uuid references public.weekly_action_tasks(id) on delete set null,
  owner_id uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  title text not null,
  status text not null default 'open' check (status in ('open', 'in_progress', 'complete', 'blocked', 'cancelled', 'carried_over')),
  due_on date,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.work_object_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  department_id uuid references public.departments(id) on delete set null,
  source_type text not null check (source_type in ('initiative', 'workplan', 'priority', 'key_objective', 'objective_kpi', 'action_item', 'weekly_action_entry', 'weekly_action_task', 'calendar_event', 'stuck', 'checklist_submission')),
  source_id uuid not null,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  assignment_role text not null default 'support' check (assignment_role in ('owner', 'lead', 'accountable', 'assignee', 'reviewer', 'support', 'observer')),
  assigned_by uuid references public.profiles(id) on delete set null,
  starts_on date,
  ends_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_type, source_id, profile_id, assignment_role)
);

create table if not exists public.stucks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  person_stuck_id uuid references public.profiles(id) on delete set null,
  help_from_id uuid references public.profiles(id) on delete set null,
  source_type text,
  source_id uuid,
  description text not null,
  status text not null default 'active',
  stuck_since timestamptz not null default now(),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.waypoints (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  owner_id uuid references public.profiles(id) on delete set null,
  submitted_by uuid references public.profiles(id) on delete set null,
  approved_by uuid references public.profiles(id) on delete set null,
  scope text not null check (scope in ('personal', 'organization')),
  title text not null,
  label text not null default 'Beat' check (label in ('Beat', 'Marker', 'Commitment', 'Touchpoint')),
  rhythm text not null default 'once' check (rhythm in ('once', 'daily', 'weekly', 'monthly', 'quarterly', 'annual', 'custom')),
  lifecycle text not null default 'scheduled' check (lifecycle in ('scheduled', 'completed', 'rescheduled', 'cancelled')),
  source_status public.work_signal_status,
  review_state public.review_state not null default 'private',
  starts_on date not null,
  ends_on date,
  department_id uuid references public.departments(id) on delete set null,
  property_id uuid references public.properties(id) on delete set null,
  action_item_id uuid references public.action_items(id) on delete set null,
  source_type text,
  source_id uuid,
  origin_waypoint_id uuid references public.waypoints(id) on delete set null,
  why_it_matters text,
  who_it_impacts text,
  support_needed text,
  outcome_expected text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.review_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  requester_id uuid references public.profiles(id) on delete set null,
  reviewer_id uuid references public.profiles(id) on delete set null,
  source_type text not null,
  source_id uuid not null,
  title text not null,
  status public.review_state not null default 'pending',
  summary text,
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.checklist_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  cadence public.workflow_frequency not null default 'quarterly',
  due_day integer,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.checklist_sections (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.checklist_templates(id) on delete cascade,
  title text not null,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.checklist_sections(id) on delete cascade,
  label text not null,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.checklist_submissions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  template_id uuid not null references public.checklist_templates(id) on delete cascade,
  property_id uuid references public.properties(id) on delete cascade,
  assigned_to uuid references public.profiles(id) on delete set null,
  reviewer_id uuid references public.profiles(id) on delete set null,
  priority_id uuid references public.priorities(id) on delete set null,
  period_label text not null,
  due_on date not null,
  prompt_on date,
  reminder_on date,
  status text not null default 'scheduled',
  submitted_at timestamptz,
  reviewed_at timestamptz,
  credited_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (template_id, property_id, period_label)
);

create table if not exists public.checklist_responses (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.checklist_submissions(id) on delete cascade,
  item_id uuid not null references public.checklist_items(id) on delete cascade,
  response_value text,
  comments text,
  correction_due_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (submission_id, item_id)
);

create table if not exists public.workflow_definitions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  department_id uuid references public.departments(id) on delete set null,
  owner_id uuid references public.profiles(id) on delete set null,
  reviewer_id uuid references public.profiles(id) on delete set null,
  name text not null,
  workflow_key text not null,
  frequency public.workflow_frequency not null,
  cadence_label text,
  source_type text,
  source_id uuid,
  channel text not null default 'teams',
  prompt_offset_days integer,
  reminder_offset_days integer,
  due_offset_days integer,
  grace_period_days integer not null default 0,
  expected_completion_rate numeric(5, 2),
  escalation_policy jsonb not null default '{}',
  success_metrics jsonb not null default '[]',
  config jsonb not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, workflow_key)
);

create table if not exists public.workflow_runs (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references public.workflow_definitions(id) on delete cascade,
  run_for date not null,
  status text not null default 'queued',
  started_at timestamptz,
  finished_at timestamptz,
  error_message text,
  created_at timestamptz not null default now()
);

create table if not exists public.teams_accounts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  teams_user_id text,
  teams_conversation_id text,
  teams_channel_id text,
  tenant_id text,
  webhook_url text,
  delivery_scope text not null default 'channel',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notification_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  recipient_profile_id uuid references public.profiles(id) on delete set null,
  actor_profile_id uuid references public.profiles(id) on delete set null,
  source_type text not null,
  source_id uuid not null,
  notification_type text not null,
  priority text not null default 'normal',
  channel text not null default 'teams',
  card_template_key text,
  scheduled_for timestamptz not null default now(),
  sent_at timestamptz,
  read_at timestamptz,
  dismissed_at timestamptz,
  status text not null default 'queued',
  payload jsonb not null default '{}',
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.adaptive_card_deliveries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  notification_event_id uuid references public.notification_events(id) on delete set null,
  workflow_run_id uuid references public.workflow_runs(id) on delete set null,
  teams_account_id uuid references public.teams_accounts(id) on delete set null,
  source_type text not null,
  source_id uuid not null,
  recipient_profile_id uuid references public.profiles(id) on delete set null,
  card_payload jsonb not null,
  delivery_status text not null default 'queued',
  sent_at timestamptz,
  response_payload jsonb,
  error_message text,
  created_at timestamptz not null default now()
);

create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  department_id uuid references public.departments(id) on delete set null,
  actor_profile_id uuid references public.profiles(id) on delete set null,
  source_type text not null,
  source_id uuid not null,
  event_type text not null,
  visibility text not null default 'involved' check (visibility in ('involved', 'department', 'olt', 'organization')),
  summary text,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  department_id uuid references public.departments(id) on delete set null,
  author_profile_id uuid references public.profiles(id) on delete set null,
  source_type text not null,
  source_id uuid not null,
  body text not null,
  visibility text not null default 'involved' check (visibility in ('involved', 'department', 'olt', 'organization')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  department_id uuid references public.departments(id) on delete set null,
  uploaded_by uuid references public.profiles(id) on delete set null,
  source_type text not null,
  source_id uuid not null,
  file_name text not null,
  file_url text not null,
  mime_type text,
  file_size_bytes bigint,
  visibility text not null default 'involved' check (visibility in ('involved', 'department', 'olt', 'organization')),
  created_at timestamptz not null default now()
);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  owner_id uuid references public.profiles(id) on delete set null,
  name text not null,
  organization_name text,
  circle text,
  relationship text,
  stage text,
  influence text,
  email text,
  phone text,
  next_step text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.touchpoints (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  owner_id uuid references public.profiles(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  source_type text,
  source_id uuid,
  occurred_on date not null,
  touchpoint_type text not null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.brand_assets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  asset_key text not null,
  label text not null,
  cloudinary_public_id text,
  secure_url text not null,
  asset_type text not null default 'image',
  usage_context text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, asset_key)
);

create or replace function public.can_read_work_source(
  org_id uuid,
  visibility_value text,
  department_value uuid,
  source_type_value text,
  source_id_value uuid,
  participant_profile_id uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    public.is_admin()
    or participant_profile_id = auth.uid()
    or (visibility_value = 'organization' and public.is_org_member(org_id))
    or (visibility_value = 'olt' and public.is_olt_member(org_id))
    or (
      visibility_value = 'department'
      and exists (
        select 1
        from public.profiles p
        where p.id = auth.uid()
          and p.organization_id = org_id
          and p.department_id = department_value
      )
    )
    or (
      exists (
        select 1
        from public.work_object_assignments woa
        where woa.organization_id = org_id
          and woa.source_type = source_type_value
          and woa.source_id = source_id_value
          and woa.profile_id = auth.uid()
      )
    )
    or (
      source_type_value = 'action_item'
      and exists (
        select 1
        from public.action_items ai
        where ai.id = source_id_value
          and (ai.owner_id = auth.uid() or ai.created_by = auth.uid() or public.is_olt_member(ai.organization_id))
      )
    )
    or (
      source_type_value = 'priority'
      and exists (
        select 1
        from public.priorities pr
        where pr.id = source_id_value
          and (pr.owner_id = auth.uid() or public.is_olt_member(pr.organization_id))
      )
    )
    or (
      source_type_value = 'workplan'
      and exists (
        select 1
        from public.workplans wp
        where wp.id = source_id_value
          and (wp.lead_id = auth.uid() or public.is_olt_member(wp.organization_id))
      )
    )
    or (
      source_type_value = 'stuck'
      and exists (
        select 1
        from public.stucks s
        where s.id = source_id_value
          and (s.person_stuck_id = auth.uid() or s.help_from_id = auth.uid() or public.is_olt_member(s.organization_id))
      )
    )
    or (
      source_type_value = 'weekly_action_entry'
      and exists (
        select 1
        from public.weekly_action_entries wae
        where wae.id = source_id_value
          and (wae.owner_id = auth.uid() or public.is_olt_member(wae.organization_id))
      )
    )
    or (
      source_type_value = 'weekly_action_task'
      and exists (
        select 1
        from public.weekly_action_tasks wat
        join public.weekly_action_entries wae on wae.id = wat.entry_id
        where wat.id = source_id_value
          and (wat.owner_id = auth.uid() or wat.created_by = auth.uid() or wae.owner_id = auth.uid() or public.is_olt_member(wat.organization_id))
      )
    )
    or (
      source_type_value = 'calendar_event'
      and exists (
        select 1
        from public.waypoints w
        where w.id = source_id_value
          and (
            w.owner_id = auth.uid()
            or w.submitted_by = auth.uid()
            or w.approved_by = auth.uid()
            or (w.scope = 'organization' and public.is_org_member(w.organization_id))
          )
      )
    )
    or (
      source_type_value = 'checklist_submission'
      and exists (
        select 1
        from public.checklist_submissions cs
        where cs.id = source_id_value
          and (cs.assigned_to = auth.uid() or cs.reviewer_id = auth.uid() or public.is_olt_member(cs.organization_id))
      )
    );
$$;

create index if not exists idx_profiles_org on public.profiles(organization_id);
create index if not exists idx_properties_org on public.properties(organization_id);
create index if not exists idx_planning_cycles_org on public.planning_cycles(organization_id, year, quarter);
create index if not exists idx_quarterly_pillars_cycle on public.quarterly_pillars(planning_cycle_id, display_order);
create index if not exists idx_strategic_success_metrics_pillar on public.strategic_success_metrics(strategic_pillar_id);
create index if not exists idx_initiatives_pillar on public.initiatives(strategic_pillar_id);
create index if not exists idx_workplans_pillar on public.workplans(strategic_pillar_id);
create index if not exists idx_workplans_quarterly_pillar on public.workplans(quarterly_pillar_id);
create index if not exists idx_priorities_pillar on public.priorities(strategic_pillar_id);
create index if not exists idx_priorities_quarterly_pillar on public.priorities(quarterly_pillar_id);
create index if not exists idx_priorities_owner on public.priorities(owner_id);
create index if not exists idx_priorities_workplan on public.priorities(workplan_id);
create index if not exists idx_key_objectives_priority on public.key_objectives(priority_id);
create index if not exists idx_key_objectives_owner on public.key_objectives(owner_id);
create index if not exists idx_objective_kpis_objective on public.objective_kpis(key_objective_id);
create index if not exists idx_action_items_pillar on public.action_items(strategic_pillar_id);
create index if not exists idx_action_items_department_visibility on public.action_items(department_id, visibility);
create index if not exists idx_action_items_workplan on public.action_items(workplan_id);
create index if not exists idx_weekly_action_reports_week on public.weekly_action_reports(organization_id, week_start, status);
create index if not exists idx_weekly_action_entries_report on public.weekly_action_entries(report_id, owner_id, rank);
create index if not exists idx_weekly_action_entries_links on public.weekly_action_entries(priority_id, workplan_id, stuck_id);
create index if not exists idx_weekly_action_tasks_entry on public.weekly_action_tasks(entry_id, status, due_on);
create index if not exists idx_work_object_assignments_source on public.work_object_assignments(source_type, source_id);
create index if not exists idx_work_object_assignments_profile on public.work_object_assignments(profile_id, assignment_role);
create index if not exists idx_workplan_huddle_reviews_workplan on public.workplan_huddle_reviews(workplan_id, decision);
create index if not exists idx_waypoints_owner_scope on public.waypoints(owner_id, scope);
create index if not exists idx_waypoints_date on public.waypoints(starts_on);
create index if not exists idx_waypoints_action_item on public.waypoints(action_item_id);
create index if not exists idx_checklist_submissions_due on public.checklist_submissions(due_on, status);
create index if not exists idx_checklist_submissions_property on public.checklist_submissions(property_id);
create index if not exists idx_review_requests_reviewer on public.review_requests(reviewer_id, status);
create index if not exists idx_workflow_definitions_department on public.workflow_definitions(department_id, active);
create index if not exists idx_workflow_definitions_owner on public.workflow_definitions(owner_id, active);
create index if not exists idx_workflow_definitions_reviewer on public.workflow_definitions(reviewer_id, active);
create index if not exists idx_notification_events_recipient on public.notification_events(recipient_profile_id, status, scheduled_for);
create index if not exists idx_notification_events_source on public.notification_events(source_type, source_id);
create index if not exists idx_notification_events_status on public.notification_events(status, scheduled_for);
create index if not exists idx_adaptive_card_deliveries_source on public.adaptive_card_deliveries(source_type, source_id);
create index if not exists idx_activity_events_source on public.activity_events(source_type, source_id, created_at);
create index if not exists idx_comments_source on public.comments(source_type, source_id, created_at);
create index if not exists idx_attachments_source on public.attachments(source_type, source_id, created_at);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'organizations', 'departments', 'profiles', 'properties', 'strategic_plans',
    'planning_cycles', 'strategic_pillars', 'quarterly_pillars', 'strategic_success_metrics', 'initiatives', 'workplans', 'priorities', 'key_objectives', 'objective_kpis', 'metrics',
    'huddles', 'workplan_huddle_reviews', 'action_items', 'weekly_action_reports', 'weekly_action_entries', 'weekly_action_tasks', 'work_object_assignments', 'stucks', 'waypoints', 'review_requests',
    'checklist_templates', 'checklist_submissions', 'checklist_responses',
    'workflow_definitions', 'teams_accounts', 'notification_events', 'comments', 'contacts', 'touchpoints',
    'brand_assets'
  ]
  loop
    execute format('drop trigger if exists set_%I_updated_at on public.%I', table_name, table_name);
    execute format(
      'create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      table_name,
      table_name
    );
  end loop;
end $$;

alter table public.organizations enable row level security;
alter table public.departments enable row level security;
alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.property_assignments enable row level security;
alter table public.strategic_plans enable row level security;
alter table public.planning_cycles enable row level security;
alter table public.strategic_pillars enable row level security;
alter table public.quarterly_pillars enable row level security;
alter table public.strategic_success_metrics enable row level security;
alter table public.initiatives enable row level security;
alter table public.workplans enable row level security;
alter table public.priorities enable row level security;
alter table public.key_objectives enable row level security;
alter table public.objective_kpis enable row level security;
alter table public.metrics enable row level security;
alter table public.metric_values enable row level security;
alter table public.huddles enable row level security;
alter table public.huddle_members enable row level security;
alter table public.workplan_huddle_reviews enable row level security;
alter table public.action_items enable row level security;
alter table public.weekly_action_reports enable row level security;
alter table public.weekly_action_entries enable row level security;
alter table public.weekly_action_tasks enable row level security;
alter table public.work_object_assignments enable row level security;
alter table public.stucks enable row level security;
alter table public.waypoints enable row level security;
alter table public.review_requests enable row level security;
alter table public.checklist_templates enable row level security;
alter table public.checklist_sections enable row level security;
alter table public.checklist_items enable row level security;
alter table public.checklist_submissions enable row level security;
alter table public.checklist_responses enable row level security;
alter table public.workflow_definitions enable row level security;
alter table public.workflow_runs enable row level security;
alter table public.teams_accounts enable row level security;
alter table public.notification_events enable row level security;
alter table public.adaptive_card_deliveries enable row level security;
alter table public.activity_events enable row level security;
alter table public.comments enable row level security;
alter table public.attachments enable row level security;
alter table public.contacts enable row level security;
alter table public.touchpoints enable row level security;
alter table public.brand_assets enable row level security;

create policy "org members can read organizations"
on public.organizations for select
using (public.is_org_member(id) or public.is_admin());

create policy "org members can read profiles"
on public.profiles for select
using (public.is_org_member(organization_id) or public.is_admin());

create policy "users can update their own profile"
on public.profiles for update
using (id = auth.uid())
with check (id = auth.uid());

create policy "admins can manage profiles"
on public.profiles for all
using (public.is_admin())
with check (public.is_admin());

create policy "org members can read departments"
on public.departments for select
using (public.is_org_member(organization_id) or public.is_admin());

create policy "org members can read properties"
on public.properties for select
using (public.is_org_member(organization_id) or public.is_admin());

create policy "admins manage properties"
on public.properties for all
using (public.is_admin())
with check (public.is_admin());

create policy "org members read property assignments"
on public.property_assignments for select
using (
  exists (
    select 1
    from public.properties p
    where p.id = property_assignments.property_id
      and (public.is_admin() or public.is_org_member(p.organization_id))
  )
);

create policy "admins manage property assignments"
on public.property_assignments for all
using (public.is_admin())
with check (public.is_admin());

create policy "org members read strategic plans"
on public.strategic_plans for select
using (public.is_org_member(organization_id) or public.is_admin());

create policy "admins manage strategic plans"
on public.strategic_plans for all
using (public.is_admin())
with check (public.is_admin());

create policy "org members read planning cycles"
on public.planning_cycles for select
using (public.is_org_member(organization_id) or public.is_admin());

create policy "elt manages planning cycles"
on public.planning_cycles for all
using (public.is_admin() or public.is_elt_member(organization_id))
with check (public.is_admin() or public.is_elt_member(organization_id));

create policy "org members read strategic pillars"
on public.strategic_pillars for select
using (
  public.is_admin()
  or exists (
    select 1
    from public.strategic_plans sp
    where sp.id = strategic_pillars.strategic_plan_id
      and public.is_org_member(sp.organization_id)
  )
);

create policy "admins manage strategic pillars"
on public.strategic_pillars for all
using (public.is_admin())
with check (public.is_admin());

create policy "org members read quarterly pillars"
on public.quarterly_pillars for select
using (public.is_org_member(organization_id) or public.is_admin());

create policy "elt manages quarterly pillars"
on public.quarterly_pillars for all
using (public.is_admin() or public.is_elt_member(organization_id))
with check (public.is_admin() or public.is_elt_member(organization_id));

create policy "org members read strategic success metrics"
on public.strategic_success_metrics for select
using (public.is_org_member(organization_id) or public.is_admin());

create policy "admins manage strategic success metrics"
on public.strategic_success_metrics for all
using (public.is_admin())
with check (public.is_admin());

create policy "org members read initiatives"
on public.initiatives for select
using (public.is_org_member(organization_id) or public.is_admin());

create policy "owners and admins manage initiatives"
on public.initiatives for all
using (public.is_admin() or owner_id = auth.uid())
with check (public.is_admin() or owner_id = auth.uid());

create policy "org members read workplans"
on public.workplans for select
using (public.is_org_member(organization_id) or public.is_admin());

create policy "leads and admins manage workplans"
on public.workplans for all
using (public.is_admin() or public.is_olt_member(organization_id) or lead_id = auth.uid())
with check (public.is_admin() or public.is_olt_member(organization_id) or lead_id = auth.uid());

create policy "org members read priorities"
on public.priorities for select
using (public.is_org_member(organization_id) or public.is_admin());

create policy "owners and admins manage priorities"
on public.priorities for all
using (public.is_admin() or public.is_olt_member(organization_id) or owner_id = auth.uid())
with check (public.is_admin() or public.is_olt_member(organization_id) or owner_id = auth.uid());

create policy "org members read key objectives"
on public.key_objectives for select
using (public.is_org_member(organization_id) or public.is_admin());

create policy "owners and admins manage key objectives"
on public.key_objectives for all
using (
  public.is_admin()
  or public.is_olt_member(organization_id)
  or owner_id = auth.uid()
  or exists (
    select 1
    from public.work_object_assignments woa
    where woa.source_type = 'key_objective'
      and woa.source_id = key_objectives.id
      and woa.profile_id = auth.uid()
      and woa.assignment_role in ('owner', 'lead', 'accountable', 'assignee')
  )
)
with check (public.is_admin() or public.is_olt_member(organization_id) or owner_id = auth.uid());

create policy "org members read objective kpis"
on public.objective_kpis for select
using (public.is_org_member(organization_id) or public.is_admin());

create policy "owners and objective owners manage objective kpis"
on public.objective_kpis for all
using (
  public.is_admin()
  or public.is_olt_member(organization_id)
  or owner_id = auth.uid()
  or exists (
    select 1
    from public.key_objectives ko
    where ko.id = objective_kpis.key_objective_id
      and ko.owner_id = auth.uid()
  )
)
with check (
  public.is_admin()
  or public.is_olt_member(organization_id)
  or owner_id = auth.uid()
  or exists (
    select 1
    from public.key_objectives ko
    where ko.id = objective_kpis.key_objective_id
      and ko.owner_id = auth.uid()
  )
);

create policy "org members read metrics"
on public.metrics for select
using (public.is_org_member(organization_id) or public.is_admin());

create policy "owners and olt manage metrics"
on public.metrics for all
using (public.is_admin() or public.is_olt_member(organization_id) or owner_id = auth.uid())
with check (public.is_admin() or public.is_olt_member(organization_id) or owner_id = auth.uid());

create policy "org members read metric values"
on public.metric_values for select
using (
  exists (
    select 1
    from public.metrics m
    where m.id = metric_values.metric_id
      and (public.is_admin() or public.is_org_member(m.organization_id))
  )
);

create policy "metric owners and olt manage metric values"
on public.metric_values for all
using (
  exists (
    select 1
    from public.metrics m
    where m.id = metric_values.metric_id
      and (public.is_admin() or public.is_olt_member(m.organization_id) or m.owner_id = auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.metrics m
    where m.id = metric_values.metric_id
      and (public.is_admin() or public.is_olt_member(m.organization_id) or m.owner_id = auth.uid())
  )
);

create policy "org members read huddles"
on public.huddles for select
using (public.is_org_member(organization_id) or public.is_admin());

create policy "huddle owners and olt manage huddles"
on public.huddles for all
using (public.is_admin() or public.is_olt_member(organization_id) or owner_id = auth.uid())
with check (public.is_admin() or public.is_olt_member(organization_id) or owner_id = auth.uid());

create policy "org members read huddle members"
on public.huddle_members for select
using (
  exists (
    select 1
    from public.huddles h
    where h.id = huddle_members.huddle_id
      and (public.is_admin() or public.is_org_member(h.organization_id))
  )
);

create policy "huddle owners and olt manage huddle members"
on public.huddle_members for all
using (
  exists (
    select 1
    from public.huddles h
    where h.id = huddle_members.huddle_id
      and (public.is_admin() or public.is_olt_member(h.organization_id) or h.owner_id = auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.huddles h
    where h.id = huddle_members.huddle_id
      and (public.is_admin() or public.is_olt_member(h.organization_id) or h.owner_id = auth.uid())
  )
);

create policy "org members read workplan huddle reviews"
on public.workplan_huddle_reviews for select
using (public.is_org_member(organization_id) or public.is_admin());

create policy "olt manages workplan huddle reviews"
on public.workplan_huddle_reviews for all
using (public.is_admin() or public.is_olt_member(organization_id) or requested_by = auth.uid() or reviewed_by = auth.uid())
with check (public.is_admin() or public.is_olt_member(organization_id) or requested_by = auth.uid() or reviewed_by = auth.uid());

create policy "users read visible action items"
on public.action_items for select
using (
  public.is_admin()
  or owner_id = auth.uid()
  or created_by = auth.uid()
  or (visibility = 'organization' and public.is_org_member(organization_id))
  or (
    visibility = 'department'
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.organization_id = action_items.organization_id
        and p.department_id = action_items.department_id
    )
  )
  or (
    visibility = 'olt'
    and public.is_olt_member(organization_id)
  )
  or exists (
    select 1
    from public.work_object_assignments woa
    where woa.source_type = 'action_item'
      and woa.source_id = action_items.id
      and woa.profile_id = auth.uid()
  )
);

create policy "assigned users and admins manage action items"
on public.action_items for all
using (
  public.is_admin()
  or public.is_olt_member(organization_id)
  or owner_id = auth.uid()
  or created_by = auth.uid()
  or exists (
    select 1
    from public.work_object_assignments woa
    where woa.source_type = 'action_item'
      and woa.source_id = action_items.id
      and woa.profile_id = auth.uid()
      and woa.assignment_role in ('owner', 'lead', 'accountable', 'assignee')
  )
)
with check (
  public.is_admin()
  or public.is_olt_member(organization_id)
  or owner_id = auth.uid()
  or created_by = auth.uid()
);

create policy "org members read weekly action reports"
on public.weekly_action_reports for select
using (public.is_org_member(organization_id) or public.is_admin());

create policy "olt manages weekly action reports"
on public.weekly_action_reports for all
using (public.is_admin() or public.is_olt_member(organization_id) or created_by = auth.uid())
with check (public.is_admin() or public.is_olt_member(organization_id) or created_by = auth.uid());

create policy "org members read weekly action entries"
on public.weekly_action_entries for select
using (public.is_org_member(organization_id) or public.is_admin());

create policy "olt and owners manage weekly action entries"
on public.weekly_action_entries for all
using (public.is_admin() or public.is_olt_member(organization_id) or owner_id = auth.uid())
with check (public.is_admin() or public.is_olt_member(organization_id) or owner_id = auth.uid());

create policy "org members read weekly action tasks"
on public.weekly_action_tasks for select
using (
  public.is_org_member(organization_id)
  or public.is_admin()
);

create policy "task owners and olt manage weekly action tasks"
on public.weekly_action_tasks for all
using (
  public.is_admin()
  or public.is_olt_member(organization_id)
  or owner_id = auth.uid()
  or created_by = auth.uid()
  or exists (
    select 1
    from public.weekly_action_entries wae
    where wae.id = weekly_action_tasks.entry_id
      and wae.owner_id = auth.uid()
  )
)
with check (
  public.is_admin()
  or public.is_olt_member(organization_id)
  or owner_id = auth.uid()
  or created_by = auth.uid()
  or exists (
    select 1
    from public.weekly_action_entries wae
    where wae.id = weekly_action_tasks.entry_id
      and wae.owner_id = auth.uid()
  )
);

create policy "users read relevant work object assignments"
on public.work_object_assignments for select
using (
  public.is_admin()
  or public.is_olt_member(organization_id)
  or profile_id = auth.uid()
  or assigned_by = auth.uid()
  or (
    department_id is not null
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.organization_id = work_object_assignments.organization_id
        and p.department_id = work_object_assignments.department_id
    )
  )
);

create policy "olt and source owners manage work object assignments"
on public.work_object_assignments for all
using (
  public.is_admin()
  or public.is_olt_member(organization_id)
  or assigned_by = auth.uid()
)
with check (
  public.is_admin()
  or public.is_olt_member(organization_id)
  or assigned_by = auth.uid()
);

create policy "involved users read stucks"
on public.stucks for select
using (
  public.is_admin()
  or public.is_olt_member(organization_id)
  or person_stuck_id = auth.uid()
  or help_from_id = auth.uid()
);

create policy "involved users manage stucks"
on public.stucks for all
using (
  public.is_admin()
  or public.is_olt_member(organization_id)
  or person_stuck_id = auth.uid()
  or help_from_id = auth.uid()
)
with check (
  public.is_admin()
  or public.is_olt_member(organization_id)
  or person_stuck_id = auth.uid()
  or help_from_id = auth.uid()
);

create policy "org members read review requests"
on public.review_requests for select
using (public.is_org_member(organization_id) or requester_id = auth.uid() or reviewer_id = auth.uid() or public.is_admin());

create policy "requesters and admins create review requests"
on public.review_requests for insert
with check (public.is_org_member(organization_id) or public.is_admin());

create policy "reviewers and admins update review requests"
on public.review_requests for update
using (public.is_admin() or reviewer_id = auth.uid())
with check (public.is_admin() or reviewer_id = auth.uid());

create policy "org members read checklist templates"
on public.checklist_templates for select
using (public.is_org_member(organization_id) or public.is_admin());

create policy "admins manage checklist templates"
on public.checklist_templates for all
using (public.is_admin() or public.is_olt_member(organization_id))
with check (public.is_admin() or public.is_olt_member(organization_id));

create policy "org members read checklist sections"
on public.checklist_sections for select
using (
  exists (
    select 1
    from public.checklist_templates t
    where t.id = checklist_sections.template_id
      and (public.is_admin() or public.is_org_member(t.organization_id))
  )
);

create policy "admins manage checklist sections"
on public.checklist_sections for all
using (
  exists (
    select 1
    from public.checklist_templates t
    where t.id = checklist_sections.template_id
      and (public.is_admin() or public.is_olt_member(t.organization_id))
  )
)
with check (
  exists (
    select 1
    from public.checklist_templates t
    where t.id = checklist_sections.template_id
      and (public.is_admin() or public.is_olt_member(t.organization_id))
  )
);

create policy "org members read checklist items"
on public.checklist_items for select
using (
  exists (
    select 1
    from public.checklist_sections s
    join public.checklist_templates t on t.id = s.template_id
    where s.id = checklist_items.section_id
      and (public.is_admin() or public.is_org_member(t.organization_id))
  )
);

create policy "admins manage checklist items"
on public.checklist_items for all
using (
  exists (
    select 1
    from public.checklist_sections s
    join public.checklist_templates t on t.id = s.template_id
    where s.id = checklist_items.section_id
      and (public.is_admin() or public.is_olt_member(t.organization_id))
  )
)
with check (
  exists (
    select 1
    from public.checklist_sections s
    join public.checklist_templates t on t.id = s.template_id
    where s.id = checklist_items.section_id
      and (public.is_admin() or public.is_olt_member(t.organization_id))
  )
);

create policy "users read own personal waypoints and org waypoints"
on public.waypoints for select
using (
  public.is_admin()
  or (scope = 'personal' and owner_id = auth.uid())
  or (scope = 'organization' and public.is_org_member(organization_id) and review_state in ('approved', 'pending'))
);

create policy "users manage own personal waypoints"
on public.waypoints for all
using (public.is_admin() or owner_id = auth.uid())
with check (public.is_admin() or owner_id = auth.uid());

create policy "assigned users and reviewers read checklist submissions"
on public.checklist_submissions for select
using (
  public.is_admin()
  or assigned_to = auth.uid()
  or reviewer_id = auth.uid()
  or public.is_org_member(organization_id)
);

create policy "assigned users update checklist submissions"
on public.checklist_submissions for update
using (public.is_admin() or assigned_to = auth.uid() or reviewer_id = auth.uid())
with check (public.is_admin() or assigned_to = auth.uid() or reviewer_id = auth.uid());

create policy "assigned users and reviewers read checklist responses"
on public.checklist_responses for select
using (
  exists (
    select 1
    from public.checklist_submissions s
    where s.id = checklist_responses.submission_id
      and (public.is_admin() or s.assigned_to = auth.uid() or s.reviewer_id = auth.uid() or public.is_org_member(s.organization_id))
  )
);

create policy "assigned users update checklist responses"
on public.checklist_responses for all
using (
  exists (
    select 1
    from public.checklist_submissions s
    where s.id = checklist_responses.submission_id
      and (public.is_admin() or s.assigned_to = auth.uid() or s.reviewer_id = auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.checklist_submissions s
    where s.id = checklist_responses.submission_id
      and (public.is_admin() or s.assigned_to = auth.uid() or s.reviewer_id = auth.uid())
  )
);

create policy "users read own notifications"
on public.notification_events for select
using (
  public.is_admin()
  or recipient_profile_id = auth.uid()
  or actor_profile_id = auth.uid()
);

create policy "org members create notifications"
on public.notification_events for insert
with check (public.is_org_member(organization_id) or public.is_admin());

create policy "recipients and admins update notifications"
on public.notification_events for update
using (public.is_admin() or recipient_profile_id = auth.uid())
with check (public.is_admin() or recipient_profile_id = auth.uid());

create policy "org members read workflow definitions"
on public.workflow_definitions for select
using (public.is_org_member(organization_id) or public.is_admin());

create policy "admins manage workflow definitions"
on public.workflow_definitions for all
using (public.is_admin())
with check (public.is_admin());

create policy "org members read workflow runs"
on public.workflow_runs for select
using (
  exists (
    select 1
    from public.workflow_definitions wd
    where wd.id = workflow_runs.workflow_id
      and (public.is_admin() or public.is_org_member(wd.organization_id))
  )
);

create policy "admins manage workflow runs"
on public.workflow_runs for all
using (
  exists (
    select 1
    from public.workflow_definitions wd
    where wd.id = workflow_runs.workflow_id
      and public.is_admin()
  )
)
with check (
  exists (
    select 1
    from public.workflow_definitions wd
    where wd.id = workflow_runs.workflow_id
      and public.is_admin()
  )
);

create policy "users read own teams accounts"
on public.teams_accounts for select
using (public.is_admin() or profile_id = auth.uid() or public.is_olt_member(organization_id));

create policy "admins manage teams accounts"
on public.teams_accounts for all
using (public.is_admin())
with check (public.is_admin());

create policy "users read relevant adaptive card deliveries"
on public.adaptive_card_deliveries for select
using (
  public.is_admin()
  or recipient_profile_id = auth.uid()
  or public.is_olt_member(organization_id)
);

create policy "admins manage adaptive card deliveries"
on public.adaptive_card_deliveries for all
using (public.is_admin())
with check (public.is_admin());

create policy "users read visible activity events"
on public.activity_events for select
using (
  public.can_read_work_source(organization_id, visibility, department_id, source_type, source_id, actor_profile_id)
);

create policy "org members create activity events"
on public.activity_events for insert
with check (public.is_org_member(organization_id) or public.is_admin());

create policy "users read visible comments"
on public.comments for select
using (
  public.can_read_work_source(organization_id, visibility, department_id, source_type, source_id, author_profile_id)
);

create policy "org members create comments"
on public.comments for insert
with check (public.is_org_member(organization_id) or public.is_admin());

create policy "authors and admins update comments"
on public.comments for update
using (public.is_admin() or author_profile_id = auth.uid())
with check (public.is_admin() or author_profile_id = auth.uid());

create policy "users read visible attachments"
on public.attachments for select
using (
  public.can_read_work_source(organization_id, visibility, department_id, source_type, source_id, uploaded_by)
);

create policy "org members create attachments"
on public.attachments for insert
with check (public.is_org_member(organization_id) or public.is_admin());

create policy "uploaders and admins update attachments"
on public.attachments for update
using (public.is_admin() or uploaded_by = auth.uid())
with check (public.is_admin() or uploaded_by = auth.uid());

create policy "owners and olt read contacts"
on public.contacts for select
using (public.is_admin() or owner_id = auth.uid() or public.is_olt_member(organization_id));

create policy "owners and olt manage contacts"
on public.contacts for all
using (public.is_admin() or owner_id = auth.uid() or public.is_olt_member(organization_id))
with check (public.is_admin() or owner_id = auth.uid() or public.is_olt_member(organization_id));

create policy "owners and olt read touchpoints"
on public.touchpoints for select
using (public.is_admin() or owner_id = auth.uid() or public.is_olt_member(organization_id));

create policy "owners and olt manage touchpoints"
on public.touchpoints for all
using (public.is_admin() or owner_id = auth.uid() or public.is_olt_member(organization_id))
with check (public.is_admin() or owner_id = auth.uid() or public.is_olt_member(organization_id));

create policy "org members read brand assets"
on public.brand_assets for select
using (public.is_org_member(organization_id) or public.is_admin());
