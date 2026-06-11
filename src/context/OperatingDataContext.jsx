import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  departmentWorkplans,
  queuedTasks,
  huddles as seededHuddles,
  stucks as seededStucks,
  users,
  weeklyActionEntries,
} from '../data/mockData';

const OperatingDataContext = createContext(null);
const storageKey = 'hdc_compass_operating_data';

const groupTasksByOwner = (tasks) => tasks.reduce((groups, task) => ({
  ...groups,
  [task.owner.id]: [...(groups[task.owner.id] || []), task],
}), {});

const buildInitialState = () => ({
  departmentWorkplans,
  huddles: seededHuddles.map((huddle, index) => ({
    agenda: ['Review current signals', 'Discuss stucks and owner follow-up', 'Confirm next commitments'],
    date: index === 0 ? '2026-06-09' : '2026-06-12',
    description: 'Operating rhythm for surfacing progress, blockers, and commitments.',
    items: [],
    memberIds: users.map((user) => user.id),
    ownerId: users[0].id,
    ...huddle,
  })),
  queuedTasksByOwner: groupTasksByOwner(queuedTasks),
  stucks: seededStucks.map((stuck) => ({
    personStuck: stuck.personStuck,
    sourceId: stuck.sourceId || null,
    sourceLabel: stuck.sourceLabel || null,
    sourceType: stuck.sourceType || null,
    status: stuck.status || 'active',
    ...stuck,
  })),
  weeklyActionItems: weeklyActionEntries.flatMap((entry) => entry.tasks.map((task) => ({
    ...task,
    description: task.title,
    entryId: entry.id,
    sourceId: task.id,
    sourceLabel: entry.title,
    sourceType: 'weekly_action_item',
    weeklyPriorityTitle: entry.title,
  }))),
});

const readState = () => {
  if (typeof window === 'undefined') return buildInitialState();

  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey));
    return parsed ? { ...buildInitialState(), ...parsed } : buildInitialState();
  } catch {
    return buildInitialState();
  }
};

export const OperatingDataProvider = ({ children }) => {
  const [state, setState] = useState(readState);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(storageKey, JSON.stringify(state));
    }
  }, [state]);

  const addQueuedTask = useCallback((task) => {
    setState((current) => {
      const ownerTasks = current.queuedTasksByOwner[task.owner.id] || [];
      const firstOrder = Math.min(0, ...ownerTasks.map((item) => Number(item.queueOrder) || 0)) - 1;
      return {
        ...current,
        queuedTasksByOwner: {
          ...current.queuedTasksByOwner,
          [task.owner.id]: [{ pinned: false, queueOrder: firstOrder, ...task }, ...ownerTasks],
        },
      };
    });
  }, []);

  const saveDepartmentWorkplan = useCallback((workplan) => {
    setState((current) => {
      const next = workplan.id ? workplan : { ...workplan, id: `dw-${Date.now()}` };

      return {
        ...current,
        departmentWorkplans: workplan.id
          ? current.departmentWorkplans.map((item) => (item.id === workplan.id ? next : item))
          : [next, ...current.departmentWorkplans],
      };
    });
  }, []);

  const deleteDepartmentWorkplan = useCallback((workplanId) => {
    setState((current) => ({
      ...current,
      departmentWorkplans: current.departmentWorkplans.filter((workplan) => workplan.id !== workplanId),
    }));
  }, []);

  const updateQueuedTask = useCallback((taskId, changes) => {
    setState((current) => {
      const allTasks = Object.values(current.queuedTasksByOwner).flat();
      const existing = allTasks.find((task) => task.id === taskId);
      if (!existing) return current;

      const updated = { ...existing, ...changes };
      return {
        ...current,
        queuedTasksByOwner: groupTasksByOwner([
          updated,
          ...allTasks.filter((task) => task.id !== taskId),
        ]),
      };
    });
  }, []);

  const reorderQueuedTasks = useCallback((orderedTaskIds) => {
    setState((current) => {
      const orderById = new Map(orderedTaskIds.map((taskId, index) => [taskId, index]));
      const allTasks = Object.values(current.queuedTasksByOwner).flat().map((task) => (
        orderById.has(task.id) ? { ...task, queueOrder: orderById.get(task.id) } : task
      ));
      return { ...current, queuedTasksByOwner: groupTasksByOwner(allTasks) };
    });
  }, []);

  const registerWeeklyActionItem = useCallback((item) => {
    setState((current) => ({
      ...current,
      weeklyActionItems: [
        item,
        ...current.weeklyActionItems.filter((candidate) => candidate.id !== item.id),
      ],
    }));
  }, []);

  const updateWeeklyActionItem = useCallback((itemId, changes) => {
    setState((current) => ({
      ...current,
      weeklyActionItems: current.weeklyActionItems.map((item) => (
        item.id === itemId ? { ...item, ...changes } : item
      )),
    }));
  }, []);

  const removeWeeklyActionItem = useCallback((itemId) => {
    setState((current) => ({
      ...current,
      weeklyActionItems: current.weeklyActionItems.filter((item) => item.id !== itemId),
    }));
  }, []);

  const addStuck = useCallback((stuck) => {
    setState((current) => ({ ...current, stucks: [stuck, ...current.stucks] }));
  }, []);

  const updateStuck = useCallback((stuckId, changes) => {
    setState((current) => ({
      ...current,
      stucks: current.stucks.map((stuck) => (
        stuck.id === stuckId ? { ...stuck, ...changes } : stuck
      )),
    }));
  }, []);

  const addHuddle = useCallback((huddle) => {
    setState((current) => ({ ...current, huddles: [huddle, ...current.huddles] }));
  }, []);

  const updateHuddle = useCallback((huddleId, changes) => {
    setState((current) => ({
      ...current,
      huddles: current.huddles.map((huddle) => (
        huddle.id === huddleId ? { ...huddle, ...changes } : huddle
      )),
    }));
  }, []);

  const addHuddleItem = useCallback((huddleId, item) => {
    setState((current) => ({
      ...current,
      huddles: current.huddles.map((huddle) => (
        huddle.id === huddleId
          ? { ...huddle, items: [item, ...(huddle.items || [])] }
          : huddle
      )),
    }));
  }, []);

  const queuedTasks = useMemo(() => Object.values(state.queuedTasksByOwner).flat(), [state.queuedTasksByOwner]);

  const getTasksForUser = useCallback((userId) => [
    ...queuedTasks.filter((task) => task.owner?.id === userId),
    ...state.weeklyActionItems.filter((item) => item.owner?.id === userId),
  ], [queuedTasks, state.weeklyActionItems]);

  const value = useMemo(() => ({
    addHuddle,
    addHuddleItem,
    addQueuedTask,
    addStuck,
    deleteDepartmentWorkplan,
    departmentWorkplans: state.departmentWorkplans,
    getHuddle: (huddleId) => state.huddles.find((huddle) => huddle.id === huddleId),
    getTasksForUser,
    huddles: state.huddles,
    queuedTasks,
    reorderQueuedTasks,
    registerWeeklyActionItem,
    removeWeeklyActionItem,
    saveDepartmentWorkplan,
    stucks: state.stucks,
    updateHuddle,
    updateQueuedTask,
    updateStuck,
    updateWeeklyActionItem,
    weeklyActionItems: state.weeklyActionItems,
  }), [
    addHuddle,
    addHuddleItem,
    addQueuedTask,
    addStuck,
    deleteDepartmentWorkplan,
    getTasksForUser,
    queuedTasks,
    reorderQueuedTasks,
    registerWeeklyActionItem,
    removeWeeklyActionItem,
    saveDepartmentWorkplan,
    state.departmentWorkplans,
    state.huddles,
    state.stucks,
    state.weeklyActionItems,
    updateHuddle,
    updateQueuedTask,
    updateStuck,
    updateWeeklyActionItem,
  ]);

  return <OperatingDataContext.Provider value={value}>{children}</OperatingDataContext.Provider>;
};

export const useOperatingData = () => {
  const context = useContext(OperatingDataContext);
  if (!context) throw new Error('useOperatingData must be used within OperatingDataProvider');
  return context;
};
