import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  loadNotificationRecords,
  saveNotificationRecord,
  updateNotificationRecord,
} from '../api/supabaseData';
import { useAuth } from '../hooks/useAuth';
import { isSupabaseConfigured } from '../lib/supabase';
import { useOperatingData } from './OperatingDataContext';

const NotificationsContext = createContext(null);

const notificationFromRow = (row, usersById) => ({
  actor: usersById.get(row.actor_profile_id),
  channel: row.channel,
  createdAt: row.created_at,
  dismissedAt: row.dismissed_at,
  id: row.id,
  message: row.payload?.message || '',
  payload: row.payload || {},
  priority: row.priority,
  readAt: row.read_at,
  recipient: usersById.get(row.recipient_profile_id),
  sourceId: row.source_id,
  sourceType: row.source_type,
  status: row.status,
  title: row.payload?.title || '',
  type: row.notification_type,
});

export const NotificationsProvider = ({ children, initialEvents = null }) => {
  const { user } = useAuth();
  const { users } = useOperatingData();
  const [events, setEvents] = useState(initialEvents || []);
  const usersById = useMemo(() => new Map(users.map((candidate) => [candidate.id, candidate])), [users]);
  const persistenceEnabled = !initialEvents && isSupabaseConfigured && Boolean(user);

  const refresh = useCallback(async () => {
    if (!persistenceEnabled) return;
    const rows = await loadNotificationRecords();
    setEvents(rows.map((row) => notificationFromRow(row, usersById)));
  }, [persistenceEnabled, usersById]);

  useEffect(() => {
    refresh().catch(() => setEvents([]));
  }, [refresh]);

  const userNotifications = useMemo(
    () => events
      .filter((event) => event.recipient?.id === user.id && event.status !== 'dismissed')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [events, user.id],
  );
  const unreadCount = userNotifications.filter((event) => !event.readAt).length;

  const addNotification = useCallback((values) => {
    const event = {
      channel: 'in_app',
      createdAt: new Date().toISOString(),
      id: crypto.randomUUID(),
      priority: 'normal',
      readAt: null,
      status: 'queued',
      ...values,
    };
    setEvents((current) => [event, ...current]);
    if (persistenceEnabled) {
      saveNotificationRecord({
        event,
        organizationId: user.organizationId,
      }).then(refresh).catch(() => {});
    }
    return event;
  }, [persistenceEnabled, refresh, user.organizationId]);

  const updateNotification = useCallback((id, changes, databaseChanges) => {
    setEvents((current) => current.map((event) => (
      event.id === id ? { ...event, ...changes } : event
    )));
    if (persistenceEnabled) {
      updateNotificationRecord(id, databaseChanges).catch(() => {});
    }
  }, [persistenceEnabled]);

  const markAsRead = useCallback((id) => {
    const readAt = new Date().toISOString();
    updateNotification(id, { readAt, status: 'read' }, { read_at: readAt, status: 'read' });
  }, [updateNotification]);

  const markAllAsRead = useCallback(() => {
    userNotifications.filter((event) => !event.readAt).forEach((event) => markAsRead(event.id));
  }, [markAsRead, userNotifications]);

  const dismissNotification = useCallback((id) => {
    const dismissedAt = new Date().toISOString();
    updateNotification(
      id,
      { dismissedAt, status: 'dismissed' },
      { dismissed_at: dismissedAt, status: 'dismissed' },
    );
  }, [updateNotification]);

  const value = useMemo(() => ({
    addNotification,
    dismissNotification,
    markAllAsRead,
    markAsRead,
    notifications: userNotifications,
    unreadCount,
  }), [
    addNotification,
    dismissNotification,
    markAllAsRead,
    markAsRead,
    unreadCount,
    userNotifications,
  ]);

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationsProvider');
  }
  return context;
};
