// Repository seed candidate only. Never reads browser storage or writes to Supabase.
// Run: node --import tsx scripts/export-planning-seed.mjs
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { strategicPlan2030, priorities } from '../src/data/mockData.js';

const pillarIds = new Set(strategicPlan2030.pillars.map(pillar => pillar.id));
assert.equal(pillarIds.size, 5, 'Expected five distinct strategic pillars');
const priorityIds = new Set();
for (const priority of priorities) {
  assert.ok(priority.id && !priorityIds.has(priority.id), 'Priority IDs must be unique');
  priorityIds.add(priority.id);
  assert.ok(pillarIds.has(priority.strategicPillarId), `Unresolved pillar: ${priority.id}`);
  assert.match(priority.reportingPeriodId, /^\d{4}-Q[1-4]$/);
}

const manifest = {
  formatVersion: 1,
  source: 'src/data/mockData.js and its imported workbook scaffold',
  status: 'candidate: compare with saved browser/live-app edits before hosted import',
  excludedCollections: ['users', 'weeklyEntries', 'tasks', 'stucks', 'huddles', 'departmentWorkplans'],
  strategicPlan: strategicPlan2030,
  quarterlyPriorities: priorities,
};
const destination = new URL('../supabase/seeds/planning-candidate.json', import.meta.url);
mkdirSync(new URL('../supabase/seeds/', import.meta.url), { recursive: true });
writeFileSync(destination, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify({ pillars: pillarIds.size, quarterlyPriorityLanes: priorityIds.size,
  objectives: priorities.reduce((count, priority) => count + (priority.keyObjectives?.length || 0), 0),
  destination: 'supabase/seeds/planning-candidate.json', remoteWrites: 0 }));
