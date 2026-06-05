export const topNavMenus = [
  {
    label: 'Strategy',
    items: [
      { featureKey: 'initiatives', label: 'Annual Initiatives', path: '/initiatives' },
      { featureKey: 'companyDashboard', label: 'Company Dashboard', path: '/dashboard/company' },
      { featureKey: 'priorities', label: 'Priority Map', path: '/priorities' },
      { featureKey: 'weeklyTracker', label: 'Weekly Tracker', path: '/weekly-tracker' },
    ],
  },
  {
    label: 'Culture',
    items: [
      { featureKey: 'huddles', label: 'Huddles', path: '/huddles' },
      { featureKey: 'stucks', label: 'Stucks', path: '/stucks' },
      { featureKey: 'teamHealth', label: 'Team Health', path: '/culture/team-health' },
    ],
  },
  {
    label: 'Reports',
    items: [
      { featureKey: 'dataTable', label: 'Data Table', path: '/metrics/table' },
      { featureKey: 'reports', label: 'Executive Summary', path: '/reports/executive-summary' },
      { featureKey: 'reports', label: 'Exports', path: '/reports/exports' },
    ],
  },
  {
    label: 'Administration',
    items: [
      { featureKey: 'adminUsers', label: 'Users', path: '/admin/users' },
      { featureKey: 'adminTeams', label: 'Teams', path: '/admin/teams' },
      { featureKey: 'adminPermissions', label: 'Permissions', path: '/admin/permissions' },
      { featureKey: 'featureRollout', label: 'Feature Rollout', path: '/admin/features' },
    ],
  },
];

export const quickAddItems = [
  { featureKey: 'weeklyTracker', label: 'Weekly Priority', path: '/weekly-tracker?new=priority' },
  { featureKey: 'taskViews', label: 'Queued Task', path: '/task-views?new=queue' },
  { featureKey: 'priorities', label: 'Priority', path: '/priorities?new=1' },
  { featureKey: 'stucks', label: 'Stuck', path: '/stucks?new=1' },
  { featureKey: 'workplans', label: 'Workplan', path: '/workplans?new=1' },
];
