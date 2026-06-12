import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useOperatingData } from '../../context/OperatingDataContext';
import { users } from '../../data/mockData';
import { useAuth } from '../../hooks/useAuth';
import {
  clampProgress,
  decorateWorkplan,
  getDepartmentLead,
  workplanStatuses,
} from '../../utils/workplans';
import PageWrapper from '../layout/PageWrapper';
import UserAvatar from '../shared/UserAvatar';

const statusColor = {
  Alert: 'error',
  Completed: 'success',
  Rescheduled: 'default',
  Steady: 'success',
  Watch: 'warning',
};

const departments = Array.from(new Set(users.map((user) => user.department))).sort();

const formatDate = (date) => date
  ? new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
  : 'No date';

const blankObjective = (user, strategicPlan) => ({
  description: '',
  due: `${new Date().getFullYear()}-12-31`,
  enterprisePriorityId: '',
  id: `department-objective-${Date.now()}-${Math.random()}`,
  ownerId: user.id,
  progress: 0,
  status: 'Steady',
  strategicPillarId: strategicPlan.pillars[0]?.id || '',
  title: '',
});

const defaultForm = (user, strategicPlan) => {
  const lead = getDepartmentLead(user.department, user);
  return {
    department: user.department,
    id: '',
    leadId: lead.id,
    objectives: [blankObjective(user, strategicPlan)],
    year: String(new Date().getFullYear()),
  };
};

const toForm = (workplan, user, strategicPlan) => {
  if (!workplan) return defaultForm(user, strategicPlan);
  return {
    department: workplan.department,
    id: workplan.id,
    leadId: workplan.lead.id,
    objectives: workplan.objectives.map((objective) => ({
      ...objective,
      ownerId: objective.owner?.id || objective.ownerId || user.id,
    })),
    year: String(workplan.year),
  };
};

const canManageWorkplan = (workplan, user) => (
  workplan.lead?.id === user.id || workplan.ownerIds?.includes(user.id)
);

const StatTile = ({ helper, label, value }) => (
  <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
    <Typography variant="caption" color="text.secondary">{label}</Typography>
    <Typography variant="h3" sx={{ mt: 0.25 }}>{value}</Typography>
    <Typography variant="body2" sx={{ mt: 0.5 }}>{helper}</Typography>
  </Box>
);

const WorkplanDialog = ({ enterprisePriorities, item, onClose, onSave, open, strategicPlan, user }) => {
  const [form, setForm] = useState(() => toForm(item, user, strategicPlan));

  useEffect(() => {
    if (open) setForm(toForm(item, user, strategicPlan));
  }, [item, open, strategicPlan, user]);

  const update = (field) => (event) => {
    const value = event.target.value;
    setForm((current) => {
      if (field !== 'department') return { ...current, [field]: value };
      return { ...current, department: value, leadId: getDepartmentLead(value, user).id };
    });
  };
  const updateObjective = (id, field) => (event) => setForm((current) => ({
    ...current,
    objectives: current.objectives.map((objective) => (
      objective.id === id ? { ...objective, [field]: event.target.value } : objective
    )),
  }));
  const addObjective = () => setForm((current) => ({
    ...current,
    objectives: [...current.objectives, blankObjective(user, strategicPlan)],
  }));
  const removeObjective = (id) => setForm((current) => ({
    ...current,
    objectives: current.objectives.filter((objective) => objective.id !== id),
  }));
  const ready = form.department
    && form.year
    && form.objectives.length > 0
    && form.objectives.every((objective) => objective.title.trim() && objective.strategicPillarId && objective.ownerId);

  const save = () => {
    if (!ready) return;
    const lead = getDepartmentLead(form.department, user);
    onSave({
      department: form.department,
      id: form.id,
      lead,
      objectives: form.objectives.map((objective) => ({
        ...objective,
        description: objective.description.trim(),
        enterprisePriorityId: objective.enterprisePriorityId || null,
        owner: users.find((candidate) => candidate.id === objective.ownerId) || user,
        progress: clampProgress(objective.progress),
        title: objective.title.trim(),
      })),
      ownerIds: [lead.id],
      title: `${form.year} ${form.department.toUpperCase()} WORKPLAN`,
      year: form.year,
    });
  };

  return (
    <Dialog aria-labelledby="workplan-dialog-title" open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle id="workplan-dialog-title">{item ? 'Edit Department Workplan' : 'Add Department Workplan'}</DialogTitle>
      <DialogContent>
        <Stack gap={2} sx={{ pt: 1 }}>
          <Typography variant="body2">
            The workplan is the department&apos;s annual container. Strategic alignment and Enterprise Priority relationships are validated on each Department Objective.
          </Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} gap={2}>
            <TextField label="Year" value={form.year} onChange={update('year')} fullWidth required />
            <TextField select label="Department" value={form.department} onChange={update('department')} fullWidth required>
              {departments.map((department) => <MenuItem key={department} value={department}>{department}</MenuItem>)}
            </TextField>
            <TextField label="Workplan Lead" value={users.find((candidate) => candidate.id === form.leadId)?.name || ''} fullWidth InputProps={{ readOnly: true }} />
          </Stack>
          <TextField label="Generated Title" value={`${form.year} ${form.department.toUpperCase()} WORKPLAN`} fullWidth InputProps={{ readOnly: true }} />

          <Stack gap={1.5}>
            {form.objectives.map((objective, index) => (
              <Box key={objective.id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1} sx={{ mb: 1.25 }}>
                  <Typography variant="h3">Department Objective {index + 1}</Typography>
                  {form.objectives.length > 1 && (
                    <Tooltip title={`Remove Department Objective ${index + 1}`}>
                      <IconButton aria-label={`Remove Department Objective ${index + 1}`} onClick={() => removeObjective(objective.id)}>
                        <DeleteOutlineIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </Stack>
                <Stack gap={1.25}>
                  <TextField label="Department Objective" value={objective.title} onChange={updateObjective(objective.id, 'title')} fullWidth required />
                  <TextField label="Progress and Challenges" value={objective.description} onChange={updateObjective(objective.id, 'description')} multiline minRows={2} fullWidth />
                  <Stack direction={{ xs: 'column', md: 'row' }} gap={1.25}>
                    <TextField select label="Objective Lead" value={objective.ownerId} onChange={updateObjective(objective.id, 'ownerId')} fullWidth required>
                      {users.map((candidate) => <MenuItem key={candidate.id} value={candidate.id}>{candidate.name} - {candidate.department}</MenuItem>)}
                    </TextField>
                    <TextField select label="Status" value={objective.status} onChange={updateObjective(objective.id, 'status')} fullWidth>
                      {workplanStatuses.map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
                    </TextField>
                    <TextField label="Progress" type="number" value={objective.progress} onChange={updateObjective(objective.id, 'progress')} fullWidth inputProps={{ min: 0, max: 100 }} />
                    <TextField label="Due" type="date" value={objective.due} onChange={updateObjective(objective.id, 'due')} fullWidth InputLabelProps={{ shrink: true }} />
                  </Stack>
                  <Stack direction={{ xs: 'column', md: 'row' }} gap={1.25}>
                    <TextField select label="Strategic Pillar" value={objective.strategicPillarId} onChange={updateObjective(objective.id, 'strategicPillarId')} fullWidth required>
                      {strategicPlan.pillars.map((pillar) => <MenuItem key={pillar.id} value={pillar.id}>{pillar.name}</MenuItem>)}
                    </TextField>
                    <TextField
                      select
                      label="Enterprise Priority"
                      value={objective.enterprisePriorityId || ''}
                      onChange={updateObjective(objective.id, 'enterprisePriorityId')}
                      helperText="Only saved Enterprise Priority records can be linked."
                      fullWidth
                    >
                      <MenuItem value="">No Enterprise Priority link</MenuItem>
                      {enterprisePriorities.map((priority) => <MenuItem key={priority.id} value={priority.id}>{priority.name}</MenuItem>)}
                    </TextField>
                  </Stack>
                </Stack>
              </Box>
            ))}
          </Stack>
          <Button startIcon={<AddIcon />} onClick={addObjective} variant="outlined">Add Department Objective</Button>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={save} disabled={!ready}>Save Department Workplan</Button>
      </DialogActions>
    </Dialog>
  );
};

const WorkplanCard = ({ canManage, enterprisePriorities, onDelete, onEdit, strategicPlan, workplan }) => (
  <Card
    aria-label={canManage ? `Edit workplan ${workplan.title}` : undefined}
    onClick={canManage ? () => onEdit(workplan) : undefined}
    role={canManage ? 'button' : undefined}
    tabIndex={canManage ? 0 : undefined}
    variant="outlined"
    sx={{ borderRadius: 1, cursor: canManage ? 'pointer' : 'default' }}
  >
    <CardContent>
      <Stack direction={{ xs: 'column', md: 'row' }} gap={2} justifyContent="space-between">
        <Box>
          <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mb: 1 }}>
            <Chip label={workplan.department} color="primary" size="small" />
            <Chip label={workplan.status} color={statusColor[workplan.status] || 'default'} size="small" />
            <Chip label={`${workplan.objectives.length} objective${workplan.objectives.length === 1 ? '' : 's'}`} variant="outlined" size="small" />
          </Stack>
          <Typography variant="h3">{workplan.title}</Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>Owned by the department lead; alignment is documented per objective.</Typography>
        </Box>
        <Stack direction="row" alignItems="center" gap={1}>
          <UserAvatar user={workplan.lead} size="sm" />
          <Box>
            <Typography variant="body2" fontWeight={700}>{workplan.lead.name}</Typography>
            <Typography variant="caption">{workplan.lead.role}</Typography>
          </Box>
          {canManage && (
            <Tooltip title="Delete workplan">
              <IconButton aria-label={`Delete workplan ${workplan.title}`} onClick={(event) => { event.stopPropagation(); onDelete(workplan.id); }}>
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </Stack>
      <Stack direction="row" justifyContent="space-between" sx={{ mt: 2, mb: 0.5 }}>
        <Typography variant="caption">Objective rollup</Typography>
        <Typography variant="caption">{workplan.progress}%</Typography>
      </Stack>
      <LinearProgress value={workplan.progress} variant="determinate" />
      <Stack gap={1} sx={{ mt: 2 }}>
        {workplan.objectives.map((objective) => {
          const priorityName = enterprisePriorities.find((priority) => priority.id === objective.enterprisePriorityId)?.name;
          const pillar = strategicPlan.pillars.find((candidate) => candidate.id === objective.strategicPillarId);
          return (
            <Box key={objective.id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.25 }}>
              <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={1}>
                <Box>
                  <Typography variant="body1" fontWeight={800}>{objective.title}</Typography>
                  <Typography variant="body2">{objective.description || 'No progress and challenges note yet.'}</Typography>
                </Box>
                <Stack direction="row" gap={0.5} flexWrap="wrap" alignItems="flex-start">
                  <Chip label={objective.status} color={statusColor[objective.status] || 'default'} size="small" />
                  <Chip label={`${clampProgress(objective.progress)}%`} size="small" variant="outlined" />
                  <Chip label={`Due ${formatDate(objective.due)}`} size="small" variant="outlined" />
                </Stack>
              </Stack>
              <Stack direction="row" gap={0.5} flexWrap="wrap" sx={{ mt: 1 }}>
                <Chip icon={<AccountTreeOutlinedIcon />} label={pillar?.name || 'Pillar not found'} size="small" variant="outlined" />
                {priorityName
                  ? <Chip label={priorityName} color="primary" size="small" variant="outlined" />
                  : <Chip label="No Enterprise Priority link" size="small" variant="outlined" />}
              </Stack>
            </Box>
          );
        })}
      </Stack>
    </CardContent>
  </Card>
);

const WorkplansPage = () => {
  const { user } = useAuth();
  const {
    deleteDepartmentWorkplan,
    departmentWorkplans,
    enterprisePriorities,
    saveDepartmentWorkplan,
    strategicPlan,
  } = useOperatingData();
  const [searchParams, setSearchParams] = useSearchParams();
  const [dialog, setDialog] = useState({ item: null, open: false });
  const [scope, setScope] = useState('all');
  const decoratedWorkplans = useMemo(
    () => departmentWorkplans.map((workplan) => decorateWorkplan(workplan, enterprisePriorities)),
    [departmentWorkplans, enterprisePriorities],
  );

  useEffect(() => {
    if (searchParams.get('new') !== '1') return;
    setDialog({ item: null, open: true });
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('new');
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const visibleWorkplans = decoratedWorkplans
    .filter((workplan) => scope === 'all' || canManageWorkplan(workplan, user))
    .sort((a, b) => a.department.localeCompare(b.department));
  const average = visibleWorkplans.length
    ? Math.round(visibleWorkplans.reduce((total, workplan) => total + workplan.progress, 0) / visibleWorkplans.length)
    : 0;

  return (
    <PageWrapper>
      <Stack direction={{ xs: 'column', lg: 'row' }} gap={2} alignItems={{ lg: 'center' }} justifyContent="space-between" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h1">Department Workplans</Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            Annual department containers with objective-level Strategic Pillar and Enterprise Priority alignment.
          </Typography>
        </Box>
        <Stack direction="row" gap={1}>
          <ToggleButtonGroup exclusive size="small" value={scope} onChange={(_, value) => value && setScope(value)}>
            <ToggleButton value="all">All</ToggleButton>
            <ToggleButton value="mine">Mine</ToggleButton>
          </ToggleButtonGroup>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialog({ item: null, open: true })}>Add Department Workplan</Button>
        </Stack>
      </Stack>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 1.5, mb: 2 }}>
        <StatTile label="Visible Workplans" value={visibleWorkplans.length} helper="Annual department plans" />
        <StatTile label="Department Objectives" value={visibleWorkplans.reduce((total, workplan) => total + workplan.objectives.length, 0)} helper="Validated alignment rows" />
        <StatTile label="Needs Focus" value={visibleWorkplans.filter((workplan) => ['Watch', 'Alert'].includes(workplan.status)).length} helper="Objective rollup" />
        <StatTile label="Average Progress" value={`${average}%`} helper="Across objective rows" />
      </Box>
      <Stack gap={1.5}>
        {visibleWorkplans.length ? visibleWorkplans.map((workplan) => (
          <WorkplanCard
            key={workplan.id}
            canManage={canManageWorkplan(workplan, user)}
            enterprisePriorities={enterprisePriorities}
            onDelete={deleteDepartmentWorkplan}
            onEdit={(item) => setDialog({ item, open: true })}
            strategicPlan={strategicPlan}
            workplan={workplan}
          />
        )) : (
          <Box sx={{ bgcolor: 'background.paper', border: '1px dashed', borderColor: 'divider', borderRadius: 1, p: 3, textAlign: 'center' }}>
            <Typography variant="h3">No department workplans in this view.</Typography>
          </Box>
        )}
      </Stack>
      <WorkplanDialog
        enterprisePriorities={enterprisePriorities}
        item={dialog.item}
        onClose={() => setDialog({ item: null, open: false })}
        onSave={(workplan) => { saveDepartmentWorkplan(workplan); setDialog({ item: null, open: false }); }}
        open={dialog.open}
        strategicPlan={strategicPlan}
        user={user}
      />
    </PageWrapper>
  );
};

export default WorkplansPage;
