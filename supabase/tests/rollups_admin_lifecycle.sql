begin;
insert into auth.users(id,email,email_confirmed_at) values
 ('30000000-0000-4000-8000-000000000001','rollup-admin@example.invalid',now()),
 ('30000000-0000-4000-8000-000000000002','rollup-director@example.invalid',now());
insert into compass_private.members(user_id,position_title,roles,departments) values
 ('30000000-0000-4000-8000-000000000001','Rollup test admin',array['admin'],array['Finance']),
 ('30000000-0000-4000-8000-000000000002','Rollup test director',array['director'],array['Finance']);
create function pg_temp.reject(statement text) returns void language plpgsql as $$
begin begin execute statement; exception when others then return; end; raise exception 'Expected rejection: %',statement; end; $$;
set local role anon;
select pg_temp.reject('select public.compass_admin_members()');
select pg_temp.reject('select public.compass_scorecard_data(''2099-09-01'')');
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000001',true);
select public.compass_set_metric_member('{"userId":"30000000-0000-4000-8000-000000000002","positionTitle":"Rollup test director","roles":["director","elt"],"departments":["Finance"],"active":true,"readWeekly":false,"writeWeekly":false}');
select public.compass_set_scorecard_target('{"metricId":"finance-5","year":2099,"operator":"gte","value":100}');
select pg_temp.reject($q$select public.compass_set_scorecard_target('{"metricId":"finance-5","year":2099,"operator":"gte","value":200}')$q$);
select public.compass_save_metric_entry('{"id":"40000000-0000-4000-8000-000000000001","metricId":"finance-5","department":"Finance","period":"2099-09","value":123,"description":"Rollup test"}');
do $$ declare data jsonb; begin
 data:=public.compass_scorecard_data('2099-09-01');
 if not exists(select 1 from jsonb_array_elements(data->'metrics') m where m->>'metricId'='finance-5' and (m->>'value')::numeric=123) then raise exception 'Saved value missing from rollup'; end if;
 if jsonb_array_length(public.compass_scorecard_targets(2099))<>1 then raise exception 'Target missing'; end if;
 if not exists(select 1 from jsonb_array_elements(public.compass_admin_members()->'members') m where m->>'userId'='30000000-0000-4000-8000-000000000002' and m->>'readWeekly'='false') then raise exception 'Override missing'; end if;
end $$;
select set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000002',true);
select pg_temp.reject('select public.compass_admin_members()');
select pg_temp.reject('select public.compass_weekly_context()');
select pg_temp.reject($q$select public.compass_set_scorecard_target('{"metricId":"finance-5","year":2099,"operator":"gte","value":200,"expectedRevision":1}')$q$);
select pg_temp.reject($q$select public.compass_set_metric_member('{"userId":"30000000-0000-4000-8000-000000000002","positionTitle":"Forged admin","roles":["admin"],"departments":[]}')$q$);
reset role;
rollback;
