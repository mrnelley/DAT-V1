import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import MenuIcon from '@mui/icons-material/Menu';
import { AppBar, Avatar, Box, Button, FormControl, IconButton, InputLabel, Menu, MenuItem, Select, Stack, Toolbar, Tooltip, Typography } from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useActionFeedback } from '../../context/ActionFeedbackContext';
import { useAuth } from '../../hooks/useAuth';
import { brandAssets } from '../../theme/brandAssets';

const navMenus = {
  Strategy: ['Annual Initiatives', 'Company Dashboard', 'Priority Map'],
  Culture: ['Huddles', 'Stucks', 'Team Health'],
  Reports: ['Data Table', 'Executive Summary', 'Exports'],
  Administration: ['Users', 'Teams', 'Permissions'],
};

const TopBar = ({ onMenuClick }) => {
  const { demoUsers, setUserId, signOut, user, userId } = useAuth();
  const navigate = useNavigate();
  const { unavailable } = useActionFeedback();
  const [anchor, setAnchor] = useState(null);
  const [menu, setMenu] = useState('');

  const routeByMenuItem = {
    'Annual Initiatives': '/initiatives',
    'Company Dashboard': '/dashboard/company',
    'Priority Map': '/priorities',
    Huddles: '/huddles',
    Stucks: '/stucks',
    'Data Table': '/metrics/table',
    Users: '/admin',
    Teams: '/admin',
    Permissions: '/admin',
  };

  const openMenu = (event, label) => {
    setAnchor(event.currentTarget);
    setMenu(label);
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        bgcolor: 'background.paper',
        color: 'text.primary',
        boxShadow: 1,
        overflow: 'hidden',
        '&::after': {
          content: '""',
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 3,
          opacity: 0.72,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='240' height='12' viewBox='0 0 240 12' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 6 C 24 1, 36 11, 60 6 S 96 1, 120 6 S 156 11, 180 6 S 216 1, 240 6' fill='none' stroke='%235eb8a8' stroke-width='2.2' stroke-linecap='round'/%3E%3Cpath d='M0 6 C 18 4, 42 8, 60 6 S 102 4, 120 6 S 162 8, 180 6 S 222 4, 240 6' fill='none' stroke='%235eb8a8' stroke-width='1' stroke-opacity='.48'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat-x',
          backgroundSize: '240px 12px',
          animation: 'pulseWaveDrift 18s linear infinite',
        },
      }}
    >
      <Toolbar sx={{ minHeight: 64, gap: 1.5 }}>
        <IconButton aria-label="Toggle navigation menu" onClick={onMenuClick} color="primary"><MenuIcon /></IconButton>
        <Stack direction="row" alignItems="center" gap={1} sx={{ mr: 2, minWidth: 0 }}>
          <Box
            component="img"
            src={brandAssets.logoIcon}
            alt=""
            aria-hidden="true"
            sx={{ width: 32, height: 32, objectFit: 'contain', flexShrink: 0 }}
          />
          <Typography variant="h3" color="primary" sx={{ whiteSpace: 'nowrap' }}>HDC Pulse</Typography>
        </Stack>
        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 0.5, flex: 1 }}>
          {Object.keys(navMenus).map((label) => (
            <Button key={label} color="primary" endIcon={<ArrowDropDownIcon />} onClick={(event) => openMenu(event, label)}>
              {label}
            </Button>
          ))}
        </Box>
        <IconButton aria-label="Open quick add menu" color="primary" onClick={() => unavailable('quick add is not connected to a create workflow yet.')}><AddCircleOutlineIcon /></IconButton>
        <FormControl size="small" sx={{ minWidth: 230, display: { xs: 'none', lg: 'block' } }}>
          <InputLabel>Demo User</InputLabel>
          <Select label="Demo User" value={userId} onChange={(event) => setUserId(event.target.value)}>
            {demoUsers.map((demoUser) => (
              <MenuItem key={demoUser.id} value={demoUser.id}>{demoUser.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Tooltip title={user.name}>
          <Avatar aria-label={user.name} sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: '0.8rem', fontWeight: 700 }}>{user.initials}</Avatar>
        </Tooltip>
        <Typography variant="caption" sx={{ display: { xs: 'none', sm: 'block' } }}>{user.organization}</Typography>
        <IconButton aria-label="Sign out" color="primary" onClick={signOut}>
          <LogoutOutlinedIcon />
        </IconButton>
        <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
          <AnimatePresence>
            <Box component={motion.div} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              {(navMenus[menu] || []).map((item) => (
                <MenuItem
                  key={item}
                  onClick={() => {
                    setAnchor(null);
                    if (routeByMenuItem[item]) {
                      navigate(routeByMenuItem[item]);
                      return;
                    }
                    unavailable(`${item.toLowerCase()} is not built for this MVP view yet.`);
                  }}
                >
                  {item}
                </MenuItem>
              ))}
            </Box>
          </AnimatePresence>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default TopBar;
