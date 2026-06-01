import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import AssignmentIndOutlinedIcon from '@mui/icons-material/AssignmentIndOutlined';
import MoreHorizOutlinedIcon from '@mui/icons-material/MoreHorizOutlined';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import { Alert, Box, Button, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControl, IconButton, InputLabel, List, ListItem, MenuItem, Select, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import React from 'react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useActionFeedback } from '../../context/ActionFeedbackContext';
import { useNotifications } from '../../context/NotificationsContext';
import { actionItems, users } from '../../data/mockData';
import { useAuth } from '../../hooks/useAuth';
import PageWrapper from '../layout/PageWrapper';
import UserAvatar from '../shared/UserAvatar';

const chipColor = (due) => {
  const today = '2026-05-13';
  if (due < today) return 'error';
  if (due === today) return 'warning';
  return 'default';
};

const visibilityLabels = {
  private: 'Assigned and created by',
  department: 'Department',
  olt: 'OLT',
  organization: 'All users',
};

const buildInitialForm = (user) => ({
  description: '',
  ownerId: user.id,
  due: '2026-05-19',
  status: 'Open',
  visibility: 'private',
  priority: 'Operational Efficiency',
  strategicPillar: 'Agility & Capacity',
});

const buildAssignmentForm = (item) => ({
  due: item?.due || '2026-05-19',
  note: '',
  ownerId: item?.owner?.id || '',
  status: item?.status || 'Open',
  visibility: item?.visibility || 'private',
});

const isLeadershipUser = (user) => ['ELT', 'OLT'].includes(user.workingGroup);

const isInvolved = (item, user) => (
  item.owner?.id === user.id
  || item.createdBy?.id === user.id
  || item.assignments?.some((assignment) => assignment.profile?.id === user.id)
);

const canManageActionItem = (item, user) => isLeadershipUser(user) || isInvolved(item, user);

const canViewActionItem = (item, user) => (
  isInvolved(item, user)
  || item.visibility === 'organization'
  || (item.visibility === 'department' && item.department === user.department)
  || (item.visibility === 'olt' && user.workingGroup === 'OLT')
);

const ActionItemsPage = () => {
  const { user } = useAuth();
  const { unavailable } = useActionFeedback();
  const { addNotification } = useNotifications();
  const [searchParams, setSearchParams] = useSearchParams();
  const [scope, setScope] = useState('My Items');
  const [items, setItems] = useState(actionItems);
  const [completed, setCompleted] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(buildInitialForm(user));
  const [assignmentEvents, setAssignmentEvents] = useState([]);
  const [assignmentForm, setAssignmentForm] = useState(buildAssignmentForm());
  const [selectedItem, setSelectedItem] = useState(null);
  const visibleItems = items.filter((item) => {
    if (!canViewActionItem(item, user)) return false;
    if (scope === 'My Items') return isInvolved(item, user);
    if (scope === 'Department') return item.visibility === 'department' && item.department === user.department;
    if (scope === 'OLT') return item.visibility === 'olt' && user.workingGroup === 'OLT';
    return true;
  });

  useEffect(() => {
    if (searchParams.get('new') !== '1') return;

    setDialogOpen(true);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('new');
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  const closeDialog = () => {
    setDialogOpen(false);
    setForm(buildInitialForm(user));
  };
  const closeAssignmentDialog = () => {
    setSelectedItem(null);
    setAssignmentForm(buildAssignmentForm());
  };

  const addActionItem = () => {
    const owner = users.find((candidate) => candidate.id === form.ownerId) || user;
    setItems((current) => [
      {
        id: `action-custom-${Date.now()}`,
        description: form.description,
        owner,
        createdBy: user,
        department: owner.department,
        due: form.due,
        status: form.status,
        visibility: form.visibility,
        assignments: [
          { profile: owner, role: 'assignee' },
          { profile: user, role: 'assigned_by' },
        ],
        priority: form.priority,
        strategicPillar: form.strategicPillar,
      },
      ...current,
    ]);
    closeDialog();
  };

  const openAssignmentWorkflow = (item) => {
    if (!canManageActionItem(item, user)) {
      unavailable('only assigned users, creators, ELT, or OLT can update task assignments.');
      return;
    }

    setSelectedItem(item);
    setAssignmentForm(buildAssignmentForm(item));
  };

  const updateAssignment = (field) => (event) => setAssignmentForm((current) => ({ ...current, [field]: event.target.value }));

  const saveAssignment = () => {
    const owner = users.find((candidate) => candidate.id === assignmentForm.ownerId) || selectedItem.owner;
    const event = {
      id: `assignment-event-${Date.now()}`,
      actionItemId: selectedItem.id,
      actor: user,
      recipient: owner,
      message: `${user.name} assigned "${selectedItem.description}" to ${owner.name}.`,
      note: assignmentForm.note,
      scheduledFor: assignmentForm.due,
      visibility: assignmentForm.visibility,
    };

    setItems((current) => current.map((item) => (
      item.id === selectedItem.id
        ? {
          ...item,
          owner,
          department: owner.department,
          due: assignmentForm.due,
          status: assignmentForm.status,
          visibility: assignmentForm.visibility,
          assignments: [
            { profile: owner, role: 'assignee' },
            { profile: user, role: 'assigned_by' },
          ],
        }
        : item
    )));
    setAssignmentEvents((current) => [event, ...current]);
    addNotification({
      actionPath: '/action-items',
      actor: user,
      body: `${selectedItem.description} is due on ${assignmentForm.due}. ${assignmentForm.note}`.trim(),
      channel: 'in_app',
      notificationType: 'task_assigned',
      recipient: owner,
      sourceId: selectedItem.id,
      sourceType: 'action_item',
      title: `${user.name} assigned you a task`,
    });
    closeAssignmentDialog();
  };

  return (
    <PageWrapper>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h1">Action Items</Typography>
        <Button startIcon={<AddOutlinedIcon />} variant="contained" onClick={() => setDialogOpen(true)}>Add Action Item</Button>
      </Stack>
      <Stack direction="row" gap={2} sx={{ mb: 2 }}>
        <ToggleButtonGroup exclusive value={scope} onChange={(_, value) => value && setScope(value)}>
          <ToggleButton value="My Items">My Items</ToggleButton>
          <ToggleButton value="Department">Department</ToggleButton>
          <ToggleButton value="OLT">OLT</ToggleButton>
          <ToggleButton value="All Items">All Visible</ToggleButton>
        </ToggleButtonGroup>
        <Select size="small" defaultValue="Open"><MenuItem value="Open">Open</MenuItem><MenuItem value="In Progress">In Progress</MenuItem><MenuItem value="Complete">Complete</MenuItem></Select>
      </Stack>
      {assignmentEvents.length > 0 && (
        <Alert
          icon={<NotificationsActiveOutlinedIcon />}
          severity="info"
          sx={{ mb: 2 }}
        >
          Teams action card queued for {assignmentEvents[0].recipient.name}: {assignmentEvents[0].message}
        </Alert>
      )}
      <List sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>
        {visibleItems.map((item) => {
          const done = completed.includes(item.id);
          const canManage = canManageActionItem(item, user);
          return (
            <ListItem
              key={item.id}
              divider
              sx={{ alignItems: 'flex-start', gap: 1, bgcolor: done ? 'rgba(90, 100, 117, 0.08)' : 'transparent' }}
            >
              <Checkbox disabled={!canManage} checked={done} onChange={() => setCompleted((ids) => ids.includes(item.id) ? ids.filter((id) => id !== item.id) : [...ids, item.id])} sx={{ mt: 0.25 }} />
              <Box sx={{ flex: 1, minWidth: 240 }}>
                <Typography sx={{ textDecoration: done ? 'line-through' : 'none' }}>{item.description}</Typography>
                <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap" sx={{ mt: 0.75 }}>
                  <UserAvatar user={item.owner} size="sm" />
                  <Chip icon={chipColor(item.due) === 'error' ? <WarningAmberOutlinedIcon /> : undefined} label={item.due} color={chipColor(item.due)} size="small" />
                  <Chip icon={<VisibilityOutlinedIcon />} label={visibilityLabels[item.visibility] || 'Assigned and created by'} variant="outlined" size="small" />
                  <Chip label={item.priority} color="primary" variant="outlined" size="small" />
                  <Chip label={item.strategicPillar} variant="outlined" size="small" />
                </Stack>
              </Box>
              <IconButton disabled={!canManage} aria-label={`Open assignment workflow for action item ${item.description}`} onClick={() => openAssignmentWorkflow(item)}><MoreHorizOutlinedIcon /></IconButton>
            </ListItem>
          );
        })}
      </List>
      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>Add Action Item</DialogTitle>
        <DialogContent>
          <Stack gap={2} sx={{ pt: 1 }}>
            <TextField label="Task" value={form.description} onChange={update('description')} fullWidth />
            <TextField select label="Owner" value={form.ownerId} onChange={update('ownerId')} fullWidth>
              {users.map((candidate) => <MenuItem key={candidate.id} value={candidate.id}>{candidate.name} - {candidate.department}</MenuItem>)}
            </TextField>
            <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
              <TextField label="Due date" type="date" value={form.due} onChange={update('due')} fullWidth InputLabelProps={{ shrink: true }} />
              <TextField select label="Status" value={form.status} onChange={update('status')} fullWidth>
                <MenuItem value="Open">Open</MenuItem>
                <MenuItem value="In Progress">In Progress</MenuItem>
                <MenuItem value="Complete">Complete</MenuItem>
              </TextField>
            </Stack>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Advanced visibility</Typography>
              <FormControl fullWidth>
                <InputLabel id="action-item-visibility-label">Who can see this task?</InputLabel>
                <Select labelId="action-item-visibility-label" label="Who can see this task?" value={form.visibility} onChange={update('visibility')}>
                  <MenuItem value="private">Only assigned and created by</MenuItem>
                  <MenuItem value="department">Owner's department</MenuItem>
                  <MenuItem value="olt">Everyone in OLT</MenuItem>
                  <MenuItem value="organization">All users</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button variant="contained" onClick={addActionItem} disabled={!form.description.trim()}>Create</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={Boolean(selectedItem)} onClose={closeAssignmentDialog} fullWidth maxWidth="sm">
        <DialogTitle>Task Assignment Workflow</DialogTitle>
        <DialogContent>
          <Stack gap={2} sx={{ pt: 1 }}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Action item</Typography>
              <Typography>{selectedItem?.description}</Typography>
            </Box>
            <Divider />
            <TextField select label="Assign to" value={assignmentForm.ownerId} onChange={updateAssignment('ownerId')} fullWidth>
              {users.map((candidate) => <MenuItem key={candidate.id} value={candidate.id}>{candidate.name} - {candidate.department}</MenuItem>)}
            </TextField>
            <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
              <TextField label="Due date" type="date" value={assignmentForm.due} onChange={updateAssignment('due')} fullWidth InputLabelProps={{ shrink: true }} />
              <TextField select label="Status" value={assignmentForm.status} onChange={updateAssignment('status')} fullWidth>
                <MenuItem value="Open">Open</MenuItem>
                <MenuItem value="In Progress">In Progress</MenuItem>
                <MenuItem value="Complete">Complete</MenuItem>
                <MenuItem value="Blocked">Blocked</MenuItem>
              </TextField>
            </Stack>
            <FormControl fullWidth>
              <InputLabel id="task-assignment-visibility-label">Visibility</InputLabel>
              <Select labelId="task-assignment-visibility-label" label="Visibility" value={assignmentForm.visibility} onChange={updateAssignment('visibility')}>
                <MenuItem value="private">Only assigned and created by</MenuItem>
                <MenuItem value="department">Owner's department</MenuItem>
                <MenuItem value="olt">Everyone in OLT</MenuItem>
                <MenuItem value="organization">All users</MenuItem>
              </Select>
            </FormControl>
            <TextField label="Assignment note" value={assignmentForm.note} onChange={updateAssignment('note')} minRows={3} multiline fullWidth />
            <Alert icon={<AssignmentIndOutlinedIcon />} severity="success">
              Saving this assignment queues a Teams action card for the assigned user and keeps the task visible according to the selected visibility.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAssignmentDialog}>Cancel</Button>
          <Button variant="contained" onClick={saveAssignment}>Save Assignment</Button>
        </DialogActions>
      </Dialog>
    </PageWrapper>
  );
};

export default ActionItemsPage;
