import {readFileSync,writeFileSync} from 'node:fs';
import {properties} from '../supabase/seeds/2026/properties.mjs';
import {approvedAnnualMetrics} from '../src/features/scorecards/annual2026.js';
const positions=readFileSync('supabase/releases/20260921_independent_positions.sql','utf8');
const admin=readFileSync('supabase/releases/20260919_command_center.sql','utf8');
const fn=(source,name)=>{
 const start=source.indexOf(`create or replace function ${name}(`);
 if(start<0)throw new Error(`Missing ${name}`);
 return source.slice(start,source.indexOf('$$;',start)+3);
};
const parts=[`begin;
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
end $$;`];
parts.push(fn(positions,'compass_private.can_read_metrics').replace("['executive','elt','director']","['executive','elt','olt','director']"));
for(const name of ['compass_private.weekly_access','compass_private.weekly_maintain','public.compass_admin_save_position']){
 parts.push(fn(positions,name).replaceAll("['executive','elt','director']","['executive','elt','olt']").replaceAll("['executive','elt','director','staff','external']","['executive','elt','olt','director','staff','external']"));
}
parts.push(fn(positions,'public.compass_access_context')
 .replace("'features',coalesce(p.features,'{}')", "'profile',(select jsonb_build_object('displayName',display_name,'photo',photo) from compass_private.profiles where user_id=auth.uid()),\n 'features','{\"myDashboard\":false}'::jsonb||coalesce(p.features,'{}')"));
// Profile table must precede the access-context definition.
parts.splice(parts.length-1,0,`create table if not exists compass_private.profiles (
 user_id uuid primary key references compass_private.members(user_id),
 display_name text not null default '' check(length(display_name)<=150),
 bio text not null default '' check(length(bio)<=1000),
 photo text check(photo is null or (length(photo)<=180000 and photo ~ '^data:image/jpeg;base64,[A-Za-z0-9+/=]+$')),
 revision integer not null default 1
);
alter table compass_private.profiles enable row level security;
revoke all on compass_private.profiles from public,anon,authenticated;`);
parts.push(readFileSync('supabase/templates/workspace-profile.sql','utf8'));
parts.push(`alter table compass_private.properties add column if not exists code text unique check(length(code) between 1 and 30);
alter table compass_private.properties add column if not exists street text check(length(street)<=200);
alter table compass_private.properties add column if not exists city text check(length(city)<=100);
alter table compass_private.properties add column if not exists state text check(state ~ '^[A-Z]{2}$');
alter table compass_private.properties add column if not exists postal_code text check(postal_code ~ '^[0-9]{5}(-[0-9]{4})?$');
alter table compass_private.properties add column if not exists population text check(length(population)<=250);`);
parts.push(fn(admin,'public.compass_admin_save_property')
 .replace('manager_id,resident_lead_id,active)', 'manager_id,resident_lead_id,active,code,street,city,state,postal_code,population)')
 .replace("coalesce((payload->>'active')::boolean,true))", "coalesce((payload->>'active')::boolean,true),"+[['code','code'],['street','street'],['city','city'],['state','state'],['postalCode','postal_code'],['population','population']].map(([key,column])=>`case when payload ? '${key}' then nullif(trim(payload->>'${key}'),'') else prior.${column} end`).join(',')+')')
 .replace('active=excluded.active,revision=', 'active=excluded.active,code=excluded.code,street=excluded.street,city=excluded.city,state=excluded.state,postal_code=excluded.postal_code,population=excluded.population,revision='));
const quote=v=>v==null?'null':`'${String(v).replaceAll("'","''")}'`;
parts.push(`-- Restore missing original scorecard definitions without altering existing governance.
insert into compass_private.metric_definitions(id,name,department,unit) values
${approvedAnnualMetrics.map(m=>'('+[m.id,m.name,m.department,m.unit].map(quote).join(',')+')').join(',\n')}
on conflict(id) do nothing;
-- Position metric permissions remain governed by Admin; no automatic write grants.
insert into compass_private.releases(version) values('20260923_workspace_roles') on conflict do nothing;
notify pgrst,'reload schema';
commit;`);
writeFileSync('supabase/releases/20260923_workspace_roles.sql',parts.join('\n\n')+'\n');
const propertyJson=JSON.stringify(properties).replaceAll("'","''");
writeFileSync('supabase/seeds/2026/properties.sql',`begin;
do $$ declare item jsonb; existing compass_private.properties; begin
 for item in select value from jsonb_array_elements('${propertyJson}'::jsonb) loop
  select * into existing from compass_private.properties where code=item->>'code';
  if found then continue; end if;
  select * into existing from compass_private.properties where name=item->>'name';
  if found then
   if existing.code is not null then raise exception 'Property name already has another code: %',existing.name; end if;
   update compass_private.properties set code=item->>'code',street=coalesce(street,item->>'street'),city=coalesce(city,item->>'city'),state=coalesce(state,item->>'state'),postal_code=coalesce(postal_code,item->>'postalCode'),population=coalesce(population,item->>'population'),revision=revision+1 where id=existing.id;
  else
   insert into compass_private.properties(name,code,street,city,state,postal_code,population,location)
   values(item->>'name',item->>'code',item->>'street',item->>'city',item->>'state',item->>'postalCode',item->>'population',concat_ws(', ',item->>'street',item->>'city',concat_ws(' ',item->>'state',item->>'postalCode')));
  end if;
 end loop;
end $$;
commit;
`);
