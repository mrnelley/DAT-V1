import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, LinearProgress, MenuItem, Stack, TextField, Tooltip, Typography } from '@mui/material';
import { useState } from 'react';
import { useOperatingData } from '../../context/OperatingDataContext';
import { useReportingPeriod } from '../../context/ReportingPeriodContext';
import { roadmapStatusOptions } from '../../data/quarterlyRoadmap';
import { recordMatchesReportingPeriod } from '../../data/reportingPeriods';
import { useAuth } from '../../hooks/useAuth';
import { decorateWorkplan } from '../../utils/workplans';
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

const flattenPriorities = (items) => items.flatMap((priority) => [
  priority,
  ...(priority.children?.length ? flattenPriorities(priority.children) : []),
]);

const clampProgress = (value) => Math.min(100, Math.max(0, Number(value) || 0));

const getAverageProgress = (items) => {
  if (!items.length) return 0;
  return Math.round(items.reduce((total, item) => total + clampProgress(item.progress || item.percent), 0) / items.length);
};

const createRecordId = () => globalThis.crypto.randomUUID();

const ownershipText = 'Finance-owned workplans can only be created or changed by Finance team members. Assigned collaborators can still complete assigned tasks or respond to stucks tied to the workplan.';

const blankObjectiveDraft = (user) => ({
  id: `objective-draft-${Date.now()}-${Math.random()}`,
  kpiId: null,
  kpiTarget: '',
  kpiTitle: '',
  ownerId: user.id,
  status: 'Steady',
  title: '',
});

const objectiveDraftsFromPriority = (priority, user) => (
  priority?.keyObjectives?.length
    ? priority.keyObjectives.map((objective) => ({
      id: objective.id,
      kpiId: objective.kpis?.[0]?.id || null,
      kpiTarget: objective.kpis?.[0]?.target || '',
      kpiTitle: objective.kpis?.[0]?.title || '',
      ownerId: objective.owner?.id || user.id,
      status: objective.status || 'Steady',
      title: objective.title,
    }))
    : [blankObjectiveDraft(user)]
);

const roadmapStatusFromObjectives = (objectives) => {
  const statusRank = { Alert: 0, 'Off Course': 0, Watch: 1, 'Needs Attention': 1, Steady: 2, 'On Course': 2, Complete: 3, Completed: 3 };
  return [...objectives].sort((a, b) => (statusRank[a.status] ?? 1) - (statusRank[b.status] ?? 1))[0]?.status || 'Watch';
};

const getPriorityRollupStatus = (priority) => roadmapStatusFromObjectives(priority.keyObjectives || []);

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
  kpiTarget: '',
  kpiTitle: '',
  currentLabel: '',
  progress: 0,
  notes: '',
  strategicPillarId: selectedPillar?.id,
  objectiveDrafts: type === 'priority' ? [blankObjectiveDraft(user)] : [],
});

const RoadmapEditorDialog = ({ editor, onClose, onSave, reportingPeriod, selectedPillar, user }) => {
  const [form, setForm] = useState(() => editor.form);

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  const updateObjectiveDraft = (draftId, field) => (event) => setForm((current) => ({
    ...current,
    objectiveDrafts: current.objectiveDrafts.map((draft) => (
      draft.id === draftId ? { ...draft, [field]: event.target.value } : draft
    )),
  }));
  const addObjectiveDraft = () => setForm((current) => ({
    ...current,
    objectiveDrafts: [...current.objectiveDrafts, blankObjectiveDraft(user)],
  }));
  const removeObjectiveDraft = (draftId) => setForm((current) => ({
    ...current,
    objectiveDrafts: current.objectiveDrafts.filter((draft) => draft.id !== draftId),
  }));
  const priorityReady = form.name.trim()
    && form.objectiveDrafts.length > 0
    && form.objectiveDrafts.every((draft) => draft.title.trim() && draft.ownerId && draft.kpiTitle.trim() && draft.kpiTarget.trim());
  const objectiveReady = form.title.trim() && form.ownerId && form.kpiTitle.trim() && form.kpiTarget.trim();

  return (
    <Dialog aria-labelledby="roadmap-editor-dialog-title" open={editor.open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle id="roadmap-editor-dialog-title">
        {editor.mode === 'edit' ? 'Edit' : 'Add'} {editor.type === 'priority' ? 'Enterprise Priority' : editor.type === 'objective' ? 'Key Objective' : 'KPI'}
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Stack gap={2} sx={{ mt: 1 }}>
          {editor.type === 'priority' && (
            <>
              <TextField label="Priority Name" value={form.name} onChange={update('name')} fullWidth required />
              <Typography variant="body2">
                Enterprise Priorities are grouping lanes. Ownership and KPI accountability belong to each Key Objective.
              </Typography>
              <Stack gap={1.25}>
                {form.objectiveDrafts.map((draft, index) => (
                  <Box key={draft.id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1} sx={{ mb: 1 }}>
                      <Typography variant="h3">Key Objective {index + 1}</Typography>
                      {form.objectiveDrafts.length > 1 && (
                        <Tooltip title={`Remove Key Objective ${index + 1}`}>
                          <IconButton aria-label={`Remove Key Objective ${index + 1}`} onClick={() => removeObjectiveDraft(draft.id)} size="small">
                            <DeleteOutlineIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                    <Stack gap={1.25}>
                      <TextField label="Key Objective" value={draft.title} onChange={updateObjectiveDraft(draft.id, 'title')} fullWidth required />
                      <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.25}>
                        <TextField select label="Objective Owner" value={draft.ownerId} onChange={updateObjectiveDraft(draft.id, 'ownerId')} fullWidth required>
                          {users.map((candidate) => <MenuItem key={candidate.id} value={candidate.id}>{candidate.name} - {candidate.department}</MenuItem>)}
                        </TextField>
                        <TextField select label="Objective Status" value={draft.status} onChange={updateObjectiveDraft(draft.id, 'status')} fullWidth>
                          {roadmapStatusOptions.map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
                        </TextField>
                      </Stack>
                      <TextField
                        label="KPI / Success Measure"
                        value={draft.kpiTitle}
                        onChange={updateObjectiveDraft(draft.id, 'kpiTitle')}
                        helperText="Describe what will be tracked manually for this objective."
                        fullWidth
                        required
                        multiline
                        minRows={2}
                      />
                      <TextField
                        label="End Target / Desired Result"
                        value={draft.kpiTarget}
                        onChange={updateObjectiveDraft(draft.id, 'kpiTarget')}
                        helperText={`Describe the intended result by the end of ${reportingPeriod.label}.`}
                        fullWidth
                        required
                        multiline
                        minRows={2}
                      />
                    </Stack>
                  </Box>
                ))}
                <Button startIcon={<AddIcon />} onClick={addObjectiveDraft} variant="outlined">Add Key Objective</Button>
              </Stack>
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
                  {roadmapStatusOptions.map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
                </TextField>
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
                <TextField label="Department" value={form.department} onChange={update('department')} fullWidth />
                <TextField label="Workplan Access Team" value={form.workplanAccess} onChange={update('workplanAccess')} fullWidth />
              </Stack>
              <TextField
                label="KPI / Success Measure"
                value={form.kpiTitle}
                onChange={update('kpiTitle')}
                helperText="Describe what will be tracked manually for this objective."
                fullWidth
                required
                multiline
                minRows={2}
              />
              <TextField
                label="End Target / Desired Result"
                value={form.kpiTarget}
                onChange={update('kpiTarget')}
                helperText={`Describe the intended result by the end of ${reportingPeriod.label}.`}
                fullWidth
                required
                multiline
                minRows={2}
              />
              <TextField label="Workplan Title" value={form.workplanTitle} onChange={update('workplanTitle')} fullWidth />
              <TextField label="Workplan Summary" value={form.workplanSummary} onChange={update('workplanSummary')} fullWidth multiline minRows={2} />
              <TextField label="Notes" value={form.notes} onChange={update('notes')} fullWidth multiline minRows={2} />
            </>
          )}

          {editor.type === 'kpi' && (
            <>
              <TextField label="KPI / Success Measure" value={form.title} onChange={update('title')} fullWidth required multiline minRows={2} />
              <TextField label="End Target / Desired Result" value={form.target} onChange={update('target')} fullWidth multiline minRows={2} />
              <TextField label="Current Progress Note" value={form.currentLabel} onChange={update('currentLabel')} fullWidth multiline minRows={2} />
              <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
                <TextField type="number" label="Progress" value={form.progress} onChange={update('progress')} fullWidth inputProps={{ min: 0, max: 100 }} />
                <TextField select label="Status" value={form.status} onChange={update('status')} fullWidth>
                  {roadmapStatusOptions.map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
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
        <Button variant="contained" onClick={() => onSave({ ...form, user })} disabled={editor.type === 'priority' ? !priorityReady : editor.type === 'objective' ? !objectiveReady : !form.title.trim()}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const RoadmapDetailDialog = ({ canManage, onClose, onDeleteKpi, onDeleteObjective, onDeletePriority, onOpenEditor, open, pillar, reportingPeriod }) => (
  <Dialog aria-labelledby="roadmap-detail-dialog-title" open={open} onClose={onClose} maxWidth="lg" fullWidth>
    <DialogTitle id="roadmap-detail-dialog-title">
      <Stack direction={{ xs: 'column', md: 'row' }} gap={1} justifyContent="space-between">
        <Box>
          <Typography variant="caption" color="primary">{reportingPeriod.label} Roadmap - {reportingPeriod.theme}</Typography>
          <Typography variant="h2">{pillar?.name}</Typography>
        </Box>
        {canManage && (
          <Button startIcon={<AddIcon />} variant="contained" title={`Add Enterprise Priority for ${pillar?.name}`} onClick={() => onOpenEditor('priority', 'create', { pillar })}>
            Add Enterprise Priority
          </Button>
        )}
      </Stack>
    </DialogTitle>
    <DialogContent>
      <Stack gap={1.5} sx={{ py: 1 }}>
        {(pillar?.priorityItems || []).map((priority) => (
          <Box key={priority.id} sx={{ border: '1px solid', borderColor: 'primary.light', borderRadius: 1, p: 1.5 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} gap={1} justifyContent="space-between">
              <Box>
                <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
                  <Typography variant="h3">{priority.name}</Typography>
                  <Chip label={getPriorityRollupStatus(priority)} color={statusColor[getPriorityRollupStatus(priority)] || 'default'} size="small" />
                  <Chip label={reportingPeriod.label} variant="outlined" size="small" />
                </Stack>
                <Typography variant="body2" sx={{ mt: 0.75 }}>
                  {priority.keyObjectives?.length || 0} Key Objectives with individual owners and KPI targets
                </Typography>
              </Box>
              {canManage && (
                <Stack direction="row" gap={0.5}>
                  <Tooltip title="Edit priority"><IconButton aria-label={`Edit ${priority.name}`} onClick={() => onOpenEditor('priority', 'edit', { pillar, priority })}><EditOutlinedIcon /></IconButton></Tooltip>
                  <Tooltip title="Delete priority"><IconButton aria-label={`Delete ${priority.name}`} onClick={() => onDeletePriority(priority.id)}><DeleteOutlineIcon /></IconButton></Tooltip>
                  <Button startIcon={<AddIcon />} title={`Add objective for ${priority.name}`} onClick={() => onOpenEditor('objective', 'create', { pillar, priority })}>Objective</Button>
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
  const { selectedPeriod, selectedPeriodId } = useReportingPeriod();
  const {
    departmentWorkplans,
    enterprisePriorities,
    queuedTasks,
    setEnterprisePriorities,
    strategicPlan,
    users,
  } = useOperatingData();
  const [selectedPillarId, setSelectedPillarId] = useState(null);
  const [editor, setEditor] = useState({ open: false, type: null, mode: 'create', form: {} });
  const canManageRoadmap = user.workingGroup === 'ELT';

  const periodPriorities = enterprisePriorities.filter((priority) => (
    recordMatchesReportingPeriod(priority, selectedPeriodId)
  ));
  const flatPriorities = flattenPriorities(periodPriorities);
  const decoratedWorkplans = departmentWorkplans.map((workplan) => decorateWorkplan(
    workplan,
    enterprisePriorities,
    { strategicPillars: strategicPlan.pillars, users },
  ));
  const pillarSummaries = strategicPlan.pillars.map((pillar) => {
    const pillarWorkplans = decoratedWorkplans.filter((workplan) => workplan.objectives.some((objective) => objective.strategicPillarId === pillar.id));
    const pillarPriorities = flatPriorities.filter((priority) => priority.strategicPillarId === pillar.id);
    const pillarActions = queuedTasks.filter((item) => item.strategicPillarId === pillar.id);
    const attentionCount = pillarWorkplans.filter((workplan) => ['Watch', 'Alert'].includes(workplan.status)).length;

    return {
      ...pillar,
      actions: pillarActions.length,
      attentionCount,
      priorityItems: pillarPriorities.filter((priority) => priority.company),
      priorities: pillarPriorities.length,
      progress: getAverageProgress(pillarWorkplans),
      workplans: pillarWorkplans,
    };
  });

  const selectedPillar = pillarSummaries.find((pillar) => pillar.id === selectedPillarId) || null;
  const alignedWorkplans = [...decoratedWorkplans]
    .sort((a, b) => String(a.due).localeCompare(String(b.due)))
    .slice(0, 7);

  const openEditor = (type, mode, context = {}) => {
    const base = getBlankForm(type, context.pillar, user, context.priority?.id, context.objective?.id);
    const form = type === 'priority' && context.priority
      ? { ...base, ...context.priority, objectiveDrafts: objectiveDraftsFromPriority(context.priority, user) }
      : type === 'objective' && context.objective
        ? {
          ...base,
          ...context.objective,
          kpiTarget: context.objective.kpis?.[0]?.target || '',
          kpiTitle: context.objective.kpis?.[0]?.title || '',
          ownerId: context.objective.owner?.id || user.id,
          priorityId: context.priority?.id,
        }
        : type === 'kpi' && context.kpi
          ? { ...base, ...context.kpi, priorityId: context.priority?.id, objectiveId: context.objective?.id }
          : { ...base, priorityId: context.priority?.id, objectiveId: context.objective?.id };

    setEditor({ open: true, type, mode, form });
  };

  const closeEditor = () => setEditor({ open: false, type: null, mode: 'create', form: {} });

  const saveEditor = (form) => {
    setEnterprisePriorities((current) => {
      if (form.type === 'priority') {
        const keyObjectives = form.objectiveDrafts.map((draft) => {
          const owner = users.find((candidate) => candidate.id === draft.ownerId) || users[0];
          return {
            id: draft.id.startsWith('objective-draft-') ? createRecordId() : draft.id,
            title: draft.title,
            owner,
            ownerIds: [owner.id],
            department: owner.department,
            status: draft.status,
            workplanTitle: '',
            workplanAccess: owner.department,
            workplanSummary: '',
            notes: '',
            kpis: [{
              id: draft.kpiId || createRecordId(),
              title: draft.kpiTitle,
              target: draft.kpiTarget,
              currentLabel: '',
              progress: 0,
              status: draft.status,
            }],
          };
        });
        const nextPriority = {
          id: form.id || createRecordId(),
          name: form.name,
          type: 'ROLLUP',
          roadmapStatus: roadmapStatusFromObjectives(keyObjectives),
          company: true,
          reportingPeriodId: selectedPeriodId,
          strategicPlan: strategicPlan.name,
          strategicPillarId: form.strategicPillarId,
          strategicPillar: strategicPlan.pillars.find((pillar) => pillar.id === form.strategicPillarId)?.name,
          description: `${selectedPeriod.label} Enterprise Priority aligned to ${form.strategicPillarId}.`,
          keyObjectives,
          children: [],
        };
        return form.id ? current.map((priority) => (priority.id === form.id ? { ...priority, ...nextPriority } : priority)) : [nextPriority, ...current];
      }

      if (form.type === 'objective') {
        const owner = users.find((candidate) => candidate.id === form.ownerId) || users[0];
        const objective = {
          id: form.id || createRecordId(),
          title: form.title,
          owner,
          ownerIds: Array.from(new Set([owner.id, user.id])),
          department: form.department,
          status: form.status,
          workplanTitle: form.workplanTitle,
          workplanAccess: form.workplanAccess,
          workplanSummary: form.workplanSummary,
          notes: form.notes,
          kpis: [{
            id: form.kpis?.[0]?.id || createRecordId(),
            title: form.kpiTitle,
            target: form.kpiTarget,
            currentLabel: form.kpis?.[0]?.currentLabel || '',
            progress: form.kpis?.[0]?.progress || 0,
            status: form.status,
          }],
        };
        return current.map((priority) => {
          if (priority.id !== form.priorityId) return priority;
          const objectives = priority.keyObjectives || [];
          const keyObjectives = form.id ? objectives.map((item) => (item.id === form.id ? { ...item, ...objective } : item)) : [objective, ...objectives];
          return { ...priority, keyObjectives };
        });
      }

      const kpi = {
        id: form.id || createRecordId(),
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

  const deletePriority = (priorityId) => setEnterprisePriorities((current) => current.filter((priority) => priority.id !== priorityId));
  const deleteObjective = (priorityId, objectiveId) => setEnterprisePriorities((current) => current.map((priority) => (
    priority.id === priorityId ? { ...priority, keyObjectives: (priority.keyObjectives || []).filter((objective) => objective.id !== objectiveId) } : priority
  )));
  const deleteKpi = (priorityId, objectiveId, kpiId) => setEnterprisePriorities((current) => current.map((priority) => (
    priority.id === priorityId
      ? { ...priority, keyObjectives: (priority.keyObjectives || []).map((objective) => (objective.id === objectiveId ? { ...objective, kpis: (objective.kpis || []).filter((kpi) => kpi.id !== kpiId) } : objective)) }
      : priority
  )));

  return (
    <Box sx={{ mb: 3 }}>
      <Box data-tour-id="strategic-plan-header" sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: { xs: 2, md: 2.5 }, mb: 2 }}>
        <Stack direction={{ xs: 'column', lg: 'row' }} justifyContent="space-between" gap={2}>
          <Box sx={{ maxWidth: 780 }}>
            <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 800, textTransform: 'uppercase' }}>
              Strategic Plan {strategicPlan.timeframe}
            </Typography>
            <Typography variant="h1" sx={{ mt: 0.5 }}>{strategicPlan.name}</Typography>
            <Typography variant="h2" sx={{ mt: 1 }}>{selectedPeriod.label} Roadmap: {selectedPeriod.theme}</Typography>
            <Typography variant="body2" sx={{ mt: 0.75 }}>
              ELT defines strategic pillars, Enterprise Priorities, key objectives, KPI targets, and accountable Director-owners. OLT contributes progress through departmental workplans and assigned work.
            </Typography>
          </Box>
          <Stack direction="row" gap={1} flexWrap="wrap" alignItems="flex-start">
            <Chip icon={<AccountTreeOutlinedIcon />} label={`${strategicPlan.pillars.length} pillars`} color="primary" />
            <Chip icon={<FlagOutlinedIcon />} label={`${departmentWorkplans.length} workplans`} variant="outlined" />
            <Chip icon={<TaskAltOutlinedIcon />} label={`${queuedTasks.length} queued tasks`} variant="outlined" />
          </Stack>
        </Stack>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', xl: 'repeat(3, 1fr)' }, gap: 1.5, mb: 2 }}>
        {pillarSummaries.map((pillar) => (
          <Box
            data-tour-id={pillar.order === 1 ? 'strategic-pillar-card' : undefined}
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
            aria-label={`Open ${pillar.name} ${selectedPeriod.label} roadmap`}
            title={`Open ${pillar.name} ${selectedPeriod.label} roadmap`}
            sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: pillar.attentionCount ? 'warning.light' : 'divider', borderRadius: 1, p: 1.5, cursor: 'pointer', '&:hover': { borderColor: 'primary.main', boxShadow: 2 } }}
          >
            <Stack direction="row" justifyContent="space-between" gap={1} alignItems="flex-start">
              <Chip label={`Pillar ${pillar.order}`} color="primary" size="small" />
              <Chip label={pillar.attentionCount ? `${pillar.attentionCount} need focus` : 'Clear'} color={pillar.attentionCount ? 'warning' : 'success'} size="small" variant={pillar.attentionCount ? 'filled' : 'outlined'} />
            </Stack>
            <Typography variant="h3" sx={{ mt: 1 }}>{pillar.name}</Typography>
            <Box sx={{ mt: 1.5 }}>
              <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase' }}>{selectedPeriod.label} Priorities</Typography>
              <Stack gap={0.75} sx={{ mt: 0.75 }}>
                {pillar.priorityItems.length ? (
                  pillar.priorityItems.map((priority) => (
                    <Box key={priority.id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
                        <Typography variant="body2" color="text.primary" fontWeight={800}>{priority.name}</Typography>
                        <Stack direction="row" gap={0.5}>
                          <Chip label={selectedPeriod.label} size="small" variant="outlined" />
                          <Chip label={`${priority.keyObjectives?.length || 0} objectives`} size="small" variant="outlined" />
                        </Stack>
                      </Stack>
                      <Typography variant="caption">{priority.keyObjectives?.length || 0} objective owners</Typography>
                    </Box>
                  ))
                ) : (
                  <Chip label={`No ${selectedPeriod.label} Enterprise Priority set`} size="small" variant="outlined" />
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
          </Box>
        ))}
      </Box>

      <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={1} sx={{ mb: 1.5 }}>
          <Box>
            <Typography variant="h3">Departmental Workplan Alignment</Typography>
            <Typography variant="body2">Workplans inherit reporting context through their linked Enterprise Priorities.</Typography>
          </Box>
          <Chip label="Organization-wide view" color="primary" variant="outlined" />
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
        reportingPeriod={selectedPeriod}
      />
      {editor.open && (
        <RoadmapEditorDialog
          editor={editor}
          onClose={closeEditor}
          onSave={saveEditor}
          reportingPeriod={selectedPeriod}
          selectedPillar={selectedPillar}
          user={user}
        />
      )}
    </Box>
  );
};

export default StrategicPlanSection;
