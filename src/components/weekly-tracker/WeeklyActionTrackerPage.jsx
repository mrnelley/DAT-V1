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

const baseReport = weeklyActionReports[0];

const weekOptions = [
  {
    ...baseReport,
    id: 'war-2026-05-11',
    label: 'Previous week',
    reviewMeetingAt: '2026-05-11T10:00:00-04:00',
    status: 'locked',
    submissionDueAt: '2026-05-08T12:00:00-04:00',
    weekEnd: '2026-05-15',
    weekStart: '2026-05-11',
  },
  {
    ...baseReport,
    label: 'Current week',
  },
  {
    ...baseReport,
    id: 'war-2026-05-25',
    label: 'Upcoming week',
    reviewMeetingAt: '2026-05-25T10:00:00-04:00',
    status: 'planning',
    submissionDueAt: '2026-05-22T12:00:00-04:00',
    weekEnd: '2026-05-29',
    weekStart: '2026-05-25',
  },
];

const formatDateTime = (value) => new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  month: 'short',
}).format(new Date(value));

const formatDate = (value) => new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
}).format(new Date(`${value}T00:00:00`));

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

const buildEmptyEntry = (participant, rank, report) => ({
  alignedPriorityLabel: '',
  alignmentType: 'department',
  carriedFromEntryId: null,
  department: participant.department,
  due: report.weekEnd,
  id: `wae-${report.id}-${participant.id}-${rank}`,
  owner: participant,
  previousRank: null,
  rank,
  reportId: report.id,
  riskSupportNote: '',
  status: 'no_data',
  tasks: [],
  title: '',
});

const cloneTaskForReport = (task, report) => ({
  ...task,
  due: report.weekEnd,
  id: `${task.id}-${report.id}`,
});

const cloneEntryForReport = (entry, report, mode) => ({
  ...entry,
  carriedFromEntryId: mode === 'upcoming' ? null : entry.carriedFromEntryId,
  due: report.weekEnd,
  id: `${entry.id}-${report.id}`,
  previousRank: mode === 'upcoming' ? entry.rank : entry.previousRank,
  reportId: report.id,
  riskSupportNote: mode === 'upcoming' ? '' : entry.riskSupportNote,
  status: mode === 'upcoming' ? 'no_data' : entry.status,
  tasks: mode === 'upcoming' ? [] : entry.tasks.map((task) => cloneTaskForReport(task, report)),
  title: mode === 'upcoming' ? '' : entry.title,
});

const buildEntriesForWeek = (report) => {
  if (report.id === baseReport.id) return weeklyActionEntries;
  const mode = report.id > baseReport.id ? 'upcoming' : 'previous';
  return weeklyActionEntries.map((entry) => cloneEntryForReport(entry, report, mode));
};

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
  const [selectedWeekId, setSelectedWeekId] = useState(baseReport.id);
  const [entriesByWeek, setEntriesByWeek] = useState(() => Object.fromEntries(
    weekOptions.map((week) => [week.id, buildEntriesForWeek(week)]),
  ));
  const [priorityForm, setPriorityForm] = useState(buildPriorityForm(null, user));
  const [priorityDialogEntry, setPriorityDialogEntry] = useState(null);
  const [selectedEntryId, setSelectedEntryId] = useState(null);
  const [taskForm, setTaskForm] = useState(buildTaskForm(null, user));
  const [taskDialogEntry, setTaskDialogEntry] = useState(null);
  const report = weekOptions.find((week) => week.id === selectedWeekId) || weekOptions[1];
  const entries = entriesByWeek[selectedWeekId] || [];
  const setCurrentEntries = (updater) => setEntriesByWeek((current) => ({
    ...current,
    [selectedWeekId]: typeof updater === 'function'
      ? updater(current[selectedWeekId] || [])
      : updater,
  }));
  const rows = useMemo(() => weeklyTrackerParticipants.map((participant) => {
    const participantEntries = entries
      .filter((entry) => entry.owner.id === participant.id)
      .sort((a, b) => a.rank - b.rank);
    const needsNextSlot = !participantEntries.length || participantEntries.every((entry) => entry.title);
    const nextRank = participantEntries.length
      ? Math.max(...participantEntries.map((entry) => entry.rank)) + 1
      : 1;

    return {
      participant,
      entries: needsNextSlot
        ? [...participantEntries, buildEmptyEntry(participant, nextRank, report)]
        : participantEntries,
    };
  }), [entries, report]);
  const selectedEntry = entries.find((entry) => entry.id === selectedEntryId);
  const buildNextEntryForParticipant = (participant) => {
    const participantEntries = entries.filter((entry) => entry.owner.id === participant.id);
    const emptyEntry = participantEntries.find((entry) => !entry.title);

    if (emptyEntry) return emptyEntry;

    const nextRank = participantEntries.length
      ? Math.max(...participantEntries.map((entry) => entry.rank)) + 1
      : 1;

    return buildEmptyEntry(participant, nextRank, report);
  };
  const visibleRows = scope === 'mine'
    ? rows.filter((row) => row.participant.id === user.id || row.entries.some((entry) => entry?.tasks?.some((task) => task.owner.id === user.id)))
    : rows;

  useEffect(() => {
    const entryParam = searchParams.get('entry');
    if (entryParam && entries.some((entry) => entry.id === entryParam)) {
      setSelectedEntryId(entryParam);
    }

    if (searchParams.get('new') !== 'priority') return;

    const candidate = buildNextEntryForParticipant(user)
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
    setCurrentEntries((current) => current.some((candidate) => candidate.id === entry.id)
      ? current
      : [...current, entry]);
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
        taskItemId: null,
        carriedOver: false,
        createdBy: user,
        due: priorityForm.firstTaskDue,
        owner: taskOwner,
        status: 'open',
        title: priorityForm.firstTaskTitle.trim(),
      }]
      : [];

    setCurrentEntries((current) => current.map((entry) => (
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
      actionPath: `/weekly-tracker?entry=${priorityDialogEntry.id}`,
      actor: user,
      body: `${priorityForm.title.trim()} was added as #${priorityDialogEntry.rank} for ${owner.name}.`,
      channel: 'in_app',
      notificationType: 'weekly_priority_created',
      recipient: owner,
      sourceId: priorityDialogEntry.id,
      sourceType: 'weekly_priority_entry',
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
      taskItemId: null,
      carriedOver: false,
      createdBy: user,
      due: taskForm.due,
      owner,
      status: taskForm.status,
      title: taskForm.title,
    };

    setCurrentEntries((current) => current.map((entry) => (
      entry.id === taskForm.entryId
        ? { ...entry, tasks: [task, ...(entry.tasks || [])] }
        : entry
    )));
    addNotification({
      actionPath: `/weekly-tracker?entry=${taskForm.entryId}`,
      actor: user,
      body: `${task.title} was added under ${taskDialogEntry.title}.`,
      channel: 'in_app',
      notificationType: 'task_assigned',
      recipient: owner,
      sourceId: task.id,
      sourceType: 'weekly_task',
      title: `${user.name} added a weekly tracker task`,
    });
    closeTaskDialog();
  };

  const updateTaskStatus = (entryId, taskId, status) => {
    setCurrentEntries((current) => current.map((entry) => (
      entry.id === entryId
        ? { ...entry, tasks: entry.tasks.map((task) => task.id === taskId ? { ...task, status, carriedOver: status === 'carried_over' } : task) }
        : entry
    )));
  };

  const deleteTask = (entryId, taskId) => {
    setCurrentEntries((current) => current.map((entry) => (
      entry.id === entryId
        ? { ...entry, tasks: entry.tasks.filter((task) => task.id !== taskId) }
        : entry
    )));
  };

  const carryEntryForward = (entryId) => {
    setCurrentEntries((current) => current.map((entry) => (
      entry.id === entryId
        ? { ...entry, carriedFromEntryId: entry.carriedFromEntryId || `carry-${entry.id}`, status: entry.status === 'steady' ? 'watch' : entry.status }
        : entry
    )));
  };

  const openCurrentUserPriorityDialog = () => {
    const candidate = buildNextEntryForParticipant(user)
      || entries.find((entry) => canManageWeeklyEntry(entry, user));

    if (candidate) openPriorityDialog(candidate);
  };

  const openEntryDetail = (entry) => {
    setSelectedEntryId(entry.id);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('entry', entry.id);
    setSearchParams(nextParams, { replace: false });
  };

  const closeEntryDetail = () => {
    setSelectedEntryId(null);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('entry');
    setSearchParams(nextParams, { replace: true });
  };

  return (
    <PageWrapper>
      <Stack direction={{ xs: 'column', lg: 'row' }} alignItems={{ xs: 'flex-start', lg: 'center' }} justifyContent="space-between" gap={2} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h1">Weekly Tracker</Typography>
          <Typography variant="body2" color="text.secondary">
            OLT members define weekly priorities here, then assign supporting tasks pursuant to the week's priorities.
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
        <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
          <ToggleButtonGroup
            exclusive
            size="small"
            value={selectedWeekId}
            onChange={(_, value) => {
              if (!value) return;
              setSelectedWeekId(value);
              setSelectedEntryId(null);
            }}
            aria-label="Select tracker week"
          >
            {weekOptions.map((week) => (
              <ToggleButton key={week.id} value={week.id}>{week.label}</ToggleButton>
            ))}
          </ToggleButtonGroup>
          <Typography variant="body2" color="text.secondary">
            {formatDate(report.weekStart)} to {formatDate(report.weekEnd)}
          </Typography>
        </Stack>
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

            <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: { xs: '1fr', lg: 'repeat(auto-fit, minmax(280px, 1fr))' }, p: 1 }}>
              {rowEntries.map((entry) => {
                const movement = rankMovement(entry);

                return (
                  <Box key={entry.id} sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1, minHeight: 260 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
                      <Chip label={`#${entry.rank}${entry.rank === 1 ? ' Most Important' : ''}`} color={entry.rank === 1 ? 'primary' : 'default'} size="small" />
                      <Chip label={statusLabels[entry.status] || entry.status} color={statusColors[entry.status] || 'default'} size="small" variant={entry.status === 'steady' ? 'filled' : 'outlined'} />
                    </Stack>

                    {entry.title ? (
                      <>
                        <Stack direction="row" justifyContent="space-between" gap={1} alignItems="flex-start" sx={{ mt: 1 }}>
                          <Typography fontWeight={800}>{entry.title}</Typography>
                          <Button
                            size="small"
                            endIcon={<ArrowForwardOutlinedIcon />}
                            onClick={() => openEntryDetail(entry)}
                            aria-label={`Open weekly priority detail for ${entry.title}`}
                          >
                            Detail
                          </Button>
                        </Stack>
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
              <Typography variant="subtitle2">First supporting task</Typography>
              <Typography variant="body2" color="text.secondary">
                Optional, but useful when the priority already has a first move.
              </Typography>
            </Box>
            <TextField
              label="Supporting task"
              value={priorityForm.firstTaskTitle}
              onChange={updatePriorityForm('firstTaskTitle')}
              fullWidth
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
              <TextField select label="Task owner" value={priorityForm.firstTaskOwnerId} onChange={updatePriorityForm('firstTaskOwnerId')} fullWidth>
                {users.map((candidate) => <MenuItem key={candidate.id} value={candidate.id}>{candidate.name} - {candidate.department}</MenuItem>)}
              </TextField>
              <TextField label="Task due date" type="date" value={priorityForm.firstTaskDue} onChange={updatePriorityForm('firstTaskDue')} fullWidth InputLabelProps={{ shrink: true }} />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closePriorityDialog}>Cancel</Button>
          <Button variant="contained" onClick={saveWeeklyPriority} disabled={!priorityForm.title.trim()}>Save Weekly Priority</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(selectedEntry)} onClose={closeEntryDetail} fullWidth maxWidth="md">
        <DialogTitle>Weekly Priority Detail</DialogTitle>
        <DialogContent>
          {selectedEntry && (
            <Stack gap={2} sx={{ pt: 1 }}>
              <Box>
                <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mb: 1 }}>
                  <Chip label={`Rank #${selectedEntry.rank}`} color={selectedEntry.rank === 1 ? 'primary' : 'default'} size="small" />
                  <Chip label={statusLabels[selectedEntry.status] || selectedEntry.status} color={statusColors[selectedEntry.status] || 'default'} size="small" />
                  <Chip label={`Due ${formatDate(selectedEntry.due)}`} variant="outlined" size="small" />
                  {selectedEntry.carriedFromEntryId && <Chip label="Carried forward" color="warning" size="small" />}
                </Stack>
                <Typography variant="h3">{selectedEntry.title}</Typography>
                <Typography variant="body2" sx={{ mt: 0.75 }}>
                  {selectedEntry.owner.name} - {selectedEntry.department}
                </Typography>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.5 }}>
                <Box sx={{ bgcolor: 'background.default', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.25 }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase' }}>Alignment</Typography>
                  <Typography variant="body1" color="text.primary" sx={{ mt: 0.5 }}>{selectedEntry.alignedPriorityLabel || 'No alignment set'}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedEntry.alignmentType === 'enterprise' ? 'Company objective' : 'Department priority'}
                  </Typography>
                </Box>
                <Box sx={{ bgcolor: 'background.default', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.25 }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase' }}>Risk or support</Typography>
                  <Typography variant="body1" color="text.primary" sx={{ mt: 0.5 }}>{selectedEntry.riskSupportNote || 'No support note added'}</Typography>
                </Box>
              </Box>

              <Divider />

              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1}>
                <Box>
                  <Typography variant="h3">Supporting Tasks</Typography>
                  <Typography variant="body2">Tasks are the concrete work attached to this weekly priority.</Typography>
                </Box>
                <Button startIcon={<AddOutlinedIcon />} onClick={() => openTaskDialog(selectedEntry)}>
                  Add Task
                </Button>
              </Stack>

              <List dense disablePadding>
                {selectedEntry.tasks.length ? selectedEntry.tasks.map((task) => (
                  <ListItem key={task.id} disableGutters sx={{ alignItems: 'flex-start', gap: 0.75, borderTop: '1px solid', borderColor: 'divider', py: 1 }}>
                    <TaskAltOutlinedIcon fontSize="small" color={normalizeTaskStatus(task.status) === 'complete' ? 'success' : 'disabled'} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2">{task.title}</Typography>
                      <Stack direction="row" gap={0.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
                        <Chip label={task.owner.name} size="small" variant="outlined" />
                        <Chip label={normalizeTaskStatus(task.status).replace('_', ' ')} size="small" />
                        <Chip label={`Due ${formatDate(task.due)}`} size="small" variant="outlined" />
                      </Stack>
                    </Box>
                  </ListItem>
                )) : (
                  <ListItem disableGutters sx={{ borderTop: '1px solid', borderColor: 'divider', py: 1 }}>
                    <Typography variant="body2" color="text.secondary">No tasks have been added yet.</Typography>
                  </ListItem>
                )}
              </List>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEntryDetail}>Close</Button>
          {selectedEntry && canManageWeeklyEntry(selectedEntry, user) && (
            <Button variant="contained" onClick={() => openPriorityDialog(selectedEntry)}>Edit Priority</Button>
          )}
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
