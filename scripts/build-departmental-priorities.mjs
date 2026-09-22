import {readFileSync,writeFileSync} from 'node:fs';
import {departmentalPriorities} from '../supabase/seeds/2026/departmental-priorities.mjs';
const source=readFileSync('supabase/releases/20260917_weekly_accountability.sql','utf8');
function fn(code,name){const i=code.indexOf(`create or replace function ${name}(`);if(i<0)throw new Error(name);return code.slice(i,code.indexOf('end; $$;',i)+8);}
// The validator has a newline before $$; unlike the context function.
const validatorStart=source.indexOf('create or replace function compass_private.validate_weekly_document(');
let validator=source.slice(validatorStart,source.indexOf('$$;',source.indexOf('as $$',validatorStart)+5)+3);
validator=validator.replace(' if not finalizing then return; end if;',` -- Legacy submissions remain readable; newly typed entries have explicit links.
 for entry in select value from jsonb_array_elements(document->'entries') loop
  if entry ? 'commitmentType' and coalesce(entry->>'commitmentType','') not in ('enterprise','department') then raise exception 'Choose a commitment type'; end if;
  if nullif(entry->>'departmentPriorityId','') is not null and (entry->>'commitmentType' is distinct from 'department' or nullif(entry->>'objectiveId','') is not null) then raise exception 'Choose one commitment type per priority'; end if;
  if entry->>'commitmentType'='department' and nullif(entry->>'objectiveId','') is not null then raise exception 'A departmental priority cannot also be an enterprise commitment'; end if;
  if entry->>'commitmentType'='enterprise' and nullif(entry->>'departmentPriorityId','') is not null then raise exception 'Choose one commitment type per priority'; end if;
  if nullif(entry->>'departmentPriorityId','') is not null and not exists(select 1 from compass_private.departmental_priorities d where d.id=entry->>'departmentPriorityId' and d.active) then raise exception 'Choose an active department workplan priority'; end if;
  if finalizing and entry->>'commitmentType'='department' and nullif(entry->>'departmentPriorityId','') is null then raise exception 'Choose the department workplan priority for each departmental commitment'; end if;
  if finalizing and entry->>'commitmentType'='enterprise' and nullif(entry->>'objectiveId','') is null then raise exception 'Choose an enterprise objective for each enterprise commitment'; end if;
 end loop;
 if not finalizing then return; end if;`);
let context=fn(source,'public.compass_weekly_context');
context=context.replace("'positionTitle',(select position_title from compass_private.members where user_id=auth.uid()),", "'positionId',compass_private.current_position(),\n  'positionTitle',coalesce((select title from compass_private.positions where id=compass_private.current_position()),(select position_title from compass_private.members where user_id=auth.uid())),\n  'departmentalObjectives',(select coalesce(jsonb_agg(jsonb_build_object('id',d.id,'title',d.title,'department',d.department,'year',d.year,'active',d.active) order by d.department,d.title),'[]') from compass_private.departmental_priorities d where d.year=extract(year from selected_week)),");
let save=fn(readFileSync('supabase/releases/20260924_departmental_scoring.sql','utf8'),'compass_private.save_weekly');
save=save.replace(' perform compass_private.validate_weekly_document(document,finalizing);',` perform compass_private.validate_weekly_document(document,finalizing);
 if exists(select 1 from jsonb_array_elements(document->'entries') e join compass_private.departmental_priorities d on d.id=e->>'departmentPriorityId' where d.year<>extract(year from week_date)) then raise exception 'Choose a departmental priority for the submission year'; end if;`);
const q=v=>`'${String(v).replaceAll("'","''")}'`;
const sql=`begin;
create table if not exists compass_private.departmental_priorities (
 id text primary key, year integer not null check(year between 2026 and 2100),
 title text not null check(length(trim(title)) between 1 and 1200),
 department text not null references compass_private.departments(name),
 active boolean not null default true,source_file text not null,source_refs jsonb not null
);
alter table compass_private.departmental_priorities enable row level security;
revoke all on compass_private.departmental_priorities from public,anon,authenticated;
insert into compass_private.departmental_priorities(id,year,title,department,source_file,source_refs) values
${departmentalPriorities.map(p=>`(${q(p.id)},2026,${q(p.title)},${q(p.department)},${q(p.sourceFile)},${q(JSON.stringify(p.sourceRefs))}::jsonb)`).join(',\n')}
on conflict(id) do nothing;

${validator}

${context}

${save}

insert into compass_private.releases(version) values('20260925_departmental_priorities') on conflict do nothing;
notify pgrst,'reload schema';
commit;
`;
writeFileSync('supabase/releases/20260925_departmental_priorities.sql',sql);
console.log(`Prepared ${departmentalPriorities.length} departmental priorities in ${new Set(departmentalPriorities.map(p=>p.department)).size} departments.`);
