import MoreHorizOutlinedIcon from '@mui/icons-material/MoreHorizOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import { Box, Button, Checkbox, Chip, IconButton, List, ListItem, MenuItem, Select, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { useState } from 'react';
import { actionItems } from '../../data/mockData';
import { useAuth } from '../../hooks/useAuth';
import PageWrapper from '../layout/PageWrapper';
import UserAvatar from '../shared/UserAvatar';

const chipColor = (due) => {
  const today = '2026-05-13';
  if (due < today) return 'error';
  if (due === today) return 'warning';
  return 'default';
};

const ActionItemsPage = () => {
  const { user } = useAuth();
  const [scope, setScope] = useState('My Items');
  const [completed, setCompleted] = useState([]);
  const visibleItems = actionItems.filter((item) => scope === 'All Items' || item.owner.id === user.id);

  return (
    <PageWrapper>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h1">Action Items</Typography>
        <Button variant="contained">Add Action Item</Button>
      </Stack>
      <Stack direction="row" gap={2} sx={{ mb: 2 }}>
        <ToggleButtonGroup exclusive value={scope} onChange={(_, value) => value && setScope(value)}>
          <ToggleButton value="My Items">My Items</ToggleButton>
          <ToggleButton value="All Items">All Items</ToggleButton>
        </ToggleButtonGroup>
        <Select size="small" defaultValue="Open"><MenuItem value="Open">Open</MenuItem><MenuItem value="In Progress">In Progress</MenuItem><MenuItem value="Complete">Complete</MenuItem></Select>
      </Stack>
      <List sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>
        {visibleItems.map((item) => {
          const done = completed.includes(item.id);
          const canManage = item.owner.id === user.id;
          return (
            <ListItem
              key={item.id}
              divider
              sx={{ alignItems: 'flex-start', gap: 1, bgcolor: done ? 'rgba(90, 100, 117, 0.08)' : 'transparent' }}
            >
              <Checkbox disabled={!canManage} checked={done} onChange={() => setCompleted((ids) => ids.includes(item.id) ? ids.filter((id) => id !== item.id) : [...ids, item.id])} sx={{ mt: 0.25 }} />
              <Box sx={{ flex: 1, minWidth: 240 }}>
                <Typography sx={{ textDecoration: done ? 'line-through' : 'none' }}>{item.description}</Typography>
                <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap" sx={{ mt: 0.75 }}>
                  <UserAvatar user={item.owner} size="sm" />
                  <Chip icon={chipColor(item.due) === 'error' ? <WarningAmberOutlinedIcon /> : undefined} label={item.due} color={chipColor(item.due)} size="small" />
                  <Chip label={item.priority} color="primary" variant="outlined" size="small" />
                  <Chip label={item.strategicPillar} variant="outlined" size="small" />
                </Stack>
              </Box>
              <IconButton disabled={!canManage} aria-label={`More options for action item ${item.description}`}><MoreHorizOutlinedIcon /></IconButton>
            </ListItem>
          );
        })}
      </List>
    </PageWrapper>
  );
};

export default ActionItemsPage;
