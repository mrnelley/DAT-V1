-- Separate the user-facing username and optional contact email from Supabase Auth's
-- internal email identifier.

alter table public.profiles
  add column if not exists username text,
  add column if not exists first_name text,
  add column if not exists last_name text;

with parsed as (
  select
    profile.id,
    coalesce(
      nullif(btrim(profile.display_name), ''),
      nullif(btrim(profile.full_name), ''),
      'Compass user'
    ) as source_name
  from public.profiles profile
)
update public.profiles profile
set
  first_name = coalesce(
    nullif(profile.first_name, ''),
    split_part(parsed.source_name, ' ', 1)
  ),
  last_name = coalesce(
    nullif(profile.last_name, ''),
    nullif(btrim(substr(parsed.source_name, length(split_part(parsed.source_name, ' ', 1)) + 1)), '')
  )
from parsed
where parsed.id = profile.id;

with username_candidates as (
  select
    profile.id,
    profile.organization_id,
    coalesce(
      nullif(
        lower(regexp_replace(auth_user.raw_user_meta_data ->> 'username', '[^a-z0-9._-]+', '', 'g')),
        ''
      ),
      nullif(
        lower(regexp_replace(profile.first_name, '[^a-z0-9._-]+', '', 'g')),
        ''
      ),
      'user'
    ) as base_username
  from public.profiles profile
  left join auth.users auth_user on auth_user.id = profile.id
),
ranked as (
  select
    candidate.*,
    row_number() over (
      partition by candidate.organization_id, candidate.base_username
      order by candidate.id
    ) as duplicate_number
  from username_candidates candidate
)
update public.profiles profile
set username = case
  when ranked.duplicate_number = 1 then ranked.base_username
  else ranked.base_username || ranked.duplicate_number::text
end
from ranked
where ranked.id = profile.id
  and profile.username is null;

update public.profiles profile
set email = null
from auth.users auth_user
where auth_user.id = profile.id
  and coalesce((auth_user.raw_app_meta_data ->> 'compass_managed')::boolean, false);

alter table public.profiles
  alter column username set not null,
  alter column first_name set not null;

create unique index if not exists profiles_organization_username_lower_key
  on public.profiles(organization_id, lower(username));

alter table public.profiles
  drop constraint if exists profiles_username_format_check;

alter table public.profiles
  add constraint profiles_username_format_check
  check (username ~ '^[a-z][a-z0-9._-]{1,31}$');

drop trigger if exists on_auth_user_email_updated on auth.users;
drop function if exists public.sync_profile_email();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  default_organization_id uuid;
  derived_first_name text;
  derived_last_name text;
  derived_name text;
  derived_username text;
begin
  select organization.id
  into default_organization_id
  from public.organizations organization
  where organization.slug = 'hdc-midatlantic';

  if default_organization_id is null then
    raise exception 'The HDC MidAtlantic organization must exist before users are created';
  end if;

  derived_first_name := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'first_name'), ''),
    nullif(split_part(btrim(new.raw_user_meta_data ->> 'full_name'), ' ', 1), ''),
    nullif(initcap(split_part(coalesce(new.email, ''), '@', 1)), ''),
    'User'
  );
  derived_last_name := nullif(btrim(new.raw_user_meta_data ->> 'last_name'), '');
  derived_name := concat_ws(' ', derived_first_name, derived_last_name);
  derived_username := coalesce(
    nullif(
      lower(regexp_replace(new.raw_user_meta_data ->> 'username', '[^a-z0-9._-]+', '', 'g')),
      ''
    ),
    lower(regexp_replace(split_part(coalesce(new.email, ''), '@', 1), '[^a-z0-9._-]+', '', 'g'))
  );

  insert into public.profiles (
    id,
    organization_id,
    username,
    first_name,
    last_name,
    full_name,
    display_name,
    email
  )
  values (
    new.id,
    default_organization_id,
    derived_username,
    derived_first_name,
    derived_last_name,
    derived_name,
    derived_name,
    nullif(lower(btrim(new.raw_user_meta_data ->> 'contact_email')), '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

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
      or new.username is distinct from old.username
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

comment on column public.profiles.username is
  'Stable, case-insensitive login name within an organization.';
comment on column public.profiles.email is
  'Optional contact email. Supabase Auth uses a separate internal identifier for username login.';
comment on column public.profiles.last_name is
  'Optional family name; first-name-only profiles are supported.';

