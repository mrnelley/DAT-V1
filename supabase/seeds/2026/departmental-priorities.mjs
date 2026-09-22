import {readFileSync} from 'node:fs';
const sources=JSON.parse(readFileSync(new URL('workplan-source.json',import.meta.url),'utf8'));
const owners={'Community Relations':'position-cr',Finance:'position-cfo','Human Resources':'position-hr','Property Management':'position-pm','Real Estate Development':'position-red','Resident Services':'position-rs'};
// Selection labels describe the work. Draft numerical targets remain in the source
// documents; this catalog creates no KPI definitions, targets, or observations.
const labels={
 'workplan-community-relations-p1-t1-r10':'Retain and renew corporate sponsors',
 'workplan-community-relations-p1-t1-r20':'Retain ExtraGive donors',
 'workplan-community-relations-p1-t1-r47':'Increase website sessions following the website redesign',
 'workplan-community-relations-p1-t1-r48':'Increase unique website users through improved navigation and content',
 'workplan-community-relations-p1-t1-r52':'Grow LinkedIn followers',
 'workplan-community-relations-p2-t1-r2':'Grow Facebook followers',
 'workplan-community-relations-p2-t1-r7':'Expand earned media reach through proactive media outreach',
 'workplan-hr-p1-t1-r6':'Reduce health insurance claim costs through employee health benefits training',
 'workplan-property-management-p1-t1-r10':'Lower insurance claims through maintenance technician and resident training',
 'workplan-property-management-p1-t1-r31':'Improve resident satisfaction by resolving complaints',
 'workplan-property-management-p1-t1-r22':'Complete planned capital expenditure projects',
 'workplan-real-estate-development-p1-t1-r21':'Create and implement a page-turn policy during design to reduce change orders',
 'workplan-resident-services-p1-t1-r21':'Leverage strategic partnerships for housing stability, financial capability, health and wellness; develop a partnership impact map',
};
const merged='workplan-resident-services-p1-t1-r22';
export const departmentalPriorities=sources.flatMap(doc=>doc.objectives.filter(o=>o.id!==merged).map(o=>({
 id:`2026-${o.id}`,year:2026,title:(labels[o.id]||o.title).replace(/\s+/g,' ').trim(),
 department:doc.department,departmentIds:[doc.department],ownerPositionIds:[owners[doc.department]],
 contributorPositionIds:doc.department==='Real Estate Development'?['position-project-management']:doc.department==='Community Relations'?['position-vp-impact-advancement']:[],
 enterpriseObjectiveIds:[],active:true,sourceFile:doc.filename,
 sourceRefs:['workplan-resident-services-p1-t1-r21','workplan-resident-services-p1-t1-r26'].includes(o.id)?[o.id,merged]:[o.id],
 sourceBasis:'2026 department workplan; selectable work scope, not an imported target or progress record',
}))).sort((a,b)=>a.department.localeCompare(b.department)||a.title.localeCompare(b.title));
