import AddIcon from '@mui/icons-material/Add';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ViewAgendaOutlinedIcon from '@mui/icons-material/ViewAgendaOutlined';
import { Box, Button, ButtonBase, Chip, FormControl, IconButton, InputLabel, MenuItem, Select, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { useMemo, useState } from 'react';
import {
  compassStatuses,
  formatMonthLabel,
  getCalendarDays,
  parseWaypointDate,
  sortWaypointsByDate,
  toDateInputValue,
  waypointRepresentations,
} from '../../utils/waypoints';
import WaypointDetailsDrawer from './WaypointDetailsDrawer';
import WaypointFormDialog from './WaypointFormDialog';

const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const representationTones = {
  Waypoint: 'primary.main',
  Marker: 'secondary.main',
  Commitment: 'warning.main',
  Touchpoint: 'success.main',
};

const representationBackgrounds = {
  Waypoint: 'rgba(7, 44, 94, 0.08)',
  Marker: 'rgba(94, 184, 168, 0.12)',
  Commitment: 'rgba(241, 172, 73, 0.16)',
  Touchpoint: 'rgba(0, 110, 92, 0.1)',
};

const matchesDate = (waypoint, dateValue) => waypoint.date === dateValue;

const WaypointPill = ({ compact = false, onClick, waypoint }) => {
  const pending = waypoint.reviewState === 'pending';
  const status = compassStatuses[waypoint.compassStatus] || compassStatuses.on_course;

  return (
    <ButtonBase
      onClick={onClick}
      sx={{
        width: '100%',
        display: 'block',
        textAlign: 'left',
        border: '1px solid',
        borderColor: pending ? 'divider' : 'transparent',
        borderStyle: pending ? 'dashed' : 'solid',
        borderRadius: 1,
        bgcolor: representationBackgrounds[waypoint.representation] || 'background.default',
        opacity: pending ? 0.58 : 1,
        overflow: 'hidden',
      }}
    >
      <Box sx={{ display: 'grid', gridTemplateColumns: '4px 1fr', minHeight: compact ? 38 : 46 }}>
        <Box sx={{ bgcolor: representationTones[waypoint.representation] || 'primary.main' }} />
        <Box sx={{ p: compact ? 0.75 : 1 }}>
          <Stack direction="row" alignItems="center" gap={0.75}>
            <Typography variant="caption" sx={{ color: status.tone, fontWeight: 700, flexShrink: 0 }}>
              {waypoint.representation}
            </Typography>
            {pending && <Chip label="Pending" size="small" variant="outlined" sx={{ height: 20 }} />}
          </Stack>
          <Typography variant="body2" color="text.primary" noWrap>{waypoint.title}</Typography>
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
  const [representationFilter, setRepresentationFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedWaypointId, setSelectedWaypointId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);

  const visibleWaypoints = useMemo(() => (
    sortWaypointsByDate(waypoints).filter((waypoint) => (
      (representationFilter === 'All' || waypoint.representation === representationFilter)
      && (statusFilter === 'All' || waypoint.compassStatus === statusFilter)
      && waypoint.reviewState !== 'declined'
    ))
  ), [representationFilter, statusFilter, waypoints]);

  const monthDays = useMemo(() => getCalendarDays(monthCursor), [monthCursor]);
  const monthStart = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1);
  const nextMonth = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1);

  const monthWaypoints = visibleWaypoints.filter((waypoint) => {
    const date = parseWaypointDate(waypoint.date);
    return date >= monthStart && date < nextMonth;
  });

  const upcomingWaypoints = visibleWaypoints.filter((waypoint) => parseWaypointDate(waypoint.date) >= monthStart);
  const selectedWaypoint = visibleWaypoints.find((waypoint) => waypoint.id === selectedWaypointId) || null;

  const shiftMonth = (amount) => {
    setMonthCursor((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  };

  const handleCreate = (values) => {
    onCreateWaypoint(values, scope);
  };

  const pendingCount = waypoints.filter((waypoint) => waypoint.reviewState === 'pending').length;

  return (
    <Box sx={{ mt: 3 }}>
      <Stack direction={{ xs: 'column', lg: 'row' }} alignItems={{ lg: 'center' }} justifyContent="space-between" gap={2} sx={{ mb: 1.5 }}>
        <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
          <Typography variant="h3">Compass Calendar</Typography>
          <Chip label={`${monthWaypoints.length} this period`} size="small" color="primary" variant="outlined" />
          {isAdmin && scope === 'organization' && pendingCount > 0 && (
            <Chip label={`${pendingCount} pending approval`} size="small" color="warning" />
          )}
        </Stack>
        <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
          <IconButton onClick={() => shiftMonth(-1)} aria-label="Previous month"><ChevronLeftIcon /></IconButton>
          <Chip label={formatMonthLabel(monthCursor)} color="primary" />
          <IconButton onClick={() => shiftMonth(1)} aria-label="Next month"><ChevronRightIcon /></IconButton>
          <ToggleButtonGroup exclusive value={view} size="small" onChange={(_, value) => value && setView(value)}>
            <ToggleButton value="calendar" aria-label="Calendar view"><CalendarMonthIcon fontSize="small" /></ToggleButton>
            <ToggleButton value="upcoming" aria-label="Upcoming view"><ViewAgendaOutlinedIcon fontSize="small" /></ToggleButton>
          </ToggleButtonGroup>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setFormOpen(true)}>Add New</Button>
        </Stack>
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.5} sx={{ mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Representation</InputLabel>
          <Select label="Representation" value={representationFilter} onChange={(event) => setRepresentationFilter(event.target.value)}>
            <MenuItem value="All">All</MenuItem>
            {waypointRepresentations.map((representation) => (
              <MenuItem key={representation} value={representation}>{representation}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 190 }}>
          <InputLabel>Status</InputLabel>
          <Select label="Status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <MenuItem value="All">All</MenuItem>
            {Object.entries(compassStatuses).map(([value, status]) => (
              <MenuItem key={value} value={value}>{status.label}</MenuItem>
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
                const dayWaypoints = visibleWaypoints.filter((waypoint) => matchesDate(waypoint, dateValue));
                const muted = day.getMonth() !== monthCursor.getMonth();

                return (
                  <Box
                    key={dateValue}
                    sx={{
                      minHeight: 132,
                      p: 0.75,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      bgcolor: 'background.paper',
                      opacity: muted ? 0.55 : 1,
                    }}
                  >
                    <Typography variant="caption" color={muted ? 'text.secondary' : 'text.primary'} fontWeight={700}>
                      {day.getDate()}
                    </Typography>
                    <Stack gap={0.5} sx={{ mt: 0.75 }}>
                      {dayWaypoints.slice(0, 3).map((waypoint) => (
                        <WaypointPill
                          key={waypoint.id}
                          compact
                          waypoint={waypoint}
                          onClick={() => setSelectedWaypointId(waypoint.id)}
                        />
                      ))}
                      {dayWaypoints.length > 3 && (
                        <Typography variant="caption">+{dayWaypoints.length - 3} more</Typography>
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
          {upcomingWaypoints.length ? upcomingWaypoints.map((waypoint) => (
            <Box key={waypoint.id} sx={{ bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider', p: 1 }}>
              <Stack direction="row" gap={1.5} alignItems="center">
                <Box sx={{ width: 74, flexShrink: 0, textAlign: 'center', borderRight: '1px solid', borderColor: 'divider', pr: 1 }}>
                  <Typography variant="h4" color="primary">{parseWaypointDate(waypoint.date).getDate()}</Typography>
                  <Typography variant="caption">{parseWaypointDate(waypoint.date).toLocaleDateString('en-US', { month: 'short' })}</Typography>
                </Box>
                <WaypointPill waypoint={waypoint} onClick={() => setSelectedWaypointId(waypoint.id)} />
              </Stack>
            </Box>
          )) : (
            <Box sx={{ bgcolor: 'background.paper', borderRadius: 1, p: 4, textAlign: 'center', border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h4">Nothing for this period.</Typography>
            </Box>
          )}
        </Box>
      )}

      {view === 'calendar' && monthWaypoints.length === 0 && (
        <Box sx={{ bgcolor: 'background.paper', borderRadius: 1, p: 4, textAlign: 'center', border: '1px solid', borderColor: 'divider', mt: 1 }}>
          <Typography variant="h4">Nothing for this period.</Typography>
        </Box>
      )}

      <WaypointDetailsDrawer
        isAdmin={isAdmin}
        onApprove={onApprove}
        onClose={() => setSelectedWaypointId(null)}
        onDecline={onDecline}
        onSendToOrg={onSendToOrg}
        onUpdate={onUpdateWaypoint}
        open={Boolean(selectedWaypoint)}
        scope={scope}
        waypoint={selectedWaypoint}
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
