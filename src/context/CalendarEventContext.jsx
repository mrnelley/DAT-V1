import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { calendarEvents } from '../data/mockData';
import { useAuth } from '../hooks/useAuth';
import { createNativeCalendarEvent } from '../utils/calendarEvents';

const CalendarEventContext = createContext(null);

const adminRoles = ['Administrator'];
const organizationCalendarContributorGroups = ['ELT', 'OLT'];
const organizationCalendarContributorRoles = ['Administrator', 'CEO'];

export const CalendarEventProvider = ({ children }) => {
  const { user } = useAuth();
  const [events, setEvents] = useState(calendarEvents);
  const isAdmin = adminRoles.includes(user.role);
  const canCreateOrganizationCalendarEvent = organizationCalendarContributorRoles.includes(user.role)
    || organizationCalendarContributorGroups.includes(user.workingGroup);

  const addCalendarEvent = useCallback((values, scope, ownerOverride = null) => {
    const event = createNativeCalendarEvent(values, ownerOverride || user, scope, user);
    setEvents((current) => [...current, event]);
    return event;
  }, [user]);

  const sendToOrg = useCallback((calendarEventId) => {
    setEvents((current) => {
      const source = current.find((event) => event.id === calendarEventId);
      const existing = current.find((event) => event.originCalendarEventId === calendarEventId && event.scope === 'organization');

      if (!source) {
        return current;
      }

      if (existing) {
        return current.map((event) => {
          if (event.id === calendarEventId) {
            return { ...event, orgSubmissionState: 'pending' };
          }

          if (event.id === existing.id) {
            return {
              ...event,
              ...source,
              id: existing.id,
              scope: 'organization',
              reviewState: 'pending',
              originCalendarEventId: calendarEventId,
              submittedBy: user,
            };
          }

          return event;
        });
      }

      const orgSubmission = {
        ...source,
        id: `${calendarEventId}-org-${Date.now()}`,
        scope: 'organization',
        reviewState: 'pending',
        originCalendarEventId: calendarEventId,
        submittedBy: user,
        supportNeeded: source.supportNeeded || 'Admin review before this appears on the organization-wide calendar.',
      };

      return current
        .map((event) => (
          event.id === calendarEventId
            ? { ...event, orgSubmissionState: 'pending' }
            : event
        ))
        .concat(orgSubmission);
    });
  }, [user]);

  const approveCalendarEvent = useCallback((calendarEventId) => {
    setEvents((current) => current.map((event) => {
      if (event.id === calendarEventId) {
        return { ...event, reviewState: 'approved', approvedBy: user };
      }

      const submitted = current.find((item) => item.id === calendarEventId);
      if (submitted?.originCalendarEventId === event.id) {
        return { ...event, orgSubmissionState: 'approved' };
      }

      return event;
    }));
  }, [user]);

  const declineCalendarEvent = useCallback((calendarEventId) => {
    setEvents((current) => current.map((event) => {
      if (event.id === calendarEventId) {
        return { ...event, reviewState: 'declined', reviewedBy: user };
      }

      const submitted = current.find((item) => item.id === calendarEventId);
      if (submitted?.originCalendarEventId === event.id) {
        return { ...event, orgSubmissionState: 'declined' };
      }

      return event;
    }));
  }, [user]);

  const updateCalendarEvent = useCallback((calendarEventId, values) => {
    setEvents((current) => current.map((event) => (
      event.id === calendarEventId ? { ...event, ...values } : event
    )));
  }, []);

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
      declineCalendarEvent,
      events,
      canCreateOrganizationCalendarEvent,
      isAdmin,
      organizationCalendarEvents,
      personalCalendarEvents,
      sendToOrg,
      updateCalendarEvent,
    };
  }, [addCalendarEvent, approveCalendarEvent, canCreateOrganizationCalendarEvent, declineCalendarEvent, events, isAdmin, sendToOrg, updateCalendarEvent, user.id]);

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
