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
