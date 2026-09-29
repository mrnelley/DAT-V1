-- User-directed removal of the RED affiliation. Operations remains a
-- cross-department tracking area, not an added department or permission grant.
begin;
set local lock_timeout = '10s';
do $$
declare
 release_key constant text := '20260929_operations_affiliation';
 position_key constant text := 'manager-enterprise-initiatives';
 author_id constant uuid := '652e57a4-9d8b-464d-8016-281039b1ae68';
 prior compass_private.positions;
 saved compass_private.positions;
 original_members jsonb;
 original_grants jsonb;
 old_metric compass_private.metric_definitions;
 new_metric compass_private.metric_definitions;
begin
 perform pg_advisory_xact_lock(hashtextextended(position_key,21));
 if exists(select 1 from compass_private.releases where version=release_key) then
  raise notice 'Operations affiliation correction already applied';
  return;
 end if;
 select * into strict prior from compass_private.positions where id=position_key for update;
 if prior.title<>'Manager, Enterprise Initiatives' or prior.department is distinct from 'Real Estate Development' then
  raise exception 'Position affiliation changed; review before applying correction';
 end if;
 if not exists(select 1 from compass_private.position_assignments where position_id=position_key and user_id=author_id) then
  raise exception 'Authorizing user is no longer assigned to the position';
 end if;
 select jsonb_agg(to_jsonb(m) order by user_id) into original_members from compass_private.members m where user_id=author_id;
 select coalesce(jsonb_agg(to_jsonb(g) order by metric_id,department),'[]') into original_grants from compass_private.position_metrics g where position_id=position_key;
 update compass_private.positions set department=null,revision=revision+1 where id=position_key returning * into saved;
 insert into compass_private.admin_events(actor_id,action,subject,before_record,after_record)
 values(author_id,'position_affiliation_corrected',position_key,to_jsonb(prior),to_jsonb(saved)||jsonb_build_object(
  'reason','User requested removal from RED; Operations is a cross-department tracking area',
  'trackingAreaContext','Operations','executedBy',session_user,'release',release_key));
 if (to_jsonb(prior)-'department'-'revision') is distinct from (to_jsonb(saved)-'department'-'revision') then
  raise exception 'Unexpected position changes';
 end if;
 if original_members is distinct from (select jsonb_agg(to_jsonb(m) order by user_id) from compass_private.members m where user_id=author_id)
  or original_grants is distinct from (select coalesce(jsonb_agg(to_jsonb(g) order by metric_id,department),'[]') from compass_private.position_metrics g where position_id=position_key) then
  raise exception 'Account access scope or metric permissions changed';
 end if;
 select * into strict old_metric from compass_private.metric_definitions where id='real-estate-development-4' for update;
 update compass_private.metric_definitions set name='Active pipeline units (site control through certificate of occupancy [CO])'
 where id=old_metric.id returning * into new_metric;
 insert into compass_private.admin_events(actor_id,action,subject,before_record,after_record)
 values(author_id,'metric_label_clarified',old_metric.id,to_jsonb(old_metric),to_jsonb(new_metric)||jsonb_build_object(
  'reason','User confirmed active pipeline covers site control through CO; state the boundary wherever displayed',
  'executedBy',session_user,'release',release_key));
 insert into compass_private.releases(version) values(release_key);
end $$;
select title,department,revision from compass_private.positions where id='manager-enterprise-initiatives';
select id,name from compass_private.metric_definitions where id='real-estate-development-4';
commit;
