import BarChartIcon from '@mui/icons-material/BarChart';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import GroupsIcon from '@mui/icons-material/Groups';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import TodayOutlinedIcon from '@mui/icons-material/TodayOutlined';
import SettingsIcon from '@mui/icons-material/Settings';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import { Box, Collapse, Drawer, IconButton, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography, useMediaQuery } from '@mui/material';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useFeatureAccess } from '../../context/FeatureAccessContext';
import { useAuth } from '../../hooks/useAuth';
import UserAvatar from '../shared/UserAvatar';

const dashboardItems = [
  { featureKey: 'companyDashboard', label: 'Company Dashboard', path: '/dashboard/company' },
  { featureKey: 'myDashboard', label: 'My Dashboard', path: '/dashboard/me' },
  { featureKey: 'initiatives', label: 'Annual Initiatives', path: '/initiatives' },
  { featureKey: 'dataTable', label: 'Data Table', path: '/metrics/table' },
];

const navSections = [
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
      height: 14,
      mx: 0.5,
      my: 1.1,
      opacity: 0.98,
      position: 'relative',
      '&::before': {
        background: 'linear-gradient(90deg, rgba(239,220,156,0) 0%, rgba(239,220,156,0) 18%, rgba(94,184,168,0.72) 34%, rgba(239,220,156,0.96) 50%, rgba(94,184,168,0.72) 66%, rgba(239,220,156,0) 82%, rgba(239,220,156,0) 100%)',
        borderRadius: 999,
        boxShadow: '0 0 10px rgba(239,220,156,0.34), 0 0 14px rgba(94,184,168,0.18)',
        content: '""',
        height: 2,
        left: 0,
        position: 'absolute',
        right: 0,
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 1,
      },
      '&::after': {
        background: 'linear-gradient(90deg, rgba(94,184,168,0) 0%, rgba(94,184,168,0.1) 20%, rgba(94,184,168,0.22) 50%, rgba(94,184,168,0.1) 80%, rgba(94,184,168,0) 100%)',
        content: '""',
        height: 10,
        left: 0,
        position: 'absolute',
        right: 0,
        top: 2,
        zIndex: 0,
      },
    }}
  />
);

const isNavActive = (location, item) => {
  if (item.popout) return location.pathname.startsWith('/huddles');
  if (!item.path) return false;
  if (item.path === '/metrics') return location.pathname === '/metrics';
  return location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
};

const isDashboardSectionActive = (location, items) => items.some((item) => (
  location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
));

const SideNav = ({ open, mobileOpen, onMobileClose, onHuddlesClick }) => {
  const { user } = useAuth();
  const { isFeatureEnabled } = useFeatureAccess();
  const navigate = useNavigate();
  const location = useLocation();
  const mobile = useMediaQuery((theme) => theme.breakpoints.down('md'));
  const [dashOpen, setDashOpen] = useState(true);
  const width = open ? 240 : 64;
  const visibleDashboardItems = dashboardItems.filter((item) => !item.featureKey || isFeatureEnabled(item.featureKey));
  const visibleSections = navSections
    .map((section) => section.filter((item) => !item.featureKey || isFeatureEnabled(item.featureKey)))
    .filter((section) => section.length);
  const dashboardActive = isDashboardSectionActive(location, visibleDashboardItems);

  const content = (
    <Box component={motion.div} animate={{ width: mobile ? 240 : width }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} sx={{ width, height: '100%', color: 'common.white', overflowX: 'hidden' }}>
      <Toolbar />
      <List sx={{ px: 1, pb: 12 }}>
        {visibleDashboardItems.length > 0 && (
          <Box>
            <ListItemButton
              onClick={() => setDashOpen((value) => !value)}
              sx={{
                minHeight: 48,
                borderRadius: 1,
                borderLeft: dashboardActive ? '3px solid #5eb8a8' : '3px solid transparent',
                bgcolor: dashboardActive ? 'rgba(94,184,168,0.18)' : 'transparent',
                color: dashboardActive ? 'secondary.main' : 'common.white',
              }}
            >
              <ListItemIcon sx={{ color: 'inherit', minWidth: 42 }}><DashboardOutlinedIcon /></ListItemIcon>
              <ListItemText primary="Dashboards" primaryTypographyProps={{ fontWeight: 600 }} sx={{ opacity: open || mobile ? 1 : 0 }} />
              {(open || mobile) && <ExpandMoreIcon sx={{ transform: dashOpen ? 'rotate(180deg)' : 'none' }} />}
            </ListItemButton>
            <Collapse in={dashOpen && (open || mobile)} timeout="auto">
              <List dense sx={{ pl: 4, pr: 0.5 }}>
                {visibleDashboardItems.map(({ label, path }) => {
                  const selected = location.pathname === path || location.pathname.startsWith(`${path}/`);

                  return (
                    <ListItemButton
                      key={path}
                      onClick={() => {
                        navigate(path);
                        if (mobile) onMobileClose();
                      }}
                      selected={selected}
                      sx={{
                        borderRadius: 1,
                        color: selected ? '#ffffff' : 'rgba(255,255,255,0.86)',
                        minHeight: 38,
                        '&:hover': {
                          bgcolor: 'rgba(255,255,255,0.1)',
                          color: '#ffffff',
                        },
                        '&.Mui-selected': {
                          bgcolor: 'rgba(94,184,168,0.24)',
                          color: '#ffffff',
                        },
                        '&.Mui-selected:hover': {
                          bgcolor: 'rgba(94,184,168,0.32)',
                        },
                      }}
                    >
                      <ListItemText
                        primary={label}
                        primaryTypographyProps={{
                          fontWeight: selected ? 700 : 500,
                          sx: { color: 'inherit' },
                        }}
                      />
                    </ListItemButton>
                  );
                })}
              </List>
            </Collapse>
          </Box>
        )}
        {visibleSections.map((section, sectionIndex) => (
          <Box key={section.map((item) => item.label).join('-')}>
            {(sectionIndex > 0 || visibleDashboardItems.length > 0) && <SectionSeparator />}
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
