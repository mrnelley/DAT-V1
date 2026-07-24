import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  deleteEnterprisePriorityRecord,
  deleteInitiativeRecord,
  deleteStrategicPillarRecord,
  deleteTouchpointRecord,
  deleteWeeklyTaskRecord,
  deleteWorkplanRecord,
  loadOperatingData,
  replaceWeeklyEntries,
  saveActionItemRecord,
  saveContactRecord,
  saveEnterprisePriorityRecord,
  saveHuddleRecord,
  saveInitiativeRecord,
  savePropertyAssignmentRecord,
  saveStuckRecord,
  saveStrategicPillarRecord,
  saveTaskOrder,
  saveTouchpointRecord,
  saveWorkplanRecord,
  updateActionItemRecord,
  updatePropertyRecord,
  updateStuckRecord,
  updateWeeklyTaskRecord,
} from '../api/supabaseData';
import { useReportingPeriod } from './ReportingPeriodContext';
import { useAuth } from '../hooks/useAuth';
import { isSupabaseConfigured } from '../lib/supabase';

const OperatingDataContext = createContext(null);

const emptyState = {
  contacts: [],
  departmentRecords: [],
  departments: [],
  departmentWorkplans: [],
  enterprisePriorities: [],
  huddles: [],
  initiatives: [],
  metrics: [],
  organizationId: null,
  properties: [],
  queuedTasks: [],
  strategicPlan: {
    description: '',
    id: null,
    name: 'No strategic plan configured',
    owner: '',
    pillars: [],
    timeframe: '',
  },
  stucks: [],
  touchpoints: [],
  users: [],
  weeklyActionItems: [],
  weeklyPriorityEntriesByWeek: {},
  weeklyReports: [],
};

const mondayFor = (date = new Date()) => {
  const start = new Date(date);
  const offset = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - offset);
  return start;
};

const toDate = (date) => [
  date.getFullYear(),
  String(date.getMonth() + 1).padStart(2, '0'),
  String(date.getDate()).padStart(2, '0'),
].join('-');

const buildCurrentWeek = () => {
  const start = mondayFor();
  const end = new Date(start);
  end.setDate(start.getDate() + 4);
  const weekStart = toDate(start);
  const weekEnd = toDate(end);
  return {
    id: `week-${weekStart}`,
    label: 'Current week',
    reviewMeetingAt: `${weekEnd}T10:00:00`,
    status: 'draft',
    submissionDueAt: `${weekEnd}T12:00:00`,
    weekEnd,
    weekStart,
  };
};

const resolveCurrentWeek = (reports) => {
  const today = toDate(new Date());
  return reports.find((report) => report.weekStart <= today && report.weekEnd >= today)
    || reports.at(-1)
    || buildCurrentWeek();
};

export const OperatingDataProvider = ({ children, initialData = null }) => {
  const { isAuthenticated, user } = useAuth();
  const {
    reportingPeriods,
    selectedPeriodRecordId,
  } = useReportingPeriod();
  const [state, setState] = useState(() => ({ ...emptyState, ...(initialData || {}) }));
  const [isLoading, setIsLoading] = useState(!initialData);
  const [error, setError] = useState('');
  const persistenceEnabled = !initialData && isSupabaseConfigured && isAuthenticated;

  const refresh = useCallback(async () => {
    if (!persistenceEnabled) {
      setIsLoading(false);
      return null;
    }

    setIsLoading(true);
    try {
      const next = await loadOperatingData();
      setState(next);
      setError('');
      return next;
    } catch (loadError) {
      setError(loadError.message || 'Unable to load operating data.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [persistenceEnabled]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const runMutation = useCallback(async (mutation) => {
    if (!persistenceEnabled) return null;
    try {
      const result = await mutation();
      await refresh();
      setError('');
      return result;
    } catch (mutationError) {
      await refresh();
      setError(mutationError.message || 'The change could not be saved.');
      return null;
    }
  }, [persistenceEnabled, refresh]);

  const departmentByName = useCallback(
    (name) => state.departmentRecords.find((department) => department.name === name),
    [state.departmentRecords],
  );
  const periodRecordIdFor = useCallback((periodId) => (
    reportingPeriods.find((period) => period.id === periodId)?.databaseId || selectedPeriodRecordId
  ), [reportingPeriods, selectedPeriodRecordId]);

  const addQueuedTask = useCallback((task) => {
    setState((current) => ({ ...current, queuedTasks: [...current.queuedTasks, task] }));
    runMutation(() => saveActionItemRecord({
      organizationId: state.organizationId,
      task,
    }));
  }, [runMutation, state.organizationId]);

  const updateQueuedTask = useCallback((taskId, changes) => {
    setState((current) => ({
      ...current,
      queuedTasks: current.queuedTasks.map((task) => (
        task.id === taskId ? { ...task, ...changes } : task
      )),
    }));
    runMutation(() => updateActionItemRecord(taskId, changes));
  }, [runMutation]);

  const updateProperty = useCallback((propertyId, changes) => {
    setState((current) => ({
      ...current,
      properties: current.properties.map((property) => (
        property.id === propertyId ? { ...property, ...changes } : property
      )),
    }));
    runMutation(() => updatePropertyRecord(propertyId, changes));
  }, [runMutation]);

  const savePropertyAssignment = useCallback((propertyId, role, profileId) => {
    setState((current) => ({
      ...current,
      properties: current.properties.map((property) => {
        if (property.id !== propertyId) return property;
        const retained = (property.assignments || []).filter((assignment) => assignment.role !== role);
        const profile = current.users.find((candidate) => candidate.id === profileId);
        return {
          ...property,
          assignments: profile ? [...retained, { profile, role }] : retained,
        };
      }),
    }));
    runMutation(() => savePropertyAssignmentRecord({ profileId, propertyId, role }));
  }, [runMutation]);

  const reorderQueuedTasks = useCallback((orderedTaskIds) => {
    const order = new Map(orderedTaskIds.map((id, index) => [id, index]));
    setState((current) => ({
      ...current,
      queuedTasks: current.queuedTasks.map((task) => (
        order.has(task.id) ? { ...task, queueOrder: order.get(task.id) } : task
      )),
    }));
    runMutation(() => saveTaskOrder(orderedTaskIds));
  }, [runMutation]);

  const saveDepartmentWorkplan = useCallback((workplan) => {
    setState((current) => ({
      ...current,
      departmentWorkplans: workplan.id
        ? current.departmentWorkplans.map((item) => (item.id === workplan.id ? workplan : item))
        : [workplan, ...current.departmentWorkplans],
    }));
    runMutation(() => saveWorkplanRecord({
      departmentId: departmentByName(workplan.department)?.id || null,
      organizationId: state.organizationId,
      strategicPlanId: state.strategicPlan.id,
      workplan,
    }));
  }, [departmentByName, runMutation, state.organizationId, state.strategicPlan.id]);

  const deleteDepartmentWorkplan = useCallback((workplanId) => {
    setState((current) => ({
      ...current,
      departmentWorkplans: current.departmentWorkplans.filter((workplan) => workplan.id !== workplanId),
    }));
    runMutation(() => deleteWorkplanRecord(workplanId));
  }, [runMutation]);

  const saveStrategicPillar = useCallback((pillar) => {
    const savedPillar = {
      ...pillar,
      id: pillar.id || globalThis.crypto.randomUUID(),
      order: pillar.order ?? Math.max(
        0,
        ...state.strategicPlan.pillars.map((item) => Number(item.order) || 0),
      ) + 1,
    };

    setState((current) => ({
      ...current,
      strategicPlan: {
        ...current.strategicPlan,
        pillars: current.strategicPlan.pillars.some((item) => item.id === savedPillar.id)
          ? current.strategicPlan.pillars.map((item) => (
            item.id === savedPillar.id ? savedPillar : item
          ))
          : [...current.strategicPlan.pillars, savedPillar],
      },
    }));
    runMutation(() => saveStrategicPillarRecord(state.strategicPlan.id, savedPillar));
  }, [runMutation, state.strategicPlan]);

  const deleteStrategicPillar = useCallback((pillarId) => {
    setState((current) => ({
      ...current,
      strategicPlan: {
        ...current.strategicPlan,
        pillars: current.strategicPlan.pillars.filter((pillar) => pillar.id !== pillarId),
      },
    }));
    runMutation(() => deleteStrategicPillarRecord(pillarId));
  }, [runMutation]);

  const saveEnterprisePriority = useCallback((priority) => {
    setState((current) => ({
      ...current,
      enterprisePriorities: current.enterprisePriorities.some((item) => item.id === priority.id)
        ? current.enterprisePriorities.map((item) => (item.id === priority.id ? priority : item))
        : [priority, ...current.enterprisePriorities],
    }));
    runMutation(() => saveEnterprisePriorityRecord({
      organizationId: state.organizationId,
      priority,
      reportingPeriodRecordId: priority.reportingPeriodRecordId
        || periodRecordIdFor(priority.reportingPeriodId),
      strategicPlanId: state.strategicPlan.id,
    }));
  }, [periodRecordIdFor, runMutation, state.organizationId, state.strategicPlan.id]);

  const setEnterprisePriorities = useCallback((updater) => {
    const next = typeof updater === 'function' ? updater(state.enterprisePriorities) : updater;
    const previousIds = new Set(state.enterprisePriorities.map((priority) => priority.id));
    const nextIds = new Set(next.map((priority) => priority.id));
    setState((current) => ({ ...current, enterprisePriorities: next }));

    runMutation(async () => {
      for (const priority of next) {
        await saveEnterprisePriorityRecord({
          organizationId: state.organizationId,
          priority,
          reportingPeriodRecordId: priority.reportingPeriodRecordId
            || periodRecordIdFor(priority.reportingPeriodId),
          strategicPlanId: state.strategicPlan.id,
        });
      }
      for (const removedId of [...previousIds].filter((id) => !nextIds.has(id))) {
        await deleteEnterprisePriorityRecord(removedId);
      }
    });
  }, [
    periodRecordIdFor,
    runMutation,
    state.enterprisePriorities,
    state.organizationId,
    state.strategicPlan.id,
  ]);

  const addStuck = useCallback((stuck) => {
    setState((current) => ({ ...current, stucks: [stuck, ...current.stucks] }));
    runMutation(() => saveStuckRecord({ organizationId: state.organizationId, stuck }));
  }, [runMutation, state.organizationId]);

  const updateStuck = useCallback((stuckId, changes) => {
    setState((current) => ({
      ...current,
      stucks: current.stucks.map((stuck) => (
        stuck.id === stuckId ? { ...stuck, ...changes } : stuck
      )),
    }));
    runMutation(() => updateStuckRecord(stuckId, changes));
  }, [runMutation]);

  const addHuddle = useCallback((huddle) => {
    setState((current) => ({ ...current, huddles: [huddle, ...current.huddles] }));
    runMutation(() => saveHuddleRecord({ huddle, organizationId: state.organizationId }));
  }, [runMutation, state.organizationId]);

  const updateHuddle = useCallback((huddleId, changes) => {
    const currentHuddle = state.huddles.find((huddle) => huddle.id === huddleId);
    if (!currentHuddle) return;
    const updated = { ...currentHuddle, ...changes };
    setState((current) => ({
      ...current,
      huddles: current.huddles.map((huddle) => (huddle.id === huddleId ? updated : huddle)),
    }));
    runMutation(() => saveHuddleRecord({ huddle: updated, organizationId: state.organizationId }));
  }, [runMutation, state.huddles, state.organizationId]);

  const addHuddleItem = useCallback((huddleId, item) => {
    const task = {
      ...item,
      createdBy: item.createdBy || user,
      huddleId,
      owner: item.owner || user,
      queueOrder: 0,
      status: item.status || 'open',
      visibility: 'department',
    };
    setState((current) => ({
      ...current,
      huddles: current.huddles.map((huddle) => (
        huddle.id === huddleId ? { ...huddle, items: [task, ...(huddle.items || [])] } : huddle
      )),
    }));
    runMutation(() => saveActionItemRecord({ organizationId: state.organizationId, task }));
  }, [runMutation, state.organizationId, user]);

  const setWeeklyPriorityEntriesForWeek = useCallback((weekId, updater) => {
    const currentEntries = state.weeklyPriorityEntriesByWeek[weekId] || [];
    const nextEntries = typeof updater === 'function' ? updater(currentEntries) : updater;
    const report = state.weeklyReports.find((item) => item.id === weekId) || resolveCurrentWeek(state.weeklyReports);
    setState((current) => ({
      ...current,
      weeklyPriorityEntriesByWeek: {
        ...current.weeklyPriorityEntriesByWeek,
        [weekId]: nextEntries,
      },
    }));
    runMutation(() => replaceWeeklyEntries({
      entries: nextEntries,
      organizationId: state.organizationId,
      report,
      reportingPeriodRecordId: report.reportingPeriodRecordId || selectedPeriodRecordId,
      userId: user?.id,
    }));
  }, [
    runMutation,
    selectedPeriodRecordId,
    state.organizationId,
    state.weeklyPriorityEntriesByWeek,
    state.weeklyReports,
    user?.id,
  ]);

  const registerWeeklyActionItem = useCallback((item) => {
    setState((current) => ({
      ...current,
      weeklyActionItems: [item, ...current.weeklyActionItems.filter((candidate) => candidate.id !== item.id)],
    }));
  }, []);

  const updateWeeklyActionItem = useCallback((itemId, changes) => {
    setState((current) => ({
      ...current,
      weeklyActionItems: current.weeklyActionItems.map((item) => (
        item.id === itemId ? { ...item, ...changes } : item
      )),
    }));
    runMutation(() => updateWeeklyTaskRecord(itemId, changes));
  }, [runMutation]);

  const removeWeeklyActionItem = useCallback((itemId) => {
    setState((current) => ({
      ...current,
      weeklyActionItems: current.weeklyActionItems.filter((item) => item.id !== itemId),
    }));
    runMutation(() => deleteWeeklyTaskRecord(itemId));
  }, [runMutation]);

  const saveContact = useCallback((contact) => {
    setState((current) => ({
      ...current,
      contacts: current.contacts.some((item) => item.id === contact.id)
        ? current.contacts.map((item) => (item.id === contact.id ? contact : item))
        : [contact, ...current.contacts],
    }));
    runMutation(() => saveContactRecord({
      contact,
      organizationId: state.organizationId,
      ownerId: contact.lead?.id || user?.id,
    }));
  }, [runMutation, state.organizationId, user?.id]);

  const saveTouchpoint = useCallback((touchpoint) => {
    setState((current) => ({
      ...current,
      touchpoints: current.touchpoints.some((item) => item.id === touchpoint.id)
        ? current.touchpoints.map((item) => (item.id === touchpoint.id ? touchpoint : item))
        : [touchpoint, ...current.touchpoints],
    }));
    runMutation(() => saveTouchpointRecord({
      organizationId: state.organizationId,
      ownerId: touchpoint.createdBy?.id || user?.id,
      touchpoint,
    }));
  }, [runMutation, state.organizationId, user?.id]);

  const deleteTouchpoint = useCallback((touchpointId) => {
    setState((current) => ({
      ...current,
      touchpoints: current.touchpoints.map((item) => (
        item.id === touchpointId ? { ...item, status: 'deleted' } : item
      )),
    }));
    runMutation(() => deleteTouchpointRecord(touchpointId));
  }, [runMutation]);

  const saveInitiative = useCallback((initiative) => {
    setState((current) => ({
      ...current,
      initiatives: current.initiatives.some((item) => item.id === initiative.id)
        ? current.initiatives.map((item) => (item.id === initiative.id ? initiative : item))
        : [initiative, ...current.initiatives],
    }));
    runMutation(() => saveInitiativeRecord({
      initiative,
      organizationId: state.organizationId,
      ownerId: initiative.owner?.id || user?.id,
      reportingPeriodRecordId: initiative.reportingPeriodRecordId
        || periodRecordIdFor(initiative.reportingPeriodId),
      strategicPlanId: state.strategicPlan.id,
    }));
  }, [
    periodRecordIdFor,
    runMutation,
    state.organizationId,
    state.strategicPlan.id,
    user?.id,
  ]);

  const deleteInitiative = useCallback((initiativeId) => {
    setState((current) => ({
      ...current,
      initiatives: current.initiatives.filter((item) => item.id !== initiativeId),
    }));
    runMutation(() => deleteInitiativeRecord(initiativeId));
  }, [runMutation]);

  const getTasksForUser = useCallback((userId) => [
    ...state.queuedTasks.filter((task) => task.owner?.id === userId),
    ...state.weeklyActionItems.filter((task) => task.owner?.id === userId),
  ], [state.queuedTasks, state.weeklyActionItems]);

  const currentWeeklyReport = useMemo(
    () => resolveCurrentWeek(state.weeklyReports),
    [state.weeklyReports],
  );
  const weeklyReports = useMemo(() => (
    state.weeklyReports.length ? state.weeklyReports : [currentWeeklyReport]
  ), [currentWeeklyReport, state.weeklyReports]);

  const value = useMemo(() => ({
    ...state,
    addHuddle,
    addHuddleItem,
    addQueuedTask,
    addStuck,
    currentWeeklyReport,
    deleteDepartmentWorkplan,
    deleteInitiative,
    deleteStrategicPillar,
    deleteTouchpoint,
    error,
    getHuddle: (huddleId) => state.huddles.find((huddle) => huddle.id === huddleId),
    getTasksForUser,
    isLoading,
    refresh,
    registerWeeklyActionItem,
    removeWeeklyActionItem,
    reorderQueuedTasks,
    saveContact,
    saveDepartmentWorkplan,
    saveEnterprisePriority,
    saveInitiative,
    savePropertyAssignment,
    saveStrategicPillar,
    saveTouchpoint,
    setEnterprisePriorities,
    setWeeklyPriorityEntriesForWeek,
    updateHuddle,
    updateProperty,
    updateQueuedTask,
    updateStuck,
    updateWeeklyActionItem,
    weeklyReports,
  }), [
    addHuddle,
    addHuddleItem,
    addQueuedTask,
    addStuck,
    currentWeeklyReport,
    deleteDepartmentWorkplan,
    deleteInitiative,
    deleteStrategicPillar,
    deleteTouchpoint,
    error,
    getTasksForUser,
    isLoading,
    refresh,
    registerWeeklyActionItem,
    removeWeeklyActionItem,
    reorderQueuedTasks,
    saveContact,
    saveDepartmentWorkplan,
    saveEnterprisePriority,
    saveInitiative,
    savePropertyAssignment,
    saveStrategicPillar,
    saveTouchpoint,
    setEnterprisePriorities,
    setWeeklyPriorityEntriesForWeek,
    state,
    updateHuddle,
    updateProperty,
    updateQueuedTask,
    updateStuck,
    updateWeeklyActionItem,
    weeklyReports,
  ]);

  return <OperatingDataContext.Provider value={value}>{children}</OperatingDataContext.Provider>;
};

export const useOperatingData = () => {
  const context = useContext(OperatingDataContext);
  if (!context) throw new Error('useOperatingData must be used within OperatingDataProvider');
  return context;
};
