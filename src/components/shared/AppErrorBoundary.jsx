import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import { Component } from 'react';

class AppErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('HDC Compass render failure', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 2 }}>
        <Stack gap={2} sx={{ width: '100%', maxWidth: 560 }}>
          <Typography variant="h1">This view could not load</Typography>
          <Alert severity="error">
            HDC Compass encountered an unexpected display error. Reload to try again.
          </Alert>
          <Button
            startIcon={<RefreshOutlinedIcon />}
            variant="contained"
            onClick={() => window.location.reload()}
          >
            Reload Compass
          </Button>
        </Stack>
      </Box>
    );
  }
}

export default AppErrorBoundary;

