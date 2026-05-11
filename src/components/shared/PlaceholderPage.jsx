import ConstructionIcon from '@mui/icons-material/Construction';
import PageWrapper from '../layout/PageWrapper';
import EmptyState from './EmptyState';

const PlaceholderPage = ({ title }) => (
  <PageWrapper>
    <EmptyState icon={<ConstructionIcon />} title={title} body="This module route is wired and ready for the next implementation pass." />
  </PageWrapper>
);

export default PlaceholderPage;
