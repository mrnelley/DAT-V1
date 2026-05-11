import { Box, Typography } from '@mui/material';
import { metrics } from '../../data/mockData';
import KpiGaugeCard from '../shared/KpiGaugeCard';

const MonthlyTargets = ({ onMetricClick }) => (
  <Box sx={{ mb: 3 }}>
    <Typography variant="h4" sx={{ mb: 1 }}>Monthly Targets</Typography>
    <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 1 }}>
      {metrics.slice(0, 3).map((metric) => <KpiGaugeCard key={metric.id} metric={metric} dense onClick={() => onMetricClick(metric)} />)}
    </Box>
  </Box>
);

export default MonthlyTargets;
