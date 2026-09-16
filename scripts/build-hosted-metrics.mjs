import { build } from 'esbuild';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { departmentMetrics, contributedRevenueCategories, strategicMetrics } from '../src/features/planning/catalog.js';

const quote = value => value == null ? 'null' : `'${String(value).replaceAll("'", "''")}'`;
const rows = departmentMetrics.map(m => `(${[m.id,m.name,m.department,m.trackingArea,m.unit].map(quote).join(',')})`).join(',\n');
const categories = contributedRevenueCategories.map(c => `(${quote(c.id)},${quote(c.label)})`).join(',');
const strategicRows = strategicMetrics.filter(m=>!['strategic-metric-5','strategic-metric-6','strategic-metric-9','strategic-metric-10','strategic-metric-18'].includes(m.id)).map(m=>`(${[m.id,m.name,null,'2030 outcomes',m.target.unit].map(quote).join(',')})`).join(',\n');
writeFileSync('supabase/releases/20260918_strategic_measures.sql',`begin;\ninsert into compass_private.metric_definitions(id,name,department,tracking_area,unit) values\n${strategicRows}\non conflict(id) do update set name=excluded.name,unit=excluded.unit;\ninsert into compass_private.releases(version) values('20260918_strategic_measures') on conflict do nothing;\nnotify pgrst,'reload schema';\ncommit;\n`);
writeFileSync('supabase/releases/20260916_metric_catalog.sql', `begin;
insert into compass_private.metric_definitions(id,name,department,tracking_area,unit) values
${rows}
on conflict(id) do update set name=excluded.name,department=excluded.department,tracking_area=excluded.tracking_area,unit=excluded.unit;
insert into compass_private.contribution_categories(id,label) values ${categories} on conflict(id) do update set label=excluded.label;
insert into compass_private.releases(version) values('20260916_metric_catalog') on conflict do nothing;
commit;
`);
const env = { ...Object.fromEntries((existsSync('.env') ? readFileSync('.env','utf8') : '').split(/\r?\n/).filter(l => l.includes('=') && !l.trim().startsWith('#'))
  .map(l => { const i=l.indexOf('='); return [l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^['"]|['"]$/g,'')]; })), ...process.env };
const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY;
if (!url || !key) throw new Error('Public Supabase URL and browser key are required');
if (!key.startsWith('sb_publishable_')) {
  const claims = JSON.parse(Buffer.from(key.split('.')[1] || '', 'base64url').toString());
  if (claims.role !== 'anon') throw new Error('Only an anon or publishable key may be bundled');
}
await build({ entryPoints: ['src/features/metric-entry/hostedStore.js'], bundle: true, minify: true,
  format:'iife',platform:'browser',outfile:'public/compass/hosted-store.js',
  define: { 'process.env.COMPASS_SUPABASE_URL':JSON.stringify(url), 'process.env.COMPASS_SUPABASE_KEY':JSON.stringify(key) } });
console.log('Built hosted metric client and versioned catalog seed (no credentials printed).');
