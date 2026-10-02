-- Saves record submissions only; the scheduled evaluator awards points.
begin;
create or replace function compass_private.save_weekly(payload jsonb,finalizing boolean,at_time timestamptz)
returns jsonb language plpgsql security definer set search_path='' as $$
declare position_key text := payload->>'positionId'; week_date date := (payload->>'week')::date;
 document jsonb := payload->'draft'; rec compass_private.weekly_records;
 correction text := trim(coalesce(payload->>'correctionReason',''));
begin
 if not compass_private.weekly_access(position_key,true) then raise exception 'You cannot edit this position' using errcode='42501'; end if;
 if not exists(select 1 from compass_private.positions where id=position_key and active) then raise exception 'Inactive position'; end if;
 if not(payload ? 'expectedRevision') then raise exception 'Reload the weekly record before saving'; end if;
 perform compass_private.validate_weekly_document(document,finalizing);
 insert into compass_private.weekly_records(position_id,week) values(position_key,week_date) on conflict do nothing;
 select * into rec from compass_private.weekly_records where position_id=position_key and week=week_date for update;
 if (payload->>'expectedRevision') is null then raise exception 'A numeric revision is required'; end if;
 if rec.revision is distinct from (payload->>'expectedRevision')::integer then
  if rec.updated_by=auth.uid() and rec.draft=document and (not finalizing or rec.submitted=document) then return to_jsonb(rec); end if;
  raise exception 'This record changed; reload it before saving';
 end if;
 if rec.exempt then raise exception 'This position is exempt for this week'; end if;
 update compass_private.weekly_records set draft=document,revision=revision+1,updated_by=auth.uid(),updated_at=at_time,
  submitted=case when finalizing then document else submitted end,
  first_submitted_at=case when finalizing then coalesce(first_submitted_at,at_time) else first_submitted_at end,
  last_submitted_at=case when finalizing then at_time else last_submitted_at end,
  submitted_revision=case when finalizing then revision+1 else submitted_revision end
 where position_id=position_key and week=week_date returning * into rec;
 if finalizing then
  insert into compass_private.weekly_revisions(position_id,week,revision,snapshot,actor_id,recorded_at,correction_reason)
   values(position_key,week_date,rec.revision,document,auth.uid(),at_time,nullif(correction,''));

 end if;
 return to_jsonb(rec);
end; $$;

create or replace function compass_private.weekly_boundaries(week_date date)
returns table(opens_at timestamptz,deadline_at timestamptz,grace_at timestamptz)
language sql immutable set search_path='' as $$
 select week_date::timestamp at time zone 'America/New_York',
 (week_date-3+time '17:00') at time zone 'America/New_York',
 (week_date+time '09:00') at time zone 'America/New_York';
$$;

-- Start the new evaluation policy next Monday; historical awards remain intact.
create table if not exists compass_private.weekly_evaluation_policy(
 singleton boolean primary key default true check(singleton), starts_on date not null);
insert into compass_private.weekly_evaluation_policy(singleton,starts_on)
 values(true,date_trunc('week',now() at time zone 'America/New_York')::date+7)
 on conflict do nothing;
alter table compass_private.weekly_evaluation_policy enable row level security;
revoke all on compass_private.weekly_evaluation_policy from public,anon,authenticated;
alter table compass_private.weekly_points add column if not exists submission_revision integer;
alter table compass_private.weekly_points add column if not exists evaluated_deadline timestamptz;
-- Retain premature legacy awards for audit, then let Monday evaluate those cycles.
create table if not exists compass_private.weekly_points_transition_archive as
 select p.*,clock_timestamp() as archived_at from compass_private.weekly_points p where false;
alter table compass_private.weekly_points_transition_archive enable row level security;
revoke all on compass_private.weekly_points_transition_archive from public,anon,authenticated;
do $$ begin
 if not exists(select 1 from compass_private.releases where version='20261002_weekly_points_job') then
  with deferred as (
   delete from compass_private.weekly_points
   where week>=(select starts_on from compass_private.weekly_evaluation_policy)
   and submission_revision is null returning *)
  insert into compass_private.weekly_points_transition_archive select deferred.*,clock_timestamp() from deferred;
 end if;
end $$;
create index if not exists weekly_revisions_evaluation_idx
 on compass_private.weekly_revisions(position_id,week,recorded_at,revision);

-- Enrollment only. Reading a screen or saving a priority cannot award points.
create or replace function compass_private.weekly_maintain(at_time timestamptz default clock_timestamp()) returns void
language plpgsql security definer set search_path='' as $$
declare current_week date:=date_trunc('week',at_time at time zone 'America/New_York')::date;
begin
 insert into compass_private.weekly_records(position_id,week,expected)
 select p.id,c.week,true from compass_private.positions p
 cross join (values(current_week),(current_week+7)) c(week)
 where p.active and p.required and c.week>=(select starts_on from compass_private.weekly_settings)
 and p.roles && array['executive','elt','olt']
 and exists(select 1 from compass_private.position_assignments a
 join compass_private.members m on m.user_id=a.user_id
 join auth.users u on u.id=m.user_id
 where a.position_id=p.id and m.active and u.email_confirmed_at is not null)
 on conflict(position_id,week) do update set expected=true where not compass_private.weekly_records.expected;
end; $$;

create or replace function compass_private.evaluate_weekly_points(at_time timestamptz default clock_timestamp()) returns integer
language plpgsql security definer set search_path='' as $$
declare rec record; chosen record; award integer; outcome text; evaluated integer:=0;
begin
 perform pg_advisory_xact_lock(hashtextextended('compass-weekly-points-evaluation',0));
 for rec in select r.*,b.deadline_at,b.grace_at
 from compass_private.weekly_records r
 cross join lateral compass_private.weekly_boundaries(r.week) b
 where r.week>=(select starts_on from compass_private.weekly_evaluation_policy)
 and not r.exempt and (r.expected or r.submitted is not null)
 and at_time>=b.grace_at
 and not exists(select 1 from compass_private.weekly_points e where e.position_id=r.position_id and e.week=r.week)
 order by r.week,r.position_id for update of r loop
  -- Score the last submitted version available at Friday's cutoff, never today's draft.
  select v.revision,v.snapshot into chosen from compass_private.weekly_revisions v
   where v.position_id=rec.position_id and v.week=rec.week and v.recorded_at<=rec.deadline_at
   order by v.recorded_at desc,v.revision desc limit 1;
  if found then
   award:=case when chosen.snapshot->>'capacity'='enterprise' then 5
    when jsonb_array_length(chosen.snapshot->'entries')>0 then 3 else 0 end;
   outcome:=case when award=5 then 'on_time_priority' when award=3 then 'on_time_departmental' else 'on_time_opt_out' end;
  elsif exists(select 1 from compass_private.weekly_revisions v
   where v.position_id=rec.position_id and v.week=rec.week and v.recorded_at<=rec.grace_at) then
   award:=-3;outcome:='late_submission';
  else award:=-10;outcome:='missed_submission'; end if;
  insert into compass_private.weekly_points(position_id,week,points,outcome,recorded_at,submission_revision,evaluated_deadline)
   values(rec.position_id,rec.week,award,outcome,at_time,chosen.revision,rec.deadline_at)
   on conflict do nothing;
  if found then evaluated:=evaluated+1; end if;
 end loop;
 return evaluated;
end; $$;

create or replace function compass_private.run_weekly_points_job() returns integer
language plpgsql security definer set search_path='' as $$
begin
 perform compass_private.weekly_maintain();
 return compass_private.evaluate_weekly_points();
end; $$;
revoke all on function compass_private.evaluate_weekly_points(timestamptz),compass_private.run_weekly_points_job() from public,anon,authenticated;

-- Hourly eligibility checks yield Monday 09:00 America/New_York in either DST season,
-- and catch up unevaluated cycles after outages. Scoring only occurs after grace_at.
do $$ declare job record; begin
 for job in select jobid from cron.job where jobname='compass-weekly-accountability'
 and command='select compass_private.weekly_maintain();' loop
  perform cron.unschedule(job.jobid);
 end loop;
end $$;
select cron.schedule('compass-weekly-points-evaluation','0 * * * *','select compass_private.run_weekly_points_job();');
insert into compass_private.releases(version) values('20261002_weekly_points_job') on conflict do nothing;
notify pgrst,'reload schema';
commit;
