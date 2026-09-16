-- Standalone, transactional release for the new Compass metric-entry surface.
-- Does not apply or mark the legacy application migration chain as deployed.
begin;
create schema if not exists compass_private;
revoke all on schema compass_private from public, anon, authenticated;
create table if not exists compass_private.releases (
  version text primary key, applied_at timestamptz not null default now()
);
create table if not exists compass_private.members (
  user_id uuid primary key references auth.users(id),
  position_title text not null check(length(trim(position_title)) > 0),
  roles text[] not null check(roles <@ array['admin','executive','elt','director','staff','external']::text[]),
  departments text[] not null default '{}',
  active boolean not null default true,
  read_metrics boolean,
  write_metrics boolean
);
create table if not exists compass_private.bootstrap_admin (
  email text primary key,
  claimed_by uuid unique references auth.users(id)
);
create table if not exists compass_private.departments (name text primary key);
insert into compass_private.departments(name) values ('Real Estate Development'),('Property Management'),
 ('Human Resources'),('Resident Services'),('Community Relations'),('Finance') on conflict do nothing;
create table if not exists compass_private.metric_definitions (
  id text primary key, name text not null,
  department text references compass_private.departments(name),
  tracking_area text, unit text, active boolean not null default true
);
create table if not exists compass_private.contribution_categories (
  id text primary key, label text not null
);
create table if not exists compass_private.metric_entries (
  id uuid primary key,
  metric_id text not null references compass_private.metric_definitions(id),
  department text not null references compass_private.departments(name),
  period date not null check(extract(day from period)=1),
  value numeric not null check(value::text not in ('NaN','Infinity','-Infinity')),
  category_id text references compass_private.contribution_categories(id),
  description text not null check(length(trim(description)) between 1 and 4000),
  created_by uuid not null references auth.users(id),
  updated_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  revision integer not null default 1 check(revision > 0),
  check ((metric_id='community-relations-1' and category_id is not null and department='Community Relations' and value>=0)
    or (metric_id<>'community-relations-1' and category_id is null))
);
create unique index if not exists one_metric_period on compass_private.metric_entries(metric_id,department,period)
  where category_id is null;
create table if not exists compass_private.metric_entry_revisions (
  entry_id uuid not null references compass_private.metric_entries(id),
  revision integer not null,
  snapshot jsonb not null,
  author_id uuid not null references auth.users(id),
  recorded_at timestamptz not null default now(),
  primary key(entry_id,revision)
);
create table if not exists compass_private.member_audit (
  id bigint generated always as identity primary key, actor_id uuid not null references auth.users(id),
  target_id uuid not null references auth.users(id), previous_record jsonb, next_record jsonb,
  recorded_at timestamptz not null default now()
);
-- No direct browser table access. All client operations use the narrowly scoped RPCs below.
alter table compass_private.members enable row level security;
alter table compass_private.bootstrap_admin enable row level security;
alter table compass_private.departments enable row level security;
alter table compass_private.metric_definitions enable row level security;
alter table compass_private.contribution_categories enable row level security;
alter table compass_private.metric_entries enable row level security;
alter table compass_private.metric_entry_revisions enable row level security;
alter table compass_private.member_audit enable row level security;
alter table compass_private.releases enable row level security;
revoke all on all tables in schema compass_private from public, anon, authenticated;
revoke all on all sequences in schema compass_private from public, anon, authenticated;

create or replace function compass_private.is_admin() returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from compass_private.members where user_id=auth.uid() and active and 'admin'=any(roles));
$$;
create or replace function compass_private.can_read_metrics() returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from compass_private.members where user_id=auth.uid() and active
  and (coalesce(read_metrics,roles && array['admin','executive','elt','director'])));
$$;
create or replace function compass_private.can_write_metric(target_department text, cross_department boolean) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from compass_private.members where user_id=auth.uid() and active
   and coalesce(write_metrics, roles && array['admin','director'] or ('elt'=any(roles) and cross_department))
   and ('admin'=any(roles) or target_department=any(departments)));
$$;
create or replace function public.compass_metric_context() returns jsonb
language plpgsql security definer set search_path='' as $$
declare member compass_private.members; result jsonb;
begin
 if auth.uid() is null then raise exception 'Sign in required' using errcode='42501'; end if;
 -- Only an explicitly allowlisted, confirmed email may claim initial administration.
 if not exists(select 1 from compass_private.members where user_id=auth.uid()) then
   update compass_private.bootstrap_admin b set claimed_by=auth.uid()
    from auth.users u where u.id=auth.uid() and u.email_confirmed_at is not null
    and lower(u.email)=lower(b.email) and b.claimed_by is null;
   if found then
     insert into compass_private.members(user_id,position_title,roles,departments)
     values(auth.uid(),'Manager, Enterprise Initiatives',array['admin'],array(select name from compass_private.departments));
   end if;
 end if;
 select * into member from compass_private.members where user_id=auth.uid() and active;
 if not found then raise exception 'Your account needs an Admin assignment' using errcode='42501'; end if;
 if not compass_private.can_read_metrics() then raise exception 'Metric access is disabled for this account' using errcode='42501'; end if;
 result := jsonb_build_object('positionTitle',member.position_title,'roles',member.roles,
   'departments',(select jsonb_agg(name order by name) from compass_private.departments),
   'writableDepartments',(select coalesce(jsonb_agg(name order by name),'[]'::jsonb) from compass_private.departments d
     where compass_private.can_write_metric(d.name,false) or compass_private.can_write_metric(d.name,true)),
   'metricDefinitions',(select coalesce(jsonb_agg(jsonb_build_object('id',m.id,'name',m.name,'department',m.department,
     'trackingArea',m.tracking_area,'unit',m.unit)),'[]'::jsonb) from compass_private.metric_definitions m where active),
   'contributionCategories',(select jsonb_agg(jsonb_build_object('id',id,'label',label)) from compass_private.contribution_categories));
 return result;
end;
$$;
create or replace function public.compass_metric_entries(target_department text) returns jsonb
language plpgsql security definer set search_path='' as $$
begin
 if not compass_private.can_read_metrics() then raise exception 'Metric read access required' using errcode='42501'; end if;
 return (select coalesce(jsonb_agg(jsonb_build_object('id',e.id,'kind','metric','metricId',e.metric_id,
   'department',e.department,'period',to_char(e.period,'YYYY-MM'),'value',e.value,'categoryId',e.category_id,
   'description',e.description,'revision',e.revision,'savedAt',e.updated_at,
   'label',m.name || coalesce(' · ' || c.label,'')) order by e.updated_at desc),'[]'::jsonb)
   from compass_private.metric_entries e join compass_private.metric_definitions m on m.id=e.metric_id
   left join compass_private.contribution_categories c on c.id=e.category_id
   where e.department=target_department);
end;
$$;
create or replace function public.compass_save_metric_entry(payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare definition compass_private.metric_definitions; existing compass_private.metric_entries;
 saved compass_private.metric_entries; entry_id uuid; entry_period date;
begin
 select * into definition from compass_private.metric_definitions where id=payload->>'metricId' and active;
 if not found then raise exception 'Unknown or inactive measure'; end if;
 if not compass_private.can_write_metric(payload->>'department',definition.department is null) then
   raise exception 'Metric write access required for this department' using errcode='42501'; end if;
 if definition.department is not null and definition.department<>payload->>'department' then
   raise exception 'Measure belongs to a different department' using errcode='42501'; end if;
 if coalesce(payload->>'period','') !~ '^\d{4}-(0[1-9]|1[0-2])$' then raise exception 'Reporting month must be YYYY-MM'; end if;
 entry_period := (payload->>'period' || '-01')::date;
 entry_id := (payload->>'id')::uuid;
 if entry_id is null then raise exception 'A request ID is required'; end if;
 -- Same request ID is serialized so retrying a contribution cannot double count it.
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(entry_id::text,0));
 select * into existing from compass_private.metric_entries where id=entry_id for update;
 if found then
   if existing.department<>payload->>'department' or existing.metric_id<>definition.id then
     raise exception 'Entry identity cannot change' using errcode='42501'; end if;
   if not (payload ? 'expectedRevision') then
     if existing.created_by=auth.uid() and existing.period=entry_period and existing.value=(payload->>'value')::numeric
       and existing.category_id is not distinct from nullif(payload->>'categoryId','')
       and existing.description=trim(payload->>'description') then return jsonb_build_object('id',existing.id,'revision',existing.revision); end if;
     raise exception 'Entry already exists; use a revision to correct it';
   end if;
   if existing.revision<>(payload->>'expectedRevision')::integer then raise exception 'Entry changed; reload before saving'; end if;
   update compass_private.metric_entries set period=entry_period,value=(payload->>'value')::numeric,
     category_id=nullif(payload->>'categoryId',''),description=trim(payload->>'description'),
     updated_by=auth.uid(),updated_at=clock_timestamp(),revision=revision+1 where id=entry_id returning * into saved;
 else
   if payload ? 'expectedRevision' then raise exception 'Entry does not exist'; end if;
   insert into compass_private.metric_entries(id,metric_id,department,period,value,category_id,description,created_by,updated_by)
   values(entry_id,definition.id,payload->>'department',entry_period,(payload->>'value')::numeric,
     nullif(payload->>'categoryId',''),trim(payload->>'description'),auth.uid(),auth.uid()) returning * into saved;
 end if;
 insert into compass_private.metric_entry_revisions(entry_id,revision,snapshot,author_id)
 values(saved.id,saved.revision,to_jsonb(saved),auth.uid());
 return jsonb_build_object('id',saved.id,'revision',saved.revision);
end;
$$;
create or replace function public.compass_set_metric_member(payload jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare prior compass_private.members; next_member compass_private.members; target uuid := (payload->>'userId')::uuid;
begin
 if not compass_private.is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
 perform pg_catalog.pg_advisory_xact_lock(20260916);
 select * into prior from compass_private.members where user_id=target;
 if exists(select 1 from jsonb_array_elements_text(payload->'departments') v where not exists
    (select 1 from compass_private.departments d where d.name=v.value)) then raise exception 'Unknown department'; end if;
 insert into compass_private.members(user_id,position_title,roles,departments,active,read_metrics,write_metrics)
 values(target,payload->>'positionTitle',array(select jsonb_array_elements_text(payload->'roles')),
   array(select jsonb_array_elements_text(payload->'departments')),coalesce((payload->>'active')::boolean,true),
   (payload->>'readMetrics')::boolean,(payload->>'writeMetrics')::boolean)
 on conflict(user_id) do update set position_title=excluded.position_title,roles=excluded.roles,departments=excluded.departments,
   active=excluded.active,read_metrics=excluded.read_metrics,write_metrics=excluded.write_metrics returning * into next_member;
 if not exists(select 1 from compass_private.members where active and 'admin'=any(roles)) then raise exception 'At least one active Admin is required'; end if;
 insert into compass_private.member_audit(actor_id,target_id,previous_record,next_record)
 values(auth.uid(),target,to_jsonb(prior),to_jsonb(next_member));
end;
$$;
revoke all on all functions in schema compass_private from public,anon,authenticated;
revoke all on function public.compass_metric_context() from public,anon;
revoke all on function public.compass_metric_entries(text) from public,anon;
revoke all on function public.compass_save_metric_entry(jsonb) from public,anon;
revoke all on function public.compass_set_metric_member(jsonb) from public,anon;
grant execute on function public.compass_metric_context(),public.compass_metric_entries(text),
 public.compass_save_metric_entry(jsonb),public.compass_set_metric_member(jsonb) to authenticated;
insert into compass_private.releases(version) values('20260916_metric_entry') on conflict do nothing;
notify pgrst,'reload schema';
commit;
