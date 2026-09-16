-- Depends on the deployed metric-entry release, not the legacy public schema.
begin;
alter table compass_private.members add column if not exists read_weekly boolean;
alter table compass_private.members add column if not exists write_weekly boolean;
create table if not exists compass_private.positions (
 id text primary key, title text not null unique, department text references compass_private.departments(name),
 required boolean not null default false, active boolean not null default true
);
create table if not exists compass_private.position_assignments (
 user_id uuid not null references compass_private.members(user_id),
 position_id text not null references compass_private.positions(id),
 primary key(user_id,position_id)
);
create table if not exists compass_private.enterprise_objectives (
 id text primary key, title text not null, pillar_id text not null, area text not null,
 period text not null, active boolean not null default true
);
create table if not exists compass_private.weekly_records (
 position_id text not null references compass_private.positions(id), week date not null check(extract(isodow from week)=1),
 expected boolean not null default false, exempt boolean not null default false, exemption_reason text,
 draft jsonb not null default '{"capacity":"","note":"","entries":[]}',
 submitted jsonb, first_submitted_at timestamptz, last_submitted_at timestamptz,
 revision integer not null default 0, submitted_revision integer not null default 0,
 updated_by uuid references auth.users(id), updated_at timestamptz not null default now(),
 primary key(position_id,week)
);
create table if not exists compass_private.weekly_revisions (
 position_id text not null, week date not null, revision integer not null, snapshot jsonb not null,
 actor_id uuid not null references auth.users(id), recorded_at timestamptz not null,
 correction_reason text, primary key(position_id,week,revision),
 foreign key(position_id,week) references compass_private.weekly_records(position_id,week)
);
create table if not exists compass_private.weekly_points (
 position_id text not null, week date not null, points integer not null check(points in (5,0,-3,-10)),
 outcome text not null check(outcome in ('on_time_priority','on_time_opt_out','late_submission','missed_submission')),
 recorded_at timestamptz not null default now(), primary key(position_id,week),
 foreign key(position_id,week) references compass_private.weekly_records(position_id,week)
);
create table if not exists compass_private.weekly_audit (
 id bigint generated always as identity primary key, position_id text not null, week date,
 actor_id uuid references auth.users(id), action text not null, details jsonb not null,
 recorded_at timestamptz not null default now()
);
create table if not exists compass_private.weekly_settings (
 singleton boolean primary key default true check(singleton),
 starts_on date not null default (date_trunc('week',now() at time zone 'America/New_York'))::date,
 initial_points integer not null default 100 check(initial_points=100)
);
insert into compass_private.weekly_settings(singleton) values(true) on conflict do nothing;
create or replace function compass_private.weekly_boundaries(week_date date)
returns table(opens_at timestamptz,deadline_at timestamptz,grace_at timestamptz)
language sql immutable set search_path='' as $$
 select week_date::timestamp at time zone 'America/New_York',
 (week_date+4+time '17:00') at time zone 'America/New_York',
 (week_date+7+time '09:00') at time zone 'America/New_York';
$$;
create or replace function compass_private.weekly_access(target_position text, writing boolean default false)
returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from compass_private.members m where m.user_id=auth.uid() and m.active
  and case when writing then coalesce(m.write_weekly,m.roles && array['admin','executive','elt','director'])
       else coalesce(m.read_weekly,m.roles && array['admin','executive','elt','director']) end
  and (not writing or 'admin'=any(m.roles) or exists(select 1 from compass_private.position_assignments a
    join compass_private.positions p on p.id=a.position_id and p.active
    where a.user_id=m.user_id and a.position_id=target_position)));
$$;
create or replace function compass_private.weekly_draft_access(target_position text)
returns boolean language sql stable security definer set search_path='' as $$
 select compass_private.weekly_access(target_position,false) and exists(select 1 from compass_private.members m
 where m.user_id=auth.uid() and (m.roles && array['admin','executive','elt'] or
 exists(select 1 from compass_private.position_assignments a where a.user_id=m.user_id and a.position_id=target_position)));
$$;
create or replace function compass_private.sync_weekly_position() returns trigger
language plpgsql security definer set search_path='' as $$
declare position_key text := lower(regexp_replace(trim(new.position_title),'[^a-zA-Z0-9]+','-','g'));
begin
 insert into compass_private.positions(id,title,department,required)
 values(position_key,new.position_title,new.departments[1],new.roles && array['executive','elt','director'])
 on conflict(title) do nothing;
 select id into position_key from compass_private.positions where title=new.position_title;
 insert into compass_private.position_assignments(user_id,position_id) values(new.user_id,position_key) on conflict do nothing;
 update compass_private.positions p set required=exists(select 1 from compass_private.position_assignments a
 join compass_private.members m on m.user_id=a.user_id where a.position_id=p.id and m.roles && array['executive','elt','director']) where p.id=position_key;
 if tg_op='UPDATE' and old.position_title<>new.position_title then
  delete from compass_private.position_assignments a using compass_private.positions p
  where a.position_id=p.id and a.user_id=new.user_id and p.title=old.position_title;
 end if;
 return new;
end; $$;
drop trigger if exists sync_weekly_position on compass_private.members;
create trigger sync_weekly_position after insert or update of position_title,roles on compass_private.members
for each row execute function compass_private.sync_weekly_position();
-- Bootstrap only existing memberships; a vacant position does not acquire missed-week penalties.
insert into compass_private.positions(id,title,department,required)
select lower(regexp_replace(trim(position_title),'[^a-zA-Z0-9]+','-','g')),position_title,min(departments[1]),
 bool_or(roles && array['executive','elt','director']) from compass_private.members group by position_title on conflict do nothing;
insert into compass_private.position_assignments(user_id,position_id)
select m.user_id,p.id from compass_private.members m join compass_private.positions p on p.title=m.position_title on conflict do nothing;

create or replace function compass_private.weekly_maintain(at_time timestamptz default clock_timestamp()) returns void
language plpgsql security definer set search_path='' as $$
declare current_week date := date_trunc('week',at_time at time zone 'America/New_York')::date; rec record;
begin
 -- No retrospective roster inference: materialize this cycle only, at enrollment/job time.
 if current_week >= (select starts_on from compass_private.weekly_settings) then
 insert into compass_private.weekly_records(position_id,week,expected)
 select p.id,current_week,true from compass_private.positions p where p.active and p.required
 and exists(select 1 from compass_private.position_assignments a join compass_private.members m on m.user_id=a.user_id
  where a.position_id=p.id and m.active and m.roles && array['executive','elt','director'])
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

create or replace function compass_private.validate_weekly_document(document jsonb,finalizing boolean)
returns void language plpgsql security definer set search_path='' as $$
declare entry jsonb; task jsonb; enterprise_count integer := 0;
begin
 if jsonb_typeof(document) is distinct from 'object' or jsonb_typeof(document->'entries') is distinct from 'array'
 or jsonb_array_length(document->'entries')>12 or length(document::text)>100000 then raise exception 'Invalid weekly record'; end if;
 if length(coalesce(document->>'note',''))>2000 then raise exception 'Weekly context is too long'; end if;
 if not finalizing then return; end if;
 if coalesce(document->>'capacity','') not in ('enterprise','capacity') then raise exception 'Choose your enterprise capacity'; end if;
 for entry in select value from jsonb_array_elements(document->'entries') loop
  if length(trim(coalesce(entry->>'title',''))) not between 1 and 250
    or length(trim(coalesce(entry->>'desiredResult',''))) not between 1 and 2000 then raise exception 'Each priority needs a title and desired result'; end if;
  if coalesce(entry->>'due','') !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'A priority due date is required'; end if;
  perform (entry->>'due')::date;
  if coalesce(entry->>'status','') not in ('good','watch','risk') then raise exception 'Invalid priority status'; end if;
  if coalesce(entry->>'objectiveId','')<>'' then
   if not exists(select 1 from compass_private.enterprise_objectives where id=entry->>'objectiveId' and active) then raise exception 'Unknown enterprise objective'; end if;
   enterprise_count := enterprise_count+1;
  end if;
  if jsonb_typeof(entry->'tasks') is distinct from 'array' or jsonb_array_length(entry->'tasks')>30 then raise exception 'Invalid action items'; end if;
  for task in select value from jsonb_array_elements(entry->'tasks') loop
   if length(trim(coalesce(task->>'title',''))) not between 1 and 250
    or coalesce(task->>'status','') not in ('open','in_progress','complete','blocked','cancelled')
    or not exists(select 1 from compass_private.positions where id=task->>'owner' and active) then raise exception 'Action items need a title, responsible position and status'; end if;
   if coalesce(task->>'due','') !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'An action item due date is required'; end if;
   perform (task->>'due')::date;
  end loop;
 end loop;
 if document->>'capacity'='enterprise' and enterprise_count=0 then raise exception 'Link a priority to an enterprise objective or choose the capacity option'; end if;
 if document->>'capacity'='capacity' and enterprise_count>0 then raise exception 'Remove enterprise links before submitting an opt-out'; end if;
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
  if not exists(select 1 from compass_private.members where user_id=auth.uid() and active and roles && array['admin','director'])
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
create or replace function public.compass_save_weekly(payload jsonb,finalizing boolean default false) returns jsonb
language sql security definer set search_path='' as $$
 select compass_private.save_weekly(payload,finalizing,clock_timestamp());
$$;

create or replace function compass_private.weekly_score_access(target_position text) returns boolean
language sql stable security definer set search_path='' as $$
 select compass_private.weekly_access(target_position,false) and exists(select 1 from compass_private.members m
 where m.user_id=auth.uid() and (m.roles && array['admin','executive'] or exists(
 select 1 from compass_private.position_assignments a where a.user_id=m.user_id and a.position_id=target_position)));
$$;
create or replace function public.compass_weekly_context(week_date date default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare selected_week date:=coalesce(week_date,date_trunc('week',now() at time zone 'America/New_York')::date);
begin
 if not compass_private.weekly_access('',false) then raise exception 'Weekly access required' using errcode='42501'; end if;
 if extract(isodow from selected_week)<>1 then raise exception 'Select a Monday'; end if;
 perform compass_private.weekly_maintain();
 return jsonb_build_object('week',selected_week,'startsOn',(select starts_on from compass_private.weekly_settings),
  'boundaries',(select to_jsonb(b) from compass_private.weekly_boundaries(selected_week) b),
  'positionTitle',(select position_title from compass_private.members where user_id=auth.uid()),
  'positions',(select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'title',p.title,'department',p.department,
    'canEdit',compass_private.weekly_access(p.id,true),'required',p.required,
    'points',case when compass_private.weekly_score_access(p.id) then 100+coalesce((select sum(points) from compass_private.weekly_points where position_id=p.id),0) else null end)), '[]')
    from compass_private.positions p where p.active),
  'objectives',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'title',title,'area',area,'period',period)),'[]') from compass_private.enterprise_objectives where active),
  'records',(select coalesce(jsonb_agg(jsonb_build_object('positionId',r.position_id,'week',r.week,'expected',r.expected,'exempt',r.exempt,
    'draft',case when compass_private.weekly_draft_access(r.position_id) then r.draft else null end,
    'submitted',r.submitted,'revision',r.revision,'submittedRevision',r.submitted_revision,'firstAt',r.first_submitted_at,'lastAt',r.last_submitted_at)), '[]')
    from compass_private.weekly_records r where r.week=selected_week),
  'events',(select coalesce(jsonb_agg(jsonb_build_object('positionId',position_id,'week',week,'points',points,'outcome',outcome)),'[]')
    from compass_private.weekly_points where extract(year from week)=extract(year from selected_week) and compass_private.weekly_score_access(position_id)));
end; $$;

create or replace function public.compass_set_weekly_assignment(target_user uuid,target_position text,assigned boolean) returns void
language plpgsql security definer set search_path='' as $$
begin
 if not compass_private.is_admin() then raise exception 'Admin required' using errcode='42501'; end if;
 if assigned then insert into compass_private.position_assignments values(target_user,target_position) on conflict do nothing;
 else delete from compass_private.position_assignments where user_id=target_user and position_id=target_position; end if;
 insert into compass_private.weekly_audit(position_id,actor_id,action,details) values(target_position,auth.uid(),'assignment',jsonb_build_object('userId',target_user,'assigned',assigned));
end; $$;
create or replace function public.compass_exempt_weekly(target_position text,week_date date,reason text) returns void
language plpgsql security definer set search_path='' as $$
begin
 if not compass_private.is_admin() then raise exception 'Admin required' using errcode='42501'; end if;
 if length(trim(coalesce(reason,'')))<3 then raise exception 'Exemption reason required'; end if;
 perform 1 from compass_private.weekly_records where position_id=target_position and week=week_date for update;
 if not found then raise exception 'No weekly obligation found'; end if;
 if exists(select 1 from compass_private.weekly_points where position_id=target_position and week=week_date) then raise exception 'Scored weeks require a separate audited correction'; end if;
 update compass_private.weekly_records set exempt=true,exemption_reason=reason where position_id=target_position and week=week_date;
 insert into compass_private.weekly_audit(position_id,week,actor_id,action,details) values(target_position,week_date,auth.uid(),'exemption',jsonb_build_object('reason',reason));
end; $$;

do $$ declare t text; begin
 foreach t in array array['positions','position_assignments','enterprise_objectives','weekly_records','weekly_revisions','weekly_points','weekly_audit','weekly_settings'] loop
  execute format('alter table compass_private.%I enable row level security',t);
 end loop;
end $$;
revoke all on all tables in schema compass_private from public,anon,authenticated;
revoke all on all sequences in schema compass_private from public,anon,authenticated;
revoke all on all functions in schema compass_private from public,anon,authenticated;
revoke all on function public.compass_save_weekly(jsonb,boolean),public.compass_weekly_context(date),
 public.compass_set_weekly_assignment(uuid,text,boolean),public.compass_exempt_weekly(text,date,text) from public,anon;
grant execute on function public.compass_save_weekly(jsonb,boolean),public.compass_weekly_context(date),
 public.compass_set_weekly_assignment(uuid,text,boolean),public.compass_exempt_weekly(text,date,text) to authenticated;
insert into compass_private.releases(version) values('20260917_weekly_accountability') on conflict do nothing;
notify pgrst,'reload schema';
commit;
