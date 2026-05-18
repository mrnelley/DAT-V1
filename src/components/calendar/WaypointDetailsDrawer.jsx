import CloseIcon from '@mui/icons-material/Close';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import { Box, Button, Chip, Divider, Drawer, FormControl, IconButton, InputLabel, MenuItem, Select, Stack, Typography } from '@mui/material';
import { calendarLabels, calendarLifecycles, calendarRhythms, connectedLabels, formatDateLabel, formatRhythmLabel, getEventDate, reviewStates, sourceStatuses } from '../../utils/waypoints';
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

  const lifecycle = calendarLifecycles[waypoint.lifecycle] || calendarLifecycles.scheduled;
  const review = reviewStates[waypoint.reviewState] || reviewStates.private;
  const sourceStatus = waypoint.sourceStatus ? sourceStatuses[waypoint.sourceStatus] : null;
  const connectedLabel = connectedLabels[waypoint.source?.type] || waypoint.connectedWork;
  const pending = waypoint.reviewState === 'pending';

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', sm: 430 }, bgcolor: 'background.paper' } }}>
      <Box sx={{ p: 2.5 }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={1} sx={{ mb: 2 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h2">{waypoint.title}</Typography>
            <Typography variant="body2">{formatDateLabel(getEventDate(waypoint))}</Typography>
          </Box>
          <IconButton aria-label="Close calendar event details" onClick={onClose}><CloseIcon /></IconButton>
        </Stack>

        <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mb: 2 }}>
          <Chip label={waypoint.label} color="primary" size="small" />
          <Chip label={formatRhythmLabel(waypoint.rhythm)} color="secondary" size="small" variant="outlined" />
          <Chip label={lifecycle.label} color={lifecycle.color} size="small" />
          {sourceStatus && <Chip label={sourceStatus.label} color={sourceStatus.color} size="small" />}
          <Chip label={review.label} variant={pending ? 'outlined' : 'filled'} size="small" />
          {waypoint.orgSubmissionState && waypoint.scope === 'personal' && (
            <Chip label={orgSubmissionCopy[waypoint.orgSubmissionState]} variant="outlined" size="small" />
          )}
        </Stack>

        <Stack gap={2}>
          <FormControl size="small">
            <InputLabel>Label</InputLabel>
            <Select
              label="Label"
              value={waypoint.label}
              onChange={(event) => onUpdate(waypoint.id, { label: event.target.value })}
            >
              {calendarLabels.map((label) => (
                <MenuItem key={label} value={label}>{label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small">
            <InputLabel>Rhythm</InputLabel>
            <Select
              label="Rhythm"
              value={waypoint.rhythm}
              onChange={(event) => onUpdate(waypoint.id, { rhythm: event.target.value })}
            >
              {calendarRhythms.map((rhythm) => (
                <MenuItem key={rhythm} value={rhythm}>{formatRhythmLabel(rhythm)}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small">
            <InputLabel>Lifecycle</InputLabel>
            <Select
              label="Lifecycle"
              value={waypoint.lifecycle}
              onChange={(event) => onUpdate(waypoint.id, { lifecycle: event.target.value })}
            >
              {Object.entries(calendarLifecycles).map(([value, item]) => (
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
