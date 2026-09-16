import test from 'node:test';
import assert from 'node:assert/strict';
import { annualRollups, strategicRollups, mixRollup, initiativeRollups } from '../src/features/scorecards/rollups.js';
const base=()=>({metrics:[],objectives:[],contributions:[],targets:[]});
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
