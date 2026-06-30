const dashboardPaths = {
  company: '/dashboard/organization',
  individual: '/dashboard/me',
};

export const getPrimaryDashboardPath = (user) => dashboardPaths[user?.primaryDashboard] || dashboardPaths.individual;

export const isCompanyPrimaryDashboard = (user) => getPrimaryDashboardPath(user) === dashboardPaths.company;

export default getPrimaryDashboardPath;
