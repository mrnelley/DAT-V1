import React from 'react';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { notificationEvents } from '../data/mockData';
import { useAuth } from '../hooks/useAuth';

const NotificationsContext = createContext(null);

export const NotificationsProvider = ({ children }) => {
  const { user } = useAuth();
  const [events, setEvents] = useState(notificationEvents);

  const userNotifications = useMemo(
    () => events
      .filter((event) => event.recipient?.id === user.id && event.status !== 'dismissed')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [events, user.id],
  );

  const unreadCount = userNotifications.filter((event) => !event.readAt).length;

  const addNotification = useCallback((event) => {
    setEvents((current) => [
      {
        channel: 'in_app',
        createdAt: new Date().toISOString(),
        id: `notification-${Date.now()}`,
        priority: 'normal',
        readAt: null,
        status: 'queued',
        ...event,
      },
      ...current,
    ]);
  }, []);

  const markAsRead = useCallback((id) => {
    setEvents((current) => current.map((event) => (
      event.id === id ? { ...event, readAt: event.readAt || new Date().toISOString(), status: event.status === 'queued' ? 'read' : event.status } : event
    )));
  }, []);

  const markAllAsRead = useCallback(() => {
    setEvents((current) => current.map((event) => (
      event.recipient?.id === user.id && !event.readAt
        ? { ...event, readAt: new Date().toISOString(), status: event.status === 'queued' ? 'read' : event.status }
        : event
    )));
  }, [user.id]);

  const dismissNotification = useCallback((id) => {
    setEvents((current) => current.map((event) => (
      event.id === id ? { ...event, status: 'dismissed', dismissedAt: new Date().toISOString() } : event
    )));
  }, []);

  const value = useMemo(() => ({
    addNotification,
    dismissNotification,
    markAllAsRead,
    markAsRead,
    notifications: userNotifications,
    unreadCount,
  }), [addNotification, dismissNotification, markAllAsRead, markAsRead, unreadCount, userNotifications]);

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
