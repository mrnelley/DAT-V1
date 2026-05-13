import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import MenuIcon from '@mui/icons-material/Menu';
import { AppBar, Avatar, Box, Button, FormControl, IconButton, InputLabel, Menu, MenuItem, Select, Stack, Toolbar, Tooltip, Typography } from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
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
  const [anchor, setAnchor] = useState(null);
  const [menu, setMenu] = useState('');

  const openMenu = (event, label) => {
    setAnchor(event.currentTarget);
    setMenu(label);
  };

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, bgcolor: 'background.paper', color: 'text.primary', boxShadow: 1 }}>
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
          {Object.keys(navMenus).map((label) => (
            <Button key={label} color="primary" endIcon={<ArrowDropDownIcon />} onClick={(event) => openMenu(event, label)}>
              {label}
            </Button>
          ))}
        </Box>
        <IconButton aria-label="Open quick add menu" color="primary"><AddCircleOutlineIcon /></IconButton>
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
              {(navMenus[menu] || []).map((item) => <MenuItem key={item} onClick={() => setAnchor(null)}>{item}</MenuItem>)}
            </Box>
          </AnimatePresence>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default TopBar;
