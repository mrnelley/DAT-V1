import { CssBaseline, ThemeProvider } from '@mui/material';
import { QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import LoginPage from './components/auth/LoginPage';
import CurbAppealSubmissionPage from './components/curb-appeal/CurbAppealSubmissionPage';
import DashboardPage from './components/dashboard/DashboardPage';
import HuddlesPage from './components/huddles/HuddlesPage';
import HuddleFormPage from './components/huddles/HuddleFormPage';
import HuddleItemPage from './components/huddles/HuddleItemPage';
import InitiativesPage from './components/initiatives/InitiativesPage';
import AppShell from './components/layout/AppShell';
import LearnDictionaryPage from './components/learn/LearnDictionaryPage';
import DataTablePage from './components/metrics/DataTablePage';
import CompassDestinationPage from './components/navigation/CompassDestinationPage';
import NotificationsPage from './components/notifications/NotificationsPage';
import ProfilePage from './components/profile/ProfilePage';
import OperationalPriorityPage from './components/priorities/OperationalPriorityPage';
import PrioritiesPage from './components/priorities/PrioritiesPage';
import FeatureGate from './components/shared/FeatureGate';
import PlaceholderPage from './components/shared/PlaceholderPage';
import StucksPage from './components/stucks/StucksPage';
import TaskViewsPage from './components/task-views/TaskViewsPage';
import WeeklyActionTrackerPage from './components/weekly-tracker/WeeklyActionTrackerPage';
import WorkplansPage from './components/workplans/WorkplansPage';
import { CurbAppealProvider } from './context/CurbAppealContext';
import { ActionFeedbackProvider } from './context/ActionFeedbackContext';
import { FeatureAccessProvider } from './context/FeatureAccessContext';
import { NotificationsProvider } from './context/NotificationsContext';
import { CalendarEventProvider } from './context/CalendarEventContext';
import { OperatingDataProvider } from './context/OperatingDataContext';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { queryClient } from './store/queryClient';
import theme from './theme';

const AnimatedRoutes = () => {
  const location = useLocation();
  const { primaryDashboardPath } = useAuth();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Navigate to={primaryDashboardPath} replace />} />
        <Route path="/dashboard/me" element={<FeatureGate featureKey="myDashboard"><DashboardPage /></FeatureGate>} />
        <Route path="/dashboard/company" element={<FeatureGate featureKey="companyDashboard"><DashboardPage company /></FeatureGate>} />
        <Route path="/dashboard/company/priorities/:priorityId" element={<FeatureGate featureKey="companyDashboard"><OperationalPriorityPage /></FeatureGate>} />
        <Route path="/curb-appeal/:submissionId" element={<CurbAppealSubmissionPage />} />
        <Route path="/priorities" element={<FeatureGate featureKey="priorities"><PrioritiesPage /></FeatureGate>} />
        <Route path="/workplans" element={<FeatureGate featureKey="workplans"><WorkplansPage /></FeatureGate>} />
        <Route path="/initiatives" element={<FeatureGate featureKey="initiatives"><InitiativesPage /></FeatureGate>} />
        <Route path="/initiatives/:id" element={<FeatureGate featureKey="initiatives"><InitiativesPage /></FeatureGate>} />
        <Route path="/huddles" element={<FeatureGate featureKey="huddles"><HuddlesPage /></FeatureGate>} />
        <Route path="/huddles/new" element={<FeatureGate featureKey="huddles"><HuddleFormPage /></FeatureGate>} />
        <Route path="/huddles/:id/settings" element={<FeatureGate featureKey="huddles"><HuddleFormPage /></FeatureGate>} />
        <Route path="/huddles/:id/items/new" element={<FeatureGate featureKey="huddles"><HuddleItemPage /></FeatureGate>} />
        <Route path="/huddles/:id" element={<FeatureGate featureKey="huddles"><HuddlesPage /></FeatureGate>} />
        <Route path="/stucks" element={<FeatureGate featureKey="stucks"><StucksPage /></FeatureGate>} />
        <Route path="/culture/team-health" element={<FeatureGate featureKey="teamHealth"><CompassDestinationPage page="teamHealth" /></FeatureGate>} />
        <Route path="/task-views" element={<FeatureGate featureKey="taskViews"><TaskViewsPage /></FeatureGate>} />
        <Route path="/weekly-tracker" element={<FeatureGate featureKey="weeklyTracker"><WeeklyActionTrackerPage /></FeatureGate>} />
        <Route path="/metrics" element={<FeatureGate featureKey="metrics"><PlaceholderPage title="Metrics Management" /></FeatureGate>} />
        <Route path="/metrics/table" element={<FeatureGate featureKey="dataTable"><DataTablePage /></FeatureGate>} />
        <Route path="/reports/executive-summary" element={<FeatureGate featureKey="reports"><CompassDestinationPage page="executiveSummary" /></FeatureGate>} />
        <Route path="/reports/exports" element={<FeatureGate featureKey="reports"><CompassDestinationPage page="exports" /></FeatureGate>} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/learn" element={<LearnDictionaryPage />} />
        <Route path="/admin" element={<PlaceholderPage title="Administration" />} />
        <Route path="/admin/users" element={<FeatureGate featureKey="adminUsers"><CompassDestinationPage page="adminUsers" /></FeatureGate>} />
        <Route path="/admin/teams" element={<FeatureGate featureKey="adminTeams"><CompassDestinationPage page="adminTeams" /></FeatureGate>} />
        <Route path="/admin/permissions" element={<FeatureGate featureKey="adminPermissions"><CompassDestinationPage page="adminPermissions" /></FeatureGate>} />
        <Route path="/admin/features" element={<FeatureGate featureKey="featureRollout"><CompassDestinationPage page="adminFeatures" /></FeatureGate>} />
      </Routes>
    </AnimatePresence>
  );
};

const ProtectedApp = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <CurbAppealProvider>
      <FeatureAccessProvider>
        <NotificationsProvider>
          <OperatingDataProvider>
            <CalendarEventProvider>
              <AppShell>
                <AnimatedRoutes />
              </AppShell>
            </CalendarEventProvider>
          </OperatingDataProvider>
        </NotificationsProvider>
      </FeatureAccessProvider>
    </CurbAppealProvider>
  );
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<LoginPage />} />
    <Route path="/*" element={<ProtectedApp />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <ActionFeedbackProvider>
            <AppRoutes />
          </ActionFeedbackProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
