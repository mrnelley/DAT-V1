import BarChartIcon from '@mui/icons-material/BarChart';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import GroupsIcon from '@mui/icons-material/Groups';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import TodayOutlinedIcon from '@mui/icons-material/TodayOutlined';
import SettingsIcon from '@mui/icons-material/Settings';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TableViewOutlinedIcon from '@mui/icons-material/TableViewOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import { Box, Drawer, IconButton, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography, useMediaQuery } from '@mui/material';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { useFeatureAccess } from '../../context/FeatureAccessContext';
import { useAuth } from '../../hooks/useAuth';
import UserAvatar from '../shared/UserAvatar';

const navSections = [
  [
    { featureKey: 'companyDashboard', icon: DashboardOutlinedIcon, label: 'Company Dashboard', path: '/dashboard/company' },
    { featureKey: 'myDashboard', icon: DashboardOutlinedIcon, label: 'My Dashboard', path: '/dashboard/me' },
    { featureKey: 'initiatives', icon: AssignmentOutlinedIcon, label: 'Annual Initiatives', path: '/initiatives' },
    { featureKey: 'dataTable', icon: TableViewOutlinedIcon, label: 'Data Table', path: '/metrics/table' },
  ],
  [
    { featureKey: 'priorities', icon: TrendingUpIcon, label: 'Operational Priorities', path: '/priorities' },
    { featureKey: 'workplans', icon: FactCheckOutlinedIcon, label: 'Department Workplans', path: '/workplans' },
  ],
  [
    { featureKey: 'weeklyTracker', icon: TodayOutlinedIcon, label: 'Weekly Tracker', path: '/weekly-tracker' },
    { featureKey: 'actionItems', icon: CheckCircleOutlineIcon, label: 'Action Views', path: '/action-items' },
    { featureKey: 'huddles', icon: GroupsIcon, label: 'Huddles', popout: true },
    { featureKey: 'stucks', icon: WarningAmberOutlinedIcon, label: 'Stucks', path: '/stucks' },
  ],
  [
    { featureKey: 'metrics', icon: BarChartIcon, label: 'Metrics', path: '/metrics' },
    { icon: SchoolOutlinedIcon, label: 'Learn', path: '/learn' },
  ],
];

const SectionSeparator = () => (
  <Box
    aria-hidden="true"
    sx={{
      background: 'linear-gradient(90deg, rgba(94,184,168,0) 0%, rgba(94,184,168,0.08) 20%, rgba(239,220,156,0.72) 50%, rgba(94,184,168,0.08) 80%, rgba(94,184,168,0) 100%)',
      height: 1,
      mx: 1.25,
      my: 1.15,
    }}
  />
);

const isNavActive = (location, item) => {
  if (item.popout) return location.pathname.startsWith('/huddles');
  if (!item.path) return false;
  if (item.path === '/metrics') return location.pathname === '/metrics';
  return location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
};

const SideNav = ({ open, mobileOpen, onMobileClose, onHuddlesClick }) => {
  const { user } = useAuth();
  const { isFeatureEnabled } = useFeatureAccess();
  const navigate = useNavigate();
  const location = useLocation();
  const mobile = useMediaQuery((theme) => theme.breakpoints.down('md'));
  const width = open ? 240 : 64;
  const visibleSections = navSections
    .map((section) => section.filter((item) => !item.featureKey || isFeatureEnabled(item.featureKey)))
    .filter((section) => section.length);

  const content = (
    <Box component={motion.div} animate={{ width: mobile ? 240 : width }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} sx={{ width, height: '100%', color: 'common.white', overflowX: 'hidden' }}>
      <Toolbar />
      <List sx={{ px: 1, pb: 12 }}>
        {visibleSections.map((section, sectionIndex) => (
          <Box key={section.map((item) => item.label).join('-')}>
            {sectionIndex > 0 && <SectionSeparator />}
            {section.map((item) => {
              const Icon = item.icon;
              const active = isNavActive(location, item);

              return (
                <ListItemButton
                  key={item.label}
                  onClick={() => {
                    if (item.popout) onHuddlesClick();
                    if (item.path) navigate(item.path);
                    if (mobile) onMobileClose();
                  }}
                  sx={{
                    minHeight: 48,
                    borderRadius: 1,
                    borderLeft: active ? '3px solid #5eb8a8' : '3px solid transparent',
                    bgcolor: active ? 'rgba(94,184,168,0.18)' : 'transparent',
                    color: active ? 'secondary.main' : 'common.white',
                  }}
                >
                  <ListItemIcon sx={{ color: 'inherit', minWidth: 42 }}><Icon /></ListItemIcon>
                  <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 600 }} sx={{ opacity: open || mobile ? 1 : 0 }} />
                </ListItemButton>
              );
            })}
          </Box>
        ))}
      </List>
      <Box sx={{ mt: 'auto', p: 1, position: 'absolute', bottom: 0, width: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'common.white' }}>
          <UserAvatar user={user} size="md" />
          {(open || mobile) && (
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" color="inherit" noWrap>{user.name}</Typography>
              <Typography variant="caption" color="secondary.light">{user.role}</Typography>
            </Box>
          )}
          {(open || mobile) && (
            <IconButton
              aria-label="Open profile settings"
              onClick={() => navigate('/profile')}
              sx={{ color: 'common.white' }}
            >
              <SettingsIcon />
            </IconButton>
          )}
        </Box>
      </Box>
    </Box>
  );

  return (
    <>
      <Drawer variant="permanent" open sx={{ display: { xs: 'none', md: 'block' }, width, '& .MuiDrawer-paper': { width, overflow: 'hidden' } }}>
        {content}
      </Drawer>
      <Drawer variant="temporary" open={mobileOpen} onClose={onMobileClose} sx={{ display: { xs: 'block', md: 'none' } }}>
        {content}
      </Drawer>
    </>
  );
};

export default SideNav;
