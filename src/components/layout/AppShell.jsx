import { Box, Toolbar } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import HuddleSidePopout from '../huddles/HuddleSidePopout';
import FirstRunPracticeOverlay from '../onboarding/FirstRunPracticeOverlay';
import SideNav from './SideNav';
import TopBar from './TopBar';

const huddlePopoutIdleMs = 7000;

const AppShell = ({ children }) => {
  const [navOpen, setNavOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [huddlesOpen, setHuddlesOpen] = useState(false);
  const huddleIdleTimer = useRef(null);
  const drawerWidth = navOpen ? 240 : 64;

  const closeHuddles = useCallback(() => {
    setHuddlesOpen(false);
  }, []);

  const resetHuddleIdleTimer = useCallback(() => {
    window.clearTimeout(huddleIdleTimer.current);
    huddleIdleTimer.current = window.setTimeout(closeHuddles, huddlePopoutIdleMs);
  }, [closeHuddles]);

  useEffect(() => {
    if (huddlesOpen) {
      resetHuddleIdleTimer();
      return () => window.clearTimeout(huddleIdleTimer.current);
    }

    window.clearTimeout(huddleIdleTimer.current);
    return undefined;
  }, [huddlesOpen, resetHuddleIdleTimer]);

  useEffect(() => () => window.clearTimeout(huddleIdleTimer.current), []);

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: 'background.default' }}>
      <TopBar onMenuClick={() => {
        setNavOpen((value) => !value);
        setMobileOpen(true);
      }} />
      <SideNav open={navOpen} mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} onHuddlesClick={() => setHuddlesOpen((value) => !value)} />
      <HuddleSidePopout open={huddlesOpen} navOpen={navOpen} onClose={closeHuddles} onInteract={resetHuddleIdleTimer} />
      <Box component="main" sx={{ flex: 1, ml: { md: huddlesOpen ? '260px' : 0 }, minWidth: 0, height: '100vh', overflow: 'auto', transition: 'margin-left 180ms ease' }}>
        <Toolbar />
        <Box sx={{ p: { xs: 2, md: 3 } }}>{children}</Box>
      </Box>
      <FirstRunPracticeOverlay />
    </Box>
  );
};

export default AppShell;
