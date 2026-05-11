import { createTheme } from '@mui/material/styles';

const baseShadows = Array(25).fill('none');
baseShadows[1] = '0px 2px 8px rgba(7, 44, 94, 0.07)';
baseShadows[2] = '0px 4px 16px rgba(7, 44, 94, 0.1)';
baseShadows[3] = '0px 8px 24px rgba(7, 44, 94, 0.15)';

const theme = createTheme({
  palette: {
    primary: { main: '#072c5e', light: '#1a4a80', dark: '#041e42', contrastText: '#ffffff' },
    secondary: { main: '#5eb8a8', light: '#88cfc2', dark: '#3d9585', contrastText: '#1a1a2e' },
    error: { main: '#b03a34', light: '#e47d78', dark: '#84241f', contrastText: '#ffffff' },
    warning: { main: '#f1ac49', light: '#f5c478', dark: '#c98a2a' },
    success: { main: '#006e5c', light: '#339980', dark: '#004d40' },
    background: { default: '#f5f7fa', paper: '#ffffff', accent: '#efdc9c' },
    text: { primary: '#1a1a2e', secondary: '#5a6475' },
    divider: '#e0e4ea',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontSize: '2rem', fontWeight: 700, color: '#072c5e', letterSpacing: 0 },
    h2: { fontSize: '1.5rem', fontWeight: 600, color: '#072c5e', letterSpacing: 0 },
    h3: { fontSize: '1.25rem', fontWeight: 600, letterSpacing: 0 },
    h4: { fontSize: '1rem', fontWeight: 600, letterSpacing: 0 },
    body1: { fontSize: '0.875rem', letterSpacing: 0 },
    body2: { fontSize: '0.8rem', color: '#5a6475', letterSpacing: 0 },
    caption: { fontSize: '0.75rem', color: '#5a6475', letterSpacing: 0 },
  },
  shape: { borderRadius: 10 },
  shadows: baseShadows,
  components: {
    MuiCard: { styleOverrides: { root: { borderRadius: 12, boxShadow: '0px 2px 8px rgba(7,44,94,0.08)' } } },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8, textTransform: 'none', fontWeight: 600, minHeight: 44 },
        containedPrimary: { background: '#072c5e' },
        containedSecondary: { background: '#5eb8a8' },
      },
    },
    MuiChip: { styleOverrides: { root: { borderRadius: 6, fontWeight: 600, fontSize: '0.72rem' } } },
    MuiDrawer: { styleOverrides: { paper: { borderRight: 'none', background: '#072c5e' } } },
    MuiTab: { styleOverrides: { root: { textTransform: 'none', fontWeight: 500, minWidth: 80 } } },
    MuiTableHead: { styleOverrides: { root: { background: '#f0f4f8' } } },
    MuiLinearProgress: { styleOverrides: { root: { borderRadius: 4, height: 8 } } },
    MuiIconButton: { styleOverrides: { root: { minWidth: 44, minHeight: 44 } } },
  },
});

export default theme;
