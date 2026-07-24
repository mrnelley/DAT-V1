const signalLabels = {
  alert: 'Alert',
  complete: 'Completed',
  no_data: 'No Data',
  steady: 'Steady',
  watch: 'Watch',
};

const signalValues = {
  Alert: 'alert',
  Complete: 'complete',
  Completed: 'complete',
  'No Data': 'no_data',
  Rescheduled: 'watch',
  Steady: 'steady',
  Watch: 'watch',
};

export const fromSignal = (value) => signalLabels[value] || value || 'No Data';
export const toSignal = (value) => signalValues[value] || value?.toLowerCase?.() || 'no_data';

export const profileFromRow = (row, departmentsById = new Map(), organizationsById = new Map()) => {
  if (!row) return null;
  const fullName = row.display_name
    || row.full_name
    || [row.first_name, row.last_name].filter(Boolean).join(' ')
    || row.username
    || 'Compass user';
  const workingGroup = row.working_group || 'Team Member';

  return {
    avatarUrl: row.avatar_url || '',
    dashboardFocus: row.dashboard_focus || 'operations',
    department: departmentsById.get(row.department_id)?.name || 'Unassigned',
    departmentId: row.department_id,
    email: row.email || '',
    firstName: row.first_name || fullName.split(/\s+/)[0] || '',
    id: row.id,
    initials: row.initials || fullName.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase(),
    isActive: row.is_active,
    isAdmin: row.is_admin,
    lastName: row.last_name || '',
    mustResetPassword: row.must_reset_password,
    name: fullName,
    organization: organizationsById.get(row.organization_id)?.name || 'HDC MidAtlantic',
    organizationId: row.organization_id,
    primaryDashboard: row.primary_dashboard || (workingGroup === 'ELT' ? 'company' : 'individual'),
    role: row.role_title || 'Team Member',
    teams: row.teams || [],
    username: row.username || '',
    workingGroup,
  };
};

export const reportingPeriodFromRow = (row, date = new Date()) => {
  const today = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
  const quarterNumber = Number(String(row.quarter).replace(/\D/g, ''));

  return {
    code: row.code,
    databaseId: row.id,
    end: row.ends_on,
    id: row.code,
    label: row.label,
    phase: row.ends_on < today ? 'closed' : row.starts_on > today ? 'planning' : 'current',
    quarterNumber,
    start: row.starts_on,
    status: row.status,
    theme: row.theme,
    year: row.year,
  };
};

export const mapLoadedRecords = (records) => {
  const organizationsById = new Map(records.organizations.map((row) => [row.id, row]));
  const departmentsById = new Map(records.departments.map((row) => [row.id, row]));
  const users = records.profiles.map((row) => profileFromRow(row, departmentsById, organizationsById));
  const usersById = new Map(users.map((user) => [user.id, user]));
  const periodsById = new Map(records.reportingPeriods.map((row) => [row.id, row]));
  const pillarsById = new Map(records.strategicPillars.map((row) => [row.id, row]));
  const objectiveKpisByObjective = records.objectiveKpis.reduce((groups, row) => {
    const current = groups.get(row.key_objective_id) || [];
    current.push({
      children: row.children || [],
      currentLabel: row.current_label || '',
      currentValue: row.current_value,
      due: row.due_on || '',
      id: row.id,
      progress: Number(row.progress || 0),
      source: row.source || '',
      status: fromSignal(row.status),
      target: row.target_label || row.target_value || '',
      targetValue: row.target_value,
      title: row.title,
    });
    groups.set(row.key_objective_id, current);
    return groups;
  }, new Map());
  const objectivesByPriority = new Map();
  const objectivesByWorkplan = new Map();

  records.keyObjectives.forEach((row) => {
    const owner = usersById.get(row.owner_id);
    const department = departmentsById.get(row.department_id);
    const mapped = {
      department: department?.name || owner?.department || 'Unassigned',
      description: row.description || '',
      due: row.due_on || '',
      enterprisePriorityId: row.priority_id || null,
      id: row.id,
      kpi: row.metadata?.kpi || objectiveKpisByObjective.get(row.id)?.[0]?.title || '',
      kpis: objectiveKpisByObjective.get(row.id) || [],
      lastUpdated: row.metadata?.lastUpdated || '',
      notes: row.metadata?.notes || '',
      orgPriority: row.metadata?.orgPriority || '',
      owner,
      ownerId: row.owner_id,
      ownerIds: [row.owner_id].filter(Boolean),
      progress: Number(row.progress || 0),
      projectPlanComplete: row.metadata?.projectPlanComplete || '',
      projectPlanUrl: row.metadata?.projectPlanUrl || '',
      startDate: row.metadata?.startDate || '',
      status: fromSignal(row.status),
      strategicPillarId: row.strategic_pillar_id,
      title: row.title,
      workplanAccess: department?.name || '',
      workplanSummary: row.description || '',
      workplanTitle: '',
      yearEndTarget: row.metadata?.yearEndTarget || objectiveKpisByObjective.get(row.id)?.[0]?.target || '',
    };

    if (row.priority_id) {
      objectivesByPriority.set(row.priority_id, [...(objectivesByPriority.get(row.priority_id) || []), mapped]);
    }
    if (row.workplan_id) {
      objectivesByWorkplan.set(row.workplan_id, [...(objectivesByWorkplan.get(row.workplan_id) || []), mapped]);
    }
  });

  const strategicPlanRow = records.strategicPlans.find((row) => row.status === 'active')
    || records.strategicPlans[0];
  const strategicPlan = strategicPlanRow
    ? {
      description: '',
      id: strategicPlanRow.id,
      name: strategicPlanRow.title,
      owner: organizationsById.get(strategicPlanRow.organization_id)?.name || '',
      pillars: records.strategicPillars
        .filter((row) => row.strategic_plan_id === strategicPlanRow.id)
        .sort((a, b) => a.display_order - b.display_order)
        .map((row) => ({
          id: row.id,
          name: row.title,
          order: row.display_order,
        })),
      timeframe: [strategicPlanRow.starts_on?.slice(0, 4), strategicPlanRow.ends_on?.slice(0, 4)]
        .filter(Boolean)
        .join('-'),
    }
    : {
      description: '',
      id: null,
      name: 'No strategic plan configured',
      owner: '',
      pillars: [],
      timeframe: '',
    };

  const enterprisePriorities = records.priorities
    .filter((row) => row.is_company_priority)
    .map((row) => {
      const period = periodsById.get(row.reporting_period_id);
      const pillar = pillarsById.get(row.strategic_pillar_id);
      const keyObjectives = objectivesByPriority.get(row.id) || [];
      return {
        children: [],
        company: true,
        description: row.description || '',
        id: row.id,
        keyObjectives,
        metadata: row.metadata || {},
        name: row.title,
        reportingPeriodId: period?.code || null,
        reportingPeriodRecordId: row.reporting_period_id,
        roadmapStatus: fromSignal(row.status),
        status: fromSignal(row.status),
        strategicPillar: pillar?.title || '',
        strategicPillarId: row.strategic_pillar_id,
        strategicPlan: strategicPlan.name,
        type: row.priority_type || 'ROLLUP',
      };
    });

  const departmentWorkplans = records.workplans.map((row) => {
    const department = departmentsById.get(row.department_id);
    const lead = usersById.get(row.lead_id);
    const objectives = objectivesByWorkplan.get(row.id) || [];
    const year = row.starts_on?.slice(0, 4) || row.metadata?.year || '';
    return {
      department: department?.name || 'Unassigned',
      departmentId: row.department_id,
      due: row.due_on || row.metadata?.due || '',
      id: row.id,
      initiativeId: row.metadata?.initiativeId || null,
      lead,
      objectives,
      outcome: row.metadata?.outcome || '',
      ownerIds: [row.lead_id, ...objectives.map((item) => item.ownerId)].filter(Boolean),
      progress: Number(row.progress || 0),
      scope: row.metadata?.scope || '',
      status: fromSignal(row.status),
      strategicPillar: row.metadata?.strategicPillar || '',
      strategicPillarId: row.metadata?.strategicPillarId || null,
      title: row.title,
      year,
    };
  });

  const queuedTasks = records.actionItems.map((row) => ({
    createdAt: row.created_at,
    createdBy: usersById.get(row.created_by),
    department: departmentsById.get(row.department_id)?.name || '',
    description: row.description || '',
    due: row.due_on || '',
    huddleId: row.huddle_id,
    id: row.id,
    owner: usersById.get(row.owner_id),
    pinned: row.pinned,
    priority: row.metadata?.priority || '',
    priorityId: row.priority_id,
    propertyId: row.metadata?.propertyId || null,
    queueOrder: row.queue_order,
    source: row.metadata?.source || 'one_off',
    sourceType: 'queued_task',
    status: row.status,
    title: row.title,
    visibility: row.visibility,
    workplanId: row.workplan_id,
  }));

  const tasksByEntry = records.weeklyActionTasks.reduce((groups, row) => {
    const current = groups.get(row.entry_id) || [];
    current.push({
      completedAt: row.completed_at,
      due: row.due_on || '',
      id: row.id,
      owner: usersById.get(row.owner_id),
      status: row.status,
      title: row.title,
    });
    groups.set(row.entry_id, current);
    return groups;
  }, new Map());
  const reportsById = new Map(records.weeklyActionReports.map((row) => [row.id, row]));
  const weeklyPriorityEntriesByWeek = {};
  records.weeklyActionEntries.forEach((row) => {
    const report = reportsById.get(row.report_id);
    if (!report) return;
    const mapped = {
      alignedPriorityLabel: row.aligned_priority_label || '',
      alignmentType: row.alignment_type,
      department: departmentsById.get(row.department_id)?.name || '',
      due: row.due_on || report.week_end,
      id: row.id,
      objectiveId: row.key_objective_id,
      owner: usersById.get(row.owner_id),
      priorityId: row.priority_id,
      rank: row.rank,
      reportId: row.report_id,
      riskSupportNote: row.risk_support_note || '',
      status: fromSignal(row.status),
      strategicPillarId: row.strategic_pillar_id,
      stuckId: row.stuck_id,
      tasks: tasksByEntry.get(row.id) || [],
      title: row.title,
      workplanId: row.workplan_id,
    };
    weeklyPriorityEntriesByWeek[report.id] = [...(weeklyPriorityEntriesByWeek[report.id] || []), mapped];
  });

  const weeklyReports = records.weeklyActionReports
    .map((row) => ({
      id: row.id,
      label: new Date(`${row.week_start}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      reportingPeriodId: periodsById.get(row.reporting_period_id)?.code || null,
      reportingPeriodRecordId: row.reporting_period_id,
      reviewMeetingAt: row.review_meeting_at,
      status: row.status,
      submissionDueAt: row.submission_due_at,
      weekEnd: row.week_end,
      weekStart: row.week_start,
    }))
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart));

  const stucks = records.stucks.map((row) => ({
    description: row.description,
    helpFrom: usersById.get(row.help_from_id),
    id: row.id,
    personStuck: usersById.get(row.person_stuck_id),
    personStuckId: row.person_stuck_id,
    pinned: row.pinned,
    resolvedAt: row.resolved_at,
    since: row.stuck_since,
    sourceId: row.source_id,
    sourceLabel: queuedTasks.find((task) => task.id === row.source_id)?.title || '',
    sourceType: row.source_type,
    status: row.status,
  }));

  const huddleMembersById = records.huddleMembers.reduce((groups, row) => {
    groups.set(row.huddle_id, [...(groups.get(row.huddle_id) || []), row.profile_id]);
    return groups;
  }, new Map());
  const huddles = records.huddles.map((row) => ({
    agenda: row.agenda || [],
    date: row.starts_at?.slice(0, 10) || '',
    description: row.description || '',
    id: row.id,
    items: queuedTasks.filter((task) => task.huddleId === row.id),
    memberIds: huddleMembersById.get(row.id) || [],
    name: row.name,
    ownerId: row.owner_id,
    recurrence: row.recurrence || '',
    startsAt: row.starts_at,
    ...row.metadata,
  }));

  const latestSnapshotByProperty = new Map();
  records.propertySnapshots
    .sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)))
    .forEach((row) => latestSnapshotByProperty.set(row.property_id, row));
  const properties = records.properties.map((row) => {
    const snapshot = latestSnapshotByProperty.get(row.id);
    const assignments = (records.propertyAssignments || [])
      .filter((assignment) => assignment.property_id === row.id)
      .map((assignment) => ({
        profile: usersById.get(assignment.profile_id),
        role: assignment.assignment_role,
      }));
    return {
      address: row.address || '',
      assignments,
      city: row.city || '',
      coordinates: row.latitude && row.longitude
        ? { lat: Number(row.latitude), lng: Number(row.longitude), quality: row.coordinate_quality }
        : null,
      county: row.county || '',
      estimatedUnits: row.estimated_units,
      housingType: row.housing_type || '',
      hasOperatingSnapshot: Boolean(snapshot),
      id: row.id,
      isActivePortfolio: row.is_active_portfolio,
      managementType: row.management_type || '',
      operations: {
        agedWorkOrders: snapshot?.aged_work_orders ?? 0,
        complianceRisk: snapshot?.compliance_risk || 'No Data',
        leasingExposure: snapshot?.leasing_exposure ?? 0,
        occupancy: Number(snapshot?.occupancy || 0),
        openWorkOrders: snapshot?.open_work_orders ?? 0,
        residentServiceOpen: snapshot?.resident_service_open ?? 0,
      },
      propertyName: row.name,
      residentFocus: row.resident_focus || [],
      state: row.state || '',
      status: row.status || 'No Data',
      zipCode: row.zip_code || '',
      ...row.metadata,
    };
  });

  const initiatives = records.initiatives.map((row) => ({
    current: Number(row.current_value || 0),
    description: row.description || '',
    due: row.due_on || '',
    id: row.id,
    narrative: row.description || '',
    owner: usersById.get(row.owner_id),
    progress: Number(row.progress || 0),
    reportingPeriodId: periodsById.get(row.reporting_period_id)?.code || null,
    reportingPeriodRecordId: row.reporting_period_id,
    status: fromSignal(row.status),
    strategicPillar: pillarsById.get(row.strategic_pillar_id)?.title || '',
    strategicPillarId: row.strategic_pillar_id,
    target: Number(row.target_value || 0),
    title: row.title,
    ...row.metadata,
  }));

  const touchpoints = records.touchpoints.map((row) => ({
    calendarEventId: row.calendar_event_id,
    contactId: row.contact_id,
    createdAt: row.created_at,
    createdBy: usersById.get(row.owner_id),
    date: row.occurred_on,
    id: row.id,
    nextStep: row.next_step || '',
    note: row.note || '',
    status: row.status,
    targetCompletionDate: row.target_completion_date || '',
    type: row.touchpoint_type,
    updatedAt: row.updated_at,
    updatedBy: usersById.get(row.owner_id),
    ...row.metadata,
  }));
  const touchpointsByContact = touchpoints.reduce((groups, row) => {
    groups.set(row.contactId, [...(groups.get(row.contactId) || []), row]);
    return groups;
  }, new Map());
  const contacts = records.contacts.map((row) => {
    const contactTouchpoints = touchpointsByContact.get(row.id) || [];
    const latest = [...contactTouchpoints].sort((a, b) => b.date.localeCompare(a.date))[0];
    return {
      circle: row.circle || 'Unassigned',
      contextHistory: row.context_history || '',
      email: row.email || '',
      id: row.id,
      influence: row.influence || '',
      lastTouchpoint: latest?.date || '',
      lead: usersById.get(row.owner_id),
      name: row.name,
      nextStep: row.next_step || '',
      organizationName: row.organization_name || '',
      phone: row.phone || '',
      profileGoals: row.profile_goals || [],
      profileSummary: row.profile_summary || '',
      profileUrl: row.profile_url || '',
      relationship: row.relationship || '',
      stage: row.stage || '',
      support: [],
      targetCompletionDate: row.target_completion_date || '',
      ...row.metadata,
    };
  });

  const metrics = records.metrics.map((row) => ({
    current: row.current_value,
    id: row.id,
    lastUpdated: row.last_updated_at,
    owner: usersById.get(row.owner_id),
    priorityId: row.priority_id,
    source: row.source,
    start: row.start_value,
    subtitle: row.subtitle || '',
    target: row.target_value,
    title: row.title,
    ...row.metadata,
  }));

  return {
    contacts,
    departmentRecords: records.departments.map((row) => ({
      ...row,
      lead: usersById.get(row.lead_id),
    })),
    departments: records.departments.map((row) => row.name),
    departmentWorkplans,
    enterprisePriorities,
    huddles,
    initiatives,
    metrics,
    organizationId: records.organizations[0]?.id || null,
    properties,
    queuedTasks,
    strategicPlan,
    stucks,
    touchpoints,
    users,
    weeklyActionItems: records.weeklyActionTasks.map((row) => ({
      due: row.due_on || '',
      id: row.id,
      owner: usersById.get(row.owner_id),
      status: row.status,
      title: row.title,
    })),
    weeklyPriorityEntriesByWeek,
    weeklyReports,
  };
};
