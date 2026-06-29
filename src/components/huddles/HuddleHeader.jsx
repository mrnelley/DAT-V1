import AddIcon from '@mui/icons-material/Add';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import PrintIcon from '@mui/icons-material/Print';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import SettingsIcon from '@mui/icons-material/Settings';
import VideoCallOutlinedIcon from '@mui/icons-material/VideoCallOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import { Button, Chip, IconButton, Stack, Tooltip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useActionFeedback } from '../../context/ActionFeedbackContext';

const HuddleHeader = ({ huddle, onSendWeeklyGoalsCard }) => {
  const navigate = useNavigate();
  const { unavailable } = useActionFeedback();

  return (
    <Stack gap={1.5} sx={{ mb: 2 }}>
      <Button sx={{ alignSelf: 'flex-start' }} onClick={() => navigate('/huddles')}>Back to Huddles</Button>
      <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
        <Chip label={huddle.name} color="primary" sx={{ height: 40, fontSize: '0.9rem' }} />
        <Chip label={huddle.date} variant="outlined" />
        <Tooltip title="Print huddle"><IconButton aria-label="Print huddle" onClick={() => window.print()}><PrintIcon /></IconButton></Tooltip>
        <Tooltip title="Manage notifications"><IconButton aria-label="Manage huddle notifications" onClick={() => navigate('/notifications')}><NotificationsNoneIcon /></IconButton></Tooltip>
        <Tooltip title="Huddle schedule"><IconButton aria-label="Open huddle calendar" onClick={() => navigate(`/huddles/${huddle.id}/settings`)}><CalendarMonthIcon /></IconButton></Tooltip>
        <Tooltip title="Huddle settings"><IconButton aria-label="Open huddle settings" onClick={() => navigate(`/huddles/${huddle.id}/settings`)}><SettingsIcon /></IconButton></Tooltip>
        <Tooltip title="Add huddle item"><IconButton aria-label="Add huddle item" onClick={() => navigate(`/huddles/${huddle.id}/items/new`)}><AddIcon /></IconButton></Tooltip>
        {huddle.weeklyTrackerPrompt && (
          <Button
            variant="outlined"
            startIcon={<SendOutlinedIcon />}
            onClick={onSendWeeklyGoalsCard}
          >
            Send Weekly Goals Card
          </Button>
        )}
        <Button variant="contained" color="error" startIcon={<WarningAmberOutlinedIcon />} onClick={() => navigate('/stucks')}>Stucks</Button>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<VideoCallOutlinedIcon />}
          onClick={() => huddle.teamsLink ? window.location.assign(huddle.teamsLink) : unavailable('the Teams meeting link has not been added in huddle settings.')}
        >
          Join Meeting
        </Button>
      </Stack>
    </Stack>
  );
};

export default HuddleHeader;
