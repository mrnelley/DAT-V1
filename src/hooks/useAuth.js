import { createContext, createElement, useContext, useMemo, useState } from 'react';
import { users } from '../data/mockData';

const AuthContext = createContext(null);

const getInitialUserId = () => {
  if (typeof window === 'undefined') return 'u1';
  return window.localStorage.getItem('hdc_compass_demo_user_id') || 'u1';
};

export const AuthProvider = ({ children }) => {
  const [userId, setUserId] = useState(getInitialUserId);
  const user = users.find((candidate) => candidate.id === userId) || users[0];

  const selectUserId = (nextUserId) => {
    setUserId(nextUserId);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('hdc_compass_demo_user_id', nextUserId);
    }
  };

  const signInByName = (value) => {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return null;

    const match = users.find((candidate) => {
      const [firstName] = candidate.name.toLowerCase().split(' ');
      return (
        firstName.startsWith(normalized)
        || candidate.name.toLowerCase().includes(normalized)
        || candidate.role.toLowerCase().includes(normalized)
        || candidate.department.toLowerCase().includes(normalized)
      );
    });

    if (match) {
      selectUserId(match.id);
    }

    return match || null;
  };

  const value = useMemo(() => ({
    demoUsers: users,
    getToken: async () => 'development-token',
    setUserId: selectUserId,
    signInByName,
    user,
    userId,
  }), [user, userId]);

  return createElement(AuthContext.Provider, { value }, children);
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }

  return context;
};
