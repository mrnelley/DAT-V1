create extension if not exists pgcrypto;

do $$
begin
  create type public.compass_status as enum ('on_course', 'needs_attention', 'off_course', 'completed', 'rescheduled');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.review_state as enum ('private', 'pending', 'approved', 'declined', 'needs_follow_up');
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

create table if not exists public.strategic_pillars (
  id uuid primary key default gen_random_uuid(),
  strategic_plan_id uuid not null references public.strategic_plans(id) on delete cascade,
  title text not null,
  description text,
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
  status public.compass_status not null default 'on_course',
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
  department_id uuid references public.departments(id) on delete set null,
  lead_id uuid references public.profiles(id) on delete set null,
  initiative_id uuid references public.initiatives(id) on delete set null,
  title text not null,
  scope text,
  outcome text,
  status public.compass_status not null default 'on_course',
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
  department_id uuid references public.departments(id) on delete set null,
  owner_id uuid references public.profiles(id) on delete set null,
  workplan_id uuid references public.workplans(id) on delete set null,
  initiative_id uuid references public.initiatives(id) on delete set null,
  title text not null,
  description text,
  priority_type text not null default 'task',
  status public.compass_status not null default 'on_course',
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
  status text not null default 'on_course',
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
  status text not null default 'on_course',
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

create table if not exists public.action_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  strategic_plan_id uuid references public.strategic_plans(id) on delete set null,
  strategic_pillar_id uuid references public.strategic_pillars(id) on delete set null,
  owner_id uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  priority_id uuid references public.priorities(id) on delete set null,
  huddle_id uuid references public.huddles(id) on delete set null,
  title text not null,
  description text,
  status text not null default 'open',
  due_on date,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
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
  representation text not null default 'Waypoint',
  compass_status public.compass_status not null default 'on_course',
  review_state public.review_state not null default 'private',
  starts_on date not null,
  ends_on date,
  department_id uuid references public.departments(id) on delete set null,
  property_id uuid references public.properties(id) on delete set null,
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
  name text not null,
  workflow_key text not null,
  frequency public.workflow_frequency not null,
  source_type text,
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

create table if not exists public.adaptive_card_deliveries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
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

create index if not exists idx_profiles_org on public.profiles(organization_id);
create index if not exists idx_properties_org on public.properties(organization_id);
create index if not exists idx_strategic_success_metrics_pillar on public.strategic_success_metrics(strategic_pillar_id);
create index if not exists idx_initiatives_pillar on public.initiatives(strategic_pillar_id);
create index if not exists idx_workplans_pillar on public.workplans(strategic_pillar_id);
create index if not exists idx_priorities_pillar on public.priorities(strategic_pillar_id);
create index if not exists idx_priorities_owner on public.priorities(owner_id);
create index if not exists idx_priorities_workplan on public.priorities(workplan_id);
create index if not exists idx_key_objectives_priority on public.key_objectives(priority_id);
create index if not exists idx_key_objectives_owner on public.key_objectives(owner_id);
create index if not exists idx_objective_kpis_objective on public.objective_kpis(key_objective_id);
create index if not exists idx_action_items_pillar on public.action_items(strategic_pillar_id);
create index if not exists idx_waypoints_owner_scope on public.waypoints(owner_id, scope);
create index if not exists idx_waypoints_date on public.waypoints(starts_on);
create index if not exists idx_checklist_submissions_due on public.checklist_submissions(due_on, status);
create index if not exists idx_checklist_submissions_property on public.checklist_submissions(property_id);
create index if not exists idx_review_requests_reviewer on public.review_requests(reviewer_id, status);
create index if not exists idx_adaptive_card_deliveries_source on public.adaptive_card_deliveries(source_type, source_id);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'organizations', 'departments', 'profiles', 'properties', 'strategic_plans',
    'strategic_pillars', 'strategic_success_metrics', 'initiatives', 'workplans', 'priorities', 'key_objectives', 'objective_kpis', 'metrics',
    'huddles', 'action_items', 'stucks', 'waypoints', 'review_requests',
    'checklist_templates', 'checklist_submissions', 'checklist_responses',
    'workflow_definitions', 'teams_accounts', 'contacts', 'touchpoints',
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
alter table public.strategic_pillars enable row level security;
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
alter table public.action_items enable row level security;
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
alter table public.adaptive_card_deliveries enable row level security;
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

create policy "org members read strategic plans"
on public.strategic_plans for select
using (public.is_org_member(organization_id) or public.is_admin());

create policy "admins manage strategic plans"
on public.strategic_plans for all
using (public.is_admin())
with check (public.is_admin());

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
using (public.is_admin() or lead_id = auth.uid())
with check (public.is_admin() or lead_id = auth.uid());

create policy "org members read priorities"
on public.priorities for select
using (public.is_org_member(organization_id) or public.is_admin());

create policy "owners and admins manage priorities"
on public.priorities for all
using (public.is_admin() or owner_id = auth.uid())
with check (public.is_admin() or owner_id = auth.uid());

create policy "org members read key objectives"
on public.key_objectives for select
using (public.is_org_member(organization_id) or public.is_admin());

create policy "owners and admins manage key objectives"
on public.key_objectives for all
using (public.is_admin() or owner_id = auth.uid())
with check (public.is_admin() or owner_id = auth.uid());

create policy "org members read objective kpis"
on public.objective_kpis for select
using (public.is_org_member(organization_id) or public.is_admin());

create policy "owners and objective owners manage objective kpis"
on public.objective_kpis for all
using (
  public.is_admin()
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
  or owner_id = auth.uid()
  or exists (
    select 1
    from public.key_objectives ko
    where ko.id = objective_kpis.key_objective_id
      and ko.owner_id = auth.uid()
  )
);

create policy "org members read action items"
on public.action_items for select
using (public.is_org_member(organization_id) or owner_id = auth.uid() or created_by = auth.uid() or public.is_admin());

create policy "assigned users and admins manage action items"
on public.action_items for all
using (public.is_admin() or owner_id = auth.uid() or created_by = auth.uid())
with check (public.is_admin() or owner_id = auth.uid() or created_by = auth.uid());

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

create policy "org members read brand assets"
on public.brand_assets for select
using (public.is_org_member(organization_id) or public.is_admin());
