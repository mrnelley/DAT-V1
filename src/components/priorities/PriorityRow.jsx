import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import MoreHorizOutlinedIcon from '@mui/icons-material/MoreHorizOutlined';
import { Box, Card, Chip, IconButton, LinearProgress, Stack, Tooltip, Typography } from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { useActionFeedback } from '../../context/ActionFeedbackContext';
import { statusColorMap } from '../../utils/statusColors';
import UserAvatar from '../shared/UserAvatar';

const getRollupStatus = (objectives) => {
  const statuses = objectives.map((objective) => objective.status);
  if (!statuses.length) return 'no_data';
  if (statuses.some((status) => ['Alert', 'Off Course'].includes(status))) return 'off_course';
  if (statuses.some((status) => ['Watch', 'Needs Attention'].includes(status))) return 'needs_attention';
  if (statuses.every((status) => ['Complete', 'Completed'].includes(status))) return 'completed';
  return 'on_course';
};

const getRollupProgress = (objectives) => {
  const kpis = objectives.flatMap((objective) => objective.kpis || []);
  if (!kpis.length) return 0;
  return Math.round(kpis.reduce((total, kpi) => total + Number(kpi.progress || 0), 0) / kpis.length);
};

const rollupLabel = {
  completed: 'Complete',
  needs_attention: 'Needs Attention',
  no_data: 'No Data',
  off_course: 'Off Track',
  on_course: 'On Track',
};

const PriorityRow = ({ currentUser, priority, depth = 0, expandedAll = false }) => {
  const { unavailable } = useActionFeedback();
  const [expanded, setExpanded] = useState(expandedAll);
  const toggleExpanded = () => setExpanded((value) => !value);
  const objectives = priority.keyObjectives || [];
  const objectiveOwners = Array.from(new Map(objectives.map((objective) => [objective.owner?.id, objective.owner])).values()).filter(Boolean);
  const canManage = currentUser?.workingGroup === 'ELT';
  const rollupStatus = getRollupStatus(objectives);
  const rollupProgress = getRollupProgress(objectives);

  return (
    <Box sx={{ ml: depth ? 3 : 0, mb: 0.5 }}>
      <Card sx={{ overflow: 'hidden' }}>
        <Box
          onClick={toggleExpanded}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              toggleExpanded();
            }
          }}
          role="button"
          tabIndex={0}
          aria-expanded={expanded}
          aria-label={`${expanded ? 'Collapse' : 'Expand'} priority ${priority.name}`}
          title={`${expanded ? 'Collapse' : 'Expand'} priority ${priority.name}`}
          sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '32px 90px minmax(220px, 1fr) 150px minmax(180px, 260px) 64px 44px' }, gap: 1, alignItems: 'center', p: 1.5, cursor: 'pointer' }}
        >
          <DragIndicatorIcon color="disabled" />
          <Stack direction="row" spacing={-0.75}>
            {objectiveOwners.slice(0, 3).map((owner) => <UserAvatar key={owner.id} user={owner} size="md" />)}
          </Stack>
          <Box>
            <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
              <Typography variant="body1" fontWeight={700}>{priority.name}</Typography>
              <Chip label="ENTERPRISE PRIORITY" size="small" sx={{ bgcolor: 'rgba(7,44,94,0.12)', color: 'primary.main' }} />
              {canManage ? <Chip label="ELT MANAGED" size="small" sx={{ bgcolor: 'rgba(94,184,168,0.15)', color: 'secondary.dark' }} /> : <Chip label="VIEW ONLY" size="small" variant="outlined" />}
              {priority.strategicPillar && <Chip label={priority.strategicPillar} size="small" variant="outlined" />}
            </Stack>
          </Box>
          <Chip label={`${objectives.length} Key Objective${objectives.length === 1 ? '' : 's'}`} size="small" variant="outlined" color="primary" />
          <Box>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
              <Typography variant="caption">Manual KPI progress</Typography>
              <Typography variant="caption">{rollupProgress}%</Typography>
            </Stack>
            <LinearProgress variant="determinate" value={rollupProgress} sx={{ '& .MuiLinearProgress-bar': { bgcolor: statusColorMap[rollupStatus] } }} />
          </Box>
          <Typography variant="caption" color={statusColorMap[rollupStatus]} fontWeight={800}>{rollupLabel[rollupStatus]}</Typography>
          <Tooltip title={canManage ? 'Priority options' : 'Only ELT can update Enterprise Priorities'}>
            <span>
              <IconButton disabled={!canManage} title={`More options for priority ${priority.name}`} aria-label={`More options for priority ${priority.name}`} onClick={(event) => { event.stopPropagation(); unavailable('priority options need the priority detail drawer.'); }}><MoreHorizOutlinedIcon /></IconButton>
            </span>
          </Tooltip>
        </Box>
        <AnimatePresence>
          {expanded && (
            <Box component={motion.div} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ type: 'spring', stiffness: 240, damping: 22 }} sx={{ overflow: 'hidden' }}>
              <Stack gap={1} sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                {objectives.map((objective) => (
                  <Box key={objective.id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.25 }}>
                    <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={1}>
                      <Box>
                        <Typography variant="body1" fontWeight={800}>{objective.title}</Typography>
                        <Typography variant="body2">{objective.kpis?.[0]?.title || 'KPI not defined'}: {objective.kpis?.[0]?.target || 'Target not defined'}</Typography>
                      </Box>
                      <Stack direction="row" alignItems="center" gap={1}>
                        <UserAvatar user={objective.owner} size="sm" />
                        <Box>
                          <Typography variant="body2" fontWeight={700}>{objective.owner?.name || 'Owner not assigned'}</Typography>
                          <Typography variant="caption">{objective.status || 'No Data'}</Typography>
                        </Box>
                      </Stack>
                    </Stack>
                  </Box>
                ))}
                {!objectives.length && <Typography variant="body2">No Key Objectives have been defined for this Enterprise Priority.</Typography>}
              </Stack>
            </Box>
          )}
        </AnimatePresence>
      </Card>
    </Box>
  );
};

export default PriorityRow;
