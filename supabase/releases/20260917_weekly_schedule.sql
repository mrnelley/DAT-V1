-- Supabase Cron installation: https://supabase.com/docs/guides/cron/install
begin;
create extension if not exists pg_cron with schema pg_catalog;
select cron.schedule('compass-weekly-accountability','* * * * *','select compass_private.weekly_maintain();');
insert into compass_private.releases(version) values('20260917_weekly_schedule') on conflict do nothing;
commit;
