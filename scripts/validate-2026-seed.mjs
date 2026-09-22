import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
export function validateSeed(s){
 assert.equal(s.year,2026);assert.equal(s.format,'compass-annual-seed');
 const unique=(rows,label)=>{const ids=rows.map(r=>r.id);assert.equal(new Set(ids).size,ids.length,`${label}: duplicate IDs`);return new Set(ids);};
 const allObjectives=[...s.quarterlyObjectives,...s.archives.flatMap(a=>a.objectives)];
 const allWorkplans=[...s.departmentWorkplanPriorities,...s.archives.flatMap(a=>a.departmentPriorities)];
 const positions=unique(s.positions,'positions'),metrics=unique(s.metricDefinitions,'metrics'),objectives=unique(allObjectives,'objectives');
 const departments=unique(s.departments,'departments'),pillars=unique(s.strategicPlan.pillars,'pillars');
 const strategies=unique(s.strategicPlan.pillars.flatMap(p=>p.strategies),'strategies');
 unique(s.strategicPlan.objectives,'strategic objectives');unique(s.kpiDefinitions,'KPI sources');unique(s.reviewItems,'review items');
 assert.equal(departments.size,6);assert.ok(!departments.has('Operations')&&!departments.has('Advocacy'));
 assert.equal(pillars.size,5);assert.equal(strategies.size,15);assert.equal(s.strategicPlan.targets.length,19);
 assert.equal(s.kpiDefinitions.length,66);assert.equal(s.archives.flatMap(a=>a.departmentPriorities).length,40);assert.equal(s.departmentWorkplanPriorities.length,180);unique(allWorkplans,'workplan priorities');for(const row of s.departmentWorkplanPriorities){assert.ok(departments.has(row.department));assert.equal(row.year,2026);}
 const assertOwners=row=>{assert.ok(row.ownerPositionIds.length,`Owner missing: ${row.id}`);for(const id of [...row.ownerPositionIds,...row.contributorPositionIds])assert.ok(positions.has(id),`Unknown position ${id}`);};
 for(const p of s.positions){assert.equal(p.occupants.length,0);assert.ok(p.department===null||departments.has(p.department));assert.ok(!p.roles.includes('admin'));}
 for(const m of s.metricDefinitions){assertOwners(m);assert.ok(m.department===null||departments.has(m.department));assert.equal(m.executableFormula,null);}
 for(const k of s.kpiDefinitions){assertOwners(k);assert.ok(k.metricIds.length);for(const id of k.metricIds)assert.ok(metrics.has(id),`KPI ${k.id} has unknown metric ${id}`);}
 for(const o of s.quarterlyObjectives){assertOwners(o);assert.ok(o.pillarId===null||pillars.has(o.pillarId));assert.ok(o.proposedStrategyId===null||strategies.has(o.proposedStrategyId));assert.equal(o.observedAt,null);if(!o.title||!o.pillarId)assert.equal(o.importStatus,'hold-unresolved-source');}
 for(const o of s.strategicPlan.objectives)assert.ok(strategies.has(o.strategyId));
 for(const o of allWorkplans){assertOwners(o);for(const id of o.enterpriseObjectiveIds)assert.ok(objectives.has(id));}
 for(const o of s.quarterlyObjectives)for(const link of o.metricLinks)assert.ok(metrics.has(link.metricId));
 const kpiSources=new Set(s.kpiDefinitions.map(k=>k.id));
 for(const t of s.annualTargets){assert.ok(kpiSources.has(t.sourceRef));for(const id of t.metricIds)assert.ok(metrics.has(id));assert.equal(t.actual,0);assert.equal(t.actualOrigin,'user-default-for-unknown');}
 for(const m of s.metricDefinitions)for(const ref of m.definitionRefs)assert.ok(kpiSources.has(ref));
 for(const t of [...s.quarterlyTargets,...s.reportedFacts,...s.archives.flatMap(a=>[...a.targets,...a.reportedFacts])])assert.ok(objectives.has(t.objectiveId));
 for(const f of s.reportedFacts){assert.equal(f.eligibleForAutomaticRollup,false);assert.equal(f.observedAt,null);assert.ok(Number.isFinite(f.value));}
 for(const l of s.objectiveContinuity)assert.ok(objectives.has(l.from)&&objectives.has(l.to));
 const grants=new Set();for(const g of s.metricPositionGrants){assert.ok(metrics.has(g.metricId)&&positions.has(g.positionId)&&departments.has(g.department));const key=[g.metricId,g.positionId,g.department].join('|');assert.ok(!grants.has(key),'Duplicate permission');grants.add(key);assert.equal(g.replaceExisting,false);}
 for(const stream of s.strategicPlan.revenueMix.streams)for(const id of [...stream.metricIds,...(stream.componentMetricIds||[])])assert.ok(metrics.has(id));
 assert.deepEqual(s.strategicPlan.revenueMix.streams[2].metricIds,['community-relations-1']);
 assert.deepEqual(s.strategicPlan.revenueMix.streams[1].metricIds,['finance-5','finance-6']);
 for(const key of ['people','positionOccupancies','points','historicalWeeklySubmissions'])assert.deepEqual(s[key],[],`${key} must stay empty`);
 assert.equal(s.importPolicy.createAuthUsers,false);assert.equal(s.importPolicy.createHistoricalPoints,false);
 assert.ok(!/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(JSON.stringify(s)),'No email addresses in seed');
 for(const a of s.archives){assert.equal(a.readOnly,true);assert.equal(a.visibility,'admin-data-table-only');}
 assert.ok(s.quarterlyObjectives.every(o=>o.period==='2026-Q3'));
 assert.equal(s.openingMetricBalances[0].value,750000);
 return {positions:positions.size,departments:departments.size,pillars:pillars.size,strategies:strategies.size,strategicObjectives:s.strategicPlan.objectives.length,strategicTargets:s.strategicPlan.targets.length,KPISourceRows:s.kpiDefinitions.length,metricDefinitions:metrics.size,Q1ArchivedObjectives:s.archives[0].objectives.length,Q2ArchivedObjectives:s.archives[1].objectives.length,Q3Objectives:s.quarterlyObjectives.length,Q1DepartmentPriorities:s.archives.flatMap(a=>a.departmentPriorities).length,DepartmentalPriorities:s.departmentWorkplanPriorities.length,draftWorkplanObjectives:s.workplanReferences.reduce((n,d)=>n+d.objectives.length,0),reportedFacts:s.reportedFacts.length,reviewItems:s.reviewItems.length};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)console.log(validateSeed(JSON.parse(readFileSync(new URL('../supabase/seeds/2026/compass-2026.seed.json',import.meta.url),'utf8'))));
