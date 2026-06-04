const dashboardPaths = {
  company: '/dashboard/company',
  individual: '/dashboard/me',
};

export const getPrimaryDashboardPath = (user) => dashboardPaths[user?.primaryDashboard] || dashboardPaths.individual;

export const isCompanyPrimaryDashboard = (user) => getPrimaryDashboardPath(user) === dashboardPaths.company;

export default getPrimaryDashboardPath;
