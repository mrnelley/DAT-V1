import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { Card, CardContent, Chip, IconButton, LinearProgress, Stack, Tooltip, Typography } from '@mui/material';
import PermissionGate from '../shared/PermissionGate';

const InitiativeCard = ({ initiative, onClick }) => (
  <Card onClick={onClick} sx={{ cursor: 'pointer' }}>
    <CardContent>
      <Stack direction="row" gap={1} sx={{ mb: 1 }}>
        <Chip label={initiative.year} color="primary" size="small" />
        <Chip label={initiative.status} color={initiative.status === 'Active' ? 'success' : 'default'} size="small" />
      </Stack>
      <Typography variant="h3">{initiative.title}</Typography>
      <Typography variant="body2" sx={{ my: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{initiative.description}</Typography>
      <LinearProgress value={initiative.progress} variant="determinate" sx={{ mb: 1 }} />
      <Typography variant="caption">{initiative.complete} of {initiative.total} priorities complete</Typography>
      <Stack direction="row" alignItems="center" sx={{ mt: 1 }}>
        <Chip label={`${initiative.connected} connected priorities`} size="small" variant="outlined" />
        <Stack direction="row" sx={{ ml: 'auto' }}>
          <IconButton><EditIcon fontSize="small" /></IconButton>
          <PermissionGate roles={['ELT']}>
            <Tooltip title="Cannot delete until all connected priorities are completed or removed.">
              <span><IconButton disabled={initiative.connected > 0}><DeleteIcon fontSize="small" /></IconButton></span>
            </Tooltip>
          </PermissionGate>
        </Stack>
      </Stack>
    </CardContent>
  </Card>
);

export default InitiativeCard;
