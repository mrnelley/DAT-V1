import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import DragIndicatorOutlinedIcon from '@mui/icons-material/DragIndicatorOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, IconButton, List, ListItem, MenuItem, Stack, TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from '@mui/material';
import React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationsContext';
import { useOperatingData } from '../../context/OperatingDataContext';
import { useFeatureAccess } from '../../context/FeatureAccessContext';
import { users } from '../../data/mockData';
import { currentWeeklyReport, weeklyTrackerWeekOptions } from '../../data/weeklyTrackerConfig';
import { useAuth } from '../../hooks/useAuth';
import { findWorkplanObjective } from '../../utils/workplans';
import PageWrapper from '../layout/PageWrapper';
import UserAvatar from '../shared/UserAvatar';
import AddStuckModal from '../stucks/AddStuckModal';

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
const baseReport = currentWeeklyReport;
const weekOptions = weeklyTrackerWeekOptions;
const weeklyParticipantOrderStoragePrefix = 'hdc_compass_weekly_tracker_participant_order';
const preferredLeadershipOrder = ['u1', 'u8', 'u2', 'u3', 'u6', 'u4', 'u17', 'u5'];

const defaultParticipantOrderFor = (userId) => {
  const preferred = preferredLeadershipOrder
    .map((id) => users.find((candidate) => candidate.id === id))
    .filter(Boolean);
  const preferredIds = new Set(preferred.map((participant) => participant.id));
  const remainingOlt = users.filter((participant) => (
    participant.workingGroup === 'OLT' && !preferredIds.has(participant.id)
  )).sort((a, b) => a.name.localeCompare(b.name));
  const remainingStaff = users.filter((participant) => (
    !['ELT', 'OLT'].includes(participant.workingGroup) && !preferredIds.has(participant.id)
  )).sort((a, b) => a.name.localeCompare(b.name));
  const defaultOrder = [...preferred, ...remainingOlt, ...remainingStaff].map((participant) => participant.id);

  return [userId, ...defaultOrder.filter((id) => id !== userId)];
};

const readParticipantOrder = (userId) => {
  const fallback = defaultParticipantOrderFor(userId);
  if (typeof window === 'undefined') return fallback;

  try {
    const parsed = JSON.parse(window.localStorage.getItem(`${weeklyParticipantOrderStoragePrefix}_${userId}`));
    if (!Array.isArray(parsed)) return fallback;
    return [...parsed.filter((id) => users.some((participant) => participant.id === id)), ...fallback.filter((id) => !parsed.includes(id))];
  } catch {
    return fallback;
  }
};

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

const getAlignmentChipLabel = (entry) => {
  if (!entry.alignedPriorityLabel) return 'Alignment required';
  if (entry.alignmentType === 'both') return 'Enterprise Priority + Departmental Priority aligned';
  if (entry.alignmentType === 'enterprise') return 'Enterprise Priority aligned';
  return 'Departmental Priority aligned';
};

const getAlignmentTypeLabel = (entry) => {
  if (!entry.alignedPriorityLabel) return 'Missing required alignment';
  if (entry.alignmentType === 'both') return 'Enterprise Priority and Departmental Priority';
  if (entry.alignmentType === 'enterprise') return 'Enterprise Priority';
  return 'Departmental Priority';
};

const buildTaskForm = (entry, user) => ({
  due: entry?.due || baseReport.weekEnd,
  entryId: entry?.id || '',
  ownerId: entry?.owner?.id || user.id,
  status: 'open',
  title: '',
});

const buildPriorityForm = (entry, user) => ({
  due: entry?.due || baseReport.weekEnd,
  firstTaskDue: entry?.due || baseReport.weekEnd,
  firstTaskOwnerId: user.id,
  firstTaskTitle: '',
  objectiveId: entry?.objectiveId || '',
  priorityId: entry?.priorityId || '',
  riskSupportNote: entry?.riskSupportNote || '',
  status: entry?.status === 'no_data' ? 'steady' : entry?.status || 'steady',
  title: entry?.title || '',
  workplanId: entry?.workplanId || '',
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
  const { isFeatureEnabled } = useFeatureAccess();
  const { addNotification } = useNotifications();
  const {
    addStuck,
    departmentWorkplans,
    getTasksForUser,
    enterprisePriorities,
    registerWeeklyActionItem,
    removeWeeklyActionItem,
    setWeeklyPriorityEntriesForWeek,
    stucks,
    updateWeeklyActionItem,
    weeklyPriorityEntriesByWeek,
  } = useOperatingData();
  const [searchParams, setSearchParams] = useSearchParams();
  const [scope, setScope] = useState('all');
  const [selectedWeekId, setSelectedWeekId] = useState(baseReport.id);
  const [priorityForm, setPriorityForm] = useState(buildPriorityForm(null, user));
  const [priorityDialogEntry, setPriorityDialogEntry] = useState(null);
  const [selectedEntryId, setSelectedEntryId] = useState(null);
  const [taskForm, setTaskForm] = useState(buildTaskForm(null, user));
  const [taskDialogEntry, setTaskDialogEntry] = useState(null);
  const [stuckTask, setStuckTask] = useState(null);
  const [participantOrderIds, setParticipantOrderIds] = useState(() => readParticipantOrder(user.id));
  const [draggedParticipantId, setDraggedParticipantId] = useState(null);
  const [dragOverParticipantId, setDragOverParticipantId] = useState(null);
  const canUseStuckActions = isFeatureEnabled('stuckActions', user);
  const report = weekOptions.find((week) => week.id === selectedWeekId) || baseReport;
  const entries = weeklyPriorityEntriesByWeek[selectedWeekId] || [];
  const setCurrentEntries = (updater) => setWeeklyPriorityEntriesForWeek(selectedWeekId, updater);
  const hasEnterprisePriorityOptions = enterprisePriorities.length > 0;
  const hasDepartmentObjectiveOptions = departmentWorkplans.some((workplan) => (workplan.objectives || []).length > 0);
  const hasAlignmentSourceOptions = hasEnterprisePriorityOptions || hasDepartmentObjectiveOptions;
  const priorityHasRequiredAlignment = Boolean(priorityForm.objectiveId || priorityForm.priorityId);
  const canSavePriority = Boolean(priorityDialogEntry && priorityForm.title.trim() && priorityHasRequiredAlignment);
  const rows = useMemo(() => users.map((participant) => {
    const participantEntries = entries
      .filter((entry) => entry.owner.id === participant.id)
      .sort((a, b) => a.rank - b.rank);
    const existingRanks = new Set(participantEntries.map((entry) => entry.rank));
    const minimumSlots = [1, 2, 3]
      .filter((rank) => !existingRanks.has(rank))
      .map((rank) => buildEmptyEntry(participant, rank, report));
    const minimumEntries = [...participantEntries, ...minimumSlots].sort((a, b) => a.rank - b.rank);
    const nextRank = Math.max(...minimumEntries.map((entry) => entry.rank)) + 1;

    return {
      participant,
      entries: minimumEntries.some((entry) => !entry.title)
        ? minimumEntries
        : [...minimumEntries, buildEmptyEntry(participant, nextRank, report)],
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
  const visibleRows = useMemo(() => {
    const scopedRows = scope === 'mine'
      ? rows.filter((row) => row.participant.id === user.id || row.entries.some((entry) => entry?.tasks?.some((task) => task.owner.id === user.id)))
      : rows;
    const orderIndex = new Map(participantOrderIds.map((id, index) => [id, index]));

    return [...scopedRows].sort((a, b) => {
      const aIndex = orderIndex.get(a.participant.id) ?? Number.MAX_SAFE_INTEGER;
      const bIndex = orderIndex.get(b.participant.id) ?? Number.MAX_SAFE_INTEGER;
      if (aIndex !== bIndex) return aIndex - bIndex;
      return a.participant.name.localeCompare(b.participant.name);
    });
  }, [participantOrderIds, rows, scope, user.id]);

  useEffect(() => {
    setParticipantOrderIds(readParticipantOrder(user.id));
  }, [user.id]);

  const saveParticipantOrder = (nextOrder) => {
    setParticipantOrderIds(nextOrder);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(`${weeklyParticipantOrderStoragePrefix}_${user.id}`, JSON.stringify(nextOrder));
    }
  };

  const moveParticipantRow = (participantId, direction) => {
    const currentOrder = participantOrderIds.filter((id) => rows.some((row) => row.participant.id === id));
    const index = currentOrder.indexOf(participantId);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= currentOrder.length) return;
    const nextOrder = [...currentOrder];
    const [moved] = nextOrder.splice(index, 1);
    nextOrder.splice(nextIndex, 0, moved);
    saveParticipantOrder(nextOrder);
  };

  const moveDraggedParticipantBefore = (targetParticipantId) => {
    if (!draggedParticipantId || draggedParticipantId === targetParticipantId) return;
    const currentOrder = participantOrderIds.filter((id) => rows.some((row) => row.participant.id === id));
    const nextOrder = [...currentOrder];
    nextOrder.splice(nextOrder.indexOf(draggedParticipantId), 1);
    nextOrder.splice(nextOrder.indexOf(targetParticipantId), 0, draggedParticipantId);
    saveParticipantOrder(nextOrder);
  };

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

  const updatePriorityForm = (field) => (event) => {
    const value = event.target.value;
    setPriorityForm((current) => {
      if (field !== 'objectiveId') return { ...current, [field]: value };
      const linked = findWorkplanObjective(departmentWorkplans, value);
      return {
        ...current,
        objectiveId: value,
        priorityId: linked?.objective.enterprisePriorityId || '',
        workplanId: linked?.workplan.id || '',
      };
    });
  };

  const saveWeeklyPriority = () => {
    if (!priorityDialogEntry || !priorityForm.title.trim()) return;

    const owner = priorityDialogEntry.owner;
    const objectiveLink = findWorkplanObjective(departmentWorkplans, priorityForm.objectiveId);
    const linkedWorkplan = objectiveLink?.workplan || null;
    const linkedObjective = objectiveLink?.objective || null;
    const linkedPriority = enterprisePriorities.find((candidate) => candidate.id === (priorityForm.priorityId || linkedObjective?.enterprisePriorityId));
    const validatedPriority = linkedObjective && linkedPriority && linkedObjective.enterprisePriorityId !== linkedPriority.id
      ? null
      : linkedPriority;

    if (!linkedObjective && !validatedPriority) return;

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
          alignedPriorityLabel: [validatedPriority?.name, linkedObjective?.title].filter(Boolean).join(' + '),
          alignmentType: validatedPriority && linkedObjective ? 'both' : validatedPriority ? 'enterprise' : 'department',
          createdAt: entry.createdAt || new Date().toISOString(),
          due: priorityForm.due,
          objectiveId: linkedObjective?.id || null,
          priorityId: validatedPriority?.id || null,
          riskSupportNote: priorityForm.riskSupportNote,
          sourceType: 'weekly_priority_entry',
          status: priorityForm.status,
          tasks: [...firstTask, ...(entry.tasks || [])],
          title: priorityForm.title.trim(),
          updatedAt: new Date().toISOString(),
          strategicPillarId: linkedObjective?.strategicPillarId || null,
          workplanId: linkedWorkplan?.id || null,
        }
        : entry
    )));
    firstTask.forEach((task) => registerWeeklyActionItem({
      ...task,
      description: task.title,
      entryId: priorityDialogEntry.id,
      sourceId: task.id,
      sourceLabel: priorityForm.title.trim(),
      sourceType: 'weekly_action_item',
      weeklyPriorityTitle: priorityForm.title.trim(),
    }));
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
    registerWeeklyActionItem({
      ...task,
      description: task.title,
      entryId: taskForm.entryId,
      sourceId: task.id,
      sourceLabel: taskDialogEntry.title,
      sourceType: 'weekly_action_item',
      weeklyPriorityTitle: taskDialogEntry.title,
    });
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
    updateWeeklyActionItem(taskId, { status });
  };

  const deleteTask = (entryId, taskId) => {
    setCurrentEntries((current) => current.map((entry) => (
      entry.id === entryId
        ? { ...entry, tasks: entry.tasks.filter((task) => task.id !== taskId) }
        : entry
    )));
    removeWeeklyActionItem(taskId);
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
            Users define ranked Weekly Priorities here, align each one to an Enterprise Priority or Departmental Priority, then assign Action Items pursuant to the week&apos;s commitments.
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
            {report.sourceSheet && ` - source tab ${report.sourceSheet}`}
          </Typography>
        </Stack>
      </Stack>

      <Stack gap={1.5}>
        {visibleRows.map(({ entries: rowEntries, participant }) => (
          <Box
            data-testid={`weekly-participant-${participant.id}`}
            key={participant.id}
            onDragEnter={() => {
              setDragOverParticipantId(participant.id);
              moveDraggedParticipantBefore(participant.id);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              setDraggedParticipantId(null);
              setDragOverParticipantId(null);
            }}
            sx={{
              bgcolor: participant.id === user.id ? 'rgba(7, 44, 94, 0.06)' : 'background.paper',
              border: '1px solid',
              borderColor: participant.id === user.id ? 'primary.main' : 'divider',
              borderTopWidth: dragOverParticipantId === participant.id && draggedParticipantId !== participant.id ? 3 : 1,
              borderRadius: 1,
              boxShadow: participant.id === user.id ? '0 8px 20px rgba(7, 44, 94, 0.12)' : 'none',
              overflow: 'hidden',
            }}
          >
            <Stack direction={{ xs: 'column', md: 'row' }} gap={1.5} sx={{ p: 1.5, bgcolor: participant.id === user.id ? 'rgba(7, 44, 94, 0.08)' : 'background.default', borderBottom: '1px solid', borderColor: 'divider' }}>
              <Stack direction="row" gap={1} alignItems="center" sx={{ minWidth: { md: 300 } }}>
                <Tooltip title="Drag to reorder rows. Use arrow keys while focused to move this row.">
                  <Box
                    aria-label={`Reorder weekly tracker row for ${participant.name}`}
                    draggable
                    onDragEnd={() => {
                      setDraggedParticipantId(null);
                      setDragOverParticipantId(null);
                    }}
                    onDragStart={(event) => {
                      setDraggedParticipantId(participant.id);
                      event.dataTransfer.effectAllowed = 'move';
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'ArrowUp') {
                        event.preventDefault();
                        moveParticipantRow(participant.id, -1);
                      }
                      if (event.key === 'ArrowDown') {
                        event.preventDefault();
                        moveParticipantRow(participant.id, 1);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    sx={{
                      color: participant.id === user.id ? 'primary.main' : 'text.secondary',
                      cursor: 'grab',
                      display: 'grid',
                      placeItems: 'center',
                      '&:active': { cursor: 'grabbing', transform: 'scale(1.12)' },
                      '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
                    }}
                  >
                    <DragIndicatorOutlinedIcon fontSize="small" />
                  </Box>
                </Tooltip>
                <UserAvatar user={participant} size="md" />
                <Box>
                  <Typography fontWeight={800}>{participant.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{participant.department}</Typography>
                </Box>
              </Stack>
              <Stack direction="row" gap={1} flexWrap="wrap">
                {participant.id === user.id && <Chip label="You" color="primary" size="small" />}
                <Chip label={participant.workingGroup} size="small" variant="outlined" />
                <Chip label={participant.role} size="small" variant="outlined" />
              </Stack>
            </Stack>

            <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: { xs: '1fr', lg: 'repeat(auto-fit, minmax(280px, 1fr))' }, p: 1 }}>
              {rowEntries.map((entry) => {
                const movement = rankMovement(entry);
                const cardCanOpen = Boolean(entry.title) || canManageWeeklyEntry(entry, user);
                const openCard = () => {
                  if (entry.title) openEntryDetail(entry);
                  else if (canManageWeeklyEntry(entry, user)) openPriorityDialog(entry);
                };

                return (
                  <Box
                    aria-label={entry.title ? `Open weekly priority detail for ${entry.title}` : `Set weekly priority ${entry.rank} for ${participant.name}`}
                    key={entry.id}
                    onClick={cardCanOpen ? openCard : undefined}
                    onKeyDown={(event) => {
                      if (event.target !== event.currentTarget || !cardCanOpen || !['Enter', ' '].includes(event.key)) return;
                      event.preventDefault();
                      openCard();
                    }}
                    role={cardCanOpen ? 'button' : undefined}
                    tabIndex={cardCanOpen ? 0 : undefined}
                    title={entry.title ? `Open weekly priority detail for ${entry.title}` : `Set weekly priority ${entry.rank} for ${participant.name}`}
                    sx={{
                      p: 1.5,
                      border: cardCanOpen ? '1px solid' : '0 solid',
                      borderColor: cardCanOpen ? 'divider' : 'transparent',
                      borderRadius: 1,
                      bgcolor: cardCanOpen ? 'background.paper' : 'background.default',
                      cursor: cardCanOpen ? 'pointer' : 'default',
                      minHeight: 260,
                      transition: 'border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease',
                      '&:focus-visible': {
                        outline: '3px solid',
                        outlineColor: 'secondary.main',
                        outlineOffset: 2,
                      },
                      '&:hover': cardCanOpen ? {
                        borderColor: 'secondary.main',
                        boxShadow: '0 8px 18px rgba(31, 79, 86, 0.13)',
                        transform: 'translateY(-1px)',
                      } : undefined,
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
                      <Chip label={`#${entry.rank}${entry.rank === 1 ? ' Most Important' : ''}`} color={entry.rank === 1 ? 'primary' : 'default'} size="small" />
                      <Chip label={statusLabels[entry.status] || entry.status} color={statusColors[entry.status] || 'default'} size="small" variant={entry.status === 'steady' ? 'filled' : 'outlined'} />
                    </Stack>

                    {entry.title ? (
                      <>
                        <Typography fontWeight={800} sx={{ mt: 1 }}>{entry.title}</Typography>
                        <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mt: 1 }}>
                          <Chip label={getAlignmentChipLabel(entry)} size="small" variant="outlined" color={entry.alignedPriorityLabel ? 'default' : 'warning'} />
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
                          <Typography variant="caption" fontWeight={800}>Action Items</Typography>
                          <Stack direction="row" gap={0.5}>
                            <Tooltip title="Carry priority into next week">
                              <IconButton size="small" aria-label={`Carry forward ${entry.title}`} onClick={(event) => {
                                event.stopPropagation();
                                carryEntryForward(entry.id);
                              }}>
                                <ArrowForwardOutlinedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Add Action Item">
                              <IconButton size="small" aria-label={`Add action item for ${entry.title}`} onClick={(event) => {
                                event.stopPropagation();
                                openTaskDialog(entry);
                              }}>
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
                              </Box>
                              <TextField select size="small" value={normalizeTaskStatus(task.status)} onClick={(event) => event.stopPropagation()} onChange={(event) => updateTaskStatus(entry.id, task.id, event.target.value)} sx={{ width: 128 }}>
                                {taskStatuses.map((status) => <MenuItem key={status} value={status}>{status.replace('_', ' ')}</MenuItem>)}
                              </TextField>
                              <Tooltip title={stucks.some((stuck) => stuck.sourceId === task.id) ? 'Resolve the linked stuck before deleting this Action Item' : 'Delete Action Item'}>
                                <span>
                                  <IconButton
                                    size="small"
                                    disabled={stucks.some((stuck) => stuck.sourceId === task.id)}
                                    aria-label={`Delete action item ${task.title}`}
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      deleteTask(entry.id, task.id);
                                    }}
                                  >
                                    <DeleteOutlineOutlinedIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                              <Tooltip title={!canUseStuckActions ? 'Stuck actions are off for your account' : task.owner.id === user.id ? 'Issue a Stuck' : 'Only the assigned owner can issue a stuck'}>
                                <span>
                                  <IconButton
                                    size="small"
                                    disabled={!canUseStuckActions || task.owner.id !== user.id}
                                    aria-label={`Issue a stuck for action item ${task.title}`}
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      setStuckTask({ ...task, sourceType: 'weekly_action_item' });
                                    }}
                                  >
                                    <WarningAmberOutlinedIcon fontSize="small" />
                                  </IconButton>
                                </span>
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
                          {canManageWeeklyEntry(entry, user) && <Typography variant="caption">Click to set weekly priority</Typography>}
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

      <Dialog aria-labelledby="weekly-priority-dialog-title" open={Boolean(priorityDialogEntry)} onClose={closePriorityDialog} fullWidth maxWidth="sm">
        <DialogTitle id="weekly-priority-dialog-title">Set Weekly Priority</DialogTitle>
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
            <TextField label="Priority due date" type="date" value={priorityForm.due} onChange={updatePriorityForm('due')} fullWidth InputLabelProps={{ shrink: true }} />
            {!hasAlignmentSourceOptions && (
              <Box sx={{ border: '1px solid', borderColor: 'warning.main', borderRadius: 1, bgcolor: 'warning.light', color: 'warning.contrastText', p: 1.25 }}>
                <Typography variant="body2" fontWeight={700}>Alignment source required</Typography>
                <Typography variant="body2">Create a Department Workplan objective or Enterprise Priority before adding Weekly Tracker priorities.</Typography>
                <Typography variant="body2">The OLT sheet expects each weekly priority to name its Enterprise Priority or Departmental Priority alignment.</Typography>
              </Box>
            )}
            <TextField
              select
              label="Departmental Priority / Department Objective"
              value={priorityForm.objectiveId}
              onChange={updatePriorityForm('objectiveId')}
              fullWidth
              required={!priorityForm.priorityId}
              helperText="Choose the Departmental Priority represented by a Department Objective, or choose an Enterprise Priority below."
            >
              <MenuItem value="">{hasAlignmentSourceOptions ? 'Select Departmental Priority / Department Objective' : 'Departmental Priority unavailable'}</MenuItem>
              {departmentWorkplans.flatMap((workplan) => (workplan.objectives || []).map((objective) => (
                <MenuItem key={objective.id} value={objective.id}>{workplan.department} - {objective.title}</MenuItem>
              )))}
            </TextField>
            <TextField
              select
              label="Enterprise Priority"
              value={priorityForm.priorityId}
              onChange={updatePriorityForm('priorityId')}
              fullWidth
              required={!priorityForm.objectiveId}
              helperText="Required when no Departmental Priority / Department Objective is selected."
            >
              <MenuItem value="">{hasAlignmentSourceOptions ? 'Select Enterprise Priority' : 'Enterprise Priority unavailable'}</MenuItem>
              {enterprisePriorities
                .filter((priority) => {
                  const linked = findWorkplanObjective(departmentWorkplans, priorityForm.objectiveId);
                  return !linked || linked.objective.enterprisePriorityId === priority.id;
                })
                .map((priority) => <MenuItem key={priority.id} value={priority.id}>{priority.name}</MenuItem>)}
            </TextField>
            <TextField select label="Priority health" value={priorityForm.status} onChange={updatePriorityForm('status')} fullWidth>
              {weeklyPriorityStatuses.map((status) => (
                <MenuItem key={status} value={status}>{statusLabels[status]}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Risk or support needed"
              value={priorityForm.riskSupportNote}
              onChange={updatePriorityForm('riskSupportNote')}
              helperText="Name specific people and specific support required when possible."
              minRows={2}
              multiline
              fullWidth
            />
            <Divider />
            <Box>
              <Typography variant="subtitle2">First Action Item</Typography>
              <Typography variant="body2" color="text.secondary">
                Optional, but useful when the priority already has a first move.
              </Typography>
            </Box>
            <TextField
              label="Action Item"
              value={priorityForm.firstTaskTitle}
              onChange={updatePriorityForm('firstTaskTitle')}
              fullWidth
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
              <TextField select label="Action Item owner" value={priorityForm.firstTaskOwnerId} onChange={updatePriorityForm('firstTaskOwnerId')} fullWidth>
                {users.map((candidate) => <MenuItem key={candidate.id} value={candidate.id}>{candidate.name} - {candidate.department}</MenuItem>)}
              </TextField>
              <TextField label="Action Item due date" type="date" value={priorityForm.firstTaskDue} onChange={updatePriorityForm('firstTaskDue')} fullWidth InputLabelProps={{ shrink: true }} />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closePriorityDialog}>Cancel</Button>
          <Button variant="contained" onClick={saveWeeklyPriority} disabled={!canSavePriority}>Save Weekly Priority</Button>
        </DialogActions>
      </Dialog>

      <Dialog aria-labelledby="weekly-priority-detail-title" open={Boolean(selectedEntry)} onClose={closeEntryDetail} fullWidth maxWidth="md">
        <DialogTitle id="weekly-priority-detail-title">Weekly Priority Detail</DialogTitle>
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
                  <Typography variant="body2" color="text.secondary">{getAlignmentTypeLabel(selectedEntry)}</Typography>
                </Box>
                <Box sx={{ bgcolor: 'background.default', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.25 }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase' }}>Risk or support needed</Typography>
                  <Typography variant="body1" color="text.primary" sx={{ mt: 0.5 }}>{selectedEntry.riskSupportNote || 'No support note added'}</Typography>
                </Box>
              </Box>

              <Divider />

              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1}>
                <Box>
                  <Typography variant="h3">Action Items</Typography>
                  <Typography variant="body2">Action Items are the concrete tasks attached to this weekly priority.</Typography>
                </Box>
                <Button startIcon={<AddOutlinedIcon />} onClick={() => openTaskDialog(selectedEntry)}>
                  Add Action Item
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
                    <Typography variant="body2" color="text.secondary">No Action Items have been added yet.</Typography>
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

      <Dialog aria-labelledby="weekly-action-item-dialog-title" open={Boolean(taskDialogEntry)} onClose={closeTaskDialog} fullWidth maxWidth="sm">
        <DialogTitle id="weekly-action-item-dialog-title">Add Action Item</DialogTitle>
        <DialogContent>
          <Stack gap={2} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary">{taskDialogEntry?.title}</Typography>
            <TextField label="Action Item" value={taskForm.title} onChange={updateTaskForm('title')} fullWidth />
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
          <Button variant="contained" onClick={addTask} disabled={!taskForm.title.trim()}>Add Action Item</Button>
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
    </PageWrapper>
  );
};

export default WeeklyActionTrackerPage;
