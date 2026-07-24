-- Bootstrap tenant reference data and keep authentication in Supabase Auth.
-- No application user or password is seeded here.

insert into public.organizations (name, slug)
values ('HDC MidAtlantic', 'hdc-midatlantic')
on conflict (slug) do update
set name = excluded.name;

with organization as (
  select id
  from public.organizations
  where slug = 'hdc-midatlantic'
)
insert into public.departments (organization_id, name, slug)
select organization.id, department.name, department.slug
from organization
cross join (
  values
    ('Administration', 'administration'),
    ('Advocacy', 'advocacy'),
    ('Community Relations', 'community-relations'),
    ('Compliance', 'compliance'),
    ('Executive Office', 'executive-office'),
    ('Finance', 'finance'),
    ('Human Resources', 'human-resources'),
    ('Impact and Advancement', 'impact-and-advancement'),
    ('Operations', 'operations'),
    ('Property Management', 'property-management'),
    ('Real Estate Development', 'real-estate-development'),
    ('Resident Services', 'resident-services')
) as department(name, slug)
on conflict (organization_id, slug) do update
set name = excluded.name;

with organization as (
  select id
  from public.organizations
  where slug = 'hdc-midatlantic'
),
periods as (
  select
    year_value,
    quarter_value,
    make_date(year_value, ((quarter_value - 1) * 3) + 1, 1) as starts_on,
    (
      make_date(year_value, ((quarter_value - 1) * 3) + 1, 1)
      + interval '3 months'
      - interval '1 day'
    )::date as ends_on
  from generate_series(2026, 2028) as year_value
  cross join generate_series(1, 4) as quarter_value
  where year_value > 2026 or quarter_value >= 2
)
insert into public.reporting_periods (
  organization_id,
  code,
  label,
  year,
  quarter,
  starts_on,
  ends_on,
  status
)
select
  organization.id,
  periods.year_value::text || '-Q' || periods.quarter_value::text,
  'Q' || periods.quarter_value::text || ' ' || periods.year_value::text,
  periods.year_value,
  'Q' || periods.quarter_value::text,
  periods.starts_on,
  periods.ends_on,
  'draft'
from organization
cross join periods
on conflict (organization_id, code) do update
set
  label = excluded.label,
  year = excluded.year,
  quarter = excluded.quarter,
  starts_on = excluded.starts_on,
  ends_on = excluded.ends_on;

alter table public.profiles
  add column must_reset_password boolean not null default true;

create unique index profiles_email_lower_key
  on public.profiles(lower(email))
  where email is not null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  default_organization_id uuid;
  derived_name text;
begin
  select organization.id
  into default_organization_id
  from public.organizations organization
  where organization.slug = 'hdc-midatlantic';

  if default_organization_id is null then
    raise exception 'The HDC MidAtlantic organization must exist before users are created';
  end if;

  derived_name := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(
      initcap(replace(split_part(coalesce(new.email, ''), '@', 1), '.', ' ')),
      ''
    ),
    'New user'
  );

  insert into public.profiles (
    id,
    organization_id,
    full_name,
    display_name,
    email
  )
  values (
    new.id,
    default_organization_id,
    derived_name,
    derived_name,
    lower(new.email)
  )
  on conflict (id) do update
  set email = excluded.email;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
  set email = lower(new.email)
  where id = new.id;

  return new;
end;
$$;

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
after update of email on auth.users
for each row
when (old.email is distinct from new.email)
execute function public.sync_profile_email();

with organization as (
  select id
  from public.organizations
  where slug = 'hdc-midatlantic'
)
insert into public.profiles (
  id,
  organization_id,
  full_name,
  display_name,
  email
)
select
  auth_user.id,
  organization.id,
  coalesce(
    nullif(btrim(auth_user.raw_user_meta_data ->> 'full_name'), ''),
    nullif(
      initcap(replace(split_part(coalesce(auth_user.email, ''), '@', 1), '.', ' ')),
      ''
    ),
    'New user'
  ),
  coalesce(
    nullif(btrim(auth_user.raw_user_meta_data ->> 'full_name'), ''),
    nullif(
      initcap(replace(split_part(coalesce(auth_user.email, ''), '@', 1), '.', ' ')),
      ''
    ),
    'New user'
  ),
  lower(auth_user.email)
from auth.users auth_user
cross join organization
on conflict (id) do update
set email = excluded.email;

create or replace function public.protect_profile_authorization_fields()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.uid() = old.id and not public.is_admin() then
    if new.id is distinct from old.id
      or new.organization_id is distinct from old.organization_id
      or new.department_id is distinct from old.department_id
      or new.email is distinct from old.email
      or new.role_title is distinct from old.role_title
      or new.working_group is distinct from old.working_group
      or new.dashboard_focus is distinct from old.dashboard_focus
      or new.is_admin is distinct from old.is_admin
      or new.is_active is distinct from old.is_active
      or new.created_at is distinct from old.created_at
    then
      raise exception 'Profile authorization fields may only be changed by an administrator'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists protect_profile_authorization_fields on public.profiles;
create trigger protect_profile_authorization_fields
before update on public.profiles
for each row execute function public.protect_profile_authorization_fields();

revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
revoke execute on all functions in schema public from public, anon;

grant usage on schema public to authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant execute on all functions in schema public to authenticated;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;

revoke execute on function public.handle_new_user() from authenticated;
revoke execute on function public.sync_profile_email() from authenticated;
revoke execute on function public.protect_profile_authorization_fields() from authenticated;

alter default privileges in schema public
  revoke all on tables from anon;
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant all on tables to service_role;
alter default privileges in schema public
  revoke execute on functions from public, anon;
alter default privileges in schema public
  grant execute on functions to authenticated, service_role;

comment on column public.profiles.must_reset_password is
  'Temporary onboarding gate; true until the application completes its initial password-change flow.';
comment on function public.handle_new_user() is
  'Creates the application profile paired one-to-one with a Supabase Auth user.';
