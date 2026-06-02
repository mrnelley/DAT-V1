import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import SportsEsportsOutlinedIcon from '@mui/icons-material/SportsEsportsOutlined';
import { Box, Button, LinearProgress, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useFeatureAccess } from '../../context/FeatureAccessContext';
import { useAuth } from '../../hooks/useAuth';

const steps = [
  {
    body: 'Start with the company signal board. Green, yellow, and red priority health is the first read before anyone digs into details.',
    title: 'Read The Signal',
  },
  {
    body: 'Use the navigation lanes only for the tools enabled for your role. Administrators can roll features out one user at a time.',
    title: 'Know Your Lane',
  },
  {
    body: 'When action is needed, create the work item from the enabled workflow instead of carrying it in side conversations.',
    title: 'Practice The Move',
  },
];

const completionKey = (userId) => `hdc_compass_guided_practice_${userId}`;

const FirstRunPracticeOverlay = () => {
  const { user } = useAuth();
  const { isFeatureEnabled } = useFeatureAccess();
  const [stepIndex, setStepIndex] = useState(0);
  const [complete, setComplete] = useState(true);
  const enabled = isFeatureEnabled('guidedPractice');

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      setComplete(true);
      return;
    }

    setStepIndex(0);
    setComplete(window.localStorage.getItem(completionKey(user.id)) === 'complete');
  }, [enabled, user.id]);

  if (complete) return null;

  const step = steps[stepIndex];
  const progress = ((stepIndex + 1) / steps.length) * 100;
  const finalStep = stepIndex === steps.length - 1;

  const advance = () => {
    if (!finalStep) {
      setStepIndex((current) => current + 1);
      return;
    }

    window.localStorage.setItem(completionKey(user.id), 'complete');
    setComplete(true);
  };

  return (
    <Box
      role="dialog"
      aria-modal="true"
      aria-labelledby="guided-practice-title"
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: (theme) => theme.zIndex.modal + 10,
        bgcolor: 'rgba(4, 30, 66, 0.74)',
        display: 'grid',
        placeItems: 'center',
        p: 2,
      }}
    >
      <Box
        sx={{
          width: 'min(560px, 100%)',
          bgcolor: 'background.paper',
          borderRadius: 1,
          boxShadow: 3,
          overflow: 'hidden',
        }}
      >
        <Box sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', p: 2 }}>
          <Stack direction="row" gap={1} alignItems="center">
            <SportsEsportsOutlinedIcon />
            <Box>
              <Typography id="guided-practice-title" variant="h3" color="inherit">Compass Practice</Typography>
              <Typography variant="caption" color="inherit">Required first interaction for {user.name}</Typography>
            </Box>
          </Stack>
        </Box>
        <Box sx={{ p: 2 }}>
          <Stack direction="row" gap={1} alignItems="center" sx={{ mb: 1 }}>
            <CheckCircleOutlinedIcon color="secondary" />
            <Typography variant="h2">{step.title}</Typography>
          </Stack>
          <Typography variant="body1">{step.body}</Typography>
          <LinearProgress value={progress} variant="determinate" sx={{ mt: 2 }} />
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
            <Typography variant="caption">Step {stepIndex + 1} of {steps.length}</Typography>
            <Button variant="contained" endIcon={<ArrowForwardOutlinedIcon />} onClick={advance}>
              {finalStep ? 'Complete Practice' : 'Continue'}
            </Button>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
};

export default FirstRunPracticeOverlay;
