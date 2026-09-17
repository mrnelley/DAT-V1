import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {pillars,strategicMetrics,departmentMetrics,contributedRevenueCategories,revenueMix,financeWorkplanLinks} from '../src/features/planning/catalog.js';
import {strategyObjectives,strategyAliases} from '../src/features/planning/strategyObjectives.js';
import {q1,q2,q3,departmentQ1,continuity} from '../supabase/seeds/2026/quarterly-source.mjs';
import {descriptions} from '../supabase/seeds/2026/strategy-descriptions.mjs';
import {validateSeed} from './validate-2026-seed.mjs';
import {apply2026Decisions} from '../supabase/seeds/2026/decisions.mjs';

const dir=new URL('../supabase/seeds/2026/',import.meta.url);
const source=JSON.parse(readFileSync(new URL('kpi-source.json',dir),'utf8'));
const departments={HR:'Human Resources',PM:'Property Management',RS:'Resident Services',CR:'Community Relations',RED:'Real Estate Development',FIN:'Finance'};
const positionRows=[
 ['hr','Director of Human Resources','HR',['director']],['pm','Director of Property Management','PM',['director']],
 ['rs','Director of Resident Services','RS',['director']],['cr','Director of Community Relations','CR',['director']],
 ['red','SVP of Real Estate Development','RED',['elt']],['project-management','Director of Project Management','RED',['director']],
 ['coo','Chief Operating Officer',null,['executive','elt']],['cfo','Chief Financial Officer','FIN',['executive','elt']],
 ['mei','Manager, Enterprise Initiatives',null,['staff']],['ceo','Chief Executive Officer',null,['executive','elt']],
];
const positionId=key=>`position-${key}`;
const owners={HR:'hr',PM:'pm',RS:'rs',CR:'cr',RED:'red',FIN:'cfo',CFO:'cfo',COO:'coo',MEI:'mei',CEO:'ceo'};
function assignment(code){
 const expanded=code.split('/').flatMap(c=>c==='ALL'?Object.keys(departments):c==='ELT'?['CEO','COO','CFO','RED']:[c]);
 return {departmentIds:[...new Set(expanded.filter(c=>departments[c]).map(c=>departments[c]))],
  ownerPositionIds:[...new Set(expanded.map(c=>positionId(owners[c])))],
  contributorPositionIds:expanded.includes('RED')?[positionId('project-management')]:[]};
}
const positions=positionRows.map(([key,title,dept,roles])=>({id:positionId(key),title,department:departments[dept]||null,roles,
 rolesStatus:key==='mei'?'admin-account-privilege-separate':'configured-role-type',
 importIdentity:{resolveExistingBy:'exact title and department',preserveExistingId:true,onAmbiguity:'stop'},
 active:true,occupants:[],requiredWeekly:roles.some(r=>['executive','elt','director'].includes(r)),
 scoringBegins:'Only when an active confirmed person is assigned; no retroactive scoring from this seed'}));
const issues=[];
function issue(id,scope,message){issues.push({id,scope,message,resolution:null,blocks:'affected-record-or-calculation'});return id;}
issue('operations-accountability',['position-mei','position-coo','operations'],'Confirm Manager, Enterprise Initiatives as operational owner of CRM/AI and COO as accountable executive for cross-department Operations measures.');
issue('q3-untitled',['2026-Q3-6'],'Q3 row 6 has a KPI and notes but no objective title. Proposed continuity: NEPA Preservation Project from Q2 row 5; confirm before importing this objective.');
issue('q1-nepa-project',['2026-Q1-9'],'The NEPA row names Compliance Strategy (PM) as its project plan, with Close the gap on NEPA (RED) displaced onto the next line. Retain both references; do not bind that project until confirmed.');
issue('q1-rollout-pillar',['2026-Q1-25'],'Other Priorities is not a strategic pillar. Confirm the pillar for Strategic Plan and Annual Impact Report rollout, or allow unaligned enterprise work.');
issue('q2-contributed-revenue',['2026-Q2-4'],'$683,402 YTD minus the listed $650,000 goal is $33,402, not the reported $6,202. Preserve both source figures; confirm the target or variance.');
issue('q3-contributed-revenue',['2026-Q3-4'],'$753,590 minus $750,000 is correctly $3,590. The annual goal behind the reported 78% is not supplied. Confirm the annual goal and percentage denominator rather than deriving a target from a rounded percentage.');
issue('training-cohort-dates',['2026-Q3-9'],'Nov-Jan 2025 spans a year boundary without naming both years. Retain the source wording until the training cohort dates are confirmed.');
issue('historical-dating',['quarterlyProgress'],'Quarterly notes include this week, next week and mixed-period milestones. Exact observation and submission dates are absent. Preserve as quarterly source notes; do not create weekly submissions, monthly actuals, or points.');
issue('revenue-fee-definition',['property-management-5','finance-pm-fee-percent'],'Finance supplies dollar PM fees and average PM fee percentage. Dollar revenue uses the existing PM fee metric; percentage is separate. Confirm Finance reporting into that PM metric instead of a duplicate dollar total.');
issue('revenue-mix-tolerance',['strategic-metric-9'],'Retain 33/33/33 as supplied. Define tolerance for status; do not silently normalize the target or manufacture a green status.');
issue('historical-grants',['metricPositionGrants'],'Grants below are proposed from department ownership. Do not revoke current grants or overwrite existing position configuration while reconciling this seed.');

const metricMap={
 1:['hr-health-insurance-claim-cost-change'],2:['hr-missed-premiums'],3:['property-management-4'],4:['human-resources-11'],5:['human-resources-2'],
 6:['finance-3'],7:['finance-5'],8:['finance-6'],9:['finance-1'],10:['finance-4'],11:['finance-parent-noi'],12:['finance-pm-fee-percent'],13:['property-management-5'],14:['finance-development-fee-revenue'],15:['finance-7'],16:['finance-10'],17:['finance-negative-noi-properties'],18:['finance-troubled-properties'],19:['finance-9'],20:['finance-11'],
 21:['cr-resident-communication-satisfaction'],22:['cr-google-review-rating'],23:['cr-recruitment-marketing'],24:['cr-website-sessions'],25:['cr-unique-website-users'],26:['cr-newsletter-open-rate'],27:['community-relations-14'],28:['cr-linkedin-engagement-rate'],29:['cr-linkedin-impressions'],30:['cr-facebook-followers'],31:['cr-facebook-reach'],32:['cr-facebook-engagement'],33:['community-relations-16'],34:['community-relations-17'],
 35:['property-management-12'],36:['property-management-11'],37:['resident-services-3'],38:['pm-community-meetings'],39:['property-management-3'],40:['pm-bond-compliance-files'],41:['pm-new-unit-lease-up'],42:['resident-services-4'],43:['resident-services-2'],44:['property-management-6','rs-positive-move-out-rate'],45:['resident-services-6'],46:['resident-services-1','property-management-4'],47:['resident-services-7'],48:['rs-hours-saved'],49:['rs-service-partner-connections'],50:['human-resources-1'],51:['resident-services-8'],52:['community-relations-1'],53:['pm-vendor-use-reduction'],54:['property-management-1'],55:['property-management-14'],56:['pm-compliance-consultant-spend-change'],57:['pm-yardi-implementation'],58:['pm-customer-service-complaint-change'],59:['pm-maintenance-technician-retention'],60:['property-management-2'],61:['human-resources-10','pm-time-to-fill'],62:['property-management-12'],63:['pm-community-manager-retention'],64:['pm-learning-growth'],65:['finance-technology-cost-savings'],66:['human-resources-3'],
};
const formulaReviews={
 1:'The supplied (2026 - 2025)/2025 is signed change, not positive percent reduction, and omits percent scaling. Confirm sign and display scale.',
 2:'The zero-dollar target measures remaining missed premiums; the supplied subtraction measures improvement. Keep these distinct.',
 3:'Survey scoring method is owner-reported; keep PM and RS measurements separate.',
 5:'Define retained cohort and denominator for six-month and twelve-month retention; never average those windows.',
 11:'The label NOI, description parent cash flow and Revenue - Expenses are not interchangeable accounting definitions. Confirm scope.',
 12:'Confirm revenue denominator and percentage scaling; this is not the dollar fee metric.',
 18:'Source explicitly says $10m A/R and baseline 11. Confirm threshold; PM separately reports 9 troubled properties.',
 19:'Keep Finance controllable cost independent from PM assessment; no automatic cross-department averaging.',
 20:'Total potential rent minus actual rent collected is a dollar shortfall, not an occupancy percentage. Confirm intended measure/formula.',
 24:'Monthly total versus average sessions across months needs a defined reporting window.',
 25:'Unique visitors across months cannot be deduplicated by averaging monthly uniques; confirm reporting window.',
 26:'Confirm unique or total opens and sent versus delivered denominator.',
 27:'Annual target / 12 allocates a target, not actual new followers. Preserve separately.',
 29:'Annual target / 12 allocates a target, not actual impressions.',
 30:'Annual target / 12 allocates a target, not actual new followers.',
 31:'Annual target / 12 allocates a target, not actual reach.',
 32:'Annual target / 12 allocates a target, not actual engagement.',
 33:'Annual target / 12 allocates a target, not actual impressions.',
 34:'N/A formula; define count, reach or qualitative evidence before numeric rollup.',
 35:'Two source rows describe the same turnover-time metric. Retain 8-day FT / 14-day PT targets and the separate date definition without duplicating observations.',
 36:'PM baseline 9 differs from Finance baseline 11 and the $10m threshold. Keep separate pending reconciliation.',
 37:'Monthly PM/RS meetings are an action, not the housing stability rate formula.',
 38:'Four annual community meetings / every 90 days is a cadence target, not a satisfaction calculation.',
 39:'Fill units within 70 days is a duration target; it does not define vacancy count or percentage.',
 40:'The source concerns 123 income-certification files within 90 days, not RED units rehabbed with a certificate of occupancy.',
 41:'Flats V 100% lease-up within 90 days of CO differs from the count of newly constructed units. Track separately.',
 42:'Definition names unique residents; supplied calculation says unique households and gives no rate denominator. Confirm unit.',
 43:'Weights are supplied, but tenure (years) needs normalization and senior/family handling before blending into a percentage. No automatic blend yet.',
 44:'Classification supplied, but denominator and treatment of neutral deaths in the rate need confirmation. Keep PM and RS reporting separate.',
 45:'No denominator supplied for household engagement rate.',
 46:'Keep independently reported PM and RS satisfaction readings and survey response rates separate.',
 47:'Number of referrals per area is a count, not a connection rate. Confirm measure.',
 49:'Referrals per partner do not necessarily count residents successfully connected. Confirm distinctness and unit.',
 52:'RS fundraising goals total $125,000 ($100,000 general operations plus $25,000 H&O). Tag the program within contributed revenue; do not add a second departmental total into the enterprise sum.',
 53:'Department cell is blank. PM proposed from maintenance technician training context.',
 55:'Projects per property is a count, whereas the existing measure is projects on track / total. Confirm numerator and denominator.',
 56:'Compare spend, not consultant count; decide signed change versus positive reduction.',
 58:'Twenty-percent complaint reduction needs a 2025 baseline and consistent complaint scope.',
 59:'Source combines technician turnover and vendor use. These are distinct outcomes; no single arithmetic formula.',
 60:'95/98% rent collection targets require scope or phases and a denominator.',
 61:'Coverage-plan implementation does not define time-to-fill; confirm start and end events. PM subset and enterprise HR remain separate.',
 62:'Ready date minus move-out date, in days; confirm elapsed versus business days. Same canonical metric as row 35.',
 63:'Turnover comparison needs a denominator and period; retention and turnover are not silently interchangeable.',
 64:'Promotion and capacity building need a counting definition; one person may satisfy both.',
 65:'Avoid double-counting late fees within direct savings; approve the staff-hour valuation rate.',
 66:'40/30/30 weights supplied. Define the employee-group/event component and ensure component rates use the same 0–100 scale.',
};
const metricDefinitions=departmentMetrics.map(m=>({id:m.id,name:m.name,department:m.department,trackingArea:m.trackingArea,
 unit:m.unit,year:2026,sourceRefs:['prior-department-catalog'],calculationMode:'owner-reported',executableFormula:null,definitionRefs:[],
 ...assignment(Object.keys(departments).find(k=>departments[k]===m.department)||'COO'),
 mappingStatus:m.department?'department-owned':'cross-department-owner-review',cadence:null}));
const metrics=new Map(metricDefinitions.map(m=>[m.id,m]));
Object.assign(metrics.get('asset-management-fees'),assignment('FIN'),{mappingStatus:'finance-owned-management-fees'});
const kpiDefinitions=source.map((r,i)=>{
 const n=i+1,code=r.departments||'PM';
 const own=assignment(code);
 const refs=metricMap[n];
 const reviewIds=formulaReviews[n]?[issue(`kpi-${n}`,refs,formulaReviews[n])]:[];
 for(const id of refs){
  if(!metrics.has(id)){
   const inferredCode=id.startsWith('rs-')?'RS':id.startsWith('pm-')?'PM':code.split('/')[0];
   const metric={id,name:r.name.replace(/^Imlement /,'Implement '),department:departments[inferredCode],trackingArea:null,unit:null,year:2026,
    sourceRefs:[],definitionRefs:[],calculationMode:'owner-reported',executableFormula:null,...assignment(inferredCode),cadence:null,mappingStatus:'source-definition'};
   metrics.set(id,metric);metricDefinitions.push(metric);
  }
  const m=metrics.get(id);m.sourceRefs.push(r.id);m.definitionRefs.push(r.id);
  m.ownerPositionIds=[...new Set([...m.ownerPositionIds,...own.ownerPositionIds])];
 }
 return {...r,name:r.name.replace(/^Imlement /,'Implement '),sourceName:r.name,metricIds:refs,...own,
  departmentMapping:r.departments?'source-department':'proposed-pm',reviewIds,
  calculation:{mode:'owner-reported',sourceFormula:r.formula||null,executable:null,status:reviewIds.length?'review-required':r.formula?'documented-not-automated':'definition-needed'}};
});
// Calculation recipes document the supplied arithmetic; this seed does not execute them.
const recipes={
 4:{operation:'percentage',numerator:'employeesWithActiveLDP',denominator:'activeEmployees'},
 9:{operation:'ratio',numerator:'cashOnHand',denominator:{operation:'ratio',numerator:'annualExpenses',denominator:365}},
 10:{operation:'ratio',numerator:'currentAssets',denominator:'currentLiabilities'},
 21:{operation:'percentage',numerator:'satisfiedRespondents',denominator:'totalRespondents'},
 22:{operation:'ratio',numerator:'sumRatings',denominator:'totalReviews'},
 23:{operation:'percentage',numerator:'campaignApplicants',denominator:'totalApplicants'},
 28:{operation:'percentage',numerator:'totalEngagements',denominator:'totalImpressions'},
 43:{operation:'weightedMean',components:[{key:'housingStability',weight:0.10},{key:'housingTenure',weight:0.10},{key:'positiveMoveOuts',weight:0.30},{key:'residentSatisfaction',weight:0.50}],normalization:'unresolved',tenureReferenceYears:{senior:7,family:5}},
 65:{operation:'sum',components:['directSavings',{operation:'multiply',inputs:['staffHoursSaved','hourlyRate']},'lateFeesAvoided'],overlapCheck:'required'},
 66:{operation:'weightedMean',components:[{key:'surveyParticipation',weight:0.40},{key:'leadershipDevelopment',weight:0.30},{key:'groupsAndEvents',weight:0.30}],componentDefinitions:'review-required'},
};
for(const [n,recipe] of Object.entries(recipes))kpiDefinitions[Number(n)-1].calculation.recipe={...recipe,enabled:false,missingInputs:'return-null',zeroDenominator:'return-null'};
for(const c of contributedRevenueCategories.filter(c=>c.metricId))Object.assign(metrics.get(c.metricId),{
 calculationMode:'derived-category-total',entryMode:'read-only',derivedFrom:{metricId:'community-relations-1',categoryId:c.id},executableFormula:null,
});
const annualTargets=[
 [2,'Missed premiums',0,'USD','eq',null],[4,'Active LDP participation',50,'percent','gte',22],
 [17,'Properties with negative NOI',null,'properties','decrease',9],[18,'Finance troubled properties',null,'properties','decrease',11],
 [35,'Full-time technician turnover time',8,'days','lte',null],[35,'Part-time technician turnover time',14,'days','lte',null],
 [36,'PM troubled properties',null,'properties','decrease',9],[38,'Community meetings',4,'meetings-per-community-per-year','gte',null],
 [39,'Unit fill time',70,'days','lte',null],[40,'Income-certification files',123,'files','eq',null],
 [41,'Flats V lease-up',100,'percent','gte',null],[46,'Resident satisfaction',85,'percent','gte',null],
 [52,'RS general operating contributions',100000,'USD','gte',null],[52,'H&O Fund contributions',25000,'USD','gte',null],
 [53,'Vendor use reduction',5,'percent','gte',null],[54,'Noncompliance',0,'incidents','eq',null],
 [56,'Compliance consultant spend reduction',50,'percent','gte',null],[58,'Customer service complaint reduction',20,'percent','gte',null],
].map(([n,name,value,unit,operator,baseline],i)=>({id:`annual-target-${i+1}`,sourceRef:source[n-1].id,metricIds:metricMap[n],year:2026,name,value,unit,operator,baseline,status:'source-target-review',actual:null}));
// Known units only. A reported number without a settled measure remains untyped.
for(const [id,unit] of Object.entries({'hr-missed-premiums':'USD','finance-parent-noi':'USD','finance-pm-fee-percent':'percent','finance-development-fee-revenue':'USD','finance-negative-noi-properties':'properties','finance-troubled-properties':'properties','cr-google-review-rating':'stars','cr-website-sessions':'sessions','cr-unique-website-users':'users','cr-newsletter-open-rate':'percent','cr-linkedin-engagement-rate':'percent','cr-linkedin-impressions':'impressions','cr-facebook-followers':'followers','cr-facebook-reach':'users','cr-facebook-engagement':'interactions','rs-hours-saved':'hours','finance-technology-cost-savings':'USD'}))metrics.get(id).unit=unit;
const pillarId={SG:'sustainable-growth',DI:'diversify-innovate',AC:'agility-capacity',CC:'care-connection',AV:'advocate-change'};
const strategyLinks={
 '2026-Q1-1':'5.2','2026-Q1-2':'5.2','2026-Q1-3':'1.2','2026-Q1-5':'5.1','2026-Q1-7':'5.3','2026-Q1-8':'5.1','2026-Q1-9':'1.1','2026-Q1-10':'1.1','2026-Q1-11':'1.1','2026-Q1-12':'1.1','2026-Q1-13':'4.3','2026-Q1-14':'4.3','2026-Q1-15':'4.3','2026-Q1-16':'4.3','2026-Q1-17':'4.3','2026-Q1-18':'4.3','2026-Q1-19':'4.3','2026-Q1-20':'4.3','2026-Q1-21':'2.3','2026-Q1-22':'2.2','2026-Q1-23':'2.1','2026-Q1-24':'3.1',
 '2026-Q2-1':'5.1','2026-Q2-2':'5.3','2026-Q2-3':'5.1','2026-Q2-4':'5.2','2026-Q2-5':'1.1','2026-Q2-6':'1.1','2026-Q2-7':'1.1','2026-Q2-8':'1.1','2026-Q2-9':'1.2','2026-Q2-10':'4.1','2026-Q2-11':'4.1','2026-Q2-12':'4.2','2026-Q2-13':'4.3','2026-Q2-14':'2.3',
 '2026-Q3-1':'5.1','2026-Q3-2':'5.3','2026-Q3-3':'5.1','2026-Q3-4':'5.2','2026-Q3-5':'1.1','2026-Q3-6':'1.1','2026-Q3-7':'1.1','2026-Q3-8':'1.1','2026-Q3-9':'4.1','2026-Q3-10':'4.1','2026-Q3-11':'4.3','2026-Q3-12':'4.3','2026-Q3-13':'4.3','2026-Q3-14':'4.3','2026-Q3-15':'2.3',
};
const quarterlyObjectives=[q1,q2,q3].flatMap((rows,i)=>rows.map(([n,pillar,area,title,code,kpi,progress,projectPlan])=>{
 const id=`2026-Q${i+1}-${n}`,own=assignment(code);
 return {id,period:`2026-Q${i+1}`,pillarId:pillarId[pillar]||null,area,title,sourceRow:n,...own,
  ownershipStatus:i===0?'source-department-or-position':'inferred-from-work-scope-not-person',
  strategyId:null,proposedStrategyId:strategyLinks[id]||null,strategyMappingStatus:'confirm-proposed-link',
  kpiText:kpi||null,projectPlanTitle:projectPlan||null,progressNote:progress||null,status:null,
  observedAt:null,sourceRef:`quarter-${i+1}-table`,importStatus:!title||!pillar?'hold-unresolved-source':'review-ready'};
}));
quarterlyObjectives.find(o=>o.id==='2026-Q1-9').displacedProjectReference='Close the gap on NEPA (RED)';
quarterlyObjectives.find(o=>o.id==='2026-Q3-6').proposedTitle='Restructure and demonstrate feasibility for NEPA Preservation Project';
// Row status comes only from explicit reported status, not inference from a due date.
quarterlyObjectives.find(o=>o.id==='2026-Q1-2').status='needs_attention';
quarterlyObjectives.find(o=>o.id==='2026-Q2-6').status='completed';
quarterlyObjectives.find(o=>o.id==='2026-Q2-10').status='completed';
quarterlyObjectives.find(o=>o.id==='2026-Q2-14').status='on_hold';
const targets=[
 ['2026-Q2-1','PM fee approvals',11,'properties','gte',null],['2026-Q2-1','Additional annual PM fee',34000,'USD','gte','2026-12-31'],
 ['2026-Q2-4','Contributed revenue secured',522000,'USD','gte',null],['2026-Q2-4','Contributed revenue YTD',650000,'USD','gte',null],
 ['2026-Q2-9','Funding requests',1250000,'USD','gte',null],['2026-Q2-11','Open positions',10,'positions','lt',null],['2026-Q2-12','Employee satisfaction',100,'percent','gte',null],
 ['2026-Q3-1','PM fee approvals',11,'properties','gte','2026-09-01'],['2026-Q3-4','New contribution commitments',96000,'USD','gte',null],['2026-Q3-4','Contributed revenue YTD',750000,'USD','gte',null],
 ['2026-Q3-9','Six-month retention',88,'percent','gte',null],['2026-Q3-9','Twelve-month retention',69,'percent','gte',null],['2026-Q3-9','Day 90 Training Satisfaction',90,'percent','gte',null],['2026-Q3-10','Open positions',5,'positions','lt',null],['2026-Q3-11','Flats V lease-up',100,'percent','gte','2026-11-01'],
].map(([objectiveId,name,value,unit,operator,dueDate],i)=>({id:`quarter-target-${i+1}`,objectiveId,name,value,unit,operator,dueDate,scope:'objective-specific',rollup:'not-additive'}));
const reportedFacts=[
 ['2026-Q1-2','Sponsorship goal attainment',65,'percent','unknown'],
 ['2026-Q2-4','Contributed revenue',683402,'USD','year-to-date'],['2026-Q2-4','Reported annual attainment',68,'percent','year-to-date'],['2026-Q2-4','Reported goal surplus',6202,'USD','source-inconsistent'],
 ['2026-Q2-9','LCCF award',500000,'USD','award-not-receipt'],['2026-Q2-9','High Foundation request',750000,'USD','request-not-receipt'],
 ['2026-Q2-11','Open positions',16,'positions','snapshot'],['2026-Q2-11','Waiting to start',3,'positions','snapshot'],['2026-Q2-11','Actively recruiting',12,'positions','snapshot'],
 ['2026-Q2-12','Onboarding rating',4.45,'score-out-of-5','cohort-unspecified'],['2026-Q2-12','Onboarding satisfaction',89,'percent','cohort-unspecified'],['2026-Q2-12','Training rating',4.51,'score-out-of-5','cohort-unspecified'],['2026-Q2-12','Reported training satisfaction',90,'percent','rounded-source'],
 ['2026-Q3-4','Contributed revenue',753590,'USD','year-to-date'],['2026-Q3-4','Reported annual attainment',78,'percent','denominator-unconfirmed'],['2026-Q3-4','Goal surplus',3590,'USD','year-to-date'],
 ['2026-Q3-4','Pending grant proposals',7,'proposals','pipeline'],['2026-Q3-4','Pending grant amount',515000,'USD','pipeline-not-revenue'],['2026-Q3-4','Additional proposals planned',6,'proposals','pipeline'],['2026-Q3-4','Planned proposal amount',250000,'USD','pipeline-not-revenue'],['2026-Q3-4','Pending corporate sponsorship',41000,'USD','pipeline-not-revenue'],
 ['2026-Q3-9','Twelve-month retention',63,'percent','August-2026'],['2026-Q3-9','Prior twelve-month retention',65,'percent','previous-snapshot'],['2026-Q3-9','Six-month retention',78,'percent','August-2026'],['2026-Q3-9','Prior six-month retention',81,'percent','previous-snapshot'],
 ['2026-Q3-9','Training rating Nov-Jan 2025',2.96,'score-out-of-5','source-period-ambiguous'],['2026-Q3-9','Training rating Feb-Jun 2026',4.5,'score-out-of-5','cohort'],['2026-Q3-9','Training rating Jul-present 2026',3.14,'score-out-of-5','cohort'],
 ['2026-Q3-10','Open positions',23,'positions','snapshot'],['2026-Q3-10','Starting',5,'positions','snapshot'],['2026-Q3-10','Actively recruiting',18,'positions','snapshot'],
 ['2026-Q3-11','Applications approved',32,'applications','snapshot'],['2026-Q3-11','Applications pending approval',7,'applications','snapshot'],['2026-Q3-11','Applications in process',13,'applications','snapshot'],['2026-Q3-11','Move-ins this week',10,'move-ins','week-unknown'],
].map(([objectiveId,name,value,unit,basis],i)=>({id:`reported-fact-${i+1}`,objectiveId,name,value,unit,basis,observedAt:null,eligibleForAutomaticRollup:false}));
const workplanPriorities=Object.entries(departmentQ1).flatMap(([code,titles])=>titles.map((title,i)=>({id:`2026-Q1-workplan-${code.toLowerCase()}-${i+1}`,period:'2026-Q1',title,...assignment(code),sourceRef:'q1-department-priority-table',enterpriseObjectiveIds:[],alignmentStatus:'review-needed',status:null})));
const workplanLinks={
 'hr-1':[17],'hr-2':[21], 'pm-1':[18],'pm-3':[5],
 'cr-4':[25],'cr-5':[25],'cr-7':[22],'cr-8':[13],
 'red-1':[10],'red-2':[9],'red-3':[11],'red-4':[17],
 'fin-1':[4],'fin-2':[7],'fin-3':[19],'fin-4':[6],'fin-5':[8],'fin-6':[17],'fin-7':[4],
};
for(const o of workplanPriorities){const linked=workplanLinks[o.id.replace('2026-Q1-workplan-','')];if(linked){o.enterpriseObjectiveIds=linked.map(n=>`2026-Q1-${n}`);o.alignmentStatus='proposed-from-work-scope';}}
const quarterlyMetricLinks={
 '2026-Q1-2':['community-relations-5'],'2026-Q1-3':['community-relations-8'],'2026-Q1-4':['finance-1'],'2026-Q1-5':['property-management-5'],'2026-Q1-6':['finance-3'],
 '2026-Q1-8':['asset-management-fees'],'2026-Q1-11':['real-estate-development-3'],'2026-Q1-12':['real-estate-development-3'],
 '2026-Q2-1':['property-management-5'],'2026-Q2-3':['asset-management-fees'],'2026-Q2-4':['community-relations-1'],
 '2026-Q2-6':['real-estate-development-7'],'2026-Q2-9':['community-relations-8'],'2026-Q2-11':['human-resources-4','human-resources-5','human-resources-6'],'2026-Q2-12':['human-resources-7'],
 '2026-Q3-1':['property-management-5'],'2026-Q3-3':['asset-management-fees'],'2026-Q3-4':['community-relations-1'],
 '2026-Q3-7':['real-estate-development-7'],'2026-Q3-8':['real-estate-development-7'],'2026-Q3-9':['human-resources-2','human-resources-7'],
 '2026-Q3-10':['human-resources-4','human-resources-5','human-resources-6'],'2026-Q3-11':['pm-new-unit-lease-up'],
 '2026-Q3-13':['pm-yardi-implementation'],
};
for(const o of quarterlyObjectives){
 o.metricLinks=(quarterlyMetricLinks[o.id]||[]).map(metricId=>({metricId,relationship:'supporting-measure',status:'proposed',automaticRollup:false}));
 if(o.proposedStrategyId){const proposed=pillars.find(p=>p.strategies.some(s=>s.id===o.proposedStrategyId));if(proposed.id!==o.pillarId)issue(`strategy-pillar-${o.id}`,[o.id],`Source pillar is ${o.pillarId}; proposed strategy ${o.proposedStrategyId} belongs to ${proposed.id}. Keep the supplied pillar until the cross-pillar alignment is approved.`);}
}
// Permission proposals are separate from accountable ownership and require explicit reconciliation.
const metricPositionGrants=[];
for(const m of metricDefinitions){
 const reportingDepartments=m.department?[m.department]:m.id==='asset-management-fees'?['Finance']:Object.values(departments);
 for(const p of [...new Set([...m.ownerPositionIds,...m.contributorPositionIds])])for(const department of reportingDepartments)
  metricPositionGrants.push({metricId:m.id,positionId:p,department,canWrite:m.entryMode!=='read-only',status:'proposed',replaceExisting:false});
}
const seed={format:'compass-annual-seed',formatVersion:1,year:2026,status:'review-required',
 sources:[{id:'attachment-1',kind:'user-provided-kpi-table',rows:source.length,sha256:createHash('sha256').update(JSON.stringify(source)).digest('hex')},{id:'quarter-1-table',rows:q1.length},{id:'quarter-2-table',rows:q2.length},{id:'quarter-3-table',rows:q3.length},{id:'q1-department-priority-table',rows:workplanPriorities.length},{id:'prior-department-catalog',kind:'earlier-user-supplied-metrics-and-confirmations'},{id:'prior-strategic-plan',kind:'earlier-user-supplied-pillars-strategies-objectives-and-targets'}],
 importPolicy:{mode:'review-only-no-remote-writes',createPeople:false,createAuthUsers:false,createOccupancies:false,createHistoricalPoints:false,
  existingRecords:'Resolve known metric/objective IDs; resolve position titles to existing IDs before insertion. Stop on ambiguity. Do not replace unrelated records or permissions.',
  weeklyHistory:'Do not manufacture submission dates, weekly actions or actor identities from quarterly notes.',
  monetaryActuals:'YTD snapshots, awards, requests, commitments and cash received are distinct. Never sum overlapping YTD snapshots or pipeline dollars into revenue.',
  formulas:'Source text is documentation. No executable SQL or JavaScript formulas are imported.',
  schemaReadiness:'Current metric_entries require real actor UUIDs and monthly periods. Quarterly evidence belongs in a historical evidence structure with position ownership before any production import.',
  strategyLinks:'Internal IDs are retained for references. Display titles have no numerical prefixes. Proposed strategy links require review.',
  q4:'No Q4 objective table supplied; Q4-related due dates remain on the source-quarter objective.'},
 departments:Object.values(departments).map(name=>({id:name,name})),trackingAreas:['Operations','Advocacy'],positions,
 strategicPlan:{yearEnd:2030,pillars:pillars.map(p=>({...p,strategies:p.strategies.map(s=>({...s,title:strategyAliases[s.id]||s.title}))})),
  objectives:strategyObjectives.map(o=>({...o,description:descriptions[o.id]||null,descriptionStatus:descriptions[o.id]?'source-supplied':'source-title-only'})),
  targets:strategicMetrics, revenueMix,financeWorkplanLinks},
 contributionCategories:contributedRevenueCategories.map(({id,label})=>({id,label})),
 contributedRevenue:{metricId:'community-relations-1',entryCategoryKey:'categoryId',separateProgramKey:'programId',programs:[{id:'resident-services-general',title:'Resident Services General Operating',target:100000},{id:'resident-services-ho',title:'H&O Fund',target:25000}],aggregation:'Sum categorized contribution entries once; program tags and category summaries are subsets, never additional revenue.'},
 metricDefinitions,kpiDefinitions,annualTargets,metricPositionGrants,quarterlyObjectives,quarterlyTargets:targets,reportedFacts,departmentWorkplanPriorities:workplanPriorities,
 confirmedOwnershipDecisions:[{department:'Real Estate Development',accountablePositionId:'position-red',sharedMetricPositionId:'position-project-management',source:'user-confirmed-follow-up'}],
 objectiveContinuity:continuity.map(([from,to])=>({from,to,status:'proposed-from-work-scope'})),
 historicalWeeklySubmissions:[],people:[],positionOccupancies:[],points:[],reviewItems:issues,
};
apply2026Decisions(seed);
const summary=validateSeed(seed);
writeFileSync(new URL('compass-2026.seed.json',dir),JSON.stringify(seed,null,2)+'\n');
const esc=s=>String(s??'—').replaceAll('|','\\|').replaceAll('\n',' ');
const currentReport=`# 2026 seed decisions and mappings\n\n${Object.entries(summary).map(([k,v])=>`- ${k}: ${v}`).join('\n')}\n\n## Confirmed decisions\n\n- Position-owned work; no people, emails or historical point awards. SVP owns RED; Director of Project Management shares access. VP of Impact and Advancement covers Community Relations.\n- Q1 and Q2 are immutable Admin archive records, excluded from live rollups. The Q1 rollout row is omitted.\n- Q3 row 6 refers to College Ave Phase 2 and is merged by alias, without duplicating the initiative. Its inconsistent scattered-site note is retained separately.\n- Project-plan references are related work across departments, not unique project ownership.\n- Contributed revenue starts from one user-directed $750,000 Q3 YTD balance, manually marked as exceeding goal. Old contribution progress and inferred category allocations are excluded.\n- Values and status are manually entered. Unknown numeric values/baselines start at zero, tagged as defaults rather than measurements.\n- PM Occupancy Rate and Finance Economic Occupancy Rate stay separate. Potential minus collected rent is a display-only shortfall helper.\n- HR retention has separate six- and twelve-month entries. Website windows support 12, 6 or 3 months. Newsletter total opens, unique opens, sent and delivered are separate counts.\n- RS utilization is a raw count with separate optional total-unit and total-resident inputs. Referrals Made and Referrals Connected stay separate. Deaths remain neutral.\n- Cap-ex total and on-track counts are separate. Compliance figures come from Salesforce. Turnover time uses elapsed days. Revenue-mix status is manual.\n- Access permissions are not financial grants. No existing permissions are removed by this seed.\n\n## Remaining import choices\n\n${seed.reviewItems.map(i=>`- **${i.id}:** ${i.message}`).join('\n')}\n\n## Early workplan references\n\n${seed.workplanReferences.map(d=>`- ${d.filename}: ${d.pages} pages, ${d.objectives.length} objective rows; retained as draft references. Latest decisions take precedence.`).join('\n')}\n\nNo names or progress-owner columns from these PDFs are copied. Early draft numbers do not override the current seed. Source-only 2025 baseline descriptions are not 2025 records. The ambiguous Nov–Jan 2025 training observation from the pasted Q3 note is omitted from active data.\n\n## Current KPI mapping\n\n| Source | Measure | Position owners | Metric IDs |\n| --- | --- | --- | --- |\n${seed.kpiDefinitions.map(k=>`| ${k.id} | ${esc(k.name)} | ${esc(k.ownerPositionIds.map(id=>seed.positions.find(p=>p.id===id).title).join('; '))} | ${k.metricIds.join(', ')} |`).join('\n')}\n\n## Active Q3 objectives\n\n${seed.quarterlyObjectives.map(o=>`- **${esc(o.title)}** (${o.id}): ${esc(o.kpiText)}`).join('\n')}\n\n## Deployment boundary\n\nThe generated archive SQL and Admin archive reader support Q1/Q2 notes. The remaining seed is a structural import package: the next metric-entry pass must preserve manual statuses, lookback windows, component fields and opening-balance metadata. It is not a request to turn stored formula text into executable code.\n\nRebuild: \`node scripts/build-2026-seed.mjs\`. Validate: \`node --test test/annual-seed.test.mjs\`.\n`;
writeFileSync(new URL('RECONCILIATION.md',dir),currentReport);
console.log(JSON.stringify({...summary,remoteWrites:0},null,2));
