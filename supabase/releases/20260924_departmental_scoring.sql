begin;
-- A validated departmental submission earns one +3 award; empty opt-outs stay neutral.
-- Existing ledger records are not recalculated by this migration.
alter table compass_private.weekly_points drop constraint if exists weekly_points_points_check;
alter table compass_private.weekly_points add constraint weekly_points_points_check check(points in (5,3,0,-3,-10));
alter table compass_private.weekly_points drop constraint if exists weekly_points_outcome_check;
alter table compass_private.weekly_points add constraint weekly_points_outcome_check check(outcome in ('on_time_priority','on_time_departmental','on_time_opt_out','late_submission','missed_submission'));
create or replace function compass_private.save_weekly(payload jsonb,finalizing boolean,at_time timestamptz)
returns jsonb language plpgsql security definer set search_path='' as $$
declare position_key text := payload->>'positionId'; week_date date := (payload->>'week')::date;
 document jsonb := payload->'draft'; rec compass_private.weekly_records; boundary record;
 event_points integer; event_outcome text; correction text := trim(coalesce(payload->>'correctionReason',''));
begin
 if not compass_private.weekly_access(position_key,true) then raise exception 'You cannot edit this position' using errcode='42501'; end if;
 if not exists(select 1 from compass_private.positions where id=position_key and active) then raise exception 'Inactive position'; end if;
 if week_date < (select starts_on from compass_private.weekly_settings) then raise exception 'This cycle predates weekly tracking; use the future historical import workflow'; end if;
 if not(payload ? 'expectedRevision') then raise exception 'Reload the weekly record before saving'; end if;
 perform compass_private.validate_weekly_document(document,finalizing);
 select * into boundary from compass_private.weekly_boundaries(week_date);
 if finalizing and at_time<boundary.opens_at then raise exception 'This week has not started'; end if;
 insert into compass_private.weekly_records(position_id,week) values(position_key,week_date) on conflict do nothing;
 select * into rec from compass_private.weekly_records where position_id=position_key and week=week_date for update;
 if (payload->>'expectedRevision') is null then raise exception 'A numeric revision is required'; end if;
 if rec.revision is distinct from (payload->>'expectedRevision')::integer then
  if rec.updated_by=auth.uid() and rec.draft=document and (not finalizing or rec.submitted=document) then return to_jsonb(rec); end if;
  raise exception 'This record changed; reload it before saving';
 end if;
 if rec.exempt then raise exception 'This position is exempt for this week'; end if;
 if at_time>boundary.grace_at then
  if not exists(select 1 from compass_private.members where user_id=auth.uid() and active and (compass_private.is_admin() or compass_private.current_position_roles() && array['director']))
    or length(correction)<3 then raise exception 'After grace, a Director or Admin correction reason is required'; end if;
 end if;
 update compass_private.weekly_records set draft=document,revision=revision+1,updated_by=auth.uid(),updated_at=at_time,
  submitted=case when finalizing then document else submitted end,
  first_submitted_at=case when finalizing then coalesce(first_submitted_at,at_time) else first_submitted_at end,
  last_submitted_at=case when finalizing then at_time else last_submitted_at end,
  submitted_revision=case when finalizing then revision+1 else submitted_revision end
 where position_id=position_key and week=week_date returning * into rec;
 if finalizing then
  insert into compass_private.weekly_revisions(position_id,week,revision,snapshot,actor_id,recorded_at,correction_reason)
   values(position_key,week_date,rec.revision,document,auth.uid(),at_time,nullif(correction,''));
  if rec.first_submitted_at<=boundary.deadline_at then
    event_points := case when document->>'capacity'='enterprise' then 5 when jsonb_array_length(document->'entries')>0 then 3 else 0 end;
    event_outcome := case when event_points=5 then 'on_time_priority' when event_points=3 then 'on_time_departmental' else 'on_time_opt_out' end;
  elsif rec.first_submitted_at<=boundary.grace_at then event_points:=-3;event_outcome:='late_submission';
  else event_points:=-10;event_outcome:='missed_submission'; end if;
  insert into compass_private.weekly_points(position_id,week,points,outcome,recorded_at)
  values(position_key,week_date,event_points,event_outcome,at_time)
  on conflict(position_id,week) do update set points=excluded.points,outcome=excluded.outcome,recorded_at=excluded.recorded_at
  where at_time<=boundary.deadline_at;
 end if;
 return to_jsonb(rec);
end; $$;
insert into compass_private.releases(version) values('20260924_departmental_scoring') on conflict do nothing;
notify pgrst,'reload schema';
commit;
