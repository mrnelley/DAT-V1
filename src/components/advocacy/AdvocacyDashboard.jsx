import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControl, IconButton, InputLabel, LinearProgress, MenuItem, Select, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { advocacyContacts, advocacyInitiatives, advocacyPriorities, advocacyTouchpoints, advocacyWorkplans, users } from '../../data/mockData';
import UserAvatar from '../shared/UserAvatar';

const periods = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'quarter', label: 'Quarter' },
  { value: 'year', label: 'Year' },
];

const statusColor = {
  'On Course': 'success',
  'Needs Attention': 'warning',
  'Off Course': 'error',
  Completed: 'success',
};

const statusTone = {
  'On Course': 'success.main',
  'Needs Attention': 'warning.main',
  'Off Course': 'error.main',
  Completed: 'success.dark',
};

const entityLabels = {
  priority: 'Priority',
  workplan: 'Departmental Workplan',
  initiative: 'Quarterly Initiative',
};

const emptyEntity = (type) => {
  if (type === 'priority') {
    return {
      title: '',
      status: 'On Course',
      target: 5,
      current: 0,
      circle: 'Local Government',
      workplanId: '',
      initiativeId: '',
      nextAction: '',
    };
  }

  if (type === 'workplan') {
    return {
      title: '',
      department: 'Executive Office',
      leadId: users[0].id,
      initiativeId: '',
      status: 'On Course',
      due: '2026-06-14',
      progress: 50,
      outcome: '',
    };
  }

  return {
    title: '',
    quarter: 'Q2 2026',
    status: 'On Course',
    target: 20,
    current: 0,
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
      setForm((current) => ({ ...current, workplanId: value, initiativeId: workplan?.initiativeId || current.initiativeId }));
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
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{mode === 'edit' ? 'Edit' : 'Add'} {entityLabels[type]}</DialogTitle>
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
                  <Select label="Status" value={form.status || 'On Course'} onChange={update('status')}>
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
                  <Select label="Status" value={form.status || 'On Course'} onChange={update('status')}>
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
              <TextField label="Outcome" value={form.outcome || ''} onChange={update('outcome')} multiline minRows={2} />
            </>
          )}

          {type === 'initiative' && (
            <>
              <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
                <TextField label="Quarter" value={form.quarter || ''} onChange={update('quarter')} fullWidth />
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select label="Status" value={form.status || 'On Course'} onChange={update('status')}>
                    {Object.keys(statusColor).map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
                  </Select>
                </FormControl>
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
                <TextField label="Current" type="number" value={form.current || 0} onChange={update('current')} fullWidth />
                <TextField label="Target" type="number" value={form.target || 0} onChange={update('target')} fullWidth />
              </Stack>
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

const StatCard = ({ label, value, helper }) => (
  <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5, minHeight: 104 }}>
    <Typography variant="caption">{label}</Typography>
    <Typography variant="h2" sx={{ my: 0.5 }}>{value}</Typography>
    <Typography variant="body2">{helper}</Typography>
  </Box>
);

const AdvocacyDashboard = () => {
  const [period, setPeriod] = useState('week');
  const [contacts] = useState(advocacyContacts);
  const [touchpoints] = useState(advocacyTouchpoints);
  const [initiatives, setInitiatives] = useState(advocacyInitiatives);
  const [workplans, setWorkplans] = useState(advocacyWorkplans);
  const [priorities, setPriorities] = useState(advocacyPriorities);
  const [dialog, setDialog] = useState({ open: false, type: null, mode: 'create', item: null });

  const periodIndex = periods.findIndex((item) => item.value === period);
  const visibleTouchpoints = touchpoints.filter((touchpoint) => (
    periods.findIndex((item) => item.value === touchpoint.period) <= periodIndex
  ));

  const contactsById = useMemo(() => (
    Object.fromEntries(contacts.map((contact) => [contact.id, contact]))
  ), [contacts]);

  const initiativesById = useMemo(() => (
    Object.fromEntries(initiatives.map((initiative) => [initiative.id, initiative]))
  ), [initiatives]);

  const workplansById = useMemo(() => (
    Object.fromEntries(workplans.map((workplan) => [workplan.id, workplan]))
  ), [workplans]);

  const touchpointCircleCount = new Set(
    visibleTouchpoints.map((touchpoint) => contactsById[touchpoint.contactId]?.circle).filter(Boolean),
  ).size;

  const totalPriorityTarget = priorities.reduce((sum, priority) => sum + Number(priority.target || 0), 0);
  const totalPriorityCurrent = priorities.reduce((sum, priority) => sum + Number(priority.current || 0), 0);
  const priorityProgress = totalPriorityTarget ? Math.round((totalPriorityCurrent / totalPriorityTarget) * 100) : 0;
  const highValueFollowUps = contacts.filter((contact) => contact.influence === 'High' && contact.stage !== 'Nurture').length;

  const openDialog = (type, mode = 'create', item = null) => {
    setDialog({ open: true, type, mode, item });
  };

  const closeDialog = () => setDialog({ open: false, type: null, mode: 'create', item: null });

  const saveEntity = (type, form) => {
    if (type === 'priority') {
      const next = {
        ...form,
        id: form.id || `ap-${Date.now()}`,
        owner: users[0],
        weekOf: form.weekOf || '2026-05-11',
        current: Number(form.current || 0),
        target: Number(form.target || 0),
      };
      setPriorities((current) => (form.id ? current.map((item) => item.id === form.id ? next : item) : [...current, next]));
    }

    if (type === 'workplan') {
      const next = {
        ...form,
        id: form.id || `aw-${Date.now()}`,
        lead: users.find((user) => user.id === form.leadId) || users[0],
        progress: Number(form.progress || 0),
      };
      setWorkplans((current) => (form.id ? current.map((item) => item.id === form.id ? next : item) : [...current, next]));
    }

    if (type === 'initiative') {
      const next = {
        ...form,
        id: form.id || `ai-${Date.now()}`,
        owner: users[0],
        current: Number(form.current || 0),
        target: Number(form.target || 0),
      };
      setInitiatives((current) => (form.id ? current.map((item) => item.id === form.id ? next : item) : [...current, next]));
    }
  };

  const deleteEntity = (type, id) => {
    if (type === 'priority') {
      setPriorities((current) => current.filter((item) => item.id !== id));
    }

    if (type === 'workplan') {
      setWorkplans((current) => current.filter((item) => item.id !== id));
      setPriorities((current) => current.map((priority) => priority.workplanId === id ? { ...priority, workplanId: '' } : priority));
    }

    if (type === 'initiative') {
      setInitiatives((current) => current.filter((item) => item.id !== id));
      setWorkplans((current) => current.map((workplan) => workplan.initiativeId === id ? { ...workplan, initiativeId: '' } : workplan));
      setPriorities((current) => current.map((priority) => priority.initiativeId === id ? { ...priority, initiativeId: '' } : priority));
    }
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Stack direction={{ xs: 'column', lg: 'row' }} justifyContent="space-between" alignItems={{ lg: 'center' }} gap={2} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h2">CEO Advocacy Dashboard</Typography>
          <Typography variant="body2">Relationship touchpoints, weekly priorities, departmental workplans, and quarterly initiatives.</Typography>
        </Box>
        <ToggleButtonGroup exclusive value={period} onChange={(_, value) => value && setPeriod(value)} size="small">
          {periods.map((item) => <ToggleButton key={item.value} value={item.value}>{item.label}</ToggleButton>)}
        </ToggleButtonGroup>
      </Stack>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 1.5, mb: 2 }}>
        <StatCard label="Touchpoints" value={visibleTouchpoints.length} helper={`Tracked for this ${period}.`} />
        <StatCard label="Circles Reached" value={touchpointCircleCount} helper="Government, coalition, resident, and partner circles." />
        <StatCard label="Weekly Priority Progress" value={`${priorityProgress}%`} helper={`${totalPriorityCurrent} of ${totalPriorityTarget} target touchpoints complete.`} />
        <StatCard label="High-Value Follow-Ups" value={highValueFollowUps} helper="Relationships still needing CEO action." />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '1.35fr 0.9fr' }, gap: 2, mb: 2 }}>
        <Box sx={{ bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" gap={1} alignItems="center">
              <PeopleAltOutlinedIcon color="primary" />
              <Typography variant="h3">Advocacy Relationships</Typography>
            </Stack>
            <Chip label="Lead view" color="primary" variant="outlined" />
          </Stack>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Relationship</TableCell>
                <TableCell>Circle</TableCell>
                <TableCell>Stage</TableCell>
                <TableCell>Last Touchpoint</TableCell>
                <TableCell>Next Step</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {contacts.map((contact) => (
                <TableRow key={contact.id} hover>
                  <TableCell>
                    <Stack direction="row" gap={1} alignItems="center">
                      <UserAvatar user={{ initials: contact.name.split(' ').map((part) => part[0]).slice(0, 2).join(''), name: contact.name }} size="sm" />
                      <Box>
                        <Typography variant="body1" fontWeight={700}>{contact.name}</Typography>
                        <Typography variant="caption">{contact.relationship} influence: {contact.influence}</Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>{contact.circle}</TableCell>
                  <TableCell><Chip label={contact.stage} size="small" color={contact.stage === 'Follow-up' ? 'warning' : 'primary'} variant="outlined" /></TableCell>
                  <TableCell>{contact.lastTouchpoint}</TableCell>
                  <TableCell>{contact.nextStep}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>

        <Box sx={{ bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider', p: 1.5 }}>
          <Typography variant="h3" sx={{ mb: 1 }}>Touchpoint Timeline</Typography>
          <Stack gap={1}>
            {visibleTouchpoints.map((touchpoint) => {
              const contact = contactsById[touchpoint.contactId];
              return (
                <Box key={touchpoint.id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1 }}>
                  <Stack direction="row" justifyContent="space-between" gap={1}>
                    <Typography variant="body1" fontWeight={700}>{touchpoint.type}</Typography>
                    <Typography variant="caption">{touchpoint.date}</Typography>
                  </Stack>
                  <Typography variant="body2">{contact?.name} - {contact?.circle}</Typography>
                  <Typography variant="body2" color="text.primary">{touchpoint.note}</Typography>
                </Box>
              );
            })}
          </Stack>
        </Box>
      </Box>

      <Box sx={{ bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider', p: 1.5 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={1.5} sx={{ mb: 1.5 }}>
          <Box>
            <Typography variant="h3">Linked Advocacy Work</Typography>
            <Typography variant="body2">Weekly CEO priorities connect to departmental workplans and quarterly initiatives.</Typography>
          </Box>
          <Stack direction="row" gap={1} flexWrap="wrap">
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => openDialog('priority')}>Add Priority</Button>
            <Button variant="outlined" startIcon={<AddIcon />} onClick={() => openDialog('workplan')}>Add Workplan</Button>
            <Button variant="outlined" startIcon={<AddIcon />} onClick={() => openDialog('initiative')}>Add Initiative</Button>
          </Stack>
        </Stack>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '1.2fr 1fr 1fr' }, gap: 1.5 }}>
          <Box>
            <Typography variant="h4" sx={{ mb: 1 }}>Individual Priorities This Week</Typography>
            <Stack gap={1}>
              {priorities.map((priority) => {
                const workplan = workplansById[priority.workplanId];
                const initiative = initiativesById[priority.initiativeId];
                const progress = priority.target ? Math.min(100, Math.round((priority.current / priority.target) * 100)) : 0;
                return (
                  <Box key={priority.id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.25 }}>
                    <Stack direction="row" justifyContent="space-between" gap={1}>
                      <Typography variant="body1" fontWeight={700}>{priority.title}</Typography>
                      <Stack direction="row">
                        <Tooltip title="Edit priority"><IconButton size="small" onClick={() => openDialog('priority', 'edit', priority)}><EditOutlinedIcon fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Delete priority"><IconButton size="small" onClick={() => deleteEntity('priority', priority.id)}><DeleteOutlineIcon fontSize="small" /></IconButton></Tooltip>
                      </Stack>
                    </Stack>
                    <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap" sx={{ my: 1 }}>
                      <Chip label={priority.status} color={statusColor[priority.status]} size="small" />
                      <Chip label={priority.circle} size="small" variant="outlined" />
                      <Chip icon={<LinkOutlinedIcon />} label={workplan?.title || 'Unlinked workplan'} size="small" variant="outlined" />
                      <Chip icon={<LinkOutlinedIcon />} label={initiative?.title || 'Unlinked initiative'} size="small" variant="outlined" />
                    </Stack>
                    <LinearProgress value={progress} variant="determinate" sx={{ mb: 0.75, '& .MuiLinearProgress-bar': { bgcolor: statusTone[priority.status] } }} />
                    <Typography variant="caption">{priority.current} of {priority.target} touchpoints complete</Typography>
                    <Typography variant="body2" color="text.primary" sx={{ mt: 0.75 }}>{priority.nextAction}</Typography>
                  </Box>
                );
              })}
            </Stack>
          </Box>

          <Box>
            <Typography variant="h4" sx={{ mb: 1 }}>Departmental Workplans</Typography>
            <Stack gap={1}>
              {workplans.map((workplan) => (
                <Box key={workplan.id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.25 }}>
                  <Stack direction="row" justifyContent="space-between" gap={1}>
                    <Typography variant="body1" fontWeight={700}>{workplan.title}</Typography>
                    <Stack direction="row">
                      <Tooltip title="Edit workplan"><IconButton size="small" onClick={() => openDialog('workplan', 'edit', workplan)}><EditOutlinedIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Delete workplan"><IconButton size="small" onClick={() => deleteEntity('workplan', workplan.id)}><DeleteOutlineIcon fontSize="small" /></IconButton></Tooltip>
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
                const linkedPriorities = priorities.filter((priority) => priority.initiativeId === initiative.id).length;
                return (
                  <Box key={initiative.id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.25 }}>
                    <Stack direction="row" justifyContent="space-between" gap={1}>
                      <Typography variant="body1" fontWeight={700}>{initiative.title}</Typography>
                      <Stack direction="row">
                        <Tooltip title="Edit initiative"><IconButton size="small" onClick={() => openDialog('initiative', 'edit', initiative)}><EditOutlinedIcon fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Delete initiative"><IconButton size="small" onClick={() => deleteEntity('initiative', initiative.id)}><DeleteOutlineIcon fontSize="small" /></IconButton></Tooltip>
                      </Stack>
                    </Stack>
                    <Stack direction="row" gap={1} flexWrap="wrap" sx={{ my: 1 }}>
                      <Chip label={initiative.quarter} color="primary" size="small" />
                      <Chip label={initiative.status} color={statusColor[initiative.status]} size="small" />
                      <Chip label={`${linkedWorkplans} workplans`} size="small" variant="outlined" />
                      <Chip label={`${linkedPriorities} priorities`} size="small" variant="outlined" />
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
    </Box>
  );
};

export default AdvocacyDashboard;
