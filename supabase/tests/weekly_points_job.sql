-- Synthetic records only. Assertions and all changes roll back.
begin;
insert into auth.users(id,email,email_confirmed_at) values('87000000-0000-4000-8000-000000000001','weekly-evaluator@example.invalid',now());
insert into compass_private.members(user_id,position_title,roles,departments) values('87000000-0000-4000-8000-000000000001','Evaluator test',array['admin'],'{}');
select set_config('request.jwt.claim.sub','87000000-0000-4000-8000-000000000001',true);
do $$
declare cycle date:='2026-10-05'; b record; payload jsonb; saved jsonb; objective text; position_key text; timing timestamptz; expected_points integer; actual integer; scenario integer;
begin
 update compass_private.weekly_evaluation_policy set starts_on=cycle;
 select * into b from compass_private.weekly_boundaries(cycle);
 if b.deadline_at<>'2026-10-02 21:00Z'::timestamptz or b.grace_at<>'2026-10-05 13:00Z'::timestamptz then raise exception 'Eastern cutoff incorrect'; end if;
 if (select grace_at from compass_private.weekly_boundaries('2026-11-02'))<>'2026-11-02 14:00Z'::timestamptz then raise exception 'Winter DST incorrect'; end if;
 if (select deadline_at from compass_private.weekly_boundaries('2026-03-09'))<>'2026-03-06 22:00Z'::timestamptz then raise exception 'Spring DST incorrect'; end if;
 select id into objective from compass_private.enterprise_objectives where active order by id limit 1;
 for scenario in 1..7 loop
  position_key:='test-job-'||scenario;
  insert into compass_private.positions(id,title,roles,required) values(position_key,'Job scenario '||scenario,array['olt'],false);
  insert into compass_private.weekly_records(position_id,week,expected) values(position_key,cycle,true);
  payload:=jsonb_build_object('positionId',position_key,'week',cycle,'expectedRevision',0,'draft',
   jsonb_build_object('capacity','enterprise','note','','entries',jsonb_build_array(jsonb_build_object(
    'id','entry','title','Priority','desiredResult','Result','objectiveId',objective,'due',(cycle+4)::text,'status','good','tasks','[]'::jsonb))));
  if scenario=2 then payload:=jsonb_set(jsonb_set(payload,'{draft,capacity}','"capacity"'),'{draft,entries,0,objectiveId}','""'); end if;
  if scenario=3 then payload:=jsonb_set(jsonb_set(payload,'{draft,capacity}','"capacity"'),'{draft,entries}','[]'); end if;
  timing:=case when scenario=4 then b.deadline_at+interval '1 millisecond' when scenario=5 then b.grace_at+interval '1 millisecond' else b.deadline_at end;
  if scenario<>6 then saved:=compass_private.save_weekly(payload,scenario<>7,timing); end if;
  -- A post-cutoff opt-out cannot erase the on-time enterprise commitment.
  if scenario=1 then
   payload:=jsonb_set(payload,'{expectedRevision}',saved->'revision');
   payload:=jsonb_set(jsonb_set(payload,'{draft,capacity}','"capacity"'),'{draft,entries}','[]');
   perform compass_private.save_weekly(payload,true,b.deadline_at+interval '1 hour');
  end if;
 end loop;
 if exists(select 1 from compass_private.weekly_points where position_id like 'test-job-%') then raise exception 'Entry performed points evaluation'; end if;
 perform compass_private.evaluate_weekly_points(b.grace_at-interval '1 millisecond');
 if exists(select 1 from compass_private.weekly_points where position_id like 'test-job-%') then raise exception 'Job scored before Monday morning'; end if;
 perform compass_private.evaluate_weekly_points(b.grace_at);
 for scenario in 1..7 loop
  expected_points:=case scenario when 1 then 5 when 2 then 3 when 3 then 0 when 4 then -3 else -10 end;
  select points into actual from compass_private.weekly_points where position_id='test-job-'||scenario and week=cycle;
  if actual is distinct from expected_points then raise exception 'Scenario %: expected %, got %',scenario,expected_points,actual; end if;
 end loop;
 if (select submission_revision from compass_private.weekly_points where position_id='test-job-1')<>1 then raise exception 'Wrong cutoff snapshot'; end if;
 perform compass_private.evaluate_weekly_points(b.grace_at+interval '7 days');
 if (select count(*) from compass_private.weekly_points where position_id like 'test-job-%')<>7 then raise exception 'Repeat job duplicated awards'; end if;
 -- Catch-up awards a previously unevaluated cycle; entry remains unrestricted after grace.
 payload:=jsonb_set(jsonb_set(payload,'{positionId}','"test-job-6"'),'{expectedRevision}','0');
 payload:=jsonb_set(payload,'{week}',to_jsonb((cycle+7)::text));
 perform compass_private.save_weekly(payload,true,b.deadline_at+interval '7 days');
 if exists(select 1 from compass_private.weekly_points where position_id='test-job-6' and week=cycle+7) then raise exception 'Catch-up entry scored immediately'; end if;
 perform compass_private.evaluate_weekly_points(b.grace_at+interval '14 days');
 if not exists(select 1 from compass_private.weekly_points where position_id='test-job-6' and week=cycle+7 and points=5) then raise exception 'Catch-up failed'; end if;
 if has_function_privilege('authenticated','compass_private.evaluate_weekly_points(timestamptz)','EXECUTE') then raise exception 'Client can invoke evaluator'; end if;
 if has_function_privilege('authenticated','compass_private.run_weekly_points_job()','EXECUTE') then raise exception 'Client can invoke job'; end if;
 if not exists(select 1 from cron.job where jobname='compass-weekly-points-evaluation' and active and schedule='0 * * * *') then raise exception 'Scheduled job missing'; end if;
 if exists(select 1 from cron.job where jobname='compass-weekly-accountability' and command='select compass_private.weekly_maintain();') then raise exception 'Old job still scheduled'; end if;
 raise notice 'PASS: entry never scores, cutoff snapshots, Monday evaluation, DST, missing/draft/late awards, catch-up, idempotency, job permissions';
end $$;
rollback;
