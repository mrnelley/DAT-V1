import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import { AppBar, Avatar, Badge, Box, Button, FormControl, IconButton, InputLabel, Menu, MenuItem, Select, Stack, Toolbar, Tooltip, Typography } from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationsContext';
import { useAuth } from '../../hooks/useAuth';
import { quickAddItems, topNavMenus } from '../../navigation/topNav';
import { brandAssets } from '../../theme/brandAssets';

const TopBar = ({ onMenuClick }) => {
  const { demoUsers, setUserId, signOut, user, userId } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadCount } = useNotifications();
  const [anchor, setAnchor] = useState(null);
  const [quickAnchor, setQuickAnchor] = useState(null);
  const [menu, setMenu] = useState('');

  const openMenu = (event, label) => {
    setAnchor(event.currentTarget);
    setMenu(label);
  };

  const closeMenus = () => {
    setAnchor(null);
    setQuickAnchor(null);
  };

  const goTo = (path) => {
    closeMenus();
    navigate(path);
  };

  const currentMenu = topNavMenus.find((candidate) => candidate.label === menu);

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
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='360' height='18' viewBox='0 0 360 18' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 9 C 18 8, 27 5, 42 8 S 72 15, 91 10 S 122 -1, 144 7 S 166 21, 188 10 S 211 1, 233 6 S 260 16, 282 8 S 318 3, 360 9' fill='none' stroke='%235eb8a8' stroke-width='2.6' stroke-linecap='round'/%3E%3Cpath d='M0 9 C 30 2, 48 14, 71 9 S 111 3, 134 9 S 164 17, 191 8 S 229 0, 253 9 S 292 15, 319 8 S 345 6, 360 9' fill='none' stroke='%235eb8a8' stroke-width='1.2' stroke-opacity='.46' stroke-linecap='round'/%3E%3Cpath d='M0 9 C 22 11, 39 7, 57 9 S 88 12, 109 8 S 138 5, 158 9 S 190 13, 211 8 S 238 4, 259 9 S 296 13, 319 8 S 342 7, 360 9' fill='none' stroke='%235eb8a8' stroke-width='.85' stroke-opacity='.36' stroke-linecap='round'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat-x',
          backgroundSize: '360px 18px',
          animation: 'pulseWaveDrift 22s linear infinite',
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
          <Typography variant="h3" color="primary" sx={{ whiteSpace: 'nowrap' }}>HDC Compass</Typography>
        </Stack>
        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 0.5, flex: 1 }}>
          {topNavMenus.map((navMenu) => {
            const active = navMenu.items.some((item) => location.pathname === item.path || location.pathname.startsWith(`${item.path}/`));

            return (
              <Button
                key={navMenu.label}
                color="primary"
                endIcon={<ArrowDropDownIcon />}
                onClick={(event) => openMenu(event, navMenu.label)}
                variant={active ? 'outlined' : 'text'}
              >
                {navMenu.label}
              </Button>
            );
          })}
        </Box>
        <IconButton aria-label="Open quick add menu" color="primary" onClick={(event) => setQuickAnchor(event.currentTarget)}><AddCircleOutlineIcon /></IconButton>
        <Tooltip title="Notifications">
          <IconButton aria-label="Open notifications inbox" color="primary" onClick={() => navigate('/notifications')}>
            <Badge color="error" badgeContent={unreadCount} max={99}>
              <NotificationsNoneOutlinedIcon />
            </Badge>
          </IconButton>
        </Tooltip>
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
        <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={closeMenus}>
          <AnimatePresence>
            <Box component={motion.div} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              {(currentMenu?.items || []).map((item) => (
                <MenuItem
                  key={item.path}
                  onClick={() => goTo(item.path)}
                >
                  {item.label}
                </MenuItem>
              ))}
            </Box>
          </AnimatePresence>
        </Menu>
        <Menu anchorEl={quickAnchor} open={Boolean(quickAnchor)} onClose={closeMenus}>
          <AnimatePresence>
            <Box component={motion.div} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              {quickAddItems.map((item) => (
                <MenuItem key={item.path} onClick={() => goTo(item.path)}>
                  New {item.label}
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
