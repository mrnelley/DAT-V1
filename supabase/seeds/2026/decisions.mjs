import {readFileSync} from 'node:fs';
export function apply2026Decisions(s){
 const metric=id=>s.metricDefinitions.find(m=>m.id===id);
 const kpi=n=>s.kpiDefinitions[n-1];
 const add=(id,name,department,owner,unit='count')=>{
  if(!metric(id))s.metricDefinitions.push({id,name,department,trackingArea:null,year:2026,unit,sourceRefs:['2026-calibration-decisions'],definitionRefs:[],calculationMode:'owner-reported',executableFormula:null,ownerPositionIds:[owner],contributorPositionIds:[],departmentIds:department?[department]:[],cadence:null,mappingStatus:'user-confirmed'});
  return metric(id);
 };
 const setOwner=(n,owner)=>{kpi(n).ownerPositionIds=[owner];for(const id of kpi(n).metricIds)metric(id).ownerPositionIds=[owner];};
 s.decisionsVersion='2026-09-17';
 s.positions.push({id:'position-vp-impact-advancement',title:'VP of Impact and Advancement',department:'Community Relations',roles:['elt'],rolesStatus:'configured-role-type',active:true,occupants:[],requiredWeekly:true,importIdentity:{resolveExistingBy:'exact title and department',preserveExistingId:true,onAmbiguity:'stop'},scoringBegins:'Only after an active confirmed occupant is assigned'});
 s.positionCoverage=[{positionId:'position-vp-impact-advancement',coversPositionId:'position-cr',scope:'Community Relations work and metric permissions',source:'user-confirmed',createsPerson:false}];
 for(const m of s.metricDefinitions.filter(m=>m.ownerPositionIds.includes('position-cr')))m.contributorPositionIds=[...new Set([...m.contributorPositionIds,'position-vp-impact-advancement'])];
 for(const n of [1,11,12,18])setOwner(n,'position-cfo');
 Object.assign(metric('finance-pm-fee-percent'),{name:'Average PM fee realization against development forecast',definition:'Manually reported portfolio average of realized PM fee percentages against PM fee percentages forecast at property entry into the portfolio.',unit:'percent',ownerPositionIds:['position-cfo']});
 Object.assign(metric('property-management-5'),{ownerPositionIds:['position-cfo'],reportingDepartment:'Finance'});
 kpi(13).ownerPositionIds=['position-cfo'];
 kpi(12).calculation.currentDefinition=metric('finance-pm-fee-percent').definition;
 metric('human-resources-2').entryMode='read-only';metric('human-resources-2').replacedForEntryBy=['hr-retention-6-month','hr-retention-12-month'];
 for(const months of [6,12])add(`hr-retention-${months}-month`,`${months}-month employee retention`,'Human Resources','position-hr','percent');
 kpi(5).metricIds=['hr-retention-6-month','hr-retention-12-month'];
 add('finance-potential-rent','Total potential rent','Finance','position-cfo','USD');
 add('finance-actual-rent-collected','Actual rent collected','Finance','position-cfo','USD');
 add('pm-occupancy-rate','Occupancy Rate','Property Management','position-pm','percent');
 Object.assign(metric('finance-11'),{name:'Economic Occupancy Rate',unit:'percent',ownerPositionIds:['position-cfo']});
 kpi(20).metricIds=['finance-potential-rent','finance-actual-rent-collected','pm-occupancy-rate','finance-11'];
 kpi(20).calculation.currentDefinition='Potential rent and actual rent are entered separately. PM reports Occupancy Rate; CFO separately reports Economic Occupancy Rate and assesses unit performance.';
 s.reportingHelpers=[{id:'rent-shortfall',name:'Rent shortfall',operation:'subtract',leftMetricId:'finance-potential-rent',rightMetricId:'finance-actual-rent-collected',unit:'USD',matchingScope:['reporting-period','portfolio'],signal:'Positive: shortfall; zero: no difference; negative: surplus.',requiresReportedInputs:true,changesManualStatus:false}];
 for(const id of kpi(20).metricIds)metric(id).reportingStatus='manual';
 for(const id of ['cr-website-sessions','cr-unique-website-users'])Object.assign(metric(id),{lookbackMonths:{default:12,allowed:[3,6,12]},calculationMode:'owner-reported'});
 const newsletter=[['cr-newsletter-total-opens','Newsletter total opens'],['cr-newsletter-unique-opens','Newsletter unique opens'],['cr-newsletter-sent','Newsletter emails sent'],['cr-newsletter-delivered','Newsletter emails delivered']];
 for(const [id,name] of newsletter)add(id,name,'Community Relations','position-cr');
 kpi(26).metricIds=['cr-newsletter-open-rate',...newsletter.map(([id])=>id)];
 metric('cr-newsletter-open-rate').definition='Manually reported open rate; currently relates to total opens and emails sent. All four component counts retained independently.';
 Object.assign(metric('community-relations-17'),{name:'Earned media reach',unit:'reach',annualTarget:1,targetSource:'user-set-initial-target'});
 Object.assign(metric('resident-services-4'),{name:'Resident Services utilization count',unit:'count',definition:'Manually reported utilization count; no rate calculation.'});
 add('rs-total-units-available','Total units available to be served','Resident Services','position-rs','units');
 add('rs-total-residents-available','Total residents available to be served','Resident Services','position-rs','residents');
 metric('resident-services-4').optionalDenominatorMetricIds=['rs-total-units-available','rs-total-residents-available'];
 s.moveOutClassification={death:'neutral',rateCalculation:'manual'};
 Object.assign(metric('resident-services-7'),{name:'Referrals Made',unit:'referrals'});
 Object.assign(metric('rs-service-partner-connections'),{name:'Referrals Connected',unit:'referrals'});
 for(const n of [47,49])kpi(n).metricIds=['resident-services-7','rs-service-partner-connections'];
 Object.assign(metric('property-management-14'),{entryMode:'read-only',replacedForEntryBy:['pm-capex-on-track','pm-capex-total'],calculationMode:'display-pair',executableFormula:null});
 add('pm-capex-on-track','Capital expenditure projects on track','Property Management','position-pm','projects');
 add('pm-capex-total','Total capital expenditure projects','Property Management','position-pm','projects');
 kpi(55).metricIds=['pm-capex-on-track','pm-capex-total'];
 metric('pm-capex-on-track').denominatorMetricId='pm-capex-total';
 metric('pm-compliance-consultant-spend-change').reportingSource='Salesforce';
 metric('property-management-12').durationBasis='elapsed-days';
 s.strategicPlan.revenueMix.statusMode='manual';s.strategicPlan.revenueMix.automaticStatus=false;
 for(const t of s.strategicPlan.targets){t.statusMode='manual';t.actual=0;t.actualOrigin='user-default-for-unknown';if(t.target.value===null){t.target.value=0;t.target.valueOrigin='user-default-for-unknown';}}
 for(const m of s.metricDefinitions){m.statusMode='manual';m.initialValue=0;m.initialValueOrigin='default-zero-not-an-observation';if(m.entryMode!=='read-only')m.calculationMode='owner-reported';}
 for(const k of s.kpiDefinitions){k.calculation.mode='owner-reported';k.calculation.executable=null;k.calculation.status='manual-reporting';k.reviewIds=[];if(k.calculation.recipe)k.calculation.recipe.enabled=false;}
 for(const t of s.annualTargets){t.actual=0;t.actualOrigin='user-default-for-unknown';if(t.baseline===null){t.baseline=0;t.baselineOrigin='user-default-for-unknown';}if(t.value===null){t.value=0;t.valueOrigin='user-default-for-unknown';}}
 s.numericDefaults={unknown:0,origin:'user-default-for-unknown',status:'manually-set',appliesTo:'Numeric input values and unknown baselines only; never IDs, dates or evidence of an actual measurement.'};
 s.workplanReferences=JSON.parse(readFileSync(new URL('./workplan-source.json',import.meta.url),'utf8'));
 const ownerByDepartment=Object.fromEntries(s.positions.filter(p=>p.department&&p.id!=='position-project-management'&&p.id!=='position-vp-impact-advancement').map(p=>[p.department,p.id]));
 for(const doc of s.workplanReferences){doc.ownerPositionIds=[ownerByDepartment[doc.department]];doc.use='Structural reference. Latest user decisions override early draft numbers, dates, statuses and removed measures.';}
 // A related-project column can point to work from any department; it is not an initiative's own plan.
 for(const o of s.quarterlyObjectives){o.relatedProjectPlans=o.projectPlanTitle?[{title:o.projectPlanTitle,relationship:'related-work-across-departments'}]:[];delete o.projectPlanTitle;delete o.displacedProjectReference;}
 const duplicate=s.quarterlyObjectives.find(o=>o.id==='2026-Q3-6'),college=s.quarterlyObjectives.find(o=>o.id==='2026-Q3-7');
 college.additionalKpiText=duplicate.kpiText;
 s.sourceAliases=[{sourceId:duplicate.id,targetId:college.id,reason:'User confirmed this row relates to advancing College Ave Phase 2 closing.'}];
 s.unassignedSourceNotes=[{sourceId:duplicate.id,note:duplicate.progressNote,reason:'The supplied 9%/scattered-site notes do not describe College Ave closing; preserved for review without attaching them to its progress.'}];
 s.excludedSourceRows=[{id:'2026-Q1-25',reason:'User requested this rollout row be skipped.'}];
 s.quarterlyObjectives=s.quarterlyObjectives.filter(o=>!['2026-Q3-6','2026-Q1-25'].includes(o.id));
 const fundraising=s.quarterlyObjectives.find(o=>o.id==='2026-Q3-4');
 fundraising.progressNote='Q3 contributed revenue goal achieved and currently exceeded; opening seed value $750,000.';fundraising.status='good';fundraising.statusLabel='Exceeding goal';
 s.openingMetricBalances=[{id:'2026-q3-contributed-revenue-opening',metricId:'community-relations-1',value:750000,unit:'USD',basis:'user-confirmed-opening-ytd-balance',period:'2026-Q3',categoryId:null,categoryAllocation:'unallocated-do-not-invent',status:'good',statusLabel:'Exceeding goal',ownerPositionIds:['position-cr'],contributorPositionIds:['position-vp-impact-advancement'],combineWithFutureEntries:'Only add new contributions after the agreed opening cutoff; never add earlier category history to this balance.'}];
 const training=s.quarterlyObjectives.find(o=>o.id==='2026-Q3-9');
 training.progressNote=training.progressNote.replace('Nov-Jan 2025 2.96/5; ','');
 s.reportedFacts=s.reportedFacts.filter(f=>!['2026-Q1-2','2026-Q2-4','2026-Q3-4'].includes(f.objectiveId)&&!f.name.includes('Nov-Jan 2025'));
 for(const id of ['2026-Q1-2','2026-Q2-4']){const row=s.quarterlyObjectives.find(o=>o.id===id);row.progressNote='Prior contributed-revenue progress excluded by user instruction.';}
 s.quarterlyObjectives.find(o=>o.id==='2026-Q1-3').pillarId='diversify-innovate';
 for(const o of s.departmentWorkplanPriorities)o.enterpriseObjectiveIds=o.enterpriseObjectiveIds.filter(id=>id!=='2026-Q1-25');
 s.archives=['2026-Q1','2026-Q2'].map(period=>({id:period,readOnly:true,visibility:'admin-data-table-only',
  objectives:s.quarterlyObjectives.filter(o=>o.period===period),departmentPriorities:s.departmentWorkplanPriorities.filter(o=>o.period===period),
  reportedFacts:s.reportedFacts.filter(f=>s.quarterlyObjectives.some(o=>o.id===f.objectiveId&&o.period===period)),targets:s.quarterlyTargets.filter(t=>s.quarterlyObjectives.some(o=>o.id===t.objectiveId&&o.period===period))}));
 s.quarterlyObjectives=s.quarterlyObjectives.filter(o=>o.period==='2026-Q3');s.departmentWorkplanPriorities=[];
 s.reportedFacts=s.reportedFacts.filter(f=>s.quarterlyObjectives.some(o=>o.id===f.objectiveId));s.quarterlyTargets=s.quarterlyTargets.filter(t=>s.quarterlyObjectives.some(o=>o.id===t.objectiveId));
 s.metricPositionGrants=[];
 for(const m of s.metricDefinitions){const departments=m.department?[m.department]:m.id==='asset-management-fees'?['Finance']:s.departments.map(d=>d.id);
  for(const p of [...new Set([...m.ownerPositionIds,...m.contributorPositionIds])])for(const department of departments)s.metricPositionGrants.push({metricId:m.id,positionId:p,department,canWrite:m.entryMode!=='read-only',status:'position-permission',replaceExisting:false});
 }
 s.reviewItems=[
  {id:'opening-cutoff',scope:['community-relations-1'],message:'Choose the effective cutoff for the $750,000 opening YTD balance before loading subsequent contribution records. Do not invent category allocation.',blocks:'opening-balance-posting',resolution:null},
  {id:'q3-source-note',scope:['2026-Q3-6'],message:'Row 6 is mapped to College Ave Phase 2 per instruction. Its 9%/scattered-site progress note is retained separately, not applied to that project.',blocks:'that-source-note-only',resolution:null},
 ];
 s.importPolicy.q1q2='Immutable historical notes served only through the Admin data table archive. Excluded from active objectives, metric actuals, rollups and scoring.';
 s.importPolicy.formulas='Manually entered values and manually maintained status; formulas are documentation only.';
 s.importPolicy.schemaReadiness='Archive schema provided separately. Manual metric windows, component fields and opening balances are structural definitions for the next form integration; do not discard metadata on import.';
 s.status='structural-seed-ready';
 return s;
}
