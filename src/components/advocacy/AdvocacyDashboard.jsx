import AddIcon from '@mui/icons-material/Add';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControl, IconButton, InputLabel, LinearProgress, MenuItem, Select, Stack, TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { advocacyContacts, advocacyInitiatives, advocacyTouchpoints, advocacyWorkplans, strategicPillarById, strategicPlan2030, users } from '../../data/mockData';
import UserAvatar from '../shared/UserAvatar';

const periods = [
  { value: 'day', label: 'DAY', title: 'Today', context: 'May 13, 2026' },
  { value: 'week', label: 'WEEK', title: 'This week', context: 'Week of May 11, 2026' },
  { value: 'month', label: 'MONTH', title: 'This month', context: 'May 2026' },
  { value: 'quarter', label: 'QUARTER', title: 'This quarter', context: 'Q2 2026' },
  { value: 'year', label: 'YEAR', title: 'This year', context: '2026' },
];

const statusColor = {
  'Steady': 'success',
  'Watch': 'warning',
  'Alert': 'error',
  Completed: 'success',
};

const statusTone = {
  'Steady': 'success.main',
  'Watch': 'warning.main',
  'Alert': 'error.main',
  Completed: 'success.dark',
};

const entityLabels = {
  priority: 'Priority',
  workplan: 'Departmental Workplan',
  initiative: 'Quarterly Initiative',
};

const currentOperatingDate = new Date('2026-05-13T12:00:00');

const cadenceTargets = {
  Coalition: 10,
  'Local Government': 14,
  'Resident Voice': 14,
  'State Government': 21,
};

const cadenceTone = {
  healthy: {
    label: 'Healthy',
    color: 'success',
    borderColor: 'success.light',
    bg: 'rgba(0, 110, 92, 0.08)',
  },
  dueSoon: {
    label: 'Due soon',
    color: 'warning',
    borderColor: 'warning.light',
    bg: 'rgba(241, 172, 73, 0.12)',
  },
  overdue: {
    label: 'Overdue',
    color: 'error',
    borderColor: 'error.light',
    bg: 'rgba(176, 58, 52, 0.08)',
  },
};

const safeDate = (dateString) => new Date(`${dateString}T12:00:00`);

const daysSince = (dateString) => {
  const diff = currentOperatingDate.getTime() - safeDate(dateString).getTime();
  return Math.max(0, Math.floor(diff / 86400000));
};

const assessCadence = (contact) => {
  const targetDays = cadenceTargets[contact.circle] || 14;
  const elapsedDays = daysSince(contact.lastTouchpoint);
  const daysUntilDue = targetDays - elapsedDays;
  let state = 'healthy';

  if (elapsedDays > targetDays) {
    state = 'overdue';
  } else if (daysUntilDue <= 3) {
    state = 'dueSoon';
  }

  return {
    ...cadenceTone[state],
    state,
    elapsedDays,
    targetDays,
    daysUntilDue,
    daysOverdue: Math.max(0, elapsedDays - targetDays),
  };
};

const emptyEntity = (type) => {
  if (type === 'priority') {
    return {
      title: '',
      status: 'Steady',
      target: 5,
      current: 0,
      circle: 'Local Government',
      workplanId: '',
      initiativeId: '',
      strategicPillarId: 'advocate-change',
      nextAction: '',
    };
  }

  if (type === 'workplan') {
    return {
      title: '',
      department: 'Executive Office',
      leadId: users[0].id,
      initiativeId: '',
      status: 'Steady',
      due: '2026-06-14',
      progress: 50,
      strategicPillarId: 'advocate-change',
      outcome: '',
    };
  }

  return {
    title: '',
    quarter: 'Q2 2026',
    status: 'Steady',
    target: 20,
    current: 0,
    strategicPillarId: 'advocate-change',
    narrative: '',
  };
};

const AdvocacyEntityDialog = ({ item, mode, onClose, onSave, open, type, initiatives, workplans }) => {
  const [form, setForm] = useState(emptyEntity(type || 'priority'));

  useEffect(() => {
    if (!open || !type) return;
    const next = item
      ? { ...item, leadId: item.lead?.id || users[0].id, ownerId: item.owner?.id || users[0].id }
      : emptyEntity(type);
    setForm(next);
  }, [item, open, type]);

  if (!type) return null;

  const update = (field) => (event) => {
    const value = event.target.value;
    if (type === 'priority' && field === 'workplanId') {
      const workplan = workplans.find((candidate) => candidate.id === value);
      setForm((current) => ({
        ...current,
        workplanId: value,
        initiativeId: workplan?.initiativeId || current.initiativeId,
        strategicPillarId: workplan?.strategicPillarId || current.strategicPillarId,
      }));
      return;
    }
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submit = () => {
    if (!form.title?.trim()) return;
    onSave(type, form);
    onClose();
  };

  return (
    <Dialog aria-labelledby="advocacy-entity-dialog-title" open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle id="advocacy-entity-dialog-title">{mode === 'edit' ? 'Edit' : 'Add'} {entityLabels[type]}</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Stack gap={2} sx={{ mt: 1 }}>
          <TextField label="Title" value={form.title || ''} onChange={update('title')} required fullWidth />

          {type === 'priority' && (
            <>
              <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
                <TextField label="Current" type="number" value={form.current || 0} onChange={update('current')} fullWidth />
                <TextField label="Target" type="number" value={form.target || 0} onChange={update('target')} fullWidth />
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select label="Status" value={form.status || 'Steady'} onChange={update('status')}>
                    {Object.keys(statusColor).map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
                  </Select>
                </FormControl>
                <TextField label="Circle" value={form.circle || ''} onChange={update('circle')} fullWidth />
              </Stack>
              <FormControl fullWidth>
                <InputLabel>Departmental Workplan</InputLabel>
                <Select label="Departmental Workplan" value={form.workplanId || ''} onChange={update('workplanId')}>
                  <MenuItem value="">Unlinked</MenuItem>
                  {workplans.map((workplan) => <MenuItem key={workplan.id} value={workplan.id}>{workplan.title}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Quarterly Initiative</InputLabel>
                <Select label="Quarterly Initiative" value={form.initiativeId || ''} onChange={update('initiativeId')}>
                  <MenuItem value="">Unlinked</MenuItem>
                  {initiatives.map((initiative) => <MenuItem key={initiative.id} value={initiative.id}>{initiative.title}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Strategic Pillar</InputLabel>
                <Select label="Strategic Pillar" value={form.strategicPillarId || 'advocate-change'} onChange={update('strategicPillarId')}>
                  {strategicPlan2030.pillars.map((pillar) => <MenuItem key={pillar.id} value={pillar.id}>{pillar.name}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField label="Next Action" value={form.nextAction || ''} onChange={update('nextAction')} multiline minRows={2} />
            </>
          )}

          {type === 'workplan' && (
            <>
              <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
                <TextField label="Department" value={form.department || ''} onChange={update('department')} fullWidth />
                <TextField label="Due" type="date" value={form.due || ''} onChange={update('due')} InputLabelProps={{ shrink: true }} fullWidth />
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
                <FormControl fullWidth>
                  <InputLabel>Lead</InputLabel>
                  <Select label="Lead" value={form.leadId || users[0].id} onChange={update('leadId')}>
                    {users.map((user) => <MenuItem key={user.id} value={user.id}>{user.name}</MenuItem>)}
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select label="Status" value={form.status || 'Steady'} onChange={update('status')}>
                    {Object.keys(statusColor).map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
                  </Select>
                </FormControl>
              </Stack>
              <TextField label="Progress" type="number" value={form.progress || 0} onChange={update('progress')} />
              <FormControl fullWidth>
                <InputLabel>Quarterly Initiative</InputLabel>
                <Select label="Quarterly Initiative" value={form.initiativeId || ''} onChange={update('initiativeId')}>
                  <MenuItem value="">Unlinked</MenuItem>
                  {initiatives.map((initiative) => <MenuItem key={initiative.id} value={initiative.id}>{initiative.title}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Strategic Pillar</InputLabel>
                <Select label="Strategic Pillar" value={form.strategicPillarId || 'advocate-change'} onChange={update('strategicPillarId')}>
                  {strategicPlan2030.pillars.map((pillar) => <MenuItem key={pillar.id} value={pillar.id}>{pillar.name}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField label="Outcome" value={form.outcome || ''} onChange={update('outcome')} multiline minRows={2} />
            </>
          )}

          {type === 'initiative' && (
            <>
              <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
                <TextField label="Quarter" value={form.quarter || ''} onChange={update('quarter')} fullWidth />
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select label="Status" value={form.status || 'Steady'} onChange={update('status')}>
                    {Object.keys(statusColor).map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
                  </Select>
                </FormControl>
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
                <TextField label="Current" type="number" value={form.current || 0} onChange={update('current')} fullWidth />
                <TextField label="Target" type="number" value={form.target || 0} onChange={update('target')} fullWidth />
              </Stack>
              <FormControl fullWidth>
                <InputLabel>Strategic Pillar</InputLabel>
                <Select label="Strategic Pillar" value={form.strategicPillarId || 'advocate-change'} onChange={update('strategicPillarId')}>
                  {strategicPlan2030.pillars.map((pillar) => <MenuItem key={pillar.id} value={pillar.id}>{pillar.name}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField label="Narrative" value={form.narrative || ''} onChange={update('narrative')} multiline minRows={3} />
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={submit}>{mode === 'edit' ? 'Save' : 'Create'}</Button>
      </DialogActions>
    </Dialog>
  );
};

const CadenceChip = ({ assessment, size = 'small' }) => (
  <Chip
    label={assessment.label}
    color={assessment.color}
    size={size}
    variant={assessment.state === 'healthy' ? 'outlined' : 'filled'}
    sx={{ minWidth: 88 }}
  />
);

const SummaryMetric = ({ helper, icon, label, value }) => (
  <Box
    sx={{
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 1,
      p: 1.5,
      minHeight: 104,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    }}
  >
    <Stack direction="row" alignItems="center" gap={1}>
      <Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>
      <Typography variant="caption">{label}</Typography>
    </Stack>
    <Typography variant="h2" sx={{ color: 'primary.main' }}>{value}</Typography>
    <Typography variant="body2">{helper}</Typography>
  </Box>
);

const CircleCard = ({ circle }) => {
  const tone = cadenceTone[circle.health] || cadenceTone.healthy;
  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: tone.borderColor,
        borderRadius: 1,
        p: 1.5,
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
        <Box>
          <Typography variant="body1" fontWeight={800}>{circle.name}</Typography>
          <Typography variant="body2">{circle.contactCount} people in cadence</Typography>
        </Box>
        <CadenceChip assessment={{ ...tone, state: circle.health }} />
      </Stack>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, mt: 1.5 }}>
        <Box>
          <Typography variant="caption">Touchpoints</Typography>
          <Typography variant="h3" color="primary.main">{circle.touchpointCount}</Typography>
        </Box>
        <Box>
          <Typography variant="caption">High influence</Typography>
          <Typography variant="h3" color="primary.main">{circle.highInfluenceCount}</Typography>
        </Box>
        <Box>
          <Typography variant="caption">Cadence</Typography>
          <Typography variant="h3" color="primary.main">{circle.targetDays}d</Typography>
        </Box>
      </Box>

      <Divider sx={{ my: 1.25 }} />
      <Typography variant="body2" color="text.primary">
        Next: {circle.nextStep || 'No next action recorded'}
      </Typography>
    </Box>
  );
};

const FollowUpRow = ({ item }) => {
  const { assessment, contact } = item;
  const timing = assessment.state === 'overdue'
    ? `${assessment.daysOverdue} days overdue`
    : assessment.state === 'dueSoon'
      ? `${assessment.daysUntilDue} days until cadence risk`
      : `${assessment.daysUntilDue} days of runway`;

  return (
    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.25 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={1}>
        <Stack direction="row" gap={1} alignItems="center">
          <UserAvatar user={{ initials: contact.name.split(' ').map((part) => part[0]).slice(0, 2).join(''), name: contact.name }} size="sm" />
          <Box>
            <Typography variant="body1" fontWeight={800}>{contact.name}</Typography>
            <Typography variant="body2">{contact.circle} - {contact.relationship} influence: {contact.influence}</Typography>
          </Box>
        </Stack>
        <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
          <CadenceChip assessment={assessment} />
          <Chip label={timing} size="small" variant="outlined" />
        </Stack>
      </Stack>
      <Typography variant="body2" color="text.primary" sx={{ mt: 1 }}>
        {contact.nextStep}
      </Typography>
    </Box>
  );
};

const TouchpointLogDialog = ({ contacts, onClose, onSave, open, period }) => {
  const [form, setForm] = useState({
    contactId: contacts[0]?.id || '',
    date: '2026-05-13',
    note: '',
    type: 'Call',
  });

  useEffect(() => {
    if (!open) return;
    setForm({
      contactId: contacts[0]?.id || '',
      date: '2026-05-13',
      note: '',
      type: 'Call',
    });
  }, [contacts, open]);

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const submit = () => {
    if (!form.contactId || !form.note.trim()) return;
    onSave({
      ...form,
      id: `at-${Date.now()}`,
      note: form.note.trim(),
      period,
    });
    onClose();
  };

  return (
    <Dialog aria-labelledby="touchpoint-log-dialog-title" open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle id="touchpoint-log-dialog-title">Log Touchpoint</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Stack gap={2} sx={{ mt: 1 }}>
          <FormControl fullWidth>
            <InputLabel>Person or Circle</InputLabel>
            <Select label="Person or Circle" value={form.contactId} onChange={update('contactId')}>
              {contacts.map((contact) => (
                <MenuItem key={contact.id} value={contact.id}>{contact.name} - {contact.circle}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
            <TextField label="Touchpoint type" value={form.type} onChange={update('type')} fullWidth />
            <TextField label="Date" type="date" value={form.date} onChange={update('date')} InputLabelProps={{ shrink: true }} fullWidth />
          </Stack>
          <TextField label="What happened?" value={form.note} onChange={update('note')} multiline minRows={3} required />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={submit}>Save Touchpoint</Button>
      </DialogActions>
    </Dialog>
  );
};

const AdvocacyDashboard = () => {
  const [period, setPeriod] = useState('month');
  const [contacts, setContacts] = useState(advocacyContacts);
  const [touchpoints, setTouchpoints] = useState(advocacyTouchpoints);
  const [initiatives, setInitiatives] = useState(advocacyInitiatives);
  const [workplans, setWorkplans] = useState(advocacyWorkplans);
  const [dialog, setDialog] = useState({ open: false, type: null, mode: 'create', item: null });
  const [touchpointDialogOpen, setTouchpointDialogOpen] = useState(false);

  const periodIndex = periods.findIndex((item) => item.value === period);
  const currentPeriod = periods[periodIndex] || periods[2];
  const visibleTouchpoints = touchpoints.filter((touchpoint) => (
    periods.findIndex((item) => item.value === touchpoint.period) <= periodIndex
  ));

  const contactsById = useMemo(() => (
    Object.fromEntries(contacts.map((contact) => [contact.id, contact]))
  ), [contacts]);

  const initiativesById = useMemo(() => (
    Object.fromEntries(initiatives.map((initiative) => [initiative.id, initiative]))
  ), [initiatives]);

  const touchpointCircleCount = new Set(
    visibleTouchpoints.map((touchpoint) => contactsById[touchpoint.contactId]?.circle).filter(Boolean),
  ).size;

  const cadenceAssessments = useMemo(() => (
    contacts.map((contact) => ({ contact, assessment: assessCadence(contact) }))
  ), [contacts]);
  const overdueContacts = cadenceAssessments.filter((item) => item.assessment.state === 'overdue');
  const scheduledContacts = contacts.filter((contact) => contact.nextStep);
  const topFollowUps = [...cadenceAssessments].sort((a, b) => {
    const severity = { overdue: 3, dueSoon: 2, healthy: 1 };
    if (severity[b.assessment.state] !== severity[a.assessment.state]) {
      return severity[b.assessment.state] - severity[a.assessment.state];
    }
    return a.assessment.daysUntilDue - b.assessment.daysUntilDue;
  }).slice(0, 4);

  const circleSummaries = useMemo(() => {
    const groups = new Map();
    contacts.forEach((contact) => {
      const existing = groups.get(contact.circle) || {
        name: contact.circle,
        contacts: [],
        highInfluenceCount: 0,
        nextStep: '',
        overdueCount: 0,
        dueSoonCount: 0,
        targetDays: cadenceTargets[contact.circle] || 14,
        touchpointCount: 0,
      };
      const assessment = assessCadence(contact);
      existing.contacts.push(contact);
      existing.highInfluenceCount += contact.influence === 'High' ? 1 : 0;
      existing.nextStep = existing.nextStep || contact.nextStep;
      existing.overdueCount += assessment.state === 'overdue' ? 1 : 0;
      existing.dueSoonCount += assessment.state === 'dueSoon' ? 1 : 0;
      groups.set(contact.circle, existing);
    });

    return Array.from(groups.values()).map((group) => {
      const touchpointCount = visibleTouchpoints.filter((touchpoint) => contactsById[touchpoint.contactId]?.circle === group.name).length;
      return {
        ...group,
        contactCount: group.contacts.length,
        health: group.overdueCount ? 'overdue' : group.dueSoonCount ? 'dueSoon' : 'healthy',
        touchpointCount,
      };
    });
  }, [contacts, contactsById, visibleTouchpoints]);

  const openDialog = (type, mode = 'create', item = null) => {
    setDialog({ open: true, type, mode, item });
  };

  const closeDialog = () => setDialog({ open: false, type: null, mode: 'create', item: null });

  const logTouchpoint = (touchpoint) => {
    setTouchpoints((current) => [touchpoint, ...current]);
    setContacts((current) => current.map((contact) => (
      contact.id === touchpoint.contactId
        ? { ...contact, lastTouchpoint: touchpoint.date, stage: contact.stage === 'New' ? 'Active Conversation' : contact.stage }
        : contact
    )));
  };

  const saveEntity = (type, form) => {
    if (type === 'workplan') {
      const pillar = strategicPillarById[form.strategicPillarId] || strategicPillarById['advocate-change'];
      const next = {
        ...form,
        id: form.id || `aw-${Date.now()}`,
        lead: users.find((user) => user.id === form.leadId) || users[0],
        progress: Number(form.progress || 0),
        strategicPlan: strategicPlan2030.name,
        strategicPillarId: pillar.id,
        strategicPillar: pillar.name,
      };
      setWorkplans((current) => (form.id ? current.map((item) => item.id === form.id ? next : item) : [...current, next]));
    }

    if (type === 'initiative') {
      const pillar = strategicPillarById[form.strategicPillarId] || strategicPillarById['advocate-change'];
      const next = {
        ...form,
        id: form.id || `ai-${Date.now()}`,
        owner: users[0],
        current: Number(form.current || 0),
        target: Number(form.target || 0),
        strategicPlan: strategicPlan2030.name,
        strategicPillarId: pillar.id,
        strategicPillar: pillar.name,
      };
      setInitiatives((current) => (form.id ? current.map((item) => item.id === form.id ? next : item) : [...current, next]));
    }
  };

  const deleteEntity = (type, id) => {
    if (type === 'workplan') {
      setWorkplans((current) => current.filter((item) => item.id !== id));
    }

    if (type === 'initiative') {
      setInitiatives((current) => current.filter((item) => item.id !== id));
      setWorkplans((current) => current.map((workplan) => workplan.initiativeId === id ? { ...workplan, initiativeId: '' } : workplan));
    }
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Stack direction={{ xs: 'column', lg: 'row' }} justifyContent="space-between" alignItems={{ lg: 'center' }} gap={2} sx={{ mb: 2 }}>
        <Stack direction="row" gap={1.5} alignItems="center">
          <UserAvatar user={users[0]} size="xl" />
          <Box>
            <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 800, textTransform: 'uppercase' }}>
              Primary Advocate - Chief Executive Officer
            </Typography>
            <Typography variant="h1" sx={{ lineHeight: 1.05 }}>Advocacy Command Center</Typography>
            <Typography variant="body2">Advocacy command center - May 2026</Typography>
          </Box>
        </Stack>

        <Box>
          <Typography variant="caption" component="div" sx={{ mb: 0.5, textAlign: { xs: 'left', lg: 'right' } }}>Time scope</Typography>
          <ToggleButtonGroup exclusive value={period} aria-label="Advocacy reporting period" onChange={(_, value) => value && setPeriod(value)} size="small">
            {periods.map((item) => <ToggleButton key={item.value} value={item.value}>{item.label}</ToggleButton>)}
          </ToggleButtonGroup>
        </Box>
      </Stack>

      <Box sx={{ bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider', boxShadow: 1, p: { xs: 2, md: 3 }, mb: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'flex-start' }} gap={2} sx={{ mb: 2 }}>
          <Box>
            <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 800, textTransform: 'uppercase' }}>
              {currentPeriod.title} - {currentPeriod.context}
            </Typography>
            <Typography variant="h2" sx={{ mt: 0.5 }}>{visibleTouchpoints.length} touchpoints logged</Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setTouchpointDialogOpen(true)}>
            Log Touchpoint
          </Button>
        </Stack>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 1.5 }}>
          <SummaryMetric
            icon={<CalendarMonthOutlinedIcon fontSize="small" />}
            label="Scheduled"
            value={scheduledContacts.length}
            helper={scheduledContacts.length ? `${scheduledContacts.length} next actions queued` : 'Nothing scheduled'}
          />
          <SummaryMetric
            icon={<CheckCircleOutlineOutlinedIcon fontSize="small" />}
            label="Completed"
            value={visibleTouchpoints.length}
            helper={visibleTouchpoints.length ? `${touchpointCircleCount} circles touched` : 'No logs yet'}
          />
          <SummaryMetric
            icon={<WarningAmberOutlinedIcon fontSize="small" />}
            label="Overdue contacts"
            value={overdueContacts.length}
            helper={overdueContacts.length ? 'Review required follow-ups' : 'All cadences healthy'}
          />
        </Box>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Stack direction="row" gap={1} alignItems="center">
          <GroupsOutlinedIcon sx={{ color: 'secondary.dark' }} />
          <Box>
            <Typography variant="h3">Circles</Typography>
            <Typography variant="body2">Cadence health and temperature across each named group.</Typography>
          </Box>
        </Stack>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', xl: 'repeat(4, 1fr)' }, gap: 1.5, mt: 1.5 }}>
          {circleSummaries.map((circle) => <CircleCard key={circle.name} circle={circle} />)}
        </Box>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Stack direction="row" gap={1} alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
          <Stack direction="row" gap={1} alignItems="center">
            <TrendingUpIcon sx={{ color: 'secondary.dark' }} />
            <Box>
              <Typography variant="h3">Top contacts requiring follow-up</Typography>
              <Typography variant="body2">Sorted by cadence risk, then the nearest required touchpoint.</Typography>
            </Box>
          </Stack>
          <Chip label={`${overdueContacts.length} overdue`} color={overdueContacts.length ? 'error' : 'success'} variant={overdueContacts.length ? 'filled' : 'outlined'} />
        </Stack>

        {overdueContacts.length === 0 ? (
          <Box
            sx={{
              bgcolor: cadenceTone.healthy.bg,
              border: '1px dashed',
              borderColor: 'success.main',
              borderRadius: 1,
              p: 2.5,
              textAlign: 'center',
            }}
          >
            <CadenceChip assessment={{ ...cadenceTone.healthy, state: 'healthy' }} />
            <Typography variant="body1" fontWeight={800} color="success.dark" sx={{ mt: 1 }}>All cadences healthy</Typography>
            <Typography variant="body2">Every contact has been touched within their target window.</Typography>
          </Box>
        ) : (
          <Stack gap={1}>
            {topFollowUps.map((item) => <FollowUpRow key={item.contact.id} item={item} />)}
          </Stack>
        )}
      </Box>

      <Box sx={{ bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider', p: 1.5 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={1.5} sx={{ mb: 1.5 }}>
          <Box>
            <Typography variant="h3">Linked Advocacy Work</Typography>
            <Typography variant="body2">Departmental workplans connect advocacy activity to quarterly initiatives.</Typography>
          </Box>
          <Stack direction="row" gap={1} flexWrap="wrap">
            <Button variant="outlined" startIcon={<AddIcon />} onClick={() => openDialog('workplan')}>Add Workplan</Button>
            <Button variant="outlined" startIcon={<AddIcon />} onClick={() => openDialog('initiative')}>Add Initiative</Button>
          </Stack>
        </Stack>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '1fr 1fr' }, gap: 1.5 }}>
          <Box>
            <Typography variant="h4" sx={{ mb: 1 }}>Departmental Workplans</Typography>
            <Stack gap={1}>
              {workplans.map((workplan) => (
                <Box key={workplan.id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.25 }}>
                  <Stack direction="row" justifyContent="space-between" gap={1}>
                    <Typography variant="body1" fontWeight={700}>{workplan.title}</Typography>
                    <Stack direction="row">
                      <Tooltip title="Edit workplan"><IconButton size="small" aria-label={`Edit workplan ${workplan.title}`} onClick={() => openDialog('workplan', 'edit', workplan)}><EditOutlinedIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Delete workplan"><IconButton size="small" aria-label={`Delete workplan ${workplan.title}`} onClick={() => deleteEntity('workplan', workplan.id)}><DeleteOutlineIcon fontSize="small" /></IconButton></Tooltip>
                    </Stack>
                  </Stack>
                  <Typography variant="body2">{workplan.department} - due {workplan.due}</Typography>
                  <Stack direction="row" gap={1} alignItems="center" sx={{ my: 1 }}>
                    <UserAvatar user={workplan.lead} size="sm" />
                    <Chip label={workplan.status} color={statusColor[workplan.status]} size="small" />
                  </Stack>
                  <LinearProgress value={workplan.progress} variant="determinate" sx={{ mb: 1 }} />
                  <Typography variant="body2" color="text.primary">{workplan.outcome}</Typography>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="caption">Linked to {initiativesById[workplan.initiativeId]?.title || 'no quarterly initiative'}</Typography>
                  <Typography variant="body2" color="text.primary">{workplan.strategicPillar || 'No strategic pillar set'}</Typography>
                </Box>
              ))}
            </Stack>
          </Box>

          <Box>
            <Typography variant="h4" sx={{ mb: 1 }}>Quarterly Initiatives</Typography>
            <Stack gap={1}>
              {initiatives.map((initiative) => {
                const progress = initiative.target ? Math.min(100, Math.round((initiative.current / initiative.target) * 100)) : 0;
                const linkedWorkplans = workplans.filter((workplan) => workplan.initiativeId === initiative.id).length;
                return (
                  <Box key={initiative.id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.25 }}>
                    <Stack direction="row" justifyContent="space-between" gap={1}>
                      <Typography variant="body1" fontWeight={700}>{initiative.title}</Typography>
                      <Stack direction="row">
                        <Tooltip title="Edit initiative"><IconButton size="small" aria-label={`Edit initiative ${initiative.title}`} onClick={() => openDialog('initiative', 'edit', initiative)}><EditOutlinedIcon fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Delete initiative"><IconButton size="small" aria-label={`Delete initiative ${initiative.title}`} onClick={() => deleteEntity('initiative', initiative.id)}><DeleteOutlineIcon fontSize="small" /></IconButton></Tooltip>
                      </Stack>
                    </Stack>
                    <Stack direction="row" gap={1} flexWrap="wrap" sx={{ my: 1 }}>
                      <Chip label={initiative.quarter} color="primary" size="small" />
                      <Chip label={initiative.status} color={statusColor[initiative.status]} size="small" />
                      <Chip label={initiative.strategicPillar || 'No pillar set'} size="small" variant="outlined" />
                      <Chip label={`${linkedWorkplans} workplans`} size="small" variant="outlined" />
                    </Stack>
                    <LinearProgress value={progress} variant="determinate" sx={{ mb: 0.75, '& .MuiLinearProgress-bar': { bgcolor: statusTone[initiative.status] } }} />
                    <Typography variant="caption">{initiative.current} of {initiative.target} advocacy datapoints</Typography>
                    <Typography variant="body2" color="text.primary" sx={{ mt: 0.75 }}>{initiative.narrative}</Typography>
                  </Box>
                );
              })}
            </Stack>
          </Box>
        </Box>
      </Box>

      <AdvocacyEntityDialog
        initiatives={initiatives}
        item={dialog.item}
        mode={dialog.mode}
        onClose={closeDialog}
        onSave={saveEntity}
        open={dialog.open}
        type={dialog.type}
        workplans={workplans}
      />
      <TouchpointLogDialog
        contacts={contacts}
        onClose={() => setTouchpointDialogOpen(false)}
        onSave={logTouchpoint}
        open={touchpointDialogOpen}
        period={period}
      />
    </Box>
  );
};

export default AdvocacyDashboard;
