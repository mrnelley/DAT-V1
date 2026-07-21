import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined';
import AutoStoriesOutlinedIcon from '@mui/icons-material/AutoStoriesOutlined';
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined';
import PlayArrowOutlinedIcon from '@mui/icons-material/PlayArrowOutlined';
import { Box, Button, Chip, Dialog, DialogContent, DialogTitle, List, ListItemButton, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useGuidedPractice } from '../../context/GuidedPracticeContext';
import { getPracticeProgram } from '../../data/guidedPracticePrograms';
import { useAuth } from '../../hooks/useAuth';

const modeSwitch = {
  elt: {
    label: 'Open OLT Practice Mode',
    path: '/practice/olt',
  },
  olt: {
    label: 'Open ELT Practice Mode',
    path: '/practice/elt',
  },
};

const RolePracticePage = ({ programId }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { startPractice } = useGuidedPractice();
  const program = getPracticeProgram(programId);
  const [pickerOpen, setPickerOpen] = useState(true);
  const alternateMode = modeSwitch[program.id] || modeSwitch.olt;

  useEffect(() => {
    setPickerOpen(true);
  }, [program.id]);

  const launchTask = (taskId) => {
    const firstStep = startPractice(program.id, taskId);
    if (firstStep) navigate(firstStep.route);
  };

  return (
    <Box
      sx={{
        bgcolor: '#202441',
        color: '#ffffff',
        minHeight: '100vh',
        overflow: 'hidden',
        position: 'relative',
        '&::before': {
          background: 'linear-gradient(90deg, rgba(94,184,168,0.4), rgba(239,220,156,0.34), rgba(255,255,255,0))',
          content: '""',
          height: 6,
          left: 0,
          position: 'absolute',
          right: 0,
          top: 0,
        },
      }}
    >
      <Box sx={{ display: 'grid', gridTemplateRows: 'auto 1fr', minHeight: '100vh', position: 'relative' }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          gap={1.5}
          sx={{
            borderBottom: '1px solid rgba(255,255,255,0.14)',
            px: { xs: 2, md: 3 },
            py: 1.5,
          }}
        >
          <Stack direction="row" gap={1.25} alignItems="center">
            <AutoStoriesOutlinedIcon sx={{ color: 'background.accent' }} />
            <Box>
              <Typography variant="subtitle2" sx={{ color: '#ffffff' }}>Compass Practice</Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.62)' }}>
                {user.name} - {user.workingGroup}
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" gap={1} flexWrap="wrap">
            <Button component={RouterLink} to="/learn" startIcon={<ArrowBackOutlinedIcon />} sx={{ color: '#ffffff' }}>
              Learn
            </Button>
            <Button
              component={RouterLink}
              to={alternateMode.path}
              sx={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.36)' }}
              variant="outlined"
            >
              {alternateMode.label}
            </Button>
            <Button component={RouterLink} to="/dashboard/me" endIcon={<OpenInNewOutlinedIcon />} variant="contained">
              Open Compass
            </Button>
          </Stack>
        </Stack>

        <Box sx={{ alignItems: 'center', display: 'grid', px: { xs: 2, md: 4 }, py: { xs: 4, md: 6 } }}>
          <Box sx={{ maxWidth: 1120, mx: 'auto', width: '100%' }}>
            <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap" sx={{ mb: 1.5 }}>
              <Chip label="Live spotlight practice" sx={{ bgcolor: 'rgba(94,184,168,0.18)', color: '#ffffff' }} />
              <Chip label={`${program.tasks.length} workflows`} sx={{ bgcolor: 'rgba(239,220,156,0.18)', color: '#ffffff' }} />
            </Stack>
            <Typography variant="h1" sx={{ color: '#ffffff', fontSize: { xs: '2.35rem', md: '3.5rem' }, maxWidth: 860 }}>
              {program.label}
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.74)', fontSize: '1.05rem', lineHeight: 1.65, maxWidth: 740, mt: 1.25 }}>
              {program.description}
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.25} sx={{ mt: 2.5 }}>
              <Button
                onClick={() => setPickerOpen(true)}
                startIcon={<PlayArrowOutlinedIcon />}
                variant="contained"
              >
                Choose Practice Task
              </Button>
              <Button
                component={RouterLink}
                to="/learn"
                sx={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.36)' }}
                variant="outlined"
              >
                Return To Learn
              </Button>
            </Stack>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, minmax(0, 1fr))' }, gap: 1.25, mt: 4 }}>
              {program.tasks.slice(0, 6).map((task) => (
                <Box
                  key={task.id}
                  sx={{
                    border: '1px solid rgba(255,255,255,0.14)',
                    borderLeft: '4px solid',
                    borderLeftColor: 'background.accent',
                    p: 1.4,
                  }}
                >
                  <Typography variant="subtitle2" sx={{ color: '#ffffff' }}>{task.label}</Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.66)', mt: 0.45 }}>{task.description}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Box>

      <Dialog
        aria-labelledby="practice-task-picker-title"
        fullWidth
        maxWidth="md"
        onClose={() => setPickerOpen(false)}
        open={pickerOpen}
      >
        <DialogTitle id="practice-task-picker-title">
          <Stack direction="row" gap={1} alignItems="center">
            <AccountTreeOutlinedIcon color="primary" />
            <Box>
              <Typography variant="h2">{program.label}</Typography>
              <Typography variant="body2" color="text.secondary">
                Choose the workflow you want to practice. The next screen will open the live Compass surface with a spotlight guide.
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <List disablePadding sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
            {program.tasks.map((task) => (
              <ListItemButton
                key={task.id}
                onClick={() => launchTask(task.id)}
                sx={{
                  alignItems: 'flex-start',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  gap: 1.5,
                  py: 1.5,
                }}
              >
                <PlayArrowOutlinedIcon color="primary" sx={{ mt: 0.25 }} />
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="h3">{task.label}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35 }}>
                    {task.description}
                  </Typography>
                </Box>
                <ArrowForwardOutlinedIcon color="primary" />
              </ListItemButton>
            ))}
          </List>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default RolePracticePage;
