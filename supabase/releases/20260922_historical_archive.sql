begin;
create table if not exists compass_private.historical_archive (
 id text primary key,
 period text not null check(period in ('2026-Q1','2026-Q2')),
 content jsonb not null check(jsonb_typeof(content)='object'),
 content_hash text not null,
 imported_at timestamptz not null default now()
);
alter table compass_private.historical_archive enable row level security;
revoke all on compass_private.historical_archive from public,anon,authenticated;
create or replace function compass_private.reject_archive_change() returns trigger
language plpgsql set search_path='' as $$
begin raise exception 'Historical archive records cannot be edited or deleted' using errcode='55000'; end; $$;
drop trigger if exists immutable_archive on compass_private.historical_archive;
create trigger immutable_archive before update or delete on compass_private.historical_archive
for each row execute function compass_private.reject_archive_change();
create or replace function public.compass_admin_archive(archive_period text,search_text text default '') returns jsonb
language plpgsql security definer set search_path='' as $$
begin
 if not compass_private.is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
 if archive_period not in ('2026-Q1','2026-Q2') then raise exception 'Choose an available archive quarter'; end if;
 if length(coalesce(search_text,''))>200 then raise exception 'Search is too long'; end if;
 return (select coalesce(jsonb_agg(to_jsonb(r) order by r.content->>'title',r.id),'[]') from
  (select id,period,content from compass_private.historical_archive a where a.period=archive_period
   and a.content::text ilike '%'||coalesce(search_text,'')||'%') r);
end; $$;
revoke all on function compass_private.reject_archive_change() from public,anon,authenticated;
revoke all on function public.compass_admin_archive(text,text) from public,anon;
grant execute on function public.compass_admin_archive(text,text) to authenticated;
insert into compass_private.releases(version) values('20260922_historical_archive') on conflict do nothing;
notify pgrst,'reload schema';
commit;
