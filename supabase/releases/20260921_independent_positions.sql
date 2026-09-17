begin;
drop trigger if exists sync_weekly_position on compass_private.members;
alter table compass_private.positions add column if not exists roles text[] not null default '{staff}';
alter table compass_private.positions add column if not exists features jsonb not null default '{}';
alter table compass_private.positions add column if not exists read_scorecards boolean;
alter table compass_private.positions add column if not exists revision integer not null default 1;
alter table compass_private.members add column if not exists primary_position_id text references compass_private.positions(id);
alter table compass_private.metric_definitions add column if not exists governance_revision integer not null default 1;
create table if not exists compass_private.position_metrics (
 position_id text not null references compass_private.positions(id),
 metric_id text not null references compass_private.metric_definitions(id),
 department text not null references compass_private.departments(name),
 can_write boolean not null default false,
 primary key(position_id,metric_id,department)
);
alter table compass_private.position_metrics enable row level security;
revoke all on compass_private.position_metrics from public,anon,authenticated;

-- Preserve existing positions, history and grants on the first application only.
do $$ begin
 if not exists(select 1 from compass_private.releases where version='20260921_independent_positions') then
  update compass_private.positions p set roles=coalesce((select array_agg(distinct r) from compass_private.position_assignments a
   join compass_private.members m on m.user_id=a.user_id cross join unnest(m.roles) r where a.position_id=p.id and r<>'admin'),array['staff']) where p.id is not null;
  update compass_private.members m set primary_position_id=(select p.id from compass_private.positions p
   join compass_private.position_assignments a on a.position_id=p.id and a.user_id=m.user_id order by (p.title=m.position_title) desc,p.title limit 1) where m.user_id is not null;
  insert into compass_private.position_metrics(position_id,metric_id,department,can_write)
  select distinct a.position_id,d.id,dept.name,true from compass_private.position_assignments a
   join compass_private.members m on m.user_id=a.user_id and m.active and not 'admin'=any(m.roles)
   cross join compass_private.metric_definitions d cross join compass_private.departments dept
  where dept.name=any(m.departments) and (d.department is null or d.department=dept.name)
   and coalesce(m.write_metrics,m.roles && array['director'] or ('elt'=any(m.roles) and d.department is null))
  on conflict do nothing;
 end if;
end $$;

create or replace function compass_private.current_position() returns text
language plpgsql stable security definer set search_path='' as $$
declare requested text:=nullif(current_setting('request.headers',true),'')::jsonb->>'x-compass-position'; selected text;
begin
 if not exists(select 1 from compass_private.members where user_id=auth.uid() and active) then return null; end if;
 if nullif(requested,'') is not null then
  if not exists(select 1 from compass_private.position_assignments a join compass_private.positions p on p.id=a.position_id and p.active where a.user_id=auth.uid() and a.position_id=requested) then
   raise exception 'This position is no longer assigned to you. Refresh your workspace.' using errcode='42501'; end if;
  return requested;
 end if;
 select p.id into selected from compass_private.position_assignments a join compass_private.positions p on p.id=a.position_id and p.active
 join compass_private.members m on m.user_id=a.user_id where a.user_id=auth.uid()
 order by (p.id=m.primary_position_id) desc,p.title limit 1;
 return selected;
end; $$;
create or replace function compass_private.current_position_roles() returns text[]
language sql stable security definer set search_path='' as $$
 select coalesce((select roles from compass_private.positions where id=compass_private.current_position()),'{}');
$$;
create or replace function compass_private.can_read_metrics() returns boolean
language sql stable security definer set search_path='' as $$
 select compass_private.is_admin() or exists(select 1 from compass_private.members m join compass_private.positions p on p.id=compass_private.current_position()
 where m.user_id=auth.uid() and m.active and m.read_metrics is distinct from false
 and coalesce(p.read_scorecards,p.roles && array['executive','elt','director']));
$$;
create or replace function compass_private.can_access_metric(measure text, reporting_department text, writing boolean default false) returns boolean
language sql stable security definer set search_path='' as $$
 select compass_private.is_admin() or
 (not writing and compass_private.can_read_metrics()) or exists(
 select 1 from compass_private.members m join compass_private.position_metrics g on g.position_id=compass_private.current_position()
 where m.user_id=auth.uid() and m.active and g.metric_id=measure and g.department=reporting_department
 and case when writing then g.can_write and m.write_metrics is distinct from false else m.read_metrics is distinct from false end);
$$;
create or replace function compass_private.weekly_access(target_position text, writing boolean default false) returns boolean
language sql stable security definer set search_path='' as $$
 select compass_private.is_admin() or exists(select 1 from compass_private.members m where m.user_id=auth.uid() and m.active
 and compass_private.current_position_roles() && array['executive','elt','director']
 and case when writing then m.write_weekly is distinct from false and target_position=compass_private.current_position()
 else m.read_weekly is distinct from false end);
$$;
create or replace function compass_private.weekly_draft_access(target_position text) returns boolean
language sql stable security definer set search_path='' as $$
 select compass_private.weekly_access(target_position,false) and (compass_private.is_admin()
 or compass_private.current_position_roles() && array['executive','elt'] or target_position=compass_private.current_position());
$$;
create or replace function compass_private.weekly_score_access(target_position text) returns boolean
language sql stable security definer set search_path='' as $$
 select compass_private.weekly_access(target_position,false) and (compass_private.is_admin()
 or compass_private.current_position_roles() && array['executive'] or exists(
 select 1 from compass_private.position_assignments where user_id=auth.uid() and position_id=target_position));
$$;

create or replace function public.compass_admin_positions() returns jsonb
language plpgsql security definer set search_path='' as $$
begin
 if not compass_private.is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
 return jsonb_build_object('positions',(select coalesce(jsonb_agg(to_jsonb(p)||jsonb_build_object('occupants',
  (select coalesce(jsonb_agg(a.user_id),'[]') from compass_private.position_assignments a where a.position_id=p.id)) order by p.title),'[]') from compass_private.positions p),
 'metrics',(select coalesce(jsonb_agg(to_jsonb(d) order by d.name),'[]') from compass_private.metric_definitions d where active),
 'grants',(select coalesce(jsonb_agg(to_jsonb(g)),'[]') from compass_private.position_metrics g));
end; $$;
create or replace function public.compass_admin_save_position(payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare prior compass_private.positions; saved compass_private.positions;
 target text:=coalesce(nullif(payload->>'id',''),gen_random_uuid()::text); chosen_roles text[];
begin
 if not compass_private.is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended(target,21));
 select * into prior from compass_private.positions where id=target for update;
 if prior.revision is distinct from (payload->>'expectedRevision')::integer then raise exception 'Position changed; reload before saving'; end if;
 if length(trim(coalesce(payload->>'title',''))) not between 1 and 150 then raise exception 'Enter a position title'; end if;
 if jsonb_typeof(payload->'roles') is distinct from 'array' then raise exception 'Select position roles'; end if;
 chosen_roles:=array(select jsonb_array_elements_text(payload->'roles'));
 if cardinality(chosen_roles)=0 or not chosen_roles <@ array['executive','elt','director','staff','external'] then raise exception 'Select valid position roles'; end if;
 if jsonb_typeof(coalesce(payload->'features','{}'))<>'object' or exists(select 1 from jsonb_each(coalesce(payload->'features','{}')) f where jsonb_typeof(f.value)<>'boolean') then raise exception 'Feature settings must be true or false'; end if;
 insert into compass_private.positions(id,title,department,roles,features,read_scorecards,required,active)
 values(target,trim(payload->>'title'),nullif(payload->>'department',''),chosen_roles,coalesce(payload->'features','{}'),
  (payload->>'readScorecards')::boolean,chosen_roles && array['executive','elt','director'],coalesce((payload->>'active')::boolean,true))
 on conflict(id) do update set title=excluded.title,department=excluded.department,roles=excluded.roles,features=excluded.features,
 read_scorecards=excluded.read_scorecards,required=excluded.required,active=excluded.active,revision=compass_private.positions.revision+1 returning * into saved;
 insert into compass_private.admin_events(actor_id,action,subject,before_record,after_record)
 values(auth.uid(),'position_saved',target,to_jsonb(prior),to_jsonb(saved));
 return to_jsonb(saved);
end; $$;
create or replace function public.compass_admin_set_metric_positions(payload jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare definition compass_private.metric_definitions; assignment jsonb; prior jsonb;
begin
 if not compass_private.is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
 select * into definition from compass_private.metric_definitions where id=payload->>'metricId' and active for update;
 if not found then raise exception 'Unknown metric'; end if;
 if definition.governance_revision is distinct from (payload->>'expectedRevision')::integer then raise exception 'Metric assignments changed; reload before saving'; end if;
 if not exists(select 1 from compass_private.departments where name=payload->>'department') or (definition.department is not null and definition.department<>payload->>'department') then raise exception 'Choose the metric reporting department'; end if;
 if jsonb_typeof(payload->'positions') is distinct from 'array' then raise exception 'Choose positions'; end if;
 select coalesce(jsonb_agg(to_jsonb(g)),'[]') into prior from compass_private.position_metrics g where metric_id=definition.id and department=payload->>'department';
 delete from compass_private.position_metrics where metric_id=definition.id and department=payload->>'department';
 for assignment in select value from jsonb_array_elements(payload->'positions') loop
  if not exists(select 1 from compass_private.positions where id=assignment->>'positionId' and active) then raise exception 'Choose active positions'; end if;
  insert into compass_private.position_metrics(position_id,metric_id,department,can_write)
  values(assignment->>'positionId',definition.id,payload->>'department',coalesce((assignment->>'canWrite')::boolean,false));
 end loop;
 update compass_private.metric_definitions set governance_revision=governance_revision+1 where id=definition.id;
 insert into compass_private.admin_events(actor_id,action,subject,before_record,after_record)
 values(auth.uid(),'metric_positions_changed',definition.id,prior,payload);
end; $$;

create or replace function public.compass_set_metric_member(payload jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare prior compass_private.members; saved compass_private.members; target uuid:=(payload->>'userId')::uuid;
 assigned text[]; main_position text; label text;
begin
 if not compass_private.is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(20260916);
 if not exists(select 1 from auth.users where id=target) then raise exception 'Create the account before connecting positions'; end if;
 select * into prior from compass_private.members where user_id=target for update;
 if jsonb_typeof(payload->'positions') is distinct from 'array' then raise exception 'Choose positions'; end if;
 assigned:=array(select jsonb_array_elements_text(payload->'positions'));
 if exists(select 1 from unnest(assigned) a where not exists(select 1 from compass_private.positions p where p.id=a and p.active)) then raise exception 'Choose active positions'; end if;
 main_position:=coalesce(nullif(payload->>'primaryPositionId',''),assigned[1]);
 if main_position is not null and not main_position=any(assigned) then raise exception 'Primary position must be assigned'; end if;
 select title into label from compass_private.positions where id=main_position;
 insert into compass_private.members(user_id,position_title,roles,departments,active,primary_position_id,read_metrics,write_metrics,read_weekly,write_weekly)
 values(target,coalesce(label,'Unassigned'),array(select jsonb_array_elements_text(payload->'roles')),
 array(select distinct p.department from compass_private.positions p where p.id=any(assigned) and p.department is not null),
 coalesce((payload->>'active')::boolean,true),main_position,(payload->>'readMetrics')::boolean,(payload->>'writeMetrics')::boolean,(payload->>'readWeekly')::boolean,(payload->>'writeWeekly')::boolean)
 on conflict(user_id) do update set position_title=excluded.position_title,roles=excluded.roles,departments=excluded.departments,active=excluded.active,
 primary_position_id=excluded.primary_position_id,read_metrics=excluded.read_metrics,write_metrics=excluded.write_metrics,read_weekly=excluded.read_weekly,write_weekly=excluded.write_weekly returning * into saved;
 if not exists(select 1 from compass_private.members where active and 'admin'=any(roles)) then raise exception 'At least one active Admin is required'; end if;
 delete from compass_private.position_assignments where user_id=target;
 insert into compass_private.position_assignments(user_id,position_id) select target,unnest(assigned) on conflict do nothing;
 insert into compass_private.member_audit(actor_id,target_id,previous_record,next_record)
 values(auth.uid(),target,to_jsonb(prior),to_jsonb(saved)||jsonb_build_object('positions',assigned));
end; $$;

create or replace function public.compass_access_context() returns jsonb
language plpgsql security definer set search_path='' as $$
declare m compass_private.members; p compass_private.positions;
begin
 select * into m from compass_private.members where user_id=auth.uid() and active;
 if not found then raise exception 'Your account needs an active Admin assignment' using errcode='42501'; end if;
 select * into p from compass_private.positions where id=compass_private.current_position();
 return jsonb_build_object('positionTitle',coalesce(p.title,m.position_title),'positionId',p.id,'roles',coalesce(p.roles,'{}'),
 'positions',(select coalesce(jsonb_agg(jsonb_build_object('id',q.id,'title',q.title) order by q.title),'[]') from compass_private.positions q
  join compass_private.position_assignments a on a.position_id=q.id and a.user_id=auth.uid() where q.active),
 'admin',compass_private.is_admin(),'scorecards',compass_private.can_read_metrics(),
 'metrics',compass_private.can_read_metrics() or exists(select 1 from compass_private.position_metrics g where g.position_id=p.id and m.read_metrics is distinct from false),
 'weekly',compass_private.weekly_access(null,false),
 'features',coalesce(p.features,'{}')||(select coalesce(jsonb_object_agg(feature_key,enabled),'{}') from compass_private.member_features where user_id=auth.uid()));
end; $$;

create or replace function public.compass_metric_context() returns jsonb
language plpgsql security definer set search_path='' as $$
declare ctx jsonb:=public.compass_access_context();
begin
 if not (ctx->>'metrics')::boolean then raise exception 'Metric access is disabled for this position' using errcode='42501'; end if;
 return ctx||jsonb_build_object(
 'departments',(select coalesce(jsonb_agg(name order by name),'[]') from compass_private.departments d where exists(select 1 from compass_private.metric_definitions m where m.active and (m.department is null or m.department=d.name) and compass_private.can_access_metric(m.id,d.name,false))),
 'writableDepartments',(select coalesce(jsonb_agg(name order by name),'[]') from compass_private.departments d where exists(select 1 from compass_private.metric_definitions m where m.active and (m.department is null or m.department=d.name) and compass_private.can_access_metric(m.id,d.name,true))),
 'metricPermissions',(select coalesce(jsonb_agg(jsonb_build_object('metricId',m.id,'department',d.name,'canWrite',compass_private.can_access_metric(m.id,d.name,true))),'[]') from compass_private.metric_definitions m cross join compass_private.departments d where m.active and (m.department is null or m.department=d.name) and compass_private.can_access_metric(m.id,d.name,false)),
 'metricDefinitions',(select coalesce(jsonb_agg(jsonb_build_object('id',m.id,'name',m.name,'department',m.department,'trackingArea',m.tracking_area,'unit',m.unit)),'[]') from compass_private.metric_definitions m where active and exists(select 1 from compass_private.departments d where (m.department is null or m.department=d.name) and compass_private.can_access_metric(m.id,d.name,false))),
 'contributionCategories',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'label',label)),'[]') from compass_private.contribution_categories));
end; $$;
create or replace function public.compass_metric_entries(target_department text) returns jsonb
language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from compass_private.metric_definitions m where m.active and compass_private.can_access_metric(m.id,target_department,false)) then raise exception 'Metric read access required' using errcode='42501'; end if;
 return (select coalesce(jsonb_agg(jsonb_build_object('id',e.id,'kind','metric','metricId',e.metric_id,'department',e.department,'period',to_char(e.period,'YYYY-MM'),
 'value',e.value,'categoryId',e.category_id,'description',e.description,'revision',e.revision,'savedAt',e.updated_at,'label',m.name||coalesce(' · '||c.label,'')) order by e.updated_at desc),'[]')
 from compass_private.metric_entries e join compass_private.metric_definitions m on m.id=e.metric_id left join compass_private.contribution_categories c on c.id=e.category_id
 where e.department=target_department and compass_private.can_access_metric(e.metric_id,e.department,false));
end; $$;

revoke all on function compass_private.current_position(),compass_private.current_position_roles(),compass_private.can_access_metric(text,text,boolean) from public,anon,authenticated;
revoke all on function public.compass_admin_positions(),public.compass_admin_save_position(jsonb),public.compass_admin_set_metric_positions(jsonb) from public,anon;
grant execute on function public.compass_admin_positions(),public.compass_admin_save_position(jsonb),public.compass_admin_set_metric_positions(jsonb) to authenticated;
-- Updated metric-save and weekly-maintenance definitions are appended below.

create or replace function public.compass_save_metric_entry(payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare definition compass_private.metric_definitions; existing compass_private.metric_entries;
 saved compass_private.metric_entries; entry_id uuid; entry_period date;
begin
 select * into definition from compass_private.metric_definitions where id=payload->>'metricId' and active;
 if not found then raise exception 'Unknown or inactive measure'; end if;
 if not compass_private.can_access_metric(definition.id,payload->>'department',true) then
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
   if existing.revision is distinct from (payload->>'expectedRevision')::integer then raise exception 'Entry changed; reload before saving'; end if;
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


create or replace function compass_private.weekly_maintain(at_time timestamptz default clock_timestamp()) returns void
language plpgsql security definer set search_path='' as $$
declare current_week date := date_trunc('week',at_time at time zone 'America/New_York')::date; rec record;
begin
 -- No retrospective roster inference: materialize this cycle only, at enrollment/job time.
 if current_week >= (select starts_on from compass_private.weekly_settings) then
 insert into compass_private.weekly_records(position_id,week,expected)
 select p.id,current_week,true from compass_private.positions p where p.active and p.required
 and exists(select 1 from compass_private.position_assignments a join compass_private.members m on m.user_id=a.user_id
  where a.position_id=p.id and m.active and exists(select 1 from auth.users u where u.id=m.user_id and u.email_confirmed_at is not null) and p.roles && array['executive','elt','director'])
 on conflict(position_id,week) do update set expected=true where not compass_private.weekly_records.expected;
 end if;
 for rec in select r.position_id,r.week from compass_private.weekly_records r
  cross join lateral compass_private.weekly_boundaries(r.week) b
  where r.expected and not r.exempt and r.first_submitted_at is null and at_time>b.grace_at
  and not exists(select 1 from compass_private.weekly_points e where e.position_id=r.position_id and e.week=r.week)
  order by r.position_id,r.week for update of r loop
  insert into compass_private.weekly_points(position_id,week,points,outcome,recorded_at)
  select rec.position_id,rec.week,-10,'missed_submission',at_time
  where not exists(select 1 from compass_private.weekly_records r where r.position_id=rec.position_id and r.week=rec.week and r.first_submitted_at is not null)
  on conflict do nothing;
 end loop;
end; $$;

create or replace function public.compass_admin_members() returns jsonb
language plpgsql security definer set search_path='' as $$
begin
 if not compass_private.is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
 return jsonb_build_object('members',(select coalesce(jsonb_agg(jsonb_build_object(
 'userId',u.id,'email',u.email,'confirmed',u.email_confirmed_at is not null,'positionTitle',coalesce((select title from compass_private.positions where id=m.primary_position_id),m.position_title,''),'primaryPositionId',m.primary_position_id,'effectiveRoles',coalesce((select roles from compass_private.positions where id=m.primary_position_id),'{}')||coalesce(m.roles,'{}'),'roles',coalesce(m.roles,'{}'),
 'departments',coalesce(m.departments,'{}'),'active',coalesce(m.active,false),
 'readMetrics',m.read_metrics,'writeMetrics',m.write_metrics,'readWeekly',m.read_weekly,'writeWeekly',m.write_weekly,
 'positions',(select coalesce(jsonb_agg(a.position_id),'[]') from compass_private.position_assignments a where a.user_id=u.id)
 ) order by u.email),'[]') from auth.users u left join compass_private.members m on m.user_id=u.id),
 'departments',(select jsonb_agg(name order by name) from compass_private.departments),
 'positions',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'title',title) order by title),'[]') from compass_private.positions where active));
end; $$;
create or replace function compass_private.save_weekly(payload jsonb,finalizing boolean,at_time timestamptz)
returns jsonb language plpgsql security definer set search_path='' as $$
declare position_key text := payload->>'positionId'; week_date date := (payload->>'week')::date;
 document jsonb := payload->'draft'; rec compass_private.weekly_records; boundary record;
 event_points integer; event_outcome text; correction text := trim(coalesce(payload->>'correctionReason',''));
begin
 if not compass_private.weekly_access(position_key,true) then raise exception 'You cannot edit this position' using errcode='42501'; end if;
 if not exists(select 1 from compass_private.positions where id=position_key and active) then raise exception 'Inactive position'; end if;
 if week_date < (select starts_on from compass_private.weekly_settings) then raise exception 'This cycle predates weekly tracking; use the future historical import workflow'; end if;
 if not(payload ? 'expectedRevision') then raise exception 'Reload the weekly record before saving'; end if;
 perform compass_private.validate_weekly_document(document,finalizing);
 select * into boundary from compass_private.weekly_boundaries(week_date);
 if finalizing and at_time<boundary.opens_at then raise exception 'This week has not started'; end if;
 insert into compass_private.weekly_records(position_id,week) values(position_key,week_date) on conflict do nothing;
 select * into rec from compass_private.weekly_records where position_id=position_key and week=week_date for update;
 if (payload->>'expectedRevision') is null then raise exception 'A numeric revision is required'; end if;
 if rec.revision is distinct from (payload->>'expectedRevision')::integer then
  if rec.updated_by=auth.uid() and rec.draft=document and (not finalizing or rec.submitted=document) then return to_jsonb(rec); end if;
  raise exception 'This record changed; reload it before saving';
 end if;
 if rec.exempt then raise exception 'This position is exempt for this week'; end if;
 if at_time>boundary.grace_at then
  if not exists(select 1 from compass_private.members where user_id=auth.uid() and active and (compass_private.is_admin() or compass_private.current_position_roles() && array['director']))
    or length(correction)<3 then raise exception 'After grace, a Director or Admin correction reason is required'; end if;
 end if;
 update compass_private.weekly_records set draft=document,revision=revision+1,updated_by=auth.uid(),updated_at=at_time,
  submitted=case when finalizing then document else submitted end,
  first_submitted_at=case when finalizing then coalesce(first_submitted_at,at_time) else first_submitted_at end,
  last_submitted_at=case when finalizing then at_time else last_submitted_at end,
  submitted_revision=case when finalizing then revision+1 else submitted_revision end
 where position_id=position_key and week=week_date returning * into rec;
 if finalizing then
  insert into compass_private.weekly_revisions(position_id,week,revision,snapshot,actor_id,recorded_at,correction_reason)
   values(position_key,week_date,rec.revision,document,auth.uid(),at_time,nullif(correction,''));
  if rec.first_submitted_at<=boundary.deadline_at then
    event_points := case when document->>'capacity'='enterprise' then 5 else 0 end;
    event_outcome := case when event_points=5 then 'on_time_priority' else 'on_time_opt_out' end;
  elsif rec.first_submitted_at<=boundary.grace_at then event_points:=-3;event_outcome:='late_submission';
  else event_points:=-10;event_outcome:='missed_submission'; end if;
  insert into compass_private.weekly_points(position_id,week,points,outcome,recorded_at)
  values(position_key,week_date,event_points,event_outcome,at_time)
  on conflict(position_id,week) do update set points=excluded.points,outcome=excluded.outcome,recorded_at=excluded.recorded_at
  where at_time<=boundary.deadline_at;
 end if;
 return to_jsonb(rec);
end; $$;
insert into compass_private.releases(version) values('20260921_independent_positions') on conflict do nothing;
notify pgrst,'reload schema';
commit;
