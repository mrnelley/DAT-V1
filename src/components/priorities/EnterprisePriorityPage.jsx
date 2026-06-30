import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useOperatingData } from '../../context/OperatingDataContext';
import { q2Roadmap } from '../../data/mockData';
import { useAuth } from '../../hooks/useAuth';
import PageWrapper from '../layout/PageWrapper';
import EmptyState from '../shared/EmptyState';
import UserAvatar from '../shared/UserAvatar';

const statusMeta = {
  Alert: { border: '#b03a34', color: 'error', icon: ErrorOutlineOutlinedIcon, label: 'Off Track', order: 0, tone: 'error.main' },
  Complete: { border: '#006e5c', color: 'success', icon: CheckCircleOutlinedIcon, label: 'Complete', order: 2, tone: 'success.main' },
  Completed: { border: '#006e5c', color: 'success', icon: CheckCircleOutlinedIcon, label: 'Complete', order: 2, tone: 'success.main' },
  'Needs Attention': { border: '#f1ac49', color: 'warning', icon: WarningAmberOutlinedIcon, label: 'Needs Attention', order: 1, tone: 'warning.main' },
  'Off Course': { border: '#b03a34', color: 'error', icon: ErrorOutlineOutlinedIcon, label: 'Off Track', order: 0, tone: 'error.main' },
  'On Course': { border: '#006e5c', color: 'success', icon: CheckCircleOutlinedIcon, label: 'On Track', order: 2, tone: 'success.main' },
  Paused: { border: '#5a6475', color: 'default', icon: WarningAmberOutlinedIcon, label: 'Paused', order: 3, tone: 'text.secondary' },
  Steady: { border: '#006e5c', color: 'success', icon: CheckCircleOutlinedIcon, label: 'On Track', order: 2, tone: 'success.main' },
  Watch: { border: '#f1ac49', color: 'warning', icon: WarningAmberOutlinedIcon, label: 'Needs Attention', order: 1, tone: 'warning.main' },
};

const getStatusMeta = (status) => statusMeta[status] || statusMeta.Watch;

const clampProgress = (value) => Math.min(100, Math.max(0, Math.round(Number(value) || 0)));

const getObjectiveProgress = (objective) => {
  const kpis = objective.kpis || [];
  if (!kpis.length) return 0;
  return clampProgress(kpis.reduce((total, kpi) => total + Number(kpi.progress || 0), 0) / kpis.length);
};

const getPriorityProgress = (priority) => {
  const kpis = (priority.keyObjectives || []).flatMap((objective) => objective.kpis || []);
  if (!kpis.length) return clampProgress(priority.percent);
  return clampProgress(kpis.reduce((total, kpi) => total + Number(kpi.progress || 0), 0) / kpis.length);
};

const priorityStatus = (priority) => {
  const objectiveStatuses = (priority.keyObjectives || []).map((objective) => objective.status);
  if (!objectiveStatuses.length) return 'No Data';
  if (objectiveStatuses.some((status) => ['Alert', 'Off Course'].includes(status))) return 'Alert';
  if (objectiveStatuses.some((status) => ['Watch', 'Needs Attention'].includes(status))) return 'Watch';
  if (objectiveStatuses.every((status) => ['Complete', 'Completed'].includes(status))) return 'Complete';
  return 'Steady';
};

const matchesPriority = (value, priority) => value?.toLowerCase().includes(priority.name.toLowerCase());

const getRelatedWork = (priority, departmentWorkplans, queuedTasks, stucks, weeklyEntries) => {
  const objectiveTitles = new Set((priority.keyObjectives || []).map((objective) => objective.workplanTitle));
  const relatedWorkplans = departmentWorkplans.filter((workplan) => (
    (workplan.objectives || []).some((objective) => objective.enterprisePriorityId === priority.id)
    || objectiveTitles.has(workplan.title)
  ));
  const relatedWeekly = weeklyEntries.filter((item) => (
    item.priorityId === priority.id
    || matchesPriority(item.alignedPriorityLabel, priority)
  ));
  const weeklyCommitments = relatedWeekly.map((item) => ({
    ...item,
    description: item.title,
  }));
  const weeklyActions = relatedWeekly.flatMap((entry) => (entry.tasks || []).map((task) => ({
    ...task,
    department: entry.department,
    description: task.title,
  })));
  const relatedActions = [
    ...queuedTasks.filter((item) => item.priority === priority.name),
    ...weeklyCommitments,
    ...weeklyActions,
  ];
  const ownerIds = new Set((priority.keyObjectives || []).map((objective) => objective.owner?.id).filter(Boolean));
  const relatedStucks = stucks.filter((stuck) => (
    ownerIds.has(stuck.personStuck?.id)
    || ownerIds.has(stuck.helpFrom?.id)
  ));

  return {
    relatedActions,
    relatedStucks,
    relatedWeekly,
    relatedWorkplans,
  };
};

const EditPriorityDialog = ({ form, open, onClose, onSave, onUpdate }) => (
  <Dialog aria-labelledby="edit-enterprise-priority-title" open={open} onClose={onClose} maxWidth="sm" fullWidth>
    <DialogTitle id="edit-enterprise-priority-title">Edit Enterprise Priority</DialogTitle>
    <DialogContent sx={{ pt: 1 }}>
      <Stack gap={2} sx={{ mt: 1 }}>
        <TextField label="Priority Name" value={form.name} onChange={onUpdate('name')} fullWidth required />
        <TextField label="Executive Note" value={form.note} onChange={onUpdate('note')} fullWidth multiline minRows={3} />
      </Stack>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Cancel</Button>
      <Button variant="contained" onClick={onSave}>Save</Button>
    </DialogActions>
  </Dialog>
);

const StatTile = ({ helper, label, value }) => (
  <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.25 }}>
    <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase' }}>{label}</Typography>
    <Typography variant="h2" sx={{ mt: 0.35 }}>{value}</Typography>
    <Typography variant="body2">{helper}</Typography>
  </Box>
);

const EnterprisePriorityPage = () => {
  const { priorityId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    departmentWorkplans,
    enterprisePriorities,
    queuedTasks,
    saveEnterprisePriority,
    stucks,
    weeklyPriorityEntriesByWeek,
  } = useOperatingData();
  const sourcePriority = enterprisePriorities.find((candidate) => candidate.id === priorityId);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState(() => ({
    name: sourcePriority?.name || '',
    note: sourcePriority?.description || '',
  }));

  const priority = sourcePriority;
  const weeklyEntries = useMemo(
    () => Object.values(weeklyPriorityEntriesByWeek).flat(),
    [weeklyPriorityEntriesByWeek],
  );
  const related = useMemo(() => (
    priority ? getRelatedWork(priority, departmentWorkplans, queuedTasks, stucks, weeklyEntries) : null
  ), [departmentWorkplans, priority, queuedTasks, stucks, weeklyEntries]);

  if (!priority) {
    return (
      <PageWrapper>
        <EmptyState
          actionLabel="Back to Organization Dashboard"
          body="That Enterprise Priority is not available in the current roadmap data."
          icon={<WarningAmberOutlinedIcon />}
          onAction={() => navigate('/dashboard/organization')}
          title="Priority Not Found"
        />
      </PageWrapper>
    );
  }

  const status = priorityStatus(priority);
  const meta = getStatusMeta(status);
  const StatusIcon = meta.icon;
  const progress = getPriorityProgress(priority);
  const objectives = priority.keyObjectives || [];
  const objectiveOwners = Array.from(new Map(objectives.map((objective) => [objective.owner?.id, objective.owner])).values()).filter(Boolean);
  const canEdit = user.workingGroup === 'ELT';
  const objectiveAverage = objectives.length
    ? clampProgress(objectives.reduce((total, objective) => total + getObjectiveProgress(objective), 0) / objectives.length)
    : progress;

  const updateForm = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  const saveEdit = () => {
    saveEnterprisePriority({
      ...priority,
      description: form.note,
      name: form.name,
    });
    setEditOpen(false);
  };

  return (
    <PageWrapper>
      <Stack gap={2}>
        <Stack direction={{ xs: 'column', lg: 'row' }} justifyContent="space-between" gap={2}>
          <Box>
            <Button startIcon={<ArrowBackOutlinedIcon />} onClick={() => navigate('/dashboard/organization')} sx={{ mb: 1 }}>
              Organization Dashboard
            </Button>
            <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
              <Chip label={q2Roadmap.quarter} color="primary" />
              <Chip label={priority.strategicPillar} variant="outlined" />
              <Chip icon={<StatusIcon />} label={meta.label} color={meta.color} />
            </Stack>
            <Typography variant="h1" sx={{ mt: 1 }}>{priority.name}</Typography>
            <Typography variant="body1" sx={{ mt: 0.75, color: 'text.primary', maxWidth: 880 }}>
              {objectives.length} Key Objectives with independently owned KPI targets
            </Typography>
          </Box>
          <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap" sx={{ alignSelf: { lg: 'flex-start' } }}>
            {objectiveOwners.slice(0, 4).map((owner) => <UserAvatar key={owner.id} user={owner} size="md" />)}
            <Box>
              <Typography variant="body1" fontWeight={800}>{objectiveOwners.length} objective owner{objectiveOwners.length === 1 ? '' : 's'}</Typography>
              <Typography variant="caption">Accountability is assigned at the Key Objective level</Typography>
            </Box>
            {canEdit && (
            <Button variant="contained" startIcon={<EditOutlinedIcon />} title={`Edit ${priority.name}`} onClick={() => setEditOpen(true)} sx={{ ml: 1 }}>
                Edit
              </Button>
            )}
          </Stack>
        </Stack>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, minmax(0, 1fr))' }, gap: 1.25 }}>
          <StatTile label="Priority Health" value={meta.label} helper="Current executive signal" />
          <StatTile label="Percent to Goal" value={`${progress}%`} helper="Average KPI progress" />
          <StatTile label="Key Objectives" value={objectives.length} helper="Independently owned outcomes" />
          <StatTile label="Department Plans" value={related.relatedWorkplans.length} helper="Plans connected to this priority" />
        </Box>

        <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderLeft: '6px solid', borderLeftColor: meta.border, borderRadius: 1, p: { xs: 1.5, md: 2 } }}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={1.5} sx={{ mb: 1.5 }}>
            <Box>
              <Typography variant="overline" color="primary">Executive Signal</Typography>
              <Typography variant="h2">Enterprise Priority health and goal progress</Typography>
            </Box>
            <Chip label={`${objectiveAverage}% average objective progress`} color={meta.color} variant="outlined" />
          </Stack>
          <LinearProgress value={progress} variant="determinate" sx={{ bgcolor: 'divider', '& .MuiLinearProgress-bar': { bgcolor: meta.tone } }} />
          <Typography variant="body2" color="text.primary" sx={{ mt: 1 }}>{form.note || priority.description}</Typography>
        </Box>

        <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: { xs: 1.5, md: 2 } }}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={1.5} sx={{ mb: 1.5 }}>
            <Box>
              <Typography variant="overline" color="primary">Departmental Plans</Typography>
              <Typography variant="h2">Plans and objectives connected to this priority</Typography>
            </Box>
            <Chip icon={<OpenInNewOutlinedIcon />} label="Click edit only when changing content" variant="outlined" />
          </Stack>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: 'repeat(2, minmax(0, 1fr))' }, gap: 1.25 }}>
            {objectives.map((objective) => {
              const objectiveMeta = getStatusMeta(objective.status);
              const objectiveProgress = getObjectiveProgress(objective);
              const workplan = related.relatedWorkplans.find((candidate) => candidate.title === objective.workplanTitle);
              return (
                <Box key={objective.id} sx={{ border: '1px solid', borderColor: 'divider', borderTop: '5px solid', borderTopColor: objectiveMeta.border, borderRadius: 1, p: 1.25 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
                    <Box sx={{ minWidth: 0 }}>
                      <Chip label={objectiveMeta.label} color={objectiveMeta.color} size="small" />
                      <Typography variant="body1" color="text.primary" fontWeight={800} sx={{ mt: 0.75 }}>{objective.title}</Typography>
                      <Typography variant="body2">{objective.workplanSummary}</Typography>
                    </Box>
                    <UserAvatar user={objective.owner} size="sm" />
                  </Stack>
                  <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mt: 1 }}>
                    <Chip label={objective.department} size="small" variant="outlined" />
                    <Chip label={objective.workplanTitle} size="small" variant="outlined" />
                    {workplan && <Chip label={`${workplan.objectives?.length || 0} department objectives`} size="small" variant="outlined" />}
                  </Stack>
                  <Stack direction="row" justifyContent="space-between" sx={{ mt: 1, mb: 0.5 }}>
                    <Typography variant="caption">Progress</Typography>
                    <Typography variant="caption" color={objectiveMeta.tone} fontWeight={800}>{objectiveProgress}%</Typography>
                  </Stack>
                  <LinearProgress value={objectiveProgress} variant="determinate" sx={{ '& .MuiLinearProgress-bar': { bgcolor: objectiveMeta.tone } }} />
                </Box>
              );
            })}
          </Box>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '1.15fr 0.85fr' }, gap: 2, alignItems: 'start' }}>
          <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: { xs: 1.5, md: 2 } }}>
            <Stack direction="row" justifyContent="space-between" gap={1} sx={{ mb: 1.5 }}>
              <Box>
                <Typography variant="overline" color="primary">Tasks</Typography>
                <Typography variant="h2">Weekly commitments and related actions</Typography>
              </Box>
              <Chip icon={<TaskAltOutlinedIcon />} label={`${related.relatedActions.length} items`} color="primary" variant="outlined" />
            </Stack>
            <Stack gap={1}>
              {related.relatedActions.map((item) => (
                <Box key={item.id} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 180px 120px' }, gap: 1, alignItems: 'center', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1 }}>
                  <Box>
                    <Typography variant="body2" color="text.primary" fontWeight={800}>{item.description}</Typography>
                    <Typography variant="caption">{item.department}</Typography>
                  </Box>
                  <Stack direction="row" gap={1} alignItems="center">
                    <UserAvatar user={item.owner} size="sm" />
                    <Typography variant="body2" color="text.primary">{item.owner.name}</Typography>
                  </Stack>
                  <Stack direction="row" gap={0.5} flexWrap="wrap">
                    <Chip label={item.status} size="small" />
                    <Chip label={item.due} size="small" variant="outlined" />
                  </Stack>
                </Box>
              ))}
              {!related.relatedActions.length && <Typography variant="body2">No actions are currently linked to this priority.</Typography>}
            </Stack>
          </Box>

          <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: { xs: 1.5, md: 2 } }}>
            <Typography variant="overline" color="primary">Blockers</Typography>
            <Typography variant="h2" sx={{ mb: 1.5 }}>Stucks tied to owners</Typography>
            <Stack gap={1}>
              {related.relatedStucks.map((stuck) => (
                <Box key={stuck.id} sx={{ border: '1px solid', borderColor: 'divider', borderLeft: '5px solid', borderLeftColor: 'warning.main', borderRadius: 1, p: 1 }}>
                  <Typography variant="body2" color="text.primary" fontWeight={800}>{stuck.description}</Typography>
                  <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mt: 0.75 }}>
                    <Chip label={`${stuck.personStuck.name} stuck`} size="small" variant="outlined" />
                    <Chip label={`Help: ${stuck.helpFrom.name}`} size="small" color="warning" variant="outlined" />
                  </Stack>
                </Box>
              ))}
              {!related.relatedStucks.length && <Typography variant="body2">No owner-linked stucks are currently open for this priority.</Typography>}
            </Stack>
          </Box>
        </Box>
      </Stack>

      {canEdit && (
        <EditPriorityDialog
          form={form}
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onSave={saveEdit}
          onUpdate={updateForm}
        />
      )}
    </PageWrapper>
  );
};

export default EnterprisePriorityPage;
