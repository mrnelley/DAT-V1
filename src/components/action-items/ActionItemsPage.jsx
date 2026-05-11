import MoreHorizOutlinedIcon from '@mui/icons-material/MoreHorizOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import { Checkbox, Chip, IconButton, List, ListItem, ListItemText, MenuItem, Select, Stack, ToggleButton, ToggleButtonGroup, Typography, Button } from '@mui/material';
import { useState } from 'react';
import { actionItems } from '../../data/mockData';
import PageWrapper from '../layout/PageWrapper';
import UserAvatar from '../shared/UserAvatar';

const chipColor = (due) => {
  const today = '2026-05-05';
  if (due < today) return 'error';
  if (due === today) return 'warning';
  return 'default';
};

const ActionItemsPage = () => {
  const [scope, setScope] = useState('My Items');
  const [completed, setCompleted] = useState([]);
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
        {actionItems.map((item) => {
          const done = completed.includes(item.id);
          return (
            <ListItem key={item.id} divider secondaryAction={<IconButton aria-label={`More options for action item ${item.description}`}><MoreHorizOutlinedIcon /></IconButton>} sx={{ bgcolor: done ? 'rgba(90, 100, 117, 0.08)' : 'transparent' }}>
              <Checkbox checked={done} onChange={() => setCompleted((ids) => ids.includes(item.id) ? ids.filter((id) => id !== item.id) : [...ids, item.id])} />
              <ListItemText primary={<Typography sx={{ textDecoration: done ? 'line-through' : 'none' }}>{item.description}</Typography>} />
              <Stack direction="row" gap={1} alignItems="center">
                <UserAvatar user={item.owner} size="sm" />
                <Chip icon={chipColor(item.due) === 'error' ? <WarningAmberOutlinedIcon /> : undefined} label={item.due} color={chipColor(item.due)} size="small" />
                <Chip label={item.priority} color="primary" variant="outlined" size="small" />
              </Stack>
            </ListItem>
          );
        })}
      </List>
    </PageWrapper>
  );
};

export default ActionItemsPage;
