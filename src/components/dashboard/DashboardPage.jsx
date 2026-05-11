import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { Box, Button, Chip, FormControl, IconButton, InputLabel, MenuItem, Select, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { metrics } from '../../data/mockData';
import { useWaypoints } from '../../context/WaypointContext';
import CompassCalendar from '../calendar/CompassCalendar';
import KpiDetailModal from '../shared/KpiDetailModal';
import PageWrapper from '../layout/PageWrapper';
import CriticalNumbersSection from './CriticalNumbersSection';
import MyKpisSection from './MyKpisSection';

const DashboardPage = ({ company = false }) => {
  const [team, setTeam] = useState('Critical Numbers for Leadership');
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

  return (
    <PageWrapper>
      <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ md: 'center' }} justifyContent="space-between" gap={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h1">Dashboard</Typography>
          <Typography variant="body2">{company ? 'Company-wide accountability view' : 'Personal operating view'}</Typography>
        </Box>
        <Stack direction="row" gap={1} flexWrap="wrap">
          <Button variant={edit ? 'contained' : 'outlined'} startIcon={<DragIndicatorIcon />} onClick={() => setEdit((value) => !value)}>
            {edit ? 'Save Order' : 'Edit'}
          </Button>
          <Stack direction="row" alignItems="center">
            <IconButton><ChevronLeftIcon /></IconButton>
            <Chip label="1/24/2026 -> 4/24/2026" color="primary" variant="outlined" />
            <IconButton><ChevronRightIcon /></IconButton>
          </Stack>
          <FormControl size="small" sx={{ minWidth: 230 }}>
            <InputLabel>Team Filter</InputLabel>
            <Select label="Team Filter" value={team} onChange={(event) => setTeam(event.target.value)}>
              {['Critical Numbers for Leadership', 'Operations', 'Resident Services', 'Asset Management'].map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
            </Select>
          </FormControl>
        </Stack>
      </Stack>
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
          <MyKpisSection metrics={metrics.filter((metric) => metric.owner.id === 'u1' || metric.owner.id === 'u2')} onMetricClick={setSelectedMetric} />
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
