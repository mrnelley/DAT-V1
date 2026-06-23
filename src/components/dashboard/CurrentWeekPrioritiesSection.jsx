import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined';
import { Box, Button, Chip, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import UserAvatar from '../shared/UserAvatar';

const statusColor = {
  alert: 'error',
  complete: 'success',
  Completed: 'success',
  steady: 'success',
  watch: 'warning',
};

const priorityStatusOrder = {
  alert: 0,
  watch: 1,
  steady: 2,
  complete: 3,
  Completed: 3,
};

export const getOwnedWeeklyPriorities = (entries, userId) => entries
  .filter((entry) => entry.title && entry.owner?.id === userId)
  .sort((a, b) => (
    (priorityStatusOrder[a.status] ?? 5) - (priorityStatusOrder[b.status] ?? 5)
    || Number(a.rank || 0) - Number(b.rank || 0)
  ));

const CurrentWeekPrioritiesSection = ({ entries, user }) => {
  const navigate = useNavigate();
  const priorities = getOwnedWeeklyPriorities(entries, user.id);
  const firstName = user.name.split(' ')[0];

  return (
    <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5, mb: 2 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={1} sx={{ mb: 1.5 }}>
        <Box>
          <Typography variant="h3">{firstName}'s Weekly Priorities</Typography>
          <Typography variant="body2">Live current-week priorities owned by {firstName} in Weekly Tracker.</Typography>
        </Box>
        <Button endIcon={<ArrowForwardOutlinedIcon />} onClick={() => navigate('/weekly-tracker')}>
          Open Weekly Tracker
        </Button>
      </Stack>

      {priorities.length ? (
        <Stack gap={1}>
          {priorities.map((priority) => (
            <Box
              key={priority.id}
              aria-label={`Open weekly priority ${priority.title}`}
              onClick={() => navigate(`/weekly-tracker?entry=${priority.id}`)}
              onKeyDown={(event) => {
                if (event.key !== 'Enter' && event.key !== ' ') return;
                event.preventDefault();
                navigate(`/weekly-tracker?entry=${priority.id}`);
              }}
              role="button"
              tabIndex={0}
              title={`Open weekly priority ${priority.title}`}
              sx={{
                border: '1px solid',
                borderColor: priority.rank === 1 ? 'primary.light' : 'divider',
                borderRadius: 1,
                cursor: 'pointer',
                p: 1.25,
                '&:focus-visible': { outline: '3px solid', outlineColor: 'secondary.main', outlineOffset: 2 },
                '&:hover': { borderColor: 'primary.main', boxShadow: 1 },
              }}
            >
              <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={1}>
                <Box>
                  <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
                    <Chip label={`#${priority.rank}`} color={priority.rank === 1 ? 'primary' : 'default'} size="small" />
                    <Chip label={priority.status} color={statusColor[priority.status] || 'default'} size="small" />
                    <Chip label={`Due ${priority.due}`} variant="outlined" size="small" />
                  </Stack>
                  <Typography variant="body1" fontWeight={800} sx={{ mt: 1 }}>{priority.title}</Typography>
                  <Typography variant="body2" color="text.primary">
                    Aligned to: {priority.alignedPriorityLabel || 'Alignment required'}
                  </Typography>
                </Box>
                <Stack direction="row" gap={1} alignItems="center" sx={{ flexShrink: 0 }}>
                  <UserAvatar user={priority.owner} size="sm" />
                  <Box>
                    <Typography variant="body2" color="text.primary" fontWeight={700}>{priority.owner.name}</Typography>
                    <Typography variant="caption">{priority.department}</Typography>
                  </Box>
                </Stack>
              </Stack>

              {(priority.tasks || []).length > 0 && (
                <Box sx={{ bgcolor: 'background.default', borderRadius: 1, p: 1, mt: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase' }}>Action Items</Typography>
                  {priority.tasks.map((task) => (
                    <Stack key={task.id} direction={{ xs: 'column', sm: 'row' }} gap={1} justifyContent="space-between" sx={{ mt: 0.5 }}>
                      <Typography variant="body2" color="text.primary">{task.title}</Typography>
                      <Stack direction="row" gap={1}>
                        <Chip label={task.owner.name} size="small" variant="outlined" />
                        <Chip label={`Due ${task.due}`} size="small" variant="outlined" />
                      </Stack>
                    </Stack>
                  ))}
                </Box>
              )}
            </Box>
          ))}
        </Stack>
      ) : (
        <Box sx={{ bgcolor: 'background.default', border: '1px dashed', borderColor: 'divider', borderRadius: 1, p: 2 }}>
          <Typography variant="body1" color="text.primary" fontWeight={700}>No current-week priorities set</Typography>
          <Typography variant="body2">{firstName} has not defined a current-week priority in Weekly Tracker.</Typography>
        </Box>
      )}
    </Box>
  );
};

export default CurrentWeekPrioritiesSection;
