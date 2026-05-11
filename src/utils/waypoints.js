export const waypointRepresentations = ['Waypoint', 'Marker', 'Commitment', 'Touchpoint'];

export const compassStatuses = {
  on_course: { label: 'On Course', color: 'success', tone: 'success.main' },
  needs_attention: { label: 'Needs Attention', color: 'warning', tone: 'warning.main' },
  off_course: { label: 'Off Course', color: 'error', tone: 'error.main' },
  completed: { label: 'Completed', color: 'success', tone: 'success.dark' },
  rescheduled: { label: 'Rescheduled', color: 'default', tone: 'text.secondary' },
};

export const reviewStates = {
  private: { label: 'Private' },
  pending: { label: 'Pending Approval' },
  approved: { label: 'Approved' },
  declined: { label: 'Declined' },
  returned: { label: 'Returned' },
};

export const connectedLabels = {
  priority: 'Connected to Priority',
  initiative: 'Connected to Initiative',
  huddle: 'Connected to Huddle',
  stuck: 'Connected to Stuck',
  native: 'Native calendar item',
};

export const formatDateLabel = (date) => {
  const parsed = parseWaypointDate(date);
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const formatMonthLabel = (date) => (
  date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
);

export const parseWaypointDate = (date) => new Date(`${date}T12:00:00`);

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

export const sortWaypointsByDate = (waypoints) => (
  [...waypoints].sort((a, b) => parseWaypointDate(a.date) - parseWaypointDate(b.date))
);

export const createNativeWaypoint = (values, user, scope) => ({
  id: `wp-${Date.now()}`,
  title: values.title,
  date: values.date,
  endDate: values.endDate || null,
  representation: values.representation || 'Waypoint',
  scope,
  reviewState: scope === 'organization' ? 'approved' : 'private',
  orgSubmissionState: 'none',
  compassStatus: values.compassStatus || 'on_course',
  owner: user,
  submittedBy: user,
  source: { type: 'native', id: null, label: 'Calendar' },
  department: values.department || 'Unassigned',
  property: values.property || 'Portfolio',
  whyItMatters: values.whyItMatters || 'This date matters to the operating rhythm.',
  whoItImpacts: values.whoItImpacts || 'Team members connected to this work',
  connectedWork: connectedLabels.native,
  supportNeeded: values.supportNeeded || 'No support needed yet.',
  outcomeExpected: values.outcomeExpected || 'A clear next step is completed by this date.',
});

export const waypointFromPriority = (priority, overrides = {}) => ({
  id: `priority-${priority.id}-waypoint`,
  title: priority.name,
  date: overrides.date || '2026-05-28',
  endDate: null,
  representation: overrides.representation || 'Waypoint',
  scope: overrides.scope || 'organization',
  reviewState: overrides.reviewState || 'approved',
  compassStatus: priority.status === 'on_track' ? 'on_course' : priority.status === 'off_track' ? 'off_course' : 'needs_attention',
  owner: priority.owner,
  submittedBy: overrides.submittedBy || priority.owner,
  source: { type: 'priority', id: priority.id, label: priority.name },
  department: overrides.department || 'Operations',
  property: overrides.property || 'Portfolio',
  whyItMatters: overrides.whyItMatters || priority.description,
  whoItImpacts: overrides.whoItImpacts || 'Teams connected to this priority',
  connectedWork: connectedLabels.priority,
  supportNeeded: overrides.supportNeeded || 'Review progress and blockers before this date.',
  outcomeExpected: overrides.outcomeExpected || 'Priority owner confirms the work remains on course.',
});

export const waypointFromInitiative = (initiative, overrides = {}) => ({
  id: `initiative-${initiative.id}-waypoint`,
  title: initiative.title,
  date: overrides.date || '2026-06-05',
  endDate: null,
  representation: overrides.representation || 'Marker',
  scope: overrides.scope || 'organization',
  reviewState: overrides.reviewState || 'approved',
  compassStatus: initiative.status === 'Active' ? 'on_course' : 'needs_attention',
  owner: overrides.owner,
  submittedBy: overrides.submittedBy || overrides.owner,
  source: { type: 'initiative', id: initiative.id, label: initiative.title },
  department: overrides.department || 'Leadership',
  property: overrides.property || 'Portfolio',
  whyItMatters: overrides.whyItMatters || initiative.description,
  whoItImpacts: overrides.whoItImpacts || 'Departments connected to this initiative',
  connectedWork: connectedLabels.initiative,
  supportNeeded: overrides.supportNeeded || 'Confirm milestone readiness with initiative owner.',
  outcomeExpected: overrides.outcomeExpected || 'Initiative progress is visible before the next planning moment.',
});

export const waypointFromHuddle = (huddle, owner, overrides = {}) => ({
  id: `huddle-${huddle.id}-waypoint`,
  title: huddle.name,
  date: overrides.date || '2026-05-20',
  endDate: null,
  representation: overrides.representation || 'Touchpoint',
  scope: overrides.scope || 'organization',
  reviewState: overrides.reviewState || 'approved',
  compassStatus: overrides.compassStatus || 'on_course',
  owner,
  submittedBy: overrides.submittedBy || owner,
  source: { type: 'huddle', id: huddle.id, label: huddle.name },
  department: overrides.department || 'Operations',
  property: overrides.property || 'Portfolio',
  whyItMatters: overrides.whyItMatters || `Keeps the ${huddle.recurrence.toLowerCase()} operating rhythm visible.`,
  whoItImpacts: overrides.whoItImpacts || 'Huddle members and connected teams',
  connectedWork: connectedLabels.huddle,
  supportNeeded: overrides.supportNeeded || 'Confirm agenda owners and follow-up items.',
  outcomeExpected: overrides.outcomeExpected || 'The huddle produces clear commitments.',
});
