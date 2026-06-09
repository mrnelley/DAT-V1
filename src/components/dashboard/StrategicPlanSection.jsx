import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, LinearProgress, MenuItem, Select, Stack, TextField, Tooltip, Typography } from '@mui/material';
import { useMemo, useState } from 'react';
import { departmentWorkplans, initiatives, priorities, q2Roadmap, queuedTasks, strategicPlan2030, users } from '../../data/mockData';
import { useAuth } from '../../hooks/useAuth';
import UserAvatar from '../shared/UserAvatar';

const statusColor = {
  Steady: 'success',
  Watch: 'warning',
  Alert: 'error',
  Complete: 'success',
  Completed: 'success',
  'Rolled Into Next Quarter': 'warning',
  'Adopted Into Next Quarter': 'primary',
  Paused: 'default',
  Rescheduled: 'default',
};

const eltUserIds = new Set(['u1', 'u2', 'u3', 'u6', 'u8']);

const flattenPriorities = (items) => items.flatMap((priority) => [
  priority,
  ...(priority.children?.length ? flattenPriorities(priority.children) : []),
]);

const clonePriorities = () => JSON.parse(JSON.stringify(priorities));

const clampProgress = (value) => Math.min(100, Math.max(0, Number(value) || 0));

const getAverageProgress = (items) => {
  if (!items.length) return 0;
  return Math.round(items.reduce((total, item) => total + clampProgress(item.progress || item.percent), 0) / items.length);
};

const getUser = (id) => users.find((candidate) => candidate.id === id) || users[0];

const ownershipText = 'Finance-owned workplans can only be created or changed by Finance team members. Assigned collaborators can still complete assigned tasks or respond to stucks tied to the workplan.';

const getBlankForm = (type, selectedPillar, user, priorityId, objectiveId) => ({
  type,
  priorityId,
  objectiveId,
  name: '',
  title: '',
  ownerId: user.id,
  department: user.department,
  roadmapStatus: 'Steady',
  status: 'Steady',
  workplanTitle: '',
  workplanAccess: user.department,
  workplanSummary: '',
  target: '',
  currentLabel: '',
  progress: 0,
  notes: '',
  strategicPillarId: selectedPillar?.id,
});

const RoadmapEditorDialog = ({ editor, onClose, onSave, selectedPillar, user }) => {
  const [form, setForm] = useState(() => editor.form);

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  return (
    <Dialog open={editor.open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {editor.mode === 'edit' ? 'Edit' : 'Add'} {editor.type === 'priority' ? 'Organizational Priority' : editor.type === 'objective' ? 'Key Objective' : 'KPI'}
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Stack gap={2} sx={{ mt: 1 }}>
          {editor.type === 'priority' && (
            <>
              <TextField label="Priority Name" value={form.name} onChange={update('name')} fullWidth required />
              <TextField select label="Owner" value={form.ownerId} onChange={update('ownerId')} fullWidth>
                {users.map((candidate) => <MenuItem key={candidate.id} value={candidate.id}>{candidate.name} - {candidate.department}</MenuItem>)}
              </TextField>
              <TextField select label="Quarter Outcome" value={form.roadmapStatus} onChange={update('roadmapStatus')} fullWidth>
                {q2Roadmap.statusOptions.map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
              </TextField>
            </>
          )}

          {editor.type === 'objective' && (
            <>
              <TextField label="Key Objective" value={form.title} onChange={update('title')} fullWidth required />
              <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
                <TextField select label="Owner" value={form.ownerId} onChange={update('ownerId')} fullWidth>
                  {users.map((candidate) => <MenuItem key={candidate.id} value={candidate.id}>{candidate.name} - {candidate.department}</MenuItem>)}
                </TextField>
                <TextField select label="Status" value={form.status} onChange={update('status')} fullWidth>
                  {q2Roadmap.statusOptions.map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
                </TextField>
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
                <TextField label="Department" value={form.department} onChange={update('department')} fullWidth />
                <TextField label="Workplan Access Team" value={form.workplanAccess} onChange={update('workplanAccess')} fullWidth />
              </Stack>
              <TextField label="Workplan Title" value={form.workplanTitle} onChange={update('workplanTitle')} fullWidth />
              <TextField label="Workplan Summary" value={form.workplanSummary} onChange={update('workplanSummary')} fullWidth multiline minRows={2} />
              <TextField label="Notes" value={form.notes} onChange={update('notes')} fullWidth multiline minRows={2} />
            </>
          )}

          {editor.type === 'kpi' && (
            <>
              <TextField label="KPI" value={form.title} onChange={update('title')} fullWidth required />
              <TextField label="Target" value={form.target} onChange={update('target')} fullWidth />
              <TextField label="Current" value={form.currentLabel} onChange={update('currentLabel')} fullWidth />
              <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
                <TextField type="number" label="Progress" value={form.progress} onChange={update('progress')} fullWidth inputProps={{ min: 0, max: 100 }} />
                <TextField select label="Status" value={form.status} onChange={update('status')} fullWidth>
                  {q2Roadmap.statusOptions.map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
                </TextField>
              </Stack>
            </>
          )}

          <Chip label={selectedPillar?.name || 'Strategic pillar'} color="primary" variant="outlined" sx={{ alignSelf: 'flex-start' }} />
          {editor.type === 'objective' && form.department === 'Finance' && (
            <Typography variant="body2">{ownershipText}</Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={() => onSave({ ...form, user })} disabled={editor.type === 'priority' ? !form.name.trim() : !form.title.trim()}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const RoadmapDetailDialog = ({ canManage, onClose, onDeleteKpi, onDeleteObjective, onDeletePriority, onOpenEditor, open, pillar }) => (
  <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
    <DialogTitle>
      <Stack direction={{ xs: 'column', md: 'row' }} gap={1} justifyContent="space-between">
        <Box>
          <Typography variant="caption" color="primary">Q2 Roadmap - {q2Roadmap.theme}</Typography>
          <Typography variant="h2">{pillar?.name}</Typography>
        </Box>
        {canManage && (
          <Button startIcon={<AddIcon />} variant="contained" onClick={() => onOpenEditor('priority', 'create', { pillar })}>
            Add Org Priority
          </Button>
        )}
      </Stack>
    </DialogTitle>
    <DialogContent>
      <Stack gap={1.5} sx={{ py: 1 }}>
        {(pillar?.priorityItems || []).map((priority) => (
          <Box key={priority.id} sx={{ border: '1px solid', borderColor: priority.roadmapStatus === 'Paused' ? 'divider' : 'primary.light', borderRadius: 1, p: 1.5, opacity: priority.roadmapStatus === 'Paused' ? 0.55 : 1 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} gap={1} justifyContent="space-between">
              <Box>
                <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
                  <Typography variant="h3">{priority.name}</Typography>
                  <Chip label={priority.roadmapStatus || 'Steady'} color={statusColor[priority.roadmapStatus] || 'default'} size="small" />
                  <Chip label={priority.period} variant="outlined" size="small" />
                </Stack>
                <Stack direction="row" gap={1} alignItems="center" sx={{ mt: 0.75 }}>
                  <UserAvatar user={priority.owner} size="sm" />
                  <Typography variant="body2">{priority.owner.name} owns the organizational priority</Typography>
                </Stack>
              </Box>
              {canManage && (
                <Stack direction="row" gap={0.5}>
                  <Tooltip title="Edit priority"><IconButton aria-label={`Edit ${priority.name}`} onClick={() => onOpenEditor('priority', 'edit', { pillar, priority })}><EditOutlinedIcon /></IconButton></Tooltip>
                  <Tooltip title="Delete priority"><IconButton aria-label={`Delete ${priority.name}`} onClick={() => onDeletePriority(priority.id)}><DeleteOutlineIcon /></IconButton></Tooltip>
                  <Button startIcon={<AddIcon />} onClick={() => onOpenEditor('objective', 'create', { pillar, priority })}>Objective</Button>
                </Stack>
              )}
            </Stack>

            <Stack gap={1} sx={{ mt: 1.5 }}>
              {(priority.keyObjectives || []).map((objective) => (
                <Box key={objective.id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.25 }}>
                  <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={1}>
                    <Box>
                      <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center">
                        <Typography variant="body1" fontWeight={800}>{objective.title}</Typography>
                        <Chip label={objective.status} color={statusColor[objective.status] || 'default'} size="small" />
                        <Chip label={objective.department} size="small" variant="outlined" />
                        <Chip label={`${objective.kpis?.length || 0} KPI${(objective.kpis?.length || 0) === 1 ? '' : 's'}`} size="small" variant="outlined" />
                      </Stack>
                      <Stack direction="row" gap={1} alignItems="center" sx={{ mt: 0.75 }}>
                        <UserAvatar user={objective.owner} size="sm" />
                        <Typography variant="body2">{objective.owner.name} - {objective.workplanTitle}</Typography>
                      </Stack>
                    </Box>
                    {canManage && (
                      <Stack direction="row" gap={0.5}>
                        <Tooltip title="Edit objective"><IconButton aria-label={`Edit ${objective.title}`} onClick={() => onOpenEditor('objective', 'edit', { objective, pillar, priority })}><EditOutlinedIcon /></IconButton></Tooltip>
                        <Tooltip title="Delete objective"><IconButton aria-label={`Delete ${objective.title}`} onClick={() => onDeleteObjective(priority.id, objective.id)}><DeleteOutlineIcon /></IconButton></Tooltip>
                        <Button startIcon={<AddIcon />} onClick={() => onOpenEditor('kpi', 'create', { objective, pillar, priority })}>KPI</Button>
                      </Stack>
                    )}
                  </Stack>
                  <Typography variant="body2" color="text.primary" sx={{ mt: 1 }}>{objective.workplanSummary}</Typography>
                  {objective.notes && <Typography variant="body2" sx={{ mt: 0.5 }}>{objective.notes}</Typography>}

                  <Stack gap={1} sx={{ mt: 1 }}>
                    {(objective.kpis || []).map((kpi) => (
                      <Box key={kpi.id} sx={{ bgcolor: 'background.default', borderRadius: 1, p: 1 }}>
                        <Stack direction={{ xs: 'column', md: 'row' }} gap={1} justifyContent="space-between">
                          <Box>
                            <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
                              <Typography variant="body2" color="text.primary" fontWeight={800}>{kpi.title}</Typography>
                              <Chip label={kpi.status} color={statusColor[kpi.status] || 'default'} size="small" />
                            </Stack>
                            <Typography variant="caption">{kpi.target}</Typography>
                            <Typography variant="body2">{kpi.currentLabel}</Typography>
                            {kpi.nextTarget && <Typography variant="caption">{kpi.nextTarget}</Typography>}
                          </Box>
                          <Stack direction="row" gap={1} alignItems="center">
                            <Box sx={{ minWidth: 150 }}>
                              <Stack direction="row" justifyContent="space-between">
                                <Typography variant="caption">Progress</Typography>
                                <Typography variant="caption">{clampProgress(kpi.progress)}%</Typography>
                              </Stack>
                              <LinearProgress value={clampProgress(kpi.progress)} variant="determinate" />
                            </Box>
                            {canManage && (
                              <>
                                <Tooltip title="Edit KPI"><IconButton aria-label={`Edit ${kpi.title}`} onClick={() => onOpenEditor('kpi', 'edit', { kpi, objective, pillar, priority })}><EditOutlinedIcon /></IconButton></Tooltip>
                                <Tooltip title="Delete KPI"><IconButton aria-label={`Delete ${kpi.title}`} onClick={() => onDeleteKpi(priority.id, objective.id, kpi.id)}><DeleteOutlineIcon /></IconButton></Tooltip>
                              </>
                            )}
                          </Stack>
                        </Stack>
                        {(kpi.children || []).length > 0 && (
                          <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mt: 1 }}>
                            {kpi.children.map((child) => <Chip key={child.id} label={`${child.title}: ${child.status}`} color="success" size="small" variant="outlined" />)}
                          </Stack>
                        )}
                      </Box>
                    ))}
                  </Stack>
                </Box>
              ))}
            </Stack>
          </Box>
        ))}
      </Stack>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Close</Button>
    </DialogActions>
  </Dialog>
);

const StrategicPlanSection = () => {
  const { user } = useAuth();
  const [roadmapPriorities, setRoadmapPriorities] = useState(clonePriorities);
  const [selectedPillarId, setSelectedPillarId] = useState(null);
  const [editor, setEditor] = useState({ open: false, type: null, mode: 'create', form: {} });
  const canManageRoadmap = eltUserIds.has(user.id);

  const flatPriorities = flattenPriorities(roadmapPriorities);
  const pillarSummaries = strategicPlan2030.pillars.map((pillar) => {
    const pillarWorkplans = departmentWorkplans.filter((workplan) => workplan.strategicPillarId === pillar.id);
    const pillarInitiatives = initiatives.filter((initiative) => initiative.strategicPillarId === pillar.id);
    const pillarPriorities = flatPriorities.filter((priority) => priority.strategicPillarId === pillar.id);
    const pillarActions = queuedTasks.filter((item) => item.strategicPillarId === pillar.id);
    const attentionCount = pillarWorkplans.filter((workplan) => ['Watch', 'Alert'].includes(workplan.status)).length;

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

  const selectedPillar = pillarSummaries.find((pillar) => pillar.id === selectedPillarId) || null;
  const alignedWorkplans = [...departmentWorkplans]
    .sort((a, b) => new Date(`${a.due}T00:00:00`) - new Date(`${b.due}T00:00:00`))
    .slice(0, 7);

  const openEditor = (type, mode, context = {}) => {
    const base = getBlankForm(type, context.pillar, user, context.priority?.id, context.objective?.id);
    const form = type === 'priority' && context.priority
      ? { ...base, ...context.priority, ownerId: context.priority.owner?.id || user.id }
      : type === 'objective' && context.objective
        ? { ...base, ...context.objective, ownerId: context.objective.owner?.id || user.id, priorityId: context.priority?.id }
        : type === 'kpi' && context.kpi
          ? { ...base, ...context.kpi, priorityId: context.priority?.id, objectiveId: context.objective?.id }
          : { ...base, priorityId: context.priority?.id, objectiveId: context.objective?.id };

    setEditor({ open: true, type, mode, form });
  };

  const closeEditor = () => setEditor({ open: false, type: null, mode: 'create', form: {} });

  const saveEditor = (form) => {
    setRoadmapPriorities((current) => {
      if (form.type === 'priority') {
        const owner = getUser(form.ownerId);
        const nextPriority = {
          id: form.id || `q2-priority-${Date.now()}`,
          name: form.name,
          owner,
          ownerIds: Array.from(new Set([owner.id, user.id])),
          type: 'ROLLUP',
          current: 0,
          start: 0,
          target: 100,
          percent: 0,
          status: 'no_data',
          roadmapStatus: form.roadmapStatus,
          company: true,
          period: q2Roadmap.quarter,
          strategicPlan: strategicPlan2030.name,
          strategicPillarId: form.strategicPillarId,
          strategicPillar: strategicPlan2030.pillars.find((pillar) => pillar.id === form.strategicPillarId)?.name,
          description: `Q2 organizational priority aligned to ${form.strategicPillarId}.`,
          heatmap: ['no_data', 'no_data', 'no_data'],
          keyObjectives: form.keyObjectives || [],
          children: [],
        };
        return form.id ? current.map((priority) => (priority.id === form.id ? { ...priority, ...nextPriority } : priority)) : [nextPriority, ...current];
      }

      if (form.type === 'objective') {
        const owner = getUser(form.ownerId);
        const objective = {
          id: form.id || `objective-${Date.now()}`,
          title: form.title,
          owner,
          ownerIds: Array.from(new Set([owner.id, user.id])),
          department: form.department,
          status: form.status,
          workplanTitle: form.workplanTitle,
          workplanAccess: form.workplanAccess,
          workplanSummary: form.workplanSummary,
          notes: form.notes,
          kpis: form.kpis || [],
        };
        return current.map((priority) => {
          if (priority.id !== form.priorityId) return priority;
          const objectives = priority.keyObjectives || [];
          const keyObjectives = form.id ? objectives.map((item) => (item.id === form.id ? { ...item, ...objective } : item)) : [objective, ...objectives];
          return { ...priority, keyObjectives };
        });
      }

      const kpi = {
        id: form.id || `kpi-${Date.now()}`,
        title: form.title,
        target: form.target,
        currentLabel: form.currentLabel,
        progress: clampProgress(form.progress),
        status: form.status,
      };
      return current.map((priority) => {
        if (priority.id !== form.priorityId) return priority;
        return {
          ...priority,
          keyObjectives: (priority.keyObjectives || []).map((objective) => {
            if (objective.id !== form.objectiveId) return objective;
            const kpis = objective.kpis || [];
            return { ...objective, kpis: form.id ? kpis.map((item) => (item.id === form.id ? { ...item, ...kpi } : item)) : [kpi, ...kpis] };
          }),
        };
      });
    });
    closeEditor();
  };

  const deletePriority = (priorityId) => setRoadmapPriorities((current) => current.filter((priority) => priority.id !== priorityId));
  const deleteObjective = (priorityId, objectiveId) => setRoadmapPriorities((current) => current.map((priority) => (
    priority.id === priorityId ? { ...priority, keyObjectives: (priority.keyObjectives || []).filter((objective) => objective.id !== objectiveId) } : priority
  )));
  const deleteKpi = (priorityId, objectiveId, kpiId) => setRoadmapPriorities((current) => current.map((priority) => (
    priority.id === priorityId
      ? { ...priority, keyObjectives: (priority.keyObjectives || []).map((objective) => (objective.id === objectiveId ? { ...objective, kpis: (objective.kpis || []).filter((kpi) => kpi.id !== kpiId) } : objective)) }
      : priority
  )));

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: { xs: 2, md: 2.5 }, mb: 2 }}>
        <Stack direction={{ xs: 'column', lg: 'row' }} justifyContent="space-between" gap={2}>
          <Box sx={{ maxWidth: 780 }}>
            <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 800, textTransform: 'uppercase' }}>
              Strategic Plan {strategicPlan2030.timeframe}
            </Typography>
            <Typography variant="h1" sx={{ mt: 0.5 }}>{strategicPlan2030.name}</Typography>
            <Typography variant="h2" sx={{ mt: 1 }}>Q2 Roadmap: {q2Roadmap.theme}</Typography>
            <Typography variant="body2" sx={{ mt: 0.75 }}>
              ELT sets organizational priorities and key objectives; OLT defines KPIs, updates departmental workplans, and contributes progress through assigned work.
            </Typography>
          </Box>
          <Stack direction="row" gap={1} flexWrap="wrap" alignItems="flex-start">
            <Chip icon={<AccountTreeOutlinedIcon />} label={`${strategicPlan2030.pillars.length} pillars`} color="primary" />
            <Chip label={`${strategicPlan2030.pillars.reduce((total, pillar) => total + pillar.successMetrics.length, 0)} success metrics`} variant="outlined" />
            <Chip icon={<FlagOutlinedIcon />} label={`${departmentWorkplans.length} workplans`} variant="outlined" />
            <Chip icon={<TaskAltOutlinedIcon />} label={`${queuedTasks.length} queued tasks`} variant="outlined" />
          </Stack>
        </Stack>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', xl: 'repeat(3, 1fr)' }, gap: 1.5, mb: 2 }}>
        {pillarSummaries.map((pillar) => (
          <Box
            key={pillar.id}
            onClick={() => setSelectedPillarId(pillar.id)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setSelectedPillarId(pillar.id);
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={`Open ${pillar.name} Q2 roadmap`}
            sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: pillar.attentionCount ? 'warning.light' : 'divider', borderRadius: 1, p: 1.5, cursor: 'pointer', '&:hover': { borderColor: 'primary.main', boxShadow: 2 } }}
          >
            <Stack direction="row" justifyContent="space-between" gap={1} alignItems="flex-start">
              <Chip label={`Pillar ${pillar.order}`} color="primary" size="small" />
              <Chip label={pillar.attentionCount ? `${pillar.attentionCount} need focus` : 'Clear'} color={pillar.attentionCount ? 'warning' : 'success'} size="small" variant={pillar.attentionCount ? 'filled' : 'outlined'} />
            </Stack>
            <Typography variant="h3" sx={{ mt: 1 }}>{pillar.name}</Typography>
            <Typography variant="body2" sx={{ mt: 0.75 }}>{pillar.description}</Typography>

            <Box sx={{ mt: 1.5 }}>
              <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase' }}>Q2 Priorities</Typography>
              <Stack gap={0.75} sx={{ mt: 0.75 }}>
                {pillar.priorityItems.length ? (
                  pillar.priorityItems.map((priority) => (
                    <Box key={priority.id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
                        <Typography variant="body2" color="text.primary" fontWeight={800}>{priority.name}</Typography>
                        <Stack direction="row" gap={0.5}>
                          <Chip label={priority.period} size="small" variant="outlined" />
                          <Chip label={`${priority.keyObjectives?.length || 0} objectives`} size="small" variant="outlined" />
                        </Stack>
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
              <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase' }}>Success Metrics</Typography>
              <Stack gap={0.75} sx={{ mt: 0.75 }}>
                {pillar.successMetrics.slice(0, 3).map((metric) => (
                  <Stack key={metric.id} direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
                    <Typography variant="body2" color="text.primary">{metric.label}</Typography>
                    <Chip label={metric.target} color="secondary" size="small" variant="outlined" sx={{ flexShrink: 0 }} />
                  </Stack>
                ))}
              </Stack>
            </Box>

            <Box sx={{ mt: 1.5 }}>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                <Typography variant="caption">Workplan progress</Typography>
                <Typography variant="caption">{pillar.progress}%</Typography>
              </Stack>
              <LinearProgress value={pillar.progress} variant="determinate" />
            </Box>
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

      <RoadmapDetailDialog
        canManage={canManageRoadmap}
        onClose={() => setSelectedPillarId(null)}
        onDeleteKpi={deleteKpi}
        onDeleteObjective={deleteObjective}
        onDeletePriority={deletePriority}
        onOpenEditor={openEditor}
        open={Boolean(selectedPillar)}
        pillar={selectedPillar}
      />
      {editor.open && (
        <RoadmapEditorDialog
          editor={editor}
          onClose={closeEditor}
          onSave={saveEditor}
          selectedPillar={selectedPillar}
          user={user}
        />
      )}
    </Box>
  );
};

export default StrategicPlanSection;
