import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PushPinIcon from '@mui/icons-material/PushPin';
import { Box, Button, Chip, IconButton, Stack, Table, TableBody, TableCell, TableHead, TableRow, Tooltip, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useOperatingData } from '../../context/OperatingDataContext';
import { useAuth } from '../../hooks/useAuth';
import { formatDateTime } from '../../utils/formatters';
import PageWrapper from '../layout/PageWrapper';
import EmptyState from '../shared/EmptyState';
import UserAvatar from '../shared/UserAvatar';
import AddStuckModal from './AddStuckModal';

const StuckTable = ({ emptyBody, rows, title, updateStuck }) => (
  <>
    <Typography variant="h4" sx={{ mt: 3, mb: 1 }}>{title}</Typography>
    {!rows.length ? (
      <EmptyState icon={<CheckCircleOutlineIcon color="success" />} title={emptyBody} body="No active stucks are waiting here." />
    ) : (
      <Table aria-label={title}>
        <TableHead>
          <TableRow>
            <TableCell>Task</TableCell>
            <TableCell>Stuck Description</TableCell>
            <TableCell>Need Help From</TableCell>
            <TableCell>Stuck Since</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((stuck) => (
            <TableRow key={stuck.id} hover>
              <TableCell>{stuck.sourceLabel || 'Unlinked task'}</TableCell>
              <TableCell>{stuck.description}</TableCell>
              <TableCell><Stack direction="row" gap={1} alignItems="center"><UserAvatar user={stuck.helpFrom} size="sm" />{stuck.helpFrom.name}</Stack></TableCell>
              <TableCell>{formatDateTime(stuck.since)}</TableCell>
              <TableCell><Chip label={stuck.status} color={stuck.status === 'resolved' ? 'success' : 'warning'} size="small" /></TableCell>
              <TableCell align="right">
                <Tooltip title={stuck.pinned ? 'Unpin stuck' : 'Pin stuck'}>
                  <IconButton aria-label={`Pin stuck: ${stuck.description}`} onClick={() => updateStuck(stuck.id, { pinned: !stuck.pinned })}>
                    <PushPinIcon fontSize="small" color={stuck.pinned ? 'primary' : 'inherit'} />
                  </IconButton>
                </Tooltip>
                {stuck.status !== 'resolved' && (
                  <Button size="small" onClick={() => updateStuck(stuck.id, { resolvedAt: new Date().toISOString(), status: 'resolved' })}>
                    Resolve
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )}
  </>
);

const StucksPage = () => {
  const { user } = useAuth();
  const { addStuck, getTasksForUser, stucks, updateStuck } = useOperatingData();
  const [searchParams, setSearchParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  const [activeOnly, setActiveOnly] = useState(true);
  const userTasks = getTasksForUser(user.id);
  const relevantStucks = stucks.filter((stuck) => (
    (stuck.personStuck?.id === user.id || stuck.helpFrom?.id === user.id)
    && (!activeOnly || stuck.status !== 'resolved')
  ));
  const holdingUp = relevantStucks.filter((stuck) => stuck.helpFrom?.id === user.id);
  const stuckOn = relevantStucks.filter((stuck) => stuck.personStuck?.id === user.id);

  useEffect(() => {
    if (searchParams.get('new') !== '1') return;
    setOpen(true);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('new');
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const saveStuck = (stuck) => {
    addStuck(stuck);
    setOpen(false);
  };

  return (
    <PageWrapper>
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="space-between" gap={1} sx={{ mb: 2 }}>
        <Box data-tour-id="stucks-header">
          <Typography variant="h1">Manage Stucks</Typography>
          <Typography variant="body2">Every stuck is tied to a task and names the person who can help move it.</Typography>
        </Box>
        <Stack direction="row" gap={1}>
          <Button data-tour-id="stucks-issue-button" variant="contained" onClick={() => setOpen(true)} disabled={!userTasks.length}>Issue a Stuck</Button>
          <Button variant={activeOnly ? 'contained' : 'outlined'} onClick={() => setActiveOnly((value) => !value)}>Active Only</Button>
        </Stack>
      </Stack>

      <StuckTable title="Things I Am Holding Up" emptyBody="You are not holding anyone up right now." rows={holdingUp} updateStuck={updateStuck} />
      <StuckTable title="Things I Am Stuck On" emptyBody="You do not have an active stuck." rows={stuckOn} updateStuck={updateStuck} />

      <AddStuckModal
        open={open}
        onClose={() => setOpen(false)}
        onSave={saveStuck}
        tasks={userTasks}
        user={user}
      />
    </PageWrapper>
  );
};

export default StucksPage;
