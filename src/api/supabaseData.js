import { requireSupabase } from '../lib/supabase';
import { mapLoadedRecords, toSignal } from '../data/recordAdapters';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isUuid = (value) => uuidPattern.test(String(value || ''));

const unwrap = async (request) => {
  const { data, error } = await request;
  if (error) throw error;
  return data;
};

const insertable = (record) => {
  if (isUuid(record.id)) return record;
  const withoutId = { ...record };
  delete withoutId.id;
  return withoutId;
};

export const loadOperatingData = async () => {
  const client = requireSupabase();
  const [
    organizations,
    departments,
    profiles,
    reportingPeriods,
    strategicPlans,
    strategicPillars,
    initiatives,
    workplans,
    priorities,
    keyObjectives,
    objectiveKpis,
    metrics,
    metricValues,
    huddles,
    huddleMembers,
    actionItems,
    weeklyActionReports,
    weeklyActionEntries,
    weeklyActionTasks,
    stucks,
    properties,
    propertyAssignments,
    propertySnapshots,
    contacts,
    touchpoints,
  ] = await Promise.all([
    unwrap(client.from('organizations').select('*').order('name')),
    unwrap(client.from('departments').select('*').order('name')),
    unwrap(client.from('profiles').select('*').eq('is_active', true).order('full_name')),
    unwrap(client.from('reporting_periods').select('*').gte('starts_on', '2026-04-01').order('starts_on')),
    unwrap(client.from('strategic_plans').select('*').order('starts_on', { ascending: false })),
    unwrap(client.from('strategic_pillars').select('*').order('display_order')),
    unwrap(client.from('initiatives').select('*').order('created_at', { ascending: false })),
    unwrap(client.from('workplans').select('*').order('created_at', { ascending: false })),
    unwrap(client.from('priorities').select('*').order('created_at', { ascending: false })),
    unwrap(client.from('key_objectives').select('*').order('created_at')),
    unwrap(client.from('objective_kpis').select('*').order('created_at')),
    unwrap(client.from('metrics').select('*').order('title')),
    unwrap(client.from('metric_values').select('*').order('recorded_for')),
    unwrap(client.from('huddles').select('*').order('name')),
    unwrap(client.from('huddle_members').select('*')),
    unwrap(client.from('action_items').select('*').order('queue_order')),
    unwrap(client.from('weekly_action_reports').select('*').order('week_start')),
    unwrap(client.from('weekly_action_entries').select('*').order('rank')),
    unwrap(client.from('weekly_action_tasks').select('*').order('created_at')),
    unwrap(client.from('stucks').select('*').order('stuck_since', { ascending: false })),
    unwrap(client.from('properties').select('*').order('name')),
    unwrap(client.from('property_assignments').select('*')),
    unwrap(client.from('property_operating_snapshots').select('*').order('created_at')),
    unwrap(client.from('contacts').select('*').order('name')),
    unwrap(client.from('touchpoints').select('*').order('occurred_on', { ascending: false })),
  ]);

  return mapLoadedRecords({
    actionItems,
    contacts,
    departments,
    huddleMembers,
    huddles,
    initiatives,
    keyObjectives,
    metricValues,
    metrics,
    objectiveKpis,
    organizations,
    priorities,
    profiles,
    properties,
    propertyAssignments,
    propertySnapshots,
    reportingPeriods,
    strategicPillars,
    strategicPlans,
    stucks,
    touchpoints,
    weeklyActionEntries,
    weeklyActionReports,
    weeklyActionTasks,
    workplans,
  });
};

export const updateProfileRecord = async (userId, values) => {
  const firstName = values.firstName.trim();
  const lastName = values.lastName?.trim() || null;
  const fullName = [firstName, lastName].filter(Boolean).join(' ');
  const payload = {
    avatar_url: values.avatarUrl,
    display_name: fullName,
    email: values.email?.trim().toLowerCase() || null,
    first_name: firstName,
    full_name: fullName,
    initials: values.initials,
    last_name: lastName,
    teams: values.teams || [],
  };

  return unwrap(
    requireSupabase()
      .from('profiles')
      .update(payload)
      .eq('id', userId)
      .select()
      .single(),
  );
};

export const saveStrategicPillarRecord = async (strategicPlanId, pillar) => {
  const row = insertable({
    display_order: pillar.order ?? 0,
    id: pillar.id,
    strategic_plan_id: strategicPlanId,
    title: pillar.name,
  });

  return unwrap(requireSupabase().from('strategic_pillars').upsert(row).select().single());
};

export const deleteStrategicPillarRecord = (pillarId) => (
  unwrap(requireSupabase().from('strategic_pillars').delete().eq('id', pillarId))
);

const saveObjectiveKpis = async (organizationId, objectiveId, kpis) => {
  const client = requireSupabase();
  const existing = await unwrap(client.from('objective_kpis').select('id').eq('key_objective_id', objectiveId));
  const savedIds = [];

  for (const kpi of kpis) {
    const row = insertable({
      children: kpi.children || [],
      current_label: kpi.currentLabel || null,
      current_value: kpi.currentValue ?? null,
      due_on: kpi.due || null,
      id: kpi.id,
      key_objective_id: objectiveId,
      organization_id: organizationId,
      progress: Number(kpi.progress || 0),
      source: kpi.source || null,
      status: toSignal(kpi.status),
      target_label: String(kpi.target ?? ''),
      target_value: kpi.targetValue ?? null,
      title: kpi.title || 'Success measure',
    });
    const saved = await unwrap(client.from('objective_kpis').upsert(row).select().single());
    savedIds.push(saved.id);
  }

  const removedIds = existing.map((row) => row.id).filter((id) => !savedIds.includes(id));
  if (removedIds.length) {
    await unwrap(client.from('objective_kpis').delete().in('id', removedIds));
  }
};

export const saveEnterprisePriorityRecord = async ({
  organizationId,
  priority,
  reportingPeriodRecordId,
  strategicPlanId,
}) => {
  const client = requireSupabase();
  const priorityRow = insertable({
    description: priority.description || null,
    id: priority.id,
    is_company_priority: true,
    metadata: priority.metadata || {},
    organization_id: organizationId,
    priority_type: priority.type || 'ROLLUP',
    progress: Number(priority.progress || 0),
    reporting_period_id: reportingPeriodRecordId,
    status: toSignal(priority.roadmapStatus || priority.status),
    strategic_pillar_id: priority.strategicPillarId || null,
    strategic_plan_id: strategicPlanId || null,
    title: priority.name,
  });
  const savedPriority = await unwrap(client.from('priorities').upsert(priorityRow).select().single());
  const existingObjectives = await unwrap(
    client.from('key_objectives').select('id').eq('priority_id', savedPriority.id),
  );
  const savedObjectiveIds = [];

  for (const objective of priority.keyObjectives || []) {
    const objectiveRow = insertable({
      department_id: objective.owner?.departmentId || objective.departmentId || null,
      description: objective.description || objective.workplanSummary || null,
      due_on: objective.due || null,
      id: objective.id,
      metadata: {
        notes: objective.notes || '',
        orgPriority: objective.orgPriority || '',
        startDate: objective.startDate || '',
      },
      organization_id: organizationId,
      owner_id: objective.owner?.id || objective.ownerId || null,
      priority_id: savedPriority.id,
      progress: Number(objective.progress || 0),
      status: toSignal(objective.status),
      strategic_pillar_id: priority.strategicPillarId || objective.strategicPillarId || null,
      strategic_plan_id: strategicPlanId || null,
      title: objective.title,
      workplan_id: objective.workplanId || null,
    });
    const savedObjective = await unwrap(client.from('key_objectives').upsert(objectiveRow).select().single());
    savedObjectiveIds.push(savedObjective.id);
    await saveObjectiveKpis(
      organizationId,
      savedObjective.id,
      objective.kpis?.length
        ? objective.kpis
        : objective.kpi
          ? [{
            currentLabel: '',
            progress: objective.progress || 0,
            status: objective.status,
            target: objective.yearEndTarget || '',
            title: objective.kpi,
          }]
          : [],
    );
  }

  const removedObjectiveIds = existingObjectives
    .map((row) => row.id)
    .filter((id) => !savedObjectiveIds.includes(id));
  if (removedObjectiveIds.length) {
    await unwrap(client.from('key_objectives').delete().in('id', removedObjectiveIds));
  }

  return savedPriority;
};

export const deleteEnterprisePriorityRecord = (priorityId) => (
  unwrap(requireSupabase().from('priorities').delete().eq('id', priorityId))
);

export const saveWorkplanRecord = async ({
  departmentId,
  organizationId,
  strategicPlanId,
  workplan,
}) => {
  const client = requireSupabase();
  const workplanRow = insertable({
    department_id: departmentId,
    due_on: workplan.objectives?.map((item) => item.due).filter(Boolean).sort().at(-1) || workplan.due || null,
    id: workplan.id,
    lead_id: workplan.lead?.id || workplan.leadId || null,
    metadata: {
      due: workplan.due || null,
      initiativeId: workplan.initiativeId || null,
      outcome: workplan.outcome || '',
      scope: workplan.scope || '',
      strategicPillar: workplan.strategicPillar || '',
      strategicPillarId: workplan.strategicPillarId || null,
      year: workplan.year,
    },
    organization_id: organizationId,
    planning_year: Number(workplan.year) || null,
    progress: Number(workplan.progress || 0),
    starts_on: workplan.objectives?.map((item) => item.startDate).filter(Boolean).sort()[0] || null,
    status: toSignal(workplan.status),
    strategic_plan_id: strategicPlanId || null,
    title: workplan.title,
  });
  const savedWorkplan = await unwrap(client.from('workplans').upsert(workplanRow).select().single());
  const existingObjectives = await unwrap(
    client.from('key_objectives').select('id').eq('workplan_id', savedWorkplan.id),
  );
  const savedObjectiveIds = [];

  for (const objective of workplan.objectives || []) {
    const objectiveRow = insertable({
      department_id: departmentId,
      description: objective.description || null,
      due_on: objective.due || null,
      id: objective.id,
      metadata: {
        kpi: objective.kpi || '',
        lastUpdated: objective.lastUpdated || '',
        orgPriority: objective.orgPriority || '',
        projectPlanComplete: objective.projectPlanComplete || '',
        projectPlanUrl: objective.projectPlanUrl || '',
        startDate: objective.startDate || '',
        yearEndTarget: objective.yearEndTarget || '',
      },
      organization_id: organizationId,
      owner_id: objective.owner?.id || objective.ownerId || null,
      priority_id: objective.enterprisePriorityId || null,
      progress: Number(objective.progress || 0),
      status: toSignal(objective.status),
      strategic_pillar_id: objective.strategicPillarId || null,
      strategic_plan_id: strategicPlanId || null,
      title: objective.title,
      workplan_id: savedWorkplan.id,
    });
    const savedObjective = await unwrap(client.from('key_objectives').upsert(objectiveRow).select().single());
    savedObjectiveIds.push(savedObjective.id);
    await saveObjectiveKpis(
      organizationId,
      savedObjective.id,
      objective.kpi
        ? [{
          currentLabel: '',
          progress: objective.progress || 0,
          status: objective.status,
          target: objective.yearEndTarget || '',
          title: objective.kpi,
        }]
        : [],
    );
  }

  const removedObjectiveIds = existingObjectives
    .map((row) => row.id)
    .filter((id) => !savedObjectiveIds.includes(id));
  if (removedObjectiveIds.length) {
    await unwrap(client.from('key_objectives').delete().in('id', removedObjectiveIds));
  }

  return savedWorkplan;
};

export const deleteWorkplanRecord = (workplanId) => (
  unwrap(requireSupabase().from('workplans').delete().eq('id', workplanId))
);

export const saveActionItemRecord = ({ organizationId, task }) => {
  const row = insertable({
    created_by: task.createdBy?.id || null,
    department_id: task.owner?.departmentId || null,
    description: task.description || null,
    due_on: task.due || null,
    huddle_id: task.huddleId || null,
    id: task.id,
    metadata: {
      priority: task.priority || '',
      propertyId: task.propertyId || null,
      source: task.source || 'one_off',
    },
    organization_id: organizationId,
    owner_id: task.owner?.id || null,
    pinned: Boolean(task.pinned),
    priority_id: task.priorityId || null,
    queue_order: Number(task.queueOrder || 0),
    status: String(task.status || 'open').toLowerCase().replaceAll(' ', '_'),
    title: task.title,
    visibility: task.visibility || 'private',
    workplan_id: task.workplanId || null,
  });

  return unwrap(requireSupabase().from('action_items').upsert(row).select().single());
};

export const updateActionItemRecord = (taskId, changes) => {
  const payload = {};
  if ('title' in changes) payload.title = changes.title;
  if ('description' in changes) payload.description = changes.description;
  if ('due' in changes) payload.due_on = changes.due || null;
  if ('owner' in changes) payload.owner_id = changes.owner?.id || null;
  if ('pinned' in changes) payload.pinned = changes.pinned;
  if ('queueOrder' in changes) payload.queue_order = Number(changes.queueOrder || 0);
  if ('status' in changes) payload.status = String(changes.status).toLowerCase().replaceAll(' ', '_');
  if ('visibility' in changes) payload.visibility = changes.visibility;
  return unwrap(requireSupabase().from('action_items').update(payload).eq('id', taskId).select().single());
};

export const saveTaskOrder = async (orderedTaskIds) => {
  await Promise.all(orderedTaskIds.map((id, queueOrder) => updateActionItemRecord(id, { queueOrder })));
};

export const updatePropertyRecord = (propertyId, changes) => {
  const payload = {};
  if ('isActivePortfolio' in changes) payload.is_active_portfolio = changes.isActivePortfolio;
  if ('status' in changes) payload.status = changes.status;
  return unwrap(requireSupabase().from('properties').update(payload).eq('id', propertyId).select().single());
};

export const savePropertyAssignmentRecord = async ({ profileId, propertyId, role }) => {
  const client = requireSupabase();
  await unwrap(client.from('property_assignments').delete().eq('property_id', propertyId).eq('assignment_role', role));
  if (!profileId) return null;
  return unwrap(client.from('property_assignments').insert({
    assignment_role: role,
    profile_id: profileId,
    property_id: propertyId,
  }).select().single());
};

export const saveStuckRecord = ({ organizationId, stuck }) => {
  const row = insertable({
    description: stuck.description,
    help_from_id: stuck.helpFrom?.id || stuck.helpFromId || null,
    id: stuck.id,
    organization_id: organizationId,
    person_stuck_id: stuck.personStuck?.id || stuck.personStuckId || null,
    pinned: Boolean(stuck.pinned),
    source_id: stuck.sourceId || null,
    source_type: stuck.sourceType || null,
    status: stuck.status || 'active',
    stuck_since: stuck.since || new Date().toISOString(),
  });
  return unwrap(requireSupabase().from('stucks').upsert(row).select().single());
};

export const updateStuckRecord = (stuckId, changes) => {
  const payload = {};
  if ('description' in changes) payload.description = changes.description;
  if ('helpFrom' in changes) payload.help_from_id = changes.helpFrom?.id || null;
  if ('pinned' in changes) payload.pinned = changes.pinned;
  if ('status' in changes) {
    payload.status = changes.status;
    payload.resolved_at = changes.status === 'resolved' ? new Date().toISOString() : null;
  }
  return unwrap(requireSupabase().from('stucks').update(payload).eq('id', stuckId).select().single());
};

export const saveHuddleRecord = async ({ huddle, organizationId }) => {
  const client = requireSupabase();
  const row = insertable({
    agenda: huddle.agenda || [],
    description: huddle.description || null,
    id: huddle.id,
    metadata: {
      meetingLink: huddle.meetingLink || '',
      teamsCardDispatches: huddle.teamsCardDispatches || [],
      weeklyTrackerPromptEnabled: Boolean(huddle.weeklyTrackerPromptEnabled),
      when: huddle.when || '',
    },
    name: huddle.name,
    organization_id: organizationId,
    owner_id: huddle.ownerId || null,
    recurrence: huddle.recurrence || null,
    starts_at: huddle.startsAt || (huddle.date ? `${huddle.date}T12:00:00` : null),
  });
  const saved = await unwrap(client.from('huddles').upsert(row).select().single());
  await unwrap(client.from('huddle_members').delete().eq('huddle_id', saved.id));
  const memberIds = Array.from(new Set([huddle.ownerId, ...(huddle.memberIds || [])].filter(Boolean)));
  if (memberIds.length) {
    await unwrap(client.from('huddle_members').insert(memberIds.map((profileId) => ({
      huddle_id: saved.id,
      member_role: profileId === huddle.ownerId ? 'owner' : 'member',
      profile_id: profileId,
    }))));
  }
  return saved;
};

export const deleteHuddleRecord = (huddleId) => (
  unwrap(requireSupabase().from('huddles').delete().eq('id', huddleId))
);

export const replaceWeeklyEntries = async ({
  entries,
  organizationId,
  report,
  reportingPeriodRecordId,
  userId,
}) => {
  const client = requireSupabase();
  let reportId = isUuid(report.id) ? report.id : null;
  if (!reportId) {
    const savedReport = await unwrap(client.from('weekly_action_reports').upsert({
      created_by: userId,
      organization_id: organizationId,
      reporting_period_id: reportingPeriodRecordId,
      review_meeting_at: report.reviewMeetingAt,
      status: ['submitted', 'reviewed', 'locked'].includes(report.status) ? report.status : 'draft',
      submission_due_at: report.submissionDueAt,
      week_end: report.weekEnd,
      week_start: report.weekStart,
    }, { onConflict: 'organization_id,week_start' }).select().single());
    reportId = savedReport.id;
  }

  for (const [index, entry] of entries.entries()) {
    const existingEntry = await unwrap(
      client
        .from('weekly_action_entries')
        .select('id')
        .eq('report_id', reportId)
        .eq('owner_id', entry.owner?.id)
        .eq('rank', entry.rank || index + 1)
        .maybeSingle(),
    );
    const savedEntry = await unwrap(client.from('weekly_action_entries').upsert(insertable({
      aligned_priority_label: entry.alignedPriorityLabel || null,
      alignment_type: entry.alignmentType || (entry.priorityId ? 'enterprise' : 'department'),
      department_id: entry.owner?.departmentId || null,
      due_on: entry.due || report.weekEnd,
      id: existingEntry?.id || entry.id,
      key_objective_id: entry.objectiveId || null,
      organization_id: organizationId,
      owner_id: entry.owner?.id,
      priority_id: entry.priorityId || null,
      rank: entry.rank || index + 1,
      report_id: reportId,
      risk_support_note: entry.riskSupportNote || null,
      status: toSignal(entry.status),
      stuck_id: entry.stuckId || null,
      title: entry.title,
      workplan_id: entry.workplanId || null,
    }), { onConflict: 'id' }).select().single());

    const existingTasks = await unwrap(
      client.from('weekly_action_tasks').select('id').eq('entry_id', savedEntry.id),
    );
    const savedTaskIds = [];
    for (const task of entry.tasks || []) {
      const savedTask = await unwrap(client.from('weekly_action_tasks').upsert(insertable({
        created_by: userId,
        due_on: task.due || report.weekEnd,
        entry_id: savedEntry.id,
        id: task.id,
        organization_id: organizationId,
        owner_id: task.owner?.id || entry.owner?.id,
        status: task.status || 'open',
        title: task.title,
      }), { onConflict: 'id' }).select('id').single());
      savedTaskIds.push(savedTask.id);
    }
    const removedTaskIds = existingTasks
      .map((task) => task.id)
      .filter((id) => !savedTaskIds.includes(id));
    if (removedTaskIds.length) {
      await unwrap(client.from('weekly_action_tasks').delete().in('id', removedTaskIds));
    }
  }

  return reportId;
};

export const updateWeeklyTaskRecord = (taskId, changes) => {
  const payload = {};
  if ('title' in changes) payload.title = changes.title;
  if ('status' in changes) payload.status = changes.status;
  if ('due' in changes) payload.due_on = changes.due || null;
  return unwrap(requireSupabase().from('weekly_action_tasks').update(payload).eq('id', taskId).select().single());
};

export const deleteWeeklyTaskRecord = (taskId) => (
  unwrap(requireSupabase().from('weekly_action_tasks').delete().eq('id', taskId))
);

export const saveContactRecord = ({ contact, organizationId, ownerId }) => {
  const row = insertable({
    circle: contact.circle || null,
    context_history: contact.contextHistory || null,
    email: contact.email || null,
    id: contact.id,
    influence: contact.influence || null,
    metadata: contact.metadata || {},
    name: contact.name,
    next_step: contact.nextStep || null,
    organization_id: organizationId,
    organization_name: contact.organizationName || contact.name,
    owner_id: ownerId,
    phone: contact.phone || null,
    profile_goals: contact.profileGoals || [],
    profile_summary: contact.profileSummary || null,
    profile_url: contact.profileUrl || null,
    relationship: contact.relationship || null,
    stage: contact.stage || null,
    target_completion_date: contact.targetCompletionDate || null,
  });
  return unwrap(requireSupabase().from('contacts').upsert(row).select().single());
};

export const saveTouchpointRecord = ({ organizationId, ownerId, touchpoint }) => {
  const row = insertable({
    calendar_event_id: touchpoint.calendarEventId || null,
    contact_id: touchpoint.contactId || null,
    id: touchpoint.id,
    metadata: touchpoint.metadata || {},
    next_step: touchpoint.nextStep || null,
    note: touchpoint.note || '',
    occurred_on: touchpoint.date,
    organization_id: organizationId,
    owner_id: ownerId,
    status: touchpoint.status || 'active',
    target_completion_date: touchpoint.targetCompletionDate || null,
    touchpoint_type: touchpoint.type || 'Meeting',
  });
  return unwrap(requireSupabase().from('touchpoints').upsert(row).select().single());
};

export const deleteTouchpointRecord = (touchpointId) => (
  unwrap(
    requireSupabase()
      .from('touchpoints')
      .update({ status: 'deleted' })
      .eq('id', touchpointId)
      .select()
      .single(),
  )
);

export const saveInitiativeRecord = ({
  initiative,
  organizationId,
  ownerId,
  reportingPeriodRecordId,
  strategicPlanId,
}) => {
  const row = insertable({
    current_value: Number(initiative.current || 0),
    description: initiative.narrative || initiative.description || null,
    due_on: initiative.due || null,
    id: initiative.id,
    metadata: initiative.metadata || {},
    organization_id: organizationId,
    owner_id: ownerId,
    progress: Number(initiative.progress || 0),
    reporting_period_id: reportingPeriodRecordId,
    status: toSignal(initiative.status),
    strategic_pillar_id: initiative.strategicPillarId || null,
    strategic_plan_id: strategicPlanId || null,
    target_value: Number(initiative.target || 0),
    title: initiative.title,
  });
  return unwrap(requireSupabase().from('initiatives').upsert(row).select().single());
};

export const deleteInitiativeRecord = (initiativeId) => (
  unwrap(requireSupabase().from('initiatives').delete().eq('id', initiativeId))
);

export const loadBoardReport = async (organizationId, reportingPeriodRecordId) => {
  const { data, error } = await requireSupabase()
    .from('board_reports')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('reporting_period_id', reportingPeriodRecordId)
    .maybeSingle();
  if (error) throw error;
  return data;
};

export const saveBoardReport = ({ content, organizationId, reportingPeriodRecordId, userId }) => (
  unwrap(requireSupabase().from('board_reports').upsert({
    content,
    created_by: userId,
    organization_id: organizationId,
    reporting_period_id: reportingPeriodRecordId,
    updated_by: userId,
  }, { onConflict: 'organization_id,reporting_period_id' }).select().single())
);

export const loadCalendarEvents = () => (
  unwrap(requireSupabase().from('calendar_events').select('*').order('starts_on'))
);

export const saveCalendarEventRecord = ({ event, organizationId }) => {
  const row = insertable({
    action_item_id: event.actionItemId || null,
    approved_by: event.approvedBy?.id || null,
    department_id: event.departmentId || null,
    ends_on: event.endDate || null,
    id: event.id,
    lifecycle: event.lifecycle || 'scheduled',
    organization_id: organizationId,
    origin_calendar_event_id: event.originCalendarEventId || null,
    outcome_expected: event.outcomeExpected || null,
    owner_id: event.owner?.id || null,
    property_id: event.propertyId || null,
    review_state: event.reviewState || (event.scope === 'organization' ? 'approved' : 'private'),
    rhythm: event.rhythm || 'once',
    scope: event.scope,
    source_id: isUuid(event.source?.id) ? event.source.id : null,
    source_status: event.sourceStatus || null,
    source_type: event.source?.type || 'native',
    starts_on: event.date,
    submission_state: event.orgSubmissionState || 'private',
    submitted_by: event.submittedBy?.id || null,
    support_needed: event.supportNeeded || null,
    title: event.title,
    type: event.type || 'Touchpoint',
    who_it_impacts: event.whoItImpacts || null,
    why_it_matters: event.whyItMatters || null,
  });
  return unwrap(requireSupabase().from('calendar_events').upsert(row).select().single());
};

export const updateCalendarEventRecord = (eventId, values) => (
  unwrap(requireSupabase().from('calendar_events').update(values).eq('id', eventId).select().single())
);

export const loadNotificationRecords = () => (
  unwrap(requireSupabase().from('notification_events').select('*').order('created_at', { ascending: false }))
);

export const saveNotificationRecord = ({ event, organizationId }) => (
  unwrap(requireSupabase().from('notification_events').insert(insertable({
    actor_profile_id: event.actor?.id || null,
    channel: event.channel || 'in_app',
    id: event.id,
    notification_type: event.type || 'general',
    organization_id: organizationId,
    payload: event.payload || { message: event.message || '', title: event.title || '' },
    priority: event.priority || 'normal',
    recipient_profile_id: event.recipient?.id,
    source_id: isUuid(event.sourceId) ? event.sourceId : crypto.randomUUID(),
    source_type: event.sourceType || 'application',
    status: event.status || 'queued',
  })).select().single())
);

export const updateNotificationRecord = (notificationId, values) => (
  unwrap(requireSupabase().from('notification_events').update(values).eq('id', notificationId).select().single())
);

export const loadFeatureOverrides = () => (
  unwrap(requireSupabase().from('user_feature_overrides').select('*'))
);

export const saveFeatureOverride = ({ enabled, featureKey, organizationId, setBy, userId }) => (
  unwrap(requireSupabase().from('user_feature_overrides').upsert({
    enabled,
    feature_key: featureKey,
    organization_id: organizationId,
    profile_id: userId,
    set_by: setBy,
  }, { onConflict: 'profile_id,feature_key' }).select().single())
);

export const deleteFeatureOverrides = (userId) => (
  unwrap(requireSupabase().from('user_feature_overrides').delete().eq('profile_id', userId))
);

export const loadChecklistData = async () => {
  const client = requireSupabase();
  const [templates, sections, items, submissions, responses, properties, profiles] = await Promise.all([
    unwrap(client.from('checklist_templates').select('*').eq('active', true).order('title')),
    unwrap(client.from('checklist_sections').select('*').order('display_order')),
    unwrap(client.from('checklist_items').select('*').order('display_order')),
    unwrap(client.from('checklist_submissions').select('*').order('due_on')),
    unwrap(client.from('checklist_responses').select('*')),
    unwrap(client.from('properties').select('id,name,address,city,state')),
    unwrap(client.from('profiles').select('id,full_name,display_name,role_title')),
  ]);
  return { items, profiles, properties, responses, sections, submissions, templates };
};

export const submitChecklistRecord = async (submissionId, responses) => {
  const client = requireSupabase();
  await unwrap(client.from('checklist_responses').upsert(responses.map((response) => ({
    comments: response.comments || null,
    correction_due_on: response.correctionDueOn || response.correctionDate || null,
    item_id: response.itemId,
    response_value: response.value,
    submission_id: submissionId,
  })), { onConflict: 'submission_id,item_id' }));
  return unwrap(client.from('checklist_submissions').update({
    credited_at: null,
    review_note: '',
    reviewed_at: null,
    status: 'submitted_pending_review',
    submitted_at: new Date().toISOString(),
  }).eq('id', submissionId).select().single());
};

export const reviewChecklistRecord = (submissionId, { approved, note }) => (
  unwrap(requireSupabase().from('checklist_submissions').update({
    credited_at: approved ? new Date().toISOString() : null,
    review_note: note,
    reviewed_at: new Date().toISOString(),
    status: approved ? 'approved' : 'needs_follow_up',
  }).eq('id', submissionId).select().single())
);
