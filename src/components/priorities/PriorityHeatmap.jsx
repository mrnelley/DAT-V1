import { Box, Tooltip, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { statusColorMap, statusLabels } from '../../utils/statusColors';

const PriorityHeatmap = ({ values }) => (
  <Box component={motion.div} initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.03 } } }} sx={{ display: 'flex', gap: 1, overflowX: 'auto', py: 1 }}>
    {values.map((status, index) => (
      <Tooltip key={`${status}-${index}`} title={`Week ${index + 1} - ${statusLabels[status]} - Q2`}>
        <Box
          component={motion.div}
          variants={{ hidden: { scale: 0 }, visible: { scale: 1, transition: { type: 'spring', stiffness: 400 } } }}
          sx={{ minWidth: 40, width: 40, height: 40, borderRadius: 1.5, bgcolor: statusColorMap[status] || 'divider', display: 'grid', placeItems: 'center' }}
        >
          <Typography variant="caption" color={status === 'at_risk' ? 'text.primary' : 'common.white'}>{index + 1}</Typography>
        </Box>
      </Tooltip>
    ))}
  </Box>
);

export default PriorityHeatmap;
