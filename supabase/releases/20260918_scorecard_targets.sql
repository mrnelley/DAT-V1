begin;
create table if not exists compass_private.scorecard_targets (
 metric_id text not null references compass_private.metric_definitions(id), year integer not null check(year between 2026 and 2100),
 operator text not null check(operator in ('gte','lte','gt','lt')), value numeric not null check(value::text not in ('NaN','Infinity','-Infinity')),
 revision integer not null default 1, updated_by uuid not null references auth.users(id), updated_at timestamptz not null default now(), primary key(metric_id,year)
);
create table if not exists compass_private.scorecard_target_audit (
 id bigint generated always as identity primary key, actor_id uuid not null references auth.users(id), previous_record jsonb, next_record jsonb not null, recorded_at timestamptz not null default now()
);
alter table compass_private.scorecard_targets enable row level security;
alter table compass_private.scorecard_target_audit enable row level security;
revoke all on compass_private.scorecard_targets,compass_private.scorecard_target_audit from public,anon,authenticated;
create or replace function public.compass_scorecard_targets(target_year integer) returns jsonb
language plpgsql security definer set search_path='' as $$
begin
 if not compass_private.can_read_metrics() then raise exception 'Scorecard access required' using errcode='42501'; end if;
 return (select coalesce(jsonb_agg(jsonb_build_object('metricId',metric_id,'year',year,'operator',operator,'value',value,'revision',revision)),'[]') from compass_private.scorecard_targets where year=target_year);
end; $$;
create or replace function public.compass_set_scorecard_target(payload jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare prior compass_private.scorecard_targets; saved compass_private.scorecard_targets;
begin
 if not compass_private.is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('target:'||(payload->>'metricId')||':'||(payload->>'year'),0));
 select * into prior from compass_private.scorecard_targets where metric_id=payload->>'metricId' and year=(payload->>'year')::integer for update;
 if prior.revision is distinct from (payload->>'expectedRevision')::integer then raise exception 'Target changed; reload before saving'; end if;
 insert into compass_private.scorecard_targets(metric_id,year,operator,value,updated_by)
 values(payload->>'metricId',(payload->>'year')::integer,payload->>'operator',(payload->>'value')::numeric,auth.uid())
 on conflict(metric_id,year) do update set operator=excluded.operator,value=excluded.value,revision=compass_private.scorecard_targets.revision+1,updated_by=auth.uid(),updated_at=now() returning * into saved;
 insert into compass_private.scorecard_target_audit(actor_id,previous_record,next_record) values(auth.uid(),to_jsonb(prior),to_jsonb(saved));
end; $$;
revoke all on function public.compass_scorecard_targets(integer),public.compass_set_scorecard_target(jsonb) from public,anon;
grant execute on function public.compass_scorecard_targets(integer),public.compass_set_scorecard_target(jsonb) to authenticated;
insert into compass_private.releases(version) values('20260918_scorecard_targets') on conflict do nothing;
notify pgrst,'reload schema';
commit;
