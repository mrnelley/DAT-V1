begin;
create or replace function public.compass_save_metric_entry(payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare definition compass_private.metric_definitions; existing compass_private.metric_entries;
 saved compass_private.metric_entries; entry_id uuid; entry_period date;
begin
 select * into definition from compass_private.metric_definitions where id=payload->>'metricId' and active;
 if not found then raise exception 'Unknown or inactive measure'; end if;
 if not compass_private.can_write_metric(payload->>'department',definition.department is null) then
   raise exception 'Metric write access required for this department' using errcode='42501'; end if;
 if definition.department is not null and definition.department<>payload->>'department' then
   raise exception 'Measure belongs to a different department' using errcode='42501'; end if;
 if coalesce(payload->>'period','') !~ '^\d{4}-(0[1-9]|1[0-2])$' then raise exception 'Reporting month must be YYYY-MM'; end if;
 entry_period := (payload->>'period' || '-01')::date;
 entry_id := (payload->>'id')::uuid;
 if entry_id is null then raise exception 'A request ID is required'; end if;
 -- Same request ID is serialized so retrying a contribution cannot double count it.
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(entry_id::text,0));
 select * into existing from compass_private.metric_entries where id=entry_id for update;
 if found then
   if existing.department<>payload->>'department' or existing.metric_id<>definition.id then
     raise exception 'Entry identity cannot change' using errcode='42501'; end if;
   if not (payload ? 'expectedRevision') then
     if existing.created_by=auth.uid() and existing.period=entry_period and existing.value=(payload->>'value')::numeric
       and existing.category_id is not distinct from nullif(payload->>'categoryId','')
       and existing.description=trim(payload->>'description') then return jsonb_build_object('id',existing.id,'revision',existing.revision); end if;
     raise exception 'Entry already exists; use a revision to correct it';
   end if;
   if existing.revision is distinct from (payload->>'expectedRevision')::integer then raise exception 'Entry changed; reload before saving'; end if;
   update compass_private.metric_entries set period=entry_period,value=(payload->>'value')::numeric,
     category_id=nullif(payload->>'categoryId',''),description=trim(payload->>'description'),
     updated_by=auth.uid(),updated_at=clock_timestamp(),revision=revision+1 where id=entry_id returning * into saved;
 else
   if payload ? 'expectedRevision' then raise exception 'Entry does not exist'; end if;
   insert into compass_private.metric_entries(id,metric_id,department,period,value,category_id,description,created_by,updated_by)
   values(entry_id,definition.id,payload->>'department',entry_period,(payload->>'value')::numeric,
     nullif(payload->>'categoryId',''),trim(payload->>'description'),auth.uid(),auth.uid()) returning * into saved;
 end if;
 insert into compass_private.metric_entry_revisions(entry_id,revision,snapshot,author_id)
 values(saved.id,saved.revision,to_jsonb(saved),auth.uid());
 return jsonb_build_object('id',saved.id,'revision',saved.revision);
end;
$$;

insert into compass_private.releases(version) values('20260917_metric_revision_guard') on conflict do nothing;
commit;
