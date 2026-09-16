-- Transactional: synthetic auth identities and entries never survive this test.
begin;
insert into auth.users(id,email,email_confirmed_at) values
 ('10000000-0000-4000-8000-000000000001','compass-admin-test@example.invalid',now()),
 ('10000000-0000-4000-8000-000000000002','compass-director-test@example.invalid',now()),
 ('10000000-0000-4000-8000-000000000003','compass-staff-test@example.invalid',now());
insert into compass_private.members(user_id,position_title,roles,departments) values
 ('10000000-0000-4000-8000-000000000001','Test Admin',array['admin'],array['Finance','Community Relations']),
 ('10000000-0000-4000-8000-000000000002','Test Director',array['director'],array['Finance']),
 ('10000000-0000-4000-8000-000000000003','Test Staff',array['staff'],array['Finance']);
create function pg_temp.expect_failure(statement text) returns void language plpgsql as $$
begin
 begin execute statement; exception when others then return; end;
 raise exception 'Expected rejection: %',statement;
end; $$;
set local role anon;
select pg_temp.expect_failure('select public.compass_metric_context()');
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
select public.compass_metric_context();
select public.compass_save_metric_entry('{"id":"20000000-0000-4000-8000-000000000001","metricId":"finance-5","department":"Finance","period":"2026-09","value":100,"description":"Lifecycle fixture"}');
-- Retrying the same request must not duplicate or create a revision.
select public.compass_save_metric_entry('{"id":"20000000-0000-4000-8000-000000000001","metricId":"finance-5","department":"Finance","period":"2026-09","value":100,"description":"Lifecycle fixture"}');
select public.compass_save_metric_entry('{"id":"20000000-0000-4000-8000-000000000001","metricId":"finance-5","department":"Finance","period":"2026-09","value":125,"description":"Corrected fixture","expectedRevision":1}');
select pg_temp.expect_failure($q$select public.compass_save_metric_entry('{"id":"20000000-0000-4000-8000-000000000001","metricId":"finance-5","department":"Finance","period":"2026-09","value":999,"description":"Stale correction","expectedRevision":1}')$q$);
select public.compass_save_metric_entry('{"id":"20000000-0000-4000-8000-000000000002","metricId":"community-relations-1","department":"Community Relations","period":"2026-09","value":250,"categoryId":"individual","description":"Gift fixture"}');
select public.compass_save_metric_entry('{"id":"20000000-0000-4000-8000-000000000002","metricId":"community-relations-1","department":"Community Relations","period":"2026-09","value":250,"categoryId":"individual","description":"Gift fixture"}');
select pg_temp.expect_failure('select * from compass_private.metric_entries');
select pg_temp.expect_failure($q$select public.compass_save_metric_entry('{"id":"20000000-0000-4000-8000-000000000003","metricId":"community-relations-1","department":"Community Relations","period":"2026-09","value":250,"description":"Missing category"}')$q$);
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
select pg_temp.expect_failure($q$select public.compass_save_metric_entry('{"id":"20000000-0000-4000-8000-000000000004","metricId":"community-relations-1","department":"Community Relations","period":"2026-09","value":250,"categoryId":"individual","description":"Wrong department"}')$q$);
select pg_temp.expect_failure($q$select public.compass_save_metric_entry('{"id":"20000000-0000-4000-8000-000000000004","metricId":"community-relations-2","department":"Finance","period":"2026-09","value":250,"description":"Forged department"}')$q$);
select pg_temp.expect_failure($q$select public.compass_set_metric_member('{"userId":"10000000-0000-4000-8000-000000000002","positionTitle":"Intruder","roles":["admin"],"departments":[]}')$q$);
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000003',true);
select pg_temp.expect_failure('select public.compass_metric_entries(''Finance'')');
reset role;
update compass_private.members set write_metrics=false where user_id='10000000-0000-4000-8000-000000000002';
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
select pg_temp.expect_failure($q$select public.compass_save_metric_entry('{"id":"20000000-0000-4000-8000-000000000004","metricId":"finance-6","department":"Finance","period":"2026-09","value":250,"description":"Explicitly denied"}')$q$);
reset role;
do $$ begin
 if (select count(*) from compass_private.metric_entries where id::text like '20000000-%')<>2 then raise exception 'Entry count mismatch'; end if;
 if (select count(*) from compass_private.metric_entry_revisions where entry_id::text like '20000000-%')<>3 then raise exception 'Revision count mismatch'; end if;
 if (select value from compass_private.metric_entries where id='20000000-0000-4000-8000-000000000001')<>125 then raise exception 'Correction missing'; end if;
end $$;
rollback;
