begin;
insert into auth.users(id,email,email_confirmed_at) values
 ('71000000-0000-4000-8000-000000000001','view-admin@example.invalid',now()),
 ('71000000-0000-4000-8000-000000000002','view-director@example.invalid',now()),
 ('71000000-0000-4000-8000-000000000003','view-staff@example.invalid',now());
insert into compass_private.members(user_id,position_title,roles,departments) values
 ('71000000-0000-4000-8000-000000000001','Workspace test Admin',array['admin'],array['Finance']),
 ('71000000-0000-4000-8000-000000000002','Workspace test Director',array['director'],array['Finance']),
 ('71000000-0000-4000-8000-000000000003','Workspace test Staff',array['staff'],array['Finance']);
create function pg_temp.reject(statement text) returns void language plpgsql as $$
begin begin execute statement; exception when others then return; end; raise exception 'Expected rejection: %',statement; end; $$;
set local role authenticated;
select set_config('request.jwt.claim.sub','71000000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"71000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
select set_config('test.read_session',public.compass_admin_start_workspace('71000000-0000-4000-8000-000000000002',false)->>'id',true);
select pg_temp.reject(format('select public.compass_admin_workspace_call(%L,''compass_save_metric_entry'',''{}'')',current_setting('test.read_session')));
select pg_temp.reject(format('select public.compass_admin_workspace_call(%L,''compass_admin_members'',''{}'')',current_setting('test.read_session')));
select set_config('test.write_session',public.compass_admin_start_workspace('71000000-0000-4000-8000-000000000002',true)->>'id',true);
select public.compass_admin_workspace_call(current_setting('test.write_session')::uuid,'compass_save_metric_entry',
 '{"payload":{"id":"72000000-0000-4000-8000-000000000001","metricId":"finance-1","department":"Finance","period":"2026-09","value":150,"description":"Workspace verification"}}');
select pg_temp.reject(format('select public.compass_admin_workspace_call(%L,''compass_save_metric_entry'',%L)',current_setting('test.write_session'),
 '{"payload":{"id":"72000000-0000-4000-8000-000000000002","metricId":"property-management-1","department":"Property Management","period":"2026-09","value":150,"description":"Forbidden"}}'));
do $$ declare ctx jsonb; begin
 ctx:=public.compass_admin_workspace_call(current_setting('test.write_session')::uuid,'compass_access_context','{}');
 if ctx->>'positionTitle'<>'Workspace test Director' or ctx->>'admin'<>'false' then raise exception 'Target scope not applied'; end if;
 if auth.uid()<>'71000000-0000-4000-8000-000000000001'::uuid then raise exception 'Actor identity leaked after delegated call'; end if;
 if (current_setting('request.jwt.claims')::jsonb->>'sub')<>'71000000-0000-4000-8000-000000000001' then raise exception 'Claims not restored'; end if;
 if not (public.compass_access_context()->>'admin')::boolean then raise exception 'Admin session was lost'; end if;
end $$;
select public.compass_admin_end_workspace(current_setting('test.read_session')::uuid);
select pg_temp.reject(format('select public.compass_admin_workspace_call(%L,''compass_access_context'',''{}'')',current_setting('test.read_session')));
-- Every request checks the real actor, including a stolen session identifier.
select set_config('request.jwt.claim.sub','71000000-0000-4000-8000-000000000003',true);
select pg_temp.reject('select public.compass_admin_start_workspace(''71000000-0000-4000-8000-000000000002'',true)');
select pg_temp.reject(format('select public.compass_admin_workspace_call(%L,''compass_access_context'',''{}'')',current_setting('test.write_session')));
select pg_temp.reject(format('select public.compass_admin_end_workspace(%L)',current_setting('test.write_session')));
reset role;
do $$ begin
 if not exists(select 1 from compass_private.metric_entries where id='72000000-0000-4000-8000-000000000001' and created_by='71000000-0000-4000-8000-000000000002') then raise exception 'Target record attribution missing'; end if;
 if not exists(select 1 from compass_private.admin_events where actor_id='71000000-0000-4000-8000-000000000001' and subject='71000000-0000-4000-8000-000000000002' and action='workspace_saved') then raise exception 'Real Admin audit missing'; end if;
end $$;
update compass_private.workspace_sessions set expires_at=clock_timestamp()-interval '1 second' where id=current_setting('test.write_session')::uuid;
set local role authenticated;
select set_config('request.jwt.claim.sub','71000000-0000-4000-8000-000000000001',true);
select pg_temp.reject(format('select public.compass_admin_workspace_call(%L,''compass_access_context'',''{}'')',current_setting('test.write_session')));
select set_config('test.staff_session',public.compass_admin_start_workspace('71000000-0000-4000-8000-000000000003',true)->>'id',true);
select pg_temp.reject(format('select public.compass_admin_workspace_call(%L,''compass_metric_entries'',%L)',current_setting('test.staff_session'),'{"target_department":"Finance"}'));
reset role;
update compass_private.members set active=false where user_id='71000000-0000-4000-8000-000000000001';
set local role authenticated;
select pg_temp.reject(format('select public.compass_admin_workspace_call(%L,''compass_access_context'',''{}'')',current_setting('test.staff_session')));
select public.compass_admin_end_workspace(current_setting('test.staff_session')::uuid);
reset role;
set local role anon;
select pg_temp.reject('select public.compass_admin_start_workspace(''71000000-0000-4000-8000-000000000002'',false)');
reset role;
rollback;
