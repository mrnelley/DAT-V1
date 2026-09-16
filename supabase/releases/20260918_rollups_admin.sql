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
