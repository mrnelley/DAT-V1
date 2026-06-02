import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import RadioButtonUncheckedOutlinedIcon from '@mui/icons-material/RadioButtonUncheckedOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import { Box, Chip, FormControl, InputLabel, LinearProgress, MenuItem, Select, Stack, Typography } from '@mui/material';
import { useMemo, useState } from 'react';
import { metrics, priorities, q2Roadmap, users } from '../../data/mockData';
import KpiGaugeCard from '../shared/KpiGaugeCard';
import UserAvatar from '../shared/UserAvatar';
import CalendarPanel from '../calendar/CalendarPanel';
import StrategicPlanSection from './StrategicPlanSection';

const statusMeta = {
  Alert: { color: 'error', icon: ErrorOutlineOutlinedIcon, label: 'Red', order: 0, tone: 'error.main' },
  Complete: { color: 'success', icon: CheckCircleOutlinedIcon, label: 'Green', order: 2, tone: 'success.main' },
  Completed: { color: 'success', icon: CheckCircleOutlinedIcon, label: 'Green', order: 2, tone: 'success.main' },
  'Needs Attention': { color: 'warning', icon: WarningAmberOutlinedIcon, label: 'Yellow', order: 1, tone: 'warning.main' },
  'No Data': { color: 'default', icon: RadioButtonUncheckedOutlinedIcon, label: 'No Data', order: 3, tone: 'text.secondary' },
  'Off Course': { color: 'error', icon: ErrorOutlineOutlinedIcon, label: 'Red', order: 0, tone: 'error.main' },
  'On Course': { color: 'success', icon: CheckCircleOutlinedIcon, label: 'Green', order: 2, tone: 'success.main' },
  Steady: { color: 'success', icon: CheckCircleOutlinedIcon, label: 'Green', order: 2, tone: 'success.main' },
  Watch: { color: 'warning', icon: WarningAmberOutlinedIcon, label: 'Yellow', order: 1, tone: 'warning.main' },
};

const statusGroups = [
  { helper: 'Needs immediate executive attention', key: 'red', statuses: ['Alert', 'Off Course'], title: 'Red' },
  { helper: 'Needs focused follow-through', key: 'yellow', statuses: ['Watch', 'Needs Attention'], title: 'Yellow' },
  { helper: 'On track or completed', key: 'green', statuses: ['Steady', 'On Course', 'Complete', 'Completed'], title: 'Green' },
];

const getPriorityStatus = (priority) => priority.roadmapStatus || priority.status || 'No Data';

const getPriorityProgress = (priority) => {
  const kpis = (priority.keyObjectives || []).flatMap((objective) => objective.kpis || []);
  if (!kpis.length) return 0;
  return Math.round(kpis.reduce((total, kpi) => total + Number(kpi.progress || 0), 0) / kpis.length);
};

const getTeamOptions = () => {
  const options = new Set(['All Teams']);
  users.forEach((user) => {
    options.add(user.department);
    user.teams.forEach((team) => options.add(team));
  });
  return Array.from(options);
};

const priorityMatchesTeam = (priority, team) => {
  if (team === 'All Teams') return true;
  const ownerMatches = priority.owner?.department === team || priority.owner?.teams?.includes(team);
  const objectiveMatches = (priority.keyObjectives || []).some((objective) => (
    objective.department === team
    || objective.workplanAccess === team
    || objective.owner?.department === team
    || objective.owner?.teams?.includes(team)
  ));
  return ownerMatches || objectiveMatches;
};

const metricMatchesTeam = (metric, team) => (
  team === 'All Teams'
  || metric.owner?.department === team
  || metric.owner?.teams?.includes(team)
);

const SignalSummaryTile = ({ count, helper, title }) => {
  const meta = title === 'Red' ? statusMeta.Alert : title === 'Yellow' ? statusMeta.Watch : statusMeta.Steady;
  const Icon = meta.icon;

  return (
    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper', p: 1.5 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
        <Box>
          <Typography variant="caption">{title}</Typography>
          <Typography variant="h2" color={meta.tone}>{count}</Typography>
        </Box>
        <Icon sx={{ color: meta.tone }} />
      </Stack>
      <Typography variant="body2" sx={{ mt: 0.5 }}>{helper}</Typography>
    </Box>
  );
};

const PrioritySignalCard = ({ priority }) => {
  const status = getPriorityStatus(priority);
  const meta = statusMeta[status] || statusMeta['No Data'];
  const progress = getPriorityProgress(priority);
  const Icon = meta.icon;

  return (
    <Box sx={{ border: '1px solid', borderColor: 'divider', borderLeft: '6px solid', borderLeftColor: meta.tone, borderRadius: 1, bgcolor: 'background.paper', p: 1.5 }}>
      <Stack direction="row" justifyContent="space-between" gap={1.5} alignItems="flex-start">
        <Box sx={{ minWidth: 0 }}>
          <Stack direction="row" gap={0.75} alignItems="center" sx={{ mb: 0.5 }}>
            <Icon sx={{ color: meta.tone, fontSize: 20 }} />
            <Chip label={`${meta.label}: ${status}`} color={meta.color} size="small" />
          </Stack>
          <Typography variant="h4" title={priority.name}>{priority.name}</Typography>
          <Typography variant="body2" sx={{ mt: 0.35 }}>{priority.strategicPillar}</Typography>
        </Box>
        <UserAvatar user={priority.owner} size="md" />
      </Stack>
      <LinearProgress value={progress} variant="determinate" sx={{ mt: 1.25, '& .MuiLinearProgress-bar': { bgcolor: meta.tone } }} />
      <Stack direction="row" gap={0.75} flexWrap="wrap" sx={{ mt: 1 }}>
        <Chip label={`${progress}% KPI progress`} size="small" variant="outlined" />
        <Chip label={`${priority.keyObjectives?.length || 0} objectives`} size="small" variant="outlined" />
        <Chip label={priority.owner.name} size="small" variant="outlined" />
      </Stack>
    </Box>
  );
};

const CompanyDashboardOverview = ({ calendarEvents, calendarProps, isAdmin, onMetricClick }) => {
  const [team, setTeam] = useState('All Teams');
  const teamOptions = useMemo(getTeamOptions, []);
  const companyPriorities = priorities.filter((priority) => priority.company);
  const visiblePriorities = companyPriorities.filter((priority) => priorityMatchesTeam(priority, team));
  const visibleMetrics = metrics.filter((metric) => metricMatchesTeam(metric, team));
  const metricGrid = visibleMetrics.length ? visibleMetrics : metrics;
  const sortedPriorities = [...visiblePriorities].sort((a, b) => {
    const aMeta = statusMeta[getPriorityStatus(a)] || statusMeta['No Data'];
    const bMeta = statusMeta[getPriorityStatus(b)] || statusMeta['No Data'];
    return aMeta.order - bMeta.order || a.name.localeCompare(b.name);
  });

  const statusCounts = statusGroups.map((group) => ({
    ...group,
    count: companyPriorities.filter((priority) => group.statuses.includes(getPriorityStatus(priority))).length,
  }));

  return (
    <Stack gap={2}>
      <Box sx={{ bgcolor: 'background.default', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: { xs: 1.5, md: 2 } }}>
        <Stack direction={{ xs: 'column', lg: 'row' }} justifyContent="space-between" alignItems={{ lg: 'center' }} gap={1.5} sx={{ mb: 2 }}>
          <Box>
            <Typography variant="overline" color="primary">Pinned Priority Signal</Typography>
            <Typography variant="h2">Operational priority health</Typography>
            <Typography variant="body2" sx={{ mt: 0.35 }}>Top-line green, yellow, and red readout for {q2Roadmap.quarter}.</Typography>
          </Box>
          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 260 } }}>
            <InputLabel id="company-dashboard-team-filter-label">Team Filter</InputLabel>
            <Select
              label="Team Filter"
              labelId="company-dashboard-team-filter-label"
              value={team}
              onChange={(event) => setTeam(event.target.value)}
            >
              {teamOptions.map((option) => (
                <MenuItem key={option} value={option}>{option}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 1.25, mb: 1.5 }}>
          {statusCounts.map((group) => (
            <SignalSummaryTile key={group.key} count={group.count} helper={group.helper} title={group.title} />
          ))}
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(3, minmax(0, 1fr))' }, gap: 1.25 }}>
          {sortedPriorities.map((priority) => (
            <PrioritySignalCard key={priority.id} priority={priority} />
          ))}
        </Box>
      </Box>

      <Box sx={{ bgcolor: 'background.default', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: { xs: 1.5, md: 2 } }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={1} sx={{ mb: 1.5 }}>
          <Box>
            <Typography variant="overline" color="primary">Critical Numbers</Typography>
            <Typography variant="h2">{team === 'All Teams' ? 'Company critical numbers' : `${team} critical numbers`}</Typography>
          </Box>
          <Chip label={`${metricGrid.length} metrics shown`} color="primary" variant="outlined" />
        </Stack>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(4, minmax(0, 1fr))' }, gap: 1.25 }}>
          {metricGrid.map((metric) => (
            <KpiGaugeCard key={metric.id} dense metric={metric} onClick={() => onMetricClick(metric)} />
          ))}
        </Box>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '1fr 1fr' }, gap: 2, alignItems: 'start' }}>
        <Box sx={{ minWidth: 0 }}>
          <CalendarPanel
            {...calendarProps}
            events={calendarEvents}
            isAdmin={isAdmin}
            scope="organization"
          />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <StrategicPlanSection />
        </Box>
      </Box>
    </Stack>
  );
};

export default CompanyDashboardOverview;
