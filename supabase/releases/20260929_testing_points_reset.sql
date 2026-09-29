-- User-directed reset after the first week of testing, September 29, 2026.
-- Restore the established opening balance (100), preserving original score
-- records in weekly_audit and leaving commitments and revisions unchanged.
-- Apply only to development project vbkjyiurvcnwnjxqvajr.
begin;
set local lock_timeout = '10s';
do $$
declare
 reset_key constant text := '20260929_testing_points_reset';
 prior_records jsonb;
 prior_revisions jsonb;
 affected_positions integer;
begin
 perform pg_advisory_xact_lock(hashtext(reset_key));
 if exists(select 1 from compass_private.releases where version=reset_key) then
  raise notice 'Testing points reset already applied; no changes';
  return;
 end if;
 lock table compass_private.positions in share mode;
 lock table compass_private.weekly_records in share mode;
 lock table compass_private.weekly_points in share row exclusive mode;
 lock table compass_private.weekly_revisions in share mode;
 if exists(select 1 from compass_private.weekly_points where week > date '2026-09-21') then
  raise exception 'New scoring periods exist; review scope before applying the first-week reset';
 end if;
 select coalesce(jsonb_agg(to_jsonb(r) order by position_id,week),'[]') into prior_records from compass_private.weekly_records r;
 select coalesce(jsonb_agg(to_jsonb(r) order by position_id,week,revision),'[]') into prior_revisions from compass_private.weekly_revisions r;
 select count(*) into affected_positions from compass_private.positions;
 insert into compass_private.weekly_audit(position_id,week,actor_id,action,details)
 select p.id,null,null,'points_reset',jsonb_build_object(
  'resetId',reset_key,
  'reason','User requested Reset Points after the first week of testing',
  'authorization','User instruction in chat 01a0ee10-c5f3-7c72-8d88-906c567a5807, September 29, 2026',
  'executedBy',session_user,
  'previousBalance',100+coalesce((select sum(w.points) from compass_private.weekly_points w where w.position_id=p.id),0),
  'resetBalance',100,
  'originalPointRows',coalesce((select jsonb_agg(to_jsonb(w) order by w.week) from compass_private.weekly_points w where w.position_id=p.id),'[]'::jsonb))
 from compass_private.positions p;
 update compass_private.weekly_points set points=0 where points<>0;
 if exists(select 1 from compass_private.positions p where 100+coalesce((select sum(w.points) from compass_private.weekly_points w where w.position_id=p.id),0)<>100) then
  raise exception 'Not every position was restored to 100';
 end if;
 if prior_records is distinct from (select coalesce(jsonb_agg(to_jsonb(r) order by position_id,week),'[]') from compass_private.weekly_records r)
  or prior_revisions is distinct from (select coalesce(jsonb_agg(to_jsonb(r) order by position_id,week,revision),'[]') from compass_private.weekly_revisions r) then
  raise exception 'Reset changed weekly commitments or revision history';
 end if;
 if (select count(*) from compass_private.weekly_audit where action='points_reset' and details->>'resetId'=reset_key)<>affected_positions then
  raise exception 'Missing reset audit records';
 end if;
 insert into compass_private.releases(version) values(reset_key);
end $$;
select count(*) as positions_at_100 from compass_private.positions p
 where 100+coalesce((select sum(w.points) from compass_private.weekly_points w where w.position_id=p.id),0)=100;
commit;
