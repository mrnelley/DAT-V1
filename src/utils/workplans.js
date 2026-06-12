import { strategicPillarById, strategicPlan2030, users } from '../data/mockData';

export const workplanStatuses = ['Steady', 'Watch', 'Alert', 'Completed', 'Rescheduled'];

const departmentLeadIds = {
  'Community Relations': 'u6',
  Compliance: 'u15',
  'Executive Office': 'u1',
  Finance: 'u2',
  'Human Resources': 'u5',
  'Impact and Advancement': 'u6',
  Operations: 'u8',
  'Property Management': 'u4',
  'Real Estate Development': 'u3',
  'Resident Services': 'u17',
};

const statusRank = {
  Alert: 0,
  Watch: 1,
  Steady: 2,
  Rescheduled: 3,
  Completed: 4,
};

export const clampProgress = (value) => Math.min(100, Math.max(0, Number(value) || 0));

export const getDepartmentLead = (department, fallbackUser = users[0]) => (
  users.find((user) => user.id === departmentLeadIds[department])
  || users.find((user) => user.department === department && ['ELT', 'OLT'].includes(user.workingGroup))
  || users.find((user) => user.department === department)
  || fallbackUser
);

export const getWorkplanObjectives = (workplan) => workplan.objectives || [];

export const getWorkplanStatus = (workplan) => (
  [...getWorkplanObjectives(workplan)]
    .sort((a, b) => (statusRank[a.status] ?? 2) - (statusRank[b.status] ?? 2))[0]?.status
  || 'Steady'
);

export const getWorkplanProgress = (workplan) => {
  const objectives = getWorkplanObjectives(workplan);
  if (!objectives.length) return 0;
  return Math.round(objectives.reduce((total, objective) => total + clampProgress(objective.progress), 0) / objectives.length);
};

export const getWorkplanDue = (workplan) => {
  const dates = getWorkplanObjectives(workplan).map((objective) => objective.due).filter(Boolean).sort();
  return dates.at(-1) || '';
};

export const getWorkplanEnterprisePriorityIds = (workplan) => Array.from(new Set(
  getWorkplanObjectives(workplan).map((objective) => objective.enterprisePriorityId).filter(Boolean),
));

export const getWorkplanPillarIds = (workplan) => Array.from(new Set(
  getWorkplanObjectives(workplan).map((objective) => objective.strategicPillarId).filter(Boolean),
));

export const findWorkplanObjective = (workplans, objectiveId) => {
  for (const workplan of workplans) {
    const objective = getWorkplanObjectives(workplan).find((candidate) => candidate.id === objectiveId);
    if (objective) return { objective, workplan };
  }
  return null;
};

const normalizeObjective = (objective, workplan, index, enterprisePriorities) => {
  const priorityIdsFromNames = (workplan.priorityLinks || [])
    .map((name) => enterprisePriorities.find((priority) => priority.name === name)?.id)
    .filter(Boolean);
  const strategicPillarId = objective.strategicPillarId
    || workplan.strategicPillarId
    || strategicPlan2030.pillars[0].id;
  const owner = objective.owner
    || users.find((user) => user.id === objective.ownerId)
    || workplan.lead
    || getDepartmentLead(workplan.department);

  return {
    description: objective.description || objective.outcome || '',
    due: objective.due || workplan.due || '',
    enterprisePriorityId: objective.enterprisePriorityId || objective.enterprisePriorityIds?.[0] || priorityIdsFromNames[0] || null,
    id: objective.id || `${workplan.id || 'workplan'}-objective-${index + 1}`,
    owner,
    ownerId: owner.id,
    progress: clampProgress(objective.progress ?? workplan.progress),
    status: objective.status || workplan.status || 'Steady',
    strategicPillarId,
    title: objective.title || workplan.title || 'Department objective',
  };
};

export const normalizeWorkplan = (workplan, enterprisePriorities = []) => {
  const year = String(workplan.year || new Date().getFullYear());
  const department = workplan.department || workplan.scope || 'Department';
  const lead = workplan.lead || getDepartmentLead(department);
  const sourceObjectives = workplan.objectives?.length ? workplan.objectives : [workplan];

  return {
    department,
    id: workplan.id,
    lead,
    ownerIds: Array.from(new Set([lead.id, ...(workplan.ownerIds || [])])),
    title: `${year} ${department.toUpperCase()} WORKPLAN`,
    year,
    objectives: sourceObjectives.map((objective, index) => normalizeObjective(objective, workplan, index, enterprisePriorities)),
  };
};

export const decorateWorkplan = (workplan, enterprisePriorities = []) => {
  const normalized = normalizeWorkplan(workplan, enterprisePriorities);
  const pillarIds = getWorkplanPillarIds(normalized);
  return {
    ...normalized,
    due: getWorkplanDue(normalized),
    enterprisePriorityIds: getWorkplanEnterprisePriorityIds(normalized),
    progress: getWorkplanProgress(normalized),
    status: getWorkplanStatus(normalized),
    strategicPillars: pillarIds.map((id) => strategicPillarById[id]?.name).filter(Boolean),
  };
};
