import { Box, Stack, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import KpiGaugeCard from '../shared/KpiGaugeCard';

const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };
const cardVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } } };

const CriticalNumbersSection = ({ metrics, teamName, onMetricClick }) => (
  <Box sx={{ mb: 3 }}>
    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
      <Typography variant="overline" color="primary">Critical Numbers for {teamName}</Typography>
    </Stack>
    <Box component={motion.div} variants={containerVariants} initial="hidden" animate="visible" sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2 }}>
      {metrics.map((metric) => (
        <motion.div key={metric.id} variants={cardVariants}>
          <KpiGaugeCard metric={metric} onClick={() => onMetricClick(metric)} />
        </motion.div>
      ))}
    </Box>
  </Box>
);

export default CriticalNumbersSection;
