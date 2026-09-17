// Display roster from the original 2026_annual_scorecard.pdf (35 measures).
// Enterprise Priorities is the separately requested tenth domain. Workplan additions
// must never automatically become annual-scorecard measures.
const metric = (id, name, department, unit) => ({id, name, department, unit});
export const approvedAnnualDomains = [
  {name:'Resident Impact', metrics:[
    metric('annual-rs-utilization-rate','Resident Services Utilization Rate','Resident Services','percent'),
    metric('resident-services-2','Resident Experience Score','Resident Services','percent'),
    metric('resident-services-6','Household (Resident) Engagement Rate','Resident Services','percent'),
    metric('resident-services-1','Resident Satisfaction Rate','Resident Services','percent'),
    metric('resident-services-3','Housing Stability Rate','Resident Services','percent'),
    metric('rs-positive-move-out-rate','Positive Move-Out Rate','Resident Services','percent'),
    metric('annual-service-partner-connection-rate','Service Delivery Partner Connection Rate','Resident Services','percent'),
  ]},
  {name:'Financial Health', metrics:[
    metric('community-relations-8','Predevelopment Capital Raised','Community Relations','USD'),
    metric('finance-3','Accounts Receivable Reduction','Finance','USD'),
    metric('finance-1','Days Cash on Hand','Finance','days'),
    metric('finance-parent-noi','Net Operating Income','Finance','USD'),
    metric('finance-4','Current Ratio','Finance','ratio'),
  ]},
  {name:'Talent Management', metrics:[
    metric('human-resources-1','Employee Satisfaction Rate','Human Resources','percent'),
    metric('human-resources-3','Employee Engagement Rate','Human Resources','percent'),
    metric('hr-retention-12-month','Employee Retention Rate (12-month)','Human Resources','percent'),
  ]},
  {name:'Pipeline', metrics:[
    metric('annual-new-units-acquired-placed','New Units Acquired or Placed in Service','Real Estate Development','units'),
    metric('real-estate-development-6','Existing Units Rehabbed','Real Estate Development','units'),
    metric('annual-units-under-development','Units Under Development (LIHTC Applied/Awarded)','Real Estate Development','units'),
    metric('real-estate-development-7','Units in Closing','Real Estate Development','units'),
  ]},
  {name:'Portfolio Performance', metrics:[
    metric('property-management-1','Events of Noncompliance','Property Management','count'),
    metric('property-management-2','Rent Collection Rate','Property Management','percent'),
    metric('property-management-3','Vacancy Rate','Property Management','percent'),
    metric('finance-6','Payment of Deferred Developer Fee','Finance','USD'),
    metric('finance-7','Vacancy Loss','Finance','USD'),
  ]},
  {name:'Brand Visibility', metrics:[
    metric('annual-resident-stories','Resident Stories Collected & Shared','Community Relations','count'),
    metric('annual-positive-news','Positive News Mentions','Community Relations','count'),
    metric('community-relations-13','Brand Visibility & Reach Score','Community Relations','percent'),
  ]},
  {name:'Revenue', metrics:[
    metric('property-management-5','Property Management Fee','Finance','USD'),
    metric('real-estate-development-8','Developer Fee Earned','Real Estate Development','USD'),
    metric('community-relations-1','Contributed Revenue','Community Relations','USD'),
    metric('finance-5','Excess Cash to Parent','Finance','USD'),
  ]},
  {name:'Advocacy', metrics:[
    metric('annual-policy-engagements','Engagements with Policy Decision-Makers','Community Relations','count'),
    metric('annual-testimonies-op-eds','Testimonies / Op-Eds Delivered','Community Relations','count'),
  ]},
  {name:'Operational Efficiency', metrics:[
    metric('operations-3','User Engagement Rate (CRM & AM)',null,'percent'),
    metric('finance-technology-cost-savings','Cost Savings from Technology','Finance','USD'),
  ]},
  {name:'Enterprise Priorities',metrics:[]},
];
export const approvedAnnualMetrics = approvedAnnualDomains.flatMap(d=>d.metrics);
export const annualMetricIds = new Set(approvedAnnualMetrics.map(m=>m.id));
