begin;
insert into auth.users(id,email,email_confirmed_at) values
 ('83000000-0000-4000-8000-000000000001','workspace-admin@example.invalid',now()),
 ('83000000-0000-4000-8000-000000000002','workspace-olt@example.invalid',now()),
 ('83000000-0000-4000-8000-000000000003','workspace-director@example.invalid',now());
insert into compass_private.members(user_id,position_title,roles,departments) values
 ('83000000-0000-4000-8000-000000000001','Test admin',array['admin'],'{}');
create function pg_temp.reject(statement text) returns void language plpgsql as $$
begin begin execute statement; exception when others then return; end; raise exception 'Expected rejection: %',statement; end; $$;
set local role authenticated;
select set_config('request.jwt.claim.sub','83000000-0000-4000-8000-000000000001',true);
select public.compass_admin_save_position('{"id":"test-olt-only","title":"Test OLT only","roles":["olt"]}');
select public.compass_admin_save_position('{"id":"test-director-only","title":"Test Director only","department":"Finance","roles":["director"]}');
select public.compass_set_metric_member('{"userId":"83000000-0000-4000-8000-000000000002","roles":[],"positions":["test-olt-only"]}');
select public.compass_set_metric_member('{"userId":"83000000-0000-4000-8000-000000000003","roles":[],"positions":["test-director-only"]}');
select set_config('request.jwt.claim.sub','83000000-0000-4000-8000-000000000002',true);
do $$ declare ctx jsonb:=public.compass_access_context(); begin
 if ctx->>'weekly'<>'true' or ctx->>'scorecards'<>'true' then raise exception 'OLT-only cannot participate'; end if;
 if ctx->'roles' @> '["director"]' then raise exception 'OLT was given Director authority'; end if;
 if ctx->'features'->>'myDashboard'<>'false' then raise exception 'Dashboard leaked by default'; end if;
end $$;
select pg_temp.reject('select public.compass_my_workspace()');
select pg_temp.reject($q$select public.compass_save_profile('{"displayName":"Unauthorized"}')$q$);
select pg_temp.reject($q$select public.compass_admin_save_position('{"title":"Cannot create","roles":["olt"]}')$q$);
select set_config('request.jwt.claim.sub','83000000-0000-4000-8000-000000000003',true);
do $$ begin if public.compass_access_context()->>'weekly'<>'false' then raise exception 'Director implies OLT'; end if; end $$;
select set_config('request.jwt.claim.sub','83000000-0000-4000-8000-000000000001',true);
select public.compass_admin_save_position('{"id":"test-director-only","title":"Test Director only","department":"Finance","roles":["director","olt"],"expectedRevision":1}');
select public.compass_admin_set_feature('83000000-0000-4000-8000-000000000002','myDashboard',true);
select set_config('request.jwt.claim.sub','83000000-0000-4000-8000-000000000002',true);
select public.compass_save_profile('{"displayName":"OLT member","bio":"Weekly work","expectedRevision":null}');
do $$ declare doc jsonb:=public.compass_my_workspace(); begin
 if doc->'profile'->>'displayName'<>'OLT member' or doc->'profile'->>'revision'<>'1' then raise exception 'Profile did not persist'; end if;
 if jsonb_array_length(doc->'properties')<>0 then raise exception 'Unassigned properties leaked'; end if;
end $$;
select pg_temp.reject($q$select public.compass_save_profile('{"displayName":"Stale","expectedRevision":null}')$q$);
select pg_temp.reject($q$select public.compass_save_profile('{"displayName":"X","photo":"data:image/svg+xml;base64,abc","expectedRevision":1}')$q$);
select pg_temp.reject('select * from compass_private.profiles');
select set_config('request.jwt.claim.sub','83000000-0000-4000-8000-000000000003',true);
do $$ begin if public.compass_access_context()->>'weekly'<>'true' then raise exception 'Combined OLT and Director failed'; end if; end $$;
select pg_temp.reject('select public.compass_my_workspace()');
select set_config('request.jwt.claim.sub','83000000-0000-4000-8000-000000000001',true);
select public.compass_admin_set_feature('83000000-0000-4000-8000-000000000002','myDashboard',false);
select set_config('request.jwt.claim.sub','83000000-0000-4000-8000-000000000002',true);
select pg_temp.reject('select public.compass_my_workspace()');
select pg_temp.reject($q$select public.compass_save_profile('{"displayName":"Revoked","expectedRevision":1}')$q$);
reset role;
do $$ begin
 if (select count(*) from compass_private.properties where code in ('1528','BEACH','BHH','CLAY','COL','DMA','XTR','FLATS','FLATS2','FLATS3','FLATS4','GLEN','GOVGATE','HAMBURG','HAA','HPA'))<>16 then raise exception 'Property seed incomplete'; end if;
 if (select postal_code from compass_private.properties where code='HPA')<>'18702' then raise exception 'Address lost'; end if;
end $$;
set local role anon;
select pg_temp.reject('select public.compass_my_workspace()');
rollback;
