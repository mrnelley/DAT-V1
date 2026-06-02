import CloseIcon from '@mui/icons-material/Close';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import { Box, Button, Chip, Divider, Drawer, FormControl, IconButton, InputLabel, MenuItem, Select, Stack, Typography } from '@mui/material';
import { calendarEventTypes, calendarLifecycles, calendarRhythms, connectedWorkLabels, formatDateLabel, formatRhythmLabel, getEventDate, reviewStates, sourceStatuses } from '../../utils/calendarEvents';
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

const CalendarEventDetailsDrawer = ({
  event,
  isAdmin = false,
  onApprove,
  onClose,
  onDecline,
  onSendToOrg,
  onUpdate,
  open,
  scope,
}) => {
  if (!event) return null;

  const lifecycle = calendarLifecycles[event.lifecycle] || calendarLifecycles.scheduled;
  const review = reviewStates[event.reviewState] || reviewStates.private;
  const sourceStatus = event.sourceStatus ? sourceStatuses[event.sourceStatus] : null;
  const connectedLabel = connectedWorkLabels[event.source?.type] || event.connectedWork;
  const pending = event.reviewState === 'pending';

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', sm: 430 }, bgcolor: 'background.paper' } }}>
      <Box sx={{ p: 2.5 }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={1} sx={{ mb: 2 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h2">{event.title}</Typography>
            <Typography variant="body2">{formatDateLabel(getEventDate(event))}</Typography>
          </Box>
          <IconButton aria-label="Close calendar event details" onClick={onClose}><CloseIcon /></IconButton>
        </Stack>

        <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mb: 2 }}>
          <Chip label={event.type} color="primary" size="small" />
          <Chip label={formatRhythmLabel(event.rhythm)} color="secondary" size="small" variant="outlined" />
          <Chip label={lifecycle.label} color={lifecycle.color} size="small" />
          {sourceStatus && <Chip label={sourceStatus.label} color={sourceStatus.color} size="small" />}
          <Chip label={review.label} variant={pending ? 'outlined' : 'filled'} size="small" />
          {event.orgSubmissionState && event.scope === 'personal' && (
            <Chip label={orgSubmissionCopy[event.orgSubmissionState]} variant="outlined" size="small" />
          )}
        </Stack>

        <Stack gap={2}>
          <FormControl size="small">
            <InputLabel>Type</InputLabel>
            <Select
              label="Type"
              value={event.type}
              onChange={(changeEvent) => onUpdate(event.id, { type: changeEvent.target.value })}
            >
              {calendarEventTypes.map((type) => (
                <MenuItem key={type} value={type}>{type}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small">
            <InputLabel>Rhythm</InputLabel>
            <Select
              label="Rhythm"
              value={event.rhythm}
              onChange={(changeEvent) => onUpdate(event.id, { rhythm: changeEvent.target.value })}
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
              value={event.lifecycle}
              onChange={(changeEvent) => onUpdate(event.id, { lifecycle: changeEvent.target.value })}
            >
              {Object.entries(calendarLifecycles).map(([value, item]) => (
                <MenuItem key={value} value={value}>{item.label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            <Typography variant="caption">{connectedLabel}</Typography>
            <Typography variant="body1" fontWeight={700}>{event.source?.label || event.connectedWork}</Typography>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
            <Box sx={{ p: 1.5, bgcolor: 'background.default', borderRadius: 1 }}>
              <Typography variant="caption">Property</Typography>
              <Typography variant="body1">{event.property}</Typography>
            </Box>
            <Box sx={{ p: 1.5, bgcolor: 'background.default', borderRadius: 1 }}>
              <Typography variant="caption">Department</Typography>
              <Typography variant="body1">{event.department}</Typography>
            </Box>
          </Box>

          <Stack direction="row" alignItems="center" gap={1}>
            <UserAvatar user={event.owner} size="sm" />
            <Box>
              <Typography variant="caption">Owner</Typography>
              <Typography variant="body1">{event.owner?.name}</Typography>
            </Box>
          </Stack>

          <Divider />

          {meaningFields.map(([label, field]) => (
            <Box key={field}>
              <Typography variant="caption">{label}</Typography>
              <Typography variant="body1">{event[field]}</Typography>
            </Box>
          ))}

          {scope === 'personal' && event.orgSubmissionState !== 'pending' && event.orgSubmissionState !== 'approved' && (
            <Button variant="contained" startIcon={<SendOutlinedIcon />} onClick={() => onSendToOrg(event.id)}>
              Send to Organization Calendar
            </Button>
          )}

          {scope === 'organization' && isAdmin && pending && (
            <Stack direction="row" gap={1}>
              <Button variant="contained" color="success" startIcon={<TaskAltIcon />} onClick={() => onApprove(event.id)}>
                Approve
              </Button>
              <Button variant="outlined" color="error" onClick={() => onDecline(event.id)}>
                Decline
              </Button>
            </Stack>
          )}
        </Stack>
      </Box>
    </Drawer>
  );
};

export default CalendarEventDetailsDrawer;
