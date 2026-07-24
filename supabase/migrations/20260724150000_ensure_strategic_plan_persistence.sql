-- Strategic pillars require a persisted plan parent. Provision the structural
-- plan record for existing organizations and let ELT maintain it.

drop policy if exists "admins manage strategic plans" on public.strategic_plans;
drop policy if exists "elt manages strategic plans" on public.strategic_plans;

create policy "elt manages strategic plans"
on public.strategic_plans for all
using (
  public.is_admin()
  or public.is_elt_member(organization_id)
)
with check (
  public.is_admin()
  or public.is_elt_member(organization_id)
);

insert into public.strategic_plans (
  organization_id,
  title,
  starts_on,
  ends_on,
  status
)
select
  organization.id,
  organization.name || ' Strategic Plan',
  date '2026-04-01',
  date '2030-12-31',
  'active'
from public.organizations organization
where not exists (
  select 1
  from public.strategic_plans strategic_plan
  where strategic_plan.organization_id = organization.id
);
