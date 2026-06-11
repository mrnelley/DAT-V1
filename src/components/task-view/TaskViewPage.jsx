import AssignmentIndOutlinedIcon from '@mui/icons-material/AssignmentIndOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import DragIndicatorOutlinedIcon from '@mui/icons-material/DragIndicatorOutlined';
import MoreHorizOutlinedIcon from '@mui/icons-material/MoreHorizOutlined';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import { Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControl, IconButton, InputLabel, List, ListItem, MenuItem, Select, Stack, TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from '@mui/material';
import React from 'react';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationsContext';
import { useOperatingData } from '../../context/OperatingDataContext';
import { users } from '../../data/mockData';
import { useAuth } from '../../hooks/useAuth';
import PageWrapper from '../layout/PageWrapper';
import UserAvatar from '../shared/UserAvatar';
import AddStuckModal from '../stucks/AddStuckModal';

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

const sourceLabels = { one_off: 'Queued task' };

const taskViewOptions = ['Assigned to Me', 'Assigned by Me', 'Due This Week', 'Department', 'All Visible'];

const normalizeStatus = (status) => String(status || '').toLowerCase().replaceAll('_', ' ');

const isActiveStatus = (status) => !['complete', 'completed', 'cancelled'].includes(normalizeStatus(status));

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

const TaskViewPage = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const { addQueuedTask: persistQueuedTask, addStuck, getTasksForUser, queuedTasks, reorderQueuedTasks, updateQueuedTask } = useOperatingData();
  const [searchParams, setSearchParams] = useSearchParams();
  const [scope, setScope] = useState('Assigned to Me');
  const [statusFilter, setStatusFilter] = useState('Active');
  const [queueDraft, setQueueDraft] = useState('');
  const [completingTaskIds, setCompletingTaskIds] = useState([]);
  const [assignmentEvents, setAssignmentEvents] = useState([]);
  const [assignmentForm, setAssignmentForm] = useState(buildAssignmentForm());
  const [selectedItem, setSelectedItem] = useState(null);
  const [stuckTask, setStuckTask] = useState(null);
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const queueInputRef = useRef(null);
  const visibleItems = queuedTasks.filter((item) => {
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
  }).sort((a, b) => (
    Number(Boolean(b.pinned)) - Number(Boolean(a.pinned))
    || (Number(a.queueOrder) || 0) - (Number(b.queueOrder) || 0)
    || a.description.localeCompare(b.description)
  ));

  useEffect(() => {
    if (!['1', 'queue'].includes(searchParams.get('new'))) return;

    queueInputRef.current?.focus();
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('new');
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const closeAssignmentDialog = () => {
    setSelectedItem(null);
    setAssignmentForm(buildAssignmentForm());
  };

  const addQueuedTask = () => {
    const description = queueDraft.trim();
    if (!description) return;

    persistQueuedTask({
      assignments: [
        { profile: user, role: 'assignee' },
        { profile: user, role: 'assigned_by' },
      ],
      createdBy: user,
      department: user.department,
      description,
      due: '',
      id: `task-custom-${Date.now()}`,
      owner: user,
      priority: '',
      source: 'one_off',
      sourceType: 'queued_task',
      status: 'Open',
      strategicPillar: '',
      visibility: 'private',
      workplanId: null,
      workplanTitle: null,
    });
    setQueueDraft('');
    requestAnimationFrame(() => queueInputRef.current?.focus());
  };

  const completeQueuedTask = (item) => {
    if (!canManageTask(item, user) || completingTaskIds.includes(item.id)) return;

    if (normalizeStatus(item.status) === 'complete') {
      updateQueuedTask(item.id, { completedAt: null, status: 'Open' });
      return;
    }

    setCompletingTaskIds((current) => [...current, item.id]);
    window.setTimeout(() => {
      updateQueuedTask(item.id, { completedAt: new Date().toISOString(), status: 'Complete' });
      setCompletingTaskIds((current) => current.filter((taskId) => taskId !== item.id));
    }, 380);
  };

  const moveTask = (taskId, direction) => {
    const task = visibleItems.find((item) => item.id === taskId);
    const group = visibleItems.filter((item) => Boolean(item.pinned) === Boolean(task?.pinned));
    const index = group.findIndex((item) => item.id === taskId);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= group.length) return;

    const reorderedGroup = [...group];
    const [moved] = reorderedGroup.splice(index, 1);
    reorderedGroup.splice(nextIndex, 0, moved);
    reorderQueuedTasks([
      ...visibleItems.filter((item) => item.pinned).map((item) => item.id),
      ...visibleItems.filter((item) => !item.pinned).map((item) => item.id),
    ].map((id) => {
      const replacementIndex = group.findIndex((item) => item.id === id);
      return replacementIndex >= 0 ? reorderedGroup[replacementIndex].id : id;
    }));
  };

  const dropTaskBefore = (targetTaskId) => {
    if (!draggedTaskId || draggedTaskId === targetTaskId) return;
    const dragged = visibleItems.find((item) => item.id === draggedTaskId);
    const target = visibleItems.find((item) => item.id === targetTaskId);
    if (!dragged || !target || Boolean(dragged.pinned) !== Boolean(target.pinned)) return;

    const nextIds = visibleItems.map((item) => item.id);
    nextIds.splice(nextIds.indexOf(draggedTaskId), 1);
    nextIds.splice(nextIds.indexOf(targetTaskId), 0, draggedTaskId);
    reorderQueuedTasks(nextIds);
    setDraggedTaskId(null);
  };

  const openAssignmentWorkflow = (item) => {
    if (!canManageTask(item, user)) return;

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

    updateQueuedTask(selectedItem.id, {
      assignments: [
        { profile: owner, role: 'assignee' },
        { profile: user, role: 'assigned_by' },
      ],
      department: owner.department,
      due: assignmentForm.due,
      owner,
      status: assignmentForm.status,
      visibility: assignmentForm.visibility,
    });
    setAssignmentEvents((current) => [event, ...current]);
    addNotification({
      actionPath: '/task-view',
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
      <Box
        sx={{
          bgcolor: '#f4e5b5',
          m: { xs: -2, md: -3 },
          minHeight: 'calc(100vh - 64px)',
          p: { xs: 2, md: 3 },
        }}
      >
      <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'flex-start', md: 'center' }} justifyContent="space-between" gap={2} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h1">Task View</Typography>
          <Typography variant="body2" color="text.secondary">
            Work standalone queued tasks, assignments, and optional department workplan links.
          </Typography>
        </Box>
      </Stack>
      <Alert severity="info" sx={{ mb: 2 }}>
        Weekly commitments and their Action Items live in the Weekly Tracker. Use Task View to queue and manage standalone tasks that do not belong under a weekly priority.
      </Alert>
      <Stack direction={{ xs: 'column', lg: 'row' }} gap={2} alignItems={{ xs: 'stretch', lg: 'center' }} sx={{ mb: 2 }}>
        <ToggleButtonGroup
          exclusive
          value={scope}
          onChange={(_, value) => value && setScope(value)}
          sx={{
            flexWrap: 'wrap',
            '& .MuiToggleButton-root': {
              borderColor: '#ffffff !important',
            },
          }}
        >
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
      <List
        sx={{
          bgcolor: '#fff8df',
          border: '1px solid #d4bd73',
          borderRadius: 1,
          boxShadow: '0 8px 18px rgba(103, 82, 20, 0.12)',
          overflow: 'hidden',
        }}
      >
        <ListItem
          divider
          sx={{
            alignItems: 'center',
            bgcolor: 'rgba(255,255,255,0.42)',
            gap: 1,
            py: 1.25,
          }}
        >
          <CheckCircleOutlineOutlinedIcon aria-hidden color="disabled" sx={{ mx: 1.1 }} />
          <TextField
            inputRef={queueInputRef}
            fullWidth
            inputProps={{ 'aria-label': 'Add a task to my queue', title: 'Type a task and press Enter to add it to your queue' }}
            onChange={(event) => setQueueDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== 'Enter' || event.shiftKey) return;
              event.preventDefault();
              addQueuedTask();
            }}
            placeholder="Type a task and press Enter"
            value={queueDraft}
            variant="standard"
            InputProps={{ disableUnderline: true }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' }, whiteSpace: 'nowrap' }}>
            Enter to save
          </Typography>
        </ListItem>
        {!visibleItems.length && (
          <ListItem>
            <Typography variant="body2" color="text.secondary">Your queue is clear. Add the next thing when it arrives.</Typography>
          </ListItem>
        )}
        {visibleItems.map((item) => {
          const done = normalizeStatus(item.status) === 'complete';
          const completing = completingTaskIds.includes(item.id);
          const canManage = canManageTask(item, user);
          const canIssueStuck = item.owner?.id === user.id;
          return (
            <ListItem
              key={item.id}
              divider
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => dropTaskBefore(item.id)}
              sx={{
                alignItems: 'flex-start',
                bgcolor: done || completing ? 'rgba(94, 184, 168, 0.12)' : item.pinned ? 'rgba(241, 172, 73, 0.12)' : 'transparent',
                gap: 1,
                opacity: completing ? 0 : 1,
                transform: completing ? 'translateX(110%) rotate(1deg)' : 'translateX(0)',
                transition: 'transform 360ms cubic-bezier(.4,0,.2,1), opacity 280ms ease, background-color 180ms ease',
              }}
            >
              <Tooltip title={done ? 'Return task to queue' : 'Mark task complete'}>
                <span>
              <IconButton
                disabled={!canManage}
                aria-label={done ? `Return task to queue: ${item.description}` : `Mark task complete: ${item.description}`}
                onClick={() => completeQueuedTask(item)}
                title={done ? `Return task to queue: ${item.description}` : `Mark task complete: ${item.description}`}
                sx={{ mt: 0.25 }}
              >
                {done || completing ? <CheckCircleOutlinedIcon color="success" /> : <CheckCircleOutlineOutlinedIcon />}
              </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Drag to reorder. Use arrow keys to move within this group.">
                <Box
                  aria-label={`Reorder task: ${item.description}`}
                  draggable={canManage}
                  onDragEnd={() => setDraggedTaskId(null)}
                  onDragStart={() => setDraggedTaskId(item.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'ArrowUp') {
                      event.preventDefault();
                      moveTask(item.id, -1);
                    }
                    if (event.key === 'ArrowDown') {
                      event.preventDefault();
                      moveTask(item.id, 1);
                    }
                  }}
                  role="button"
                  tabIndex={canManage ? 0 : -1}
                  sx={{
                    color: 'text.secondary',
                    cursor: canManage ? 'grab' : 'default',
                    display: 'grid',
                    mt: 1,
                    placeItems: 'center',
                    '&:active': { cursor: canManage ? 'grabbing' : 'default' },
                    '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
                  }}
                >
                  <DragIndicatorOutlinedIcon fontSize="small" />
                </Box>
              </Tooltip>
              <Box sx={{ flex: 1, minWidth: 240 }}>
                <Typography sx={{ textDecoration: done ? 'line-through' : 'none' }}>{item.description}</Typography>
                <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap" sx={{ mt: 0.75 }}>
                  <UserAvatar user={item.owner} size="sm" />
                  {item.due && <Chip icon={chipColor(item.due) === 'error' ? <WarningAmberOutlinedIcon /> : undefined} label={item.due} color={chipColor(item.due)} size="small" />}
                  <Chip icon={<VisibilityOutlinedIcon />} label={visibilityLabels[item.visibility] || 'Assigned and created by'} variant="outlined" size="small" />
                  <Chip label={sourceLabels[item.source] || 'Task'} variant="outlined" size="small" />
                  {item.priority && <Chip label={item.priority} color="primary" variant="outlined" size="small" />}
                  {item.strategicPillar && <Chip label={item.strategicPillar} variant="outlined" size="small" />}
                  {item.workplanTitle && <Chip label={item.workplanTitle} color="secondary" variant="outlined" size="small" />}
                </Stack>
              </Box>
              <Tooltip title={item.pinned ? 'Unpin task' : 'Pin task to top'}>
                <span>
                  <IconButton
                    aria-label={`${item.pinned ? 'Unpin' : 'Pin'} task: ${item.description}`}
                    aria-pressed={Boolean(item.pinned)}
                    disabled={!canManage}
                    onClick={() => updateQueuedTask(item.id, { pinned: !item.pinned })}
                    title={`${item.pinned ? 'Unpin' : 'Pin'} task: ${item.description}`}
                    sx={{ color: item.pinned ? 'warning.dark' : 'text.secondary' }}
                  >
                    <PushPinOutlinedIcon />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title={canIssueStuck ? 'Issue a Stuck' : 'Only the assigned owner can issue a stuck'}>
                <span>
                  <IconButton disabled={!canIssueStuck} aria-label={`Issue a stuck for task ${item.description}`} onClick={() => setStuckTask(item)}>
                    <WarningAmberOutlinedIcon />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Open assignment workflow">
                <span>
                  <IconButton disabled={!canManage} aria-label={`Open assignment workflow for task ${item.description}`} onClick={() => openAssignmentWorkflow(item)}><MoreHorizOutlinedIcon /></IconButton>
                </span>
              </Tooltip>
            </ListItem>
          );
        })}
      </List>
      <Dialog aria-labelledby="task-assignment-dialog-title" open={Boolean(selectedItem)} onClose={closeAssignmentDialog} fullWidth maxWidth="sm">
        <DialogTitle id="task-assignment-dialog-title">Task Assignment Workflow</DialogTitle>
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
      <AddStuckModal
        initialTask={stuckTask}
        open={Boolean(stuckTask)}
        onClose={() => setStuckTask(null)}
        onSave={(stuck) => {
          addStuck(stuck);
          setStuckTask(null);
        }}
        tasks={getTasksForUser(user.id)}
        user={user}
      />
      </Box>
    </PageWrapper>
  );
};

export default TaskViewPage;
