import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import RouteOutlinedIcon from '@mui/icons-material/RouteOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import { Box, Button, LinearProgress, Stack, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFeatureAccess } from '../../context/FeatureAccessContext';
import { useAuth } from '../../hooks/useAuth';

const completionKey = (userId) => `hdc_compass_guided_practice_${userId}`;

const sharedFinalStep = {
  body: 'Create one weekly priority tied to an Enterprise Priority or Department Workplan. This is the weekly accountability move both ELT and OLT need to know.',
  icon: TaskAltOutlinedIcon,
  path: '/weekly-tracker?new=priority',
  spotlight: 'Weekly Tracker',
  title: 'Log A Weekly Priority',
};

const roleStepMap = {
  ELT: [
    {
      body: 'Open the huddle scheduler and create the leadership conversation where Enterprise Priorities will be determined.',
      icon: GroupsOutlinedIcon,
      path: '/huddles/new',
      spotlight: 'Schedule Huddle',
      title: 'Schedule The ELT Priority Huddle',
    },
    {
      body: 'Move from the huddle decision into the Enterprise Priority register. This is where the strategic commitment becomes trackable.',
      icon: InsightsOutlinedIcon,
      path: '/priorities?new=1',
      spotlight: 'Enterprise Priorities',
      title: 'Create The Enterprise Priority',
    },
    sharedFinalStep,
  ],
  OLT: [
    {
      body: 'Start by reviewing the Enterprise Priorities approved by ELT so departmental planning begins from the same source of truth.',
      icon: InsightsOutlinedIcon,
      path: '/priorities',
      spotlight: 'Enterprise Priorities',
      title: 'Review ELT Priorities',
    },
    {
      body: 'Create the Department Workplan that translates enterprise direction into department objectives, owners, KPIs, and targets.',
      icon: RouteOutlinedIcon,
      path: '/workplans?new=1',
      spotlight: 'Department Workplans',
      title: 'Build The Department Workplan',
    },
    sharedFinalStep,
  ],
  Administration: [
    {
      body: 'Start in Feature Rollout and confirm the right surfaces are enabled for each user before adoption expands.',
      icon: RouteOutlinedIcon,
      path: '/admin/features',
      spotlight: 'Feature Rollout',
      title: 'Set Component Access',
    },
    {
      body: 'Open Executive Pulse and confirm the board-reporting template before leaders begin entering scorecard data.',
      icon: InsightsOutlinedIcon,
      path: '/dashboard/executive-pulse',
      spotlight: 'Executive Pulse',
      title: 'Check Board Reporting',
    },
    sharedFinalStep,
  ],
  TeamMember: [
    {
      body: 'Start from My Dashboard and review the work surfaces enabled for your role.',
      icon: RouteOutlinedIcon,
      path: '/dashboard/me',
      spotlight: 'My Dashboard',
      title: 'Find Your Lane',
    },
    sharedFinalStep,
  ],
};

const getStepsForUser = (user) => {
  if (user.role === 'Administrator') return roleStepMap.Administration;
  if (user.workingGroup === 'ELT') return roleStepMap.ELT;
  if (user.workingGroup === 'OLT') return roleStepMap.OLT;
  return roleStepMap.TeamMember;
};

const FirstRunPracticeOverlay = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isFeatureEnabled } = useFeatureAccess();
  const steps = useMemo(() => getStepsForUser(user), [user]);
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
  const StepIcon = step.icon;
  const progress = ((stepIndex + 1) / steps.length) * 100;
  const finalStep = stepIndex === steps.length - 1;

  const takeRequiredAction = () => {
    navigate(step.path);

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
        bgcolor: 'rgba(4, 30, 66, 0.78)',
        display: 'grid',
        placeItems: 'center',
        p: 2,
      }}
    >
      <Box
        sx={{
          width: 'min(680px, 100%)',
          bgcolor: 'background.paper',
          borderRadius: 1,
          boxShadow: 4,
          overflow: 'hidden',
        }}
      >
        <Box sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', p: 2 }}>
          <Stack direction="row" gap={1} alignItems="center">
            <CheckCircleOutlinedIcon />
            <Box>
              <Typography id="guided-practice-title" variant="h3" color="inherit">Required First Setup</Typography>
              <Typography variant="caption" color="inherit">{user.workingGroup} setup path for {user.name}</Typography>
            </Box>
          </Stack>
        </Box>
        <Box sx={{ p: 2 }}>
          <Box
            sx={{
              border: '2px solid',
              borderColor: 'secondary.main',
              borderRadius: 1,
              bgcolor: 'rgba(239, 220, 156, 0.14)',
              p: 1.5,
              mb: 1.5,
            }}
          >
            <Stack direction="row" gap={1.25} alignItems="center">
              <StepIcon color="primary" />
              <Box>
                <Typography variant="caption" color="primary" fontWeight={800} textTransform="uppercase">Spotlight: {step.spotlight}</Typography>
                <Typography variant="h2">{step.title}</Typography>
              </Box>
            </Stack>
          </Box>
          <Typography variant="body1">{step.body}</Typography>
          <LinearProgress value={progress} variant="determinate" sx={{ mt: 2 }} />
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} gap={1.5} sx={{ mt: 2 }}>
            <Typography variant="caption">Required click {stepIndex + 1} of {steps.length}</Typography>
            <Button variant="contained" endIcon={<ArrowForwardOutlinedIcon />} onClick={takeRequiredAction}>
              {finalStep ? 'Open And Finish Setup' : `Open ${step.spotlight}`}
            </Button>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
};

export default FirstRunPracticeOverlay;
