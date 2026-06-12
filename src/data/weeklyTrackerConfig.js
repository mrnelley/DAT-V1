export const currentWeeklyReport = {
  id: 'war-2026-06-08',
  label: 'Current week',
  reviewMeetingAt: '2026-06-12T10:00:00-04:00',
  status: 'planning',
  submissionDueAt: '2026-06-12T12:00:00-04:00',
  weekEnd: '2026-06-12',
  weekStart: '2026-06-08',
};

export const weeklyTrackerWeekOptions = [
  {
    ...currentWeeklyReport,
    id: 'war-2026-06-01',
    label: 'Previous week',
    reviewMeetingAt: '2026-06-05T10:00:00-04:00',
    status: 'locked',
    submissionDueAt: '2026-06-05T12:00:00-04:00',
    weekEnd: '2026-06-05',
    weekStart: '2026-06-01',
  },
  currentWeeklyReport,
  {
    ...currentWeeklyReport,
    id: 'war-2026-06-15',
    label: 'Upcoming week',
    reviewMeetingAt: '2026-06-19T10:00:00-04:00',
    status: 'planning',
    submissionDueAt: '2026-06-19T12:00:00-04:00',
    weekEnd: '2026-06-19',
    weekStart: '2026-06-15',
  },
];
