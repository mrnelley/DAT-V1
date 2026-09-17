import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateSeed} from '../scripts/validate-2026-seed.mjs';
const s=JSON.parse(readFileSync(new URL('../supabase/seeds/2026/compass-2026.seed.json',import.meta.url),'utf8'));
const source=JSON.parse(readFileSync(new URL('../supabase/seeds/2026/kpi-source.json',import.meta.url),'utf8'));
const metric=id=>s.metricDefinitions.find(m=>m.id===id);
test('source definitions survive while only Q3 remains active and the skipped rollout stays out',()=>{
 const counts=validateSeed(s);assert.equal(counts.Q1ArchivedObjectives,24);assert.equal(counts.Q2ArchivedObjectives,14);assert.equal(counts.Q3Objectives,14);
 assert.equal(s.archives[0].departmentPriorities.length,40);
 for(const row of source){const k=s.kpiDefinitions.find(k=>k.id===row.id);assert.equal(k.sourceName,row.name);assert.equal(k.calculation.sourceFormula,row.formula||null);}
 assert.ok(!s.archives.flatMap(a=>a.objectives).some(o=>o.id==='2026-Q1-25'));
 assert.equal(s.sourceAliases.find(a=>a.sourceId==='2026-Q3-6').targetId,'2026-Q3-7');
 assert.equal(s.quarterlyObjectives.filter(o=>o.title==='Advance College Ave Phase 2 Closing').length,1);
 assert.ok(!s.quarterlyObjectives.find(o=>o.id==='2026-Q3-7').progressNote.includes('scattered-site'));
});
test('position ownership and coverage do not create identities',()=>{
 for(const m of s.metricDefinitions.filter(m=>m.department==='Real Estate Development'))for(const positionId of ['position-red','position-project-management'])assert.ok(s.metricPositionGrants.some(g=>g.metricId===m.id&&g.positionId===positionId&&g.canWrite));
 assert.deepEqual(s.kpiDefinitions[0].ownerPositionIds,['position-cfo']);
 assert.ok(s.positionCoverage.some(c=>c.positionId==='position-vp-impact-advancement'&&c.coversPositionId==='position-cr'));
 assert.equal(metric('pm-occupancy-rate').department,'Property Management');assert.equal(metric('finance-11').department,'Finance');
 assert.equal(s.people.length+s.positionOccupancies.length+s.points.length,0);
});
test('manual counts, windows, statuses and zero origins reflect calibration decisions',()=>{
 assert.ok(s.metricDefinitions.every(m=>m.statusMode==='manual'&&m.initialValue===0&&m.initialValueOrigin==='default-zero-not-an-observation'));
 assert.deepEqual(s.kpiDefinitions[4].metricIds,['hr-retention-6-month','hr-retention-12-month']);
 assert.deepEqual(metric('cr-website-sessions').lookbackMonths,{default:12,allowed:[3,6,12]});
 assert.equal(s.kpiDefinitions[25].metricIds.length,5);
 assert.equal(metric('resident-services-4').unit,'count');assert.equal(metric('resident-services-4').optionalDenominatorMetricIds.length,2);
 assert.equal(metric('resident-services-7').name,'Referrals Made');assert.equal(metric('rs-service-partner-connections').name,'Referrals Connected');
 assert.equal(metric('pm-capex-on-track').denominatorMetricId,'pm-capex-total');
 assert.equal(metric('pm-compliance-consultant-spend-change').reportingSource,'Salesforce');
 assert.equal(metric('property-management-12').durationBasis,'elapsed-days');assert.equal(s.moveOutClassification.death,'neutral');
 assert.equal(s.strategicPlan.revenueMix.automaticStatus,false);
});
test('one opening balance replaces old contributions without inventing categories or a cutoff',()=>{
 assert.equal(s.openingMetricBalances.length,1);assert.equal(s.openingMetricBalances[0].value,750000);assert.equal(s.openingMetricBalances[0].categoryId,null);
 assert.ok(!s.reportedFacts.some(f=>f.objectiveId==='2026-Q3-4'));
 assert.ok(!s.archives.flatMap(a=>a.reportedFacts).some(f=>f.objectiveId==='2026-Q2-4'));
 assert.ok(s.reviewItems.some(i=>i.id==='opening-cutoff'));
 for(const id of ['community-relations-2','community-relations-3','community-relations-4','community-relations-5'])assert.ok(s.metricPositionGrants.filter(g=>g.metricId===id).every(g=>!g.canWrite));
});
test('six draft workplans remain references and active data has no 2025 training observation',()=>{
 assert.equal(s.workplanReferences.length,6);assert.ok(s.workplanReferences.every(d=>d.objectives.length&&d.sha256.length===64));
 assert.ok(s.workplanReferences.flatMap(d=>d.objectives).every(o=>o.authority==='early-draft-reference-only'));
 assert.ok(!JSON.stringify(s.reportedFacts).includes('Nov-Jan 2025'));
 assert.ok(!s.quarterlyObjectives.find(o=>o.id==='2026-Q3-9').progressNote.includes('Nov-Jan 2025'));
});
test('invalid ownership, duplicated access and invented identities fail validation',()=>{
 for(const mutate of [c=>c.quarterlyObjectives[0].ownerPositionIds=['missing'],c=>c.metricPositionGrants.push(c.metricPositionGrants[0]),c=>c.people.push({id:'invented'})]){const c=structuredClone(s);mutate(c);assert.throws(()=>validateSeed(c));}
});
