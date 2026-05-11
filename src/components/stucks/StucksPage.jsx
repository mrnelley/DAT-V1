import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PushPinIcon from '@mui/icons-material/PushPin';
import { Button, IconButton, Stack, Table, TableBody, TableCell, TableHead, TableRow, Tooltip, Typography } from '@mui/material';
import { useState } from 'react';
import { stucks } from '../../data/mockData';
import { formatDateTime } from '../../utils/formatters';
import PageWrapper from '../layout/PageWrapper';
import EmptyState from '../shared/EmptyState';
import UserAvatar from '../shared/UserAvatar';
import AddStuckModal from './AddStuckModal';

const StucksPage = () => {
  const [open, setOpen] = useState(false);

  return (
    <PageWrapper>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Typography variant="h1">Manage Stucks</Typography>
        <Stack direction="row" gap={1}>
          <Button variant="contained" onClick={() => setOpen(true)}>Add New Stuck</Button>
          <Button>Show Active Stucks</Button>
        </Stack>
      </Stack>
      <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1 }}>
        <Typography variant="h4">Things I Am Holding Up</Typography>
        <Tooltip title="These are stucks other people have assigned to you."><InfoOutlinedIcon fontSize="small" color="primary" /></Tooltip>
      </Stack>
      <EmptyState icon={<CheckCircleOutlineIcon color="success" />} title="You are not holding anyone up right now." body="No active requests are waiting on you." />
      <Typography variant="h4" sx={{ mt: 3, mb: 1 }}>Things I Am Stuck On</Typography>
      <Table>
        <TableHead><TableRow><TableCell>Stuck Description</TableCell><TableCell>Need Help From</TableCell><TableCell>Stuck Since</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
        <TableBody>
          {stucks.map((stuck) => (
            <TableRow key={stuck.id} hover>
              <TableCell>{stuck.description}</TableCell>
              <TableCell><Stack direction="row" gap={1} alignItems="center"><UserAvatar user={stuck.helpFrom} size="sm" />{stuck.helpFrom.name}</Stack></TableCell>
              <TableCell>{formatDateTime(stuck.since)}</TableCell>
              <TableCell>{[PushPinIcon, EditOutlinedIcon, ChatBubbleOutlineIcon].map((Icon, index) => <IconButton key={index}><Icon fontSize="small" /></IconButton>)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <AddStuckModal open={open} onClose={() => setOpen(false)} onSave={() => setOpen(false)} />
    </PageWrapper>
  );
};

export default StucksPage;
