import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  loadCalendarEvents,
  saveCalendarEventRecord,
  updateCalendarEventRecord,
} from '../api/supabaseData';
import { useAuth } from '../hooks/useAuth';
import { isSupabaseConfigured } from '../lib/supabase';
import { createNativeCalendarEvent } from '../utils/calendarEvents';
import { useOperatingData } from './OperatingDataContext';

const CalendarEventContext = createContext(null);

const adminRoles = ['Administrator'];
const organizationCalendarContributorGroups = ['ELT', 'OLT'];
const organizationCalendarContributorRoles = ['Administrator', 'CEO'];

const eventFromRow = (row, usersById) => ({
  actionItemId: row.action_item_id,
  approvedBy: usersById.get(row.approved_by),
  date: row.starts_on,
  departmentId: row.department_id,
  endDate: row.ends_on,
  id: row.id,
  lifecycle: row.lifecycle,
  orgSubmissionState: row.submission_state || 'private',
  originCalendarEventId: row.origin_calendar_event_id,
  outcomeExpected: row.outcome_expected || '',
  owner: usersById.get(row.owner_id),
  propertyId: row.property_id,
  reviewState: row.review_state,
  rhythm: row.rhythm,
  scope: row.scope,
  source: {
    id: row.source_id,
    type: row.source_type || 'native',
  },
  sourceStatus: row.source_status,
  submittedBy: usersById.get(row.submitted_by),
  supportNeeded: row.support_needed || '',
  title: row.title,
  type: row.type,
  whoItImpacts: row.who_it_impacts || '',
  whyItMatters: row.why_it_matters || '',
});

export const CalendarEventProvider = ({ children, initialEvents = null }) => {
  const { user } = useAuth();
  const { users } = useOperatingData();
  const [events, setEvents] = useState(initialEvents || []);
  const persistenceEnabled = !initialEvents && isSupabaseConfigured && Boolean(user);
  const usersById = useMemo(() => new Map(users.map((candidate) => [candidate.id, candidate])), [users]);
  const isAdmin = adminRoles.includes(user.role);
  const canCreateOrganizationCalendarEvent = organizationCalendarContributorRoles.includes(user.role)
    || organizationCalendarContributorGroups.includes(user.workingGroup);

  const refresh = useCallback(async () => {
    if (!persistenceEnabled) return;
    const rows = await loadCalendarEvents();
    setEvents(rows.map((row) => eventFromRow(row, usersById)));
  }, [persistenceEnabled, usersById]);

  useEffect(() => {
    refresh().catch(() => setEvents([]));
  }, [refresh]);

  const persistEvent = useCallback(async (event) => {
    if (!persistenceEnabled) return;
    await saveCalendarEventRecord({ event, organizationId: user.organizationId });
    await refresh();
  }, [persistenceEnabled, refresh, user.organizationId]);

  const addCalendarEvent = useCallback((values, scope, ownerOverride = null) => {
    const event = createNativeCalendarEvent(values, ownerOverride || user, scope, user);
    setEvents((current) => [...current, event]);
    persistEvent(event).catch(() => {});
    return event;
  }, [persistEvent, user]);

  const sendToOrg = useCallback((calendarEventId) => {
    const source = events.find((event) => event.id === calendarEventId);
    if (!source) return;
    const existing = events.find((event) => (
      event.originCalendarEventId === calendarEventId && event.scope === 'organization'
    ));
    const sourceUpdate = { ...source, orgSubmissionState: 'pending' };
    const orgSubmission = {
      ...source,
      id: existing?.id || crypto.randomUUID(),
      originCalendarEventId: calendarEventId,
      reviewState: 'pending',
      scope: 'organization',
      submittedBy: user,
    };
    setEvents((current) => [
      ...current
        .filter((event) => event.id !== orgSubmission.id)
        .map((event) => (event.id === source.id ? sourceUpdate : event)),
      orgSubmission,
    ]);
    Promise.all([
      updateCalendarEventRecord(source.id, { submission_state: 'pending' }),
      saveCalendarEventRecord({ event: orgSubmission, organizationId: user.organizationId }),
    ]).then(refresh).catch(() => {});
  }, [events, refresh, user]);

  const reviewCalendarEvent = useCallback((calendarEventId, reviewState) => {
    const submitted = events.find((event) => event.id === calendarEventId);
    if (!submitted) return;
    setEvents((current) => current.map((event) => {
      if (event.id === calendarEventId) {
        return {
          ...event,
          approvedBy: reviewState === 'approved' ? user : event.approvedBy,
          reviewState,
        };
      }
      if (submitted.originCalendarEventId === event.id) {
        return { ...event, orgSubmissionState: reviewState };
      }
      return event;
    }));

    const requests = [
      updateCalendarEventRecord(calendarEventId, {
        approved_by: reviewState === 'approved' ? user.id : null,
        review_state: reviewState,
      }),
    ];
    if (submitted.originCalendarEventId) {
      requests.push(updateCalendarEventRecord(submitted.originCalendarEventId, {
        submission_state: reviewState,
      }));
    }
    Promise.all(requests).then(refresh).catch(() => {});
  }, [events, refresh, user]);

  const approveCalendarEvent = useCallback(
    (calendarEventId) => reviewCalendarEvent(calendarEventId, 'approved'),
    [reviewCalendarEvent],
  );
  const declineCalendarEvent = useCallback(
    (calendarEventId) => reviewCalendarEvent(calendarEventId, 'declined'),
    [reviewCalendarEvent],
  );

  const updateCalendarEvent = useCallback((calendarEventId, values) => {
    const currentEvent = events.find((event) => event.id === calendarEventId);
    if (!currentEvent) return;
    const updated = { ...currentEvent, ...values };
    setEvents((current) => current.map((event) => (
      event.id === calendarEventId ? updated : event
    )));
    persistEvent(updated).catch(() => {});
  }, [events, persistEvent]);

  const value = useMemo(() => {
    const organizationCalendarEvents = events.filter((event) => (
      event.scope === 'organization'
      && (event.reviewState === 'approved' || (isAdmin && event.reviewState === 'pending'))
    ));
    const personalCalendarEvents = events.filter((event) => (
      event.scope === 'personal' && event.owner?.id === user.id
    ));

    return {
      addCalendarEvent,
      approveCalendarEvent,
      canCreateOrganizationCalendarEvent,
      declineCalendarEvent,
      events,
      isAdmin,
      organizationCalendarEvents,
      personalCalendarEvents,
      sendToOrg,
      updateCalendarEvent,
    };
  }, [
    addCalendarEvent,
    approveCalendarEvent,
    canCreateOrganizationCalendarEvent,
    declineCalendarEvent,
    events,
    isAdmin,
    sendToOrg,
    updateCalendarEvent,
    user.id,
  ]);

  return (
    <CalendarEventContext.Provider value={value}>
      {children}
    </CalendarEventContext.Provider>
  );
};

export const useCalendarEvents = () => {
  const context = useContext(CalendarEventContext);
  if (!context) {
    throw new Error('useCalendarEvents must be used inside a CalendarEventProvider');
  }
  return context;
};
