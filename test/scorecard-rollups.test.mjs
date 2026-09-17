import test from 'node:test';
import assert from 'node:assert/strict';
import { annualRollups, strategicRollups, mixRollup, initiativeRollups, supplementalRollups } from '../src/features/scorecards/rollups.js';
const base=()=>({metrics:[],objectives:[],contributions:[],targets:[]});
test('2026 approved roster stays at 35 measures and supplemental readings do not change its signals',()=>{
 const data=base();data.metrics=[{metricId:'human-resources-4',department:'Human Resources',value:20}];data.targets=[{metricId:'human-resources-4',operator:'lte',value:5}];
 const annual=annualRollups(data),metrics=annual.flatMap(d=>d.metrics);
 assert.equal(metrics.length,35);assert.equal(new Set(metrics.map(m=>m.id)).size,35);
 assert.deepEqual(annual.map(d=>d.metrics.length),[7,5,3,4,5,3,4,2,2,0]);
 assert.deepEqual(annual[2].metrics.map(m=>m.name),['Employee Satisfaction Rate','Employee Engagement Rate','Employee Retention Rate (12-month)']);
 assert.ok(!metrics.some(m=>m.id==='human-resources-4'));assert.equal(annual[2].status,'pending');
 assert.equal(supplementalRollups(data).find(m=>m.id==='human-resources-4').status,'watch');
 assert.ok(supplementalRollups(data).every(m=>!metrics.some(a=>a.id===m.id)));
});
test('reported counts never stand in for the original annual rates',()=>{
 const data=base();data.metrics=[{metricId:'resident-services-4',value:100},{metricId:'resident-services-7',value:60},{metricId:'community-relations-17',value:2000}];
 const metrics=annualRollups(data).flatMap(d=>d.metrics);
 for(const id of ['annual-rs-utilization-rate','annual-service-partner-connection-rate','annual-positive-news'])assert.equal(metrics.find(m=>m.id===id).readings.length,0);
});
test('missing observations remain pending in all five pillars and ten annual domains',()=>{
 const data=base();assert.equal(annualRollups(data).length,10);assert.equal(strategicRollups(data).length,5);
 assert.ok([...annualRollups(data),...strategicRollups(data)].every(g=>g.status==='pending'));
});
test('revenue streams count contributions once, preserve zero and require all sources',()=>{
 const data=base();data.metrics=[['property-management-5',100],['asset-management-fees',0],['finance-5',50],['finance-6',50],['community-relations-1',100],['community-relations-2',100]].map(([metricId,value])=>({metricId,value,department:'Finance'}));
 assert.equal(mixRollup(data).total,300);assert.equal(mixRollup(data).streams[0].value,100);assert.ok(Math.abs(mixRollup(data).streams[2].share-100/3)<0.00001);
 data.metrics=data.metrics.filter(m=>m.metricId!=='finance-6');assert.equal(mixRollup(data).total,null);assert.equal(mixRollup(data).streams[0].share,null);
});
test('independent department readings are never averaged into an enterprise KPI',()=>{
 const data=base();data.metrics=[{metricId:'strategic-metric-17',department:'Resident Services',value:95},{metricId:'strategic-metric-17',department:'Property Management',value:60}];
 const metric=strategicRollups(data).flatMap(g=>g.metrics).find(m=>m.id==='strategic-metric-17');assert.equal(metric.value,null);assert.equal(metric.status,'pending');assert.equal(metric.readings.length,2);
});
test('annual targets use the selected year and direction; no target means no invented signal',()=>{
 const data=base();data.metrics=[{metricId:'finance-3',department:'Finance',value:100}];data.targets=[{metricId:'finance-3',operator:'lte',value:80}];
 const metric=annualRollups(data).flatMap(g=>g.metrics).find(m=>m.id==='finance-3');assert.equal(metric.status,'watch');data.targets[0].value=100;assert.equal(annualRollups(data)[1].metrics.find(m=>m.id==='finance-3').status,'good');
 assert.equal(annualRollups(data)[1].status,'pending');
});
test('priorities include those without submissions and surface the worst reported signal',()=>{
 const data=base();data.objectives=[{id:'one',updates:[{status:'good'},{status:'risk'}]},{id:'two',updates:[]}];const result=initiativeRollups(data);assert.equal(result[0].status,'risk');assert.equal(result[1].status,'pending');
});
