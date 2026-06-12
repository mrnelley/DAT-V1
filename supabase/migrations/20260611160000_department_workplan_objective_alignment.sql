alter table public.workplans
  add column if not exists planning_year integer;

alter table public.weekly_action_entries
  add column if not exists key_objective_id uuid references public.key_objectives(id) on delete set null;

create index if not exists idx_key_objectives_workplan on public.key_objectives(workplan_id);
create index if not exists idx_weekly_action_entries_objective on public.weekly_action_entries(key_objective_id);

comment on table public.workplans is
  'Annual department-owned containers. Strategic Pillar and Enterprise Priority alignment belongs to the contained key_objectives rows.';

comment on table public.priorities is
  'Priority records. Rows with is_company_priority = true are Enterprise Priorities.';

comment on column public.key_objectives.priority_id is
  'Validated Enterprise Priority relationship for a Department Objective.';

create or replace view public.enterprise_priorities
with (security_invoker = true)
as
select *
from public.priorities
where is_company_priority = true
with local check option;

comment on view public.enterprise_priorities is
  'Canonical Enterprise Priority terminology for organization-level priority records.';

create or replace function public.validate_weekly_objective_alignment()
returns trigger
language plpgsql
as $$
declare
  objective_priority_id uuid;
  objective_workplan_id uuid;
begin
  if new.key_objective_id is null then
    return new;
  end if;

  select priority_id, workplan_id
  into objective_priority_id, objective_workplan_id
  from public.key_objectives
  where id = new.key_objective_id
    and organization_id = new.organization_id;

  if not found then
    raise exception 'Department Objective % is not available in this organization', new.key_objective_id;
  end if;

  if new.workplan_id is not null and new.workplan_id is distinct from objective_workplan_id then
    raise exception 'Weekly Priority workplan must match its Department Objective workplan';
  end if;

  if new.priority_id is not null and new.priority_id is distinct from objective_priority_id then
    raise exception 'Weekly Priority Enterprise Priority must match its Department Objective Enterprise Priority';
  end if;

  new.workplan_id := objective_workplan_id;
  new.priority_id := objective_priority_id;
  new.alignment_type := case when objective_priority_id is null then 'department' else 'both' end;
  return new;
end;
$$;

drop trigger if exists validate_weekly_objective_alignment on public.weekly_action_entries;
create trigger validate_weekly_objective_alignment
before insert or update of key_objective_id, priority_id, workplan_id
on public.weekly_action_entries
for each row
execute function public.validate_weekly_objective_alignment();
