import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, IconButton, List, ListItem, MenuItem, Stack, TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from '@mui/material';
import React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationsContext';
import { weeklyActionEntries, weeklyActionReports, weeklyTrackerParticipants, users } from '../../data/mockData';
import { useAuth } from '../../hooks/useAuth';
import PageWrapper from '../layout/PageWrapper';
import UserAvatar from '../shared/UserAvatar';

const statusLabels = {
  alert: 'Off Track',
  no_data: 'Not submitted',
  steady: 'On Track',
  watch: 'Needs Attention',
};

const statusColors = {
  alert: 'error',
  no_data: 'default',
  steady: 'success',
  watch: 'warning',
};

const taskStatuses = ['open', 'in_progress', 'complete', 'blocked', 'cancelled', 'carried_over'];
const weeklyPriorityStatuses = ['steady', 'watch', 'alert'];
const alignmentTypes = [
  { label: 'Company objective', value: 'enterprise' },
  { label: 'Department priority', value: 'department' },
];

const formatDateTime = (value) => new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  month: 'short',
}).format(new Date(value));

const rankMovement = (entry) => {
  if (!entry.previousRank || !entry.title) return null;
  if (entry.previousRank === entry.rank) return 'Same rank';
  return `Moved ${entry.previousRank > entry.rank ? 'up' : 'down'} from #${entry.previousRank}`;
};

const buildTaskForm = (entry, user) => ({
  due: entry?.due || '2026-05-22',
  entryId: entry?.id || '',
  ownerId: entry?.owner?.id || user.id,
  status: 'open',
  title: '',
});

const buildPriorityForm = (entry, user) => ({
  alignedPriorityLabel: entry?.alignedPriorityLabel || '',
  alignmentType: entry?.alignmentType || 'department',
  due: entry?.due || '2026-05-22',
  firstTaskDue: entry?.due || '2026-05-22',
  firstTaskOwnerId: user.id,
  firstTaskTitle: '',
  riskSupportNote: entry?.riskSupportNote || '',
  status: entry?.status === 'no_data' ? 'steady' : entry?.status || 'steady',
  title: entry?.title || '',
});

const normalizeTaskStatus = (status) => {
  const normalized = String(status || 'open').toLowerCase().replaceAll(' ', '_');
  return taskStatuses.includes(normalized) ? normalized : 'open';
};

const canManageWeeklyEntry = (entry, user) => (
  entry.owner.id === user.id
  || user.workingGroup === 'ELT'
  || user.workingGroup === 'OLT'
);

const WeeklyActionTrackerPage = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [searchParams, setSearchParams] = useSearchParams();
  const [scope, setScope] = useState('all');
  const [entries, setEntries] = useState(weeklyActionEntries);
  const [priorityForm, setPriorityForm] = useState(buildPriorityForm(null, user));
  const [priorityDialogEntry, setPriorityDialogEntry] = useState(null);
  const [taskForm, setTaskForm] = useState(buildTaskForm(null, user));
  const [taskDialogEntry, setTaskDialogEntry] = useState(null);
  const report = weeklyActionReports[0];
  const rows = useMemo(() => weeklyTrackerParticipants.map((participant) => ({
    participant,
    entries: [1, 2, 3].map((rank) => entries.find((entry) => entry.owner.id === participant.id && entry.rank === rank)),
  })), [entries]);
  const visibleRows = scope === 'mine'
    ? rows.filter((row) => row.participant.id === user.id || row.entries.some((entry) => entry?.tasks?.some((task) => task.owner.id === user.id)))
    : rows;

  useEffect(() => {
    if (searchParams.get('new') !== 'priority') return;

    const candidate = entries.find((entry) => entry.owner.id === user.id && !entry.title)
      || entries.find((entry) => entry.owner.id === user.id)
      || entries.find((entry) => canManageWeeklyEntry(entry, user));

    if (candidate) {
      setPriorityDialogEntry(candidate);
      setPriorityForm(buildPriorityForm(candidate, user));
    }

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('new');
    setSearchParams(nextParams, { replace: true });
  }, [entries, searchParams, setSearchParams, user]);

  const openPriorityDialog = (entry) => {
    setPriorityDialogEntry(entry);
    setPriorityForm(buildPriorityForm(entry, user));
  };

  const closePriorityDialog = () => {
    setPriorityDialogEntry(null);
    setPriorityForm(buildPriorityForm(null, user));
  };

  const updatePriorityForm = (field) => (event) => setPriorityForm((current) => ({ ...current, [field]: event.target.value }));

  const saveWeeklyPriority = () => {
    if (!priorityDialogEntry || !priorityForm.title.trim()) return;

    const owner = priorityDialogEntry.owner;
    const taskOwner = users.find((candidate) => candidate.id === priorityForm.firstTaskOwnerId) || user;
    const firstTask = priorityForm.firstTaskTitle.trim()
      ? [{
        id: `wat-custom-${Date.now()}`,
        actionItemId: null,
        carriedOver: false,
        createdBy: user,
        due: priorityForm.firstTaskDue,
        owner: taskOwner,
        status: 'open',
        title: priorityForm.firstTaskTitle.trim(),
      }]
      : [];

    setEntries((current) => current.map((entry) => (
      entry.id === priorityDialogEntry.id
        ? {
          ...entry,
          alignedPriorityLabel: priorityForm.alignedPriorityLabel,
          alignmentType: priorityForm.alignmentType,
          due: priorityForm.due,
          riskSupportNote: priorityForm.riskSupportNote,
          status: priorityForm.status,
          tasks: [...firstTask, ...(entry.tasks || [])],
          title: priorityForm.title.trim(),
        }
        : entry
    )));
    addNotification({
      actionPath: '/weekly-tracker',
      actor: user,
      body: `${priorityForm.title.trim()} was added as #${priorityDialogEntry.rank} for ${owner.name}.`,
      channel: 'in_app',
      notificationType: 'weekly_priority_created',
      recipient: owner,
      sourceId: priorityDialogEntry.id,
      sourceType: 'weekly_action_entry',
      title: `${user.name} set a weekly priority`,
    });
    closePriorityDialog();
  };

  const openTaskDialog = (entry) => {
    setTaskDialogEntry(entry);
    setTaskForm(buildTaskForm(entry, user));
  };

  const closeTaskDialog = () => {
    setTaskDialogEntry(null);
    setTaskForm(buildTaskForm(null, user));
  };

  const updateTaskForm = (field) => (event) => setTaskForm((current) => ({ ...current, [field]: event.target.value }));

  const addTask = () => {
    const owner = users.find((candidate) => candidate.id === taskForm.ownerId) || user;
    const task = {
      id: `wat-custom-${Date.now()}`,
      actionItemId: null,
      carriedOver: false,
      createdBy: user,
      due: taskForm.due,
      owner,
      status: taskForm.status,
      title: taskForm.title,
    };

    setEntries((current) => current.map((entry) => (
      entry.id === taskForm.entryId
        ? { ...entry, tasks: [task, ...(entry.tasks || [])] }
        : entry
    )));
    addNotification({
      actionPath: '/weekly-tracker',
      actor: user,
      body: `${task.title} was added under ${taskDialogEntry.title}.`,
      channel: 'in_app',
      notificationType: 'task_assigned',
      recipient: owner,
      sourceId: task.id,
      sourceType: 'weekly_action_task',
      title: `${user.name} added a weekly tracker task`,
    });
    closeTaskDialog();
  };

  const updateTaskStatus = (entryId, taskId, status) => {
    setEntries((current) => current.map((entry) => (
      entry.id === entryId
        ? { ...entry, tasks: entry.tasks.map((task) => task.id === taskId ? { ...task, status, carriedOver: status === 'carried_over' } : task) }
        : entry
    )));
  };

  const deleteTask = (entryId, taskId) => {
    setEntries((current) => current.map((entry) => (
      entry.id === entryId
        ? { ...entry, tasks: entry.tasks.filter((task) => task.id !== taskId) }
        : entry
    )));
  };

  const carryEntryForward = (entryId) => {
    setEntries((current) => current.map((entry) => (
      entry.id === entryId
        ? { ...entry, carriedFromEntryId: entry.carriedFromEntryId || `carry-${entry.id}`, status: entry.status === 'steady' ? 'watch' : entry.status }
        : entry
    )));
  };

  const openCurrentUserPriorityDialog = () => {
    const candidate = entries.find((entry) => entry.owner.id === user.id && !entry.title)
      || entries.find((entry) => entry.owner.id === user.id)
      || entries.find((entry) => canManageWeeklyEntry(entry, user));

    if (candidate) openPriorityDialog(candidate);
  };

  return (
    <PageWrapper>
      <Stack direction={{ xs: 'column', lg: 'row' }} alignItems={{ xs: 'flex-start', lg: 'center' }} justifyContent="space-between" gap={2} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h1">Weekly Action Tracker</Typography>
          <Typography variant="body2" color="text.secondary">
            OLT members define weekly priorities here, then assign supporting actions pursuant to the week's priorities.
          </Typography>
        </Box>
        <Stack direction="row" gap={1} flexWrap="wrap">
          <Button startIcon={<AddOutlinedIcon />} variant="contained" onClick={openCurrentUserPriorityDialog}>
            Set My Weekly Priority
          </Button>
          <Chip icon={<EventAvailableOutlinedIcon />} label={`Due ${formatDateTime(report.submissionDueAt)}`} color="warning" />
          <Chip icon={<EventAvailableOutlinedIcon />} label={`Review ${formatDateTime(report.reviewMeetingAt)}`} color="primary" />
          <Chip label={report.status} variant="outlined" />
        </Stack>
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} gap={1} justifyContent="space-between" sx={{ mb: 2 }}>
        <ToggleButtonGroup exclusive size="small" value={scope} onChange={(_, value) => value && setScope(value)}>
          <ToggleButton value="all">OLT view</ToggleButton>
          <ToggleButton value="mine">Related to me</ToggleButton>
        </ToggleButtonGroup>
        <Typography variant="body2" color="text.secondary">
          Snapshot week: {report.weekStart} to {report.weekEnd}
        </Typography>
      </Stack>

      <Stack gap={1.5}>
        {visibleRows.map(({ entries: rowEntries, participant }) => (
          <Box key={participant.id} sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
            <Stack direction={{ xs: 'column', md: 'row' }} gap={1.5} sx={{ p: 1.5, bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider' }}>
              <Stack direction="row" gap={1} alignItems="center" sx={{ minWidth: { md: 260 } }}>
                <UserAvatar user={participant} size="md" />
                <Box>
                  <Typography fontWeight={800}>{participant.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{participant.department}</Typography>
                </Box>
              </Stack>
              <Stack direction="row" gap={1} flexWrap="wrap">
                <Chip label={participant.workingGroup} size="small" variant="outlined" />
                <Chip label={participant.role} size="small" variant="outlined" />
              </Stack>
            </Stack>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, minmax(0, 1fr))' } }}>
              {rowEntries.map((entry) => {
                const movement = rankMovement(entry);

                return (
                  <Box key={entry.id} sx={{ p: 1.5, borderRight: { lg: entry.rank < 3 ? '1px solid' : 0 }, borderBottom: { xs: entry.rank < 3 ? '1px solid' : 0, lg: 0 }, borderColor: 'divider', minHeight: 260 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
                      <Chip label={`#${entry.rank}${entry.rank === 1 ? ' Most Important' : ''}`} color={entry.rank === 1 ? 'primary' : 'default'} size="small" />
                      <Chip label={statusLabels[entry.status] || entry.status} color={statusColors[entry.status] || 'default'} size="small" variant={entry.status === 'steady' ? 'filled' : 'outlined'} />
                    </Stack>

                    {entry.title ? (
                      <>
                        <Typography fontWeight={800} sx={{ mt: 1 }}>{entry.title}</Typography>
                        <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mt: 1 }}>
                          <Chip label={entry.alignmentType === 'enterprise' ? 'Enterprise aligned' : 'Department aligned'} size="small" variant="outlined" />
                          {movement && <Chip icon={<ArrowForwardOutlinedIcon />} label={movement} size="small" color={movement === 'Same rank' ? 'default' : 'secondary'} variant="outlined" />}
                          {entry.carriedFromEntryId && <Chip label="Carried forward" size="small" color="warning" />}
                        </Stack>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Aligned to: {entry.alignedPriorityLabel}
                        </Typography>
                        {entry.riskSupportNote && (
                          <Typography variant="body2" color="text.primary" sx={{ mt: 0.75 }}>
                            Risk/support: {entry.riskSupportNote}
                          </Typography>
                        )}
                        <Divider sx={{ my: 1 }} />
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="caption" fontWeight={800}>Tasks</Typography>
                          <Stack direction="row" gap={0.5}>
                            <Tooltip title="Carry priority into next week">
                              <IconButton size="small" aria-label={`Carry forward ${entry.title}`} onClick={() => carryEntryForward(entry.id)}>
                                <ArrowForwardOutlinedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Add task">
                              <IconButton size="small" aria-label={`Add task for ${entry.title}`} onClick={() => openTaskDialog(entry)}>
                                <AddOutlinedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </Stack>
                        <List dense disablePadding>
                          {entry.tasks.map((task) => (
                            <ListItem key={task.id} disableGutters sx={{ alignItems: 'flex-start', gap: 0.75 }}>
                              <TaskAltOutlinedIcon fontSize="small" color={normalizeTaskStatus(task.status) === 'complete' ? 'success' : 'disabled'} />
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="body2">{task.title}</Typography>
                                <Stack direction="row" gap={0.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
                                  <Chip label={task.owner.name} size="small" variant="outlined" />
                                  <Chip label={normalizeTaskStatus(task.status).replace('_', ' ')} size="small" />
                                  <Chip label={`Due ${task.due}`} size="small" variant="outlined" />
                                </Stack>
                              </Box>
                              <TextField select size="small" value={normalizeTaskStatus(task.status)} onChange={(event) => updateTaskStatus(entry.id, task.id, event.target.value)} sx={{ width: 128 }}>
                                {taskStatuses.map((status) => <MenuItem key={status} value={status}>{status.replace('_', ' ')}</MenuItem>)}
                              </TextField>
                              <Tooltip title="Delete task">
                                <IconButton size="small" aria-label={`Delete task ${task.title}`} onClick={() => deleteTask(entry.id, task.id)}>
                                  <DeleteOutlineOutlinedIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </ListItem>
                          ))}
                        </List>
                      </>
                    ) : (
                      <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 190, color: 'text.secondary', textAlign: 'center' }}>
                        <Box>
                          <EditOutlinedIcon />
                          <Typography variant="body2">No weekly priority set for this slot.</Typography>
                          {canManageWeeklyEntry(entry, user) && (
                            <Button
                              size="small"
                              startIcon={<AddOutlinedIcon />}
                              sx={{ mt: 1 }}
                              onClick={() => openPriorityDialog(entry)}
                              aria-label={`Set weekly priority ${entry.rank} for ${participant.name}`}
                            >
                              Set Weekly Priority
                            </Button>
                          )}
                        </Box>
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Box>
          </Box>
        ))}
      </Stack>

      <Dialog open={Boolean(priorityDialogEntry)} onClose={closePriorityDialog} fullWidth maxWidth="sm">
        <DialogTitle>Set Weekly Priority</DialogTitle>
        <DialogContent>
          <Stack gap={2} sx={{ pt: 1 }}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Weekly tracker slot</Typography>
              <Typography>
                {priorityDialogEntry?.owner.name} - Priority #{priorityDialogEntry?.rank}
              </Typography>
            </Box>
            <TextField
              label="Weekly priority"
              value={priorityForm.title}
              onChange={updatePriorityForm('title')}
              fullWidth
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
              <TextField select label="Alignment" value={priorityForm.alignmentType} onChange={updatePriorityForm('alignmentType')} fullWidth>
                {alignmentTypes.map((alignmentType) => (
                  <MenuItem key={alignmentType.value} value={alignmentType.value}>{alignmentType.label}</MenuItem>
                ))}
              </TextField>
              <TextField label="Priority due date" type="date" value={priorityForm.due} onChange={updatePriorityForm('due')} fullWidth InputLabelProps={{ shrink: true }} />
            </Stack>
            <TextField
              label="Aligned priority or workplan"
              value={priorityForm.alignedPriorityLabel}
              onChange={updatePriorityForm('alignedPriorityLabel')}
              fullWidth
            />
            <TextField select label="Priority health" value={priorityForm.status} onChange={updatePriorityForm('status')} fullWidth>
              {weeklyPriorityStatuses.map((status) => (
                <MenuItem key={status} value={status}>{statusLabels[status]}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Risk or support note"
              value={priorityForm.riskSupportNote}
              onChange={updatePriorityForm('riskSupportNote')}
              minRows={2}
              multiline
              fullWidth
            />
            <Divider />
            <Box>
              <Typography variant="subtitle2">First supporting action</Typography>
              <Typography variant="body2" color="text.secondary">
                Optional, but useful when the priority already has a first move.
              </Typography>
            </Box>
            <TextField
              label="Supporting action"
              value={priorityForm.firstTaskTitle}
              onChange={updatePriorityForm('firstTaskTitle')}
              fullWidth
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
              <TextField select label="Action owner" value={priorityForm.firstTaskOwnerId} onChange={updatePriorityForm('firstTaskOwnerId')} fullWidth>
                {users.map((candidate) => <MenuItem key={candidate.id} value={candidate.id}>{candidate.name} - {candidate.department}</MenuItem>)}
              </TextField>
              <TextField label="Action due date" type="date" value={priorityForm.firstTaskDue} onChange={updatePriorityForm('firstTaskDue')} fullWidth InputLabelProps={{ shrink: true }} />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closePriorityDialog}>Cancel</Button>
          <Button variant="contained" onClick={saveWeeklyPriority} disabled={!priorityForm.title.trim()}>Save Weekly Priority</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(taskDialogEntry)} onClose={closeTaskDialog} fullWidth maxWidth="sm">
        <DialogTitle>Add Weekly Tracker Task</DialogTitle>
        <DialogContent>
          <Stack gap={2} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary">{taskDialogEntry?.title}</Typography>
            <TextField label="Task" value={taskForm.title} onChange={updateTaskForm('title')} fullWidth />
            <TextField select label="Owner" value={taskForm.ownerId} onChange={updateTaskForm('ownerId')} fullWidth>
              {users.map((candidate) => <MenuItem key={candidate.id} value={candidate.id}>{candidate.name} - {candidate.department}</MenuItem>)}
            </TextField>
            <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
              <TextField label="Due date" type="date" value={taskForm.due} onChange={updateTaskForm('due')} fullWidth InputLabelProps={{ shrink: true }} />
              <TextField select label="Status" value={taskForm.status} onChange={updateTaskForm('status')} fullWidth>
                {taskStatuses.map((status) => <MenuItem key={status} value={status}>{status.replace('_', ' ')}</MenuItem>)}
              </TextField>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeTaskDialog}>Cancel</Button>
          <Button variant="contained" onClick={addTask} disabled={!taskForm.title.trim()}>Add Task</Button>
        </DialogActions>
      </Dialog>
    </PageWrapper>
  );
};

export default WeeklyActionTrackerPage;
