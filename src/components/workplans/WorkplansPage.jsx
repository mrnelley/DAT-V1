import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
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
import { strategicPillarById, strategicPlan2030, users } from '../../data/mockData';
import { activeRoadmap } from '../../data/quarterlyRoadmap';
import { useAuth } from '../../hooks/useAuth';
import PageWrapper from '../layout/PageWrapper';
import UserAvatar from '../shared/UserAvatar';

const statusColor = {
  Steady: 'success',
  Watch: 'warning',
  Alert: 'error',
  Completed: 'primary',
  Rescheduled: 'default',
};

const workplanStatuses = ['Steady', 'Watch', 'Alert', 'Completed', 'Rescheduled'];

const clampProgress = (value) => Math.min(100, Math.max(0, Number(value) || 0));

const formatDate = (date) => {
  if (!date) return 'No date';

  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const defaultForm = (user) => ({
  id: '',
  title: '',
  department: user.department,
  leadId: user.id,
  scope: user.department,
  quarter: activeRoadmap.quarter,
  quarterlyInitiative: '',
  strategicPlan: strategicPlan2030.name,
  strategicPillarId: strategicPlan2030.pillars[0].id,
  strategicPillar: strategicPlan2030.pillars[0].name,
  status: 'Steady',
  due: activeRoadmap.end,
  progress: 25,
  outcome: '',
  ownerIds: [user.id],
  priorityLinksText: '',
});

const toForm = (workplan, user) => {
  if (!workplan) return defaultForm(user);

  const strategicPillarId = workplan.strategicPillarId
    || strategicPlan2030.pillars.find((pillar) => pillar.name === workplan.strategicPillar)?.id
    || strategicPlan2030.pillars[0].id;

  return {
    ...workplan,
    leadId: workplan.lead?.id || user.id,
    ownerIds: workplan.ownerIds || [workplan.lead?.id || user.id],
    strategicPillarId,
    strategicPillar: strategicPillarById[strategicPillarId]?.name || workplan.strategicPillar,
    priorityLinksText: (workplan.priorityLinks || []).join('\n'),
  };
};

const canManageWorkplan = (workplan, user) => (
  workplan.lead?.id === user.id || workplan.ownerIds?.includes(user.id)
);

const StatTile = ({ label, value, helper }) => (
  <Box
    sx={{
      bgcolor: 'background.paper',
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 1,
      p: 1.5,
    }}
  >
    <Typography variant="caption" color="text.secondary">{label}</Typography>
    <Typography variant="h3" sx={{ mt: 0.25 }}>{value}</Typography>
    {helper && <Typography variant="body2" sx={{ mt: 0.5 }}>{helper}</Typography>}
  </Box>
);

const WorkplanDialog = ({ item, onClose, onSave, open, user }) => {
  const [form, setForm] = useState(() => toForm(item, user));

  useEffect(() => {
    if (open) setForm(toForm(item, user));
  }, [item, open, user]);

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const save = () => {
    const lead = users.find((candidate) => candidate.id === form.leadId) || user;
    const { leadId, priorityLinksText, ...rest } = form;
    const strategicPillar = strategicPillarById[form.strategicPillarId] || strategicPlan2030.pillars[0];
    const priorityLinks = priorityLinksText
      .split('\n')
      .map((value) => value.trim())
      .filter(Boolean);

    onSave({
      ...rest,
      lead,
      progress: clampProgress(form.progress),
      ownerIds: Array.from(new Set([lead.id, ...(form.ownerIds || [])])),
      priorityLinks,
      strategicPlan: strategicPlan2030.name,
      strategicPillarId: strategicPillar.id,
      strategicPillar: strategicPillar.name,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{item ? 'Edit Workplan' : 'Add Workplan'}</DialogTitle>
      <DialogContent>
        <Stack gap={2} sx={{ pt: 1 }}>
          <TextField label="Title" value={form.title} onChange={update('title')} fullWidth required />
          <Stack direction={{ xs: 'column', md: 'row' }} gap={2}>
            <TextField label="Department" value={form.department} onChange={update('department')} fullWidth />
            <TextField select label="Lead" value={form.leadId} onChange={update('leadId')} fullWidth>
              {users.map((candidate) => (
                <MenuItem key={candidate.id} value={candidate.id}>{candidate.name}</MenuItem>
              ))}
            </TextField>
          </Stack>
          <Stack direction={{ xs: 'column', md: 'row' }} gap={2}>
            <TextField select label="Status" value={form.status} onChange={update('status')} fullWidth>
              {workplanStatuses.map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
            </TextField>
            <TextField label="Due" type="date" value={form.due} onChange={update('due')} fullWidth InputLabelProps={{ shrink: true }} />
            <TextField label="Progress" type="number" value={form.progress} onChange={update('progress')} fullWidth inputProps={{ min: 0, max: 100 }} />
          </Stack>
          <Stack direction={{ xs: 'column', md: 'row' }} gap={2}>
            <TextField label="Quarter" value={form.quarter} onChange={update('quarter')} fullWidth />
            <TextField label="Quarterly Initiative" value={form.quarterlyInitiative} onChange={update('quarterlyInitiative')} fullWidth />
          </Stack>
          <Stack direction={{ xs: 'column', md: 'row' }} gap={2}>
            <TextField label="Strategic Plan" value={strategicPlan2030.name} fullWidth InputProps={{ readOnly: true }} />
            <TextField select label="Strategic Pillar" value={form.strategicPillarId} onChange={update('strategicPillarId')} fullWidth>
              {strategicPlan2030.pillars.map((pillar) => (
                <MenuItem key={pillar.id} value={pillar.id}>{pillar.name}</MenuItem>
              ))}
            </TextField>
          </Stack>
          <TextField label="Expected Outcome" value={form.outcome} onChange={update('outcome')} fullWidth multiline minRows={3} />
          <TextField
            label="Linked Priorities"
            value={form.priorityLinksText}
            onChange={update('priorityLinksText')}
            fullWidth
            multiline
            minRows={3}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={save} disabled={!form.title.trim()}>Save Workplan</Button>
      </DialogActions>
    </Dialog>
  );
};

const WorkplanCard = ({ canManage, onDelete, onEdit, workplan }) => (
  <Card
    aria-label={canManage ? `Edit workplan ${workplan.title}` : undefined}
    onClick={canManage ? () => onEdit(workplan) : undefined}
    onKeyDown={(event) => {
      if (event.target !== event.currentTarget || !canManage || !['Enter', ' '].includes(event.key)) return;
      event.preventDefault();
      onEdit(workplan);
    }}
    role={canManage ? 'button' : undefined}
    tabIndex={canManage ? 0 : undefined}
    variant="outlined"
    sx={{
      borderRadius: 1,
      cursor: canManage ? 'pointer' : 'default',
      transition: 'border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease',
      '&:focus-visible': {
        outline: '3px solid',
        outlineColor: 'secondary.main',
        outlineOffset: 2,
      },
      '&:hover': canManage ? {
        borderColor: 'secondary.main',
        boxShadow: '0 8px 18px rgba(31, 79, 86, 0.13)',
        transform: 'translateY(-1px)',
      } : undefined,
    }}
  >
    <CardContent>
      <Stack direction={{ xs: 'column', md: 'row' }} gap={2} justifyContent="space-between">
        <Box sx={{ minWidth: 0 }}>
          <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mb: 1 }}>
            <Chip label={workplan.department} color="primary" size="small" />
            <Chip label={workplan.status} color={statusColor[workplan.status] || 'default'} size="small" />
            <Chip label={`Due ${formatDate(workplan.due)}`} variant="outlined" size="small" />
            {!canManage && <Chip label="View only" size="small" variant="outlined" />}
          </Stack>
          <Typography variant="h3">{workplan.title}</Typography>
          <Typography variant="body2" sx={{ mt: 0.75 }}>{workplan.outcome}</Typography>
        </Box>
        <Stack direction="row" alignItems="center" gap={1} sx={{ flexShrink: 0 }}>
          <UserAvatar user={workplan.lead} size="sm" />
          <Box>
            <Typography variant="body2" color="text.primary" fontWeight={700}>{workplan.lead.name}</Typography>
            <Typography variant="caption">{workplan.lead.role}</Typography>
          </Box>
          {canManage && (
            <Tooltip title="Delete workplan">
              <IconButton aria-label={`Delete workplan ${workplan.title}`} onClick={(event) => {
                event.stopPropagation();
                onDelete(workplan.id);
              }}>
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </Stack>

      <Box sx={{ mt: 2 }}>
        <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
          <Typography variant="caption">Progress</Typography>
          <Typography variant="caption">{clampProgress(workplan.progress)}%</Typography>
        </Stack>
        <LinearProgress
          aria-label={`${workplan.title} progress`}
          value={clampProgress(workplan.progress)}
          variant="determinate"
        />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 1.5, mt: 2 }}>
        <Stack direction="row" gap={1} alignItems="flex-start">
          <FlagOutlinedIcon color="primary" fontSize="small" />
          <Box>
            <Typography variant="caption">Quarterly Initiative</Typography>
            <Typography variant="body2" color="text.primary">{workplan.quarterlyInitiative || 'Not linked'}</Typography>
            <Typography variant="caption">{workplan.quarter || 'No quarter set'}</Typography>
          </Box>
        </Stack>
        <Stack direction="row" gap={1} alignItems="flex-start">
          <AccountTreeOutlinedIcon color="primary" fontSize="small" />
          <Box>
            <Typography variant="caption">{workplan.strategicPlan || 'Strategic Plan'}</Typography>
            <Typography variant="body2" color="text.primary">{workplan.strategicPillar || 'No pillar set'}</Typography>
          </Box>
        </Stack>
      </Box>

      <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mt: 2 }}>
        {(workplan.priorityLinks || []).length ? (
          workplan.priorityLinks.map((priority) => (
            <Chip key={priority} label={priority} size="small" variant="outlined" />
          ))
        ) : (
          <Chip label="No priority links yet" size="small" variant="outlined" />
        )}
      </Stack>
    </CardContent>
  </Card>
);

const WorkplansPage = () => {
  const { user } = useAuth();
  const { deleteDepartmentWorkplan, departmentWorkplans, saveDepartmentWorkplan } = useOperatingData();
  const [searchParams, setSearchParams] = useSearchParams();
  const [dialog, setDialog] = useState({ item: null, open: false });
  const [scope, setScope] = useState('all');

  useEffect(() => {
    if (searchParams.get('new') !== '1') return;

    setDialog({ item: null, open: true });
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('new');
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const visibleWorkplans = useMemo(() => (
    departmentWorkplans
      .filter((workplan) => scope === 'all' || workplan.lead.id === user.id || workplan.ownerIds?.includes(user.id))
      .sort((a, b) => new Date(`${a.due}T00:00:00`) - new Date(`${b.due}T00:00:00`))
  ), [departmentWorkplans, scope, user.id]);

  const summary = useMemo(() => {
    const average = visibleWorkplans.length
      ? Math.round(visibleWorkplans.reduce((total, workplan) => total + clampProgress(workplan.progress), 0) / visibleWorkplans.length)
      : 0;

    return {
      average,
      departments: new Set(visibleWorkplans.map((workplan) => workplan.department)).size,
      needsAttention: visibleWorkplans.filter((workplan) => ['Watch', 'Alert'].includes(workplan.status)).length,
      total: visibleWorkplans.length,
    };
  }, [visibleWorkplans]);

  const saveWorkplan = (workplan) => {
    if (workplan.id) {
      const existing = departmentWorkplans.find((item) => item.id === workplan.id);
      if (existing && !canManageWorkplan(existing, user)) return;
    }

    saveDepartmentWorkplan(workplan);
    setDialog({ item: null, open: false });
  };

  const deleteWorkplan = (id) => {
    const existing = departmentWorkplans.find((workplan) => workplan.id === id);
    if (existing && !canManageWorkplan(existing, user)) return;
    deleteDepartmentWorkplan(id);
  };

  return (
    <PageWrapper>
      <Stack direction={{ xs: 'column', lg: 'row' }} gap={2} alignItems={{ lg: 'center' }} justifyContent="space-between" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h1">Workplans</Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            Departmental workplans connected to quarterly initiatives and the 2030 strategic plan.
          </Typography>
        </Box>
        <Stack direction="row" gap={1} flexWrap="wrap">
          <ToggleButtonGroup
            exclusive
            size="small"
            value={scope}
            onChange={(_, value) => value && setScope(value)}
            aria-label="Filter workplans"
          >
            <ToggleButton value="all" aria-label="Show all workplans">All</ToggleButton>
            <ToggleButton value="mine" aria-label="Show my workplans">Mine</ToggleButton>
          </ToggleButtonGroup>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialog({ item: null, open: true })}>
            Add Workplan
          </Button>
        </Stack>
      </Stack>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 1.5, mb: 2 }}>
        <StatTile label="Visible Workplans" value={summary.total} helper={scope === 'mine' ? `${user.name}'s lane` : 'All departments'} />
        <StatTile label="Needs Focus" value={summary.needsAttention} helper="Watch or Alert" />
        <StatTile label="Average Progress" value={`${summary.average}%`} helper="Across this view" />
        <StatTile label="Departments" value={summary.departments} helper="Represented here" />
      </Box>

      <Stack gap={1.5}>
        {visibleWorkplans.length ? (
          visibleWorkplans.map((workplan) => (
            <WorkplanCard
              key={workplan.id}
              canManage={canManageWorkplan(workplan, user)}
              onDelete={deleteWorkplan}
              onEdit={(item) => canManageWorkplan(item, user) && setDialog({ item, open: true })}
              workplan={workplan}
            />
          ))
        ) : (
          <Box sx={{ bgcolor: 'background.paper', border: '1px dashed', borderColor: 'divider', borderRadius: 1, p: 3, textAlign: 'center' }}>
            <Typography variant="h3">No workplans in this view.</Typography>
          </Box>
        )}
      </Stack>

      <WorkplanDialog
        item={dialog.item}
        onClose={() => setDialog({ item: null, open: false })}
        onSave={saveWorkplan}
        open={dialog.open}
        user={user}
      />
    </PageWrapper>
  );
};

export default WorkplansPage;
