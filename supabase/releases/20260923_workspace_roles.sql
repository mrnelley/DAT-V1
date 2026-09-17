begin;
alter table compass_private.members drop constraint if exists members_roles_check;
alter table compass_private.members add constraint members_roles_check check(roles <@ array['admin','executive','elt','olt','director','staff','external']::text[]);
do $$ begin
 if not exists(select 1 from compass_private.releases where version='20260923_workspace_roles') then
  update compass_private.positions set roles=array_append(roles,'olt'),revision=revision+1 where 'director'=any(roles) and not 'olt'=any(roles);
  update compass_private.positions set features=features||'{"myDashboard":false}'::jsonb;
  delete from compass_private.member_features where feature_key='myDashboard';
  insert into compass_private.member_features(user_id,feature_key,enabled)
   select m.user_id,'myDashboard',true from compass_private.members m join auth.users u on u.id=m.user_id
   where lower(u.email)='pkelley@hdcweb.org' and m.active;
 end if;
end $$;

create or replace function compass_private.can_read_metrics() returns boolean
language sql stable security definer set search_path='' as $$
 select compass_private.is_admin() or exists(select 1 from compass_private.members m join compass_private.positions p on p.id=compass_private.current_position()
 where m.user_id=auth.uid() and m.active and m.read_metrics is distinct from false
 and coalesce(p.read_scorecards,p.roles && array['executive','elt','olt','director']));
$$;

create or replace function compass_private.weekly_access(target_position text, writing boolean default false) returns boolean
language sql stable security definer set search_path='' as $$
 select compass_private.is_admin() or exists(select 1 from compass_private.members m where m.user_id=auth.uid() and m.active
 and compass_private.current_position_roles() && array['executive','elt','olt']
 and case when writing then m.write_weekly is distinct from false and target_position=compass_private.current_position()
 else m.read_weekly is distinct from false end);
$$;

create or replace function compass_private.weekly_maintain(at_time timestamptz default clock_timestamp()) returns void
language plpgsql security definer set search_path='' as $$
declare current_week date := date_trunc('week',at_time at time zone 'America/New_York')::date; rec record;
begin
 -- No retrospective roster inference: materialize this cycle only, at enrollment/job time.
 if current_week >= (select starts_on from compass_private.weekly_settings) then
 insert into compass_private.weekly_records(position_id,week,expected)
 select p.id,current_week,true from compass_private.positions p where p.active and p.required
 and exists(select 1 from compass_private.position_assignments a join compass_private.members m on m.user_id=a.user_id
  where a.position_id=p.id and m.active and exists(select 1 from auth.users u where u.id=m.user_id and u.email_confirmed_at is not null) and p.roles && array['executive','elt','olt'])
 on conflict(position_id,week) do update set expected=true where not compass_private.weekly_records.expected;
 end if;
 for rec in select r.position_id,r.week from compass_private.weekly_records r
  cross join lateral compass_private.weekly_boundaries(r.week) b
  where r.expected and not r.exempt and r.first_submitted_at is null and at_time>b.grace_at
  and not exists(select 1 from compass_private.weekly_points e where e.position_id=r.position_id and e.week=r.week)
  order by r.position_id,r.week for update of r loop
  insert into compass_private.weekly_points(position_id,week,points,outcome,recorded_at)
  select rec.position_id,rec.week,-10,'missed_submission',at_time
  where not exists(select 1 from compass_private.weekly_records r where r.position_id=rec.position_id and r.week=rec.week and r.first_submitted_at is not null)
  on conflict do nothing;
 end loop;
end; $$;

create or replace function public.compass_admin_save_position(payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare prior compass_private.positions; saved compass_private.positions;
 target text:=coalesce(nullif(payload->>'id',''),gen_random_uuid()::text); chosen_roles text[];
begin
 if not compass_private.is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended(target,21));
 select * into prior from compass_private.positions where id=target for update;
 if prior.revision is distinct from (payload->>'expectedRevision')::integer then raise exception 'Position changed; reload before saving'; end if;
 if length(trim(coalesce(payload->>'title',''))) not between 1 and 150 then raise exception 'Enter a position title'; end if;
 if jsonb_typeof(payload->'roles') is distinct from 'array' then raise exception 'Select position roles'; end if;
 chosen_roles:=array(select jsonb_array_elements_text(payload->'roles'));
 if cardinality(chosen_roles)=0 or not chosen_roles <@ array['executive','elt','olt','director','staff','external'] then raise exception 'Select valid position roles'; end if;
 if jsonb_typeof(coalesce(payload->'features','{}'))<>'object' or exists(select 1 from jsonb_each(coalesce(payload->'features','{}')) f where jsonb_typeof(f.value)<>'boolean') then raise exception 'Feature settings must be true or false'; end if;
 insert into compass_private.positions(id,title,department,roles,features,read_scorecards,required,active)
 values(target,trim(payload->>'title'),nullif(payload->>'department',''),chosen_roles,coalesce(payload->'features','{}'),
  (payload->>'readScorecards')::boolean,chosen_roles && array['executive','elt','olt'],coalesce((payload->>'active')::boolean,true))
 on conflict(id) do update set title=excluded.title,department=excluded.department,roles=excluded.roles,features=excluded.features,
 read_scorecards=excluded.read_scorecards,required=excluded.required,active=excluded.active,revision=compass_private.positions.revision+1 returning * into saved;
 insert into compass_private.admin_events(actor_id,action,subject,before_record,after_record)
 values(auth.uid(),'position_saved',target,to_jsonb(prior),to_jsonb(saved));
 return to_jsonb(saved);
end; $$;

create table if not exists compass_private.profiles (
 user_id uuid primary key references compass_private.members(user_id),
 display_name text not null default '' check(length(display_name)<=150),
 bio text not null default '' check(length(bio)<=1000),
 photo text check(photo is null or (length(photo)<=180000 and photo ~ '^data:image/jpeg;base64,[A-Za-z0-9+/=]+$')),
 revision integer not null default 1
);
alter table compass_private.profiles enable row level security;
revoke all on compass_private.profiles from public,anon,authenticated;

create or replace function public.compass_access_context() returns jsonb
language plpgsql security definer set search_path='' as $$
declare m compass_private.members; p compass_private.positions;
begin
 select * into m from compass_private.members where user_id=auth.uid() and active;
 if not found then raise exception 'Your account needs an active Admin assignment' using errcode='42501'; end if;
 select * into p from compass_private.positions where id=compass_private.current_position();
 return jsonb_build_object('positionTitle',coalesce(p.title,m.position_title),'positionId',p.id,'roles',coalesce(p.roles,'{}'),
 'positions',(select coalesce(jsonb_agg(jsonb_build_object('id',q.id,'title',q.title) order by q.title),'[]') from compass_private.positions q
  join compass_private.position_assignments a on a.position_id=q.id and a.user_id=auth.uid() where q.active),
 'admin',compass_private.is_admin(),'scorecards',compass_private.can_read_metrics(),
 'metrics',compass_private.can_read_metrics() or exists(select 1 from compass_private.position_metrics g where g.position_id=p.id and m.read_metrics is distinct from false),
 'weekly',compass_private.weekly_access(null,false),
 'profile',(select jsonb_build_object('displayName',display_name,'photo',photo) from compass_private.profiles where user_id=auth.uid()),
 'features','{"myDashboard":false}'::jsonb||coalesce(p.features,'{}')||(select coalesce(jsonb_object_agg(feature_key,enabled),'{}') from compass_private.member_features where user_id=auth.uid()));
end; $$;

create or replace function compass_private.workspace_enabled() returns boolean
language sql stable security definer set search_path='' as $$
 select coalesce((public.compass_access_context()->'features'->>'myDashboard')::boolean,false);
$$;

create or replace function public.compass_my_workspace() returns jsonb
language plpgsql security definer set search_path='' as $$
declare ctx jsonb:=public.compass_access_context(); person jsonb;
begin
 if not compass_private.workspace_enabled() then raise exception 'Your working dashboard has not been enabled yet' using errcode='42501'; end if;
 select jsonb_build_object('displayName',coalesce(nullif(p.display_name,''),u.raw_user_meta_data->>'full_name',u.raw_user_meta_data->>'name',u.email),
 'email',u.email,'bio',coalesce(p.bio,''),'photo',p.photo,'revision',p.revision) into person
 from auth.users u left join compass_private.profiles p on p.user_id=u.id where u.id=auth.uid();
 return jsonb_build_object('profile',person,'access',ctx,
 'weekly',case when (ctx->>'weekly')::boolean then public.compass_weekly_context() else null end,
 'properties',(select coalesce(jsonb_agg(to_jsonb(p) order by p.name),'[]') from compass_private.properties p where p.active
 and (compass_private.is_admin() or p.manager_id=auth.uid() or p.resident_lead_id=auth.uid())));
end; $$;

create or replace function public.compass_save_profile(payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare prior compass_private.profiles; saved compass_private.profiles; photo_value text:=nullif(payload->>'photo','');
begin
 if not compass_private.workspace_enabled() then raise exception 'Your working dashboard has not been enabled yet' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,23));
 select * into prior from compass_private.profiles where user_id=auth.uid() for update;
 if prior.revision is distinct from (payload->>'expectedRevision')::integer then raise exception 'Your profile changed; reload before saving'; end if;
 if length(trim(coalesce(payload->>'displayName',''))) not between 1 and 150 then raise exception 'Enter your display name'; end if;
 if photo_value is not null and (length(photo_value)>180000 or photo_value !~ '^data:image/jpeg;base64,/9j/[A-Za-z0-9+/=]+$') then raise exception 'Choose a JPEG profile photo under 130 KB'; end if;
 insert into compass_private.profiles(user_id,display_name,bio,photo)
 values(auth.uid(),trim(payload->>'displayName'),coalesce(payload->>'bio',''),photo_value)
 on conflict(user_id) do update set display_name=excluded.display_name,bio=excluded.bio,photo=excluded.photo,revision=compass_private.profiles.revision+1 returning * into saved;
 return jsonb_build_object('displayName',saved.display_name,'bio',saved.bio,'photo',saved.photo,'revision',saved.revision);
end; $$;
revoke all on function compass_private.workspace_enabled(),public.compass_my_workspace(),public.compass_save_profile(jsonb) from public,anon;
grant execute on function public.compass_my_workspace(),public.compass_save_profile(jsonb) to authenticated;


alter table compass_private.properties add column if not exists code text unique check(length(code) between 1 and 30);
alter table compass_private.properties add column if not exists street text check(length(street)<=200);
alter table compass_private.properties add column if not exists city text check(length(city)<=100);
alter table compass_private.properties add column if not exists state text check(state ~ '^[A-Z]{2}$');
alter table compass_private.properties add column if not exists postal_code text check(postal_code ~ '^[0-9]{5}(-[0-9]{4})?$');
alter table compass_private.properties add column if not exists population text check(length(population)<=250);

create or replace function public.compass_admin_save_property(payload jsonb) returns uuid
language plpgsql security definer set search_path='' as $$
declare prior compass_private.properties; saved compass_private.properties; target uuid:=coalesce((payload->>'id')::uuid,gen_random_uuid());
begin
 if not compass_private.is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(target::text,19));
 select * into prior from compass_private.properties where id=target for update;
 if prior.revision is distinct from (payload->>'expectedRevision')::integer then raise exception 'Property changed; reload before saving'; end if;
 if exists(select 1 from jsonb_each_text(jsonb_build_object('manager',payload->>'managerId','lead',payload->>'residentLeadId')) v where nullif(v.value,'') is not null and not exists(select 1 from compass_private.members m where m.user_id=v.value::uuid and m.active)) then raise exception 'Select active property owners'; end if;
 insert into compass_private.properties(id,name,location,units,manager_id,resident_lead_id,active,code,street,city,state,postal_code,population)
 values(target,trim(payload->>'name'),coalesce(payload->>'location',''),(nullif(payload->>'units',''))::integer,nullif(payload->>'managerId','')::uuid,nullif(payload->>'residentLeadId','')::uuid,coalesce((payload->>'active')::boolean,true),case when payload ? 'code' then nullif(trim(payload->>'code'),'') else prior.code end,case when payload ? 'street' then nullif(trim(payload->>'street'),'') else prior.street end,case when payload ? 'city' then nullif(trim(payload->>'city'),'') else prior.city end,case when payload ? 'state' then nullif(trim(payload->>'state'),'') else prior.state end,case when payload ? 'postalCode' then nullif(trim(payload->>'postalCode'),'') else prior.postal_code end,case when payload ? 'population' then nullif(trim(payload->>'population'),'') else prior.population end)
 on conflict(id) do update set name=excluded.name,location=excluded.location,units=excluded.units,manager_id=excluded.manager_id,resident_lead_id=excluded.resident_lead_id,active=excluded.active,code=excluded.code,street=excluded.street,city=excluded.city,state=excluded.state,postal_code=excluded.postal_code,population=excluded.population,revision=compass_private.properties.revision+1 returning * into saved;
 insert into compass_private.admin_events(actor_id,action,subject,before_record,after_record) values(auth.uid(),'property_saved',target::text,to_jsonb(prior),to_jsonb(saved));
 return target;
end; $$;

-- Restore missing original scorecard definitions without altering existing governance.
insert into compass_private.metric_definitions(id,name,department,unit) values
('annual-rs-utilization-rate','Resident Services Utilization Rate','Resident Services','percent'),
('resident-services-2','Resident Experience Score','Resident Services','percent'),
('resident-services-6','Household (Resident) Engagement Rate','Resident Services','percent'),
('resident-services-1','Resident Satisfaction Rate','Resident Services','percent'),
('resident-services-3','Housing Stability Rate','Resident Services','percent'),
('rs-positive-move-out-rate','Positive Move-Out Rate','Resident Services','percent'),
('annual-service-partner-connection-rate','Service Delivery Partner Connection Rate','Resident Services','percent'),
('community-relations-8','Predevelopment Capital Raised','Community Relations','USD'),
('finance-3','Accounts Receivable Reduction','Finance','USD'),
('finance-1','Days Cash on Hand','Finance','days'),
('finance-parent-noi','Net Operating Income','Finance','USD'),
('finance-4','Current Ratio','Finance','ratio'),
('human-resources-1','Employee Satisfaction Rate','Human Resources','percent'),
('human-resources-3','Employee Engagement Rate','Human Resources','percent'),
('hr-retention-12-month','Employee Retention Rate (12-month)','Human Resources','percent'),
('annual-new-units-acquired-placed','New Units Acquired or Placed in Service','Real Estate Development','units'),
('real-estate-development-6','Existing Units Rehabbed','Real Estate Development','units'),
('annual-units-under-development','Units Under Development (LIHTC Applied/Awarded)','Real Estate Development','units'),
('real-estate-development-7','Units in Closing','Real Estate Development','units'),
('property-management-1','Events of Noncompliance','Property Management','count'),
('property-management-2','Rent Collection Rate','Property Management','percent'),
('property-management-3','Vacancy Rate','Property Management','percent'),
('finance-6','Payment of Deferred Developer Fee','Finance','USD'),
('finance-7','Vacancy Loss','Finance','USD'),
('annual-resident-stories','Resident Stories Collected & Shared','Community Relations','count'),
('annual-positive-news','Positive News Mentions','Community Relations','count'),
('community-relations-13','Brand Visibility & Reach Score','Community Relations','percent'),
('property-management-5','Property Management Fee','Finance','USD'),
('real-estate-development-8','Developer Fee Earned','Real Estate Development','USD'),
('community-relations-1','Contributed Revenue','Community Relations','USD'),
('finance-5','Excess Cash to Parent','Finance','USD'),
('annual-policy-engagements','Engagements with Policy Decision-Makers','Community Relations','count'),
('annual-testimonies-op-eds','Testimonies / Op-Eds Delivered','Community Relations','count'),
('operations-3','User Engagement Rate (CRM & AM)',null,'percent'),
('finance-technology-cost-savings','Cost Savings from Technology','Finance','USD')
on conflict(id) do nothing;
-- Position metric permissions remain governed by Admin; no automatic write grants.
insert into compass_private.releases(version) values('20260923_workspace_roles') on conflict do nothing;
notify pgrst,'reload schema';
commit;
