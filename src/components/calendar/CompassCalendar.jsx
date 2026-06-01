import AddIcon from '@mui/icons-material/Add';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ViewAgendaOutlinedIcon from '@mui/icons-material/ViewAgendaOutlined';
import { Box, Button, ButtonBase, Chip, FormControl, IconButton, InputLabel, MenuItem, Select, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { useMemo, useState } from 'react';
import {
  calendarLabels,
  calendarRhythms,
  formatMonthLabel,
  formatRhythmLabel,
  getCalendarDays,
  getEventDate,
  parseCalendarDate,
  sortCalendarEventsByDate,
  sourceStatuses,
  toDateInputValue,
} from '../../utils/waypoints';
import WaypointDetailsDrawer from './WaypointDetailsDrawer';
import WaypointFormDialog from './WaypointFormDialog';

const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const labelTones = {
  Beat: 'primary.main',
  Marker: 'secondary.main',
  Commitment: 'warning.main',
  Touchpoint: 'success.main',
};

const labelBackgrounds = {
  Beat: 'rgba(7, 44, 94, 0.08)',
  Marker: 'rgba(94, 184, 168, 0.12)',
  Commitment: 'rgba(241, 172, 73, 0.16)',
  Touchpoint: 'rgba(0, 110, 92, 0.1)',
};

const matchesDate = (event, dateValue) => getEventDate(event) === dateValue;

const CalendarEventPill = ({ compact = false, event, onClick }) => {
  const pending = event.reviewState === 'pending';
  const sourceStatus = event.sourceStatus ? sourceStatuses[event.sourceStatus] : null;

  return (
    <ButtonBase
      onClick={onClick}
      aria-label={`${event.label}: ${event.title}${sourceStatus ? `. Source status ${sourceStatus.label}` : ''}${pending ? '. Pending approval' : ''}.`}
      sx={{
        width: '100%',
        display: 'block',
        textAlign: 'left',
        border: '1px solid',
        borderColor: pending ? 'divider' : 'transparent',
        borderStyle: pending ? 'dashed' : 'solid',
        borderRadius: 1,
        bgcolor: pending ? 'rgba(90, 100, 117, 0.08)' : labelBackgrounds[event.label] || 'background.default',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ display: 'grid', gridTemplateColumns: '4px 1fr', minHeight: compact ? 38 : 46 }}>
        <Box sx={{ bgcolor: labelTones[event.label] || 'primary.main' }} />
        <Box sx={{ p: compact ? 0.75 : 1 }}>
          <Stack direction="row" alignItems="center" gap={0.75} flexWrap="wrap">
            <Typography variant="caption" sx={{ color: labelTones[event.label] || 'primary.main', fontWeight: 700, flexShrink: 0 }}>
              {event.label}
            </Typography>
            {event.rhythm && (
              <Typography variant="caption" sx={{ color: 'text.secondary', flexShrink: 0 }}>
                {formatRhythmLabel(event.rhythm)}
              </Typography>
            )}
            {sourceStatus && <Chip label={sourceStatus.label} color={sourceStatus.color} size="small" sx={{ height: 20 }} />}
            {pending && <Chip label="Pending" size="small" variant="outlined" sx={{ height: 20 }} />}
          </Stack>
          <Typography variant="body2" color="text.primary" title={event.title} noWrap>{event.title}</Typography>
        </Box>
      </Box>
    </ButtonBase>
  );
};

const CompassCalendar = ({
  isAdmin = false,
  onApprove,
  onCreateWaypoint,
  onDecline,
  onSendToOrg,
  onUpdateWaypoint,
  scope = 'organization',
  waypoints = [],
}) => {
  const [monthCursor, setMonthCursor] = useState(new Date(2026, 4, 1));
  const [view, setView] = useState('calendar');
  const [labelFilter, setLabelFilter] = useState('All');
  const [rhythmFilter, setRhythmFilter] = useState('All');
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);

  const visibleEvents = useMemo(() => (
    sortCalendarEventsByDate(waypoints).filter((event) => (
      (labelFilter === 'All' || event.label === labelFilter)
      && (rhythmFilter === 'All' || event.rhythm === rhythmFilter)
      && event.reviewState !== 'declined'
    ))
  ), [labelFilter, rhythmFilter, waypoints]);

  const monthDays = useMemo(() => getCalendarDays(monthCursor), [monthCursor]);
  const monthStart = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1);
  const nextMonth = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1);

  const monthEvents = visibleEvents.filter((event) => {
    const date = parseCalendarDate(getEventDate(event));
    return date >= monthStart && date < nextMonth;
  });

  const upcomingEvents = visibleEvents.filter((event) => parseCalendarDate(getEventDate(event)) >= monthStart);
  const selectedEvent = visibleEvents.find((event) => event.id === selectedEventId) || null;

  const shiftMonth = (amount) => {
    setMonthCursor((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  };

  const handleCreate = (values) => {
    onCreateWaypoint(values, scope);
  };

  const pendingCount = waypoints.filter((event) => event.reviewState === 'pending').length;

  return (
    <Box sx={{ mt: 3 }}>
      <Stack direction={{ xs: 'column', lg: 'row' }} alignItems={{ lg: 'center' }} justifyContent="space-between" gap={2} sx={{ mb: 1.5 }}>
        <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
          <Typography variant="h3">Compass Calendar</Typography>
          <Chip label={`${monthEvents.length} this period`} size="small" color="primary" variant="outlined" />
          {isAdmin && scope === 'organization' && pendingCount > 0 && (
            <Chip label={`${pendingCount} pending approval`} size="small" color="warning" />
          )}
        </Stack>
        <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
          <IconButton onClick={() => shiftMonth(-1)} aria-label="Previous month"><ChevronLeftIcon /></IconButton>
          <Chip label={formatMonthLabel(monthCursor)} color="primary" />
          <IconButton onClick={() => shiftMonth(1)} aria-label="Next month"><ChevronRightIcon /></IconButton>
          <ToggleButtonGroup exclusive value={view} size="small" aria-label="Calendar view mode" onChange={(_, value) => value && setView(value)}>
            <ToggleButton value="calendar" aria-label="Calendar view"><CalendarMonthIcon fontSize="small" /></ToggleButton>
            <ToggleButton value="upcoming" aria-label="Upcoming view"><ViewAgendaOutlinedIcon fontSize="small" /></ToggleButton>
          </ToggleButtonGroup>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setFormOpen(true)}>Add Beat</Button>
        </Stack>
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.5} sx={{ mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Label</InputLabel>
          <Select label="Label" value={labelFilter} onChange={(event) => setLabelFilter(event.target.value)}>
            <MenuItem value="All">All</MenuItem>
            {calendarLabels.map((label) => (
              <MenuItem key={label} value={label}>{label}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Rhythm</InputLabel>
          <Select label="Rhythm" value={rhythmFilter} onChange={(event) => setRhythmFilter(event.target.value)}>
            <MenuItem value="All">All</MenuItem>
            {calendarRhythms.map((rhythm) => (
              <MenuItem key={rhythm} value={rhythm}>{formatRhythmLabel(rhythm)}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {view === 'calendar' ? (
        <Box sx={{ overflowX: 'auto' }}>
          <Box sx={{ minWidth: 760 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.75, mb: 0.75 }}>
              {weekdays.map((day) => (
                <Typography key={day} variant="caption" color="primary" fontWeight={700}>{day}</Typography>
              ))}
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.75 }}>
              {monthDays.map((day) => {
                const dateValue = toDateInputValue(day);
                const dayEvents = visibleEvents.filter((event) => matchesDate(event, dateValue));
                const muted = day.getMonth() !== monthCursor.getMonth();

                return (
                  <Box
                    key={dateValue}
                    aria-label={`${dateValue}${muted ? ', outside current month' : ''}`}
                    sx={{
                      minHeight: 132,
                      p: 0.75,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      bgcolor: muted ? 'rgba(245, 247, 250, 0.78)' : 'background.paper',
                    }}
                  >
                    <Typography variant="caption" color={muted ? 'text.secondary' : 'text.primary'} fontWeight={700}>
                      {day.getDate()}
                    </Typography>
                    <Stack gap={0.5} sx={{ mt: 0.75 }}>
                      {dayEvents.slice(0, 3).map((event) => (
                        <CalendarEventPill
                          key={event.id}
                          compact
                          event={event}
                          onClick={() => setSelectedEventId(event.id)}
                        />
                      ))}
                      {dayEvents.length > 3 && (
                        <Typography variant="caption">+{dayEvents.length - 3} more</Typography>
                      )}
                    </Stack>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' }, gap: 1 }}>
          {upcomingEvents.length ? upcomingEvents.map((event) => (
            <Box key={event.id} sx={{ bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider', p: 1 }}>
              <Stack direction="row" gap={1.5} alignItems="center">
                <Box sx={{ width: 74, flexShrink: 0, textAlign: 'center', borderRight: '1px solid', borderColor: 'divider', pr: 1 }}>
                  <Typography variant="h4" color="primary">{parseCalendarDate(getEventDate(event)).getDate()}</Typography>
                  <Typography variant="caption">{parseCalendarDate(getEventDate(event)).toLocaleDateString('en-US', { month: 'short' })}</Typography>
                </Box>
                <CalendarEventPill event={event} onClick={() => setSelectedEventId(event.id)} />
              </Stack>
            </Box>
          )) : (
            <Box sx={{ bgcolor: 'background.paper', borderRadius: 1, p: 4, textAlign: 'center', border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h4">Awaiting the first signal.</Typography>
            </Box>
          )}
        </Box>
      )}

      {view === 'calendar' && monthEvents.length === 0 && (
        <Box sx={{ bgcolor: 'background.paper', borderRadius: 1, p: 4, textAlign: 'center', border: '1px solid', borderColor: 'divider', mt: 1 }}>
          <Typography variant="h4">Awaiting the first signal.</Typography>
        </Box>
      )}

      <WaypointDetailsDrawer
        isAdmin={isAdmin}
        onApprove={onApprove}
        onClose={() => setSelectedEventId(null)}
        onDecline={onDecline}
        onSendToOrg={onSendToOrg}
        onUpdate={onUpdateWaypoint}
        open={Boolean(selectedEvent)}
        scope={scope}
        waypoint={selectedEvent}
      />
      <WaypointFormDialog
        defaultDate={toDateInputValue(monthCursor)}
        onClose={() => setFormOpen(false)}
        onCreate={handleCreate}
        open={formOpen}
      />
    </Box>
  );
};

export default CompassCalendar;
