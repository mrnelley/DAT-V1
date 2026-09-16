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
