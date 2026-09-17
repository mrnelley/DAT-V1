begin;
insert into auth.users(id,email,email_confirmed_at) values
 ('81000000-0000-4000-8000-000000000001','positions-admin@example.invalid',now()),
 ('81000000-0000-4000-8000-000000000002','positions-first@example.invalid',now()),
 ('81000000-0000-4000-8000-000000000003','positions-second@example.invalid',now());
insert into compass_private.members(user_id,position_title,roles,departments) values
 ('81000000-0000-4000-8000-000000000001','Position test Admin',array['admin'],'{}');
create function pg_temp.reject(statement text) returns void language plpgsql as $$
begin begin execute statement; exception when others then return; end; raise exception 'Expected rejection: %',statement; end; $$;
select set_config('test.auth_count',(select count(*)::text from auth.users),true);
set local role authenticated;
select set_config('request.jwt.claim.sub','81000000-0000-4000-8000-000000000001',true);
select public.compass_admin_save_position('{"id":"test-position-finance","title":"Position test Finance","department":"Finance","roles":["director"],"features":{"annual":false}}');
select public.compass_admin_save_position('{"id":"test-position-secondary","title":"Position test Secondary","department":"Finance","roles":["staff"]}');
select public.compass_admin_save_position('{"id":"test-position-vacant","title":"Position test Vacant","department":"Finance","roles":["director"]}');
select pg_temp.reject($q$select public.compass_admin_save_position('{"id":"test-position-finance","title":"Stale rename","roles":["director"]}')$q$);
reset role;
do $$ begin if (select count(*) from auth.users)<>current_setting('test.auth_count')::integer then raise exception 'Position creation created an Auth user'; end if; end $$;
set local role authenticated;
select public.compass_set_metric_member('{"userId":"81000000-0000-4000-8000-000000000002","roles":[],"positions":["test-position-finance","test-position-secondary"],"primaryPositionId":"test-position-finance"}');
select public.compass_set_metric_member('{"userId":"81000000-0000-4000-8000-000000000003","roles":[],"positions":["test-position-finance"]}');
select set_config('test.metric_revision',(select (m->>'governance_revision') from jsonb_array_elements(public.compass_admin_positions()->'metrics') m where m->>'id'='finance-1'),true);
select public.compass_admin_set_metric_positions(jsonb_build_object('metricId','finance-1','department','Finance','expectedRevision',current_setting('test.metric_revision')::integer,
 'positions','[{"positionId":"test-position-finance","canWrite":true},{"positionId":"test-position-secondary","canWrite":true}]'::jsonb));
select set_config('request.jwt.claim.sub','81000000-0000-4000-8000-000000000002',true);
select set_config('request.headers','{"x-compass-position":"test-position-finance"}',true);
do $$ declare c jsonb:=public.compass_access_context(); begin
 if c->>'positionId'<>'test-position-finance' or c->'features'->>'annual'<>'false' or c->>'weekly'<>'true' then raise exception 'Position experience not applied'; end if;
 if jsonb_array_length(c->'positions')<>2 then raise exception 'Multiple assignments missing'; end if;
end $$;
select pg_temp.reject($q$select public.compass_save_metric_entry('{"id":"82000000-0000-4000-8000-000000000001","metricId":"finance-2","department":"Finance","period":"2026-09","value":1,"description":"Not assigned"}')$q$);
-- Finance-1 might already have a live September record; use a separate test period.
select public.compass_save_metric_entry('{"id":"82000000-0000-4000-8000-000000000001","metricId":"finance-1","department":"Finance","period":"2099-01","value":10,"description":"Position test"}');
select set_config('request.headers','{"x-compass-position":"test-position-secondary"}',true);
do $$ declare c jsonb:=public.compass_access_context(); begin
 if c->>'scorecards'<>'false' or c->>'metrics'<>'true' or c->>'weekly'<>'false' then raise exception 'Secondary position scope wrong'; end if;
 if jsonb_array_length(public.compass_metric_context()->'metricDefinitions')<>1 then raise exception 'Unassigned metric definitions leaked'; end if;
end $$;
select pg_temp.reject('select public.compass_scorecard_data(''2026-09-01'')');
select set_config('request.headers','{"x-compass-position":"test-position-vacant"}',true);
select pg_temp.reject('select public.compass_access_context()');
select set_config('request.headers','{}',true);
select set_config('request.jwt.claim.sub','81000000-0000-4000-8000-000000000003',true);
select public.compass_save_metric_entry('{"id":"82000000-0000-4000-8000-000000000001","metricId":"finance-1","department":"Finance","period":"2099-01","value":11,"description":"Shared edit","expectedRevision":1}');
select pg_temp.reject($q$select public.compass_save_metric_entry('{"id":"82000000-0000-4000-8000-000000000001","metricId":"finance-1","department":"Finance","period":"2099-01","value":12,"description":"Stale overwrite","expectedRevision":1}')$q$);
select pg_temp.reject('select public.compass_admin_positions()');
select pg_temp.reject($q$select public.compass_admin_save_position('{"title":"Forbidden","roles":["director"]}')$q$);
select set_config('request.jwt.claim.sub','81000000-0000-4000-8000-000000000001',true);
select public.compass_admin_save_position('{"id":"test-position-finance","title":"Position test Finance renamed","department":"Finance","roles":["director"],"expectedRevision":1}');
select public.compass_set_metric_member('{"userId":"81000000-0000-4000-8000-000000000002","roles":[],"positions":["test-position-secondary"]}');
select set_config('request.jwt.claim.sub','81000000-0000-4000-8000-000000000002',true);
select set_config('request.headers','{"x-compass-position":"test-position-finance"}',true);
select pg_temp.reject('select public.compass_access_context()');
select set_config('request.headers','{}',true);
do $$ begin if public.compass_access_context()->>'positionId'<>'test-position-secondary' then raise exception 'Handoff removed unrelated assignment'; end if; end $$;
select set_config('request.jwt.claim.sub','81000000-0000-4000-8000-000000000003',true);
do $$ begin if public.compass_access_context()->>'positionTitle'<>'Position test Finance renamed' then raise exception 'Renaming lost shared position'; end if; end $$;
reset role;
select compass_private.weekly_maintain();
do $$ begin
 if exists(select 1 from compass_private.weekly_records where position_id='test-position-vacant') then raise exception 'Vacant position acquired obligations'; end if;
 if not exists(select 1 from compass_private.metric_entries where id='82000000-0000-4000-8000-000000000001' and updated_by='81000000-0000-4000-8000-000000000003' and revision=2) then raise exception 'Shared edit attribution missing'; end if;
 if (select count(*) from compass_private.positions where id like 'test-position-%')<>3 then raise exception 'Title change created duplicate position'; end if;
end $$;
rollback;
