import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import MenuIcon from '@mui/icons-material/Menu';
import { AppBar, Avatar, Box, Button, IconButton, Menu, MenuItem, TextField, Toolbar, Tooltip, Typography } from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

const navMenus = {
  Strategy: ['Annual Initiatives', 'Company Dashboard', 'Priority Map'],
  Culture: ['Huddles', 'Stucks', 'Team Health'],
  Reports: ['Data Table', 'Executive Summary', 'Exports'],
  Administration: ['Users', 'Teams', 'Permissions'],
};

const TopBar = ({ onMenuClick }) => {
  const { signInByName, user } = useAuth();
  const [anchor, setAnchor] = useState(null);
  const [demoName, setDemoName] = useState('');
  const [loginError, setLoginError] = useState('');
  const [menu, setMenu] = useState('');

  const openMenu = (event, label) => {
    setAnchor(event.currentTarget);
    setMenu(label);
  };

  const handleDemoLogin = (event) => {
    event.preventDefault();
    const match = signInByName(demoName);

    if (!match) {
      setLoginError('Try Dana, Sam, Kim, Jaime, Michele, Meg, or Michael');
      return;
    }

    setLoginError('');
    setDemoName('');
  };

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, bgcolor: 'background.paper', color: 'text.primary', boxShadow: 1 }}>
      <Toolbar sx={{ minHeight: 64, gap: 1.5 }}>
        <IconButton aria-label="Toggle navigation menu" onClick={onMenuClick} color="primary"><MenuIcon /></IconButton>
        <Typography variant="h3" color="primary" sx={{ mr: 2, whiteSpace: 'nowrap' }}>HDC Compass</Typography>
        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 0.5, flex: 1 }}>
          {Object.keys(navMenus).map((label) => (
            <Button key={label} color="primary" endIcon={<ArrowDropDownIcon />} onClick={(event) => openMenu(event, label)}>
              {label}
            </Button>
          ))}
        </Box>
        <IconButton aria-label="Open quick add menu" color="primary"><AddCircleOutlineIcon /></IconButton>
        <Box component="form" onSubmit={handleDemoLogin} sx={{ display: { xs: 'none', lg: 'flex' }, alignItems: 'center', gap: 0.75 }}>
          <TextField
            error={Boolean(loginError)}
            label="Demo Login"
            onChange={(event) => {
              setDemoName(event.target.value);
              if (loginError) setLoginError('');
            }}
            placeholder={loginError || 'sam'}
            size="small"
            value={demoName}
            sx={{ width: 190 }}
          />
          <Button type="submit" variant="outlined" size="small">Enter</Button>
        </Box>
        <Tooltip title={user.name}>
          <Avatar aria-label={user.name} sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: '0.8rem', fontWeight: 700 }}>{user.initials}</Avatar>
        </Tooltip>
        <Typography variant="caption" sx={{ display: { xs: 'none', sm: 'block' } }}>{user.organization}</Typography>
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
