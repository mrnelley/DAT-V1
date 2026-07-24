export const calendarEventTypes = [
  'Touchpoint',
  'Checkpoint',
  'Milestone',
  'Commitment',
  'Conference',
  'Celebration',
  'Holiday',
  'HR Training',
  'Pulse Survey',
  'New Hire',
];

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
  preassigned_org_date: 'Admin preassigned organization date',
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
  id: crypto.randomUUID(),
  title: values.title,
  date: values.date,
  endDate: values.endDate || null,
  type: values.type || 'Touchpoint',
  rhythm: values.rhythm || 'once',
  lifecycle: values.lifecycle || 'scheduled',
  scope,
  reviewState: values.reviewState || (scope === 'organization' ? 'approved' : 'private'),
  orgSubmissionState: 'private',
  sourceStatus: normalizeSourceStatus(values.sourceStatus),
  owner: user,
  submittedBy,
  source: values.source || { type: 'native', id: null, label: 'Calendar' },
  department: values.department || '',
  property: values.property || '',
  whyItMatters: values.whyItMatters || '',
  whoItImpacts: values.whoItImpacts || '',
  connectedWork: values.connectedWork || connectedWorkLabels[values.source?.type] || connectedWorkLabels.native,
  supportNeeded: values.supportNeeded || '',
  outcomeExpected: values.outcomeExpected || '',
});
