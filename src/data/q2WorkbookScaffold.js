import q2WeeklyPriorityRowsByWeek from './q2WeeklyPriorities.json';

export const q2ReportingPeriodId = '2026-Q2';

export const q2WorkbookSummary = {
  carryoverPriorityCount: 12,
  newPriorityCount: 2,
  openPositionsTarget: '<10',
  predevelopmentFundingRequestTarget: '$1.25M',
  priorityCount: 14,
  quarterTheme: 'Choose Your Hard',
  revenueTarget: '$522K',
  revenueYtdGoal: '$650K',
};

const q2ObjectiveDefinitions = [
  {
    id: 1,
    milestone: 'Plan created. Phase 1 completed and Phase 2 implemented, with letters sent to investors and/or PHFA. Deadlines were provided to PHFA and CREA. Cinnaire responded on Bond 2 with a lower percentage than requested due to DSCR. CREA confirmed the request is with its consents team. Follow-up with PHFA on St. Catherine and review the Gov Gateway approval process.',
    ownerName: 'Shar',
    priorityId: 'enterprise-revenue',
    status: 'Watch',
    target: 'Obtain approval for PM fee increases at 11 properties, resulting in an additional $34K fee by year end.',
    title: 'Develop and implement plan to increase PM fee',
  },
  {
    id: 2,
    milestone: 'Newtowne exited on 4/21, Providence on 4/30, and Hartley on 5/1. Alliance for Health is releasing an RFP for Brandywine, with a Kevin Ressler call scheduled for 6/25 and an exit target of 10/1.',
    ownerName: 'Tammie',
    priorityId: 'enterprise-revenue',
    status: 'Steady',
    target: 'Exit three properties: Newtowne, Hartley, and Providence.',
    title: 'Terminate third-party property management business and implement exit strategy for target contracts',
  },
  {
    id: 3,
    milestone: 'Complete the Asset Manager 90-day onboarding plan and build the Asset Management tracker.',
    ownerName: 'Sam',
    priorityId: 'enterprise-revenue',
    status: 'Alert',
    target: 'Final strategy in place, implementation taskforce launched, and Asset Management tracker in place.',
    title: 'Develop and launch Asset Management strategy',
  },
  {
    id: 4,
    milestone: 'Contributed revenue YTD is $683,402, or 68% of the 2026 goal. The Q2 goal was achieved by $6,202.',
    ownerName: 'Meg',
    priorityId: 'enterprise-revenue',
    status: 'Steady',
    target: 'Secure $522K in Q2 and $650K year to date.',
    title: 'Secure contributed revenue, including the NW flexible impact grant',
  },
  {
    id: 5,
    milestone: 'Revise underwriting and complete the scope of work for the new properties by 6/30. The team is pursuing the 9% option.',
    ownerName: 'Kim',
    priorityId: 'robust-pipeline',
    status: 'Alert',
    target: 'Revise underwriting and complete the scope of work for new properties added to the deal.',
    title: 'Restructure and demonstrate feasibility for the NEPA Preservation Project',
  },
  {
    id: 6,
    milestone: 'Closed on June 3. Community meeting scheduled for July 8.',
    ownerName: 'Abby',
    priorityId: 'robust-pipeline',
    status: 'Steady',
    target: 'HDC is the owner and management agent.',
    title: "Acquire Nathan's Village and assume property management",
  },
  {
    id: 7,
    milestone: 'College Avenue Phase 2 drawings are at 70%, GC RFP responses were received, and a GC decision is due by 6/22. Cornerstone demolition has started, land development is complete, 70% drawings are due by 6/30, and the master schedule needs an update.',
    ownerName: 'Kim',
    priorityId: 'robust-pipeline',
    status: 'Steady',
    target: 'College Avenue Phase 2: complete 100% drawings and select a GC. Cornerstone: complete 70% drawings, historic approval, and demolition.',
    title: 'Advance College Avenue Phase 2 and Cornerstone closing',
  },
  {
    id: 8,
    milestone: 'The strategy was not completed and will move to Q3.',
    ownerName: 'Chris',
    priorityId: 'robust-pipeline',
    status: 'Alert',
    target: 'Put 4% and 9% underwriting guidelines in place.',
    title: 'Develop 4% and 9% underwriting guidelines',
  },
  {
    id: 9,
    milestone: 'Lancaster County Community Foundation awarded $500,000. A $750,000 High Foundation submission is due 6/30. The team must develop and confirm a strategy for four additional opportunities.',
    ownerName: 'Meg',
    priorityId: 'robust-pipeline',
    status: 'Steady',
    target: 'Make $1.25M in funding requests.',
    title: 'Develop and launch Predevelopment Revolving Fund strategy',
  },
  {
    id: 10,
    milestone: 'All critical roles were filled. Attrition remains an active concern.',
    ownerName: 'Michele',
    priorityId: 'employee-retention',
    status: 'Steady',
    target: 'Fill the Talent Management Specialist, Employee Relations Coordinator, Asset Manager, and Director of Resident Services roles.',
    title: 'Execute final components of the Workforce Relief Program',
  },
  {
    id: 11,
    milestone: 'There are 16 open positions, with three candidates waiting to start and 13 positions in active recruitment.',
    ownerName: 'Michele',
    priorityId: 'employee-retention',
    status: 'Alert',
    target: 'Reduce open positions to nine.',
    title: 'Reduce open positions below 10',
  },
  {
    id: 12,
    milestone: 'Finalize by 6/30/26. Across 49 employees, onboarding scored 4.33 out of 5 (87%) and training scored 4.09 (81%). For hires from October through January, onboarding scored 4.04 (81%) and training 2.96 (59%). For hires from February to present, onboarding scored 4.43 (89%) and training 4.50 (90%).',
    ownerName: 'Michele',
    priorityId: 'employee-retention',
    status: 'Watch',
    target: 'Reach 100% employee satisfaction with onboarding and training.',
    title: 'Implement new employee onboarding and training program',
  },
  {
    id: 13,
    milestone: 'Third-party contractors are coordinating the work. Data migration will add cost. Demo configuration is due by 6/30, with staggered user acceptance testing by 7/20.',
    ownerName: 'Parnell',
    priorityId: 'operational-efficiency',
    status: 'Steady',
    target: 'Build the CRM and have it ready to test in Q3.',
    title: 'Complete Client Relationship Management (CRM) design',
  },
  {
    id: 14,
    milestone: 'Working sessions are on hold.',
    ownerName: 'Tammie',
    priorityId: 'resident-experience',
    status: 'Alert',
    target: 'Develop the Resident Experience philosophy, Resident Journey Map, and project plan.',
    title: 'Develop Resident Experience philosophy and Standards of Excellence',
  },
];

const q2PriorityDefinitions = [
  {
    accent: '#2f7d32',
    description: 'Enterprise fees, asset management, and contributed revenue.',
    id: 'enterprise-revenue',
    name: 'Enterprise Revenue',
    strategicPillar: 'Sustainable Growth',
    strategicPillarId: 'sustainable-growth',
  },
  {
    accent: '#1a66a8',
    description: 'Development feasibility, closings, underwriting, and predevelopment capital.',
    id: 'robust-pipeline',
    name: 'Robust Pipeline',
    strategicPillar: 'Diversify & Innovate',
    strategicPillarId: 'diversify-innovate',
  },
  {
    accent: '#b67a19',
    description: 'Hiring, retention, onboarding, and training.',
    id: 'employee-retention',
    name: 'Employee Retention & Satisfaction',
    strategicPillar: 'Agility & Capability',
    strategicPillarId: 'agility-capacity',
  },
  {
    accent: '#2c7a7b',
    description: 'Systems and operating practices that improve agency-wide execution.',
    id: 'operational-efficiency',
    name: 'Operational Efficiency',
    strategicPillar: 'Agility & Capability',
    strategicPillarId: 'agility-capacity',
  },
  {
    accent: '#b03a34',
    description: 'A consistent philosophy and standard for the resident experience.',
    id: 'resident-experience',
    name: 'Resident Experience/Customer Service',
    strategicPillar: 'Care & Connection',
    strategicPillarId: 'care-connection',
  },
];

const historicalOwnerDefaults = {
  Abby: { department: 'Real Estate Development', role: 'Historical objective owner' },
  Angie: { department: 'Compliance', role: 'Senior Training & Compliance Manager' },
  Ann: { department: 'Finance', role: 'Finance Team Member' },
  Chris: { department: 'Real Estate Development', role: 'Real Estate Development Team Member' },
  Dana: { department: 'Executive Office', role: 'CEO' },
  Jaime: { department: 'Property Management', role: 'Director of Property Management' },
  Kelly: { department: 'Resident Services', role: 'Director of Resident Services' },
  Kim: { department: 'Real Estate Development', role: 'VP of Real Estate Development' },
  Meg: { department: 'Impact and Advancement', role: 'Senior VP of Impact and Advancement' },
  Michele: { department: 'Human Resources', role: 'Director of HR' },
  Parnell: { department: 'Operations', role: 'Operations Team Member' },
  Sam: { department: 'Finance', role: 'CFO' },
  Shar: { department: 'Finance', role: 'Finance Team Member' },
  Tammie: { department: 'Operations', role: 'VP & COO' },
};

const slugify = (value) => String(value || '')
  .toLowerCase()
  .replaceAll(/[^a-z0-9]+/g, '-')
  .replaceAll(/^-|-$/g, '');

const firstName = (value) => String(value || '').trim().split(/\s+/)[0].toLowerCase();

const resolveOwner = (directory, ownerName) => {
  const existing = (directory || []).find((user) => firstName(user.name) === ownerName.toLowerCase());
  if (existing) return existing;

  const fallback = historicalOwnerDefaults[ownerName] || {
    department: 'Unassigned',
    role: 'Historical record owner',
  };

  return {
    ...fallback,
    dashboardFocus: 'operations',
    id: `historical-${slugify(ownerName)}`,
    initials: ownerName.slice(0, 2).toUpperCase(),
    name: ownerName,
    organization: 'HDC MidAtlantic',
    teams: [fallback.department],
    workingGroup: 'Historical',
  };
};

const progressByRoadmapStatus = {
  Alert: 20,
  Steady: 100,
  Watch: 55,
};

const scorecardStatusByRoadmapStatus = {
  Alert: 'Off Track',
  Steady: 'On Track',
  Watch: 'Needs Attention',
};

const rootStatus = (objectives) => {
  if (objectives.some((objective) => objective.status === 'Alert')) return 'Alert';
  if (objectives.some((objective) => objective.status === 'Watch')) return 'Watch';
  return 'Steady';
};

export const buildQ2EnterprisePriorities = (directory = []) => q2PriorityDefinitions.map((definition) => {
  const keyObjectives = q2ObjectiveDefinitions
    .filter((objective) => objective.priorityId === definition.id)
    .map((objective) => {
      const owner = resolveOwner(directory, objective.ownerName);
      const objectiveId = `q2-2026-objective-${String(objective.id).padStart(2, '0')}`;

      return {
        department: owner.department,
        id: objectiveId,
        kpis: [{
          currentLabel: objective.milestone,
          id: `${objectiveId}-kpi`,
          progress: progressByRoadmapStatus[objective.status],
          status: objective.status,
          target: objective.target,
          title: objective.title,
        }],
        notes: objective.milestone,
        owner,
        ownerIds: [owner.id],
        source: {
          objectiveNumber: objective.id,
          sheet: 'Q2 2026 Enterprise Priorities',
          workbook: 'OLT_Action Tracker-local.xlsx',
        },
        status: objective.status,
        title: objective.title,
        workplanAccess: owner.department,
        workplanSummary: objective.target,
        workplanTitle: 'Q2 2026 Enterprise Priorities',
      };
    });

  return {
    children: [],
    company: true,
    description: definition.description,
    id: `q2-2026-${definition.id}`,
    keyObjectives,
    name: definition.name,
    reportingPeriodId: q2ReportingPeriodId,
    roadmapStatus: rootStatus(keyObjectives),
    source: {
      sheet: 'Q2 2026 Enterprise Priorities',
      workbook: 'OLT_Action Tracker-local.xlsx',
    },
    strategicPillar: definition.strategicPillar,
    strategicPillarId: definition.strategicPillarId,
    strategicPlan: 'Resident-Centered. Future-Ready.',
    type: 'ROLLUP',
  };
});

export const buildQ2ExecutivePulseSeed = (directory = []) => {
  const priorities = buildQ2EnterprisePriorities(directory);

  return {
    discussionQuestions: [
      { id: 'ahead', prompt: 'Where are we ahead of plan?', response: '' },
      { id: 'behind', prompt: 'Where are we behind expectations?', response: '' },
      { id: 'attention', prompt: 'Which trends require board attention?', response: '' },
      { id: 'risk', prompt: 'What risks could affect our performance?', response: '' },
    ],
    enterprisePriorities: priorities.map((priority) => priority.name),
    mission: 'Resident-Centered. Future-Ready.',
    preparedFor: 'HDC MidAtlantic Board of Directors',
    reportingPeriodId: q2ReportingPeriodId,
    scorecards: priorities.map((priority) => {
      const definition = q2PriorityDefinitions.find((candidate) => (
        `q2-2026-${candidate.id}` === priority.id
      ));
      const cardStatus = scorecardStatusByRoadmapStatus[priority.roadmapStatus];

      return {
        accent: definition.accent,
        id: priority.id,
        metrics: priority.keyObjectives.map((objective) => ({
          currentStatus: objective.notes,
          dept: objective.department,
          id: objective.kpis[0].id,
          kpi: objective.title,
          month1: '',
          month2: '',
          month3: '',
          periodResult: objective.notes,
          priorPeriodResult: '',
          progress: objective.kpis[0].progress,
          status: scorecardStatusByRoadmapStatus[objective.status],
          target: objective.kpis[0].target,
        })),
        orgPriority: priority.name,
        status: cardStatus,
        strategicGoal: priority.strategicPillar,
        title: priority.name,
      };
    }),
    source: {
      roadmapWorkbook: 'Q2Roadmap-Local.xlsx',
      scorecardSheet: 'Q2 2026 Enterprise Priorities',
      trackerWorkbook: 'OLT_Action Tracker-local.xlsx',
    },
    summary: q2WorkbookSummary,
  };
};

const weeklyPriorityIdByContent = (entry) => {
  const text = [
    entry.title,
    entry.enterpriseAlignment,
    entry.departmentAlignment,
    entry.sourceAlignmentLabel,
  ].join(' ').toLowerCase();

  if (/resident|care and connection|customer service/.test(text)) return 'q2-2026-resident-experience';
  if (/pipeline|diversif|predevelopment|college ave|cornerstone|nathan|nepa/.test(text)) return 'q2-2026-robust-pipeline';
  if (/retention|workforce relief|work relief|recruit|hiring|onboard|training|human resources|employee/.test(text)) return 'q2-2026-employee-retention';
  if (/revenue|sustainable growth|sponsor|grant|fundrais|fee increase|equity installment/.test(text)) return 'q2-2026-enterprise-revenue';
  if (/operational|operations|crm|compass|yardi|asset management|payroll|401k|books|a\/p|it /.test(text)) return 'q2-2026-operational-efficiency';
  return null;
};

const weekEndByStart = {
  '2026-05-11': '2026-05-15',
  '2026-05-18': '2026-05-22',
  '2026-05-26': '2026-05-29',
  '2026-06-01': '2026-06-05',
  '2026-06-08': '2026-06-12',
  '2026-06-15': '2026-06-19',
  '2026-06-22': '2026-06-26',
  '2026-06-29': '2026-07-03',
};

export const buildQ2WeeklyPriorityEntries = (directory = []) => Object.fromEntries(
  Object.entries(q2WeeklyPriorityRowsByWeek).map(([weekStart, rows]) => {
    const reportId = `war-${weekStart}`;

    return [
      reportId,
      rows.map((row) => {
        const owner = resolveOwner(directory, row.ownerName);
        const priorityId = weeklyPriorityIdByContent(row);

        return {
          alignedPriorityLabel: row.sourceAlignmentLabel,
          alignmentType: priorityId ? 'enterprise' : 'department',
          carriedFromEntryId: null,
          createdAt: `${weekStart}T09:00:00-04:00`,
          department: owner.department,
          departmentAlignment: row.departmentAlignment,
          desiredResult: row.desiredResult,
          due: weekEndByStart[weekStart],
          enterpriseAlignment: row.enterpriseAlignment,
          id: `wae-${reportId}-${owner.id}-${row.rank}`,
          objectiveId: null,
          owner,
          previousRank: null,
          priorityId,
          rank: row.rank,
          reportId,
          riskSupportNote: row.riskSupportNote,
          sourceAlignmentLabel: row.sourceAlignmentLabel,
          sourceReviewNote: row.sourceReviewNote,
          sourceSheet: row.sourceSheet,
          sourceType: 'weekly_priority_entry',
          status: 'no_data',
          tasks: [],
          title: row.title,
          updatedAt: `${weekEndByStart[weekStart]}T17:00:00-04:00`,
          workplanId: null,
        };
      }),
    ];
  }),
);

export const q2WeeklyPriorityCount = Object.values(q2WeeklyPriorityRowsByWeek)
  .reduce((total, rows) => total + rows.length, 0);
