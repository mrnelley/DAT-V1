import { createContext, createElement, useContext, useMemo, useState } from 'react';
import { temporaryLoginPassword } from '../config/auth';
import { users } from '../data/mockData';
import { getPrimaryDashboardPath } from '../utils/dashboardRouting';

const AuthContext = createContext(null);
const authenticatedStorageKey = 'hdc_compass_authenticated';
const userStorageKey = 'hdc_compass_user_id';

const getInitialUserId = () => {
  if (typeof window === 'undefined') return 'u1';
  return window.localStorage.getItem(userStorageKey) || 'u1';
};

const getInitialAuthState = () => {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(authenticatedStorageKey) === 'true';
};

const getInitialProfileOverrides = () => {
  if (typeof window === 'undefined') return {};

  try {
    return JSON.parse(window.localStorage.getItem('hdc_compass_profile_overrides')) || {};
  } catch {
    return {};
  }
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(getInitialAuthState);
  const [profileOverrides, setProfileOverrides] = useState(getInitialProfileOverrides);
  const [userId, setUserId] = useState(getInitialUserId);
  const baseUser = users.find((candidate) => candidate.id === userId) || users[0];
  const user = { ...baseUser, ...(profileOverrides[userId] || {}) };

  const saveProfileOverrides = (nextOverrides) => {
    setProfileOverrides(nextOverrides);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('hdc_compass_profile_overrides', JSON.stringify(nextOverrides));
    }
  };

  const selectUserId = (nextUserId) => {
    setUserId(nextUserId);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(userStorageKey, nextUserId);
    }
  };

  const signIn = ({ password, username }) => {
    const normalized = username.trim().toLowerCase();
    const localPart = normalized.split('@')[0];
    if (!normalized || password !== temporaryLoginPassword) return null;

    const match = users.find((candidate) => {
      return (
        candidate.username === normalized
        || candidate.username === localPart
        || candidate.name.toLowerCase() === normalized
      );
    });

    if (match) {
      selectUserId(match.id);
      setIsAuthenticated(true);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(authenticatedStorageKey, 'true');
      }
    }

    return match || null;
  };

  const signOut = () => {
    setIsAuthenticated(false);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(authenticatedStorageKey);
      window.localStorage.removeItem(userStorageKey);
    }
  };

  const updateUserProfile = (values) => {
    const nextUser = {
      ...profileOverrides[userId],
      ...values,
      id: userId,
    };
    saveProfileOverrides({ ...profileOverrides, [userId]: nextUser });
  };

  const resetUserProfile = () => {
    const nextOverrides = { ...profileOverrides };
    delete nextOverrides[userId];
    saveProfileOverrides(nextOverrides);
  };

  const value = useMemo(() => ({
    getToken: async () => 'development-token',
    isAuthenticated,
    primaryDashboardPath: getPrimaryDashboardPath(user),
    resetUserProfile,
    signIn,
    signOut,
    updateUserProfile,
    user,
    userId,
  }), [isAuthenticated, profileOverrides, user, userId]);

  return createElement(AuthContext.Provider, { value }, children);
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }

  return context;
};
