import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  departmentWorkplans,
  priorities as seededEnterprisePriorities,
  queuedTasks,
  huddles as seededHuddles,
  strategicPlan2030,
  stucks as seededStucks,
  users,
} from '../data/mockData';
import { normalizeReportingPeriodRecord } from '../data/reportingPeriods';
import { findWorkplanObjective, normalizeWorkplan } from '../utils/workplans';

const OperatingDataContext = createContext(null);
const storageKey = 'hdc_compass_operating_data';
const stateVersion = 5;
const legacyWeeklyTrackerStorageKey = 'hdc_compass_weekly_tracker_entries';

const groupTasksByOwner = (tasks) => tasks.reduce((groups, task) => ({
  ...groups,
  [task.owner.id]: [...(groups[task.owner.id] || []), task],
}), {});

const normalizeEnterprisePriority = (priority) => ({
  ...normalizeReportingPeriodRecord(priority),
  children: (priority.children || []).map(normalizeEnterprisePriority),
});

const normalizeEnterprisePriorities = (priorities) => (
  (priorities || []).map(normalizeEnterprisePriority)
);

const sanitizeWeeklyAlignments = (entriesByWeek, workplans, enterprisePriorities) => Object.fromEntries(
  Object.entries(entriesByWeek || {}).map(([weekId, entries]) => [
    weekId,
    entries.map((entry) => {
      const objectiveLink = findWorkplanObjective(workplans, entry.objectiveId)
        || (() => {
          const legacyWorkplan = workplans.find((workplan) => workplan.id === entry.workplanId);
          return legacyWorkplan?.objectives?.length === 1
            ? { objective: legacyWorkplan.objectives[0], workplan: legacyWorkplan }
            : null;
        })();
      const priority = enterprisePriorities.find((candidate) => candidate.id === entry.priorityId);
      const validatedPriority = priority && (!objectiveLink || objectiveLink.objective.enterprisePriorityId === priority.id)
        ? priority
        : null;
      return {
        ...entry,
        alignedPriorityLabel: [validatedPriority?.name, objectiveLink?.objective.title].filter(Boolean).join(' + '),
        alignmentType: validatedPriority && objectiveLink ? 'both' : validatedPriority ? 'enterprise' : 'department',
        objectiveId: objectiveLink?.objective.id || null,
        priorityId: validatedPriority?.id || null,
        strategicPillarId: objectiveLink?.objective.strategicPillarId || null,
        workplanId: objectiveLink?.workplan.id || null,
      };
    }),
  ]),
);

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
  enterprisePriorities: normalizeEnterprisePriorities(seededEnterprisePriorities),
  queuedTasksByOwner: groupTasksByOwner(queuedTasks),
  strategicPlan: strategicPlan2030,
  stucks: seededStucks.map((stuck) => ({
    personStuck: stuck.personStuck,
    sourceId: stuck.sourceId || null,
    sourceLabel: stuck.sourceLabel || null,
    sourceType: stuck.sourceType || null,
    status: stuck.status || 'active',
    ...stuck,
  })),
  version: stateVersion,
  weeklyActionItems: [],
  weeklyPriorityEntriesByWeek: {},
});

const mergeSeededHuddles = (currentHuddles = []) => {
  const existingIds = new Set(currentHuddles.map((huddle) => huddle.id));
  const missingSeededHuddles = buildInitialState().huddles.filter((huddle) => !existingIds.has(huddle.id));
  return [...missingSeededHuddles, ...currentHuddles];
};

const readState = () => {
  if (typeof window === 'undefined') return buildInitialState();

  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey));
    if (!parsed) return buildInitialState();

    const hasCanonicalWeeklyPriorities = Object.prototype.hasOwnProperty.call(parsed, 'weeklyPriorityEntriesByWeek');
    const enterprisePriorities = normalizeEnterprisePriorities(
      parsed.enterprisePriorities || parsed.organizationalPriorities || seededEnterprisePriorities,
    );
    const normalizedWorkplans = (parsed.departmentWorkplans || departmentWorkplans)
      .map((workplan) => normalizeWorkplan(workplan, enterprisePriorities));
    const weeklyPriorityEntriesByWeek = hasCanonicalWeeklyPriorities ? parsed.weeklyPriorityEntriesByWeek || {} : {};
    return {
      ...buildInitialState(),
      ...parsed,
      departmentWorkplans: normalizedWorkplans,
      enterprisePriorities,
      huddles: mergeSeededHuddles(parsed.huddles || []),
      organizationalPriorities: undefined,
      version: stateVersion,
      weeklyActionItems: hasCanonicalWeeklyPriorities ? parsed.weeklyActionItems || [] : [],
      weeklyPriorityEntriesByWeek: sanitizeWeeklyAlignments(weeklyPriorityEntriesByWeek, normalizedWorkplans, enterprisePriorities),
    };
  } catch {
    return buildInitialState();
  }
};

export const OperatingDataProvider = ({ children }) => {
  const [state, setState] = useState(readState);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(storageKey, JSON.stringify(state));
      window.localStorage.removeItem(legacyWeeklyTrackerStorageKey);
    }
  }, [state]);

  const addQueuedTask = useCallback((task) => {
    setState((current) => {
      const ownerTasks = current.queuedTasksByOwner[task.owner.id] || [];
      const lastOrder = Math.max(-1, ...ownerTasks.map((item) => Number(item.queueOrder) || 0)) + 1;
      return {
        ...current,
        queuedTasksByOwner: {
          ...current.queuedTasksByOwner,
          [task.owner.id]: [...ownerTasks, { pinned: false, queueOrder: lastOrder, ...task }],
        },
      };
    });
  }, []);

  const saveDepartmentWorkplan = useCallback((workplan) => {
    setState((current) => {
      const id = workplan.id || `dw-${Date.now()}`;
      const validPriorityIds = new Set(current.enterprisePriorities.map((priority) => priority.id));
      const validPillarIds = new Set(current.strategicPlan.pillars.map((pillar) => pillar.id));
      const next = normalizeWorkplan({
        ...workplan,
        id,
        objectives: (workplan.objectives || []).map((objective) => ({
          ...objective,
          enterprisePriorityId: validPriorityIds.has(objective.enterprisePriorityId) ? objective.enterprisePriorityId : null,
          strategicPillarId: validPillarIds.has(objective.strategicPillarId) ? objective.strategicPillarId : current.strategicPlan.pillars[0]?.id,
        })),
      }, current.enterprisePriorities);

      const nextWorkplans = workplan.id
        ? current.departmentWorkplans.map((item) => (item.id === workplan.id ? next : item))
        : [next, ...current.departmentWorkplans];
      return {
        ...current,
        departmentWorkplans: nextWorkplans,
        weeklyPriorityEntriesByWeek: sanitizeWeeklyAlignments(current.weeklyPriorityEntriesByWeek, nextWorkplans, current.enterprisePriorities),
      };
    });
  }, []);

  const saveStrategicPillar = useCallback((pillar) => {
    setState((current) => {
      const existing = current.strategicPlan.pillars.find((item) => item.id === pillar.id);
      const next = existing
        ? pillar
        : { ...pillar, id: pillar.id || `pillar-${Date.now()}`, order: current.strategicPlan.pillars.length + 1 };

      return {
        ...current,
        strategicPlan: {
          ...current.strategicPlan,
          pillars: existing
            ? current.strategicPlan.pillars.map((item) => (item.id === pillar.id ? next : item))
            : [...current.strategicPlan.pillars, next],
        },
      };
    });
  }, []);

  const deleteStrategicPillar = useCallback((pillarId) => {
    setState((current) => ({
      ...current,
      strategicPlan: {
        ...current.strategicPlan,
        pillars: current.strategicPlan.pillars
          .filter((pillar) => pillar.id !== pillarId)
          .map((pillar, index) => ({ ...pillar, order: index + 1 })),
      },
    }));
  }, []);

  const deleteDepartmentWorkplan = useCallback((workplanId) => {
    setState((current) => {
      const nextWorkplans = current.departmentWorkplans.filter((workplan) => workplan.id !== workplanId);
      return {
        ...current,
        departmentWorkplans: nextWorkplans,
        weeklyPriorityEntriesByWeek: sanitizeWeeklyAlignments(current.weeklyPriorityEntriesByWeek, nextWorkplans, current.enterprisePriorities),
      };
    });
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

  const setWeeklyPriorityEntriesForWeek = useCallback((weekId, updater) => {
    setState((current) => {
      const currentEntries = current.weeklyPriorityEntriesByWeek[weekId] || [];
      const nextEntries = typeof updater === 'function' ? updater(currentEntries) : updater;
      return {
        ...current,
        weeklyPriorityEntriesByWeek: {
          ...current.weeklyPriorityEntriesByWeek,
          [weekId]: nextEntries,
        },
      };
    });
  }, []);

  const setEnterprisePriorities = useCallback((updater) => {
    setState((current) => {
      const updatedPriorities = typeof updater === 'function'
        ? updater(current.enterprisePriorities)
        : updater;
      const enterprisePriorities = normalizeEnterprisePriorities(updatedPriorities);
      const validPriorityIds = new Set(enterprisePriorities.map((priority) => priority.id));
      const departmentWorkplans = current.departmentWorkplans.map((workplan) => ({
        ...workplan,
        objectives: workplan.objectives.map((objective) => ({
          ...objective,
          enterprisePriorityId: validPriorityIds.has(objective.enterprisePriorityId) ? objective.enterprisePriorityId : null,
        })),
      }));
      return {
        ...current,
        departmentWorkplans,
        enterprisePriorities,
        weeklyPriorityEntriesByWeek: sanitizeWeeklyAlignments(current.weeklyPriorityEntriesByWeek, departmentWorkplans, enterprisePriorities),
      };
    });
  }, []);

  const saveEnterprisePriority = useCallback((priority) => {
    setEnterprisePriorities((current) => {
      const existing = current.some((item) => item.id === priority.id);
      return existing
        ? current.map((item) => (item.id === priority.id ? priority : item))
        : [priority, ...current];
    });
  }, [setEnterprisePriorities]);

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
    deleteStrategicPillar,
    departmentWorkplans: state.departmentWorkplans,
    getHuddle: (huddleId) => state.huddles.find((huddle) => huddle.id === huddleId),
    getTasksForUser,
    huddles: state.huddles,
    enterprisePriorities: state.enterprisePriorities,
    queuedTasks,
    reorderQueuedTasks,
    registerWeeklyActionItem,
    removeWeeklyActionItem,
    saveDepartmentWorkplan,
    saveEnterprisePriority,
    saveStrategicPillar,
    setEnterprisePriorities,
    setWeeklyPriorityEntriesForWeek,
    strategicPlan: state.strategicPlan,
    stucks: state.stucks,
    updateHuddle,
    updateQueuedTask,
    updateStuck,
    updateWeeklyActionItem,
    weeklyActionItems: state.weeklyActionItems,
    weeklyPriorityEntriesByWeek: state.weeklyPriorityEntriesByWeek,
  }), [
    addHuddle,
    addHuddleItem,
    addQueuedTask,
    addStuck,
    deleteDepartmentWorkplan,
    deleteStrategicPillar,
    getTasksForUser,
    queuedTasks,
    reorderQueuedTasks,
    registerWeeklyActionItem,
    removeWeeklyActionItem,
    saveDepartmentWorkplan,
    saveEnterprisePriority,
    saveStrategicPillar,
    setEnterprisePriorities,
    setWeeklyPriorityEntriesForWeek,
    state.departmentWorkplans,
    state.huddles,
    state.enterprisePriorities,
    state.stucks,
    state.strategicPlan,
    state.weeklyActionItems,
    state.weeklyPriorityEntriesByWeek,
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
