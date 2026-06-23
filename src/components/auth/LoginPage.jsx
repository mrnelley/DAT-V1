import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import ChecklistOutlinedIcon from '@mui/icons-material/ChecklistOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import MicrosoftIcon from '@mui/icons-material/Microsoft';
import { Box, Button, Chip, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { brandAssets } from '../../theme/brandAssets';
import { getPrimaryDashboardPath } from '../../utils/dashboardRouting';

const demoNames = ['Dana', 'Nina', 'Sam', 'Shar', 'Ann', 'Kim', 'Chris', 'Jaime', 'Angie', 'Michele', 'Meg', 'Tammie', 'Michael'];

const LoginPage = () => {
  const { isAuthenticated, primaryDashboardPath, signInByName } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      navigate(primaryDashboardPath, { replace: true });
    }
  }, [isAuthenticated, navigate, primaryDashboardPath]);

  const signInAs = (value) => {
    const match = signInByName(value);

    if (!match) {
      setError(`Try one of these demo dashboards: ${demoNames.join(', ')}.`);
      return;
    }

    setError('');
    navigate(getPrimaryDashboardPath(match));
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        color: 'text.primary',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', lg: '1.08fr 0.92fr' },
      }}
    >
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'common.white',
          minHeight: { xs: 320, lg: '100vh' },
          p: { xs: 3, md: 6 },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.5} alignItems={{ xs: 'flex-start', sm: 'center' }} sx={{ mb: { xs: 5, md: 8 } }}>
            <Box
              component="img"
              src={brandAssets.logoHorizontalReverse}
              alt="HDC MidAtlantic"
              sx={{ width: { xs: 210, md: 270 }, height: 'auto', display: 'block' }}
            />
            <Box>
              <Typography variant="h3" color="inherit">HDC Compass</Typography>
              <Typography variant="caption" color="secondary.light">Accountability without extra drag</Typography>
            </Box>
          </Stack>

          <Typography
            component="h1"
            sx={{
              fontSize: { xs: '2.4rem', md: '4rem' },
              fontWeight: 800,
              lineHeight: 1,
              maxWidth: 760,
              letterSpacing: 0,
            }}
          >
            The operating rhythm for HDC priorities, workplans, and commitments.
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.84)', maxWidth: 620, mt: 2, fontSize: '1rem' }}>
            Sign in to see the dashboard built around your lane of work.
          </Typography>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(4, 1fr)' }, gap: 1.25, mt: 4 }}>
          {[
            [BusinessOutlinedIcon, 'Portfolio'],
            [ChecklistOutlinedIcon, 'Workplans'],
            [CalendarMonthOutlinedIcon, 'Touchpoints'],
            [GroupsOutlinedIcon, 'Huddles'],
          ].map(([Icon, label]) => (
            <Box key={label} sx={{ border: '1px solid rgba(255,255,255,0.22)', borderRadius: 1, p: 1.25, bgcolor: 'rgba(255,255,255,0.08)' }}>
              <Icon sx={{ color: 'secondary.light', mb: 1 }} />
              <Typography variant="body2" color="inherit" fontWeight={700}>{label}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      <Box sx={{ minHeight: { xs: 'auto', lg: '100vh' }, display: 'grid', placeItems: 'center', p: { xs: 2, md: 5 } }}>
        <Box sx={{ width: '100%', maxWidth: 470, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: { xs: 2, md: 3 } }}>
          <Box
            component="img"
            src={brandAssets.logoVerticalFullColor}
            alt="HDC MidAtlantic"
            sx={{ width: 118, height: 'auto', display: 'block', mb: 2 }}
          />
          <Typography variant="h2">Sign in</Typography>
          <Typography variant="body2" sx={{ mt: 0.75, mb: 2 }}>
            Choose a dashboard for the demo. Microsoft sign-in will use the same landing page once OAuth is wired.
          </Typography>

          <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
            Choose a demo dashboard:
          </Typography>
          <Stack direction="row" gap={1} flexWrap="wrap">
            {demoNames.map((demoName) => (
              <Chip
                key={demoName}
                label={demoName}
                onClick={() => signInAs(demoName)}
                onDelete={() => signInAs(demoName)}
                deleteIcon={<ArrowForwardIcon />}
                color="primary"
                variant="outlined"
              />
            ))}
          </Stack>
          {error && <Typography variant="body2" color="error" sx={{ mt: 1 }}>{error}</Typography>}

          <Button variant="outlined" startIcon={<MicrosoftIcon />} disabled fullWidth sx={{ mt: 2 }}>
            Sign in with Microsoft
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default LoginPage;
