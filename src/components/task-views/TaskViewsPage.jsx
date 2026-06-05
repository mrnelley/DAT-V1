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
import { actionItems as taskItems, users } from '../../data/mockData';
import { useAuth } from '../../hooks/useAuth';
import PageWrapper from '../layout/PageWrapper';
import UserAvatar from '../shared/UserAvatar';

const chipColor = (due) => {
  const today = '2026-05-13';
  if (due < today) return 'error';
  if (due === today) return 'warning';
  return 'default';
};

const today = '2026-05-13';
const weekEnd = '2026-05-19';

const visibilityLabels = {
  private: 'Assigned and created by',
  department: 'Department',
  olt: 'OLT',
  organization: 'All users',
};

const sourceLabels = {
  one_off: 'Queued task',
  weekly_tracker: 'Weekly Tracker',
};

const taskViewOptions = ['Assigned to Me', 'Assigned by Me', 'Due This Week', 'Department', 'All Visible'];

const normalizeStatus = (status) => String(status || '').toLowerCase().replaceAll('_', ' ');

const isActiveStatus = (status) => !['complete', 'completed', 'cancelled'].includes(normalizeStatus(status));

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

const canManageTask = (item, user) => isLeadershipUser(user) || isInvolved(item, user);

const canViewTask = (item, user) => (
  isInvolved(item, user)
  || item.visibility === 'organization'
  || (item.visibility === 'department' && item.department === user.department)
  || (item.visibility === 'olt' && user.workingGroup === 'OLT')
);

const TaskViewsPage = () => {
  const { user } = useAuth();
  const { unavailable } = useActionFeedback();
  const { addNotification } = useNotifications();
  const [searchParams, setSearchParams] = useSearchParams();
  const [scope, setScope] = useState('Assigned to Me');
  const [statusFilter, setStatusFilter] = useState('Active');
  const [items, setItems] = useState(taskItems);
  const [completed, setCompleted] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(buildInitialForm(user));
  const [assignmentEvents, setAssignmentEvents] = useState([]);
  const [assignmentForm, setAssignmentForm] = useState(buildAssignmentForm());
  const [selectedItem, setSelectedItem] = useState(null);
  const visibleItems = items.filter((item) => {
    if (!canViewTask(item, user)) return false;
    const matchesStatus = statusFilter === 'All'
      || (statusFilter === 'Active' && isActiveStatus(item.status))
      || normalizeStatus(item.status) === normalizeStatus(statusFilter);

    if (!matchesStatus) return false;
    if (scope === 'Assigned to Me') return item.owner?.id === user.id;
    if (scope === 'Assigned by Me') return item.createdBy?.id === user.id;
    if (scope === 'Due This Week') return item.due >= today && item.due <= weekEnd && isActiveStatus(item.status);
    if (scope === 'Department') return item.department === user.department;
    return true;
  });

  useEffect(() => {
    if (!['1', 'queue'].includes(searchParams.get('new'))) return;

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

  const addQueuedTask = () => {
    const owner = users.find((candidate) => candidate.id === form.ownerId) || user;
    setItems((current) => [
      {
        id: `task-custom-${Date.now()}`,
        description: form.description,
        owner,
        createdBy: user,
        department: owner.department,
        due: form.due,
        status: form.status,
        visibility: form.visibility,
        source: 'one_off',
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
      taskId: selectedItem.id,
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
      actionPath: '/task-views',
      actor: user,
      body: `${selectedItem.description} is due on ${assignmentForm.due}. ${assignmentForm.note}`.trim(),
      channel: 'in_app',
      notificationType: 'task_assigned',
      recipient: owner,
      sourceId: selectedItem.id,
      sourceType: 'task',
      title: `${user.name} assigned you a task`,
    });
    closeAssignmentDialog();
  };

  return (
    <PageWrapper>
      <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'flex-start', md: 'center' }} justifyContent="space-between" gap={2} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h1">Task Views</Typography>
          <Typography variant="body2" color="text.secondary">
            Inspect follow-through work created from weekly priorities, assignments, and queued tasks.
          </Typography>
        </Box>
        <Button startIcon={<AddOutlinedIcon />} variant="contained" onClick={() => setDialogOpen(true)}>Add to Queue</Button>
      </Stack>
      <Alert severity="info" sx={{ mb: 2 }}>
        Weekly commitments start in the Weekly Tracker. Use Task Views to work the assignments that come out of those priorities, or to queue a task when it does not belong under a weekly priority yet.
      </Alert>
      <Stack direction={{ xs: 'column', lg: 'row' }} gap={2} alignItems={{ xs: 'stretch', lg: 'center' }} sx={{ mb: 2 }}>
        <ToggleButtonGroup exclusive value={scope} onChange={(_, value) => value && setScope(value)} sx={{ flexWrap: 'wrap' }}>
          {taskViewOptions.map((option) => (
            <ToggleButton key={option} value={option}>{option}</ToggleButton>
          ))}
        </ToggleButtonGroup>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel id="action-status-filter-label">Status</InputLabel>
          <Select labelId="action-status-filter-label" label="Status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <MenuItem value="Active">Active</MenuItem>
            <MenuItem value="Open">Open</MenuItem>
            <MenuItem value="In Progress">In Progress</MenuItem>
            <MenuItem value="Complete">Complete</MenuItem>
            <MenuItem value="All">All</MenuItem>
          </Select>
        </FormControl>
      </Stack>
      {assignmentEvents.length > 0 && (
        <Alert
          icon={<NotificationsActiveOutlinedIcon />}
          severity="info"
          sx={{ mb: 2 }}
        >
          Teams task card queued for {assignmentEvents[0].recipient.name}: {assignmentEvents[0].message}
        </Alert>
      )}
      <List sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>
        {!visibleItems.length && (
          <ListItem>
            <Typography variant="body2" color="text.secondary">No tasks match this view.</Typography>
          </ListItem>
        )}
        {visibleItems.map((item) => {
          const done = completed.includes(item.id);
          const canManage = canManageTask(item, user);
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
                  <Chip label={sourceLabels[item.source] || 'Task'} variant="outlined" size="small" />
                  <Chip label={item.priority} color="primary" variant="outlined" size="small" />
                  <Chip label={item.strategicPillar} variant="outlined" size="small" />
                </Stack>
              </Box>
              <IconButton disabled={!canManage} aria-label={`Open assignment workflow for task ${item.description}`} onClick={() => openAssignmentWorkflow(item)}><MoreHorizOutlinedIcon /></IconButton>
            </ListItem>
          );
        })}
      </List>
      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>Add Task to Queue</DialogTitle>
        <DialogContent>
          <Stack gap={2} sx={{ pt: 1 }}>
            <Alert severity="warning">
              Use this only when the task is not pursuant to a weekly priority. Weekly priority work should be authored in the Weekly Tracker first.
            </Alert>
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
          <Button variant="contained" onClick={addQueuedTask} disabled={!form.description.trim()}>Add Task to Queue</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={Boolean(selectedItem)} onClose={closeAssignmentDialog} fullWidth maxWidth="sm">
        <DialogTitle>Task Assignment Workflow</DialogTitle>
        <DialogContent>
          <Stack gap={2} sx={{ pt: 1 }}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Task</Typography>
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
              Saving this assignment queues a Teams task card for the assigned user and keeps the task visible according to the selected visibility.
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

export default TaskViewsPage;
