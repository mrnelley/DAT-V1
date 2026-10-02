-- Synthetic identities and records only; every change rolls back.
begin;
insert into auth.users(id,email,email_confirmed_at) values
 ('86000000-0000-4000-8000-000000000001','weekly-any-week@example.invalid',now());
insert into compass_private.positions(id,title,roles,required) values
 ('test-any-week','Any week test position',array['olt'],false),
 ('test-any-week-other','Other test position',array['olt'],false);
insert into compass_private.members(user_id,position_title,roles,departments,primary_position_id) values
 ('86000000-0000-4000-8000-000000000001','Any week test',array[]::text[],'{}','test-any-week');
insert into compass_private.position_assignments(user_id,position_id) values
 ('86000000-0000-4000-8000-000000000001','test-any-week');
select set_config('request.jwt.claim.sub','86000000-0000-4000-8000-000000000001',true);
select set_config('request.headers','{"x-compass-position":"test-any-week"}',true);
do $$
declare cycle date; cycles date[]; payload jsonb; saved jsonb; objective text; denied boolean;
begin
 select array[date_trunc('week',now() at time zone 'America/New_York')::date+28,
   date_trunc('week',now() at time zone 'America/New_York')::date-14,starts_on-7]
 into cycles from compass_private.weekly_settings;
 select id into objective from compass_private.enterprise_objectives where active order by id limit 1;
 if objective is null then raise exception 'Test requires an active enterprise objective'; end if;
 foreach cycle in array cycles loop
  payload:=jsonb_build_object('positionId','test-any-week','week',cycle,'expectedRevision',0,
   'draft',jsonb_build_object('capacity','enterprise','note','','entries',jsonb_build_array(
    jsonb_build_object('id','any-week-priority','title','Any-week priority','desiredResult','Persisted commitment',
     'objectiveId',objective,'due',(cycle+4)::text,'status','good','tasks','[]'::jsonb))));
  saved:=public.compass_save_weekly(payload,true);
  if saved->'submitted' is distinct from payload->'draft' then raise exception 'Submission did not persist for %',cycle; end if;
  payload:=jsonb_set(payload,'{expectedRevision}',saved->'revision');
  payload:=jsonb_set(payload,'{draft,note}','"Outcome updated"');
  saved:=public.compass_save_weekly(payload,true);
  if saved->'submitted'->>'note'<>'Outcome updated' then raise exception 'Outcome edit failed for %',cycle; end if;
  if exists(select 1 from compass_private.weekly_points where position_id='test-any-week' and week=cycle) then raise exception 'Entry evaluated points'; end if;
  denied:=false;
  begin perform compass_private.save_weekly(jsonb_set(payload,'{draft,note}','"Stale edit"'),true,now());
  exception when others then if sqlerrm like '%record changed%' then denied:=true; else raise; end if; end;
  if not denied then raise exception 'Stale edit was accepted'; end if;
 end loop;
 denied:=false;
 begin perform compass_private.save_weekly(jsonb_set(payload,'{positionId}','"test-any-week-other"'),true,now());
 exception when insufficient_privilege then denied:=true; end;
 if not denied then raise exception 'Cross-position edit was accepted'; end if;
 raise notice 'PASS: future, past, pre-tracking submissions and edits; no entry scoring, revisions, ownership';
end $$;
rollback;
