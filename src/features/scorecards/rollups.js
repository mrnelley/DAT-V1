import { departmentMetrics, pillars, strategicMetrics, revenueMix } from '../planning/catalog.js';

const ids = (prefix, indexes) => indexes.map(i => `${prefix}-${i}`);
export const annualDomains = [
  ['Resident Impact', ids('resident-services',[1,2,3,4,5,6,7,8,9,10,11,12,13])],
  ['Financial Health', ids('finance',[1,2,3,4,8,12,13])],
  ['Talent Management', departmentMetrics.filter(m=>m.department==='Human Resources').map(m=>m.id)],
  ['Pipeline', ids('real-estate-development',[1,2,3,4,5,6,7,9])],
  ['Portfolio Performance', [...departmentMetrics.filter(m=>m.department==='Property Management' && m.id!=='property-management-5').map(m=>m.id),...ids('finance',[7,9,10,11])]],
  ['Brand Visibility', ids('community-relations',[13,14,15,16,17,18])],
  ['Revenue', ['property-management-5','asset-management-fees','real-estate-development-8','finance-5','finance-6',...ids('community-relations',[1,6,7,8,9,10,11,12])]],
  ['Advocacy', []],
  ['Operational Efficiency', ids('operations',[1,2,3,4,5,6,7])],
  ['Enterprise Priorities', []],
].map(([name,metricIds])=>({name,metricIds}));

// These are direct measures. Blended or cumulative outcomes remain independently reported.
const bindings = {'strategic-metric-5':'human-resources-1','strategic-metric-6':'human-resources-12','strategic-metric-10':'finance-1','strategic-metric-18':'resident-services-2'};
export function observations(data,id){return data.metrics.filter(m=>m.metricId===id);}
export function mixRollup(data){
  const streams=revenueMix.streams.map(s=>{
    const components=s.metricIds.map(id=>({id,name:departmentMetrics.find(m=>m.id===id).name,observations:observations(data,id)}));
    const complete=components.every(c=>c.observations.length>0);
    return {...s,components,complete,value:complete?components.flatMap(c=>c.observations).reduce((sum,m)=>sum+Number(m.value),0):null};
  });
  const total=streams.every(s=>s.complete)?streams.reduce((sum,s)=>sum+s.value,0):null;
  return {streams:streams.map(s=>({...s,share:total>0 && streams.every(x=>x.value>=0)?s.value/total*100:null})),total};
}
export function targetStatus(value,target){
  if(value==null || target.definitionPending || !Number.isFinite(value))return 'pending';
  const pass=target.operator==='gt'?value>target.value:target.operator==='gte'?value>=target.value:target.operator==='lte'?value<=target.value:target.operator==='lt'?value<target.value:target.operator==='range'?value>=target.value&&value<=target.upper:null;
  return pass==null?'pending':pass?'good':'watch';
}
export function groupStatus(metrics){
  if(metrics.some(m=>m.status==='risk'))return 'risk';
  if(metrics.some(m=>m.status==='watch'))return 'watch';
  return metrics.length && metrics.every(m=>m.status==='good')?'good':'pending';
}
export function strategicRollups(data){
  return pillars.map(p=>({...p,name:p.title,metrics:strategicMetrics.filter(m=>m.pillarId===p.id).map(m=>{
    const sourceId=bindings[m.id]||m.id;
    const readings=observations(data,sourceId);
    const value=readings.length===1?Number(readings[0].value):null;
    return {...m,sourceId,readings,value,status:targetStatus(value,m.target),mix:m.target.operator==='mix'?mixRollup(data):null};
  })})).map(p=>({...p,status:groupStatus(p.metrics)}));
}
export function initiativeRollups(data){
  return data.objectives.map(o=>({...o,status:groupStatus(o.updates.map(u=>({status:u.status||'pending'})))}));
}
export function annualRollups(data){
  return annualDomains.map(d=>({...d,metrics:d.metricIds.map(id=>{
    const readings=observations(data,id),target=data.targets?.find(t=>t.metricId===id);
    return {...departmentMetrics.find(m=>m.id===id),readings,target,status:target&&readings.length===1?targetStatus(Number(readings[0].value),target):'pending'};
  })})).map(d=>({...d,status:d.name==='Enterprise Priorities'?groupStatus(initiativeRollups(data)):groupStatus(d.metrics)}));
}
