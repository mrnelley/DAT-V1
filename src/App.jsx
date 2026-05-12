import { CssBaseline, ThemeProvider } from '@mui/material';
import { QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import ActionItemsPage from './components/action-items/ActionItemsPage';
import CurbAppealSubmissionPage from './components/curb-appeal/CurbAppealSubmissionPage';
import DashboardPage from './components/dashboard/DashboardPage';
import HuddlesPage from './components/huddles/HuddlesPage';
import InitiativesPage from './components/initiatives/InitiativesPage';
import AppShell from './components/layout/AppShell';
import DataTablePage from './components/metrics/DataTablePage';
import PrioritiesPage from './components/priorities/PrioritiesPage';
import PlaceholderPage from './components/shared/PlaceholderPage';
import StucksPage from './components/stucks/StucksPage';
import WorkplansPage from './components/workplans/WorkplansPage';
import { CurbAppealProvider } from './context/CurbAppealContext';
import { WaypointProvider } from './context/WaypointContext';
import { AuthProvider } from './hooks/useAuth';
import { queryClient } from './store/queryClient';
import theme from './theme';

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Navigate to="/dashboard/me" replace />} />
        <Route path="/dashboard/me" element={<DashboardPage />} />
        <Route path="/dashboard/company" element={<DashboardPage company />} />
        <Route path="/curb-appeal/:submissionId" element={<CurbAppealSubmissionPage />} />
        <Route path="/priorities" element={<PrioritiesPage />} />
        <Route path="/workplans" element={<WorkplansPage />} />
        <Route path="/initiatives" element={<InitiativesPage />} />
        <Route path="/initiatives/:id" element={<InitiativesPage />} />
        <Route path="/huddles" element={<HuddlesPage />} />
        <Route path="/huddles/:id" element={<HuddlesPage />} />
        <Route path="/stucks" element={<StucksPage />} />
        <Route path="/action-items" element={<ActionItemsPage />} />
        <Route path="/metrics" element={<PlaceholderPage title="Metrics Management" />} />
        <Route path="/metrics/table" element={<DataTablePage />} />
        <Route path="/learn" element={<PlaceholderPage title="Learn" />} />
        <Route path="/admin" element={<PlaceholderPage title="Administration" />} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <CurbAppealProvider>
            <WaypointProvider>
              <AppShell>
                <AnimatedRoutes />
              </AppShell>
            </WaypointProvider>
          </CurbAppealProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
