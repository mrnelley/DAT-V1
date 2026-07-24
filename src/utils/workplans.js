export const workplanStatuses = ['Steady', 'Watch', 'Alert', 'Completed', 'Rescheduled'];

const statusRank = {
  Alert: 0,
  Watch: 1,
  Steady: 2,
  Rescheduled: 3,
  Completed: 4,
};

export const clampProgress = (value) => Math.min(100, Math.max(0, Number(value) || 0));

export const getDepartmentLead = (
  department,
  fallbackUser,
  users = [],
  departmentRecords = [],
) => (
  departmentRecords.find((record) => record.name === department)?.lead
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

const normalizeObjective = (objective, workplan, index, enterprisePriorities, options) => {
  const { departmentRecords = [], strategicPillars = [], users = [] } = options;
  const priorityIdsFromNames = (workplan.priorityLinks || [])
    .map((name) => enterprisePriorities.find((priority) => priority.name === name)?.id)
    .filter(Boolean);
  const strategicPillarId = objective.strategicPillarId
    || workplan.strategicPillarId
    || strategicPillars[0]?.id
    || null;
  const owner = objective.owner
    || users.find((user) => user.id === objective.ownerId)
    || workplan.lead
    || getDepartmentLead(workplan.department, users[0], users, departmentRecords);

  return {
    description: objective.description || objective.outcome || '',
    due: objective.due || workplan.due || '',
    enterprisePriorityId: objective.enterprisePriorityId || objective.enterprisePriorityIds?.[0] || priorityIdsFromNames[0] || null,
    id: objective.id || `${workplan.id || 'workplan'}-objective-${index + 1}`,
    kpi: objective.kpi || objective.keyPerformanceIndicator || '',
    lastUpdated: objective.lastUpdated || objective.lastUpdateDate || '',
    orgPriority: objective.orgPriority || workplan.orgPriority || '',
    owner,
    ownerId: owner.id,
    progress: clampProgress(objective.progress ?? workplan.progress),
    projectPlanComplete: objective.projectPlanComplete || '',
    projectPlanUrl: objective.projectPlanUrl || objective.projectPlan || '',
    startDate: objective.startDate || objective.start || '',
    status: objective.status || workplan.status || 'Steady',
    strategicPillarId,
    title: objective.title || workplan.title || 'Department objective',
    yearEndTarget: objective.yearEndTarget || objective.target || objective.kpiYearEndTarget || '',
  };
};

export const normalizeWorkplan = (workplan, enterprisePriorities = [], options = {}) => {
  const { departmentRecords = [], users = [] } = options;
  const year = String(workplan.year || new Date().getFullYear());
  const department = workplan.department || workplan.scope || 'Department';
  const lead = workplan.lead || getDepartmentLead(department, users[0], users, departmentRecords);
  const sourceObjectives = workplan.objectives?.length ? workplan.objectives : [workplan];

  return {
    department,
    id: workplan.id,
    lead,
    ownerIds: Array.from(new Set([lead.id, ...(workplan.ownerIds || [])])),
    title: `${year} ${department.toUpperCase()} WORKPLAN`,
    year,
    objectives: sourceObjectives.map((objective, index) => normalizeObjective(
      objective,
      workplan,
      index,
      enterprisePriorities,
      options,
    )),
  };
};

export const decorateWorkplan = (workplan, enterprisePriorities = [], options = {}) => {
  const normalized = normalizeWorkplan(workplan, enterprisePriorities, options);
  const pillarIds = getWorkplanPillarIds(normalized);
  return {
    ...normalized,
    due: getWorkplanDue(normalized),
    enterprisePriorityIds: getWorkplanEnterprisePriorityIds(normalized),
    progress: getWorkplanProgress(normalized),
    status: getWorkplanStatus(normalized),
    strategicPillars: pillarIds
      .map((id) => options.strategicPillars?.find((pillar) => pillar.id === id)?.name)
      .filter(Boolean),
  };
};
