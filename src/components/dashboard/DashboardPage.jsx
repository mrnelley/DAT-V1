import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { Box, Button, Chip, FormControl, IconButton, InputLabel, MenuItem, Select, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { metrics } from '../../data/mockData';
import { useWaypoints } from '../../context/WaypointContext';
import { useAuth } from '../../hooks/useAuth';
import AdvocacyDashboard from '../advocacy/AdvocacyDashboard';
import CompassCalendar from '../calendar/CompassCalendar';
import KpiDetailModal from '../shared/KpiDetailModal';
import PageWrapper from '../layout/PageWrapper';
import CriticalNumbersSection from './CriticalNumbersSection';
import FocusedDashboard from './FocusedDashboard';
import MyKpisSection from './MyKpisSection';

const DashboardPage = ({ company = false }) => {
  const { user } = useAuth();
  const teamOptions = company ? ['Critical Numbers for Leadership', 'Operations', 'Resident Services', 'Asset Management'] : user.teams;
  const [team, setTeam] = useState(teamOptions[0]);
  const [edit, setEdit] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState(null);
  const {
    addWaypoint,
    approveWaypoint,
    declineWaypoint,
    isAdmin,
    organizationWaypoints,
    personalWaypoints,
    sendToOrg,
    updateWaypoint,
  } = useWaypoints();

  useEffect(() => {
    setTeam(teamOptions[0]);
  }, [user.id, company]);

  return (
    <PageWrapper>
      <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ md: 'center' }} justifyContent="space-between" gap={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h1">{company ? 'Dashboard' : `${user.name.split(' ')[0]}'s Dashboard`}</Typography>
          <Typography variant="body2">{company ? 'Company-wide accountability view' : `${user.department} operating view`}</Typography>
        </Box>
        <Stack direction="row" gap={1} flexWrap="wrap">
          <Button variant={edit ? 'contained' : 'outlined'} startIcon={<DragIndicatorIcon />} onClick={() => setEdit((value) => !value)}>
            {edit ? 'Save Order' : 'Edit'}
          </Button>
          <Stack direction="row" alignItems="center">
            <IconButton aria-label="Previous dashboard period"><ChevronLeftIcon /></IconButton>
            <Chip label="1/24/2026 -> 4/24/2026" color="primary" variant="outlined" />
            <IconButton aria-label="Next dashboard period"><ChevronRightIcon /></IconButton>
          </Stack>
          <FormControl size="small" sx={{ minWidth: 230 }}>
            <InputLabel>Team Filter</InputLabel>
            <Select label="Team Filter" value={team} onChange={(event) => setTeam(event.target.value)}>
              {teamOptions.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
            </Select>
          </FormControl>
        </Stack>
      </Stack>
      {!company && (user.dashboardFocus === 'advocacy' ? <AdvocacyDashboard /> : <FocusedDashboard user={user} />)}
      <CriticalNumbersSection metrics={metrics} teamName={team} onMetricClick={setSelectedMetric} />
      {company ? (
        <CompassCalendar
          isAdmin={isAdmin}
          onApprove={approveWaypoint}
          onCreateWaypoint={addWaypoint}
          onDecline={declineWaypoint}
          onSendToOrg={sendToOrg}
          onUpdateWaypoint={updateWaypoint}
          scope="organization"
          waypoints={organizationWaypoints}
        />
      ) : (
        <>
          <MyKpisSection
            metrics={metrics.filter((metric) => metric.owner.id === user.id).length ? metrics.filter((metric) => metric.owner.id === user.id) : metrics.slice(0, 2)}
            onMetricClick={setSelectedMetric}
          />
          <CompassCalendar
            onApprove={approveWaypoint}
            onCreateWaypoint={addWaypoint}
            onDecline={declineWaypoint}
            onSendToOrg={sendToOrg}
            onUpdateWaypoint={updateWaypoint}
            scope="personal"
            waypoints={personalWaypoints}
          />
        </>
      )}
      <KpiDetailModal metric={selectedMetric} open={Boolean(selectedMetric)} onClose={() => setSelectedMetric(null)} />
    </PageWrapper>
  );
};

export default DashboardPage;
