const userSeed = [
  {
    id: 'u1',
    name: 'Dana Hanchin',
    initials: 'DH',
    role: 'CEO',
    workingGroup: 'ELT',
    organization: 'HDC MidAtlantic',
    department: 'Executive Office',
    dashboardFocus: 'advocacy',
    teams: ['Executive Leadership', 'Advocacy', 'Board Relations'],
  },
  {
    id: 'u19',
    name: 'Nina',
    initials: 'NI',
    role: 'Advocacy Operations Coordinator',
    workingGroup: 'Team Member',
    organization: 'HDC MidAtlantic',
    department: 'Executive Office',
    dashboardFocus: 'advocacy',
    teams: ['Executive Office', 'Advocacy'],
    primaryDashboard: 'individual',
  },
  {
    id: 'u0',
    name: 'Compass Admin',
    initials: 'CA',
    role: 'Administrator',
    workingGroup: 'Administration',
    organization: 'HDC MidAtlantic',
    department: 'Administration',
    dashboardFocus: 'operations',
    teams: ['Administration', 'Executive Office'],
    primaryDashboard: 'company',
  },
  {
    id: 'u2',
    name: 'Sam Jordan',
    initials: 'SJ',
    role: 'CFO',
    workingGroup: 'ELT',
    organization: 'HDC MidAtlantic',
    department: 'Finance',
    dashboardFocus: 'financials',
    teams: ['Finance', 'Executive Leadership'],
  },
  {
    id: 'u3',
    name: 'Kim Krauter',
    initials: 'KK',
    role: 'VP of Real Estate Development',
    workingGroup: 'ELT',
    organization: 'HDC MidAtlantic',
    department: 'Real Estate Development',
    dashboardFocus: 'development',
    teams: ['Real Estate Development', 'Executive Leadership'],
  },
  {
    id: 'u4',
    name: 'Jaime Shillady',
    initials: 'JS',
    role: 'Director of Property Management',
    workingGroup: 'OLT',
    organization: 'HDC MidAtlantic',
    department: 'Property Management',
    dashboardFocus: 'property_management',
    teams: ['Property Management', 'Leasing', 'Maintenance'],
  },
  {
    id: 'u5',
    name: 'Michele Stauffer',
    initials: 'MS',
    role: 'Director of HR',
    workingGroup: 'OLT',
    organization: 'HDC MidAtlantic',
    department: 'Human Resources',
    dashboardFocus: 'hr',
    teams: ['Human Resources', 'Hiring Managers'],
  },
  {
    id: 'u6',
    name: 'Meg Struck',
    initials: 'MS',
    role: 'Senior VP of Impact and Advancement',
    workingGroup: 'ELT',
    organization: 'HDC MidAtlantic',
    department: 'Impact and Advancement',
    dashboardFocus: 'advancement',
    teams: ['Advancement', 'Community Relations', 'Grant Writing'],
  },
  {
    id: 'u7',
    name: 'Michael Sedoti',
    initials: 'MS',
    role: 'Resident Services Manager',
    workingGroup: 'Team Member',
    organization: 'HDC MidAtlantic',
    department: 'Resident Services',
    dashboardFocus: 'resident_services',
    teams: ['Resident Services', 'Resident Service Coordinators'],
  },
  {
    id: 'u8',
    name: 'Tammie Fitzpatrick',
    initials: 'TF',
    role: 'VP & COO',
    workingGroup: 'ELT',
    organization: 'HDC MidAtlantic',
    department: 'Operations',
    dashboardFocus: 'operations',
    teams: ['Operations', 'Executive Leadership', 'Resident Services'],
  },
  {
    id: 'u9',
    name: 'Shar',
    initials: 'SH',
    role: 'Finance Team Member',
    workingGroup: 'Team Member',
    organization: 'HDC MidAtlantic',
    department: 'Finance',
    dashboardFocus: 'financials',
    teams: ['Finance'],
  },
  {
    id: 'u10',
    name: 'Ann',
    initials: 'AN',
    role: 'Finance Team Member',
    workingGroup: 'Team Member',
    organization: 'HDC MidAtlantic',
    department: 'Finance',
    dashboardFocus: 'financials',
    teams: ['Finance'],
  },
  {
    id: 'u11',
    name: 'Parnell',
    initials: 'PK',
    role: 'Operations Team Member',
    workingGroup: 'Team Member',
    organization: 'HDC MidAtlantic',
    department: 'Operations',
    dashboardFocus: 'operations',
    teams: ['Operations'],
  },
  {
    id: 'u12',
    name: 'Nana Sallh',
    initials: 'NS',
    role: 'Community Relations Specialist',
    workingGroup: 'Team Member',
    organization: 'HDC MidAtlantic',
    department: 'Community Relations',
    dashboardFocus: 'advancement',
    teams: ['Community Relations', 'Advancement'],
  },
  {
    id: 'u13',
    name: 'Chris',
    initials: 'CH',
    role: 'Real Estate Development Team Member',
    workingGroup: 'Team Member',
    organization: 'HDC MidAtlantic',
    department: 'Real Estate Development',
    dashboardFocus: 'development',
    teams: ['Real Estate Development'],
  },
  {
    id: 'u14',
    name: 'Abby',
    initials: 'AB',
    role: 'Real Estate Development Team Member',
    workingGroup: 'Team Member',
    organization: 'HDC MidAtlantic',
    department: 'Real Estate Development',
    dashboardFocus: 'development',
    teams: ['Real Estate Development'],
  },
  {
    id: 'u15',
    name: 'Angie Ruhle',
    initials: 'AR',
    role: 'Senior Training & Compliance Manager',
    workingGroup: 'OLT',
    organization: 'HDC MidAtlantic',
    department: 'Compliance',
    dashboardFocus: 'property_management',
    teams: ['Property Management', 'Compliance', 'Training'],
  },
  {
    id: 'u16',
    name: 'Ibrahim',
    initials: 'IB',
    role: 'Compliance Team Member',
    workingGroup: 'Team Member',
    organization: 'HDC MidAtlantic',
    department: 'Compliance',
    dashboardFocus: 'property_management',
    teams: ['Compliance', 'Property Management'],
  },
  {
    id: 'u17',
    name: 'Kelly Cook',
    initials: 'KC',
    role: 'Director of Resident Services',
    workingGroup: 'OLT',
    organization: 'HDC MidAtlantic',
    department: 'Resident Services',
    dashboardFocus: 'resident_services',
    teams: ['Resident Services'],
  },
  {
    id: 'u18',
    name: 'Gigi Lopez',
    initials: 'GL',
    role: 'Marketing and Lease Up Manager',
    workingGroup: 'Team Member',
    organization: 'HDC MidAtlantic',
    department: 'Property Management',
    dashboardFocus: 'property_management',
    teams: ['Property Management', 'Leasing', 'Marketing'],
  },
];

const defaultPrimaryDashboardFor = (user) => (user.workingGroup === 'ELT' ? 'company' : 'individual');

export const users = userSeed.map((user) => ({
  ...user,
  primaryDashboard: user.primaryDashboard || defaultPrimaryDashboardFor(user),
}));

export const userById = Object.fromEntries(users.map((user) => [user.id, user]));

// Stable operating-model references remain available to creation forms.
export const strategicPlan2030 = {
  id: 'sp-2030',
  name: 'Resident-Centered. Future-Ready.',
  timeframe: '2026-2030',
  owner: 'HDC MidAtlantic',
  description: 'HDC MidAtlantic\'s internal strategic plan through 2030.',
  pillars: [
    {
      id: 'care-connection',
      order: 1,
      name: 'Care and Connection',
      description: 'Deepen commitment to residents and communities through trauma-informed resident services and design.',
      successMetrics: [
        { label: 'Resident satisfaction', target: '>85%' },
        { label: 'Resident Experience Score', target: '>60%' },
        { label: 'Wage growth for working families', target: '>25% by 2030' },
      ],
    },
    {
      id: 'diversify-innovate',
      order: 2,
      name: 'Diversify & Innovate',
      description: 'Explore inclusive, community-responsive models to provide affordable housing, expand impact, and better serve communities in need.',
      successMetrics: [
        { label: 'Growth rate in new units outside acquisitions', target: '>15%' },
        { label: 'Units created, acquired, or preserved', target: '>750' },
        { label: 'Enterprise-level capital for real estate development', target: '$1.5M' },
        { label: 'New housing models', target: '5-7' },
      ],
    },
    {
      id: 'advocate-change',
      order: 3,
      name: 'Advocate for Change',
      description: 'Influence policy and systems to benefit residents, advance HDC\'s mission, and enhance the affordable housing industry.',
      successMetrics: [
        { label: 'Coalitions and allies', target: '2-3' },
        { label: 'Elected official and policymaker engagement', target: '>50% increase' },
        { label: 'Resident leaders and stakeholders participating', target: '100' },
        { label: 'Policy wins', target: '3' },
      ],
    },
    {
      id: 'agility-capacity',
      order: 4,
      name: 'Agility & Capability',
      description: 'Adapt, respond, and evolve effectively in a dynamic environment, strengthening both the workforce and organizational infrastructure.',
      successMetrics: [
        { label: 'Employee satisfaction', target: '90%' },
        { label: 'Employee Net Promoter Score', target: '>50' },
        { label: 'Employee engagement rate', target: '>50%' },
        { label: 'Newly adopted technologies with measurable time or cost savings', target: '5' },
      ],
    },
    {
      id: 'sustainable-growth',
      order: 5,
      name: 'Sustainable Growth',
      description: 'Ensure financial stability and responsible growth for the long-term viability and expanded impact of HDC.',
      successMetrics: [
        { label: 'Balanced diversification of revenue streams', target: 'Achieved' },
        { label: 'Days cash on hand', target: '150 days' },
        { label: 'Philanthropic contribution growth', target: 'Outpace national average' },
        { label: 'Positive brand visibility and reach score', target: '>80%' },
      ],
    },
  ],
};

export const strategicPillarById = Object.fromEntries(strategicPlan2030.pillars.map((pillar) => [pillar.id, pillar]));

// Operating collections intentionally start empty. Users create the live records.
export const metrics = [];
export const priorities = [];
export const weeklyPriorities = [];
export const financeWeeklyPriorities = [];
export const weeklyTrackerParticipants = [];
export const weeklyActionReports = [];
export const weeklyActionEntries = [];
export const huddles = [];
export const stucks = [];
export const queuedTasks = [];
export const notificationEvents = [];
export const calendarEvents = [];
export const advocacyContacts = [];

export const advocacyTouchpoints = [];

export const advocacyInitiatives = [];

export const advocacyWorkplans = [];
export const advocacyPriorities = [];
export const departmentWorkplans = [];

