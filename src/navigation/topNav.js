export const topNavMenus = [
  {
    label: 'Strategy',
    items: [
      { label: 'Annual Initiatives', path: '/initiatives' },
      { label: 'Company Dashboard', path: '/dashboard/company' },
      { label: 'Priority Map', path: '/priorities' },
      { label: 'Weekly Tracker', path: '/weekly-tracker' },
    ],
  },
  {
    label: 'Culture',
    items: [
      { label: 'Huddles', path: '/huddles' },
      { label: 'Stucks', path: '/stucks' },
      { label: 'Team Health', path: '/culture/team-health' },
    ],
  },
  {
    label: 'Reports',
    items: [
      { label: 'Data Table', path: '/metrics/table' },
      { label: 'Executive Summary', path: '/reports/executive-summary' },
      { label: 'Exports', path: '/reports/exports' },
    ],
  },
  {
    label: 'Administration',
    items: [
      { label: 'Users', path: '/admin/users' },
      { label: 'Teams', path: '/admin/teams' },
      { label: 'Permissions', path: '/admin/permissions' },
    ],
  },
];

export const quickAddItems = [
  { label: 'Action Item', path: '/action-items?new=1' },
  { label: 'Priority', path: '/priorities?new=1' },
  { label: 'Stuck', path: '/stucks?new=1' },
  { label: 'Workplan', path: '/workplans?new=1' },
];
