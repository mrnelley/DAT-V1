import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import AssignmentIndOutlinedIcon from '@mui/icons-material/AssignmentIndOutlined';
import ChecklistOutlinedIcon from '@mui/icons-material/ChecklistOutlined';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import VolunteerActivismOutlinedIcon from '@mui/icons-material/VolunteerActivismOutlined';
import { Box, Chip, LinearProgress, Stack, Typography } from '@mui/material';
import { useOperatingData } from '../../context/OperatingDataContext';
import { useReportingPeriod } from '../../context/ReportingPeriodContext';
import { recordMatchesReportingPeriod } from '../../data/reportingPeriods';
import { decorateWorkplan } from '../../utils/workplans';
import UserAvatar from '../shared/UserAvatar';
import CurrentWeekPrioritiesSection, { getOwnedWeeklyPriorities } from './CurrentWeekPrioritiesSection';
import PropertyManagementDashboard from './PropertyManagementDashboard';
import ResidentServicesMap from './ResidentServicesMap';

const profiles = {
  financials: {
    icon: AccountBalanceOutlinedIcon,
    title: 'Finance Dashboard',
    subtitle: 'Budget health, liquidity, receivables, and organization-wide financial readiness.',
  },
  operations: {
    icon: ChecklistOutlinedIcon,
    title: 'My Operating View',
    subtitle: 'Owned commitments, assigned work, blockers, and organizational execution support.',
  },
  development: {
    icon: ApartmentOutlinedIcon,
    title: 'Real Estate Development Dashboard',
    subtitle: 'Timelines to build, maintain, close, and stabilize properties in the development pipeline.',
  },
  hr: {
    icon: AssignmentIndOutlinedIcon,
    title: 'People Dashboard',
    subtitle: 'Employee satisfaction, retention, hiring health, and open position momentum.',
  },
  advancement: {
    icon: VolunteerActivismOutlinedIcon,
    title: 'Impact and Advancement Dashboard',
    subtitle: 'Grant writing, fundraising, community relationships, and advancement pipeline visibility.',
  },
  resident_services: {
    icon: FavoriteBorderOutlinedIcon,
    title: 'Resident Services Dashboard',
    subtitle: 'Trauma-informed resident journey support, referrals, needs assessments, and coordinator follow-up.',
  },
};

const statusColor = {
  alert: 'error',
  Steady: 'success',
  steady: 'success',
  Watch: 'warning',
  watch: 'warning',
  Alert: 'error',
  Completed: 'success',
  complete: 'success',
  no_data: 'default',
  Open: 'info',
};

const statusOrder = {
  Alert: 0,
  Watch: 1,
  Steady: 2,
  Completed: 3,
};

const getLaneDepartments = (user) => new Set([
  user.department,
  ...(user.teams || []),
]);

const isOpenStatus = (status) => !['complete', 'completed', 'cancelled', 'resolved'].includes(String(status || '').toLowerCase());

const isWorkplanRelevantToUser = (workplan, user, departments = getLaneDepartments(user)) => (
  workplan.lead?.id === user.id
  || workplan.ownerIds?.includes(user.id)
  || departments.has(workplan.department)
  || departments.has(workplan.scope)
);

const isQueuedTaskRelevantToUser = (task, user, departments = getLaneDepartments(user)) => (
  task.owner?.id === user.id
  || task.createdBy?.id === user.id
  || departments.has(task.department)
);

const buildLiveStats = ({ departmentWorkplans, queuedTasks, stucks, user, weeklyEntries }) => {
  const departments = getLaneDepartments(user);
  const relevantWeekly = getOwnedWeeklyPriorities(weeklyEntries, user.id);
  const relevantWorkplans = departmentWorkplans.filter((workplan) => isWorkplanRelevantToUser(workplan, user, departments));
  const relevantTasks = queuedTasks.filter((task) => isQueuedTaskRelevantToUser(task, user, departments));
  const relevantStucks = stucks.filter((stuck) => (
    stuck.personStuck?.id === user.id
    || stuck.helpFrom?.id === user.id
  ));

  return [
    ['Weekly Priorities', relevantWeekly.length, 'Created in Weekly Tracker'],
    ['Department Workplans', relevantWorkplans.length, 'Created in Workplans'],
    ['Day-to-Day Tasks', relevantTasks.filter((task) => isOpenStatus(task.status)).length, 'Open one-off task items'],
    ['Open Stucks', relevantStucks.filter((stuck) => isOpenStatus(stuck.status)).length, 'Linked to this user'],
  ];
};

const StatCard = ({ helper, label, value }) => (
  <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5, minHeight: 104 }}>
    <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
      <Typography variant="caption">{label}</Typography>
    </Stack>
    <Typography variant="h2" sx={{ my: 0.5 }}>{value}</Typography>
    <Typography variant="body2">{helper}</Typography>
  </Box>
);

const DepartmentWorkplanAlignmentSection = ({ enterprisePriorities, reportingPeriod, reportingPeriodId, strategicPillars, user, users, workplans }) => {
  const departments = getLaneDepartments(user);
  const periodPriorityIds = new Set(enterprisePriorities
    .filter((priority) => recordMatchesReportingPeriod(priority, reportingPeriodId))
    .map((priority) => priority.id));
  const visibleWorkplans = workplans
    .filter((workplan) => isWorkplanRelevantToUser(workplan, user, departments))
    .map((workplan) => decorateWorkplan(workplan, enterprisePriorities, { strategicPillars, users }))
    .filter((workplan) => workplan.enterprisePriorityIds.some((priorityId) => periodPriorityIds.has(priorityId)))
    .sort((a, b) => (
      (statusOrder[a.status] ?? 4) - (statusOrder[b.status] ?? 4)
      || new Date(`${a.due}T00:00:00`) - new Date(`${b.due}T00:00:00`)
    ));

  if (!visibleWorkplans.length) return null;

  return (
    <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5, mb: 2 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={1} sx={{ mb: 1.5 }}>
        <Box>
          <Typography variant="h3">Department Workplan Alignment</Typography>
          <Typography variant="body2">Department Objectives tied to Enterprise Priorities, strategic pillars, and due dates.</Typography>
        </Box>
        <Chip label={`${visibleWorkplans.length} aligned to ${reportingPeriod.label}`} color="primary" variant="outlined" />
      </Stack>

      <Stack gap={1}>
        {visibleWorkplans.map((workplan) => (
          <Box
            key={workplan.id}
            aria-label={`Department workplan ${workplan.title}`}
            title={`Department workplan ${workplan.title}`}
            sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.2fr) minmax(180px, 0.55fr) minmax(210px, 0.7fr) 120px' }, gap: 1.25, alignItems: 'center', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.25 }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Stack direction="row" gap={0.75} alignItems="center" flexWrap="wrap" sx={{ mb: 0.5 }}>
                <Chip label={workplan.status} color={statusColor[workplan.status] || 'default'} size="small" />
                <Chip label={reportingPeriod.label} size="small" variant="outlined" />
                <Chip label={`Due ${workplan.due}`} size="small" variant="outlined" />
              </Stack>
              <Typography variant="body1" color="text.primary" fontWeight={800}>{workplan.title}</Typography>
              <Typography variant="body2">{workplan.objectives.length} Department Objective{workplan.objectives.length === 1 ? '' : 's'}</Typography>
            </Box>

            <Stack direction="row" gap={1} alignItems="center">
              <UserAvatar user={workplan.lead} size="sm" />
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" color="text.primary" fontWeight={700}>{workplan.lead.name}</Typography>
                <Typography variant="caption">{workplan.department}</Typography>
              </Box>
            </Stack>

            <Box sx={{ minWidth: 0 }}>
              <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase' }}>Linked objective</Typography>
              <Stack direction="row" gap={0.5} flexWrap="wrap" sx={{ mt: 0.35 }}>
                {workplan.enterprisePriorityIds.length ? (
                  workplan.enterprisePriorityIds.map((priorityId) => <Chip key={priorityId} label={enterprisePriorities.find((priority) => priority.id === priorityId)?.name || 'Missing Enterprise Priority'} size="small" variant="outlined" />)
                ) : (
                  <Chip label="No objective link" size="small" variant="outlined" />
                )}
              </Stack>
            </Box>

            <Box>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                <Typography variant="caption">Progress</Typography>
                <Typography variant="caption" fontWeight={800}>{workplan.progress}%</Typography>
              </Stack>
              <LinearProgress value={workplan.progress} variant="determinate" />
            </Box>
          </Box>
        ))}
      </Stack>
    </Box>
  );
};

const FocusedDashboard = ({ user }) => {
  const {
    currentWeeklyReport,
    departmentWorkplans,
    enterprisePriorities,
    metrics,
    queuedTasks,
    strategicPlan,
    stucks,
    users,
    weeklyPriorityEntriesByWeek,
  } = useOperatingData();
  const { selectedPeriod, selectedPeriodId } = useReportingPeriod();
  const weeklyTrackerEntries = weeklyPriorityEntriesByWeek[currentWeeklyReport.id] || [];
  const liveStats = buildLiveStats({
    departmentWorkplans,
    queuedTasks,
    stucks,
    user,
    weeklyEntries: weeklyTrackerEntries,
  });
  const relevantMetrics = metrics.filter((metric) => (
    metric.owner?.id === user.id || metric.owner?.department === user.department
  ));

  if (user.dashboardFocus === 'property_management') {
    return (
      <Box sx={{ mb: 3 }}>
        <CurrentWeekPrioritiesSection entries={weeklyTrackerEntries} user={user} />
        <DepartmentWorkplanAlignmentSection enterprisePriorities={enterprisePriorities} reportingPeriod={selectedPeriod} reportingPeriodId={selectedPeriodId} strategicPillars={strategicPlan.pillars} user={user} users={users} workplans={departmentWorkplans} />
        <PropertyManagementDashboard user={user} />
      </Box>
    );
  }

  const profile = profiles[user.dashboardFocus];
  if (!profile) return null;
  const Icon = profile.icon;
  const displayedStats = relevantMetrics.length
    ? relevantMetrics.slice(0, 4).map((metric) => [
      metric.title,
      `${metric.current ?? 0}${metric.unit || ''}`,
      `Target ${metric.target ?? 0}${metric.unit || ''}`,
    ])
    : liveStats;

  return (
    <Box sx={{ mb: 3 }}>
      <Stack direction={{ xs: 'column', lg: 'row' }} alignItems={{ lg: 'center' }} justifyContent="space-between" gap={2} sx={{ mb: 2 }}>
        <Box>
          <Stack direction="row" alignItems="center" gap={1}>
            <Icon color="primary" />
            <Typography variant="h2">{profile.title}</Typography>
          </Stack>
          <Typography variant="body2">{profile.subtitle}</Typography>
        </Box>
        <Stack direction="row" gap={1} alignItems="center">
          <UserAvatar user={user} size="md" />
          <Box>
            <Typography variant="body1" fontWeight={700}>{user.name}</Typography>
            <Typography variant="caption">{user.role}</Typography>
          </Box>
        </Stack>
      </Stack>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 1.5, mb: 2 }}>
        {displayedStats.map(([label, value, helper]) => (
          <StatCard key={label} label={label} value={value} helper={helper} />
        ))}
      </Box>

      <CurrentWeekPrioritiesSection entries={weeklyTrackerEntries} user={user} />
      <DepartmentWorkplanAlignmentSection enterprisePriorities={enterprisePriorities} reportingPeriod={selectedPeriod} reportingPeriodId={selectedPeriodId} strategicPillars={strategicPlan.pillars} user={user} users={users} workplans={departmentWorkplans} />

      {user.dashboardFocus === 'resident_services' && <ResidentServicesMap />}
    </Box>
  );
};

export default FocusedDashboard;
