import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import AssignmentIndOutlinedIcon from '@mui/icons-material/AssignmentIndOutlined';
import ChecklistOutlinedIcon from '@mui/icons-material/ChecklistOutlined';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import VolunteerActivismOutlinedIcon from '@mui/icons-material/VolunteerActivismOutlined';
import { Box, Chip, LinearProgress, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useOperatingData } from '../../context/OperatingDataContext';
import { activeRoadmap } from '../../data/quarterlyRoadmap';
import UserAvatar from '../shared/UserAvatar';
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
    title: 'Operations Dashboard',
    subtitle: 'Cross-functional operating priorities, blocked work, and organizational execution support.',
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

const financeStatDefaults = [
  ['cashPosition', 'Cash Position'],
  ['budgetVariance', 'Budget Variance'],
  ['grantReceivables', 'Grant Receivables'],
  ['debtService', 'Debt Service'],
];

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

const weeklyPriorityLeadershipLanes = {
  u2: { label: 'Finance', departments: ['Finance'] },
  u3: { label: 'Real Estate Development', departments: ['Real Estate Development'] },
  u4: { label: 'Property Management', departments: ['Property Management', 'Property Management & Compliance'] },
  u5: { label: 'HR', departments: ['Human Resources'] },
  u6: { label: 'Impact and Advancement', departments: ['Impact and Advancement', 'Community Relations'] },
  u8: { label: 'Operations', departments: ['Operations', 'Resident Services'] },
};

const weeklyTrackerStorageKey = 'hdc_compass_weekly_tracker_entries';

const readWeeklyTrackerEntries = () => {
  if (typeof window === 'undefined') return [];

  try {
    return Object.values(JSON.parse(window.localStorage.getItem(weeklyTrackerStorageKey)) || {})
      .flat()
      .filter((entry) => entry.title);
  } catch {
    return [];
  }
};

const priorityStatusOrder = {
  alert: 0,
  Alert: 0,
  watch: 1,
  Watch: 1,
  steady: 2,
  Steady: 2,
  complete: 3,
  Completed: 3,
  no_data: 4,
};

const getLaneDepartments = (user) => new Set([
  user.department,
  ...(user.teams || []),
  ...(weeklyPriorityLeadershipLanes[user.id]?.departments || []),
]);

const isOpenStatus = (status) => !['complete', 'completed', 'cancelled', 'resolved'].includes(String(status || '').toLowerCase());

const isWorkplanRelevantToUser = (workplan, user, departments = getLaneDepartments(user)) => (
  workplan.lead?.id === user.id
  || workplan.ownerIds?.includes(user.id)
  || departments.has(workplan.department)
  || departments.has(workplan.scope)
);

const isWeeklyEntryRelevantToUser = (entry, user, departments = getLaneDepartments(user)) => {
  const priorityDepartment = entry.department || entry.owner?.department;
  return (
    entry.owner?.id === user.id
    || entry.tasks?.some((task) => task.owner?.id === user.id)
    || departments.has(priorityDepartment)
  );
};

const isQueuedTaskRelevantToUser = (task, user, departments = getLaneDepartments(user)) => (
  task.owner?.id === user.id
  || task.createdBy?.id === user.id
  || departments.has(task.department)
);

const buildLiveStats = ({ departmentWorkplans, queuedTasks, stucks, user, weeklyEntries }) => {
  const departments = getLaneDepartments(user);
  const relevantWeekly = weeklyEntries.filter((entry) => isWeeklyEntryRelevantToUser(entry, user, departments));
  const relevantWorkplans = departmentWorkplans.filter((workplan) => isWorkplanRelevantToUser(workplan, user, departments));
  const relevantTasks = queuedTasks.filter((task) => isQueuedTaskRelevantToUser(task, user, departments));
  const relevantStucks = stucks.filter((stuck) => (
    stuck.personStuck?.id === user.id
    || stuck.helpFrom?.id === user.id
  ));

  return [
    ['Weekly Priorities', relevantWeekly.length, 'Created in Weekly Tracker'],
    ['Department Workplans', relevantWorkplans.length, 'Created in Workplans'],
    ['Queued Tasks', relevantTasks.filter((task) => isOpenStatus(task.status)).length, 'Open one-off Task View items'],
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

const EditableStatCard = ({ field, label, storageKey }) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(() => {
    if (typeof window === 'undefined') return '';

    try {
      return JSON.parse(window.localStorage.getItem(storageKey))?.[field] || '';
    } catch {
      return '';
    }
  });

  const save = (nextValue = value) => {
    if (typeof window !== 'undefined') {
      try {
        const current = JSON.parse(window.localStorage.getItem(storageKey)) || {};
        window.localStorage.setItem(storageKey, JSON.stringify({ ...current, [field]: nextValue }));
      } catch {
        window.localStorage.setItem(storageKey, JSON.stringify({ [field]: nextValue }));
      }
    }
    setEditing(false);
  };

  return (
    <Box
      aria-label={`Edit ${label}`}
      onClick={() => setEditing(true)}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        setEditing(true);
      }}
      role="button"
      tabIndex={0}
      sx={{
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: editing ? 'primary.main' : 'divider',
        borderRadius: 1,
        cursor: 'text',
        minHeight: 104,
        p: 1.5,
        transition: 'border-color 160ms ease, box-shadow 160ms ease',
        '&:focus-visible': { outline: '3px solid', outlineColor: 'secondary.main', outlineOffset: 2 },
        '&:hover': { borderColor: 'secondary.main', boxShadow: '0 8px 18px rgba(31, 79, 86, 0.13)' },
      }}
    >
      <Typography variant="caption">{label}</Typography>
      {editing ? (
        <TextField
          autoFocus
          fullWidth
          onBlur={() => save()}
          onChange={(event) => setValue(event.target.value)}
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              save(event.currentTarget.value);
            }
          }}
          placeholder="Add value"
          value={value}
          variant="standard"
          inputProps={{ 'aria-label': label }}
          sx={{
            mt: 0.75,
            '& input': {
              color: value ? 'primary.main' : 'text.secondary',
              fontSize: '1.55rem',
              fontWeight: 800,
              p: 0,
            },
          }}
        />
      ) : (
        <Typography color={value ? 'primary' : 'text.secondary'} variant="h2" sx={{ my: 0.5 }}>
          {value || 'Click to add'}
        </Typography>
      )}
      <Typography variant="body2">Raw editable value</Typography>
    </Box>
  );
};

const WeeklyPrioritiesSection = ({ user, weeklyEntries }) => {
  const leadershipLane = weeklyPriorityLeadershipLanes[user.id];
  const isLeadershipView = Boolean(leadershipLane);
  const departments = getLaneDepartments(user);
  const visiblePriorities = weeklyEntries.filter((priority) => {
    return isWeeklyEntryRelevantToUser(priority, user, departments);
  }).sort((a, b) => (
    (priorityStatusOrder[a.status] ?? 5) - (priorityStatusOrder[b.status] ?? 5)
    || new Date(`${a.due}T00:00:00`) - new Date(`${b.due}T00:00:00`)
    || a.rank - b.rank
  ));

  if (!visiblePriorities.length) return null;

  return (
    <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5, mb: 2 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={1} sx={{ mb: 1.5 }}>
        <Box>
          <Typography variant="h3">{isLeadershipView ? `${leadershipLane.label} Weekly Priorities` : `${user.name.split(' ')[0]}'s Priority Task List`}</Typography>
          <Typography variant="body2">Current weekly priorities created in Weekly Tracker.</Typography>
        </Box>
        <Chip label={isLeadershipView ? 'Department owner view' : 'Related to me'} color="primary" variant="outlined" />
      </Stack>

      <Stack gap={1}>
        {visiblePriorities.map((priority) => {
          const showAllTasks = isLeadershipView || priority.owner.id === user.id;
          const relatedTasks = priority.tasks.filter((task) => showAllTasks || task.owner.id === user.id);
          return (
            <Box key={priority.id} sx={{ border: '1px solid', borderColor: priority.isMostImportant ? 'primary.light' : 'divider', borderRadius: 1, p: 1.25 }}>
              <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={1}>
                <Box>
                  <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
                    <Chip label={`#${priority.rank}`} color={priority.isMostImportant ? 'primary' : 'default'} size="small" />
                    {priority.isMostImportant && <Chip label="Most Important Priority" color="secondary" size="small" />}
                    <Chip label={priority.status} color={statusColor[priority.status] || 'default'} size="small" />
                    <Chip label={`Due ${priority.due}`} variant="outlined" size="small" />
                  </Stack>
                  <Typography variant="body1" fontWeight={800} sx={{ mt: 1 }}>{priority.title}</Typography>
                  <Typography variant="body2" color="text.primary">Aligned to: {priority.alignedPriorityLabel || 'No alignment selected'}</Typography>
                </Box>
                <Stack direction="row" gap={1} alignItems="center" sx={{ flexShrink: 0 }}>
                  <UserAvatar user={priority.owner} size="sm" />
                  <Box>
                    <Typography variant="body2" color="text.primary" fontWeight={700}>{priority.owner.name}</Typography>
                    <Typography variant="caption">{priority.department}</Typography>
                  </Box>
                </Stack>
              </Stack>

              <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mt: 1 }}>
                <Chip label={priority.alignmentType === 'both' ? 'Enterprise + workplan' : priority.alignmentType === 'enterprise' ? 'Enterprise priority' : 'Workplan'} color="primary" variant="outlined" size="small" />
                {priority.priorityId && <Chip label={priority.priorityId} variant="outlined" size="small" />}
                {priority.workplanId && <Chip label={priority.workplanId} variant="outlined" size="small" />}
              </Stack>

              {relatedTasks.length > 0 && (
                <Box sx={{ bgcolor: 'background.default', borderRadius: 1, p: 1, mt: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase' }}>Task list</Typography>
                  {relatedTasks.map((task) => (
                    <Stack key={task.id} direction={{ xs: 'column', sm: 'row' }} gap={1} justifyContent="space-between" sx={{ mt: 0.5 }}>
                      <Typography variant="body2" color="text.primary">{task.title}</Typography>
                      <Stack direction="row" gap={1}>
                        <Chip label={task.owner.name} size="small" variant="outlined" />
                        <Chip label={`Due ${task.due}`} size="small" variant="outlined" />
                      </Stack>
                    </Stack>
                  ))}
                </Box>
              )}
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
};

const DepartmentWorkplanAlignmentSection = ({ user, workplans }) => {
  const departments = getLaneDepartments(user);
  const visibleWorkplans = workplans
    .filter((workplan) => isWorkplanRelevantToUser(workplan, user, departments))
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
          <Typography variant="body2">{activeRoadmap.quarter} operating work tied to company objectives, strategic pillars, and due dates.</Typography>
        </Box>
        <Chip label={`${visibleWorkplans.length} ${activeRoadmap.quarter} workplans`} color="primary" variant="outlined" />
      </Stack>

      <Stack gap={1}>
        {visibleWorkplans.map((workplan) => (
          <Box key={workplan.id} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.2fr) minmax(180px, 0.55fr) minmax(210px, 0.7fr) 120px' }, gap: 1.25, alignItems: 'center', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.25 }}>
            <Box sx={{ minWidth: 0 }}>
              <Stack direction="row" gap={0.75} alignItems="center" flexWrap="wrap" sx={{ mb: 0.5 }}>
                <Chip label={workplan.status} color={statusColor[workplan.status] || 'default'} size="small" />
                <Chip label={workplan.quarter} size="small" variant="outlined" />
                <Chip label={`Due ${workplan.due}`} size="small" variant="outlined" />
              </Stack>
              <Typography variant="body1" color="text.primary" fontWeight={800}>{workplan.title}</Typography>
              <Typography variant="body2">{workplan.outcome}</Typography>
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
                {(workplan.priorityLinks || []).length ? (
                  workplan.priorityLinks.map((priority) => <Chip key={priority} label={priority} size="small" variant="outlined" />)
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
  const { departmentWorkplans, queuedTasks, stucks } = useOperatingData();
  const weeklyTrackerEntries = readWeeklyTrackerEntries();
  const liveStats = buildLiveStats({
    departmentWorkplans,
    queuedTasks,
    stucks,
    user,
    weeklyEntries: weeklyTrackerEntries,
  });

  if (user.dashboardFocus === 'property_management') {
    return (
      <Box sx={{ mb: 3 }}>
        <WeeklyPrioritiesSection user={user} weeklyEntries={weeklyTrackerEntries} />
        <DepartmentWorkplanAlignmentSection user={user} workplans={departmentWorkplans} />
        <PropertyManagementDashboard user={user} />
      </Box>
    );
  }

  const profile = profiles[user.dashboardFocus];
  if (!profile) return null;
  const Icon = profile.icon;
  const financeStats = user.dashboardFocus === 'financials';

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
        {financeStats ? financeStatDefaults.map(([field, label]) => (
          <EditableStatCard key={field} field={field} label={label} storageKey="hdc_compass_finance_dashboard_stats" />
        )) : liveStats.map(([label, value, helper]) => (
          <StatCard key={label} label={label} value={value} helper={helper} />
        ))}
      </Box>

      <WeeklyPrioritiesSection user={user} weeklyEntries={weeklyTrackerEntries} />
      <DepartmentWorkplanAlignmentSection user={user} workplans={departmentWorkplans} />

      {user.dashboardFocus === 'resident_services' && <ResidentServicesMap />}
    </Box>
  );
};

export default FocusedDashboard;
