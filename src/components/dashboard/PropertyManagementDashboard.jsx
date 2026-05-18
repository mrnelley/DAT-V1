import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined';
import ConstructionOutlinedIcon from '@mui/icons-material/ConstructionOutlined';
import HomeWorkOutlinedIcon from '@mui/icons-material/HomeWorkOutlined';
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import { Box, Checkbox, Chip, FormControl, InputLabel, LinearProgress, MenuItem, Select, Stack, Switch, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { CircleMarker, MapContainer, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import CurbAppealWorkflowPanel from '../curb-appeal/CurbAppealWorkflowPanel';
import { getPropertyRisk, getPropertyTasks, portfolioOrganization, portfolioProperties, portfolioRegions } from '../../data/propertyPortfolio';
import UserAvatar from '../shared/UserAvatar';

const statusColor = {
  Steady: 'success',
  Watch: 'warning',
  Alert: 'error',
  Completed: 'success',
  Inactive: 'default',
};

const markerColor = {
  Steady: '#006e5c',
  Watch: '#f1ac49',
  Alert: '#b03a34',
  Inactive: '#6b7280',
};

const StatCard = ({ helper, icon: Icon, label, value }) => (
  <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5, minHeight: 112 }}>
    <Stack direction="row" alignItems="center" gap={1}>
      <Icon color="primary" />
      <Typography variant="caption">{label}</Typography>
    </Stack>
    <Typography variant="h2" sx={{ my: 0.5 }}>{value}</Typography>
    <Typography variant="body2">{helper}</Typography>
  </Box>
);

const MapFocusController = ({ enabled, property }) => {
  const map = useMap();

  useEffect(() => {
    if (!enabled || !property?.coordinates) return;
    map.flyTo([property.coordinates.lat, property.coordinates.lng], 12, {
      animate: true,
      duration: 0.75,
    });
  }, [enabled, map, property]);

  return null;
};

const PropertyManagementDashboard = ({ user }) => {
  const [region, setRegion] = useState('All Regions');
  const [selectedPropertyId, setSelectedPropertyId] = useState(portfolioProperties[0].id);
  const [completedTaskIds, setCompletedTaskIds] = useState([]);
  const [mapFocusEnabled, setMapFocusEnabled] = useState(false);
  const [portfolioStatusByProperty, setPortfolioStatusByProperty] = useState(() => (
    Object.fromEntries(portfolioProperties.map((property) => [property.id, property.isActivePortfolio]))
  ));

  const propertiesWithPortfolioStatus = useMemo(() => (
    portfolioProperties.map((property) => ({
      ...property,
      isActivePortfolio: portfolioStatusByProperty[property.id] ?? property.isActivePortfolio,
    }))
  ), [portfolioStatusByProperty]);

  const filteredProperties = useMemo(() => (
    propertiesWithPortfolioStatus.filter((property) => region === 'All Regions' || property.state === region)
  ), [propertiesWithPortfolioStatus, region]);

  const selectedProperty = filteredProperties.find((property) => property.id === selectedPropertyId) || filteredProperties[0] || portfolioProperties[0];
  const selectedTasks = getPropertyTasks(selectedProperty);
  const activeProperties = filteredProperties.filter((property) => property.isActivePortfolio);
  const inactiveProperties = filteredProperties.filter((property) => !property.isActivePortfolio);
  const allTasks = activeProperties.flatMap((property) => getPropertyTasks(property).map((task) => ({ ...task, property })));
  const needsAttention = activeProperties.filter((property) => getPropertyRisk(property) === 'Alert');
  const totalUnits = activeProperties.reduce((sum, property) => sum + (property.estimatedUnits || 0), 0);
  const openWorkOrders = activeProperties.reduce((sum, property) => sum + property.operations.openWorkOrders, 0);
  const agedWorkOrders = activeProperties.reduce((sum, property) => sum + property.operations.agedWorkOrders, 0);
  const selectedRisk = selectedProperty.isActivePortfolio ? getPropertyRisk(selectedProperty) : 'Inactive';

  const toggleTask = (taskId) => {
    setCompletedTaskIds((current) => (
      current.includes(taskId) ? current.filter((id) => id !== taskId) : [...current, taskId]
    ));
  };

  const togglePortfolioStatus = (propertyId) => {
    setPortfolioStatusByProperty((current) => ({
      ...current,
      [propertyId]: !current[propertyId],
    }));
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Stack direction={{ xs: 'column', lg: 'row' }} alignItems={{ lg: 'center' }} justifyContent="space-between" gap={2} sx={{ mb: 2 }}>
        <Box>
          <Stack direction="row" alignItems="center" gap={1}>
            <HomeWorkOutlinedIcon color="primary" />
            <Typography variant="h2">Property Management Dashboard</Typography>
          </Stack>
          <Typography variant="body2">Leasing, maintenance, compliance, third-party management, and property-specific priority work.</Typography>
        </Box>
        <Stack direction="row" gap={1} alignItems="center">
          <UserAvatar user={user} size="md" />
          <Box>
            <Typography variant="body1" fontWeight={700}>{user.name}</Typography>
            <Typography variant="caption">{user.role}</Typography>
          </Box>
        </Stack>
      </Stack>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 1.5, mb: 2 }}>
        <StatCard icon={MapOutlinedIcon} label="Active Communities" value={activeProperties.length} helper={`${inactiveProperties.length} inactive records still retained.`} />
        <StatCard icon={HomeWorkOutlinedIcon} label="Active Units" value={totalUnits.toLocaleString()} helper="Units counted in active portfolio status." />
        <StatCard icon={WarningAmberOutlinedIcon} label="Alert" value={needsAttention.length} helper="Properties with risk, leasing, or aging work order signals." />
        <StatCard icon={ConstructionOutlinedIcon} label="Open Work Orders" value={openWorkOrders} helper={`${agedWorkOrders} aged exceptions in this view.`} />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '1.25fr 0.9fr' }, gap: 2, mb: 2 }}>
        <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={1.5} sx={{ mb: 1.5 }}>
            <Box>
              <Stack direction="row" gap={1} alignItems="center">
                <MapOutlinedIcon color="primary" />
                <Typography variant="h3">Portfolio Map</Typography>
              </Stack>
              <Typography variant="body2">Pins use available city/address coordinates; placeholder quality is flagged in property details.</Typography>
            </Box>
            <FormControl size="small" sx={{ minWidth: 190 }}>
              <InputLabel>Region</InputLabel>
              <Select label="Region" value={region} onChange={(event) => {
                setRegion(event.target.value);
                const nextProperty = propertiesWithPortfolioStatus.find((property) => event.target.value === 'All Regions' || property.state === event.target.value);
                if (nextProperty) {
                  setSelectedPropertyId(nextProperty.id);
                  setMapFocusEnabled(true);
                }
              }}>
                {portfolioRegions.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>

          <Box aria-label="Interactive portfolio map" sx={{ height: { xs: 360, md: 430 }, borderRadius: 1, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
            <MapContainer center={[39.45, -76.15]} zoom={7} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
              <MapFocusController enabled={mapFocusEnabled} property={selectedProperty} />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {filteredProperties.map((property) => {
                const risk = property.isActivePortfolio ? getPropertyRisk(property) : 'Inactive';
                const selected = property.id === selectedProperty.id;
                return (
                  <CircleMarker
                    key={property.id}
                    center={[property.coordinates.lat, property.coordinates.lng]}
                    pathOptions={{ color: markerColor[risk], fillColor: markerColor[risk], fillOpacity: property.isActivePortfolio ? (selected ? 0.85 : 0.58) : 0.24, weight: selected ? 4 : 2 }}
                    radius={selected ? 11 : property.isActivePortfolio ? 8 : 6}
                    eventHandlers={{ click: () => {
                      setSelectedPropertyId(property.id);
                      setMapFocusEnabled(true);
                    } }}
                  >
                    <Tooltip>{property.propertyName}</Tooltip>
                    <Popup>
                      <strong>{property.propertyName}</strong><br />
                      {property.city || property.county || property.state}<br />
                      {risk} - {property.priorityLink}
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          </Box>
        </Box>

        <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1} sx={{ mb: 1 }}>
            <Box>
              <Typography variant="h3">{selectedProperty.propertyName}</Typography>
              <Typography variant="body2">{selectedProperty.address}</Typography>
            </Box>
            <Stack direction="row" gap={1} flexWrap="wrap" justifyContent="flex-end">
              <Chip label={selectedProperty.isActivePortfolio ? 'Active portfolio' : 'Inactive portfolio'} color={selectedProperty.isActivePortfolio ? 'success' : 'default'} size="small" />
              <Chip label={selectedRisk} color={statusColor[selectedRisk]} size="small" />
            </Stack>
          </Stack>
          <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mb: 1.5 }}>
            <Chip label={`${selectedProperty.estimatedUnits || 'Unknown'} units`} color="primary" size="small" variant="outlined" />
            <Chip label={selectedProperty.state} size="small" variant="outlined" />
            <Chip label={selectedProperty.coordinates.quality} size="small" variant="outlined" />
            {selectedProperty.managementType && <Chip label="Third-party management" color="warning" size="small" />}
          </Stack>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, mb: 1.5 }}>
            <Box sx={{ bgcolor: 'background.default', borderRadius: 1, p: 1 }}>
              <Typography variant="caption">Occupancy</Typography>
              <Typography variant="h4">{selectedProperty.operations.occupancy}%</Typography>
            </Box>
            <Box sx={{ bgcolor: 'background.default', borderRadius: 1, p: 1 }}>
              <Typography variant="caption">Open Work Orders</Typography>
              <Typography variant="h4">{selectedProperty.operations.openWorkOrders}</Typography>
            </Box>
            <Box sx={{ bgcolor: 'background.default', borderRadius: 1, p: 1 }}>
              <Typography variant="caption">Aged Exceptions</Typography>
              <Typography variant="h4">{selectedProperty.operations.agedWorkOrders}</Typography>
            </Box>
            <Box sx={{ bgcolor: 'background.default', borderRadius: 1, p: 1 }}>
              <Typography variant="caption">Resident Service Open</Typography>
              <Typography variant="h4">{selectedProperty.operations.residentServiceOpen}</Typography>
            </Box>
          </Box>
          <Typography variant="caption">Priority Link</Typography>
          <Typography variant="body1" fontWeight={700} sx={{ mb: 1 }}>{selectedProperty.priorityLink}</Typography>
          <Typography variant="body2" color="text.primary">{selectedProperty.housingType}</Typography>
          <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mt: 1 }}>
            {selectedProperty.residentFocus?.map((focus) => <Chip key={focus} label={focus} size="small" variant="outlined" />)}
          </Stack>
        </Box>
      </Box>

      <CurbAppealWorkflowPanel />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '0.95fr 1.3fr' }, gap: 2 }}>
        <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
          <Typography variant="h3" sx={{ mb: 1 }}>Property List</Typography>
          <Stack gap={0.75} sx={{ maxHeight: 426, overflow: 'auto', pr: 0.5 }}>
            {filteredProperties.map((property) => {
              const risk = property.isActivePortfolio ? getPropertyRisk(property) : 'Inactive';
              const selected = property.id === selectedProperty.id;
              return (
                <Box
                  key={property.id}
                  onClick={() => {
                    setSelectedPropertyId(property.id);
                    setMapFocusEnabled(true);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelectedPropertyId(property.id);
                      setMapFocusEnabled(true);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Select ${property.propertyName}. ${risk}.`}
                  sx={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    border: '1px solid',
                    borderColor: selected ? 'primary.main' : 'divider',
                    borderRadius: 1,
                    bgcolor: selected ? 'rgba(7, 44, 94, 0.06)' : property.isActivePortfolio ? 'background.paper' : 'rgba(90,100,117,0.08)',
                    p: 1,
                    cursor: 'pointer',
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" gap={1}>
                    <Box>
                      <Typography variant="body1" fontWeight={700}>{property.propertyName}</Typography>
                      <Typography variant="caption">{property.city || property.county || property.state} - {property.estimatedUnits} units</Typography>
                    </Box>
                    <Stack direction="row" gap={0.75} alignItems="center" onClick={(event) => event.stopPropagation()}>
                      <Chip label={property.isActivePortfolio ? 'Active' : 'Inactive'} color={property.isActivePortfolio ? 'success' : 'default'} size="small" />
                      <Chip label={risk} color={statusColor[risk]} size="small" />
                      <Switch
                        checked={property.isActivePortfolio}
                        onChange={() => togglePortfolioStatus(property.id)}
                        inputProps={{ 'aria-label': `Toggle active portfolio status for ${property.propertyName}` }}
                        size="small"
                      />
                    </Stack>
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        </Box>

        <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={1} sx={{ mb: 1.5 }}>
            <Box>
              <Stack direction="row" gap={1} alignItems="center">
                <AssignmentTurnedInOutlinedIcon color="primary" />
                <Typography variant="h3">Property-Aware Task Tracker</Typography>
              </Stack>
              <Typography variant="body2">Tasks are generated from leasing, maintenance, preservation, third-party, accessibility, and resident service signals.</Typography>
            </Box>
            <Chip label={`${allTasks.filter((task) => ['Watch', 'Alert'].includes(task.status)).length} on watch`} color="warning" />
          </Stack>

          <Stack gap={1.25} sx={{ mb: 2 }}>
            {selectedTasks.map((task) => {
              const done = completedTaskIds.includes(task.id);
              return (
                <Box key={task.id} sx={{ border: '1px solid', borderColor: done ? 'success.main' : 'divider', borderRadius: 1, p: 1.25, bgcolor: done ? 'rgba(0, 110, 92, 0.08)' : 'transparent' }}>
                  <Stack direction="row" alignItems="flex-start" gap={1}>
                    <Checkbox checked={done} onChange={() => toggleTask(task.id)} inputProps={{ 'aria-label': `Mark task complete: ${task.title}` }} />
                    <Box sx={{ flex: 1 }}>
                      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1}>
                        <Typography variant="body1" fontWeight={700}>{task.title}</Typography>
                        <Chip label={done ? 'Completed' : task.status} color={done ? 'success' : statusColor[task.status]} size="small" />
                      </Stack>
                      <Typography variant="body2">{task.priority} - due {task.due}</Typography>
                    </Box>
                  </Stack>
                </Box>
              );
            })}
          </Stack>

          <Typography variant="h4" sx={{ mb: 1 }}>Cross-Portfolio Priority Queue</Typography>
          <Table aria-label="Cross-portfolio property priority queue" size="small">
            <TableHead>
              <TableRow>
                <TableCell>Property</TableCell>
                <TableCell>Task</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {allTasks.slice(0, 8).map((task) => (
                <TableRow key={`${task.property.id}-${task.id}`} hover>
                  <TableCell>{task.property.propertyName}</TableCell>
                  <TableCell>{task.title}</TableCell>
                  <TableCell><Chip label={task.status} color={statusColor[task.status]} size="small" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Box>
    </Box>
  );
};

export default PropertyManagementDashboard;
