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
