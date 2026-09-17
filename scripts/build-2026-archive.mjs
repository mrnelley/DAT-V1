import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const s=JSON.parse(readFileSync('supabase/seeds/2026/compass-2026.seed.json','utf8'));
const rows=s.archives.flatMap(a=>[...a.objectives,...a.departmentPriorities].map(o=>({id:o.id,period:a.id,content:{...o,
 positionTitles:o.ownerPositionIds.map(id=>s.positions.find(p=>p.id===id).title),
 relatedProjectPlans:o.relatedProjectPlans||[],reportedFacts:a.reportedFacts.filter(f=>f.objectiveId===o.id),targets:a.targets.filter(t=>t.objectiveId===o.id),readOnly:true}})));
const q=v=>`'${String(v).replaceAll("'","''")}'`;
const sql=rows.map(r=>{const body=JSON.stringify(r.content),hash=createHash('sha256').update(body).digest('hex');return `do $$ begin
 if exists(select 1 from compass_private.historical_archive where id=${q(r.id)} and content_hash<>${q(hash)}) then raise exception 'Archive content differs for ${r.id}; existing history was not overwritten'; end if;
 insert into compass_private.historical_archive(id,period,content,content_hash) values(${q(r.id)},${q(r.period)},${q(body)}::jsonb,${q(hash)}) on conflict(id) do nothing;
end $$;`;}).join('\n');
writeFileSync('supabase/seeds/2026/archive.sql',`-- Immutable Q1/Q2 notes only. No users, live observations or scores.\nbegin;\n${sql}\ncommit;\n`);
console.log(`${rows.length} archive records packaged; no database writes.`);
