import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import AssignmentIndOutlinedIcon from '@mui/icons-material/AssignmentIndOutlined';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined';
import HomeWorkOutlinedIcon from '@mui/icons-material/HomeWorkOutlined';
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import VolunteerActivismOutlinedIcon from '@mui/icons-material/VolunteerActivismOutlined';
import { Box, Chip, LinearProgress, Stack, Typography } from '@mui/material';
import UserAvatar from '../shared/UserAvatar';

const profiles = {
  financials: {
    icon: AccountBalanceOutlinedIcon,
    title: 'Finance Dashboard',
    subtitle: 'Budget health, liquidity, receivables, and organization-wide financial readiness.',
    stats: [
      ['Cash Position', '$8.4M', '94 days operating cash'],
      ['Budget Variance', '2.8%', 'Favorable to plan'],
      ['Grant Receivables', '$1.2M', 'Awaiting reimbursement'],
      ['Debt Service', '1.42x', 'Coverage remains on course'],
    ],
    primaryTitle: 'Financial Priorities',
    primaryRows: [
      { name: 'Close Q2 reforecast package', status: 'On Course', progress: 82, detail: 'Department assumptions due Friday.' },
      { name: 'Reduce grant reimbursement aging', status: 'Needs Attention', progress: 54, detail: 'Two funder packets need backup documentation.' },
      { name: 'Board finance dashboard refresh', status: 'On Course', progress: 70, detail: 'New cash and compliance views drafted.' },
    ],
    secondaryTitle: 'Financial Watchlist',
    secondaryRows: ['Insurance renewal impact', 'Development draw timing', 'Property-level variance exceptions'],
  },
  development: {
    icon: ApartmentOutlinedIcon,
    title: 'Real Estate Development Dashboard',
    subtitle: 'Timelines to build, maintain, close, and stabilize properties in the development pipeline.',
    stats: [
      ['Active Projects', '7', 'Across predevelopment and construction'],
      ['Upcoming Closings', '3', 'Next 90 days'],
      ['Construction Risk', '2', 'Sites need attention'],
      ['Units in Motion', '318', 'Pipeline homes tracked'],
    ],
    primaryTitle: 'Pipeline Timeline',
    primaryRows: [
      { name: 'Walnut Street financial closing', status: 'On Course', progress: 76, detail: 'Counsel reviewing final conditions.' },
      { name: 'Northside rehab construction start', status: 'Needs Attention', progress: 48, detail: 'Permit response due from municipality.' },
      { name: 'Scattered sites capital needs scope', status: 'On Course', progress: 64, detail: 'Architectural assessment in progress.' },
    ],
    secondaryTitle: 'Closing Conditions',
    secondaryRows: ['Investor approval', 'Environmental sign-off', 'Final sources and uses'],
  },
  hr: {
    icon: AssignmentIndOutlinedIcon,
    title: 'People Dashboard',
    subtitle: 'Employee satisfaction, retention, hiring health, and open position momentum.',
    stats: [
      ['Engagement Pulse', '81%', 'Last survey response health'],
      ['Retention Risk', '4', 'Roles flagged for follow-up'],
      ['Open Positions', '11', 'Across five departments'],
      ['Time to Fill', '34d', 'Median active posting age'],
    ],
    primaryTitle: 'Hiring and Retention Priorities',
    primaryRows: [
      { name: 'Publish Resident Services Coordinator posting', status: 'On Course', progress: 90, detail: 'Final compensation review complete.' },
      { name: 'Complete retention stay interviews', status: 'Needs Attention', progress: 42, detail: 'Five interviews still need scheduling.' },
      { name: 'Manager onboarding toolkit', status: 'On Course', progress: 68, detail: 'Policy and first-30-day guide drafted.' },
    ],
    secondaryTitle: 'Open Position Focus',
    secondaryRows: ['Property Manager', 'Maintenance Technician', 'Resident Services Coordinator'],
  },
  advancement: {
    icon: VolunteerActivismOutlinedIcon,
    title: 'Impact and Advancement Dashboard',
    subtitle: 'Grant writing, fundraising, community relationships, and advancement pipeline visibility.',
    stats: [
      ['Active Grants', '14', 'Submitted or in development'],
      ['Pipeline Value', '$3.7M', 'Across public and private funders'],
      ['Community Touchpoints', '26', 'This quarter'],
      ['Reports Due', '5', 'Next 30 days'],
    ],
    primaryTitle: 'Fundraising Hub Priorities',
    primaryRows: [
      { name: 'Submit housing stability foundation proposal', status: 'On Course', progress: 84, detail: 'Narrative complete; budget attachments pending.' },
      { name: 'Refresh donor impact story packet', status: 'Needs Attention', progress: 45, detail: 'Needs resident voice review before release.' },
      { name: 'Prepare community partner cultivation list', status: 'On Course', progress: 72, detail: 'Top 20 contacts identified.' },
    ],
    secondaryTitle: 'Grant and Funder Watchlist',
    secondaryRows: ['County housing fund', 'Foundation renewal', 'Corporate volunteer partner'],
  },
  resident_services: {
    icon: FavoriteBorderOutlinedIcon,
    title: 'Resident Services Dashboard',
    subtitle: 'Trauma-informed resident journey support, referrals, needs assessments, and coordinator follow-up.',
    stats: [
      ['Needs Assessments', '43', 'Completed this month'],
      ['Open Referrals', '128', 'Across service categories'],
      ['Urgent Follow-Ups', '9', 'Need coordinator action'],
      ['Resolved Supports', '71%', 'Closed within target window'],
    ],
    primaryTitle: 'Resident Journey Priorities',
    primaryRows: [
      { name: 'Standardize referral follow-up rhythm', status: 'On Course', progress: 74, detail: 'Coordinator review template piloting now.' },
      { name: 'Escalate food security referral backlog', status: 'Needs Attention', progress: 38, detail: 'Nine households need provider confirmation.' },
      { name: 'Resident services intake dashboard', status: 'On Course', progress: 62, detail: 'Needs categories and urgency levels mapped.' },
    ],
    secondaryTitle: 'Referral Categories',
    secondaryRows: ['Food security', 'Behavioral health', 'Employment and benefits navigation'],
  },
};

const propertyProfile = {
  icon: HomeWorkOutlinedIcon,
  title: 'Property Management Dashboard',
  subtitle: 'Leasing, maintenance, and a frequently shifting portfolio view tied directly to individual and org-wide priorities.',
  stats: [
    ['Occupancy', '94.2%', 'Portfolio-wide'],
    ['Open Work Orders', '186', '42 over target'],
    ['Lease-Up Units', '31', 'Active pipeline'],
    ['Priority Properties', '6', 'Need leadership visibility'],
  ],
  primaryTitle: 'Portfolio Priorities',
  primaryRows: [
    { name: 'Reduce high-aging maintenance backlog', status: 'Needs Attention', progress: 52, detail: 'Four properties have work orders over 30 days.' },
    { name: 'Stabilize lease-up at new communities', status: 'On Course', progress: 66, detail: 'Weekly leasing follow-up rhythm is active.' },
    { name: 'Refresh property risk review', status: 'On Course', progress: 71, detail: 'Regional managers validating property notes.' },
  ],
  secondaryTitle: 'Portfolio Signals',
  secondaryRows: ['Vacancy swings', 'Maintenance aging', 'Compliance readiness'],
};

const propertyPins = [
  { name: 'HDC Community East', x: 68, y: 38, status: 'On Course', priority: 'Lease-up' },
  { name: 'Walnut Street Homes', x: 42, y: 52, status: 'Needs Attention', priority: 'Maintenance backlog' },
  { name: 'Northside Commons', x: 55, y: 25, status: 'On Course', priority: 'Compliance readiness' },
  { name: 'Riverbend', x: 30, y: 66, status: 'Needs Attention', priority: 'Resident communication' },
  { name: 'Maple Court', x: 76, y: 70, status: 'On Course', priority: 'Turnover pace' },
];

const statusColor = {
  'On Course': 'success',
  'Needs Attention': 'warning',
  'Off Course': 'error',
  Completed: 'success',
};

const PortfolioMap = () => (
    <Box aria-label="Portfolio map with priority-linked property pins" sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5, minHeight: 330 }}>
    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
      <Stack direction="row" alignItems="center" gap={1}>
        <MapOutlinedIcon color="primary" />
        <Typography variant="h3">Portfolio Map</Typography>
      </Stack>
      <Chip label="Priority-linked properties" color="primary" variant="outlined" size="small" />
    </Stack>
    <Box
      role="list"
      aria-label="Priority-linked properties"
      sx={{
        position: 'relative',
        height: 238,
        borderRadius: 1,
        overflow: 'hidden',
        bgcolor: '#eef3f4',
        backgroundImage: 'linear-gradient(90deg, rgba(7,44,94,0.05) 1px, transparent 1px), linear-gradient(rgba(7,44,94,0.05) 1px, transparent 1px)',
        backgroundSize: '36px 36px',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      {propertyPins.map((pin) => (
        <Box
          key={pin.name}
          role="listitem"
          aria-label={`${pin.name}. ${pin.status}. Priority: ${pin.priority}.`}
          sx={{
            position: 'absolute',
            left: `${pin.x}%`,
            top: `${pin.y}%`,
            transform: 'translate(-50%, -50%)',
            display: 'grid',
            placeItems: 'center',
            gap: 0.5,
          }}
        >
          <Box aria-hidden="true" sx={{ width: 18, height: 18, borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)', bgcolor: pin.status === 'On Course' ? 'success.main' : 'warning.main', border: '2px solid white', boxShadow: 2 }} />
          <Box sx={{ bgcolor: 'background.paper', borderRadius: 1, px: 0.75, py: 0.25, boxShadow: 1, minWidth: 118 }}>
            <Typography variant="caption" color="text.primary" fontWeight={700}>{pin.name}</Typography>
            <Typography variant="caption" display="block">{pin.priority}</Typography>
          </Box>
        </Box>
      ))}
    </Box>
  </Box>
);

const StatCard = ({ label, value, helper }) => (
  <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5, minHeight: 104 }}>
    <Typography variant="caption">{label}</Typography>
    <Typography variant="h2" sx={{ my: 0.5 }}>{value}</Typography>
    <Typography variant="body2">{helper}</Typography>
  </Box>
);

const FocusedDashboard = ({ user }) => {
  const profile = user.dashboardFocus === 'property_management' ? propertyProfile : profiles[user.dashboardFocus];
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
        {profile.stats.map(([label, value, helper]) => (
          <StatCard key={label} label={label} value={value} helper={helper} />
        ))}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: user.dashboardFocus === 'property_management' ? '1fr 1fr' : '1.4fr 0.8fr' }, gap: 2 }}>
        <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
          <Typography variant="h3" sx={{ mb: 1 }}>{profile.primaryTitle}</Typography>
          <Stack gap={1}>
            {profile.primaryRows.map((row) => (
              <Box key={row.name} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.25 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1} sx={{ mb: 1 }}>
                  <Typography variant="body1" fontWeight={700}>{row.name}</Typography>
                  <Chip label={row.status} color={statusColor[row.status]} size="small" />
                </Stack>
                <LinearProgress value={row.progress} variant="determinate" sx={{ mb: 0.75 }} />
                <Typography variant="body2" color="text.primary">{row.detail}</Typography>
              </Box>
            ))}
          </Stack>
        </Box>

        {user.dashboardFocus === 'property_management' ? (
          <PortfolioMap />
        ) : (
          <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
            <Typography variant="h3" sx={{ mb: 1 }}>{profile.secondaryTitle}</Typography>
            <Stack gap={1}>
              {profile.secondaryRows.map((row) => (
                <Box key={row} sx={{ display: 'flex', alignItems: 'center', gap: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1 }}>
                  <HandshakeOutlinedIcon color="secondary" fontSize="small" />
                  <Typography variant="body1">{row}</Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default FocusedDashboard;
