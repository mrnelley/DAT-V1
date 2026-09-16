import { readFileSync, writeFileSync } from 'node:fs';
import { quarterlyObjectives } from '../src/features/planning/catalog.js';
const q=value=>`'${String(value).replaceAll("'","''")}'`;
writeFileSync('supabase/releases/20260917_weekly_objectives.sql', `begin;
insert into compass_private.enterprise_objectives(id,title,pillar_id,area,period) values
${quarterlyObjectives.map(o=>`(${[o.id,o.title,o.pillarId,o.area,o.period].map(q).join(',')})`).join(',\n')}
on conflict(id) do update set title=excluded.title,pillar_id=excluded.pillar_id,area=excluded.area,period=excluded.period;
insert into compass_private.releases(version) values('20260917_weekly_objectives') on conflict do nothing;
commit;
`);
// Harden the already deployed metric correction function without replaying its baseline.
const baseline=readFileSync('supabase/releases/20260916_metric_entry.sql','utf8');
const start=baseline.indexOf('create or replace function public.compass_save_metric_entry(');
const end=baseline.indexOf('create or replace function public.compass_set_metric_member(',start);
const rpc=baseline.slice(start,end).replace("if existing.revision<>(payload->>'expectedRevision')::integer then", "if existing.revision is distinct from (payload->>'expectedRevision')::integer then");
writeFileSync('supabase/releases/20260917_metric_revision_guard.sql', `begin;\n${rpc}\ninsert into compass_private.releases(version) values('20260917_metric_revision_guard') on conflict do nothing;\ncommit;\n`);
console.log('Generated weekly objective seed and metric revision guard.');
