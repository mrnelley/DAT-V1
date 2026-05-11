import BarChartIcon from '@mui/icons-material/BarChart';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import GroupsIcon from '@mui/icons-material/Groups';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import SettingsIcon from '@mui/icons-material/Settings';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { Box, Collapse, Drawer, IconButton, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography, useMediaQuery } from '@mui/material';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import UserAvatar from '../shared/UserAvatar';

const navItems = [
  { icon: DashboardOutlinedIcon, label: 'Dashboards', submenu: true },
  { icon: TrendingUpIcon, label: 'Priorities', path: '/priorities' },
  { icon: GroupsIcon, label: 'Huddles', popout: true },
  { icon: CheckCircleOutlineIcon, label: 'Action Items', path: '/action-items' },
  { icon: BarChartIcon, label: 'Metrics', path: '/metrics' },
  { icon: SchoolOutlinedIcon, label: 'Learn', path: '/learn' },
];

const dashboardLinks = [
  ['My Dashboard', '/dashboard/me'],
  ['Company Dashboard', '/dashboard/company'],
  ['Annual Initiatives', '/initiatives'],
  ['Data Table', '/metrics/table'],
];

const SideNav = ({ open, mobileOpen, onMobileClose, onHuddlesClick }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const mobile = useMediaQuery((theme) => theme.breakpoints.down('md'));
  const [dashOpen, setDashOpen] = useState(true);
  const width = open ? 240 : 64;

  const content = (
    <Box component={motion.div} animate={{ width: mobile ? 240 : width }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} sx={{ width, height: '100%', color: 'common.white', overflowX: 'hidden' }}>
      <Toolbar />
      <List sx={{ px: 1 }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.path ? location.pathname.startsWith(item.path) : item.submenu && location.pathname.startsWith('/dashboard');
          return (
            <Box key={item.label}>
              <ListItemButton
                onClick={() => {
                  if (item.submenu) setDashOpen((value) => !value);
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
                {item.submenu && (open || mobile) && <ExpandMoreIcon sx={{ transform: dashOpen ? 'rotate(180deg)' : 'none' }} />}
              </ListItemButton>
              {item.submenu && (
                <Collapse in={dashOpen && (open || mobile)} timeout="auto">
                  <List dense sx={{ pl: 4 }}>
                    {dashboardLinks.map(([label, path]) => (
                      <ListItemButton key={path} onClick={() => navigate(path)} selected={location.pathname === path} sx={{ color: 'common.white', borderRadius: 1 }}>
                        <ListItemText primary={label} />
                      </ListItemButton>
                    ))}
                  </List>
                </Collapse>
              )}
            </Box>
          );
        })}
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
          {(open || mobile) && <IconButton aria-label="Open user settings" sx={{ color: 'common.white' }}><SettingsIcon /></IconButton>}
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
