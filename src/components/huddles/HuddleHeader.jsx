import AddIcon from '@mui/icons-material/Add';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import PrintIcon from '@mui/icons-material/Print';
import SettingsIcon from '@mui/icons-material/Settings';
import VideoCallOutlinedIcon from '@mui/icons-material/VideoCallOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import { Button, Chip, IconButton, Stack, TextField } from '@mui/material';

const huddleActions = [
  [PrintIcon, 'Print huddle'],
  [NotificationsNoneIcon, 'Manage huddle notifications'],
  [CalendarMonthIcon, 'Open huddle calendar'],
  [SettingsIcon, 'Open huddle settings'],
  [AddIcon, 'Add huddle item'],
];

const HuddleHeader = ({ name }) => (
  <Stack gap={1.5} sx={{ mb: 2 }}>
    <Button sx={{ alignSelf: 'flex-start' }}>Back to Manage Priorities</Button>
    <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
      <Chip label={name} color="primary" sx={{ height: 40, fontSize: '0.9rem' }} />
      <TextField type="date" size="small" defaultValue="2026-05-05" inputProps={{ 'aria-label': 'Huddle date' }} />
      {huddleActions.map(([Icon, label]) => <IconButton aria-label={label} key={label}><Icon /></IconButton>)}
      <Button variant="contained" color="error" startIcon={<WarningAmberOutlinedIcon />}>STUCKS 2</Button>
      <Button variant="contained" color="secondary" startIcon={<VideoCallOutlinedIcon />}>Join Meeting</Button>
    </Stack>
  </Stack>
);

export default HuddleHeader;
