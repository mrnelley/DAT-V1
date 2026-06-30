import AddIcon from '@mui/icons-material/Add';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';
import OutboundOutlinedIcon from '@mui/icons-material/OutboundOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useCalendarEvents } from '../../context/CalendarEventContext';
import { useOperatingData } from '../../context/OperatingDataContext';
import {
  advocacyContacts,
  advocacyInitiatives,
  advocacyTouchpoints,
  advocacyWorkplans,
  strategicPillarById,
  strategicPlan2030,
  users,
} from '../../data/mockData';
import { currentWeeklyReport } from '../../data/weeklyTrackerConfig';
import { useAuth } from '../../hooks/useAuth';
import CurrentWeekPrioritiesSection from '../dashboard/CurrentWeekPrioritiesSection';
import UserAvatar from '../shared/UserAvatar';

const periods = [
  { value: 'day', label: 'DAY', title: 'Today', context: 'June 23, 2026' },
  { value: 'week', label: 'WEEK', title: 'This week', context: 'Week of June 22, 2026' },
  { value: 'month', label: 'MONTH', title: 'This month', context: 'June 2026' },
  { value: 'quarter', label: 'QUARTER', title: 'This quarter', context: 'Q2 2026' },
  { value: 'year', label: 'YEAR', title: 'This year', context: '2026' },
];

const statusColor = {
  Steady: 'success',
  Watch: 'warning',
  Alert: 'error',
  Completed: 'success',
};

const statusTone = {
  Steady: 'success.main',
  Watch: 'warning.main',
  Alert: 'error.main',
  Completed: 'success.dark',
};

const entityLabels = {
  workplan: 'Departmental Workplan',
  initiative: 'Quarterly Initiative',
};

const danaUser = users.find((candidate) => candidate.id === 'u1') || users[0];
const ninaUser = users.find((candidate) => candidate.id === 'u19');
const currentOperatingDate = new Date('2026-06-23T12:00:00');

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

const formatDate = (dateString) => {
  if (!dateString) return 'Not set';
  return safeDate(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatAuditTimestamp = (dateString) => {
  if (!dateString) return 'not recorded';
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const daysSince = (dateString) => {
  if (!dateString) return 999;
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

const isActiveTouchpoint = (touchpoint) => touchpoint.status !== 'deleted';

const touchpointIsInPeriod = (touchpoint, period) => {
  const date = safeDate(touchpoint.date);
  if (period === 'day') return touchpoint.date === '2026-06-23';
  if (period === 'week') return date >= new Date('2026-06-22T00:00:00') && date <= new Date('2026-06-28T23:59:59');
  if (period === 'month') return date.getFullYear() === 2026 && date.getMonth() === 5;
  if (period === 'quarter') return date.getFullYear() === 2026 && date.getMonth() >= 3 && date.getMonth() <= 5;
  return date.getFullYear() === 2026;
};

const sortTouchpoints = (items) => (
  [...items].sort((a, b) => safeDate(b.date).getTime() - safeDate(a.date).getTime())
);

const latestTouchpointDate = (contact, touchpoints) => {
  const activeDates = touchpoints
    .filter((touchpoint) => touchpoint.contactId === contact.id && isActiveTouchpoint(touchpoint))
    .map((touchpoint) => touchpoint.date)
    .sort((a, b) => safeDate(b).getTime() - safeDate(a).getTime());

  return activeDates[0] || contact.lastTouchpoint;
};

const emptyEntity = (type) => {
  if (type === 'workplan') {
    return {
      title: '',
      department: 'Executive Office',
      leadId: danaUser.id,
      initiativeId: '',
      status: 'Steady',
      due: '2026-06-30',
      progress: 50,
      strategicPillarId: 'advocate-change',
      outcome: '',
    };
  }

  return {
    title: '',
    quarter: 'Q2 2026',
    status: 'Steady',
    target: 3,
    current: 0,
    strategicPillarId: 'advocate-change',
    narrative: '',
  };
};

const emptyPartner = () => ({
  circle: 'Coalition',
  influence: 'Medium',
  name: '',
  nextStep: '',
  profileSummary: '',
  relationship: '',
  stage: 'Cultivation',
  targetCompletionDate: '2026-06-30',
});

const createFollowUpEventValues = (touchpoint, partner) => ({
  title: `Advocacy follow-up: ${partner.name}`,
  date: touchpoint.targetCompletionDate,
  type: 'Touchpoint',
  rhythm: 'once',
  lifecycle: 'scheduled',
  sourceStatus: 'watch',
  department: 'Executive Office',
  property: partner.name,
  source: { type: 'touchpoint', id: touchpoint.id, label: partner.name },
  whyItMatters: `Next step from ${partner.name}'s advocacy touch report.`,
  whoItImpacts: 'Dana, Nina, and advocacy collaborators',
  supportNeeded: touchpoint.nextStep,
  outcomeExpected: touchpoint.nextStep,
});

const buildTeamsCardModel = (touchpoint, partner) => ({
  type: 'AdaptiveCard',
  version: '1.5',
  body: [
    {
      type: 'TextBlock',
      text: 'Advocacy touchpoint updated',
      weight: 'Bolder',
      size: 'Medium',
    },
    {
      type: 'FactSet',
      facts: [
        { title: 'Partner', value: partner?.name || 'Partner not selected' },
        { title: 'Touch date', value: formatDate(touchpoint?.date) },
        { title: 'Next step', value: touchpoint?.nextStep || 'No next step recorded' },
        { title: 'Target date', value: formatDate(touchpoint?.targetCompletionDate) },
        { title: 'Changed by', value: touchpoint?.updatedBy?.name || touchpoint?.createdBy?.name || 'Unknown' },
      ],
    },
  ],
  actions: [
    { type: 'Action.OpenUrl', title: 'Open Partner Profile', url: 'https://hdc-compass.example/advocacy/partners' },
    { type: 'Action.OpenUrl', title: 'Open Dana Calendar', url: 'https://hdc-compass.example/dashboard/me?calendar=1' },
  ],
});

const AdvocacyEntityDialog = ({ item, mode, onClose, onSave, open, type, initiatives }) => {
  const [form, setForm] = useState(emptyEntity(type || 'workplan'));

  useEffect(() => {
    if (!open || !type) return;
    const next = item
      ? { ...item, leadId: item.lead?.id || danaUser.id, ownerId: item.owner?.id || danaUser.id }
      : emptyEntity(type);
    setForm(next);
  }, [item, open, type]);

  if (!type) return null;

  const update = (field) => (event) => {
    const value = event.target.value;
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

          {type === 'workplan' && (
            <>
              <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
                <TextField label="Department" value={form.department || ''} onChange={update('department')} fullWidth />
                <TextField label="Due" type="date" value={form.due || ''} onChange={update('due')} InputLabelProps={{ shrink: true }} fullWidth />
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
                <FormControl fullWidth>
                  <InputLabel>Lead</InputLabel>
                  <Select label="Lead" value={form.leadId || danaUser.id} onChange={update('leadId')}>
                    {users.map((candidate) => <MenuItem key={candidate.id} value={candidate.id}>{candidate.name}</MenuItem>)}
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

const TouchpointDialog = ({ contacts, initialContactId, item, onClose, onSave, open }) => {
  const [form, setForm] = useState({
    contactId: initialContactId || contacts[0]?.id || '',
    date: '2026-06-23',
    note: '',
    nextStep: '',
    targetCompletionDate: '2026-06-30',
    type: 'Call',
  });

  useEffect(() => {
    if (!open) return;
    setForm(item ? {
      ...item,
      contactId: item.contactId || initialContactId || contacts[0]?.id || '',
    } : {
      contactId: initialContactId || contacts[0]?.id || '',
      date: '2026-06-23',
      note: '',
      nextStep: '',
      targetCompletionDate: '2026-06-30',
      type: 'Call',
    });
  }, [contacts, initialContactId, item, open]);

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const submit = () => {
    if (!form.contactId || !form.note?.trim() || !form.nextStep?.trim() || !form.targetCompletionDate) return;
    onSave({
      ...form,
      note: form.note.trim(),
      nextStep: form.nextStep.trim(),
    });
    onClose();
  };

  return (
    <Dialog aria-labelledby="touchpoint-log-dialog-title" open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle id="touchpoint-log-dialog-title">{item ? 'Edit Touch Report' : 'Log Touch Report'}</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Stack gap={2} sx={{ mt: 1 }}>
          <FormControl fullWidth>
            <InputLabel>Partner</InputLabel>
            <Select label="Partner" value={form.contactId} onChange={update('contactId')}>
              {contacts.map((contact) => (
                <MenuItem key={contact.id} value={contact.id}>{contact.name} - {contact.circle}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Stack direction={{ xs: 'column', md: 'row' }} gap={2}>
            <TextField label="Touchpoint type" value={form.type} onChange={update('type')} fullWidth />
            <TextField label="Touch date" type="date" value={form.date} onChange={update('date')} InputLabelProps={{ shrink: true }} fullWidth />
            <TextField label="Target completion date" type="date" value={form.targetCompletionDate} onChange={update('targetCompletionDate')} InputLabelProps={{ shrink: true }} required fullWidth />
          </Stack>
          <TextField label="Touch report notes" value={form.note || ''} onChange={update('note')} multiline minRows={4} required />
          <TextField label="Next step" value={form.nextStep || ''} onChange={update('nextStep')} multiline minRows={2} required />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={submit}>{item ? 'Save Changes' : 'Save Touch Report'}</Button>
      </DialogActions>
    </Dialog>
  );
};

const PartnerDialog = ({ item, onClose, onSave, open }) => {
  const [form, setForm] = useState(emptyPartner);

  useEffect(() => {
    if (!open) return;
    setForm(item || emptyPartner());
  }, [item, open]);

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  const submit = () => {
    if (!form.name.trim()) return;
    onSave(form);
    onClose();
  };

  return (
    <Dialog aria-labelledby="partner-dialog-title" open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle id="partner-dialog-title">{item ? 'Edit Partner Profile' : 'Add Partner Profile'}</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Stack gap={2} sx={{ mt: 1 }}>
          <TextField label="Partner name" value={form.name} onChange={update('name')} required fullWidth />
          <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
            <TextField label="Circle" value={form.circle} onChange={update('circle')} fullWidth />
            <FormControl fullWidth>
              <InputLabel>Influence</InputLabel>
              <Select label="Influence" value={form.influence} onChange={update('influence')}>
                {['High', 'Medium', 'Low'].map((value) => <MenuItem key={value} value={value}>{value}</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>
          <TextField label="Relationship" value={form.relationship} onChange={update('relationship')} fullWidth />
          <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
            <TextField label="Stage" value={form.stage} onChange={update('stage')} fullWidth />
            <TextField label="Target completion date" type="date" value={form.targetCompletionDate} onChange={update('targetCompletionDate')} InputLabelProps={{ shrink: true }} fullWidth />
          </Stack>
          <TextField label="Next step" value={form.nextStep} onChange={update('nextStep')} multiline minRows={2} fullWidth />
          <TextField label="Profile summary" value={form.profileSummary} onChange={update('profileSummary')} multiline minRows={3} fullWidth />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={submit} disabled={!form.name.trim()}>Save Partner</Button>
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
          <Typography variant="body2">{circle.contactCount} partners in cadence</Typography>
        </Box>
        <CadenceChip assessment={{ ...tone, state: circle.health }} />
      </Stack>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, mt: 1.5 }}>
        <Box>
          <Typography variant="caption">Touch reports</Typography>
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

const PartnerRegister = ({ canManage, contacts, onAdd, onLog, onSelect, selectedPartnerId, touchpoints }) => (
  <Box sx={{ bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider', p: 1.5, mb: 3 }}>
    <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={1.5} sx={{ mb: 1.5 }}>
      <Box>
        <Typography variant="h3">Partner Register</Typography>
        <Typography variant="body2">Master list view with profile links, last touch, next step, and assigned support.</Typography>
      </Box>
      <Stack direction="row" gap={1} flexWrap="wrap">
        <Chip label="Salesforce remains relationship CRM" color="primary" variant="outlined" />
        {canManage && <Button startIcon={<AddIcon />} variant="contained" onClick={onAdd}>Add Partner</Button>}
      </Stack>
    </Stack>
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: 'repeat(3, 1fr)' }, gap: 1.25 }}>
      {contacts.length ? contacts.map((contact) => {
        const selected = contact.id === selectedPartnerId;
        const lastTouched = latestTouchpointDate(contact, touchpoints);
        return (
          <Box
            key={contact.id}
            id={contact.profileUrl?.replace('#', '')}
            sx={{
              border: '1px solid',
              borderColor: selected ? 'primary.main' : 'divider',
              borderRadius: 1,
              p: 1.25,
              bgcolor: selected ? 'rgba(7, 44, 94, 0.04)' : 'background.paper',
            }}
          >
            <Stack direction="row" justifyContent="space-between" gap={1} alignItems="flex-start">
              <Box>
                <Typography variant="body1" fontWeight={800}>{contact.name}</Typography>
                <Typography variant="body2">{contact.circle} - {contact.stage}</Typography>
              </Box>
              <Chip label={contact.influence} size="small" color={contact.influence === 'High' ? 'warning' : 'default'} variant="outlined" />
            </Stack>
            <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mt: 1 }}>
              <Chip label={`Last touched ${formatDate(lastTouched)}`} size="small" />
              <Chip label={`Target ${formatDate(contact.targetCompletionDate)}`} size="small" variant="outlined" />
            </Stack>
            <Typography variant="body2" color="text.primary" sx={{ mt: 1 }}>{contact.nextStep}</Typography>
            <Divider sx={{ my: 1 }} />
            <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
              <Stack direction="row" gap={0.5} alignItems="center">
                <UserAvatar user={contact.lead} size="sm" />
                <Typography variant="caption">Lead: {contact.lead?.name}</Typography>
              </Stack>
              <Stack direction="row" gap={0.5}>
                <Button size="small" variant={selected ? 'contained' : 'outlined'} onClick={() => onSelect(contact.id)}>Profile</Button>
                {canManage && (
                  <Button size="small" startIcon={<AddIcon />} onClick={() => onLog(contact.id)}>Touch</Button>
                )}
              </Stack>
            </Stack>
          </Box>
        );
      }) : (
        <Box sx={{ border: '1px dashed', borderColor: 'divider', borderRadius: 1, gridColumn: '1 / -1', p: 2.5, textAlign: 'center' }}>
          <Typography variant="body1" fontWeight={800}>No partners have been added yet</Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>Create the first partner profile before logging advocacy touch reports.</Typography>
          {canManage && <Button startIcon={<AddIcon />} variant="contained" onClick={onAdd} sx={{ mt: 1.5 }}>Add Partner</Button>}
        </Box>
      )}
    </Box>
  </Box>
);

const TouchReportCard = ({ canManage, contact, onDelete, onEdit, touchpoint }) => {
  const deleted = touchpoint.status === 'deleted';
  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: deleted ? 'error.light' : 'divider',
        borderRadius: 1,
        p: 1.25,
        bgcolor: deleted ? 'rgba(176, 58, 52, 0.04)' : 'background.paper',
      }}
    >
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={1}>
        <Box>
          <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center">
            <Typography variant="body1" fontWeight={800}>{touchpoint.type}</Typography>
            <Chip label={formatDate(touchpoint.date)} size="small" color="primary" variant="outlined" />
            {deleted && <Chip label="Deleted" size="small" color="error" />}
          </Stack>
          <Typography variant="body2">{contact?.name}</Typography>
        </Box>
        {canManage && !deleted && (
          <Stack direction="row">
            <Tooltip title="Edit touch report">
              <IconButton size="small" aria-label={`Edit touch report for ${contact?.name}`} onClick={() => onEdit(touchpoint)}>
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete touch report">
              <IconButton size="small" aria-label={`Delete touch report for ${contact?.name}`} onClick={() => onDelete(touchpoint.id)}>
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        )}
      </Stack>
      <Typography variant="body2" color="text.primary" sx={{ mt: 1 }}>{touchpoint.note}</Typography>
      <Box sx={{ mt: 1, p: 1, borderRadius: 1, bgcolor: 'background.default' }}>
        <Typography variant="caption" color="primary" fontWeight={800}>Next step</Typography>
        <Typography variant="body2" color="text.primary">{touchpoint.nextStep}</Typography>
        <Typography variant="caption">Target completion: {formatDate(touchpoint.targetCompletionDate)}</Typography>
      </Box>
      <Divider sx={{ my: 1 }} />
      <Stack direction="row" gap={1} flexWrap="wrap">
        <Chip label={`Created by ${touchpoint.createdBy?.name || 'Unknown'} - ${formatAuditTimestamp(touchpoint.createdAt)}`} size="small" variant="outlined" />
        <Chip label={`Updated by ${touchpoint.updatedBy?.name || 'Unknown'} - ${formatAuditTimestamp(touchpoint.updatedAt)}`} size="small" variant="outlined" />
        {touchpoint.deletedBy && (
          <Chip label={`Deleted by ${touchpoint.deletedBy?.name || 'Unknown'} - ${formatAuditTimestamp(touchpoint.deletedAt)}`} size="small" color="error" variant="outlined" />
        )}
      </Stack>
    </Box>
  );
};

const TouchReportsPanel = ({ canManage, contacts, contactsById, onDelete, onEdit, onLog, selectedPartnerId, setSelectedPartnerId, touchpoints }) => {
  const selectedTouchpoints = sortTouchpoints(touchpoints.filter((touchpoint) => touchpoint.contactId === selectedPartnerId));
  const selectedContact = contactsById[selectedPartnerId];

  return (
    <Box sx={{ bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider', p: 1.5, mb: 3 }}>
      <Stack direction={{ xs: 'column', lg: 'row' }} justifyContent="space-between" gap={1.5} sx={{ mb: 1.5 }}>
        <Box>
          <Typography variant="h3">Touch Reports</Typography>
          <Typography variant="body2">One report stream per partner, with next steps and target completion dates.</Typography>
        </Box>
        <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center">
          <Chip
            icon={<ManageAccountsOutlinedIcon />}
            label={canManage ? 'Touch reports editable' : 'Touch report CRUD is Dana/Nina only'}
            color={canManage ? 'success' : 'default'}
            variant={canManage ? 'filled' : 'outlined'}
          />
          <Button variant="contained" startIcon={<AddIcon />} disabled={!canManage || !selectedPartnerId} onClick={() => onLog(selectedPartnerId)}>
            Log Touch Report
          </Button>
        </Stack>
      </Stack>

      <Box sx={{ overflowX: 'auto', pb: 1 }}>
        <ToggleButtonGroup
          exclusive
          value={selectedPartnerId}
          aria-label="Touch report partner"
          onChange={(_, value) => value && setSelectedPartnerId(value)}
          size="small"
          sx={{ minWidth: { xs: 640, md: 'auto' } }}
        >
          {contacts.map((contact) => (
            <ToggleButton key={contact.id} value={contact.id}>{contact.name}</ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      <Stack gap={1} sx={{ mt: 1.5 }}>
        {selectedTouchpoints.length ? selectedTouchpoints.map((touchpoint) => (
          <TouchReportCard
            key={touchpoint.id}
            canManage={canManage}
            contact={selectedContact}
            onDelete={onDelete}
            onEdit={onEdit}
            touchpoint={touchpoint}
          />
        )) : (
          <Box sx={{ border: '1px dashed', borderColor: 'divider', borderRadius: 1, p: 2, textAlign: 'center' }}>
            <Typography variant="body1" fontWeight={800}>No touch reports yet</Typography>
            <Typography variant="body2">The first report for this partner will start the activity history.</Typography>
          </Box>
        )}
      </Stack>
    </Box>
  );
};

const PartnerProfilePanel = ({ contactsById, selectedPartnerId, touchpoints }) => {
  const contact = contactsById[selectedPartnerId];
  if (!contact) return null;
  const activeTouchpoints = sortTouchpoints(touchpoints.filter((touchpoint) => (
    touchpoint.contactId === contact.id && isActiveTouchpoint(touchpoint)
  )));

  return (
    <Box sx={{ bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider', p: 1.5, mb: 3 }}>
      <Stack direction={{ xs: 'column', lg: 'row' }} justifyContent="space-between" gap={1.5} sx={{ mb: 1.5 }}>
        <Box>
          <Typography variant="h3">Partner Profile</Typography>
          <Typography variant="body2">{contact.name} profile record for goals, context, and linked activity.</Typography>
        </Box>
        <Stack direction="row" gap={1} flexWrap="wrap">
          <Chip label={contact.stage} color="primary" variant="outlined" />
          <Chip label="Partner Profiles folder equivalent" variant="outlined" />
        </Stack>
      </Stack>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.1fr 0.9fr' }, gap: 1.5 }}>
        <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.25 }}>
          <Typography variant="body1" fontWeight={800}>Profile summary</Typography>
          <Typography variant="body2" color="text.primary" sx={{ mt: 0.75 }}>{contact.profileSummary}</Typography>
          <Divider sx={{ my: 1.25 }} />
          <Typography variant="body1" fontWeight={800}>Goals</Typography>
          <Stack gap={0.75} sx={{ mt: 0.75 }}>
            {contact.profileGoals?.map((goal) => (
              <Stack key={goal} direction="row" gap={1} alignItems="flex-start">
                <CheckCircleOutlineOutlinedIcon color="success" fontSize="small" />
                <Typography variant="body2" color="text.primary">{goal}</Typography>
              </Stack>
            ))}
          </Stack>
          <Divider sx={{ my: 1.25 }} />
          <Typography variant="body1" fontWeight={800}>History</Typography>
          <Typography variant="body2" color="text.primary" sx={{ mt: 0.75 }}>{contact.contextHistory}</Typography>
        </Box>

        <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.25 }}>
          <Typography variant="body1" fontWeight={800}>Assigned stewardship</Typography>
          <Stack direction="row" gap={1} alignItems="center" sx={{ mt: 1 }}>
            <UserAvatar user={contact.lead} size="sm" />
            <Box>
              <Typography variant="body2" fontWeight={700}>{contact.lead?.name}</Typography>
              <Typography variant="caption">Lead</Typography>
            </Box>
          </Stack>
          <Stack gap={0.75} sx={{ mt: 1 }}>
            {contact.support?.map((supportUser) => (
              <Stack key={supportUser.id} direction="row" gap={1} alignItems="center">
                <UserAvatar user={supportUser} size="sm" />
                <Typography variant="body2">{supportUser.name} support</Typography>
              </Stack>
            ))}
          </Stack>
          <Divider sx={{ my: 1.25 }} />
          <Chip label={`Last touched ${formatDate(latestTouchpointDate(contact, touchpoints))}`} color="primary" />
          <Typography variant="body2" color="text.primary" sx={{ mt: 1 }}>{contact.nextStep}</Typography>
          <Divider sx={{ my: 1.25 }} />
          <Typography variant="body1" fontWeight={800}>Recent activity</Typography>
          <Stack gap={0.75} sx={{ mt: 0.75 }}>
            {activeTouchpoints.slice(0, 3).map((touchpoint) => (
              <Box key={touchpoint.id} sx={{ p: 1, borderRadius: 1, bgcolor: 'background.default' }}>
                <Typography variant="caption" color="primary" fontWeight={800}>{formatDate(touchpoint.date)} - {touchpoint.type}</Typography>
                <Typography variant="body2" color="text.primary">{touchpoint.nextStep}</Typography>
              </Box>
            ))}
          </Stack>
        </Box>
      </Box>
    </Box>
  );
};

const TeamsAdaptiveCardPreview = ({ contactsById, touchpoints }) => {
  const sample = sortTouchpoints(touchpoints.filter(isActiveTouchpoint))[0];
  const partner = sample ? contactsById[sample.contactId] : null;
  const card = buildTeamsCardModel(sample, partner);

  return (
    <Box sx={{ bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider', p: 1.5, mb: 3 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={1.5} sx={{ mb: 1.5 }}>
        <Box>
          <Typography variant="h3">Teams Adaptive Cards</Typography>
          <Typography variant="body2">Touch report updates and due-date reminders can be posted into Teams from this payload shape.</Typography>
        </Box>
        <Button
          href="/api/teams/advocacy-touchpoint-card"
          target="_blank"
          rel="noreferrer"
          variant="outlined"
          startIcon={<OutboundOutlinedIcon />}
        >
          View JSON
        </Button>
      </Stack>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '0.9fr 1.1fr' }, gap: 1.5 }}>
        <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
          <Box sx={{ bgcolor: '#f3f2f1', px: 1.25, py: 0.75 }}>
            <Typography variant="caption" fontWeight={800}>Microsoft Teams card preview</Typography>
          </Box>
          <Box sx={{ p: 1.25 }}>
            <Typography variant="body1" fontWeight={800}>Advocacy touchpoint updated</Typography>
            <Divider sx={{ my: 1 }} />
            <Stack gap={0.75}>
              <Typography variant="body2"><strong>Partner:</strong> {partner?.name || 'Partner not selected'}</Typography>
              <Typography variant="body2"><strong>Touch date:</strong> {formatDate(sample?.date)}</Typography>
              <Typography variant="body2"><strong>Next step:</strong> {sample?.nextStep || 'No next step recorded'}</Typography>
              <Typography variant="body2"><strong>Target:</strong> {formatDate(sample?.targetCompletionDate)}</Typography>
              <Typography variant="body2"><strong>Changed by:</strong> {sample?.updatedBy?.name || sample?.createdBy?.name || 'Unknown'}</Typography>
            </Stack>
            <Stack direction="row" gap={1} sx={{ mt: 1.25 }}>
              <Button size="small" variant="contained">Open Profile</Button>
              <Button size="small" variant="outlined">Open Calendar</Button>
            </Stack>
          </Box>
        </Box>

        <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.25, bgcolor: 'background.default' }}>
          <Typography variant="caption" color="primary" fontWeight={800}>Adaptive Card JSON</Typography>
          <Box
            component="pre"
            sx={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontFamily: 'Consolas, monospace',
              fontSize: '0.76rem',
              m: 0,
              mt: 1,
            }}
          >
            {JSON.stringify(card, null, 2)}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

const AdvocacyDashboard = () => {
  const { user } = useAuth();
  const { addCalendarEvent, updateCalendarEvent } = useCalendarEvents();
  const { weeklyPriorityEntriesByWeek } = useOperatingData();
  const [period, setPeriod] = useState('month');
  const [contacts, setContacts] = useState(advocacyContacts);
  const [touchpoints, setTouchpoints] = useState(advocacyTouchpoints);
  const [initiatives, setInitiatives] = useState(advocacyInitiatives);
  const [workplans, setWorkplans] = useState(advocacyWorkplans);
  const [selectedPartnerId, setSelectedPartnerId] = useState(advocacyContacts[0]?.id || '');
  const [dialog, setDialog] = useState({ open: false, type: null, mode: 'create', item: null });
  const [partnerDialog, setPartnerDialog] = useState({ open: false, item: null });
  const [touchpointDialog, setTouchpointDialog] = useState({ open: false, item: null, contactId: null });

  const canManageTouchpoints = user.id === danaUser.id || user.id === ninaUser?.id;
  const isDelegatedAdvocacyOperator = user.id === ninaUser?.id;
  const currentPeriod = periods.find((item) => item.value === period) || periods[2];

  const visibleTouchpoints = touchpoints.filter((touchpoint) => (
    isActiveTouchpoint(touchpoint) && touchpointIsInPeriod(touchpoint, period)
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

  const currentWeeklyPriorities = weeklyPriorityEntriesByWeek[currentWeeklyReport.id] || [];
  const dashboardSubject = isDelegatedAdvocacyOperator ? danaUser : user;
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
  const closePartnerDialog = () => setPartnerDialog({ open: false, item: null });

  const openTouchpointDialog = (contactId = selectedPartnerId, item = null) => {
    if (!canManageTouchpoints) return;
    setTouchpointDialog({ open: true, item, contactId: item?.contactId || contactId });
  };

  const closeTouchpointDialog = () => setTouchpointDialog({ open: false, item: null, contactId: null });

  const updatePartnerFromTouchpoint = (touchpoint) => {
    setContacts((current) => current.map((contact) => (
      contact.id === touchpoint.contactId
        ? {
          ...contact,
          lastTouchpoint: touchpoint.date,
          nextStep: touchpoint.nextStep,
          targetCompletionDate: touchpoint.targetCompletionDate,
          stage: contact.stage === 'New' ? 'Active Conversation' : contact.stage,
        }
        : contact
    )));
  };

  const savePartner = (form) => {
    if (!canManageTouchpoints) return;
    const partnerId = form.id || `partner-${Date.now()}`;
    const partner = {
      ...form,
      contextHistory: '',
      id: partnerId,
      lastTouchpoint: form.lastTouchpoint || '',
      lead: danaUser,
      organizationName: form.name,
      profileGoals: [],
      profileSummary: form.profileSummary || '',
      profileUrl: `#${partnerId}`,
      support: [ninaUser].filter(Boolean),
    };

    setContacts((current) => {
      const nextContacts = form.id
        ? current.map((contact) => (contact.id === form.id ? partner : contact))
        : [partner, ...current];
      return nextContacts;
    });
    setSelectedPartnerId(partner.id);
  };

  const saveTouchpoint = (form) => {
    if (!canManageTouchpoints) return;

    const now = new Date().toISOString();
    const existing = form.id ? touchpoints.find((touchpoint) => touchpoint.id === form.id) : null;
    const partner = contactsById[form.contactId];
    let calendarEventId = existing?.calendarEventId || null;
    const baseTouchpoint = {
      ...existing,
      ...form,
      id: existing?.id || `touch-${Date.now()}`,
      period,
      status: 'active',
      createdBy: existing?.createdBy || user,
      createdAt: existing?.createdAt || now,
      updatedBy: user,
      updatedAt: now,
      deletedBy: null,
      deletedAt: null,
    };

    if (partner && baseTouchpoint.targetCompletionDate) {
      const eventValues = createFollowUpEventValues(baseTouchpoint, partner);
      if (calendarEventId) {
        updateCalendarEvent(calendarEventId, eventValues);
      } else {
        const event = addCalendarEvent(eventValues, 'personal', danaUser);
        calendarEventId = event.id;
      }
    }

    const savedTouchpoint = { ...baseTouchpoint, calendarEventId };
    setTouchpoints((current) => (
      existing
        ? current.map((touchpoint) => touchpoint.id === savedTouchpoint.id ? savedTouchpoint : touchpoint)
        : [savedTouchpoint, ...current]
    ));
    updatePartnerFromTouchpoint(savedTouchpoint);
    setSelectedPartnerId(savedTouchpoint.contactId);
  };

  const deleteTouchpoint = (touchpointId) => {
    if (!canManageTouchpoints) return;
    const now = new Date().toISOString();
    setTouchpoints((current) => current.map((touchpoint) => (
      touchpoint.id === touchpointId
        ? { ...touchpoint, status: 'deleted', deletedBy: user, deletedAt: now, updatedBy: user, updatedAt: now }
        : touchpoint
    )));
  };

  const saveEntity = (type, form) => {
    if (type === 'workplan') {
      const pillar = strategicPillarById[form.strategicPillarId] || strategicPillarById['advocate-change'];
      const next = {
        ...form,
        id: form.id || `aw-${Date.now()}`,
        lead: users.find((candidate) => candidate.id === form.leadId) || danaUser,
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
        owner: danaUser,
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
          <UserAvatar user={danaUser} size="xl" />
          <Box>
            <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 800, textTransform: 'uppercase' }}>
              Primary Advocate - Chief Executive Officer
            </Typography>
            <Typography variant="h1" sx={{ lineHeight: 1.05 }}>Advocacy Command Center</Typography>
            <Typography variant="body2">Advocacy activity layer for Dana's partner touchpoints - June 2026</Typography>
          </Box>
        </Stack>

        <Stack alignItems={{ xs: 'flex-start', lg: 'flex-end' }} gap={1}>
          <Box>
            <Typography variant="caption" component="div" sx={{ mb: 0.5, textAlign: { xs: 'left', lg: 'right' } }}>Time scope</Typography>
            <ToggleButtonGroup exclusive value={period} aria-label="Advocacy reporting period" onChange={(_, value) => value && setPeriod(value)} size="small">
              {periods.map((item) => <ToggleButton key={item.value} value={item.value}>{item.label}</ToggleButton>)}
            </ToggleButtonGroup>
          </Box>
          <Chip
            icon={<ManageAccountsOutlinedIcon />}
            label={isDelegatedAdvocacyOperator ? 'Signed in as Nina: delegated touch-report access' : canManageTouchpoints ? 'Dana can manage her advocacy records' : 'Dana and Nina manage touch reports'}
            color={canManageTouchpoints ? 'success' : 'default'}
            variant={canManageTouchpoints ? 'filled' : 'outlined'}
          />
        </Stack>
      </Stack>

      <Box sx={{ bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider', boxShadow: 1, p: { xs: 2, md: 3 }, mb: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'flex-start' }} gap={2} sx={{ mb: 2 }}>
          <Box>
            <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 800, textTransform: 'uppercase' }}>
              {currentPeriod.title} - {currentPeriod.context}
            </Typography>
            <Typography variant="h2" sx={{ mt: 0.5 }}>{visibleTouchpoints.length} touch reports logged</Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} disabled={!canManageTouchpoints || !contacts.length} onClick={() => openTouchpointDialog()}>
            Log Touch Report
          </Button>
        </Stack>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 1.5 }}>
          <SummaryMetric
            icon={<CalendarMonthOutlinedIcon fontSize="small" />}
            label="Scheduled next steps"
            value={scheduledContacts.length}
            helper={scheduledContacts.length ? `${scheduledContacts.length} next actions queued` : 'Nothing scheduled'}
          />
          <SummaryMetric
            icon={<CheckCircleOutlineOutlinedIcon fontSize="small" />}
            label="Completed activity"
            value={visibleTouchpoints.length}
            helper={visibleTouchpoints.length ? `${touchpointCircleCount} circles touched` : 'No reports yet'}
          />
          <SummaryMetric
            icon={<WarningAmberOutlinedIcon fontSize="small" />}
            label="Overdue partners"
            value={overdueContacts.length}
            helper={overdueContacts.length ? 'Review required follow-ups' : 'All cadences healthy'}
          />
        </Box>
      </Box>

      <PartnerRegister
        canManage={canManageTouchpoints}
        contacts={contacts}
        onAdd={() => setPartnerDialog({ open: true, item: null })}
        onLog={(contactId) => openTouchpointDialog(contactId)}
        onSelect={setSelectedPartnerId}
        selectedPartnerId={selectedPartnerId}
        touchpoints={touchpoints}
      />

      <TouchReportsPanel
        canManage={canManageTouchpoints}
        contacts={contacts}
        contactsById={contactsById}
        onDelete={deleteTouchpoint}
        onEdit={(item) => openTouchpointDialog(item.contactId, item)}
        onLog={(contactId) => openTouchpointDialog(contactId)}
        selectedPartnerId={selectedPartnerId}
        setSelectedPartnerId={setSelectedPartnerId}
        touchpoints={touchpoints}
      />

      <PartnerProfilePanel contactsById={contactsById} selectedPartnerId={selectedPartnerId} touchpoints={touchpoints} />

      <TeamsAdaptiveCardPreview contactsById={contactsById} touchpoints={touchpoints} />

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
              <Typography variant="h3">Top partners requiring follow-up</Typography>
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
            <Typography variant="body2">Every partner has been touched within their target window.</Typography>
          </Box>
        ) : (
          <Stack gap={1}>
            {topFollowUps.map((item) => <FollowUpRow key={item.contact.id} item={item} />)}
          </Stack>
        )}
      </Box>

      <CurrentWeekPrioritiesSection entries={currentWeeklyPriorities} user={dashboardSubject} />

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
                  <Typography variant="body2">{workplan.department} - due {formatDate(workplan.due)}</Typography>
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
      />
      <PartnerDialog
        item={partnerDialog.item}
        onClose={closePartnerDialog}
        onSave={savePartner}
        open={partnerDialog.open}
      />
      <TouchpointDialog
        contacts={contacts}
        initialContactId={touchpointDialog.contactId || selectedPartnerId}
        item={touchpointDialog.item}
        onClose={closeTouchpointDialog}
        onSave={saveTouchpoint}
        open={touchpointDialog.open}
      />
    </Box>
  );
};

export default AdvocacyDashboard;
