import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import ChecklistOutlinedIcon from '@mui/icons-material/ChecklistOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import LoginOutlinedIcon from '@mui/icons-material/LoginOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import {
  Alert,
  Box,
  Button,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { brandAssets } from '../../theme/brandAssets';

const LoginPage = () => {
  const { configurationError, isAuthenticated, isLoading, primaryDashboardPath, signIn } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      navigate(primaryDashboardPath, { replace: true });
    }
  }, [isAuthenticated, navigate, primaryDashboardPath]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    const result = await signIn({ password, username });

    if (result.error) {
      setError(result.error.message || 'The username or password is incorrect.');
      return;
    }
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
          <Typography variant="body2" sx={{ mt: 0.75, mb: 2.5 }}>
            Use your HDC Compass account to continue.
          </Typography>

          <Box component="form" noValidate onSubmit={handleSubmit}>
            <Stack gap={2}>
              <TextField
                autoComplete="username"
                autoFocus
                fullWidth
                label="Username"
                onChange={(event) => {
                  setUsername(event.target.value);
                  setError('');
                }}
                value={username}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonOutlineOutlinedIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                autoComplete="current-password"
                fullWidth
                label="Password"
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError('');
                }}
                type={showPassword ? 'text' : 'password'}
                value={password}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        edge="end"
                        onClick={() => setShowPassword((current) => !current)}
                      >
                        {showPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              {configurationError && <Alert severity="error">{configurationError}</Alert>}
              {error && <Alert severity="error">{error}</Alert>}
              <Button
                disabled={isLoading || Boolean(configurationError) || !username.trim() || !password}
                fullWidth
                size="large"
                startIcon={<LoginOutlinedIcon />}
                type="submit"
                variant="contained"
              >
                Sign in
              </Button>
            </Stack>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default LoginPage;
