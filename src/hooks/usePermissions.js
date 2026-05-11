import { useAuth } from './useAuth';

export const usePermissions = () => {
  const { user } = useAuth();
  return {
    hasRole: (roles) => roles.includes(user.role),
    role: user.role,
  };
};
