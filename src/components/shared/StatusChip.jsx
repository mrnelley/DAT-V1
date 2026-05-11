import { Chip } from '@mui/material';
import { statusColorMap, statusLabels } from '../../utils/statusColors';

const StatusChip = ({ status = 'neutral', label, ...props }) => (
  <Chip
    label={label || statusLabels[status] || status}
    size="small"
    sx={{
      bgcolor: `${statusColorMap[status] || 'primary.main'}`,
      color: status === 'at_risk' ? 'text.primary' : 'common.white',
    }}
    {...props}
  />
);

export default StatusChip;
