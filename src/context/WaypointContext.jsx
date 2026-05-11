import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { calendarWaypoints } from '../data/mockData';
import { useAuth } from '../hooks/useAuth';
import { createNativeWaypoint } from '../utils/waypoints';

const WaypointContext = createContext(null);

const adminRoles = ['Administrator', 'CEO', 'ELT'];

export const WaypointProvider = ({ children }) => {
  const { user } = useAuth();
  const [waypoints, setWaypoints] = useState(calendarWaypoints);
  const isAdmin = adminRoles.includes(user.role);

  const addWaypoint = useCallback((values, scope) => {
    const waypoint = createNativeWaypoint(values, user, scope);
    setWaypoints((current) => [...current, waypoint]);
    return waypoint;
  }, [user]);

  const sendToOrg = useCallback((waypointId) => {
    setWaypoints((current) => {
      const source = current.find((waypoint) => waypoint.id === waypointId);
      const existing = current.find((waypoint) => waypoint.originWaypointId === waypointId && waypoint.scope === 'organization');

      if (!source) {
        return current;
      }

      if (existing) {
        return current.map((waypoint) => {
          if (waypoint.id === waypointId) {
            return { ...waypoint, orgSubmissionState: 'pending' };
          }

          if (waypoint.id === existing.id) {
            return {
              ...waypoint,
              ...source,
              id: existing.id,
              scope: 'organization',
              reviewState: 'pending',
              originWaypointId: waypointId,
              submittedBy: user,
            };
          }

          return waypoint;
        });
      }

      const orgSubmission = {
        ...source,
        id: `${waypointId}-org-${Date.now()}`,
        scope: 'organization',
        reviewState: 'pending',
        originWaypointId: waypointId,
        submittedBy: user,
        supportNeeded: source.supportNeeded || 'Admin review before this appears on the organization-wide calendar.',
      };

      return current
        .map((waypoint) => (
          waypoint.id === waypointId
            ? { ...waypoint, orgSubmissionState: 'pending' }
            : waypoint
        ))
        .concat(orgSubmission);
    });
  }, [user]);

  const approveWaypoint = useCallback((waypointId) => {
    setWaypoints((current) => current.map((waypoint) => {
      if (waypoint.id === waypointId) {
        return { ...waypoint, reviewState: 'approved', approvedBy: user };
      }

      const submitted = current.find((item) => item.id === waypointId);
      if (submitted?.originWaypointId === waypoint.id) {
        return { ...waypoint, orgSubmissionState: 'approved' };
      }

      return waypoint;
    }));
  }, [user]);

  const declineWaypoint = useCallback((waypointId) => {
    setWaypoints((current) => current.map((waypoint) => {
      if (waypoint.id === waypointId) {
        return { ...waypoint, reviewState: 'declined', reviewedBy: user };
      }

      const submitted = current.find((item) => item.id === waypointId);
      if (submitted?.originWaypointId === waypoint.id) {
        return { ...waypoint, orgSubmissionState: 'declined' };
      }

      return waypoint;
    }));
  }, [user]);

  const updateWaypoint = useCallback((waypointId, values) => {
    setWaypoints((current) => current.map((waypoint) => (
      waypoint.id === waypointId ? { ...waypoint, ...values } : waypoint
    )));
  }, []);

  const value = useMemo(() => {
    const organizationWaypoints = waypoints.filter((waypoint) => (
      waypoint.scope === 'organization'
      && (waypoint.reviewState === 'approved' || (isAdmin && waypoint.reviewState === 'pending'))
    ));

    const personalWaypoints = waypoints.filter((waypoint) => (
      waypoint.scope === 'personal' && waypoint.owner?.id === user.id
    ));

    return {
      addWaypoint,
      approveWaypoint,
      declineWaypoint,
      isAdmin,
      organizationWaypoints,
      personalWaypoints,
      sendToOrg,
      updateWaypoint,
      waypoints,
    };
  }, [addWaypoint, approveWaypoint, declineWaypoint, isAdmin, sendToOrg, updateWaypoint, user.id, waypoints]);

  return (
    <WaypointContext.Provider value={value}>
      {children}
    </WaypointContext.Provider>
  );
};

export const useWaypoints = () => {
  const context = useContext(WaypointContext);
  if (!context) {
    throw new Error('useWaypoints must be used inside a WaypointProvider');
  }

  return context;
};
