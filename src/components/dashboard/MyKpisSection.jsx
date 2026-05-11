import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Box, Stack, Tooltip, Typography } from '@mui/material';
import KpiGaugeCard from '../shared/KpiGaugeCard';

const MyKpisSection = ({ metrics, onMetricClick }) => (
  <Box>
    <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1.5 }}>
      <Typography variant="h3">My KPIs (Key Performance Indicators)</Typography>
      <Tooltip title="KPIs are measurable indicators owned by you and reviewed in your operating rhythm.">
        <InfoOutlinedIcon color="primary" fontSize="small" />
      </Tooltip>
    </Stack>
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2 }}>
      {metrics.map((metric) => <KpiGaugeCard key={metric.id} metric={metric} onClick={() => onMetricClick(metric)} />)}
    </Box>
  </Box>
);

export default MyKpisSection;
