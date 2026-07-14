const trackerWeeks = [
  { label: 'May 11', sheet: '5-11-26 Priorities', status: 'locked', weekEnd: '2026-05-15', weekStart: '2026-05-11' },
  { label: 'May 18', sheet: '5-18-26 Priorities', status: 'locked', weekEnd: '2026-05-22', weekStart: '2026-05-18' },
  { label: 'May 26', sheet: '5-26-26 Priorities', status: 'locked', weekEnd: '2026-05-29', weekStart: '2026-05-26' },
  { label: 'Jun 1', sheet: '6-01-26 Priorities', status: 'locked', weekEnd: '2026-06-05', weekStart: '2026-06-01' },
  { label: 'Jun 8', sheet: '6-08-26 Priorities', status: 'locked', weekEnd: '2026-06-12', weekStart: '2026-06-08' },
  { label: 'Jun 15', sheet: '6-15-26 Priorities', status: 'locked', weekEnd: '2026-06-19', weekStart: '2026-06-15' },
  { label: 'Jun 22', sheet: '6-22-26 Priorities', status: 'locked', weekEnd: '2026-06-26', weekStart: '2026-06-22' },
  { label: 'Jun 29', sheet: '6-29-26 Priorities', status: 'locked', weekEnd: '2026-07-03', weekStart: '2026-06-29' },
  { label: 'Jul 6', sheet: '7-06-26 Priorities', status: 'locked', weekEnd: '2026-07-10', weekStart: '2026-07-06' },
  { label: 'Current week', sheet: '7-13-26 Priorities', status: 'planning', weekEnd: '2026-07-17', weekStart: '2026-07-13' },
  { label: 'Jul 20', sheet: '7-20-26 Priorities', status: 'planning', weekEnd: '2026-07-24', weekStart: '2026-07-20' },
  { label: 'Jul 27', sheet: '7-27-26 Priorites', status: 'planning', weekEnd: '2026-07-31', weekStart: '2026-07-27' },
  { label: 'Aug 3', sheet: '8-03-26 Priorities', status: 'planning', weekEnd: '2026-08-07', weekStart: '2026-08-03' },
  { label: 'Aug 10', sheet: '8-10-26 Priorities', status: 'planning', weekEnd: '2026-08-14', weekStart: '2026-08-10' },
];

const buildWeeklyReport = (week) => ({
  id: `war-${week.weekStart}`,
  label: week.label,
  reviewMeetingAt: `${week.weekEnd}T10:00:00-04:00`,
  sourceSheet: week.sheet,
  status: week.status,
  submissionDueAt: `${week.weekEnd}T12:00:00-04:00`,
  weekEnd: week.weekEnd,
  weekStart: week.weekStart,
});

export const weeklyTrackerWeekOptions = trackerWeeks.map(buildWeeklyReport);

export const currentWeeklyReport = weeklyTrackerWeekOptions.find((week) => week.weekStart === '2026-07-13');
