export const departments = [
  'Administration',
  'Advocacy',
  'Community Relations',
  'Compliance',
  'Executive Office',
  'Finance',
  'Human Resources',
  'Impact and Advancement',
  'Operations',
  'Property Management',
  'Real Estate Development',
  'Resident Services',
];

const baseUser = {
  avatarUrl: '',
  organization: 'HDC MidAtlantic',
  organizationId: 'org-test',
};

export const users = [
  { id: 'u0', name: 'Compass Admin', initials: 'CA', role: 'Administrator', workingGroup: 'Administration', department: 'Administration', dashboardFocus: 'operations', teams: ['Administration'], primaryDashboard: 'company' },
  { id: 'u1', name: 'Dana Hanchin', initials: 'DH', role: 'CEO', workingGroup: 'ELT', department: 'Executive Office', dashboardFocus: 'advocacy', teams: ['Executive Leadership', 'Advocacy'], primaryDashboard: 'company' },
  { id: 'u2', name: 'Sam Jordan', initials: 'SJ', role: 'CFO', workingGroup: 'ELT', department: 'Finance', dashboardFocus: 'financials', teams: ['Finance'], primaryDashboard: 'company' },
  { id: 'u8', name: 'Tammie Fitzpatrick', initials: 'TF', role: 'VP & COO', workingGroup: 'ELT', department: 'Operations', dashboardFocus: 'operations', teams: ['Operations'], primaryDashboard: 'company' },
  { id: 'u9', name: 'Shar', initials: 'SH', role: 'Finance Team Member', workingGroup: 'OLT', department: 'Finance', dashboardFocus: 'financials', teams: ['Finance'], primaryDashboard: 'individual' },
  { id: 'u10', name: 'Ann', initials: 'AN', role: 'Finance Team Member', workingGroup: 'OLT', department: 'Finance', dashboardFocus: 'financials', teams: ['Finance'], primaryDashboard: 'individual' },
  { id: 'u11', name: 'Parnell', initials: 'PK', role: 'Operations Team Member', workingGroup: 'OLT', department: 'Operations', dashboardFocus: 'operations', teams: ['Operations'], primaryDashboard: 'individual' },
  { id: 'u13', name: 'Chris', initials: 'CH', role: 'Development Team Member', workingGroup: 'OLT', department: 'Real Estate Development', dashboardFocus: 'development', teams: ['Real Estate Development'], primaryDashboard: 'individual' },
  { id: 'u18', name: 'Gigi Lopez', initials: 'GL', role: 'Marketing and Lease Up Manager', workingGroup: 'Team Member', department: 'Property Management', dashboardFocus: 'property_management', teams: ['Property Management'], primaryDashboard: 'individual' },
  { id: 'u19', name: 'Nina', initials: 'NI', role: 'Advocacy Operations Coordinator', workingGroup: 'Team Member', department: 'Advocacy', dashboardFocus: 'advocacy', teams: ['Advocacy'], primaryDashboard: 'individual' },
].map((user) => ({ ...baseUser, ...user }));

export const reportingPeriods = [
  {
    databaseId: 'period-q2',
    end: '2026-06-30',
    id: '2026-Q2',
    label: 'Q2 2026',
    quarter: 'Q2',
    start: '2026-04-01',
    status: 'closed',
    theme: '',
    year: 2026,
  },
  {
    databaseId: 'period-q3',
    end: '2026-09-30',
    id: '2026-Q3',
    label: 'Q3 2026',
    quarter: 'Q3',
    start: '2026-07-01',
    status: 'active',
    theme: '',
    year: 2026,
  },
];

export const currentWeeklyReport = {
  id: 'week-2026-07-20',
  label: 'Week of Jul 20',
  reviewMeetingAt: '2026-07-24T10:00:00',
  status: 'draft',
  submissionDueAt: '2026-07-24T12:00:00',
  weekEnd: '2026-07-24',
  weekStart: '2026-07-20',
};

export const strategicPlan = {
  description: '',
  id: 'plan-test',
  name: 'Test Strategic Plan',
  owner: 'HDC MidAtlantic',
  pillars: [
    { description: '', id: 'advocate-change', name: 'Advocate for Change', order: 1, successMetrics: [] },
    { description: '', id: 'agility-capacity', name: 'Agility & Capability', order: 2, successMetrics: [] },
  ],
  timeframe: '2026-2030',
};

export const departmentRecords = departments.map((name, index) => ({
  id: `department-${index}`,
  lead: name === 'Advocacy' ? users.find((user) => user.id === 'u1') : null,
  name,
}));
