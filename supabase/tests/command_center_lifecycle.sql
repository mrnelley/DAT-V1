begin;
insert into auth.users(id,email,email_confirmed_at) values
 ('50000000-0000-4000-8000-000000000001','command-admin@example.invalid',now()),
 ('50000000-0000-4000-8000-000000000002','command-director@example.invalid',now()),
 ('50000000-0000-4000-8000-000000000003','command-unconfirmed@example.invalid',null);
insert into compass_private.members(user_id,position_title,roles,departments) values
 ('50000000-0000-4000-8000-000000000001','Command test admin',array['admin'],array['Finance']),
 ('50000000-0000-4000-8000-000000000002','Command test director',array['director'],array['Finance']);
create function pg_temp.reject(statement text) returns void language plpgsql as $$ begin begin execute statement; exception when others then return; end;raise exception 'Expected rejection: %',statement;end;$$;
set local role authenticated;
select set_config('request.jwt.claim.sub','50000000-0000-4000-8000-000000000001',true);
select public.compass_set_metric_member('{"userId":"50000000-0000-4000-8000-000000000003","positionTitle":"Command unconfirmed director","roles":["director"],"departments":["Finance"],"active":true}');
select public.compass_admin_save_team('{"id":"60000000-0000-4000-8000-000000000001","name":"Command test team","members":["50000000-0000-4000-8000-000000000002"]}');
select pg_temp.reject($q$select public.compass_admin_save_team('{"id":"60000000-0000-4000-8000-000000000001","name":"Stale edit","members":[]}')$q$);
select public.compass_admin_save_property('{"id":"60000000-0000-4000-8000-000000000002","name":"Command test property","units":10,"managerId":"50000000-0000-4000-8000-000000000002"}');
select public.compass_admin_set_feature('50000000-0000-4000-8000-000000000002','annual',false);
do $$ declare data jsonb; begin
 data:=public.compass_admin_workspace();
 if not exists(select 1 from jsonb_array_elements(data->'teams') t where t->>'name'='Command test team' and jsonb_array_length(t->'members')=1) then raise exception 'Team membership missing'; end if;
 if not exists(select 1 from jsonb_array_elements(data->'properties') p where p->>'manager_id'='50000000-0000-4000-8000-000000000002') then raise exception 'Property assignment missing'; end if;
 if not exists(select 1 from jsonb_array_elements(public.compass_admin_members()->'members') m where m->>'userId'='50000000-0000-4000-8000-000000000003' and m->>'confirmed'='false') then raise exception 'Unconfirmed roster missing'; end if;
end $$;
select public.compass_admin_records('metrics');
select public.compass_admin_records('weekly');
select public.compass_admin_records('actions');
select set_config('request.jwt.claim.sub','50000000-0000-4000-8000-000000000002',true);
do $$ begin if public.compass_access_context()->'features'->>'annual'<>'false' then raise exception 'Feature override missing'; end if;end $$;
select pg_temp.reject('select public.compass_admin_workspace()');
select pg_temp.reject('select public.compass_admin_records(''metrics'')');
select pg_temp.reject($q$select public.compass_admin_set_feature('50000000-0000-4000-8000-000000000001','annual',false)$q$);
select pg_temp.reject($q$select public.compass_admin_save_team('{"name":"Forbidden","members":[]}')$q$);
select pg_temp.reject($q$select public.compass_admin_save_property('{"name":"Forbidden"}')$q$);
select pg_temp.reject('select public.compass_admin_user_lookup(''command-admin@example.invalid'')');
select set_config('request.jwt.claim.sub','50000000-0000-4000-8000-000000000001',true);
select public.compass_admin_set_feature('50000000-0000-4000-8000-000000000002','*',null);
reset role;
select compass_private.weekly_maintain();
do $$ begin
 if exists(select 1 from compass_private.weekly_records w join compass_private.positions p on p.id=w.position_id where p.title='Command unconfirmed director' and expected) then raise exception 'Unconfirmed account acquired submission requirement'; end if;
 if exists(select 1 from compass_private.member_features where user_id='50000000-0000-4000-8000-000000000002') then raise exception 'Reset did not remove overrides'; end if;
end $$;
rollback;
