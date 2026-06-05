export const featureCategories = [
  'Base',
  'Accountability',
  'Operating Rhythm',
  'Reporting',
  'Administration',
  'Guidance',
];

export const featureCatalog = [
  {
    category: 'Base',
    description: 'Personal landing page, profile basics, and user identity.',
    key: 'myDashboard',
    label: 'My Dashboard',
  },
  {
    category: 'Base',
    description: 'Organization-wide executive and operating priority readout.',
    key: 'companyDashboard',
    label: 'Company Dashboard',
  },
  {
    category: 'Accountability',
    description: 'Quarterly priorities, status signals, objectives, and KPI links.',
    key: 'priorities',
    label: 'Priorities',
  },
  {
    category: 'Accountability',
    description: 'Department workplans and linked priority commitments.',
    key: 'workplans',
    label: 'Workplans',
  },
  {
    category: 'Accountability',
    description: 'Annual initiatives and strategic project lanes.',
    key: 'initiatives',
    label: 'Annual Initiatives',
  },
  {
    category: 'Operating Rhythm',
    description: 'Team huddles, participants, and associated weekly rhythm.',
    key: 'huddles',
    label: 'Huddles',
  },
  {
    category: 'Operating Rhythm',
    description: 'Named blockers and help requests.',
    key: 'stucks',
    label: 'Stucks',
  },
  {
    category: 'Operating Rhythm',
    description: 'Views for assigned follow-through work, due dates, visibility, and queued tasks.',
    key: 'taskViews',
    label: 'Task Views',
  },
  {
    category: 'Operating Rhythm',
    description: 'Weekly owner commitments, carryovers, and status review.',
    key: 'weeklyTracker',
    label: 'Weekly Tracker',
  },
  {
    category: 'Operating Rhythm',
    description: 'Personal and organization calendar events.',
    key: 'calendar',
    label: 'Calendar',
  },
  {
    category: 'Reporting',
    description: 'Critical numbers, table views, and metric detail pages.',
    key: 'metrics',
    label: 'Metrics',
  },
  {
    category: 'Administration',
    description: 'Administrator-only structured data table for inspecting raw operating records.',
    key: 'dataTable',
    label: 'Data Table',
  },
  {
    category: 'Reporting',
    description: 'Leadership summaries and report exports.',
    key: 'reports',
    label: 'Reports',
  },
  {
    category: 'Reporting',
    description: 'Team health and capacity signal pages.',
    key: 'teamHealth',
    label: 'Team Health',
  },
  {
    category: 'Administration',
    description: 'User directory and profile review.',
    key: 'adminUsers',
    label: 'Admin Users',
  },
  {
    category: 'Administration',
    description: 'Team membership and team map review.',
    key: 'adminTeams',
    label: 'Admin Teams',
  },
  {
    category: 'Administration',
    description: 'Permission model and access reference.',
    key: 'adminPermissions',
    label: 'Admin Permissions',
  },
  {
    category: 'Administration',
    description: 'Per-user functionality rollout switches.',
    key: 'featureRollout',
    label: 'Feature Rollout',
  },
  {
    category: 'Guidance',
    description: 'Mandatory first-login practice walkthrough.',
    key: 'guidedPractice',
    label: 'Guided Practice',
  },
];

export const featureCatalogByKey = Object.fromEntries(featureCatalog.map((feature) => [feature.key, feature]));

export const baseFeatureKeys = ['myDashboard', 'companyDashboard', 'profile', 'guidedPractice'];
