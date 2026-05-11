import { Box, Toolbar } from '@mui/material';
import { useState } from 'react';
import HuddleSidePopout from '../huddles/HuddleSidePopout';
import SideNav from './SideNav';
import TopBar from './TopBar';

const AppShell = ({ children }) => {
  const [navOpen, setNavOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [huddlesOpen, setHuddlesOpen] = useState(false);
  const drawerWidth = navOpen ? 240 : 64;

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: 'background.default' }}>
      <TopBar onMenuClick={() => {
        setNavOpen((value) => !value);
        setMobileOpen(true);
      }} />
      <SideNav open={navOpen} mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} onHuddlesClick={() => setHuddlesOpen((value) => !value)} />
      <HuddleSidePopout open={huddlesOpen} navOpen={navOpen} />
      <Box component="main" sx={{ flex: 1, ml: { md: huddlesOpen ? '260px' : 0 }, minWidth: 0, height: '100vh', overflow: 'auto', transition: 'margin-left 180ms ease' }}>
        <Toolbar />
        <Box sx={{ p: { xs: 2, md: 3 } }}>{children}</Box>
      </Box>
    </Box>
  );
};

export default AppShell;
