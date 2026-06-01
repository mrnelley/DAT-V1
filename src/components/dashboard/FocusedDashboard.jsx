import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import AssignmentIndOutlinedIcon from '@mui/icons-material/AssignmentIndOutlined';
import ChecklistOutlinedIcon from '@mui/icons-material/ChecklistOutlined';
import CloudQueueOutlinedIcon from '@mui/icons-material/CloudQueueOutlined';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined';
import VolunteerActivismOutlinedIcon from '@mui/icons-material/VolunteerActivismOutlined';
import { Box, Chip, LinearProgress, Stack, Typography } from '@mui/material';
import { weeklyPriorities } from '../../data/mockData';
import UserAvatar from '../shared/UserAvatar';
import PropertyManagementDashboard from './PropertyManagementDashboard';
import ResidentServicesMap from './ResidentServicesMap';

const profiles = {
  financials: {
    icon: AccountBalanceOutlinedIcon,
    title: 'Finance Dashboard',
    subtitle: 'Budget health, liquidity, receivables, and organization-wide financial readiness.',
    stats: [
      ['Cash Position', '$8.4M', '94 days operating cash'],
      ['Budget Variance', '2.8%', 'Favorable to plan'],
      ['Grant Receivables', '$1.2M', 'Awaiting reimbursement'],
      ['Debt Service', '1.42x', 'Coverage remains steady'],
    ],
    primaryTitle: 'Financial Priorities',
    primaryRows: [
      { name: 'Close Q2 reforecast package', status: 'Steady', progress: 82, detail: 'Department assumptions due Friday.' },
      { name: 'Reduce grant reimbursement aging', status: 'Watch', progress: 54, detail: 'Two funder packets need backup documentation.' },
      { name: 'Board finance dashboard refresh', status: 'Steady', progress: 70, detail: 'New cash and compliance views drafted.' },
    ],
    secondaryTitle: 'Financial Watchlist',
    secondaryRows: ['Insurance renewal impact', 'Development draw timing', 'Property-level variance exceptions'],
  },
  operations: {
    icon: ChecklistOutlinedIcon,
    title: 'Operations Dashboard',
    subtitle: 'Cross-functional operating priorities, blocked work, and organizational execution support.',
    stats: [
      ['Active Workplans', '9', 'Across Finance, PM, RS, RED, HR, and Advancement'],
      ['Open Stucks', '6', 'Need cross-department support'],
      ['Q2 Priorities', '5', 'Company priorities in motion'],
      ['Watch Items', '3', 'Need ELT/OLT attention'],
    ],
    primaryTitle: 'Operations Priorities',
    primaryRows: [
      { name: 'Operational Efficiency rollup review', status: 'Steady', progress: 62, detail: 'Departmental workplans are being connected to Q2 org priorities.' },
      { name: 'Third-party PM exit closeout', status: 'Completed', progress: 100, detail: 'Newtowne, Hartley, and Providence exits completed as of 5/1/26.' },
      { name: 'Quarterly accountability rhythm', status: 'Watch', progress: 48, detail: 'Pending final alignment from Finance and Resident Services workplans.' },
    ],
    secondaryTitle: 'Operational Watchlist',
    secondaryRows: ['PM fee dependency support', 'Assigned stucks', 'Quarterly carry-forward decisions'],
  },
  development: {
    icon: ApartmentOutlinedIcon,
    title: 'Real Estate Development Dashboard',
    subtitle: 'Timelines to build, maintain, close, and stabilize properties in the development pipeline.',
    stats: [
      ['Active Projects', '7', 'Across predevelopment and construction'],
      ['Upcoming Closings', '3', 'Next 90 days'],
      ['Construction Risk', '2', 'Sites on watch'],
      ['Units in Motion', '318', 'Pipeline homes tracked'],
    ],
    primaryTitle: 'Pipeline Timeline',
    primaryRows: [
      { name: 'Walnut Street financial closing', status: 'Steady', progress: 76, detail: 'Counsel reviewing final conditions.' },
      { name: 'Northside rehab construction start', status: 'Watch', progress: 48, detail: 'Permit response due from municipality.' },
      { name: 'Scattered sites capital needs scope', status: 'Steady', progress: 64, detail: 'Architectural assessment in progress.' },
    ],
    secondaryTitle: 'Closing Conditions',
    secondaryRows: ['Investor approval', 'Environmental sign-off', 'Final sources and uses'],
  },
  hr: {
    icon: AssignmentIndOutlinedIcon,
    title: 'People Dashboard',
    subtitle: 'Employee satisfaction, retention, hiring health, and open position momentum.',
    stats: [
      ['Engagement Signal', '81%', 'Last survey response health'],
      ['Retention Risk', '4', 'Roles flagged for follow-up'],
      ['Open Positions', '11', 'Across five departments'],
      ['Time to Fill', '34d', 'Median active posting age'],
    ],
    primaryTitle: 'Hiring and Retention Priorities',
    primaryRows: [
      { name: 'Publish Resident Services Coordinator posting', status: 'Steady', progress: 90, detail: 'Final compensation review complete.' },
      { name: 'Complete retention stay interviews', status: 'Watch', progress: 42, detail: 'Five interviews still need scheduling.' },
      { name: 'Manager onboarding toolkit', status: 'Steady', progress: 68, detail: 'Policy and first-30-day guide drafted.' },
    ],
    secondaryTitle: 'Open Position Focus',
    secondaryRows: ['Property Manager', 'Maintenance Technician', 'Resident Services Coordinator'],
  },
  advancement: {
    icon: VolunteerActivismOutlinedIcon,
    title: 'Impact and Advancement Dashboard',
    subtitle: 'Grant writing, fundraising, community relationships, and advancement pipeline visibility.',
    stats: [
      ['Active Grants', '14', 'Submitted or in development', 'Salesforce CRM'],
      ['Pipeline Value', '$3.7M', 'Across public and private funders', 'Salesforce CRM'],
      ['Community Touchpoints', '26', 'This quarter', 'Salesforce CRM'],
      ['Reports Due', '5', 'Next 30 days'],
    ],
    primaryTitle: 'Fundraising Hub Priorities',
    primaryRows: [
      { name: 'Submit housing stability foundation proposal', status: 'Steady', progress: 84, detail: 'Narrative complete; budget attachments pending.', source: 'Salesforce CRM' },
      { name: 'Refresh donor impact story packet', status: 'Watch', progress: 45, detail: 'Needs resident voice review before release.', source: 'Salesforce CRM' },
      { name: 'Prepare community partner cultivation list', status: 'Steady', progress: 72, detail: 'Top 20 contacts identified.', source: 'Salesforce CRM' },
    ],
    secondaryTitle: 'Grant and Funder Watchlist',
    secondaryRows: [
      { label: 'County housing fund', source: 'Salesforce CRM' },
      { label: 'Foundation renewal', source: 'Salesforce CRM' },
      { label: 'Corporate volunteer partner' },
    ],
  },
  resident_services: {
    icon: FavoriteBorderOutlinedIcon,
    title: 'Resident Services Dashboard',
    subtitle: 'Trauma-informed resident journey support, referrals, needs assessments, and coordinator follow-up.',
    stats: [
      ['Needs Assessments', '43', 'Completed this month', 'Salesforce CRM'],
      ['Open Referrals', '128', 'Across service categories', 'Salesforce CRM'],
      ['Urgent Follow-Ups', '9', 'Need coordinator action', 'Salesforce CRM'],
      ['Resolved Supports', '71%', 'Closed within target window', 'Salesforce CRM'],
    ],
    primaryTitle: 'Resident Journey Priorities',
    primaryRows: [
      { name: 'Standardize referral follow-up rhythm', status: 'Steady', progress: 74, detail: 'Coordinator review template piloting now.', source: 'Salesforce CRM' },
      { name: 'Escalate food security referral backlog', status: 'Watch', progress: 38, detail: 'Nine households need provider confirmation.', source: 'Salesforce CRM' },
      { name: 'Resident services intake dashboard', status: 'Steady', progress: 62, detail: 'Needs categories and urgency levels mapped.', source: 'Salesforce CRM' },
    ],
    secondaryTitle: 'Referral Categories',
    secondaryRows: [
      { label: 'Food security', source: 'Salesforce CRM' },
      { label: 'Behavioral health', source: 'Salesforce CRM' },
      { label: 'Employment and benefits navigation' },
    ],
  },
};

const statusColor = {
  Steady: 'success',
  Watch: 'warning',
  Alert: 'error',
  Completed: 'success',
  Open: 'info',
};

const weeklyPriorityLeadershipLanes = {
  u2: { label: 'Finance', departments: ['Finance'] },
  u3: { label: 'Real Estate Development', departments: ['Real Estate Development'] },
  u4: { label: 'Property Management', departments: ['Property Management', 'Property Management & Compliance'] },
  u5: { label: 'HR', departments: ['Human Resources'] },
  u6: { label: 'Impact and Advancement', departments: ['Impact and Advancement', 'Community Relations'] },
  u8: { label: 'Operations', departments: ['Operations', 'Resident Services'] },
};

const SalesforceFlag = ({ source }) => (
  source ? (
    <Chip
      icon={<CloudQueueOutlinedIcon />}
      label={source}
      size="small"
      variant="outlined"
      sx={{
        borderColor: '#0176d3',
        color: '#0176d3',
        fontWeight: 700,
        '& .MuiChip-icon': { color: '#0176d3' },
      }}
    />
  ) : null
);

const StatCard = ({ helper, label, source, value }) => (
  <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5, minHeight: 104 }}>
    <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
      <Typography variant="caption">{label}</Typography>
      <SalesforceFlag source={source} />
    </Stack>
    <Typography variant="h2" sx={{ my: 0.5 }}>{value}</Typography>
    <Typography variant="body2">{helper}</Typography>
  </Box>
);

const WeeklyPrioritiesSection = ({ user }) => {
  const leadershipLane = weeklyPriorityLeadershipLanes[user.id];
  const isLeadershipView = Boolean(leadershipLane);
  const visiblePriorities = weeklyPriorities.filter((priority) => {
    const priorityDepartment = priority.department || priority.owner.department;
    return (
      priority.owner.id === user.id
      || priority.supportUsers.some((supportUser) => supportUser.id === user.id)
      || priority.tasks.some((task) => task.owner.id === user.id)
      || leadershipLane?.departments.includes(priorityDepartment)
    );
  });

  if (!visiblePriorities.length) return null;

  return (
    <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5, mb: 2 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={1} sx={{ mb: 1.5 }}>
        <Box>
          <Typography variant="h3">{isLeadershipView ? `${leadershipLane.label} Weekly Priorities` : `${user.name.split(' ')[0]}'s Priority Task List`}</Typography>
          <Typography variant="body2">Week of Monday, May 11, 2026</Typography>
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
                  <Typography variant="body1" fontWeight={800} sx={{ mt: 1 }}>{priority.outcome}</Typography>
                  <Typography variant="body2" color="text.primary">Aligned to: {priority.alignedTo}</Typography>
                </Box>
                <Stack direction="row" gap={1} alignItems="center" sx={{ flexShrink: 0 }}>
                  <UserAvatar user={priority.owner} size="sm" />
                  <Box>
                    <Typography variant="body2" color="text.primary" fontWeight={700}>{priority.owner.name}</Typography>
                    <Typography variant="caption">Support: {priority.supportLabel}</Typography>
                  </Box>
                </Stack>
              </Stack>

              <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mt: 1 }}>
                <Chip label={priority.organizationalPriority} color="primary" variant="outlined" size="small" />
                <Chip label={priority.strategicPillar} variant="outlined" size="small" />
                {priority.keyObjective && <Chip label={priority.keyObjective} variant="outlined" size="small" />}
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

const FocusedDashboard = ({ user }) => {
  if (user.dashboardFocus === 'property_management') {
    return (
      <Box sx={{ mb: 3 }}>
        <WeeklyPrioritiesSection user={user} />
        <PropertyManagementDashboard user={user} />
      </Box>
    );
  }

  const profile = profiles[user.dashboardFocus];
  if (!profile) return null;
  const Icon = profile.icon;

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
        {profile.stats.map(([label, value, helper, source]) => (
          <StatCard key={label} label={label} value={value} helper={helper} source={source} />
        ))}
      </Box>

      <WeeklyPrioritiesSection user={user} />

      {user.dashboardFocus === 'resident_services' && <ResidentServicesMap />}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '1.4fr 0.8fr' }, gap: 2 }}>
        <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
          <Typography variant="h3" sx={{ mb: 1 }}>{profile.primaryTitle}</Typography>
          <Stack gap={1}>
            {profile.primaryRows.map((row) => (
              <Box key={row.name} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.25 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1} sx={{ mb: 1 }}>
                  <Typography variant="body1" fontWeight={700}>{row.name}</Typography>
                  <Stack direction="row" gap={1} flexWrap="wrap" justifyContent="flex-end">
                    <SalesforceFlag source={row.source} />
                    <Chip label={row.status} color={statusColor[row.status]} size="small" />
                  </Stack>
                </Stack>
                <LinearProgress value={row.progress} variant="determinate" sx={{ mb: 0.75 }} />
                <Typography variant="body2" color="text.primary">{row.detail}</Typography>
              </Box>
            ))}
          </Stack>
        </Box>

        <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
          <Typography variant="h3" sx={{ mb: 1 }}>{profile.secondaryTitle}</Typography>
          <Stack gap={1}>
            {profile.secondaryRows.map((row) => {
              const label = typeof row === 'string' ? row : row.label;
              const source = typeof row === 'string' ? null : row.source;

              return (
              <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1 }}>
                <HandshakeOutlinedIcon color="secondary" fontSize="small" />
                <Typography variant="body1" sx={{ flex: 1 }}>{label}</Typography>
                <SalesforceFlag source={source} />
              </Box>
              );
            })}
          </Stack>
        </Box>
      </Box>
    </Box>
  );
};

export default FocusedDashboard;
