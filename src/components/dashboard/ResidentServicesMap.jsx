import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import RoomOutlinedIcon from '@mui/icons-material/RoomOutlined';
import { Box, Chip, Stack, Typography } from '@mui/material';
import { CircleMarker, MapContainer, Popup, TileLayer, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useOperatingData } from '../../context/OperatingDataContext';

const statusColor = {
  Steady: '#006e5c',
  Watch: '#f1ac49',
  Alert: '#b03a34',
  'No Data': '#6b7280',
};

const normalizeStatus = (property) => {
  const status = String(property.status || '').toLowerCase();
  if (status === 'alert' || status === 'high touch') return 'Alert';
  if (status === 'watch') return 'Watch';
  if (status === 'active' || status === 'steady') return 'Steady';
  return property.hasOperatingSnapshot ? 'Steady' : 'No Data';
};

const ResidentServicesMap = () => {
  const { properties } = useOperatingData();
  const mappedProperties = properties.filter((property) => property.coordinates);
  const totalOpenServices = properties.reduce(
    (sum, property) => sum + Number(property.operations?.residentServiceOpen || 0),
    0,
  );
  const alertCount = properties.filter((property) => normalizeStatus(property) === 'Alert').length;

  return (
    <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5, mb: 2 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={1.5} sx={{ mb: 1.5 }}>
        <Box>
          <Stack direction="row" gap={1} alignItems="center">
            <FavoriteBorderOutlinedIcon color="primary" />
            <Typography variant="h3">Resident Services Coverage Map</Typography>
          </Stack>
          <Typography variant="body2">Properties with available coordinates and their current resident-services operating signals.</Typography>
        </Box>
        <Stack direction="row" gap={1} flexWrap="wrap">
          <Chip label={`${properties.length} properties`} color="primary" variant="outlined" />
          <Chip label={`${totalOpenServices} open service items`} color="warning" variant="outlined" />
          <Chip label={`${alertCount} alerts`} color="error" variant="outlined" />
        </Stack>
      </Stack>

      {mappedProperties.length ? (
        <Box aria-label="Resident services property coverage map" sx={{ height: { xs: 360, md: 430 }, border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
          <MapContainer center={[39.8, -76.0]} zoom={7} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {mappedProperties.map((property) => {
              const status = normalizeStatus(property);
              return (
                <CircleMarker
                  key={property.id}
                  center={[property.coordinates.lat, property.coordinates.lng]}
                  pathOptions={{
                    color: statusColor[status],
                    fillColor: statusColor[status],
                    fillOpacity: 0.62,
                    weight: 2,
                  }}
                  radius={status === 'Alert' ? 10 : 8}
                >
                  <Tooltip>{property.propertyName}</Tooltip>
                  <Popup>
                    <strong>{property.propertyName}</strong><br />
                    {[property.city, property.state].filter(Boolean).join(', ')}<br />
                    {status}<br />
                    {property.operations?.residentServiceOpen || 0} open service items
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </Box>
      ) : (
        <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2 }}>
          <Typography variant="h4">No mapped properties</Typography>
          <Typography variant="body2">Properties will appear after address coordinates are recorded.</Typography>
        </Box>
      )}

      <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mt: 1.25 }}>
        {Object.entries(statusColor).map(([label, color]) => (
          <Stack key={label} direction="row" gap={0.75} alignItems="center">
            <RoomOutlinedIcon sx={{ color }} fontSize="small" />
            <Typography variant="caption">{label}</Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
};

export default ResidentServicesMap;
