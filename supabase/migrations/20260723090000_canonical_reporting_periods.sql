-- Reporting periods are the canonical quarter dimension. Domain records point to
-- one period by UUID; display codes such as 2026-Q3 are stable human identifiers.

alter table public.planning_cycles rename to reporting_periods;
alter table public.reporting_periods rename constraint planning_cycles_pkey to reporting_periods_pkey;
alter table public.reporting_periods
  rename constraint planning_cycles_organization_id_year_quarter_key
  to reporting_periods_organization_id_year_quarter_key;

alter table public.quarterly_pillars
  rename column planning_cycle_id to reporting_period_id;
alter table public.quarterly_pillars
  rename constraint quarterly_pillars_planning_cycle_id_fkey
  to quarterly_pillars_reporting_period_id_fkey;

alter table public.weekly_action_reports
  rename column planning_cycle_id to reporting_period_id;
alter table public.weekly_action_reports
  rename constraint weekly_action_reports_planning_cycle_id_fkey
  to weekly_action_reports_reporting_period_id_fkey;

alter index if exists public.idx_planning_cycles_org
  rename to idx_reporting_periods_org;
alter index if exists public.idx_quarterly_pillars_cycle
  rename to idx_quarterly_pillars_period;

alter trigger set_planning_cycles_updated_at
  on public.reporting_periods
  rename to set_reporting_periods_updated_at;

alter policy "org members read planning cycles"
  on public.reporting_periods
  rename to "org members read reporting periods";
alter policy "elt manages planning cycles"
  on public.reporting_periods
  rename to "elt manages reporting periods";

alter table public.reporting_periods
  add column code text,
  add column theme text;

update public.reporting_periods
set quarter = case
  when quarter ~* '^[[:space:]]*Q?[1-4][[:space:]]*$'
    then 'Q' || regexp_replace(quarter, '[^1-4]', '', 'g')
  else upper(trim(quarter))
end;

update public.reporting_periods
set code = year::text || '-' || quarter;

alter table public.reporting_periods
  alter column code set not null,
  add constraint reporting_periods_code_format_check
    check (code ~ '^[0-9]{4}-Q[1-4]$'),
  add constraint reporting_periods_quarter_check
    check (quarter in ('Q1', 'Q2', 'Q3', 'Q4')),
  add constraint reporting_periods_date_order_check
    check (starts_on <= ends_on),
  add constraint reporting_periods_organization_code_key
    unique (organization_id, code);

alter table public.initiatives
  add column reporting_period_id uuid
    references public.reporting_periods(id) on delete set null;

update public.initiatives initiative
set reporting_period_id = period.id
from public.reporting_periods period
where initiative.reporting_period_id is null
  and initiative.organization_id = period.organization_id
  and initiative.year = period.year
  and regexp_replace(coalesce(initiative.quarter, ''), '[^1-4]', '', 'g')
    = regexp_replace(period.quarter, '[^1-4]', '', 'g');

do $$
begin
  if exists (
    select 1
    from public.initiatives
    where (year is not null or quarter is not null)
      and reporting_period_id is null
  ) then
    raise exception 'Initiative year/quarter values must map to a reporting period before migration';
  end if;
end;
$$;

alter table public.initiatives
  drop column year,
  drop column quarter;

alter table public.priorities
  add column reporting_period_id uuid
    references public.reporting_periods(id) on delete restrict;

update public.priorities priority
set reporting_period_id = period.id
from public.reporting_periods period
where priority.reporting_period_id is null
  and priority.period_label is not null
  and priority.organization_id = period.organization_id
  and regexp_replace(upper(priority.period_label), '[^A-Z0-9]', '', 'g')
    in (
      period.quarter || period.year::text,
      period.year::text || period.quarter
    );

do $$
begin
  if exists (
    select 1
    from public.priorities
    where period_label is not null
      and reporting_period_id is null
  ) then
    raise exception 'Priority period labels must map to a reporting period before migration';
  end if;
end;
$$;

drop view if exists public.enterprise_priorities;

alter table public.priorities
  drop column period_label,
  add constraint enterprise_priorities_require_reporting_period
    check (not is_company_priority or reporting_period_id is not null)
    not valid;

create view public.enterprise_priorities
with (security_invoker = true)
as
select *
from public.priorities
where is_company_priority = true
with local check option;

comment on view public.enterprise_priorities is
  'Canonical Enterprise Priority terminology for organization-level priority records.';

alter table public.checklist_submissions
  add column reporting_period_id uuid
    references public.reporting_periods(id) on delete restrict;

update public.checklist_submissions submission
set reporting_period_id = period.id
from public.reporting_periods period
where submission.reporting_period_id is null
  and submission.organization_id = period.organization_id
  and regexp_replace(upper(submission.period_label), '[^A-Z0-9]', '', 'g')
    in (
      period.quarter || period.year::text,
      period.year::text || period.quarter
    );

do $$
begin
  if exists (
    select 1
    from public.checklist_submissions
    where reporting_period_id is null
  ) then
    raise exception 'Checklist period labels must map to a reporting period before migration';
  end if;
end;
$$;

alter table public.checklist_submissions
  drop constraint checklist_submissions_template_id_property_id_period_label_key,
  drop column period_label,
  alter column reporting_period_id set not null,
  add constraint checklist_submissions_period_key
    unique (template_id, property_id, reporting_period_id);

alter table public.priority_status_history
  add column reporting_period_id uuid
    references public.reporting_periods(id) on delete restrict;

update public.priority_status_history history
set reporting_period_id = period.id
from public.reporting_periods period
where history.reporting_period_id is null
  and history.organization_id = period.organization_id
  and history.week_start between period.starts_on and period.ends_on;

do $$
begin
  if exists (
    select 1
    from public.priority_status_history
    where reporting_period_id is null
  ) then
    raise exception 'Priority status history must map to a reporting period before migration';
  end if;
end;
$$;

alter table public.priority_status_history
  alter column reporting_period_id set not null;

create index idx_initiatives_reporting_period
  on public.initiatives(reporting_period_id);
create index idx_priorities_reporting_period
  on public.priorities(reporting_period_id);
create index idx_checklist_submissions_reporting_period
  on public.checklist_submissions(reporting_period_id);
create index idx_priority_status_history_reporting_period
  on public.priority_status_history(reporting_period_id, week_start desc);

comment on table public.reporting_periods is
  'Canonical organization reporting quarters used for planning, execution, and historical views.';
comment on column public.reporting_periods.code is
  'Stable human identifier in YYYY-QN form, for example 2026-Q3.';
comment on column public.priorities.reporting_period_id is
  'Required for Enterprise Priorities; other priority types may remain unperiodized.';
