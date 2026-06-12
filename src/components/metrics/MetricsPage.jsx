import { Box, Typography } from '@mui/material';
import PageWrapper from '../layout/PageWrapper';
import StrategicPlanSection from '../dashboard/StrategicPlanSection';

const MetricsPage = () => (
  <PageWrapper>
    <Box sx={{ mb: 2 }}>
      <Typography variant="h1">2030 Strategic Plan Metrics</Typography>
      <Typography variant="body2" sx={{ mt: 0.5, maxWidth: 820 }}>
        The all-at-once view of Enterprise Priorities, KPIs, departmental workplans, and actions by strategic pillar.
      </Typography>
    </Box>
    <StrategicPlanSection />
  </PageWrapper>
);

export default MetricsPage;
