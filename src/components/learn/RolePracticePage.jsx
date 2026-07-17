import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import AutoStoriesOutlinedIcon from '@mui/icons-material/AutoStoriesOutlined';
import PlayArrowOutlinedIcon from '@mui/icons-material/PlayArrowOutlined';
import { Box, Button, Dialog, DialogContent, DialogTitle, List, ListItemButton, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useGuidedPractice } from '../../context/GuidedPracticeContext';
import { getPracticeProgram } from '../../data/guidedPracticePrograms';
import PageWrapper from '../layout/PageWrapper';

const RolePracticePage = ({ programId }) => {
  const navigate = useNavigate();
  const { startPractice } = useGuidedPractice();
  const program = getPracticeProgram(programId);
  const [pickerOpen, setPickerOpen] = useState(true);

  useEffect(() => {
    setPickerOpen(true);
  }, [program.id]);

  const launchTask = (taskId) => {
    const firstStep = startPractice(program.id, taskId);
    if (firstStep) navigate(firstStep.route);
  };

  return (
    <PageWrapper>
      <Box sx={{ maxWidth: 980 }}>
        <Button component={RouterLink} to="/learn" startIcon={<ArrowBackOutlinedIcon />} sx={{ mb: 1, px: 0 }}>
          Learn
        </Button>
        <Stack direction="row" gap={1} alignItems="center" sx={{ mb: 1 }}>
          <AutoStoriesOutlinedIcon color="primary" />
          <Typography variant="overline" color="primary">Practice Mode</Typography>
        </Stack>
        <Typography variant="h1">{program.label}</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 720, mt: 1 }}>
          {program.description}
        </Typography>
        <Button
          onClick={() => setPickerOpen(true)}
          startIcon={<PlayArrowOutlinedIcon />}
          variant="contained"
          sx={{ mt: 2 }}
        >
          Choose Practice Task
        </Button>
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
              <Typography variant="body2" color="text.secondary">Choose the workflow you want to practice.</Typography>
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
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h3">{task.label}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35 }}>
                    {task.description}
                  </Typography>
                </Box>
              </ListItemButton>
            ))}
          </List>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
};

export default RolePracticePage;
