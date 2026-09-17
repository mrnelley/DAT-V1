import { approvedAnnualMetrics } from '../scorecards/annual2026.js';
// User-supplied September 16, 2026. Definitions only: no fabricated observations.
export const pillars = [
  ['diversify-innovate', 'Diversify & Innovate', [
    ['1.1', 'SUSTAIN Community-Oriented Affordable Rental Housing Production'],
    ['1.2', 'GROW Investment and Development Model'], ['1.3', 'SHIFT New Models of Affordable Housing'],
  ]],
  ['care-connection', 'Care & Connection', [
    ['2.1', 'SUSTAIN Resident-Centered Culture and Services'],
    ['2.2', 'GROW Communication and Engagement'], ['2.3', 'SHIFT To Value-Driven Customer Service Excellence'],
  ]],
  ['advocate-change', 'Advocate for Change', [
    ['3.1', 'SUSTAIN Advocacy Commitment'], ['3.2', 'GROW Advocacy Capacity and Impact'],
    ['3.3', 'SHIFT Leadership and Board Engagement'],
  ]],
  ['agility-capacity', 'Agility & Capability', [
    ['4.1', 'SUSTAIN Equitable, Welcoming and Inclusive Culture'],
    ['4.2', 'GROW Leadership Development'], ['4.3', 'SHIFT to Future-Ready Operations'],
  ]],
  ['sustainable-growth', 'Sustainable Growth', [
    ['5.1', 'SUSTAIN Integrated Operations'], ['5.2', 'GROW Revenue and Community Support'],
    ['5.3', 'SHIFT Business Model Elements'],
  ]],
].map(([id, title, strategies], index) => ({ id, title, order: index + 1,
  strategies: strategies.map(([code, title]) => ({ id: code, pillarId: id, title })) }));

const target = (pillarId, name, operator, value, unit, extra = {}) =>
  ({ pillarId, name, target: { operator, value, unit, ...extra }, actual: null });
export const strategicMetrics = [
  target('diversify-innovate', 'Growth in new units outside acquisitions', 'gt', 15, 'percent'),
  target('diversify-innovate', 'Units created, acquired or preserved', 'gt', 750, 'units'),
  target('diversify-innovate', 'Enterprise capital for real estate development', 'gte', 1500000, 'USD'),
  target('diversify-innovate', 'Housing models explored and vetted', 'range', 5, 'models', { upper: 7 }),
  target('agility-capacity', 'Employee satisfaction', 'gte', 90, 'percent'),
  target('agility-capacity', 'Employee net promoter score', 'gt', 50, 'score'),
  target('agility-capacity', 'Employee engagement', 'gt', 50, 'percent', { definitionPending: true }),
  target('agility-capacity', 'Technologies adopted with measurable savings', 'gte', 5, 'technologies'),
  target('sustainable-growth', 'Revenue diversification', 'mix', [33, 33, 33], 'percent', { definitionPending: true }),
  target('sustainable-growth', 'Days cash on hand', 'gte', 150, 'days'),
  target('sustainable-growth', 'Philanthropic growth above national average', 'benchmark', null, 'percent', { definitionPending: true }),
  target('sustainable-growth', 'Positive brand visibility and reach', 'gt', 80, 'percent', { definitionPending: true }),
  target('advocate-change', 'Coalitions and alliances with active involvement', 'range', 2, 'coalitions', { upper: 3 }),
  target('advocate-change', 'Increase in policymaker engagement', 'gt', 50, 'percent'),
  target('advocate-change', 'Resident leaders and stakeholders participating in advocacy', 'gte', 100, 'people'),
  target('advocate-change', 'Policy wins', 'gte', 3, 'wins'),
  target('care-connection', 'Resident satisfaction', 'gt', 85, 'percent'),
  target('care-connection', 'Resident Experience Score', 'gt', 60, 'percent'),
  target('care-connection', 'Wage growth for working families (2026–2030)', 'gt', 25, 'percent'),
].map((metric, index) => ({ id: `strategic-metric-${index + 1}`, ...metric,
  targetInterpretation: 'Draft: plain numerical targets interpreted as minimums; validate during metric setup' }));

const departmentLists = {
  'Real Estate Development': ['Projects on track / total', 'Units under site control', 'LIHTC applications submitted', 'Units in pipeline', 'New units created with CO', 'Rehab units with CO', 'Units closed', 'Developer fee', 'Average percent of development fee for closed projects'],
  'Property Management': ['Noncompliance', 'Rent collection', 'Vacancy', 'Resident satisfaction', 'PM fee', 'Positive move-outs', 'Nonrenewals', 'NPSIRE score (average)', 'Unresolved resident complaints', 'Curb appeal rating', 'Troubled properties', 'Average turnover time', 'Average controllable cost', 'Capital expenditure projects on track / total', 'Average re-rental time', 'Google Reviews (target 4.75)', 'Resident survey response rate'],
  'Human Resources': ['Employee satisfaction', 'Employee retention', 'Employee engagement', 'Open positions', 'Actively recruiting', 'Waiting to start', 'Training satisfaction score', 'Voluntary vs. involuntary exits and top three departure reasons', 'Total employees', 'Time to fill open positions', 'LDP / total', 'Employee net promoter score', 'Employees receiving incentive program (%)'],
  'Resident Services': ['Resident satisfaction', 'Resident Experience Score', 'Housing stability rate', 'Resident services utilization rate', 'Evictions prevented', 'Resident engagement rate', 'Service delivery connection rate', 'Benefits leveraged for residents ($)', 'Resident survey response rate', 'Food distribution events', 'Residents accessing food programs (%)', 'Service delivery partners', 'Positive move-outs becoming homeowners'],
  'Community Relations': ['Contributed revenue total', 'Contributed revenue: grants', 'Contributed revenue: NeighborWorks', 'Contributed revenue: individual giving', 'Contributed revenue: corporate sponsors', 'Corporate sponsor retention rate', 'Giving increase from renewing corporate sponsors', 'Predevelopment capital raised', 'Grant success rate', 'Grant yield rate', 'Board giving', 'Donor retention rate', 'Brand visibility', 'LinkedIn followers', 'Social media engagement rate', 'Facebook impressions', 'Earned media coverage', 'Subject matter expertise'],
  Finance: ['Days cash', 'Total diverse spend (%)', 'Accounts receivable', 'Current ratio', 'Excess cash to parent', 'Payment of deferred developer fee', 'Vacancy loss ($)', 'Invoices paid within 30 days (%)', 'Average controllable cost', 'Properties meeting budgeted NOI', 'Economic occupancy rate', 'Monthly department financials by the 10th', 'Properties closed by the 15th (%)'],
  Operations: ['Cybersecurity risk score', 'Technologies adopted', 'Technology user engagement', 'SOP revisions', 'Project plans completed on time (%)', 'Project plans submitted on time (%)', 'Projects on track (%)'],
};
export const departmentMetrics = Object.entries(departmentLists).flatMap(([department, names]) =>
  names.map((name, index) => ({ id: `${department.toLowerCase().replaceAll(' ', '-')}-${index + 1}`,
    department: department === 'Operations' ? null : department,
    trackingArea: department === 'Operations' ? 'Operations' : null,
    name, definitionStatus: 'needs-owner-definition', calculationType: null,
    cadence: null, unit: null, ownerPositionId: null, actual: null }))).concat([
  { id: 'asset-management-fees', department: null, trackingArea: 'Management fees',
    name: 'Asset management fees', definitionStatus: 'tracked', calculationType: null,
    cadence: null, unit: 'USD', ownerPositionId: null, actual: null },
]);

// Restore approved scorecard measures that were absent from the workplan catalog.
for (const metric of approvedAnnualMetrics) if (!departmentMetrics.some(m=>m.id===metric.id)) {
  departmentMetrics.push({...metric, trackingArea: null, definitionStatus:'approved-2026-scorecard',
    calculationType:null, cadence:null, ownerPositionId:null, actual:null});
}

export const contributedRevenueCategories = [
  { id: 'grant', label: 'Grant', metricId: 'community-relations-2' },
  { id: 'neighborworks', label: 'NeighborWorks', metricId: 'community-relations-3' },
  { id: 'individual', label: 'Individual gift', metricId: 'community-relations-4' },
  { id: 'corporate', label: 'Corporate contribution', metricId: 'community-relations-5' },
  { id: 'other', label: 'Other contribution', metricId: null },
];
export const contributedRevenueEntryFields = ['categoryId', 'amount', 'reportingPeriod', 'description'];
export const financeWorkplanLinks = [
  { metricId: 'finance-5', year: 2026, theme: 'Financial resiliency',
    description: 'Amounts properties owe back to HDC', displaySeparately: true },
];

export const quarterlyObjectives = [
  [1, 'sustainable-growth', 'Enterprise Revenue', 'Strengthen Property Management Financial Sustainability'],
  [2, 'sustainable-growth', 'Enterprise Revenue', 'Execute Property Management 3rd Party Contract Exit Strategy'],
  [3, 'sustainable-growth', 'Enterprise Revenue', 'Develop and Launch Asset Management Strategy'],
  [4, 'sustainable-growth', 'Enterprise Revenue', 'Secure contributed revenue'],
  [5, 'diversify-innovate', 'Robust Pipeline', 'Finalize 4%/9% Underwriting Guidelines'],
  [7, 'diversify-innovate', 'Robust Pipeline', 'Advance College Ave Phase 2 Closing'],
  [8, 'diversify-innovate', 'Robust Pipeline', 'Advance Cornerstone Closing'],
  [9, 'agility-capacity', 'Employee Retention & Satisfaction', 'Improve Employee Retention'],
  [10, 'agility-capacity', 'Employee Retention & Satisfaction', 'Reduce Open Positions'],
  [11, 'agility-capacity', 'Operational Efficiency', 'Optimize new community lease-up process'],
  [12, 'agility-capacity', 'Operational Efficiency', 'Complete CRM Design and Validation'],
  [13, 'agility-capacity', 'Operational Efficiency', 'Digitize the Leasing Experience'],
  [14, 'agility-capacity', 'Operational Efficiency', 'Advance Enterprise AI Strategy'],
  [15, 'care-connection', 'Resident Experience/Customer Service', 'Strengthen Leadership knowledge around Resident Experience'],
].map(([number, pillarId, area, title]) => ({ id: `2026-Q3-${number}`, period: '2026-Q3',
  number, pillarId, area, title, strategyId: null,
  mappingStatus: 'strategy-link-needed' }));

export const trackingAreas = ['Advocacy', 'Operations'];
// Neutral stream IDs: informal bucket titles are not canonical metric definitions.
// Each source is counted once; the contributed-revenue total excludes adding its components again.
export const revenueMix = {
  targetDisplay: '33/33/33', status: 'mapped',
  streams: [
    { id: 'stream-1', metricIds: ['property-management-5', 'asset-management-fees'], unresolvedSources: [] },
    { id: 'stream-2', metricIds: ['finance-5', 'finance-6'], unresolvedSources: [], displayComponentsSeparately: true },
    { id: 'stream-3', metricIds: ['community-relations-1'], unresolvedSources: [],
      componentMetricIds: ['community-relations-2', 'community-relations-3', 'community-relations-4', 'community-relations-5'], aggregation: 'total-only' },
  ],
  calculation: 'Each complete stream amount / sum of the three stream amounts * 100',
};

export const reconciliationIssues = [
  { id: 'revenue-mix', message: '33/33/33 remains the displayed balance target. Actual shares use the total of all three streams; status tolerance still needs definition.' },
];
