import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined';
import { Box, Button, IconButton, LinearProgress, Stack, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useGuidedPractice } from '../../context/GuidedPracticeContext';

const spotlightPadding = 10;
const cardHeightEstimate = 286;

const splitRoute = (route) => {
  const [pathname, search] = route.split('?');
  return {
    pathname,
    search: search ? `?${search}` : '',
  };
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const getTargetRect = (targetId) => {
  if (typeof document === 'undefined' || !targetId) return null;
  const element = document.querySelector(`[data-tour-id="${targetId}"]`);
  if (!element) return null;

  const rect = element.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;

  return {
    bottom: Math.min(window.innerHeight - 8, rect.bottom + spotlightPadding),
    height: rect.height + spotlightPadding * 2,
    left: Math.max(8, rect.left - spotlightPadding),
    right: Math.min(window.innerWidth - 8, rect.right + spotlightPadding),
    top: Math.max(8, rect.top - spotlightPadding),
    width: rect.width + spotlightPadding * 2,
  };
};

const GuidedPracticeSpotlight = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    activeProgram,
    activeStep,
    activeTask,
    endPractice,
    session,
    setPracticeStep,
  } = useGuidedPractice();
  const [rect, setRect] = useState(null);
  const [viewport, setViewport] = useState({ height: 800, width: 1200 });

  const steps = activeTask?.steps || [];
  const currentIndex = session?.stepIndex || 0;
  const finalStep = currentIndex >= steps.length - 1;
  const progress = steps.length ? ((currentIndex + 1) / steps.length) * 100 : 0;

  useEffect(() => {
    if (!activeStep) return;
    const destination = splitRoute(activeStep.route);
    if (location.pathname !== destination.pathname) {
      navigate(activeStep.route);
    }
  }, [activeStep, location.pathname, navigate]);

  useEffect(() => {
    if (!activeStep) return undefined;

    const updateViewport = () => {
      setViewport({
        height: window.innerHeight,
        width: window.innerWidth,
      });
    };

    const refreshTarget = (shouldScroll = false) => {
      const target = document.querySelector(`[data-tour-id="${activeStep.targetId}"]`);
      if (target && shouldScroll) {
        target.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
      }
      window.requestAnimationFrame(() => setRect(getTargetRect(activeStep.targetId)));
    };

    const handleResize = () => {
      updateViewport();
      refreshTarget(false);
    };
    const handleScroll = () => refreshTarget(false);

    updateViewport();
    refreshTarget(true);
    const timers = [120, 360, 720].map((delay) => window.setTimeout(() => refreshTarget(delay === 120), delay));

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [activeStep, location.pathname, location.search]);

  const cardPosition = useMemo(() => {
    const width = Math.min(430, viewport.width - 32);
    if (!rect) {
      return {
        left: '50%',
        maxWidth: width,
        top: '50%',
        transform: 'translate(-50%, -50%)',
        width,
      };
    }

    const roomBelow = viewport.height - rect.bottom;
    const top = roomBelow > cardHeightEstimate
      ? rect.bottom + 16
      : clamp(rect.top - cardHeightEstimate - 16, 16, viewport.height - cardHeightEstimate - 16);

    return {
      left: clamp(rect.left, 16, viewport.width - width - 16),
      maxWidth: width,
      top,
      width,
    };
  }, [rect, viewport]);

  if (!activeStep || !activeTask || !activeProgram || !session) return null;

  const goToStep = (stepIndex) => {
    const step = steps[stepIndex];
    if (!step) return;
    setPracticeStep(stepIndex);
    navigate(step.route);
  };

  const finishPractice = () => {
    const programId = session.programId;
    endPractice();
    navigate(`/learn/${programId}`);
  };

  const openCurrentTarget = () => {
    navigate(activeStep.route);
    window.setTimeout(() => setRect(getTargetRect(activeStep.targetId)), 200);
  };

  const backdropColor = 'rgba(5, 20, 38, 0.72)';
  const spotlight = rect ? {
    bottom: Math.max(0, viewport.height - rect.bottom),
    height: Math.max(0, rect.bottom - rect.top),
    left: Math.max(0, rect.left),
    right: Math.max(0, viewport.width - rect.right),
    top: Math.max(0, rect.top),
    width: Math.max(0, rect.right - rect.left),
  } : null;

  return (
    <Box aria-live="polite" role="dialog" aria-modal="false">
      {spotlight ? (
        <>
          <Box sx={{ position: 'fixed', zIndex: (theme) => theme.zIndex.modal + 8, top: 0, left: 0, right: 0, height: spotlight.top, bgcolor: backdropColor }} />
          <Box sx={{ position: 'fixed', zIndex: (theme) => theme.zIndex.modal + 8, top: rect.bottom, left: 0, right: 0, bottom: 0, bgcolor: backdropColor }} />
          <Box sx={{ position: 'fixed', zIndex: (theme) => theme.zIndex.modal + 8, top: rect.top, left: 0, width: spotlight.left, height: spotlight.height, bgcolor: backdropColor }} />
          <Box sx={{ position: 'fixed', zIndex: (theme) => theme.zIndex.modal + 8, top: rect.top, right: 0, width: spotlight.right, height: spotlight.height, bgcolor: backdropColor }} />
          <Box
            aria-hidden="true"
            sx={{
              border: '3px solid',
              borderColor: 'secondary.main',
              borderRadius: 1,
              boxShadow: '0 0 0 4px rgba(239, 220, 156, 0.32), 0 16px 42px rgba(0,0,0,0.25)',
              height: spotlight.height,
              left: spotlight.left,
              pointerEvents: 'none',
              position: 'fixed',
              top: spotlight.top,
              width: spotlight.width,
              zIndex: (theme) => theme.zIndex.modal + 9,
            }}
          />
        </>
      ) : (
        <Box sx={{ position: 'fixed', inset: 0, zIndex: (theme) => theme.zIndex.modal + 8, bgcolor: backdropColor }} />
      )}

      <Box
        sx={{
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          boxShadow: 5,
          left: cardPosition.left,
          maxWidth: cardPosition.maxWidth,
          p: 1.75,
          position: 'fixed',
          top: cardPosition.top,
          transform: cardPosition.transform,
          width: cardPosition.width,
          zIndex: (theme) => theme.zIndex.modal + 10,
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
          <Box>
            <Typography variant="caption" color="primary" fontWeight={800} textTransform="uppercase">
              {activeProgram.label}
            </Typography>
            <Typography variant="h3" sx={{ mt: 0.35 }}>{activeStep.title}</Typography>
          </Box>
          <IconButton aria-label="End practice" size="small" onClick={finishPractice}>
            <CloseOutlinedIcon fontSize="small" />
          </IconButton>
        </Stack>

        <Typography variant="body2" sx={{ mt: 1 }}>
          {activeStep.body}
        </Typography>

        {!rect && (
          <Box sx={{ bgcolor: 'warning.light', border: '1px solid', borderColor: 'warning.main', borderRadius: 1, color: 'warning.contrastText', mt: 1.25, p: 1 }}>
            <Typography variant="body2" fontWeight={700}>The target is not visible yet.</Typography>
            <Typography variant="body2">Open the target route or continue to the next step when you are ready.</Typography>
          </Box>
        )}

        <LinearProgress value={progress} variant="determinate" sx={{ mt: 1.5 }} />
        <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1} sx={{ mt: 1 }}>
          <Typography variant="caption">
            Step {currentIndex + 1} of {steps.length}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {activeTask.label}
          </Typography>
        </Stack>

        <Stack direction="row" justifyContent="space-between" gap={1} sx={{ mt: 1.5 }}>
          <Button
            disabled={currentIndex === 0}
            onClick={() => goToStep(currentIndex - 1)}
            startIcon={<ArrowBackOutlinedIcon />}
          >
            Back
          </Button>
          <Stack direction="row" gap={1}>
            {!rect && (
              <Button onClick={openCurrentTarget} startIcon={<OpenInNewOutlinedIcon />}>
                Open Target
              </Button>
            )}
            <Button
              endIcon={!finalStep ? <ArrowForwardOutlinedIcon /> : undefined}
              onClick={finalStep ? finishPractice : () => goToStep(currentIndex + 1)}
              variant="contained"
            >
              {finalStep ? 'Finish' : 'Next'}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
};

export default GuidedPracticeSpotlight;
