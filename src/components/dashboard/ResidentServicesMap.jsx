import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import RoomOutlinedIcon from '@mui/icons-material/RoomOutlined';
import { Box, Chip, Stack, Typography } from '@mui/material';
import { CircleMarker, MapContainer, Popup, TileLayer, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const residentServicesProperties = [
  { name: 'Duke Manor Apartments', city: 'Lancaster, PA', coordinates: [40.0379, -76.3055], openReferrals: 18, needsAssessments: 12, status: 'High Touch' },
  { name: 'The Apartments at College Avenue', city: 'Lancaster, PA', coordinates: [40.0502, -76.3263], openReferrals: 12, needsAssessments: 9, status: 'Active' },
  { name: '1528 West Apartments', city: 'Allentown, PA', coordinates: [40.6029, -75.4942], openReferrals: 14, needsAssessments: 10, status: 'Active' },
  { name: 'Beach Run Apartments', city: 'Lebanon County, PA', coordinates: [40.3409, -76.4113], openReferrals: 9, needsAssessments: 7, status: 'Active' },
  { name: 'Oak Bottom Village', city: 'Quarryville, PA', coordinates: [39.8971, -76.1636], openReferrals: 6, needsAssessments: 4, status: 'Watch' },
  { name: 'Apartments at Heatherwoods', city: 'Lancaster County, PA', coordinates: [40.0756, -76.3109], openReferrals: 11, needsAssessments: 8, status: 'Active' },
  { name: 'Willow Ridge Apartments', city: 'Hershey, PA', coordinates: [40.2859, -76.6502], openReferrals: 7, needsAssessments: 5, status: 'Active' },
  { name: 'Southgate Apartments', city: 'Pennsylvania', coordinates: [40.097, -76.305], openReferrals: 8, needsAssessments: 6, status: 'Active' },
  { name: 'Saint Peter Apartments', city: 'Pennsylvania', coordinates: [40.065, -76.355], openReferrals: 10, needsAssessments: 8, status: 'High Touch' },
  { name: 'Lancaster Apartments', city: 'Lancaster, PA', coordinates: [40.041, -76.307], openReferrals: 13, needsAssessments: 11, status: 'Active' },
  { name: 'Ash Park Terrace', city: 'Coatesville, PA', coordinates: [39.9832, -75.8238], openReferrals: 9, needsAssessments: 6, status: 'Watch' },
  { name: 'Brandywine Center', city: 'Coatesville, PA', coordinates: [39.984, -75.8201], openReferrals: 15, needsAssessments: 12, status: 'High Touch' },
  { name: 'Claymont Street Apartments', city: 'Wilmington, DE', coordinates: [39.7391, -75.5398], openReferrals: 8, needsAssessments: 7, status: 'Active' },
  { name: 'Newtowne Apartments', city: 'Lancaster, PA', coordinates: [40.0467, -76.3027], openReferrals: 11, needsAssessments: 9, status: 'Active' },
  { name: 'Larkspur Crossing', city: 'Kennett Square, PA', coordinates: [39.8468, -75.7116], openReferrals: 7, needsAssessments: 6, status: 'Watch' },
  { name: 'Mill Creek', city: 'Lancaster County, PA', coordinates: [40.052, -76.247], openReferrals: 9, needsAssessments: 7, status: 'Active' },
  { name: 'River Run Meadows', city: 'Lancaster County, PA', coordinates: [40.105, -76.21], openReferrals: 6, needsAssessments: 5, status: 'Active' },
  { name: 'The Flats Phase IV', city: 'Lancaster, PA', coordinates: [40.0394, -76.2977], openReferrals: 12, needsAssessments: 10, status: 'Active' },
  { name: 'Wyndamere', city: 'Lancaster County, PA', coordinates: [40.089, -76.351], openReferrals: 7, needsAssessments: 6, status: 'Watch' },
  { name: 'Elizabeth Cornish Landing', city: 'Bridgeville, DE', coordinates: [38.7426, -75.6044], openReferrals: 10, needsAssessments: 8, status: 'High Touch' },
];

const statusColor = {
  Active: '#006e5c',
  Watch: '#f1ac49',
  'High Touch': '#b03a34',
};

const ResidentServicesMap = () => {
  const totalReferrals = residentServicesProperties.reduce((sum, property) => sum + property.openReferrals, 0);
  const highTouchCount = residentServicesProperties.filter((property) => property.status === 'High Touch').length;

  return (
    <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5, mb: 2 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={1.5} sx={{ mb: 1.5 }}>
        <Box>
          <Stack direction="row" gap={1} alignItems="center">
            <FavoriteBorderOutlinedIcon color="primary" />
            <Typography variant="h3">Resident Services Coverage Map</Typography>
          </Stack>
          <Typography variant="body2">Demo map of properties with resident services access and active referral signals.</Typography>
        </Box>
        <Stack direction="row" gap={1} flexWrap="wrap">
          <Chip label={`${residentServicesProperties.length} properties`} color="primary" variant="outlined" />
          <Chip label={`${totalReferrals} open referrals`} color="warning" variant="outlined" />
          <Chip label={`${highTouchCount} high touch`} color="error" variant="outlined" />
        </Stack>
      </Stack>

      <Box aria-label="Resident services property coverage map" sx={{ height: { xs: 360, md: 430 }, border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
        <MapContainer center={[39.8, -76.0]} zoom={7} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {residentServicesProperties.map((property) => (
            <CircleMarker
              key={property.name}
              center={property.coordinates}
              pathOptions={{
                color: statusColor[property.status],
                fillColor: statusColor[property.status],
                fillOpacity: 0.62,
                weight: 2,
              }}
              radius={property.status === 'High Touch' ? 10 : 8}
            >
              <Tooltip>{property.name}</Tooltip>
              <Popup>
                <strong>{property.name}</strong><br />
                {property.city}<br />
                {property.status}<br />
                {property.openReferrals} open referrals<br />
                {property.needsAssessments} needs assessments
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </Box>

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
