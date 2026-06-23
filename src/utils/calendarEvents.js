export const calendarEventTypes = ['Touchpoint', 'Checkpoint', 'Milestone', 'Commitment'];

export const calendarRhythms = ['once', 'weekly', 'monthly', 'quarterly', 'annual', 'custom'];

export const calendarLifecycles = {
  scheduled: { label: 'Scheduled', color: 'default' },
  completed: { label: 'Completed', color: 'success' },
  rescheduled: { label: 'Rescheduled', color: 'warning' },
  cancelled: { label: 'Cancelled', color: 'error' },
};

export const sourceStatuses = {
  steady: { label: 'Steady', color: 'success', tone: 'success.main' },
  watch: { label: 'Watch', color: 'warning', tone: 'warning.main' },
  alert: { label: 'Alert', color: 'error', tone: 'error.main' },
  complete: { label: 'Complete', color: 'success', tone: 'success.dark' },
  no_data: { label: 'No Data', color: 'default', tone: 'text.secondary' },
};

export const reviewStates = {
  private: { label: 'Private' },
  pending: { label: 'Pending Approval' },
  approved: { label: 'Approved' },
  declined: { label: 'Declined' },
  returned: { label: 'Returned' },
};

export const connectedWorkLabels = {
  priority: 'Connected to Priority',
  initiative: 'Connected to Initiative',
  huddle: 'Connected to Huddle',
  stuck: 'Connected to Stuck',
  touchpoint: 'Connected to Advocacy Touchpoint',
  native: 'Calendar event',
};

const statusAliases = {
  on_track: 'steady',
  on_course: 'steady',
  Steady: 'steady',
  'On Course': 'steady',
  at_risk: 'watch',
  needs_attention: 'watch',
  Watch: 'watch',
  'Needs Attention': 'watch',
  off_track: 'alert',
  off_course: 'alert',
  Alert: 'alert',
  'Off Course': 'alert',
  completed: 'complete',
  complete: 'complete',
  Complete: 'complete',
  Completed: 'complete',
};

export const normalizeSourceStatus = (status) => statusAliases[status] || status || null;

export const formatDateLabel = (date) => {
  const parsed = parseCalendarDate(date);
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const formatMonthLabel = (date) => (
  date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
);

export const parseCalendarDate = (date) => new Date(`${date}T12:00:00`);

export const toDateInputValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getCalendarDays = (monthDate) => {
  const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const mondayOffset = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - mondayOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
};

export const getEventDate = (event) => event.date || event.startsOn;

export const sortCalendarEventsByDate = (events) => (
  [...events].sort((a, b) => parseCalendarDate(getEventDate(a)) - parseCalendarDate(getEventDate(b)))
);

export const formatRhythmLabel = (rhythm = 'once') => (
  rhythm === 'once' ? 'One-time' : rhythm.charAt(0).toUpperCase() + rhythm.slice(1)
);

export const createNativeCalendarEvent = (values, user, scope, submittedBy = user) => ({
  id: `calendar-event-${Date.now()}`,
  title: values.title,
  date: values.date,
  endDate: values.endDate || null,
  type: values.type || 'Touchpoint',
  rhythm: values.rhythm || 'once',
  lifecycle: values.lifecycle || 'scheduled',
  scope,
  reviewState: scope === 'organization' ? 'approved' : 'private',
  orgSubmissionState: 'none',
  sourceStatus: normalizeSourceStatus(values.sourceStatus),
  owner: user,
  submittedBy,
  source: values.source || { type: 'native', id: null, label: 'Calendar' },
  department: values.department || 'Unassigned',
  property: values.property || 'Portfolio',
  whyItMatters: values.whyItMatters || 'This date matters to the operating rhythm.',
  whoItImpacts: values.whoItImpacts || 'Team members connected to this work',
  connectedWork: values.connectedWork || connectedWorkLabels[values.source?.type] || connectedWorkLabels.native,
  supportNeeded: values.supportNeeded || 'No support needed yet.',
  outcomeExpected: values.outcomeExpected || 'A clear next step is completed by this date.',
});

export const calendarEventFromPriority = (priority, overrides = {}) => ({
  id: `priority-${priority.id}-calendar-event`,
  title: priority.name,
  date: overrides.date || '2026-05-28',
  endDate: null,
  type: overrides.type || 'Checkpoint',
  rhythm: overrides.rhythm || 'once',
  lifecycle: overrides.lifecycle || 'scheduled',
  scope: overrides.scope || 'organization',
  reviewState: overrides.reviewState || 'approved',
  sourceStatus: normalizeSourceStatus(priority.status),
  owner: priority.owner,
  submittedBy: overrides.submittedBy || priority.owner,
  source: { type: 'priority', id: priority.id, label: priority.name },
  department: overrides.department || 'Operations',
  property: overrides.property || 'Portfolio',
  whyItMatters: overrides.whyItMatters || priority.description,
  whoItImpacts: overrides.whoItImpacts || 'Teams connected to this priority',
  connectedWork: connectedWorkLabels.priority,
  supportNeeded: overrides.supportNeeded || 'Review progress and blockers before this date.',
  outcomeExpected: overrides.outcomeExpected || 'Priority owner confirms the work remains steady.',
});

export const calendarEventFromInitiative = (initiative, overrides = {}) => ({
  id: `initiative-${initiative.id}-calendar-event`,
  title: initiative.title,
  date: overrides.date || '2026-06-05',
  endDate: null,
  type: overrides.type || 'Milestone',
  rhythm: overrides.rhythm || 'once',
  lifecycle: overrides.lifecycle || 'scheduled',
  scope: overrides.scope || 'organization',
  reviewState: overrides.reviewState || 'approved',
  sourceStatus: normalizeSourceStatus(initiative.status),
  owner: overrides.owner,
  submittedBy: overrides.submittedBy || overrides.owner,
  source: { type: 'initiative', id: initiative.id, label: initiative.title },
  department: overrides.department || 'Leadership',
  property: overrides.property || 'Portfolio',
  whyItMatters: overrides.whyItMatters || initiative.description,
  whoItImpacts: overrides.whoItImpacts || 'Departments connected to this initiative',
  connectedWork: connectedWorkLabels.initiative,
  supportNeeded: overrides.supportNeeded || 'Confirm milestone readiness with initiative owner.',
  outcomeExpected: overrides.outcomeExpected || 'Initiative progress is visible before the next planning moment.',
});

export const calendarEventFromHuddle = (huddle, owner, overrides = {}) => ({
  id: `huddle-${huddle.id}-calendar-event`,
  title: huddle.name,
  date: overrides.date || '2026-05-20',
  endDate: null,
  type: overrides.type || 'Touchpoint',
  rhythm: overrides.rhythm || 'weekly',
  lifecycle: overrides.lifecycle || 'scheduled',
  scope: overrides.scope || 'organization',
  reviewState: overrides.reviewState || 'approved',
  sourceStatus: normalizeSourceStatus(overrides.sourceStatus),
  owner,
  submittedBy: overrides.submittedBy || owner,
  source: { type: 'huddle', id: huddle.id, label: huddle.name },
  department: overrides.department || 'Operations',
  property: overrides.property || 'Portfolio',
  whyItMatters: overrides.whyItMatters || `Keeps the ${huddle.recurrence.toLowerCase()} operating rhythm visible.`,
  whoItImpacts: overrides.whoItImpacts || 'Huddle members and connected teams',
  connectedWork: connectedWorkLabels.huddle,
  supportNeeded: overrides.supportNeeded || 'Confirm agenda owners and follow-up items.',
  outcomeExpected: overrides.outcomeExpected || 'The huddle produces clear commitments.',
});
