-- ELT maintains long-range strategic references while all organization members
-- can read them. Weekly priority snapshots preserve the executive heat map.

drop policy if exists "admins manage strategic pillars" on public.strategic_pillars;
create policy "elt manages strategic pillars"
on public.strategic_pillars for all
using (
  public.is_admin()
  or exists (
    select 1
    from public.strategic_plans sp
    where sp.id = strategic_pillars.strategic_plan_id
      and public.is_elt_member(sp.organization_id)
  )
)
with check (
  public.is_admin()
  or exists (
    select 1
    from public.strategic_plans sp
    where sp.id = strategic_pillars.strategic_plan_id
      and public.is_elt_member(sp.organization_id)
  )
);

drop policy if exists "admins manage strategic success metrics" on public.strategic_success_metrics;
create policy "elt manages strategic success metrics"
on public.strategic_success_metrics for all
using (public.is_admin() or public.is_elt_member(organization_id))
with check (public.is_admin() or public.is_elt_member(organization_id));

create table if not exists public.priority_status_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  priority_id uuid not null references public.priorities(id) on delete cascade,
  week_start date not null,
  status public.work_signal_status not null,
  recorded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (priority_id, week_start)
);

create index if not exists idx_priority_status_history_priority_week
on public.priority_status_history(priority_id, week_start desc);

alter table public.priority_status_history enable row level security;

create policy "org members read priority status history"
on public.priority_status_history for select
using (public.is_org_member(organization_id) or public.is_admin());

create policy "elt manages priority status history"
on public.priority_status_history for all
using (public.is_admin() or public.is_elt_member(organization_id))
with check (public.is_admin() or public.is_elt_member(organization_id));
