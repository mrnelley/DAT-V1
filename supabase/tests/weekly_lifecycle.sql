begin;
insert into auth.users(id,email,email_confirmed_at) values
 ('30000000-0000-4000-8000-000000000001','weekly-admin@example.invalid',now()),
 ('30000000-0000-4000-8000-000000000002','weekly-director@example.invalid',now()),
 ('30000000-0000-4000-8000-000000000003','weekly-staff@example.invalid',now());
insert into compass_private.members(user_id,position_title,roles,departments) values
 ('30000000-0000-4000-8000-000000000001','Weekly Test Admin',array['admin'],array['Finance']),
 ('30000000-0000-4000-8000-000000000002','Weekly Test Director',array['director'],array['Finance']),
 ('30000000-0000-4000-8000-000000000003','Weekly Test Staff',array['staff'],array['Finance']);
update compass_private.weekly_settings set starts_on='2026-01-05';
create function pg_temp.expect_weekly_failure(statement text) returns void language plpgsql as $$
begin begin execute statement; exception when others then return; end;
 raise exception 'Expected rejection: %',statement;
end; $$;
select set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000001',true);
do $$ declare payload jsonb; begin
 if (select deadline_at from compass_private.weekly_boundaries('2026-03-02'))<>'2026-03-06 22:00Z'::timestamptz
 or (select grace_at from compass_private.weekly_boundaries('2026-03-02'))<>'2026-03-09 13:00Z'::timestamptz
 or (select grace_at from compass_private.weekly_boundaries('2026-10-26'))<>'2026-11-02 14:00Z'::timestamptz then raise exception 'DST boundary failure'; end if;
 payload := '{"positionId":"weekly-test-director","week":"2026-09-14","expectedRevision":0,"draft":{"capacity":"enterprise","note":"","entries":[{"title":"Advance College Ave closing","desiredResult":"Confirm the closing dependency list","objectiveId":"2026-Q3-7","due":"2026-09-18","status":"good","tasks":[]}]}}';
 perform compass_private.save_weekly(payload,false,'2026-09-16 14:00Z');
 if exists(select 1 from compass_private.weekly_points where position_id='weekly-test-director') then raise exception 'Draft awarded points'; end if;
 payload := jsonb_set(payload,'{expectedRevision}','1');
 perform compass_private.save_weekly(payload,true,'2026-09-18 21:00Z');
 perform compass_private.save_weekly(payload,true,'2026-09-18 21:00Z');
 if (select points from compass_private.weekly_points where position_id='weekly-test-director' and week='2026-09-14')<>5 then raise exception 'On-time reward failure'; end if;
 -- Change the draft without changing the published snapshot or score.
 payload := jsonb_set(payload,'{expectedRevision}','2');
 payload := jsonb_set(payload,'{draft}', '{"capacity":"capacity","note":"Changed availability","entries":[]}');
 perform compass_private.save_weekly(payload,false,'2026-09-19 12:00Z');
 if (select submitted->>'capacity' from compass_private.weekly_records where position_id='weekly-test-director' and week='2026-09-14')<>'enterprise' then raise exception 'Draft leaked into publication'; end if;
 payload := jsonb_set(payload,'{expectedRevision}','3');
 perform compass_private.save_weekly(payload,true,'2026-09-19 12:00Z');
 if (select points from compass_private.weekly_points where position_id='weekly-test-director' and week='2026-09-14')<>5 then raise exception 'Post-deadline choice changed points'; end if;
 payload := jsonb_set(jsonb_set(payload,'{week}','"2026-09-21"'),'{expectedRevision}','0');
 perform compass_private.save_weekly(payload,true,'2026-09-25 20:59Z');
 if (select points from compass_private.weekly_points where position_id='weekly-test-director' and week='2026-09-21')<>0 then raise exception 'Opt-out is not neutral'; end if;
 payload := jsonb_set(jsonb_set(payload,'{week}','"2026-09-28"'),'{expectedRevision}','0');
 perform compass_private.save_weekly(payload,true,'2026-10-05 13:00Z');
 if (select points from compass_private.weekly_points where position_id='weekly-test-director' and week='2026-09-28')<>-3 then raise exception 'Grace boundary failure'; end if;
 perform compass_private.weekly_maintain('2026-10-06 13:00Z');
 if not exists(select 1 from compass_private.weekly_records where position_id='weekly-test-director' and week='2026-10-05' and expected) then raise exception 'Roster missing'; end if;
 perform compass_private.weekly_maintain('2026-10-12 13:00Z');
 if exists(select 1 from compass_private.weekly_points where position_id='weekly-test-director' and week='2026-10-05') then raise exception 'Missed assessed before grace ends'; end if;
 perform compass_private.weekly_maintain('2026-10-12 13:00:00.001Z');
 perform compass_private.weekly_maintain('2026-10-12 13:01Z');
 if (select points from compass_private.weekly_points where position_id='weekly-test-director' and week='2026-10-05')<>-10 then raise exception 'Missed assessment failure'; end if;
 if (select sum(points) from compass_private.weekly_points where position_id='weekly-test-director')<>-8 then raise exception 'Cumulative score mismatch'; end if;
 if (select count(*) from compass_private.weekly_revisions where position_id='weekly-test-director')<>4 then raise exception 'Retry duplicated a revision'; end if;
 if jsonb_array_length(public.compass_weekly_context('2026-09-14')->'records')<1 then raise exception 'Published context missing'; end if;
end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000003',true);
select pg_temp.expect_weekly_failure('select public.compass_weekly_context()');
select pg_temp.expect_weekly_failure('select compass_private.weekly_maintain()');
select set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000002',true);
select pg_temp.expect_weekly_failure($q$select public.compass_save_weekly('{"positionId":"weekly-test-admin","week":"2026-09-14","expectedRevision":0,"draft":{"capacity":"capacity","note":"","entries":[]}}',true)$q$);
select pg_temp.expect_weekly_failure($q$select public.compass_save_weekly('{"positionId":"weekly-test-director","week":"2026-09-14","expectedRevision":null,"draft":{"capacity":"capacity","note":"","entries":[]}}',true)$q$);
select pg_temp.expect_weekly_failure('select public.compass_set_weekly_assignment(''30000000-0000-4000-8000-000000000002'',''weekly-test-admin'',true)');
reset role;
rollback;
