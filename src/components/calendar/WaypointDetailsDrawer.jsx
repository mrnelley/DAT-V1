import CloseIcon from '@mui/icons-material/Close';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import { Box, Button, Chip, Divider, Drawer, FormControl, IconButton, InputLabel, MenuItem, Select, Stack, Typography } from '@mui/material';
import { compassStatuses, connectedLabels, formatDateLabel, reviewStates, waypointRepresentations } from '../../utils/waypoints';
import UserAvatar from '../shared/UserAvatar';

const meaningFields = [
  ['Why It Matters', 'whyItMatters'],
  ['Who It Impacts', 'whoItImpacts'],
  ['Support Needed', 'supportNeeded'],
  ['Outcome Expected', 'outcomeExpected'],
];

const orgSubmissionCopy = {
  none: 'Private',
  pending: 'Pending approval',
  approved: 'Sent to org calendar',
  declined: 'Declined',
  returned: 'Returned',
};

const WaypointDetailsDrawer = ({
  isAdmin = false,
  onApprove,
  onClose,
  onDecline,
  onSendToOrg,
  onUpdate,
  open,
  scope,
  waypoint,
}) => {
  if (!waypoint) return null;

  const status = compassStatuses[waypoint.compassStatus] || compassStatuses.on_course;
  const review = reviewStates[waypoint.reviewState] || reviewStates.private;
  const connectedLabel = connectedLabels[waypoint.source?.type] || waypoint.connectedWork;
  const pending = waypoint.reviewState === 'pending';

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', sm: 430 }, bgcolor: 'background.paper' } }}>
      <Box sx={{ p: 2.5 }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={1} sx={{ mb: 2 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h2">{waypoint.title}</Typography>
            <Typography variant="body2">{formatDateLabel(waypoint.date)}</Typography>
          </Box>
          <IconButton aria-label="Close waypoint details" onClick={onClose}><CloseIcon /></IconButton>
        </Stack>

        <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mb: 2 }}>
          <Chip label={status.label} color={status.color} size="small" />
          <Chip label={review.label} variant={pending ? 'outlined' : 'filled'} size="small" />
          {waypoint.orgSubmissionState && waypoint.scope === 'personal' && (
            <Chip label={orgSubmissionCopy[waypoint.orgSubmissionState]} variant="outlined" size="small" />
          )}
        </Stack>

        <Stack gap={2}>
          <FormControl size="small">
            <InputLabel>Representation</InputLabel>
            <Select
              label="Representation"
              value={waypoint.representation}
              onChange={(event) => onUpdate(waypoint.id, { representation: event.target.value })}
            >
              {waypointRepresentations.map((representation) => (
                <MenuItem key={representation} value={representation}>{representation}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small">
            <InputLabel>Status</InputLabel>
            <Select
              label="Status"
              value={waypoint.compassStatus}
              onChange={(event) => onUpdate(waypoint.id, { compassStatus: event.target.value })}
            >
              {Object.entries(compassStatuses).map(([value, item]) => (
                <MenuItem key={value} value={value}>{item.label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            <Typography variant="caption">{connectedLabel}</Typography>
            <Typography variant="body1" fontWeight={700}>{waypoint.source?.label || waypoint.connectedWork}</Typography>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
            <Box sx={{ p: 1.5, bgcolor: 'background.default', borderRadius: 1 }}>
              <Typography variant="caption">Property</Typography>
              <Typography variant="body1">{waypoint.property}</Typography>
            </Box>
            <Box sx={{ p: 1.5, bgcolor: 'background.default', borderRadius: 1 }}>
              <Typography variant="caption">Department</Typography>
              <Typography variant="body1">{waypoint.department}</Typography>
            </Box>
          </Box>

          <Stack direction="row" alignItems="center" gap={1}>
            <UserAvatar user={waypoint.owner} size="sm" />
            <Box>
              <Typography variant="caption">Owner</Typography>
              <Typography variant="body1">{waypoint.owner?.name}</Typography>
            </Box>
          </Stack>

          <Divider />

          {meaningFields.map(([label, field]) => (
            <Box key={field}>
              <Typography variant="caption">{label}</Typography>
              <Typography variant="body1">{waypoint[field]}</Typography>
            </Box>
          ))}

          {scope === 'personal' && waypoint.orgSubmissionState !== 'pending' && waypoint.orgSubmissionState !== 'approved' && (
            <Button variant="contained" startIcon={<SendOutlinedIcon />} onClick={() => onSendToOrg(waypoint.id)}>
              Send to Org Calendar
            </Button>
          )}

          {scope === 'organization' && isAdmin && pending && (
            <Stack direction="row" gap={1}>
              <Button variant="contained" color="success" startIcon={<TaskAltIcon />} onClick={() => onApprove(waypoint.id)}>
                Approve
              </Button>
              <Button variant="outlined" color="error" onClick={() => onDecline(waypoint.id)}>
                Decline
              </Button>
            </Stack>
          )}
        </Stack>
      </Box>
    </Drawer>
  );
};

export default WaypointDetailsDrawer;
