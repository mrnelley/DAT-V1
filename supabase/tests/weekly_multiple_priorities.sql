-- Isolated, rolled-back records: no existing weekly submissions or points change.
begin;
insert into auth.users(id,email,email_confirmed_at) values('85000000-0000-4000-8000-000000000001','multi-priority-test@example.invalid',now());
insert into compass_private.members(user_id,position_title,roles,departments) values('85000000-0000-4000-8000-000000000001','Multi priority test',array['admin'],'{}');
insert into compass_private.positions(id,title,roles,required) values('test-multiple-priorities','Multiple priority test position',array['olt'],false);
select set_config('request.jwt.claim.sub','85000000-0000-4000-8000-000000000001',true);
do $$ declare cycle date; boundary record; item jsonb; entries jsonb; payload jsonb; saved jsonb; rejected boolean:=false; begin
 select date_trunc('week',greatest(current_date,starts_on))::date+7 into cycle from compass_private.weekly_settings;
 select * into boundary from compass_private.weekly_boundaries(cycle);
 item:=jsonb_build_object('id','test-priority','title','Weekly priority','desiredResult','Documented result','objectiveId','2026-Q3-7','due',(cycle+4)::text,'status','good','tasks','[]'::jsonb);
 select jsonb_agg(item||jsonb_build_object('id','priority-'||n,'title','Priority '||n)) into entries from generate_series(1,3) n;
 payload:=jsonb_build_object('positionId','test-multiple-priorities','week',cycle,'expectedRevision',0,'draft',jsonb_build_object('capacity','enterprise','note','','entries',entries));
 saved:=compass_private.save_weekly(payload,false,boundary.deadline_at-interval '1 hour');
 payload:=jsonb_set(payload,'{expectedRevision}',saved->'revision');
 perform compass_private.save_weekly(payload,true,boundary.deadline_at);
 if (select jsonb_array_length(submitted->'entries') from compass_private.weekly_records where position_id='test-multiple-priorities' and week=cycle)<>3 then raise exception 'Multiple priorities did not persist'; end if;
 if (select count(*) from compass_private.weekly_points where position_id='test-multiple-priorities')<>1
 or (select points from compass_private.weekly_points where position_id='test-multiple-priorities' and week=cycle)<>5 then raise exception 'Priorities multiplied the weekly award'; end if;
 select jsonb_agg(item||jsonb_build_object('id','priority-'||n)) into entries from generate_series(1,12) n;
 perform compass_private.validate_weekly_document(jsonb_set(payload->'draft','{entries}',entries),true);
 begin perform compass_private.validate_weekly_document(jsonb_set(payload->'draft','{entries}',entries||jsonb_build_array(item)),true); exception when others then rejected:=true; end;
 if not rejected then raise exception 'Thirteenth priority was accepted'; end if;
end $$;
rollback;
