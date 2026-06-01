import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import TableViewOutlinedIcon from '@mui/icons-material/TableViewOutlined';
import { Box, Button, Chip, LinearProgress, Stack, Typography } from '@mui/material';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  actionItems,
  departmentWorkplans,
  huddles,
  metrics,
  priorities,
  stucks,
  users,
  weeklyActionReports,
} from '../../data/mockData';
import PageWrapper from '../layout/PageWrapper';
import UserAvatar from '../shared/UserAvatar';

const pageMeta = {
  teamHealth: {
    eyebrow: 'Culture',
    title: 'Team Health',
    subtitle: 'A living read on team capacity, blockers, and the operating rhythms that keep onsite experience visible.',
  },
  executiveSummary: {
    eyebrow: 'Reports',
    title: 'Executive Summary',
    subtitle: 'A leadership-ready snapshot of priorities, critical numbers, stucks, and weekly commitments.',
  },
  exports: {
    eyebrow: 'Reports',
    title: 'Exports',
    subtitle: 'Download focused CSV slices from the current Compass demo data.',
  },
  adminUsers: {
    eyebrow: 'Administration',
    title: 'Users',
    subtitle: 'Review people, roles, departments, and demo access lanes from one directory view.',
  },
  adminTeams: {
    eyebrow: 'Administration',
    title: 'Teams',
    subtitle: 'See team membership and where operating work is already connected.',
  },
  adminPermissions: {
    eyebrow: 'Administration',
    title: 'Permissions',
    subtitle: 'A practical permissions map for who can view, manage, and advance work in Compass.',
  },
};

const statusColor = {
  Alert: 'error',
  Complete: 'success',
  Completed: 'success',
  Draft: 'default',
  Open: 'primary',
  'In Progress': 'warning',
  Steady: 'success',
  Watch: 'warning',
  reviewed: 'success',
};

const csvEscape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;

const downloadCsv = (filename, rows) => {
  if (!rows.length || typeof document === 'undefined') return;

  const headers = Object.keys(rows[0]);
  const csv = [
    headers.map(csvEscape).join(','),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(',')),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const StatTile = ({ helper, label, value }) => (
  <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
    <Typography variant="caption">{label}</Typography>
    <Typography variant="h2" color="primary" sx={{ mt: 0.25 }}>{value}</Typography>
    <Typography variant="body2" sx={{ mt: 0.5 }}>{helper}</Typography>
  </Box>
);

const SectionPanel = ({ children, icon, subtitle, title }) => (
  <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: { xs: 1.5, md: 2 } }}>
    <Stack direction="row" gap={1} alignItems="flex-start" sx={{ mb: 1.5 }}>
      {icon && <Box sx={{ color: 'secondary.dark', display: 'flex', mt: 0.25 }}>{icon}</Box>}
      <Box>
        <Typography variant="h3">{title}</Typography>
        {subtitle && <Typography variant="body2" sx={{ mt: 0.25 }}>{subtitle}</Typography>}
      </Box>
    </Stack>
    {children}
  </Box>
);

const SignalRow = ({ helper, label, progress, status }) => (
  <Box sx={{ borderTop: '1px solid', borderColor: 'divider', py: 1.25 }}>
    <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body1" fontWeight={800}>{label}</Typography>
        <Typography variant="body2">{helper}</Typography>
      </Box>
      <Chip label={status} color={statusColor[status] || 'default'} size="small" />
    </Stack>
    <LinearProgress value={progress} variant="determinate" sx={{ mt: 1 }} />
  </Box>
);

const ActionButtons = ({ actions }) => {
  const navigate = useNavigate();

  return (
    <Stack direction="row" gap={1} flexWrap="wrap">
      {actions.map((action, index) => (
        <Button
          key={action.path}
          endIcon={<ArrowForwardOutlinedIcon />}
          onClick={() => navigate(action.path)}
          variant={index === 0 ? 'contained' : 'outlined'}
        >
          {action.label}
        </Button>
      ))}
    </Stack>
  );
};

const buildTeamSummaries = () => {
  const teams = new Map();

  users.forEach((user) => {
    user.teams.forEach((team) => {
      const summary = teams.get(team) || { departments: new Set(), members: [], name: team };
      summary.members.push(user);
      summary.departments.add(user.department);
      teams.set(team, summary);
    });
  });

  return Array.from(teams.values())
    .map((team) => ({ ...team, departments: Array.from(team.departments) }))
    .sort((a, b) => b.members.length - a.members.length || a.name.localeCompare(b.name));
};

const TeamHealthPage = () => {
  const teamSummaries = useMemo(buildTeamSummaries, []);
  const openActionItems = actionItems.filter((item) => item.status !== 'Complete').length;
  const visibleWorkplans = departmentWorkplans.filter((workplan) => ['Watch', 'Alert'].includes(workplan.status));

  return (
    <>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 1.5, mb: 2 }}>
        <StatTile label="People" value={users.length} helper="Across the demo directory" />
        <StatTile label="Teams" value={teamSummaries.length} helper="Named work groups" />
        <StatTile label="Open Stucks" value={stucks.length} helper="Blockers needing help" />
        <StatTile label="Active Huddles" value={huddles.length} helper="Operating rhythms online" />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '1fr 1fr' }, gap: 2 }}>
        <SectionPanel
          icon={<InsightsOutlinedIcon />}
          title="Culture Signals"
          subtitle="Fast read on whether the operating system is creating clarity or friction."
        >
          <SignalRow label="Follow-through load" helper={`${openActionItems} visible action items are still open or in progress.`} progress={68} status="Watch" />
          <SignalRow label="Blocker pressure" helper={`${stucks.length} stucks have named helpers and can be worked in huddle.`} progress={82} status="Steady" />
          <SignalRow label="Workplan attention" helper={`${visibleWorkplans.length} workplans need focus before the next leadership review.`} progress={54} status="Watch" />
        </SectionPanel>

        <SectionPanel
          icon={<GroupsOutlinedIcon />}
          title="Team Lanes"
          subtitle="Largest teams first, with the departments they connect across."
        >
          <Stack gap={1}>
            {teamSummaries.slice(0, 6).map((team) => (
              <Box key={team.name} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.25 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1}>
                  <Box>
                    <Typography variant="body1" fontWeight={800}>{team.name}</Typography>
                    <Typography variant="body2">{team.departments.join(', ')}</Typography>
                  </Box>
                  <Stack direction="row" alignItems="center" gap={0.5}>
                    {team.members.slice(0, 4).map((member) => <UserAvatar key={member.id} user={member} size="sm" />)}
                    <Chip label={`${team.members.length} members`} size="small" variant="outlined" />
                  </Stack>
                </Stack>
              </Box>
            ))}
          </Stack>
        </SectionPanel>
      </Box>
    </>
  );
};

const ExecutiveSummaryPage = () => {
  const priorityCounts = priorities.reduce((counts, priority) => {
    const status = priority.roadmapStatus || priority.status || 'No Data';
    return { ...counts, [status]: (counts[status] || 0) + 1 };
  }, {});
  const metricAverage = Math.round(metrics.reduce((total, metric) => total + ((metric.current / metric.target) * 100), 0) / metrics.length);
  const report = weeklyActionReports[0];

  return (
    <>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 1.5, mb: 2 }}>
        <StatTile label="Priority Health" value={`${priorityCounts.Steady || 0}/${priorities.length}`} helper="Steady quarterly priorities" />
        <StatTile label="Needs Focus" value={(priorityCounts.Watch || 0) + (priorityCounts.Alert || 0)} helper="Watch or alert priorities" />
        <StatTile label="Critical Number Pace" value={`${metricAverage}%`} helper="Average current-to-target" />
        <StatTile label="Weekly Review" value={report.status} helper={`${report.weekStart} to ${report.weekEnd}`} />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '1.1fr 0.9fr' }, gap: 2 }}>
        <SectionPanel
          icon={<InsightsOutlinedIcon />}
          title="Leadership Read"
          subtitle="Items that should be visible before the next executive discussion."
        >
          <Stack gap={1}>
            {priorities.slice(0, 5).map((priority) => (
              <Box key={priority.id} sx={{ borderTop: '1px solid', borderColor: 'divider', py: 1.25 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1}>
                  <Box>
                    <Typography variant="body1" fontWeight={800}>{priority.name}</Typography>
                    <Typography variant="body2">{priority.strategicPillar}</Typography>
                  </Box>
                  <Chip label={priority.roadmapStatus || priority.status} color={statusColor[priority.roadmapStatus] || 'default'} size="small" />
                </Stack>
              </Box>
            ))}
          </Stack>
        </SectionPanel>

        <SectionPanel
          icon={<TableViewOutlinedIcon />}
          title="Critical Numbers"
          subtitle="Current target progress by metric owner."
        >
          <Stack gap={1}>
            {metrics.map((metric) => {
              const progress = Math.min(100, Math.round((metric.current / metric.target) * 100));
              return (
                <Box key={metric.id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.25 }}>
                  <Stack direction="row" justifyContent="space-between" gap={1}>
                    <Box>
                      <Typography variant="body1" fontWeight={800}>{metric.title}</Typography>
                      <Typography variant="body2">{metric.owner.name}</Typography>
                    </Box>
                    <Chip label={`${progress}%`} color={progress >= 80 ? 'success' : progress >= 60 ? 'warning' : 'error'} size="small" />
                  </Stack>
                  <LinearProgress value={progress} variant="determinate" sx={{ mt: 1 }} />
                </Box>
              );
            })}
          </Stack>
        </SectionPanel>
      </Box>
    </>
  );
};

const ExportsPage = () => {
  const exportCatalog = [
    {
      description: 'Metric title, owner, current value, target, and source.',
      filename: 'compass-metrics.csv',
      label: 'Metrics',
      rows: metrics.map((metric) => ({
        current: metric.current,
        owner: metric.owner.name,
        source: metric.source,
        target: metric.target,
        title: metric.title,
        updated: metric.updated,
      })),
    },
    {
      description: 'Quarterly priority status, owner, pillar, and description.',
      filename: 'compass-priorities.csv',
      label: 'Priorities',
      rows: priorities.map((priority) => ({
        description: priority.description,
        owner: priority.owner.name,
        pillar: priority.strategicPillar,
        status: priority.roadmapStatus || priority.status,
        title: priority.name,
      })),
    },
    {
      description: 'Action item owner, due date, status, visibility, and pillar.',
      filename: 'compass-action-items.csv',
      label: 'Action Items',
      rows: actionItems.map((item) => ({
        due: item.due,
        owner: item.owner.name,
        pillar: item.strategicPillar,
        status: item.status,
        task: item.description,
        visibility: item.visibility,
      })),
    },
  ];

  return (
    <SectionPanel
      icon={<DownloadOutlinedIcon />}
      title="Export Catalog"
      subtitle="Each download is generated in-browser from the current demo data set."
    >
      <Stack gap={1.25}>
        {exportCatalog.map((item) => (
          <Box key={item.filename} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.25 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1.5}>
              <Box>
                <Typography variant="body1" fontWeight={800}>{item.label}</Typography>
                <Typography variant="body2">{item.description}</Typography>
                <Chip label={`${item.rows.length} rows`} size="small" variant="outlined" sx={{ mt: 1 }} />
              </Box>
              <Button startIcon={<DownloadOutlinedIcon />} variant="contained" onClick={() => downloadCsv(item.filename, item.rows)}>
                Download CSV
              </Button>
            </Stack>
          </Box>
        ))}
      </Stack>
    </SectionPanel>
  );
};

const UsersPage = () => (
  <>
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 1.5, mb: 2 }}>
      <StatTile label="Users" value={users.length} helper="Demo profiles available" />
      <StatTile label="Departments" value={new Set(users.map((user) => user.department)).size} helper="Represented in Compass" />
      <StatTile label="Leadership Users" value={users.filter((user) => ['ELT', 'OLT'].includes(user.workingGroup)).length} helper="ELT or OLT lanes" />
    </Box>
    <SectionPanel icon={<GroupsOutlinedIcon />} title="Directory" subtitle="People currently seeded into the demo environment.">
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: 'repeat(2, 1fr)' }, gap: 1 }}>
        {users.map((user) => (
          <Box key={user.id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.25 }}>
            <Stack direction="row" gap={1} alignItems="center">
              <UserAvatar user={user} size="md" />
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body1" fontWeight={800}>{user.name}</Typography>
                <Typography variant="body2">{user.role}</Typography>
                <Stack direction="row" gap={0.5} flexWrap="wrap" sx={{ mt: 0.75 }}>
                  <Chip label={user.department} size="small" color="primary" variant="outlined" />
                  <Chip label={user.workingGroup} size="small" />
                </Stack>
              </Box>
            </Stack>
          </Box>
        ))}
      </Box>
    </SectionPanel>
  </>
);

const TeamsPage = () => {
  const teamSummaries = useMemo(buildTeamSummaries, []);

  return (
    <SectionPanel icon={<GroupsOutlinedIcon />} title="Team Map" subtitle="Teams are compiled from the current user profiles.">
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: 'repeat(2, 1fr)' }, gap: 1 }}>
        {teamSummaries.map((team) => (
          <Box key={team.name} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.25 }}>
            <Stack direction="row" justifyContent="space-between" gap={1}>
              <Box>
                <Typography variant="body1" fontWeight={800}>{team.name}</Typography>
                <Typography variant="body2">{team.departments.join(', ')}</Typography>
              </Box>
              <Chip label={`${team.members.length} members`} color="primary" size="small" />
            </Stack>
            <Stack direction="row" gap={0.5} flexWrap="wrap" sx={{ mt: 1 }}>
              {team.members.map((member) => <Chip key={member.id} avatar={<UserAvatar user={member} size="sm" />} label={member.name} size="small" variant="outlined" />)}
            </Stack>
          </Box>
        ))}
      </Box>
    </SectionPanel>
  );
};

const PermissionsPage = () => {
  const permissionRows = [
    { area: 'ELT', manage: 'Organization dashboards, initiatives, priorities, and action visibility.', members: users.filter((user) => user.workingGroup === 'ELT') },
    { area: 'OLT', manage: 'Department workplans, weekly action tracker follow-through, and team huddle work.', members: users.filter((user) => user.workingGroup === 'OLT') },
    { area: 'Team Member', manage: 'Assigned action items, personal dashboard signals, and related weekly commitments.', members: users.filter((user) => user.workingGroup === 'Team Member') },
  ];

  return (
    <SectionPanel icon={<ShieldOutlinedIcon />} title="Permission Model" subtitle="Current access behavior expressed as a simple operating map.">
      <Stack gap={1}>
        {permissionRows.map((row) => (
          <Box key={row.area} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.25 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1}>
              <Box>
                <Typography variant="body1" fontWeight={800}>{row.area}</Typography>
                <Typography variant="body2">{row.manage}</Typography>
              </Box>
              <Chip label={`${row.members.length} users`} color="primary" size="small" />
            </Stack>
            <Stack direction="row" gap={0.5} flexWrap="wrap" sx={{ mt: 1 }}>
              {row.members.map((member) => <Chip key={member.id} label={member.name} size="small" variant="outlined" />)}
            </Stack>
          </Box>
        ))}
      </Stack>
    </SectionPanel>
  );
};

const pageActions = {
  adminPermissions: [{ label: 'Review Users', path: '/admin/users' }, { label: 'Open Teams', path: '/admin/teams' }],
  adminTeams: [{ label: 'Open Huddles', path: '/huddles' }, { label: 'Review Users', path: '/admin/users' }],
  adminUsers: [{ label: 'Open Profile', path: '/profile' }, { label: 'View Permissions', path: '/admin/permissions' }],
  executiveSummary: [{ label: 'Company Dashboard', path: '/dashboard/company' }, { label: 'Priority Map', path: '/priorities' }],
  exports: [{ label: 'Open Data Table', path: '/metrics/table' }, { label: 'Company Dashboard', path: '/dashboard/company' }],
  teamHealth: [{ label: 'Open Huddles', path: '/huddles' }, { label: 'Review Stucks', path: '/stucks' }],
};

const renderPage = (page) => {
  if (page === 'teamHealth') return <TeamHealthPage />;
  if (page === 'executiveSummary') return <ExecutiveSummaryPage />;
  if (page === 'exports') return <ExportsPage />;
  if (page === 'adminUsers') return <UsersPage />;
  if (page === 'adminTeams') return <TeamsPage />;
  if (page === 'adminPermissions') return <PermissionsPage />;
  return <ExecutiveSummaryPage />;
};

const CompassDestinationPage = ({ page }) => {
  const meta = pageMeta[page] || pageMeta.executiveSummary;

  return (
    <PageWrapper>
      <Stack direction={{ xs: 'column', lg: 'row' }} justifyContent="space-between" alignItems={{ lg: 'center' }} gap={2} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="caption" sx={{ color: 'secondary.dark', fontWeight: 800, textTransform: 'uppercase' }}>{meta.eyebrow}</Typography>
          <Typography variant="h1">{meta.title}</Typography>
          <Typography variant="body2" sx={{ mt: 0.5, maxWidth: 760 }}>{meta.subtitle}</Typography>
        </Box>
        <ActionButtons actions={pageActions[page] || []} />
      </Stack>
      {renderPage(page)}
    </PageWrapper>
  );
};

export default CompassDestinationPage;
