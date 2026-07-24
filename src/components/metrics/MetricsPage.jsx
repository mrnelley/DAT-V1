import { Box, Typography } from '@mui/material';
import { useOperatingData } from '../../context/OperatingDataContext';
import PageWrapper from '../layout/PageWrapper';
import StrategicPlanSection from '../dashboard/StrategicPlanSection';

const MetricsPage = () => {
  const { strategicPlan } = useOperatingData();
  return (
    <PageWrapper>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h1">{strategicPlan.name} Metrics</Typography>
        <Typography variant="body2" sx={{ mt: 0.5, maxWidth: 820 }}>
          The all-at-once view of Enterprise Priorities, KPIs, departmental workplans, and actions by strategic pillar.
        </Typography>
      </Box>
      <StrategicPlanSection />
    </PageWrapper>
  );
};

export default MetricsPage;
