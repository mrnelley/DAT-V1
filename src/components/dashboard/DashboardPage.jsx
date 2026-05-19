import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { Box, Button, Chip, FormControl, IconButton, InputLabel, MenuItem, Select, Stack, Tooltip, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useActionFeedback } from '../../context/ActionFeedbackContext';
import { metrics } from '../../data/mockData';
import { useWaypoints } from '../../context/WaypointContext';
import { useAuth } from '../../hooks/useAuth';
import AdvocacyDashboard from '../advocacy/AdvocacyDashboard';
import CompassCalendar from '../calendar/CompassCalendar';
import KpiDetailModal from '../shared/KpiDetailModal';
import PageWrapper from '../layout/PageWrapper';
import CriticalNumbersSection from './CriticalNumbersSection';
import FocusedDashboard from './FocusedDashboard';
import MyKpisSection from './MyKpisSection';
import StrategicPlanSection from './StrategicPlanSection';

const getStoredWidgetOrder = (storageKey, fallback) => {
  if (typeof window === 'undefined') return fallback;

  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey));
    if (!Array.isArray(parsed)) return fallback;
    const valid = parsed.filter((item) => fallback.includes(item));
    const missing = fallback.filter((item) => !valid.includes(item));
    return [...valid, ...missing];
  } catch {
    return fallback;
  }
};

const DashboardWidget = ({ children, edit, isFirst, isLast, onMoveDown, onMoveUp, title }) => (
  <Box sx={{ mb: 2 }}>
    {edit && (
      <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1 }}>
        <DragIndicatorIcon color="primary" fontSize="small" />
        <Typography variant="caption" color="primary" fontWeight={700}>{title}</Typography>
        <Stack direction="row" gap={0.5} sx={{ ml: 'auto' }}>
          <Tooltip title="Move up">
            <span>
              <IconButton size="small" aria-label={`Move ${title} up`} disabled={isFirst} onClick={onMoveUp}>
                <KeyboardArrowUpIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Move down">
            <span>
              <IconButton size="small" aria-label={`Move ${title} down`} disabled={isLast} onClick={onMoveDown}>
                <KeyboardArrowDownIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Stack>
    )}
    {children}
  </Box>
);

const DashboardPage = ({ company = false }) => {
  const { user } = useAuth();
  const { unavailable } = useActionFeedback();
  const teamOptions = company ? ['Critical Numbers for Leadership', 'Operations', 'Resident Services', 'Asset Management'] : user.teams;
  const opensCalendarFirst = !company && user.id === 'u1';
  const [team, setTeam] = useState(teamOptions[0]);
  const [edit, setEdit] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(opensCalendarFirst);
  const [selectedMetric, setSelectedMetric] = useState(null);
  const {
    addWaypoint,
    approveWaypoint,
    declineWaypoint,
    isAdmin,
    organizationWaypoints,
    personalWaypoints,
    sendToOrg,
    updateWaypoint,
  } = useWaypoints();
  const defaultWidgetOrder = useMemo(() => (
    company ? ['strategicPlan', 'critical', 'organizationCalendar'] : ['focus', 'critical', 'kpis']
  ), [company]);
  const layoutStorageKey = `hdc_pulse_dashboard_layout_${company ? 'company_v2' : user.id}`;
  const [widgetOrder, setWidgetOrder] = useState(() => getStoredWidgetOrder(layoutStorageKey, defaultWidgetOrder));

  useEffect(() => {
    setTeam(teamOptions[0]);
    setCalendarOpen(opensCalendarFirst);
  }, [company, opensCalendarFirst, user.id]);

  useEffect(() => {
    setWidgetOrder(getStoredWidgetOrder(layoutStorageKey, defaultWidgetOrder));
  }, [defaultWidgetOrder, layoutStorageKey]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(layoutStorageKey, JSON.stringify(widgetOrder));
    }
  }, [layoutStorageKey, widgetOrder]);

  const moveWidget = (widgetId, direction) => {
    setWidgetOrder((current) => {
      const index = current.indexOf(widgetId);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return current;
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  };

  const calendarProps = {
    onApprove: approveWaypoint,
    onCreateWaypoint: addWaypoint,
    onDecline: declineWaypoint,
    onSendToOrg: sendToOrg,
    onUpdateWaypoint: updateWaypoint,
  };

  const renderWidget = (widgetId) => {
    if (widgetId === 'focus') {
      return user.dashboardFocus === 'advocacy' ? <AdvocacyDashboard /> : <FocusedDashboard user={user} />;
    }

    if (widgetId === 'strategicPlan') {
      return <StrategicPlanSection />;
    }

    if (widgetId === 'critical') {
      return <CriticalNumbersSection metrics={metrics} teamName={team} onMetricClick={setSelectedMetric} />;
    }

    if (widgetId === 'kpis') {
      return (
        <MyKpisSection
          metrics={metrics.filter((metric) => metric.owner.id === user.id).length ? metrics.filter((metric) => metric.owner.id === user.id) : metrics.slice(0, 2)}
          onMetricClick={setSelectedMetric}
        />
      );
    }

    if (widgetId === 'organizationCalendar') {
      return (
        <CompassCalendar
          {...calendarProps}
          isAdmin={isAdmin}
          scope="organization"
          waypoints={organizationWaypoints}
        />
      );
    }

    return null;
  };

  const widgetLabels = {
    critical: 'Critical Numbers',
    focus: user.dashboardFocus === 'advocacy' ? 'Advocacy Dashboard' : 'Focused Dashboard',
    kpis: 'My KPIs',
    organizationCalendar: 'Pulse Calendar',
    strategicPlan: 'Strategic Plan',
  };

  const dashboardWidgets = (
    <>
      {widgetOrder.map((widgetId, index) => (
        <DashboardWidget
          key={widgetId}
          edit={edit}
          isFirst={index === 0}
          isLast={index === widgetOrder.length - 1}
          onMoveDown={() => moveWidget(widgetId, 1)}
          onMoveUp={() => moveWidget(widgetId, -1)}
          title={widgetLabels[widgetId]}
        >
          {renderWidget(widgetId)}
        </DashboardWidget>
      ))}
    </>
  );

  return (
    <PageWrapper>
      <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ md: 'center' }} justifyContent="space-between" gap={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h1">{company ? 'Dashboard' : `${user.name.split(' ')[0]}'s Dashboard`}</Typography>
          <Typography variant="body2">{company ? 'Company-wide accountability view' : `${user.department} operating view`}</Typography>
        </Box>
        <Stack direction="row" gap={1} flexWrap="wrap">
          <Button variant={edit ? 'contained' : 'outlined'} startIcon={<DragIndicatorIcon />} onClick={() => setEdit((value) => !value)}>
            {edit ? 'Save Order' : 'Edit'}
          </Button>
          {!company && (
            <Button
              variant={calendarOpen ? 'contained' : 'outlined'}
              startIcon={<CalendarMonthIcon />}
              endIcon={calendarOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
              onClick={() => setCalendarOpen((value) => !value)}
            >
              {calendarOpen ? 'Back to Dashboard' : 'Calendar'}
            </Button>
          )}
          <Stack direction="row" alignItems="center">
            <IconButton aria-label="Previous dashboard period" onClick={() => unavailable('historical dashboard periods are not loaded yet.')}><ChevronLeftIcon /></IconButton>
            <Chip label="1/24/2026 -> 4/24/2026" color="primary" variant="outlined" />
            <IconButton aria-label="Next dashboard period" onClick={() => unavailable('future dashboard periods are not loaded yet.')}><ChevronRightIcon /></IconButton>
          </Stack>
          <FormControl size="small" sx={{ minWidth: 230 }}>
            <InputLabel>Team Filter</InputLabel>
            <Select label="Team Filter" value={team} onChange={(event) => setTeam(event.target.value)}>
              {teamOptions.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
            </Select>
          </FormControl>
        </Stack>
      </Stack>
      {company ? (
        dashboardWidgets
      ) : (
        <Box sx={{ overflow: 'hidden' }}>
          <Box
            component={motion.div}
            animate={{ x: calendarOpen ? '-100%' : '0%' }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            sx={{ display: 'flex', width: '100%' }}
          >
            <Box sx={{ width: '100%', flexShrink: 0, pr: { xs: 0, md: 1 } }}>
              {dashboardWidgets}
            </Box>
            <Box sx={{ width: '100%', flexShrink: 0, pl: { xs: 0, md: 1 } }}>
              <CompassCalendar
                {...calendarProps}
                scope="personal"
                waypoints={personalWaypoints}
              />
            </Box>
          </Box>
        </Box>
      )}
      <KpiDetailModal metric={selectedMetric} open={Boolean(selectedMetric)} onClose={() => setSelectedMetric(null)} />
    </PageWrapper>
  );
};

export default DashboardPage;
