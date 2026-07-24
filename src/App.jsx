import { Box, CircularProgress, CssBaseline, ThemeProvider } from '@mui/material';
import { QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import LoginPage from './components/auth/LoginPage';
import CurbAppealSubmissionPage from './components/curb-appeal/CurbAppealSubmissionPage';
import DashboardPage from './components/dashboard/DashboardPage';
import ExecutivePulsePage from './components/executive-pulse/ExecutivePulsePage';
import HuddlesPage from './components/huddles/HuddlesPage';
import HuddleFormPage from './components/huddles/HuddleFormPage';
import HuddleItemPage from './components/huddles/HuddleItemPage';
import AppShell from './components/layout/AppShell';
import LearnPage from './components/learn/LearnPage';
import DataTablePage from './components/metrics/DataTablePage';
import CompassDestinationPage from './components/navigation/CompassDestinationPage';
import NotificationsPage from './components/notifications/NotificationsPage';
import ProfilePage from './components/profile/ProfilePage';
import EnterprisePriorityPage from './components/priorities/EnterprisePriorityPage';
import PrioritiesPage from './components/priorities/PrioritiesPage';
import MetricsPage from './components/metrics/MetricsPage';
import FeatureGate from './components/shared/FeatureGate';
import PlaceholderPage from './components/shared/PlaceholderPage';
import StucksPage from './components/stucks/StucksPage';
import TaskViewPage from './components/task-view/TaskViewPage';
import WeeklyActionTrackerPage from './components/weekly-tracker/WeeklyActionTrackerPage';
import WorkplansPage from './components/workplans/WorkplansPage';
import { CurbAppealProvider } from './context/CurbAppealContext';
import { ActionFeedbackProvider } from './context/ActionFeedbackContext';
import { FeatureAccessProvider } from './context/FeatureAccessContext';
import { GuidedPracticeProvider } from './context/GuidedPracticeContext';
import { NotificationsProvider } from './context/NotificationsContext';
import { CalendarEventProvider } from './context/CalendarEventContext';
import { OperatingDataProvider } from './context/OperatingDataContext';
import { ReportingPeriodProvider } from './context/ReportingPeriodContext';
import { getPracticeAppUrl, practiceAppUrls } from './data/practiceLinks';
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
        <Route path="/dashboard/company" element={<Navigate to="/dashboard/organization" replace />} />
        <Route path="/dashboard/company/priorities/:priorityId" element={<Navigate to={location.pathname.replace('/dashboard/company', '/dashboard/organization')} replace />} />
        <Route path="/dashboard/organization" element={<FeatureGate featureKey="companyDashboard"><DashboardPage company /></FeatureGate>} />
        <Route path="/dashboard/organization/priorities/:priorityId" element={<FeatureGate featureKey="companyDashboard"><EnterprisePriorityPage /></FeatureGate>} />
        <Route path="/dashboard/executive-pulse" element={<FeatureGate featureKey="executivePulse"><ExecutivePulsePage /></FeatureGate>} />
        <Route path="/curb-appeal/:submissionId" element={<CurbAppealSubmissionPage />} />
        <Route path="/priorities" element={<FeatureGate featureKey="priorities"><PrioritiesPage /></FeatureGate>} />
        <Route path="/workplans" element={<FeatureGate featureKey="workplans"><WorkplansPage /></FeatureGate>} />
        <Route path="/huddles" element={<FeatureGate featureKey="huddles"><HuddlesPage /></FeatureGate>} />
        <Route path="/huddles/new" element={<FeatureGate featureKey="huddles"><HuddleFormPage /></FeatureGate>} />
        <Route path="/huddles/:id/settings" element={<FeatureGate featureKey="huddles"><HuddleFormPage /></FeatureGate>} />
        <Route path="/huddles/:id/items/new" element={<FeatureGate featureKey="huddles"><HuddleItemPage /></FeatureGate>} />
        <Route path="/huddles/:id" element={<FeatureGate featureKey="huddles"><HuddlesPage /></FeatureGate>} />
        <Route path="/stucks" element={<FeatureGate featureKey="stucks"><StucksPage /></FeatureGate>} />
        <Route path="/culture/team-health" element={<FeatureGate featureKey="teamHealth"><CompassDestinationPage page="teamHealth" /></FeatureGate>} />
        <Route path="/task-view" element={<FeatureGate featureKey="taskView"><TaskViewPage /></FeatureGate>} />
        <Route path="/weekly-tracker" element={<FeatureGate featureKey="weeklyTracker"><WeeklyActionTrackerPage /></FeatureGate>} />
        <Route path="/metrics" element={<FeatureGate featureKey="metrics"><MetricsPage /></FeatureGate>} />
        <Route path="/metrics/table" element={<FeatureGate featureKey="dataTable"><DataTablePage /></FeatureGate>} />
        <Route path="/reports/executive-summary" element={<FeatureGate featureKey="reports"><CompassDestinationPage page="executiveSummary" /></FeatureGate>} />
        <Route path="/reports/exports" element={<FeatureGate featureKey="reports"><CompassDestinationPage page="exports" /></FeatureGate>} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/learn" element={<LearnPage />} />
        <Route path="/admin" element={<PlaceholderPage title="Administration" />} />
        <Route path="/admin/users" element={<FeatureGate featureKey="adminUsers"><CompassDestinationPage page="adminUsers" /></FeatureGate>} />
        <Route path="/admin/teams" element={<FeatureGate featureKey="adminTeams"><CompassDestinationPage page="adminTeams" /></FeatureGate>} />
        <Route path="/admin/permissions" element={<FeatureGate featureKey="adminPermissions"><CompassDestinationPage page="adminPermissions" /></FeatureGate>} />
        <Route path="/admin/features" element={<FeatureGate featureKey="featureRollout"><CompassDestinationPage page="adminFeatures" /></FeatureGate>} />
      </Routes>
    </AnimatePresence>
  );
};

const PracticeModeRedirect = ({ programId }) => {
  const { user } = useAuth();
  const destination = programId
    ? practiceAppUrls[programId.toUpperCase()]
    : getPracticeAppUrl(user.workingGroup);

  useEffect(() => {
    window.location.replace(destination);
  }, [destination]);

  return null;
};

const PracticeEntryRoutes = () => (
  <Routes>
    <Route path="/practice" element={<PracticeModeRedirect />} />
    <Route path="/practice/ELT" element={<PracticeModeRedirect programId="ELT" />} />
    <Route path="/practice/OLT" element={<PracticeModeRedirect programId="OLT" />} />
    <Route path="/practice/elt" element={<PracticeModeRedirect programId="ELT" />} />
    <Route path="/practice/olt" element={<PracticeModeRedirect programId="OLT" />} />
    <Route path="/learn/ELT" element={<PracticeModeRedirect programId="ELT" />} />
    <Route path="/learn/OLT" element={<PracticeModeRedirect programId="OLT" />} />
    <Route path="/learn/elt" element={<PracticeModeRedirect programId="ELT" />} />
    <Route path="/learn/olt" element={<PracticeModeRedirect programId="OLT" />} />
    <Route path="*" element={<Navigate to="/learn" replace />} />
  </Routes>
);

const isPracticeEntryPath = (pathname) => [
  '/learn/elt',
  '/learn/olt',
  '/practice',
  '/practice/elt',
  '/practice/olt',
].includes(pathname.toLowerCase());

const ProtectedApp = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress aria-label="Loading application" />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <OperatingDataProvider>
      <FeatureAccessProvider>
        <NotificationsProvider>
          <CalendarEventProvider>
            <CurbAppealProvider>
              <GuidedPracticeProvider>
                {isPracticeEntryPath(location.pathname) ? (
                  <PracticeEntryRoutes />
                ) : (
                  <AppShell>
                    <AnimatedRoutes />
                  </AppShell>
                )}
              </GuidedPracticeProvider>
            </CurbAppealProvider>
          </CalendarEventProvider>
        </NotificationsProvider>
      </FeatureAccessProvider>
    </OperatingDataProvider>
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
          <ReportingPeriodProvider>
            <ActionFeedbackProvider>
              <AppRoutes />
            </ActionFeedbackProvider>
          </ReportingPeriodProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
