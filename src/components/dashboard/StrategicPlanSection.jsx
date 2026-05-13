import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import { Box, Chip, LinearProgress, Stack, Typography } from '@mui/material';
import { actionItems, departmentWorkplans, initiatives, priorities, strategicPlan2030 } from '../../data/mockData';
import UserAvatar from '../shared/UserAvatar';

const statusColor = {
  'On Course': 'success',
  'Needs Attention': 'warning',
  'Off Course': 'error',
  Completed: 'success',
  Rescheduled: 'default',
};

const flattenPriorities = (items) => items.flatMap((priority) => [
  priority,
  ...(priority.children?.length ? flattenPriorities(priority.children) : []),
]);

const clampProgress = (value) => Math.min(100, Math.max(0, Number(value) || 0));

const getAverageProgress = (items) => {
  if (!items.length) return 0;
  return Math.round(items.reduce((total, item) => total + clampProgress(item.progress || item.percent), 0) / items.length);
};

const StrategicPlanSection = () => {
  const flatPriorities = flattenPriorities(priorities);
  const pillarSummaries = strategicPlan2030.pillars.map((pillar) => {
    const pillarWorkplans = departmentWorkplans.filter((workplan) => workplan.strategicPillarId === pillar.id);
    const pillarInitiatives = initiatives.filter((initiative) => initiative.strategicPillarId === pillar.id);
    const pillarPriorities = flatPriorities.filter((priority) => priority.strategicPillarId === pillar.id);
    const pillarActions = actionItems.filter((item) => item.strategicPillarId === pillar.id);
    const attentionCount = pillarWorkplans.filter((workplan) => ['Needs Attention', 'Off Course'].includes(workplan.status)).length;

    return {
      ...pillar,
      actions: pillarActions.length,
      attentionCount,
      initiatives: pillarInitiatives.length,
      priorityItems: pillarPriorities.filter((priority) => priority.company),
      priorities: pillarPriorities.length,
      progress: getAverageProgress(pillarWorkplans),
      workplans: pillarWorkplans,
    };
  });

  const alignedWorkplans = [...departmentWorkplans]
    .sort((a, b) => new Date(`${a.due}T00:00:00`) - new Date(`${b.due}T00:00:00`))
    .slice(0, 7);

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: { xs: 2, md: 2.5 }, mb: 2 }}>
        <Stack direction={{ xs: 'column', lg: 'row' }} justifyContent="space-between" gap={2}>
          <Box sx={{ maxWidth: 760 }}>
            <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 800, textTransform: 'uppercase' }}>
              Strategic Plan {strategicPlan2030.timeframe}
            </Typography>
            <Typography variant="h1" sx={{ mt: 0.5 }}>{strategicPlan2030.name}</Typography>
            <Typography variant="body2" sx={{ mt: 0.75 }}>
              The top-level alignment layer for initiatives, departmental workplans, priorities, and action tracking.
            </Typography>
          </Box>
          <Stack direction="row" gap={1} flexWrap="wrap" alignItems="flex-start">
            <Chip icon={<AccountTreeOutlinedIcon />} label={`${strategicPlan2030.pillars.length} pillars`} color="primary" />
            <Chip label={`${strategicPlan2030.pillars.reduce((total, pillar) => total + pillar.successMetrics.length, 0)} success metrics`} variant="outlined" />
            <Chip icon={<FlagOutlinedIcon />} label={`${departmentWorkplans.length} workplans`} variant="outlined" />
            <Chip icon={<TaskAltOutlinedIcon />} label={`${actionItems.length} tracked actions`} variant="outlined" />
          </Stack>
        </Stack>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', xl: 'repeat(3, 1fr)' }, gap: 1.5, mb: 2 }}>
        {pillarSummaries.map((pillar) => (
          <Box key={pillar.id} sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: pillar.attentionCount ? 'warning.light' : 'divider', borderRadius: 1, p: 1.5 }}>
            <Stack direction="row" justifyContent="space-between" gap={1} alignItems="flex-start">
              <Chip label={`Pillar ${pillar.order}`} color="primary" size="small" />
              <Chip label={pillar.attentionCount ? `${pillar.attentionCount} need focus` : 'Clear'} color={pillar.attentionCount ? 'warning' : 'success'} size="small" variant={pillar.attentionCount ? 'filled' : 'outlined'} />
            </Stack>
            <Typography variant="h3" sx={{ mt: 1 }}>{pillar.name}</Typography>
            <Typography variant="body2" sx={{ mt: 0.75 }}>{pillar.description}</Typography>

            <Box sx={{ mt: 1.5 }}>
              <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase' }}>Success Metrics</Typography>
              <Stack gap={0.75} sx={{ mt: 0.75 }}>
                {pillar.successMetrics.map((metric) => (
                  <Stack key={metric.id} direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
                    <Typography variant="body2" color="text.primary">{metric.label}</Typography>
                    <Chip label={metric.target} color="secondary" size="small" variant="outlined" sx={{ flexShrink: 0 }} />
                  </Stack>
                ))}
              </Stack>
            </Box>

            <Box sx={{ mt: 1.5 }}>
              <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase' }}>Q2 Priorities</Typography>
              <Stack gap={0.75} sx={{ mt: 0.75 }}>
                {pillar.priorityItems.length ? (
                  pillar.priorityItems.map((priority) => (
                    <Box key={priority.id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
                        <Typography variant="body2" color="text.primary" fontWeight={800}>{priority.name}</Typography>
                        <Chip label={priority.period} size="small" variant="outlined" />
                      </Stack>
                      <Typography variant="caption">{priority.owner.name}</Typography>
                    </Box>
                  ))
                ) : (
                  <Chip label="No Q2 organizational priority set" size="small" variant="outlined" />
                )}
              </Stack>
            </Box>

            <Box sx={{ mt: 1.5 }}>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                <Typography variant="caption">Workplan progress</Typography>
                <Typography variant="caption">{pillar.progress}%</Typography>
              </Stack>
              <LinearProgress value={pillar.progress} variant="determinate" />
            </Box>

            <Stack direction="row" gap={0.75} flexWrap="wrap" sx={{ mt: 1.5 }}>
              <Chip label={`${pillar.initiatives} initiatives`} size="small" variant="outlined" />
              <Chip label={`${pillar.workplans.length} workplans`} size="small" variant="outlined" />
              <Chip label={`${pillar.priorities} priorities`} size="small" variant="outlined" />
              <Chip label={`${pillar.actions} actions`} size="small" variant="outlined" />
            </Stack>
          </Box>
        ))}
      </Box>

      <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={1} sx={{ mb: 1.5 }}>
          <Box>
            <Typography variant="h3">Departmental Workplan Alignment</Typography>
            <Typography variant="body2">Every visible workplan carries a strategic pillar, quarter, lead, and linked priority set.</Typography>
          </Box>
          <Chip label="Company-wide view" color="primary" variant="outlined" />
        </Stack>

        <Stack gap={1}>
          {alignedWorkplans.map((workplan) => (
            <Box key={workplan.id} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(220px, 1fr) 190px 190px 160px' }, gap: 1.25, alignItems: 'center', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.25 }}>
              <Box>
                <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mb: 0.5 }}>
                  <Chip label={workplan.department} color="primary" size="small" />
                  <Chip label={workplan.status} color={statusColor[workplan.status] || 'default'} size="small" />
                </Stack>
                <Typography variant="body1" fontWeight={800}>{workplan.title}</Typography>
                <Typography variant="body2">{workplan.quarterlyInitiative || 'No quarterly initiative linked'}</Typography>
              </Box>
              <Stack direction="row" gap={1} alignItems="center">
                <UserAvatar user={workplan.lead} size="sm" />
                <Box>
                  <Typography variant="body2" color="text.primary" fontWeight={700}>{workplan.lead.name}</Typography>
                  <Typography variant="caption">{workplan.lead.department}</Typography>
                </Box>
              </Stack>
              <Box>
                <Typography variant="caption">Strategic Pillar</Typography>
                <Typography variant="body2" color="text.primary" fontWeight={700}>{workplan.strategicPillar}</Typography>
              </Box>
              <Box>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                  <Typography variant="caption">Progress</Typography>
                  <Typography variant="caption">{clampProgress(workplan.progress)}%</Typography>
                </Stack>
                <LinearProgress value={clampProgress(workplan.progress)} variant="determinate" />
              </Box>
            </Box>
          ))}
        </Stack>
      </Box>
    </Box>
  );
};

export default StrategicPlanSection;
