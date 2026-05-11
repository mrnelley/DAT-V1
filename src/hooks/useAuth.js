import { createContext, createElement, useContext, useMemo, useState } from 'react';
import { users } from '../data/mockData';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [userId, setUserId] = useState('u1');
  const user = users.find((candidate) => candidate.id === userId) || users[0];

  const value = useMemo(() => ({
    demoUsers: users,
    getToken: async () => 'development-token',
    setUserId,
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
