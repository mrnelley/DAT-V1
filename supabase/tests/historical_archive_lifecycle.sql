begin;
insert into auth.users(id,email,email_confirmed_at) values
 ('83000000-0000-4000-8000-000000000001','archive-admin@example.invalid',now()),
 ('83000000-0000-4000-8000-000000000002','archive-staff@example.invalid',now());
insert into compass_private.members(user_id,position_title,roles,departments) values
 ('83000000-0000-4000-8000-000000000001','Archive test Admin',array['admin'],'{}'),
 ('83000000-0000-4000-8000-000000000002','Archive test Staff',array['staff'],'{}');
insert into compass_private.historical_archive values('archive-test','2026-Q1','{"title":"Archive lifecycle record","positionTitles":[]}','test-hash',now());
create function pg_temp.archive_reject(statement text) returns void language plpgsql as $$
begin begin execute statement; exception when others then return; end; raise exception 'Expected rejection: %',statement; end; $$;
set local role authenticated;
select set_config('request.jwt.claim.sub','83000000-0000-4000-8000-000000000001',true);
do $$ begin if jsonb_array_length(public.compass_admin_archive('2026-Q1','Archive lifecycle record'))<>1 then raise exception 'Admin archive read failed'; end if; end $$;
select pg_temp.archive_reject('update compass_private.historical_archive set content=''{}'' where id=''archive-test''');
select set_config('request.jwt.claim.sub','83000000-0000-4000-8000-000000000002',true);
select pg_temp.archive_reject('select public.compass_admin_archive(''2026-Q1'')');
select pg_temp.archive_reject('select * from compass_private.historical_archive');
set local role anon;
select pg_temp.archive_reject('select public.compass_admin_archive(''2026-Q1'')');
reset role;
select pg_temp.archive_reject('update compass_private.historical_archive set content=''{}'' where id=''archive-test''');
select pg_temp.archive_reject('delete from compass_private.historical_archive where id=''archive-test''');
rollback;
