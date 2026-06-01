import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined';
import { Box, Button, Chip, IconButton, List, ListItem, Stack, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from '@mui/material';
import React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationsContext';
import PageWrapper from '../layout/PageWrapper';
import EmptyState from '../shared/EmptyState';
import UserAvatar from '../shared/UserAvatar';

const notificationTypeLabels = {
  due_soon: 'Due soon',
  escalation: 'Escalation',
  overdue: 'Overdue',
  review_requested: 'Review',
  stuck_issued: 'Stuck',
  task_assigned: 'Task',
};

const channelLabels = {
  email: 'Email',
  in_app: 'Compass',
  teams: 'Teams',
};

const formatCreatedAt = (value) => new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  month: 'short',
}).format(new Date(value));

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { dismissNotification, markAllAsRead, markAsRead, notifications, unreadCount } = useNotifications();
  const [scope, setScope] = useState('all');
  const filteredNotifications = scope === 'unread'
    ? notifications.filter((notification) => !notification.readAt)
    : notifications;

  const openNotification = (notification) => {
    markAsRead(notification.id);
    if (notification.actionPath) {
      navigate(notification.actionPath);
    }
  };

  return (
    <PageWrapper>
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" gap={2} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h1">Notifications</Typography>
          <Typography variant="body2" color="text.secondary">
            A durable Compass inbox for tasks, stucks, reviews, reminders, and failed delivery fallbacks.
          </Typography>
        </Box>
        <Button startIcon={<CheckCircleOutlineIcon />} onClick={markAllAsRead} disabled={!unreadCount}>
          Mark all read
        </Button>
      </Stack>
      <Stack direction="row" gap={1} alignItems="center" sx={{ mb: 2 }}>
        <ToggleButtonGroup exclusive size="small" value={scope} onChange={(_, value) => value && setScope(value)}>
          <ToggleButton value="all">All</ToggleButton>
          <ToggleButton value="unread">Unread</ToggleButton>
        </ToggleButtonGroup>
        <Chip label={`${unreadCount} unread`} color={unreadCount ? 'primary' : 'default'} variant={unreadCount ? 'filled' : 'outlined'} />
      </Stack>
      {filteredNotifications.length === 0 ? (
        <EmptyState
          icon={<NotificationsNoneOutlinedIcon />}
          title="No notifications"
          body="When Compass has something that needs your attention, it will land here."
        />
      ) : (
        <List sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>
          {filteredNotifications.map((notification) => {
            const unread = !notification.readAt;

            return (
              <ListItem
                key={notification.id}
                divider
                sx={{
                  alignItems: 'flex-start',
                  gap: 1.5,
                  bgcolor: unread ? 'rgba(94, 184, 168, 0.11)' : 'transparent',
                }}
              >
                <Box sx={{ width: 10, pt: 1.25 }}>
                  {unread && <Box aria-label="Unread notification" sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main' }} />}
                </Box>
                <UserAvatar user={notification.actor || notification.recipient} size="sm" />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
                    <Typography fontWeight={unread ? 800 : 600}>{notification.title}</Typography>
                    <Chip label={notificationTypeLabels[notification.notificationType] || notification.notificationType} size="small" color={notification.priority === 'high' ? 'error' : 'default'} variant={notification.priority === 'high' ? 'filled' : 'outlined'} />
                    <Chip label={channelLabels[notification.channel] || notification.channel} size="small" variant="outlined" />
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {notification.body}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
                    {formatCreatedAt(notification.createdAt)}
                  </Typography>
                </Box>
                <Tooltip title="Open source">
                  <IconButton aria-label={`Open notification ${notification.title}`} onClick={() => openNotification(notification)}>
                    <OpenInNewOutlinedIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Dismiss">
                  <IconButton aria-label={`Dismiss notification ${notification.title}`} onClick={() => dismissNotification(notification.id)}>
                    <DeleteOutlineIcon />
                  </IconButton>
                </Tooltip>
              </ListItem>
            );
          })}
        </List>
      )}
    </PageWrapper>
  );
};

export default NotificationsPage;
