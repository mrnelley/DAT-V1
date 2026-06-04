import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useNavigate } from 'react-router-dom';
import { useFeatureAccess } from '../../context/FeatureAccessContext';
import { useAuth } from '../../hooks/useAuth';
import EmptyState from './EmptyState';
import PageWrapper from '../layout/PageWrapper';

const FeatureGate = ({ children, featureKey }) => {
  const navigate = useNavigate();
  const { primaryDashboardPath } = useAuth();
  const { isFeatureEnabled } = useFeatureAccess();

  if (isFeatureEnabled(featureKey)) {
    return children;
  }

  return (
    <PageWrapper>
      <EmptyState
        actionLabel="Back to Dashboard"
        body="This feature has not been enabled for your account yet. An administrator can turn it on from Feature Rollout."
        icon={<LockOutlinedIcon />}
        onAction={() => navigate(primaryDashboardPath)}
        title="Feature Not Enabled"
      />
    </PageWrapper>
  );
};

export default FeatureGate;
