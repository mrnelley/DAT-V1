begin;
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

insert into compass_private.releases(version) values('20260917_metric_revision_guard') on conflict do nothing;
commit;

begin;
create or replace function public.compass_access_context() returns jsonb
language plpgsql security definer set search_path='' as $$
declare m compass_private.members;
begin
 select * into m from compass_private.members where user_id=auth.uid() and active;
 if not found then raise exception 'Your account needs an active Admin assignment' using errcode='42501'; end if;
 return jsonb_build_object('positionTitle',m.position_title,'roles',m.roles,'admin',compass_private.is_admin(),
 'metrics',compass_private.can_read_metrics(),'weekly',compass_private.weekly_access(null,false));
end; $$;

create or replace function public.compass_admin_members() returns jsonb
language plpgsql security definer set search_path='' as $$
begin
 if not compass_private.is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
 return jsonb_build_object('members',(select coalesce(jsonb_agg(jsonb_build_object(
 'userId',u.id,'email',u.email,'positionTitle',coalesce(m.position_title,''),'roles',coalesce(m.roles,'{}'),
 'departments',coalesce(m.departments,'{}'),'active',coalesce(m.active,false),
 'readMetrics',m.read_metrics,'writeMetrics',m.write_metrics,'readWeekly',m.read_weekly,'writeWeekly',m.write_weekly,
 'positions',(select coalesce(jsonb_agg(a.position_id),'[]') from compass_private.position_assignments a where a.user_id=u.id)
 ) order by u.email),'[]') from auth.users u left join compass_private.members m on m.user_id=u.id where u.email_confirmed_at is not null),
 'departments',(select jsonb_agg(name order by name) from compass_private.departments),
 'positions',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'title',title) order by title),'[]') from compass_private.positions where active));
end; $$;

create or replace function public.compass_set_metric_member(payload jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare prior compass_private.members; next_member compass_private.members; target uuid := (payload->>'userId')::uuid;
begin
 if not compass_private.is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
 perform pg_catalog.pg_advisory_xact_lock(20260916);
 if not exists(select 1 from auth.users where id=target and email_confirmed_at is not null) then raise exception 'A confirmed sign-in is required first'; end if;
 select * into prior from compass_private.members where user_id=target for update;
 if jsonb_typeof(payload->'roles') is distinct from 'array' or jsonb_array_length(payload->'roles')=0 then raise exception 'Select at least one role'; end if;
 if jsonb_typeof(payload->'departments') is distinct from 'array' then raise exception 'Department scope is required'; end if;
 if exists(select 1 from jsonb_array_elements_text(payload->'departments') v where not exists
 (select 1 from compass_private.departments d where d.name=v.value)) then raise exception 'Unknown department'; end if;
 if length(trim(payload->>'positionTitle'))>150 then raise exception 'Position title is too long'; end if;
 insert into compass_private.members(user_id,position_title,roles,departments,active,read_metrics,write_metrics,read_weekly,write_weekly)
 values(target,trim(payload->>'positionTitle'),array(select jsonb_array_elements_text(payload->'roles')),
 array(select jsonb_array_elements_text(payload->'departments')),coalesce((payload->>'active')::boolean,true),
 (payload->>'readMetrics')::boolean,(payload->>'writeMetrics')::boolean,(payload->>'readWeekly')::boolean,(payload->>'writeWeekly')::boolean)
 on conflict(user_id) do update set position_title=excluded.position_title,roles=excluded.roles,departments=excluded.departments,
 active=excluded.active,read_metrics=excluded.read_metrics,write_metrics=excluded.write_metrics,
 read_weekly=excluded.read_weekly,write_weekly=excluded.write_weekly returning * into next_member;
 if not exists(select 1 from compass_private.members where active and 'admin'=any(roles)) then raise exception 'At least one active Admin is required'; end if;
 if payload ? 'positions' then
   if jsonb_typeof(payload->'positions') is distinct from 'array' then raise exception 'Positions must be a list'; end if;
   if exists(select 1 from jsonb_array_elements_text(payload->'positions') v where not exists(select 1 from compass_private.positions p where p.id=v.value and active)) then raise exception 'Unknown position'; end if;
   delete from compass_private.position_assignments where user_id=target;
   insert into compass_private.position_assignments(user_id,position_id)
   select target,value from jsonb_array_elements_text(payload->'positions') on conflict do nothing;
   insert into compass_private.position_assignments(user_id,position_id)
   select target,id from compass_private.positions where title=next_member.position_title on conflict do nothing;
 end if;
 update compass_private.positions p set required=exists(select 1 from compass_private.position_assignments a join compass_private.members m on m.user_id=a.user_id
 where a.position_id=p.id and m.active and m.roles && array['executive','elt','director']);
 insert into compass_private.member_audit(actor_id,target_id,previous_record,next_record)
 values(auth.uid(),target,to_jsonb(prior),to_jsonb(next_member)||jsonb_build_object('positions',payload->'positions'));
end; $$;

create or replace function public.compass_scorecard_data(report_month date) returns jsonb
language plpgsql security definer set search_path='' as $$
declare reporting_week date := date_trunc('week',(report_month+interval '1 month - 1 day'))::date;
begin
 if not compass_private.can_read_metrics() then raise exception 'Scorecard access required' using errcode='42501'; end if;
 if report_month is null or extract(day from report_month)<>1 then raise exception 'Select a reporting month'; end if;
 if date_trunc('month',now() at time zone 'America/New_York')::date=report_month then reporting_week:=date_trunc('week',now() at time zone 'America/New_York')::date; end if;
 return jsonb_build_object('period',to_char(report_month,'YYYY-MM'),'week',reporting_week,
 'metrics',(select coalesce(jsonb_agg(jsonb_build_object('metricId',s.metric_id,'department',s.department,'value',s.value,'entries',s.entries,'updatedAt',s.updated_at)),'[]') from
   (select metric_id,department,sum(value) value,count(*) entries,max(updated_at) updated_at from compass_private.metric_entries where period=report_month group by metric_id,department) s),
 'contributions',(select coalesce(jsonb_agg(jsonb_build_object('categoryId',s.category_id,'value',s.value)),'[]') from
   (select category_id,sum(value) value from compass_private.metric_entries where period=report_month and metric_id='community-relations-1' group by category_id) s),
 'objectives',(select coalesce(jsonb_agg(jsonb_build_object('id',o.id,'title',o.title,'pillarId',o.pillar_id,'area',o.area,'period',o.period,
   'updates',case when compass_private.weekly_access(null,false) then
   (select coalesce(jsonb_agg(jsonb_build_object('position',p.title,'title',e->>'title','status',e->>'status','result',e->>'desiredResult','submittedAt',r.last_submitted_at)),'[]')
   from compass_private.weekly_records r join compass_private.positions p on p.id=r.position_id
   cross join lateral jsonb_array_elements(r.submitted->'entries') e
   where r.week=reporting_week and e->>'objectiveId'=o.id) else '[]'::jsonb end) order by o.id),'[]')
 from compass_private.enterprise_objectives o where active and o.period=to_char(report_month,'YYYY')||'-Q'||extract(quarter from report_month)::text));
end; $$;
revoke all on function public.compass_access_context(),public.compass_admin_members(),public.compass_scorecard_data(date),public.compass_set_metric_member(jsonb) from public,anon;
grant execute on function public.compass_access_context(),public.compass_admin_members(),public.compass_scorecard_data(date),public.compass_set_metric_member(jsonb) to authenticated;
insert into compass_private.releases(version) values('20260918_rollups_admin') on conflict do nothing;
notify pgrst,'reload schema';
commit;

begin;
create table if not exists compass_private.scorecard_targets (
 metric_id text not null references compass_private.metric_definitions(id), year integer not null check(year between 2026 and 2100),
 operator text not null check(operator in ('gte','lte','gt','lt')), value numeric not null check(value::text not in ('NaN','Infinity','-Infinity')),
 revision integer not null default 1, updated_by uuid not null references auth.users(id), updated_at timestamptz not null default now(), primary key(metric_id,year)
);
create table if not exists compass_private.scorecard_target_audit (
 id bigint generated always as identity primary key, actor_id uuid not null references auth.users(id), previous_record jsonb, next_record jsonb not null, recorded_at timestamptz not null default now()
);
alter table compass_private.scorecard_targets enable row level security;
alter table compass_private.scorecard_target_audit enable row level security;
revoke all on compass_private.scorecard_targets,compass_private.scorecard_target_audit from public,anon,authenticated;
create or replace function public.compass_scorecard_targets(target_year integer) returns jsonb
language plpgsql security definer set search_path='' as $$
begin
 if not compass_private.can_read_metrics() then raise exception 'Scorecard access required' using errcode='42501'; end if;
 return (select coalesce(jsonb_agg(jsonb_build_object('metricId',metric_id,'year',year,'operator',operator,'value',value,'revision',revision)),'[]') from compass_private.scorecard_targets where year=target_year);
end; $$;
create or replace function public.compass_set_scorecard_target(payload jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare prior compass_private.scorecard_targets; saved compass_private.scorecard_targets;
begin
 if not compass_private.is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('target:'||(payload->>'metricId')||':'||(payload->>'year'),0));
 select * into prior from compass_private.scorecard_targets where metric_id=payload->>'metricId' and year=(payload->>'year')::integer for update;
 if prior.revision is distinct from (payload->>'expectedRevision')::integer then raise exception 'Target changed; reload before saving'; end if;
 insert into compass_private.scorecard_targets(metric_id,year,operator,value,updated_by)
 values(payload->>'metricId',(payload->>'year')::integer,payload->>'operator',(payload->>'value')::numeric,auth.uid())
 on conflict(metric_id,year) do update set operator=excluded.operator,value=excluded.value,revision=compass_private.scorecard_targets.revision+1,updated_by=auth.uid(),updated_at=now() returning * into saved;
 insert into compass_private.scorecard_target_audit(actor_id,previous_record,next_record) values(auth.uid(),to_jsonb(prior),to_jsonb(saved));
end; $$;
revoke all on function public.compass_scorecard_targets(integer),public.compass_set_scorecard_target(jsonb) from public,anon;
grant execute on function public.compass_scorecard_targets(integer),public.compass_set_scorecard_target(jsonb) to authenticated;
insert into compass_private.releases(version) values('20260918_scorecard_targets') on conflict do nothing;
notify pgrst,'reload schema';
commit;

begin;
insert into compass_private.metric_definitions(id,name,department,tracking_area,unit) values
('strategic-metric-1','Growth in new units outside acquisitions',null,'2030 outcomes','percent'),
('strategic-metric-2','Units created, acquired or preserved',null,'2030 outcomes','units'),
('strategic-metric-3','Enterprise capital for real estate development',null,'2030 outcomes','USD'),
('strategic-metric-4','Housing models explored and vetted',null,'2030 outcomes','models'),
('strategic-metric-7','Employee engagement',null,'2030 outcomes','percent'),
('strategic-metric-8','Technologies adopted with measurable savings',null,'2030 outcomes','technologies'),
('strategic-metric-11','Philanthropic growth above national average',null,'2030 outcomes','percent'),
('strategic-metric-12','Positive brand visibility and reach',null,'2030 outcomes','percent'),
('strategic-metric-13','Coalitions and alliances with active involvement',null,'2030 outcomes','coalitions'),
('strategic-metric-14','Increase in policymaker engagement',null,'2030 outcomes','percent'),
('strategic-metric-15','Resident leaders and stakeholders participating in advocacy',null,'2030 outcomes','people'),
('strategic-metric-16','Policy wins',null,'2030 outcomes','wins'),
('strategic-metric-17','Resident satisfaction',null,'2030 outcomes','percent'),
('strategic-metric-19','Wage growth for working families (2026–2030)',null,'2030 outcomes','percent')
on conflict(id) do update set name=excluded.name,unit=excluded.unit;
insert into compass_private.releases(version) values('20260918_strategic_measures') on conflict do nothing;
notify pgrst,'reload schema';
commit;

begin;
create table if not exists compass_private.member_features (
 user_id uuid not null references compass_private.members(user_id), feature_key text not null,
 enabled boolean not null, primary key(user_id,feature_key)
);
create table if not exists compass_private.teams (
 id uuid primary key default gen_random_uuid(), name text not null unique check(length(trim(name)) between 1 and 120),
 description text not null default '' check(length(description)<=2000), active boolean not null default true,
 revision integer not null default 1
);
create table if not exists compass_private.team_members (
 team_id uuid not null references compass_private.teams(id), user_id uuid not null references compass_private.members(user_id), primary key(team_id,user_id)
);
create table if not exists compass_private.properties (
 id uuid primary key default gen_random_uuid(), name text not null unique check(length(trim(name)) between 1 and 150),
 location text not null default '' check(length(location)<=250), units integer check(units>=0),
 manager_id uuid references compass_private.members(user_id), resident_lead_id uuid references compass_private.members(user_id),
 active boolean not null default true, revision integer not null default 1
);
create table if not exists compass_private.admin_events (
 id bigint generated always as identity primary key, actor_id uuid not null references auth.users(id),
 action text not null, subject text not null, before_record jsonb, after_record jsonb, recorded_at timestamptz not null default now()
);
alter table compass_private.member_features enable row level security;
alter table compass_private.teams enable row level security;
alter table compass_private.team_members enable row level security;
alter table compass_private.properties enable row level security;
alter table compass_private.admin_events enable row level security;
revoke all on compass_private.member_features,compass_private.teams,compass_private.team_members,compass_private.properties,compass_private.admin_events from public,anon,authenticated;

create or replace function public.compass_admin_workspace() returns jsonb
language plpgsql security definer set search_path='' as $$
begin
 if not compass_private.is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
 return jsonb_build_object(
 'features',(select coalesce(jsonb_agg(jsonb_build_object('userId',user_id,'key',feature_key,'enabled',enabled)),'[]') from compass_private.member_features),
 'teams',(select coalesce(jsonb_agg(to_jsonb(t)||jsonb_build_object('members',(select coalesce(jsonb_agg(user_id),'[]') from compass_private.team_members where team_id=t.id)) order by t.name),'[]') from compass_private.teams t),
 'properties',(select coalesce(jsonb_agg(to_jsonb(p) order by p.name),'[]') from compass_private.properties p),
 'audit',(select coalesce(jsonb_agg(to_jsonb(e) order by e.recorded_at desc),'[]') from (select e.id,e.action,e.subject,e.recorded_at,m.position_title actor from compass_private.admin_events e left join compass_private.members m on m.user_id=e.actor_id order by e.recorded_at desc limit 100) e));
end; $$;

create or replace function public.compass_admin_save_team(payload jsonb) returns uuid
language plpgsql security definer set search_path='' as $$
declare prior compass_private.teams; saved compass_private.teams; target uuid:=coalesce((payload->>'id')::uuid,gen_random_uuid()); prior_members jsonb;
begin
 if not compass_private.is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(target::text,19));
 select * into prior from compass_private.teams where id=target for update;
 if prior.revision is distinct from (payload->>'expectedRevision')::integer then raise exception 'Team changed; reload before saving'; end if;
 if jsonb_typeof(payload->'members') is distinct from 'array' then raise exception 'Members must be a list'; end if;
 if exists(select 1 from jsonb_array_elements_text(payload->'members') v where not exists(select 1 from compass_private.members m where m.user_id=v.value::uuid and m.active)) then raise exception 'Select active members'; end if;
 select coalesce(jsonb_agg(user_id),'[]') into prior_members from compass_private.team_members where team_id=target;
 insert into compass_private.teams(id,name,description,active) values(target,trim(payload->>'name'),coalesce(payload->>'description',''),coalesce((payload->>'active')::boolean,true))
 on conflict(id) do update set name=excluded.name,description=excluded.description,active=excluded.active,revision=compass_private.teams.revision+1 returning * into saved;
 delete from compass_private.team_members where team_id=target;
 insert into compass_private.team_members select target,value::uuid from jsonb_array_elements_text(payload->'members') on conflict do nothing;
 insert into compass_private.admin_events(actor_id,action,subject,before_record,after_record) values(auth.uid(),'team_saved',target::text,to_jsonb(prior)||jsonb_build_object('members',prior_members),to_jsonb(saved)||jsonb_build_object('members',payload->'members'));
 return target;
end; $$;

create or replace function public.compass_admin_save_property(payload jsonb) returns uuid
language plpgsql security definer set search_path='' as $$
declare prior compass_private.properties; saved compass_private.properties; target uuid:=coalesce((payload->>'id')::uuid,gen_random_uuid());
begin
 if not compass_private.is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(target::text,19));
 select * into prior from compass_private.properties where id=target for update;
 if prior.revision is distinct from (payload->>'expectedRevision')::integer then raise exception 'Property changed; reload before saving'; end if;
 if exists(select 1 from jsonb_each_text(jsonb_build_object('manager',payload->>'managerId','lead',payload->>'residentLeadId')) v where nullif(v.value,'') is not null and not exists(select 1 from compass_private.members m where m.user_id=v.value::uuid and m.active)) then raise exception 'Select active property owners'; end if;
 insert into compass_private.properties(id,name,location,units,manager_id,resident_lead_id,active)
 values(target,trim(payload->>'name'),coalesce(payload->>'location',''),(nullif(payload->>'units',''))::integer,nullif(payload->>'managerId','')::uuid,nullif(payload->>'residentLeadId','')::uuid,coalesce((payload->>'active')::boolean,true))
 on conflict(id) do update set name=excluded.name,location=excluded.location,units=excluded.units,manager_id=excluded.manager_id,resident_lead_id=excluded.resident_lead_id,active=excluded.active,revision=compass_private.properties.revision+1 returning * into saved;
 insert into compass_private.admin_events(actor_id,action,subject,before_record,after_record) values(auth.uid(),'property_saved',target::text,to_jsonb(prior),to_jsonb(saved));
 return target;
end; $$;

create or replace function public.compass_admin_set_feature(target_user uuid, feature text, enabled_value boolean) returns void
language plpgsql security definer set search_path='' as $$
declare prior jsonb;
begin
 if not compass_private.is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
 if not exists(select 1 from compass_private.members where user_id=target_user) then raise exception 'Assign this account a role first'; end if;
 if feature<>'*' and not feature=any(array['strategic','annual','metrics','weekly','learn','myDashboard','companyDashboard','executivePulse','priorities','workplans','huddles','stucks','stuckActions','taskView','weeklyTracker','calendar','dataTable','reports','teamHealth','adminUsers','adminTeams','adminPermissions','featureRollout','propertyGovernance','guidedPractice']) then raise exception 'Unknown feature'; end if;
 select coalesce(jsonb_agg(to_jsonb(f)),'[]') into prior from compass_private.member_features f where user_id=target_user and (feature='*' or feature_key=feature);
 if feature='*' or enabled_value is null then delete from compass_private.member_features where user_id=target_user and (feature='*' or feature_key=feature);
 else insert into compass_private.member_features(user_id,feature_key,enabled) values(target_user,feature,enabled_value) on conflict(user_id,feature_key) do update set enabled=excluded.enabled; end if;
 insert into compass_private.admin_events(actor_id,action,subject,before_record,after_record) values(auth.uid(),case when feature='*' then 'features_reset' else 'feature_changed' end,target_user::text,prior,jsonb_build_object('feature',feature,'enabled',enabled_value));
end; $$;

create or replace function public.compass_admin_user_lookup(target_email text) returns jsonb
language plpgsql security definer set search_path='' as $$
begin
 if not compass_private.is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
 return (select jsonb_build_object('id',u.id,'requestId',u.raw_app_meta_data->>'compass_provisioning_id','assigned',exists(select 1 from compass_private.members where user_id=u.id),'confirmed',u.email_confirmed_at is not null) from auth.users u where lower(email)=lower(trim(target_email)) limit 1);
end; $$;

create or replace function public.compass_admin_log_user_event(target_user uuid,event_name text) returns void
language plpgsql security definer set search_path='' as $$
begin
 if not compass_private.is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
 if event_name not in ('user_created','invitation_sent') then raise exception 'Invalid user event'; end if;
 insert into compass_private.admin_events(actor_id,action,subject) values(auth.uid(),event_name,target_user::text);
end; $$;

create or replace function public.compass_admin_records(record_kind text, page_number integer default 0, search_text text default '') returns jsonb
language plpgsql security definer set search_path='' as $$
declare rows jsonb;
begin
 if not compass_private.is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
 if page_number<0 or page_number>100000 then raise exception 'Invalid page'; end if;
 if record_kind='metrics' then
  select coalesce(jsonb_agg(to_jsonb(r)),'[]') into rows from (select e.id,m.name title,e.department owner,to_char(e.period,'YYYY-MM') period,e.value,e.description,e.revision,e.category_id category from compass_private.metric_entries e join compass_private.metric_definitions m on m.id=e.metric_id
  where concat_ws(' ',m.name,e.department,e.description) ilike '%'||search_text||'%' order by e.updated_at desc,e.id limit 101 offset page_number*100) r;
 elsif record_kind='weekly' then
  select coalesce(jsonb_agg(to_jsonb(r)),'[]') into rows from (select w.position_id,w.week,p.title owner,w.revision,w.first_submitted_at,w.exempt,w.draft,w.submitted from compass_private.weekly_records w join compass_private.positions p on p.id=w.position_id
  where concat_ws(' ',p.title,w.draft::text,w.submitted::text) ilike '%'||search_text||'%' order by w.week desc,w.position_id limit 101 offset page_number*100) r;
 elsif record_kind='actions' then
  select coalesce(jsonb_agg(to_jsonb(r)),'[]') into rows from (select t->>'id' id,t->>'title' title,coalesce(owner.title,t->>'owner') owner,t->>'status' status,t->>'due' due,e->>'title' priority,e->>'objectiveId' objective,w.week from compass_private.weekly_records w cross join lateral jsonb_array_elements(w.submitted->'entries') e cross join lateral jsonb_array_elements(e->'tasks') t left join compass_private.positions owner on owner.id=t->>'owner'
  where concat_ws(' ',t::text,e->>'title',owner.title) ilike '%'||search_text||'%' order by w.week desc,w.position_id,t->>'id' limit 101 offset page_number*100) r;
 else raise exception 'Unknown record type'; end if;
 return rows;
end; $$;

-- Member and target edits share the Admin history without exposing their contents publicly.
create or replace function compass_private.audit_admin_member() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into compass_private.admin_events(actor_id,action,subject,before_record,after_record) values(new.actor_id,'access_saved',new.target_id::text,new.previous_record,new.next_record);return new;
end; $$;
drop trigger if exists admin_member_history on compass_private.member_audit;
create trigger admin_member_history after insert on compass_private.member_audit for each row execute function compass_private.audit_admin_member();

create or replace function public.compass_access_context() returns jsonb language plpgsql security definer set search_path='' as $$
declare m compass_private.members;
begin
 select * into m from compass_private.members where user_id=auth.uid() and active;
 if not found then raise exception 'Your account needs an active Admin assignment' using errcode='42501'; end if;
 return jsonb_build_object('positionTitle',m.position_title,'roles',m.roles,'admin',compass_private.is_admin(),'metrics',compass_private.can_read_metrics(),'weekly',compass_private.weekly_access(null,false),
 'features',(select coalesce(jsonb_object_agg(feature_key,enabled),'{}') from compass_private.member_features where user_id=auth.uid()));
end; $$;

revoke all on function public.compass_admin_workspace(),public.compass_admin_save_team(jsonb),public.compass_admin_save_property(jsonb),public.compass_admin_set_feature(uuid,text,boolean),public.compass_admin_user_lookup(text),public.compass_admin_log_user_event(uuid,text),public.compass_admin_records(text,integer,text) from public,anon;
grant execute on function public.compass_admin_workspace(),public.compass_admin_save_team(jsonb),public.compass_admin_save_property(jsonb),public.compass_admin_set_feature(uuid,text,boolean),public.compass_admin_user_lookup(text),public.compass_admin_log_user_event(uuid,text),public.compass_admin_records(text,integer,text) to authenticated;
revoke all on function compass_private.audit_admin_member() from public,anon,authenticated;
insert into compass_private.releases(version) values('20260919_command_center') on conflict do nothing;
notify pgrst,'reload schema';
commit;

begin;
create or replace function public.compass_admin_members() returns jsonb
language plpgsql security definer set search_path='' as $$
begin
 if not compass_private.is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
 return jsonb_build_object('members',(select coalesce(jsonb_agg(jsonb_build_object(
 'userId',u.id,'email',u.email,'confirmed',u.email_confirmed_at is not null,'positionTitle',coalesce(m.position_title,''),'roles',coalesce(m.roles,'{}'),
 'departments',coalesce(m.departments,'{}'),'active',coalesce(m.active,false),
 'readMetrics',m.read_metrics,'writeMetrics',m.write_metrics,'readWeekly',m.read_weekly,'writeWeekly',m.write_weekly,
 'positions',(select coalesce(jsonb_agg(a.position_id),'[]') from compass_private.position_assignments a where a.user_id=u.id)
 ) order by u.email),'[]') from auth.users u left join compass_private.members m on m.user_id=u.id),
 'departments',(select jsonb_agg(name order by name) from compass_private.departments),
 'positions',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'title',title) order by title),'[]') from compass_private.positions where active));
end; $$;
create or replace function public.compass_set_metric_member(payload jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare prior compass_private.members; next_member compass_private.members; target uuid := (payload->>'userId')::uuid;
begin
 if not compass_private.is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
 perform pg_catalog.pg_advisory_xact_lock(20260916);
 if not exists(select 1 from auth.users where id=target) then raise exception 'Create an account before assigning access'; end if;
 select * into prior from compass_private.members where user_id=target for update;
 if jsonb_typeof(payload->'roles') is distinct from 'array' or jsonb_array_length(payload->'roles')=0 then raise exception 'Select at least one role'; end if;
 if jsonb_typeof(payload->'departments') is distinct from 'array' then raise exception 'Department scope is required'; end if;
 if exists(select 1 from jsonb_array_elements_text(payload->'departments') v where not exists
 (select 1 from compass_private.departments d where d.name=v.value)) then raise exception 'Unknown department'; end if;
 if length(trim(payload->>'positionTitle'))>150 then raise exception 'Position title is too long'; end if;
 insert into compass_private.members(user_id,position_title,roles,departments,active,read_metrics,write_metrics,read_weekly,write_weekly)
 values(target,trim(payload->>'positionTitle'),array(select jsonb_array_elements_text(payload->'roles')),
 array(select jsonb_array_elements_text(payload->'departments')),coalesce((payload->>'active')::boolean,true),
 (payload->>'readMetrics')::boolean,(payload->>'writeMetrics')::boolean,(payload->>'readWeekly')::boolean,(payload->>'writeWeekly')::boolean)
 on conflict(user_id) do update set position_title=excluded.position_title,roles=excluded.roles,departments=excluded.departments,
 active=excluded.active,read_metrics=excluded.read_metrics,write_metrics=excluded.write_metrics,
 read_weekly=excluded.read_weekly,write_weekly=excluded.write_weekly returning * into next_member;
 if not exists(select 1 from compass_private.members where active and 'admin'=any(roles)) then raise exception 'At least one active Admin is required'; end if;
 if payload ? 'positions' then
   if jsonb_typeof(payload->'positions') is distinct from 'array' then raise exception 'Positions must be a list'; end if;
   if exists(select 1 from jsonb_array_elements_text(payload->'positions') v where not exists(select 1 from compass_private.positions p where p.id=v.value and active)) then raise exception 'Unknown position'; end if;
   delete from compass_private.position_assignments where user_id=target;
   insert into compass_private.position_assignments(user_id,position_id)
   select target,value from jsonb_array_elements_text(payload->'positions') on conflict do nothing;
   insert into compass_private.position_assignments(user_id,position_id)
   select target,id from compass_private.positions where title=next_member.position_title on conflict do nothing;
 end if;
 update compass_private.positions p set required=exists(select 1 from compass_private.position_assignments a join compass_private.members m on m.user_id=a.user_id
 where a.position_id=p.id and m.active and m.roles && array['executive','elt','director']);
 insert into compass_private.member_audit(actor_id,target_id,previous_record,next_record)
 values(auth.uid(),target,to_jsonb(prior),to_jsonb(next_member)||jsonb_build_object('positions',payload->'positions'));
end; $$;
create or replace function compass_private.weekly_maintain(at_time timestamptz default clock_timestamp()) returns void
language plpgsql security definer set search_path='' as $$
declare current_week date := date_trunc('week',at_time at time zone 'America/New_York')::date; rec record;
begin
 -- No retrospective roster inference: materialize this cycle only, at enrollment/job time.
 if current_week >= (select starts_on from compass_private.weekly_settings) then
 insert into compass_private.weekly_records(position_id,week,expected)
 select p.id,current_week,true from compass_private.positions p where p.active and p.required
 and exists(select 1 from compass_private.position_assignments a join compass_private.members m on m.user_id=a.user_id
  where a.position_id=p.id and m.active and exists(select 1 from auth.users u where u.id=m.user_id and u.email_confirmed_at is not null) and m.roles && array['executive','elt','director'])
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
insert into compass_private.releases(version) values('20260919_user_provisioning') on conflict do nothing;
notify pgrst,'reload schema';
commit;

begin;
create or replace function public.compass_set_metric_member(payload jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare prior compass_private.members; next_member compass_private.members; prior_position_ids text[]; target uuid := (payload->>'userId')::uuid;
begin
 if not compass_private.is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
 perform pg_catalog.pg_advisory_xact_lock(20260916);
 if not exists(select 1 from auth.users where id=target) then raise exception 'Create an account before assigning access'; end if;
 select * into prior from compass_private.members where user_id=target for update;
 select array_agg(position_id) into prior_position_ids from compass_private.position_assignments where user_id=target;
 if jsonb_typeof(payload->'roles') is distinct from 'array' or jsonb_array_length(payload->'roles')=0 then raise exception 'Select at least one role'; end if;
 if jsonb_typeof(payload->'departments') is distinct from 'array' then raise exception 'Department scope is required'; end if;
 if exists(select 1 from jsonb_array_elements_text(payload->'departments') v where not exists
 (select 1 from compass_private.departments d where d.name=v.value)) then raise exception 'Unknown department'; end if;
 if length(trim(payload->>'positionTitle'))>150 then raise exception 'Position title is too long'; end if;
 insert into compass_private.members(user_id,position_title,roles,departments,active,read_metrics,write_metrics,read_weekly,write_weekly)
 values(target,trim(payload->>'positionTitle'),array(select jsonb_array_elements_text(payload->'roles')),
 array(select jsonb_array_elements_text(payload->'departments')),coalesce((payload->>'active')::boolean,true),
 (payload->>'readMetrics')::boolean,(payload->>'writeMetrics')::boolean,(payload->>'readWeekly')::boolean,(payload->>'writeWeekly')::boolean)
 on conflict(user_id) do update set position_title=excluded.position_title,roles=excluded.roles,departments=excluded.departments,
 active=excluded.active,read_metrics=excluded.read_metrics,write_metrics=excluded.write_metrics,
 read_weekly=excluded.read_weekly,write_weekly=excluded.write_weekly returning * into next_member;
 if not exists(select 1 from compass_private.members where active and 'admin'=any(roles)) then raise exception 'At least one active Admin is required'; end if;
 if payload ? 'positions' then
   if jsonb_typeof(payload->'positions') is distinct from 'array' then raise exception 'Positions must be a list'; end if;
   if exists(select 1 from jsonb_array_elements_text(payload->'positions') v where not exists(select 1 from compass_private.positions p where p.id=v.value and active)) then raise exception 'Unknown position'; end if;
   delete from compass_private.position_assignments where user_id=target;
   insert into compass_private.position_assignments(user_id,position_id)
   select target,value from jsonb_array_elements_text(payload->'positions') on conflict do nothing;
   insert into compass_private.position_assignments(user_id,position_id)
   select target,id from compass_private.positions where title=next_member.position_title on conflict do nothing;
 end if;
 update compass_private.positions p set required=exists(select 1 from compass_private.position_assignments a join compass_private.members m on m.user_id=a.user_id
 where a.position_id=p.id and m.active and m.roles && array['executive','elt','director'])
 where p.id=any(coalesce(prior_position_ids,'{}')) or exists(select 1 from compass_private.position_assignments a where a.position_id=p.id and a.user_id=target);
 insert into compass_private.member_audit(actor_id,target_id,previous_record,next_record)
 values(auth.uid(),target,to_jsonb(prior),to_jsonb(next_member)||jsonb_build_object('positions',payload->'positions'));
end; $$;
insert into compass_private.releases(version) values('20260919_provisioning_scope') on conflict do nothing;
notify pgrst,'reload schema';
commit;

begin;
create table if not exists compass_private.workspace_sessions (
 id uuid primary key default gen_random_uuid(),
 actor_id uuid not null references auth.users(id),
 target_id uuid not null references compass_private.members(user_id),
 allow_writes boolean not null default false,
 started_at timestamptz not null default clock_timestamp(),
 expires_at timestamptz not null default (clock_timestamp()+interval '1 hour'),
 ended_at timestamptz
);
alter table compass_private.workspace_sessions enable row level security;
revoke all on compass_private.workspace_sessions from public,anon,authenticated;

create or replace function public.compass_admin_start_workspace(target_user uuid, allow_writes boolean default false)
returns jsonb language plpgsql security definer set search_path='' as $$
declare s compass_private.workspace_sessions; m compass_private.members; u auth.users;
begin
 if not compass_private.is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
 if target_user=auth.uid() then raise exception 'You are already in your own workspace'; end if;
 select * into m from compass_private.members where user_id=target_user and active;
 if not found then raise exception 'Choose an active account with assigned access'; end if;
 select * into u from auth.users where id=target_user;
 insert into compass_private.workspace_sessions(actor_id,target_id,allow_writes)
 values(auth.uid(),target_user,coalesce(allow_writes,false)) returning * into s;
 insert into compass_private.admin_events(actor_id,action,subject,after_record)
 values(auth.uid(),'workspace_opened',target_user::text,jsonb_build_object('sessionId',s.id,'allowWrites',s.allow_writes,'expiresAt',s.expires_at));
 return jsonb_build_object('id',s.id,'userId',target_user,'email',u.email,
  'name',coalesce(u.raw_user_meta_data->>'full_name',u.raw_user_meta_data->>'name',u.email),
  'positionTitle',m.position_title,'allowWrites',s.allow_writes,'expiresAt',s.expires_at);
end; $$;

create or replace function public.compass_admin_end_workspace(workspace_session uuid)
returns void language plpgsql security definer set search_path='' as $$
declare s compass_private.workspace_sessions;
begin
 -- The initiating account can always close its own session, even after Admin removal.
 select * into s from compass_private.workspace_sessions where id=workspace_session and actor_id=auth.uid() for update;
 if not found then raise exception 'Workspace session not found' using errcode='42501'; end if;
 if s.ended_at is null then
  update compass_private.workspace_sessions set ended_at=clock_timestamp() where id=s.id;
  insert into compass_private.admin_events(actor_id,action,subject,after_record)
  values(auth.uid(),'workspace_closed',s.target_id::text,jsonb_build_object('sessionId',s.id));
 end if;
end; $$;

create or replace function public.compass_admin_workspace_call(workspace_session uuid, operation text, arguments jsonb default '{}')
returns jsonb language plpgsql security definer set search_path='' as $$
declare s compass_private.workspace_sessions; actor uuid:=auth.uid(); result jsonb;
 old_claims text:=current_setting('request.jwt.claims',true);
 old_sub text:=current_setting('request.jwt.claim.sub',true);
 writing boolean:=operation in ('compass_save_metric_entry','compass_save_weekly');
begin
 if not compass_private.is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
 select * into s from compass_private.workspace_sessions where id=workspace_session and actor_id=actor for share;
 if not found or s.ended_at is not null or s.expires_at<=clock_timestamp() then
  raise exception 'Workspace session ended. Return to Admin and open it again.' using errcode='42501';
 end if;
 if not exists(select 1 from compass_private.members where user_id=s.target_id and active) then
  raise exception 'This account is no longer active' using errcode='42501';
 end if;
 if operation is null or operation not in ('compass_access_context','compass_metric_context','compass_metric_entries',
  'compass_scorecard_data','compass_scorecard_targets','compass_weekly_context','compass_save_metric_entry','compass_save_weekly') then
  raise exception 'Return to your Admin account to use management controls' using errcode='42501';
 end if;
 if writing and not s.allow_writes then raise exception 'Viewing only. Reopen this workspace with saving enabled to make changes.' using errcode='42501'; end if;
 -- Scope identity to this transaction and only to the explicit operations below.
 -- Both claim representations are restored before returning or propagating errors.
 perform set_config('request.jwt.claim.sub',s.target_id::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',s.target_id,'role','authenticated')::text,true);
 begin
  case operation
   when 'compass_access_context' then result:=public.compass_access_context()||jsonb_build_object('admin',false);
   when 'compass_metric_context' then result:=public.compass_metric_context();
   when 'compass_metric_entries' then result:=public.compass_metric_entries(arguments->>'target_department');
   when 'compass_scorecard_data' then result:=public.compass_scorecard_data((arguments->>'report_month')::date);
   when 'compass_scorecard_targets' then result:=public.compass_scorecard_targets((arguments->>'target_year')::integer);
   when 'compass_weekly_context' then result:=public.compass_weekly_context((arguments->>'week_date')::date);
   when 'compass_save_metric_entry' then result:=public.compass_save_metric_entry(arguments->'payload');
   when 'compass_save_weekly' then result:=public.compass_save_weekly(arguments->'payload',coalesce((arguments->>'finalizing')::boolean,false));
  end case;
 exception when others then
  perform set_config('request.jwt.claim.sub',coalesce(old_sub,''),true);
  perform set_config('request.jwt.claims',coalesce(old_claims,''),true);
  raise;
 end;
 perform set_config('request.jwt.claim.sub',coalesce(old_sub,''),true);
 perform set_config('request.jwt.claims',coalesce(old_claims,''),true);
 if writing then
  insert into compass_private.admin_events(actor_id,action,subject,after_record)
  values(actor,'workspace_saved',s.target_id::text,jsonb_build_object('sessionId',s.id,'operation',operation,'result',result));
 end if;
 return result;
end; $$;
revoke all on function public.compass_admin_start_workspace(uuid,boolean),public.compass_admin_end_workspace(uuid),public.compass_admin_workspace_call(uuid,text,jsonb) from public,anon;
grant execute on function public.compass_admin_start_workspace(uuid,boolean),public.compass_admin_end_workspace(uuid),public.compass_admin_workspace_call(uuid,text,jsonb) to authenticated;
insert into compass_private.releases(version) values('20260920_admin_view_as') on conflict do nothing;
notify pgrst,'reload schema';
commit;

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

begin;
create table if not exists compass_private.historical_archive (
 id text primary key,
 period text not null check(period in ('2026-Q1','2026-Q2')),
 content jsonb not null check(jsonb_typeof(content)='object'),
 content_hash text not null,
 imported_at timestamptz not null default now()
);
alter table compass_private.historical_archive enable row level security;
revoke all on compass_private.historical_archive from public,anon,authenticated;
create or replace function compass_private.reject_archive_change() returns trigger
language plpgsql set search_path='' as $$
begin raise exception 'Historical archive records cannot be edited or deleted' using errcode='55000'; end; $$;
drop trigger if exists immutable_archive on compass_private.historical_archive;
create trigger immutable_archive before update or delete on compass_private.historical_archive
for each row execute function compass_private.reject_archive_change();
create or replace function public.compass_admin_archive(archive_period text,search_text text default '') returns jsonb
language plpgsql security definer set search_path='' as $$
begin
 if not compass_private.is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
 if archive_period not in ('2026-Q1','2026-Q2') then raise exception 'Choose an available archive quarter'; end if;
 if length(coalesce(search_text,''))>200 then raise exception 'Search is too long'; end if;
 return (select coalesce(jsonb_agg(to_jsonb(r) order by r.content->>'title',r.id),'[]') from
  (select id,period,content from compass_private.historical_archive a where a.period=archive_period
   and a.content::text ilike '%'||coalesce(search_text,'')||'%') r);
end; $$;
revoke all on function compass_private.reject_archive_change() from public,anon,authenticated;
revoke all on function public.compass_admin_archive(text,text) from public,anon;
grant execute on function public.compass_admin_archive(text,text) to authenticated;
insert into compass_private.releases(version) values('20260922_historical_archive') on conflict do nothing;
notify pgrst,'reload schema';
commit;

begin;
alter table compass_private.members drop constraint if exists members_roles_check;
alter table compass_private.members add constraint members_roles_check check(roles <@ array['admin','executive','elt','olt','director','staff','external']::text[]);
do $$ begin
 if not exists(select 1 from compass_private.releases where version='20260923_workspace_roles') then
  update compass_private.positions set roles=array_append(roles,'olt'),revision=revision+1 where 'director'=any(roles) and not 'olt'=any(roles);
  update compass_private.positions set features=features||'{"myDashboard":false}'::jsonb;
  delete from compass_private.member_features where feature_key='myDashboard';
  insert into compass_private.member_features(user_id,feature_key,enabled)
   select m.user_id,'myDashboard',true from compass_private.members m join auth.users u on u.id=m.user_id
   where lower(u.email)='pkelley@hdcweb.org' and m.active;
 end if;
end $$;

create or replace function compass_private.can_read_metrics() returns boolean
language sql stable security definer set search_path='' as $$
 select compass_private.is_admin() or exists(select 1 from compass_private.members m join compass_private.positions p on p.id=compass_private.current_position()
 where m.user_id=auth.uid() and m.active and m.read_metrics is distinct from false
 and coalesce(p.read_scorecards,p.roles && array['executive','elt','olt','director']));
$$;

create or replace function compass_private.weekly_access(target_position text, writing boolean default false) returns boolean
language sql stable security definer set search_path='' as $$
 select compass_private.is_admin() or exists(select 1 from compass_private.members m where m.user_id=auth.uid() and m.active
 and compass_private.current_position_roles() && array['executive','elt','olt']
 and case when writing then m.write_weekly is distinct from false and target_position=compass_private.current_position()
 else m.read_weekly is distinct from false end);
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
  where a.position_id=p.id and m.active and exists(select 1 from auth.users u where u.id=m.user_id and u.email_confirmed_at is not null) and p.roles && array['executive','elt','olt'])
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
 if cardinality(chosen_roles)=0 or not chosen_roles <@ array['executive','elt','olt','director','staff','external'] then raise exception 'Select valid position roles'; end if;
 if jsonb_typeof(coalesce(payload->'features','{}'))<>'object' or exists(select 1 from jsonb_each(coalesce(payload->'features','{}')) f where jsonb_typeof(f.value)<>'boolean') then raise exception 'Feature settings must be true or false'; end if;
 insert into compass_private.positions(id,title,department,roles,features,read_scorecards,required,active)
 values(target,trim(payload->>'title'),nullif(payload->>'department',''),chosen_roles,coalesce(payload->'features','{}'),
  (payload->>'readScorecards')::boolean,chosen_roles && array['executive','elt','olt'],coalesce((payload->>'active')::boolean,true))
 on conflict(id) do update set title=excluded.title,department=excluded.department,roles=excluded.roles,features=excluded.features,
 read_scorecards=excluded.read_scorecards,required=excluded.required,active=excluded.active,revision=compass_private.positions.revision+1 returning * into saved;
 insert into compass_private.admin_events(actor_id,action,subject,before_record,after_record)
 values(auth.uid(),'position_saved',target,to_jsonb(prior),to_jsonb(saved));
 return to_jsonb(saved);
end; $$;

create table if not exists compass_private.profiles (
 user_id uuid primary key references compass_private.members(user_id),
 display_name text not null default '' check(length(display_name)<=150),
 bio text not null default '' check(length(bio)<=1000),
 photo text check(photo is null or (length(photo)<=180000 and photo ~ '^data:image/jpeg;base64,[A-Za-z0-9+/=]+$')),
 revision integer not null default 1
);
alter table compass_private.profiles enable row level security;
revoke all on compass_private.profiles from public,anon,authenticated;

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
 'profile',(select jsonb_build_object('displayName',display_name,'photo',photo) from compass_private.profiles where user_id=auth.uid()),
 'features','{"myDashboard":false}'::jsonb||coalesce(p.features,'{}')||(select coalesce(jsonb_object_agg(feature_key,enabled),'{}') from compass_private.member_features where user_id=auth.uid()));
end; $$;

create or replace function compass_private.workspace_enabled() returns boolean
language sql stable security definer set search_path='' as $$
 select coalesce((public.compass_access_context()->'features'->>'myDashboard')::boolean,false);
$$;

create or replace function public.compass_my_workspace() returns jsonb
language plpgsql security definer set search_path='' as $$
declare ctx jsonb:=public.compass_access_context(); person jsonb;
begin
 if not compass_private.workspace_enabled() then raise exception 'Your working dashboard has not been enabled yet' using errcode='42501'; end if;
 select jsonb_build_object('displayName',coalesce(nullif(p.display_name,''),u.raw_user_meta_data->>'full_name',u.raw_user_meta_data->>'name',u.email),
 'email',u.email,'bio',coalesce(p.bio,''),'photo',p.photo,'revision',p.revision) into person
 from auth.users u left join compass_private.profiles p on p.user_id=u.id where u.id=auth.uid();
 return jsonb_build_object('profile',person,'access',ctx,
 'weekly',case when (ctx->>'weekly')::boolean then public.compass_weekly_context() else null end,
 'properties',(select coalesce(jsonb_agg(to_jsonb(p) order by p.name),'[]') from compass_private.properties p where p.active
 and (compass_private.is_admin() or p.manager_id=auth.uid() or p.resident_lead_id=auth.uid())));
end; $$;

create or replace function public.compass_save_profile(payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare prior compass_private.profiles; saved compass_private.profiles; photo_value text:=nullif(payload->>'photo','');
begin
 if not compass_private.workspace_enabled() then raise exception 'Your working dashboard has not been enabled yet' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,23));
 select * into prior from compass_private.profiles where user_id=auth.uid() for update;
 if prior.revision is distinct from (payload->>'expectedRevision')::integer then raise exception 'Your profile changed; reload before saving'; end if;
 if length(trim(coalesce(payload->>'displayName',''))) not between 1 and 150 then raise exception 'Enter your display name'; end if;
 if photo_value is not null and (length(photo_value)>180000 or photo_value !~ '^data:image/jpeg;base64,/9j/[A-Za-z0-9+/=]+$') then raise exception 'Choose a JPEG profile photo under 130 KB'; end if;
 insert into compass_private.profiles(user_id,display_name,bio,photo)
 values(auth.uid(),trim(payload->>'displayName'),coalesce(payload->>'bio',''),photo_value)
 on conflict(user_id) do update set display_name=excluded.display_name,bio=excluded.bio,photo=excluded.photo,revision=compass_private.profiles.revision+1 returning * into saved;
 return jsonb_build_object('displayName',saved.display_name,'bio',saved.bio,'photo',saved.photo,'revision',saved.revision);
end; $$;
revoke all on function compass_private.workspace_enabled(),public.compass_my_workspace(),public.compass_save_profile(jsonb) from public,anon;
grant execute on function public.compass_my_workspace(),public.compass_save_profile(jsonb) to authenticated;


alter table compass_private.properties add column if not exists code text unique check(length(code) between 1 and 30);
alter table compass_private.properties add column if not exists street text check(length(street)<=200);
alter table compass_private.properties add column if not exists city text check(length(city)<=100);
alter table compass_private.properties add column if not exists state text check(state ~ '^[A-Z]{2}$');
alter table compass_private.properties add column if not exists postal_code text check(postal_code ~ '^[0-9]{5}(-[0-9]{4})?$');
alter table compass_private.properties add column if not exists population text check(length(population)<=250);

create or replace function public.compass_admin_save_property(payload jsonb) returns uuid
language plpgsql security definer set search_path='' as $$
declare prior compass_private.properties; saved compass_private.properties; target uuid:=coalesce((payload->>'id')::uuid,gen_random_uuid());
begin
 if not compass_private.is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(target::text,19));
 select * into prior from compass_private.properties where id=target for update;
 if prior.revision is distinct from (payload->>'expectedRevision')::integer then raise exception 'Property changed; reload before saving'; end if;
 if exists(select 1 from jsonb_each_text(jsonb_build_object('manager',payload->>'managerId','lead',payload->>'residentLeadId')) v where nullif(v.value,'') is not null and not exists(select 1 from compass_private.members m where m.user_id=v.value::uuid and m.active)) then raise exception 'Select active property owners'; end if;
 insert into compass_private.properties(id,name,location,units,manager_id,resident_lead_id,active,code,street,city,state,postal_code,population)
 values(target,trim(payload->>'name'),coalesce(payload->>'location',''),(nullif(payload->>'units',''))::integer,nullif(payload->>'managerId','')::uuid,nullif(payload->>'residentLeadId','')::uuid,coalesce((payload->>'active')::boolean,true),case when payload ? 'code' then nullif(trim(payload->>'code'),'') else prior.code end,case when payload ? 'street' then nullif(trim(payload->>'street'),'') else prior.street end,case when payload ? 'city' then nullif(trim(payload->>'city'),'') else prior.city end,case when payload ? 'state' then nullif(trim(payload->>'state'),'') else prior.state end,case when payload ? 'postalCode' then nullif(trim(payload->>'postalCode'),'') else prior.postal_code end,case when payload ? 'population' then nullif(trim(payload->>'population'),'') else prior.population end)
 on conflict(id) do update set name=excluded.name,location=excluded.location,units=excluded.units,manager_id=excluded.manager_id,resident_lead_id=excluded.resident_lead_id,active=excluded.active,code=excluded.code,street=excluded.street,city=excluded.city,state=excluded.state,postal_code=excluded.postal_code,population=excluded.population,revision=compass_private.properties.revision+1 returning * into saved;
 insert into compass_private.admin_events(actor_id,action,subject,before_record,after_record) values(auth.uid(),'property_saved',target::text,to_jsonb(prior),to_jsonb(saved));
 return target;
end; $$;

-- Restore missing original scorecard definitions without altering existing governance.
insert into compass_private.metric_definitions(id,name,department,unit) values
('annual-rs-utilization-rate','Resident Services Utilization Rate','Resident Services','percent'),
('resident-services-2','Resident Experience Score','Resident Services','percent'),
('resident-services-6','Household (Resident) Engagement Rate','Resident Services','percent'),
('resident-services-1','Resident Satisfaction Rate','Resident Services','percent'),
('resident-services-3','Housing Stability Rate','Resident Services','percent'),
('rs-positive-move-out-rate','Positive Move-Out Rate','Resident Services','percent'),
('annual-service-partner-connection-rate','Service Delivery Partner Connection Rate','Resident Services','percent'),
('community-relations-8','Predevelopment Capital Raised','Community Relations','USD'),
('finance-3','Accounts Receivable Reduction','Finance','USD'),
('finance-1','Days Cash on Hand','Finance','days'),
('finance-parent-noi','Net Operating Income','Finance','USD'),
('finance-4','Current Ratio','Finance','ratio'),
('human-resources-1','Employee Satisfaction Rate','Human Resources','percent'),
('human-resources-3','Employee Engagement Rate','Human Resources','percent'),
('hr-retention-12-month','Employee Retention Rate (12-month)','Human Resources','percent'),
('annual-new-units-acquired-placed','New Units Acquired or Placed in Service','Real Estate Development','units'),
('real-estate-development-6','Existing Units Rehabbed','Real Estate Development','units'),
('annual-units-under-development','Units Under Development (LIHTC Applied/Awarded)','Real Estate Development','units'),
('real-estate-development-7','Units in Closing','Real Estate Development','units'),
('property-management-1','Events of Noncompliance','Property Management','count'),
('property-management-2','Rent Collection Rate','Property Management','percent'),
('property-management-3','Vacancy Rate','Property Management','percent'),
('finance-6','Payment of Deferred Developer Fee','Finance','USD'),
('finance-7','Vacancy Loss','Finance','USD'),
('annual-resident-stories','Resident Stories Collected & Shared','Community Relations','count'),
('annual-positive-news','Positive News Mentions','Community Relations','count'),
('community-relations-13','Brand Visibility & Reach Score','Community Relations','percent'),
('property-management-5','Property Management Fee','Finance','USD'),
('real-estate-development-8','Developer Fee Earned','Real Estate Development','USD'),
('community-relations-1','Contributed Revenue','Community Relations','USD'),
('finance-5','Excess Cash to Parent','Finance','USD'),
('annual-policy-engagements','Engagements with Policy Decision-Makers','Community Relations','count'),
('annual-testimonies-op-eds','Testimonies / Op-Eds Delivered','Community Relations','count'),
('operations-3','User Engagement Rate (CRM & AM)',null,'percent'),
('finance-technology-cost-savings','Cost Savings from Technology','Finance','USD')
on conflict(id) do nothing;
-- Position metric permissions remain governed by Admin; no automatic write grants.
insert into compass_private.releases(version) values('20260923_workspace_roles') on conflict do nothing;
notify pgrst,'reload schema';
commit;

begin;
do $$ declare item jsonb; existing compass_private.properties; begin
 for item in select value from jsonb_array_elements('[{"name":"1528 West Apts","code":"1528","street":"1528 W Hamilton St","city":"Allentown","state":"PA","postalCode":"18102","population":"Senior 55+ Elderly & Handicapped","units":null},{"name":"Beach Run","code":"BEACH","street":"325 N. Center St.","city":"Fredericksburg","state":"PA","postalCode":"17026","population":"General","units":null},{"name":"Brandywine Ctr","code":"BHH","street":"744 E. Lincoln Hwy","city":"Coatesville","state":"PA","postalCode":"19320","population":"Senior 62+","units":null},{"name":"Claymont Street Apartments","code":"CLAY","street":"1300 E. 16th St.","city":"Wilmington","state":"DE","postalCode":"19805","population":"General / Section 8","units":null},{"name":"College Avenue Apartments","code":"COL","street":"213 College Ave","city":"Lancaster","state":"PA","postalCode":"17603","population":null,"units":null},{"name":"Duke Manor Apts.","code":"DMA","street":"716 Rockland St.","city":"Lancaster","state":"PA","postalCode":"17602","population":"Family HUD/Section 8","units":null},{"name":"Exeter Apartments (Bond 5 LP)","code":"XTR","street":"222 Schooley Ave.","city":"Exeter","state":"PA","postalCode":"18643","population":"Senior Tax Credit","units":null},{"name":"The Flats Phase I","code":"FLATS","street":"525 N Union St","city":"Wilmington","state":"DE","postalCode":"19805","population":"General / Section 8","units":null},{"name":"The Flats Phase II","code":"FLATS2","street":"601 N Union St","city":"Wilmington","state":"DE","postalCode":"19805","population":"General / Section 8","units":null},{"name":"The Flats Phase III","code":"FLATS3","street":"610 Bayard Ave","city":"Wilmington","state":"DE","postalCode":"19805","population":"General / Section 8","units":null},{"name":"The Flats Phase IV","code":"FLATS4","street":"610 Ferris St","city":"Wilmington","state":"DE","postalCode":"19805","population":"General / Section 8","units":null},{"name":"Glenbrook Apartments","code":"GLEN","street":"463 Main St","city":"Atglen","state":"PA","postalCode":"19310","population":"General","units":null},{"name":"Governors Gate Apartments","code":"GOVGATE","street":"405 Governors Park Drive","city":"Bellefonte","state":"PA","postalCode":"16823","population":"Family Section 8","units":null},{"name":"Hamburg School Apartments","code":"HAMBURG","street":"690 E State Street","city":"Hamburg","state":"PA","postalCode":"19526","population":"General / Section 8","units":null},{"name":"Henner Apts.","code":"HAA","street":"24 E. High St.","city":"Wolmelsdorf","state":"PA","postalCode":"19567","population":"Senior 55+ / Elderly & Handicapped","units":null},{"name":"Heritage Point Apartments","code":"HPA","street":"94 McGarraher Street","city":"Wilkes-Barre","state":"PA","postalCode":"18702","population":"General / Section 8","units":null}]'::jsonb) loop
  select * into existing from compass_private.properties where code=item->>'code';
  if found then continue; end if;
  select * into existing from compass_private.properties where name=item->>'name';
  if found then
   if existing.code is not null then raise exception 'Property name already has another code: %',existing.name; end if;
   update compass_private.properties set code=item->>'code',street=coalesce(street,item->>'street'),city=coalesce(city,item->>'city'),state=coalesce(state,item->>'state'),postal_code=coalesce(postal_code,item->>'postalCode'),population=coalesce(population,item->>'population'),revision=revision+1 where id=existing.id;
  else
   insert into compass_private.properties(name,code,street,city,state,postal_code,population,location)
   values(item->>'name',item->>'code',item->>'street',item->>'city',item->>'state',item->>'postalCode',item->>'population',concat_ws(', ',item->>'street',item->>'city',concat_ws(' ',item->>'state',item->>'postalCode')));
  end if;
 end loop;
end $$;
commit;

begin;
do $$ declare item jsonb; existing compass_private.properties; begin
 for item in select value from jsonb_array_elements('[{"name":"1528 West Apts","code":"1528","street":"1528 W Hamilton St","city":"Allentown","state":"PA","postalCode":"18102","population":"Senior 55+ Elderly & Handicapped","units":null},{"name":"Beach Run","code":"BEACH","street":"325 N. Center St.","city":"Fredericksburg","state":"PA","postalCode":"17026","population":"General","units":null},{"name":"Brandywine Ctr","code":"BHH","street":"744 E. Lincoln Hwy","city":"Coatesville","state":"PA","postalCode":"19320","population":"Senior 62+","units":null},{"name":"Claymont Street Apartments","code":"CLAY","street":"1300 E. 16th St.","city":"Wilmington","state":"DE","postalCode":"19805","population":"General / Section 8","units":null},{"name":"College Avenue Apartments","code":"COL","street":"213 College Ave","city":"Lancaster","state":"PA","postalCode":"17603","population":null,"units":null},{"name":"Duke Manor Apts.","code":"DMA","street":"716 Rockland St.","city":"Lancaster","state":"PA","postalCode":"17602","population":"Family HUD/Section 8","units":null},{"name":"Exeter Apartments (Bond 5 LP)","code":"XTR","street":"222 Schooley Ave.","city":"Exeter","state":"PA","postalCode":"18643","population":"Senior Tax Credit","units":null},{"name":"The Flats Phase I","code":"FLATS","street":"525 N Union St","city":"Wilmington","state":"DE","postalCode":"19805","population":"General / Section 8","units":null},{"name":"The Flats Phase II","code":"FLATS2","street":"601 N Union St","city":"Wilmington","state":"DE","postalCode":"19805","population":"General / Section 8","units":null},{"name":"The Flats Phase III","code":"FLATS3","street":"610 Bayard Ave","city":"Wilmington","state":"DE","postalCode":"19805","population":"General / Section 8","units":null},{"name":"The Flats Phase IV","code":"FLATS4","street":"610 Ferris St","city":"Wilmington","state":"DE","postalCode":"19805","population":"General / Section 8","units":null},{"name":"Glenbrook Apartments","code":"GLEN","street":"463 Main St","city":"Atglen","state":"PA","postalCode":"19310","population":"General","units":null},{"name":"Governors Gate Apartments","code":"GOVGATE","street":"405 Governors Park Drive","city":"Bellefonte","state":"PA","postalCode":"16823","population":"Family Section 8","units":null},{"name":"Hamburg School Apartments","code":"HAMBURG","street":"690 E State Street","city":"Hamburg","state":"PA","postalCode":"19526","population":"General / Section 8","units":null},{"name":"Henner Apts.","code":"HAA","street":"24 E. High St.","city":"Wolmelsdorf","state":"PA","postalCode":"19567","population":"Senior 55+ / Elderly & Handicapped","units":null},{"name":"Heritage Point Apartments","code":"HPA","street":"94 McGarraher Street","city":"Wilkes-Barre","state":"PA","postalCode":"18702","population":"General / Section 8","units":null}]'::jsonb) loop
  select * into existing from compass_private.properties where code=item->>'code';
  if found then continue; end if;
  select * into existing from compass_private.properties where name=item->>'name';
  if found then
   if existing.code is not null then raise exception 'Property name already has another code: %',existing.name; end if;
   update compass_private.properties set code=item->>'code',street=coalesce(street,item->>'street'),city=coalesce(city,item->>'city'),state=coalesce(state,item->>'state'),postal_code=coalesce(postal_code,item->>'postalCode'),population=coalesce(population,item->>'population'),revision=revision+1 where id=existing.id;
  else
   insert into compass_private.properties(name,code,street,city,state,postal_code,population,location)
   values(item->>'name',item->>'code',item->>'street',item->>'city',item->>'state',item->>'postalCode',item->>'population',concat_ws(', ',item->>'street',item->>'city',concat_ws(' ',item->>'state',item->>'postalCode')));
  end if;
 end loop;
end $$;
commit;

begin;
insert into auth.users(id,email,email_confirmed_at) values
 ('83000000-0000-4000-8000-000000000001','workspace-admin@example.invalid',now()),
 ('83000000-0000-4000-8000-000000000002','workspace-olt@example.invalid',now()),
 ('83000000-0000-4000-8000-000000000003','workspace-director@example.invalid',now());
insert into compass_private.members(user_id,position_title,roles,departments) values
 ('83000000-0000-4000-8000-000000000001','Test admin',array['admin'],'{}');
create function pg_temp.reject(statement text) returns void language plpgsql as $$
begin begin execute statement; exception when others then return; end; raise exception 'Expected rejection: %',statement; end; $$;
set local role authenticated;
select set_config('request.jwt.claim.sub','83000000-0000-4000-8000-000000000001',true);
select public.compass_admin_save_position('{"id":"test-olt-only","title":"Test OLT only","roles":["olt"]}');
select public.compass_admin_save_position('{"id":"test-director-only","title":"Test Director only","department":"Finance","roles":["director"]}');
select public.compass_set_metric_member('{"userId":"83000000-0000-4000-8000-000000000002","roles":[],"positions":["test-olt-only"]}');
select public.compass_set_metric_member('{"userId":"83000000-0000-4000-8000-000000000003","roles":[],"positions":["test-director-only"]}');
select set_config('request.jwt.claim.sub','83000000-0000-4000-8000-000000000002',true);
do $$ declare ctx jsonb:=public.compass_access_context(); begin
 if ctx->>'weekly'<>'true' or ctx->>'scorecards'<>'true' then raise exception 'OLT-only cannot participate'; end if;
 if ctx->'roles' @> '["director"]' then raise exception 'OLT was given Director authority'; end if;
 if ctx->'features'->>'myDashboard'<>'false' then raise exception 'Dashboard leaked by default'; end if;
end $$;
select pg_temp.reject('select public.compass_my_workspace()');
select pg_temp.reject($q$select public.compass_save_profile('{"displayName":"Unauthorized"}')$q$);
select pg_temp.reject($q$select public.compass_admin_save_position('{"title":"Cannot create","roles":["olt"]}')$q$);
select set_config('request.jwt.claim.sub','83000000-0000-4000-8000-000000000003',true);
do $$ begin if public.compass_access_context()->>'weekly'<>'false' then raise exception 'Director implies OLT'; end if; end $$;
select set_config('request.jwt.claim.sub','83000000-0000-4000-8000-000000000001',true);
select public.compass_admin_save_position('{"id":"test-director-only","title":"Test Director only","department":"Finance","roles":["director","olt"],"expectedRevision":1}');
select public.compass_admin_set_feature('83000000-0000-4000-8000-000000000002','myDashboard',true);
select set_config('request.jwt.claim.sub','83000000-0000-4000-8000-000000000002',true);
select public.compass_save_profile('{"displayName":"OLT member","bio":"Weekly work","expectedRevision":null}');
do $$ declare doc jsonb:=public.compass_my_workspace(); begin
 if doc->'profile'->>'displayName'<>'OLT member' or doc->'profile'->>'revision'<>'1' then raise exception 'Profile did not persist'; end if;
 if jsonb_array_length(doc->'properties')<>0 then raise exception 'Unassigned properties leaked'; end if;
end $$;
select pg_temp.reject($q$select public.compass_save_profile('{"displayName":"Stale","expectedRevision":null}')$q$);
select pg_temp.reject($q$select public.compass_save_profile('{"displayName":"X","photo":"data:image/svg+xml;base64,abc","expectedRevision":1}')$q$);
select pg_temp.reject('select * from compass_private.profiles');
select set_config('request.jwt.claim.sub','83000000-0000-4000-8000-000000000003',true);
do $$ begin if public.compass_access_context()->>'weekly'<>'true' then raise exception 'Combined OLT and Director failed'; end if; end $$;
select pg_temp.reject('select public.compass_my_workspace()');
select set_config('request.jwt.claim.sub','83000000-0000-4000-8000-000000000001',true);
select public.compass_admin_set_feature('83000000-0000-4000-8000-000000000002','myDashboard',false);
select set_config('request.jwt.claim.sub','83000000-0000-4000-8000-000000000002',true);
select pg_temp.reject('select public.compass_my_workspace()');
select pg_temp.reject($q$select public.compass_save_profile('{"displayName":"Revoked","expectedRevision":1}')$q$);
reset role;
do $$ begin
 if (select count(*) from compass_private.properties where code in ('1528','BEACH','BHH','CLAY','COL','DMA','XTR','FLATS','FLATS2','FLATS3','FLATS4','GLEN','GOVGATE','HAMBURG','HAA','HPA'))<>16 then raise exception 'Property seed incomplete'; end if;
 if (select postal_code from compass_private.properties where code='HPA')<>'18702' then raise exception 'Address lost'; end if;
end $$;
set local role anon;
select pg_temp.reject('select public.compass_my_workspace()');
rollback;
