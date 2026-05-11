import { useAuth } from '../../hooks/useAuth';

const PermissionGate = ({ roles, children }) => {
  const { user } = useAuth();
  if (!roles.includes(user.role)) return null;
  return children;
};

export default PermissionGate;
