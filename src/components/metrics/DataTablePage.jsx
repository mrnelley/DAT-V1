import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import { Box, Chip, InputAdornment, Tab, Table, TableBody, TableCell, TableHead, TableRow, Tabs, TextField, Typography } from '@mui/material';
import { useMemo, useState } from 'react';
import { useOperatingData } from '../../context/OperatingDataContext';
import PageWrapper from '../layout/PageWrapper';

const tabs = ['All Work', 'Weekly Action Items', 'Queued Tasks', 'Stucks'];

const normalize = (value) => String(value || '').toLowerCase();

const DataTablePage = () => {
  const { queuedTasks, stucks, weeklyActionItems } = useOperatingData();
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState('');

  const rows = useMemo(() => [
    ...weeklyActionItems.map((item) => ({
      alignment: item.weeklyPriorityTitle || item.sourceLabel || 'Weekly Priority',
      due: item.due || item.dueDate || '',
      id: `weekly-${item.id}`,
      owner: item.owner?.name || '',
      pillar: item.strategicPillar || '',
      status: item.status || 'Open',
      title: item.description || item.title,
      type: 'Weekly Action Item',
    })),
    ...queuedTasks.map((item) => ({
      alignment: item.workplanTitle || item.priority || 'One-off queue',
      due: item.due || '',
      id: `queue-${item.id}`,
      owner: item.owner?.name || '',
      pillar: item.strategicPillar || '',
      status: item.status || 'Open',
      title: item.description,
      type: 'Queued Task',
    })),
    ...stucks.map((item) => ({
      alignment: item.sourceLabel || 'Unlinked blocker',
      due: item.createdAt || '',
      id: `stuck-${item.id}`,
      owner: item.personStuck?.name || '',
      pillar: item.strategicPillar || '',
      status: item.status || 'Active',
      title: item.description,
      type: 'Stuck',
    })),
  ], [queuedTasks, stucks, weeklyActionItems]);

  const visibleRows = rows.filter((row) => {
    const matchesTab = tab === 0
      || (tab === 1 && row.type === 'Weekly Action Item')
      || (tab === 2 && row.type === 'Queued Task')
      || (tab === 3 && row.type === 'Stuck');
    const matchesSearch = !search || Object.values(row).some((value) => normalize(value).includes(normalize(search)));
    return matchesTab && matchesSearch;
  });

  return (
    <PageWrapper>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h1">Operating Data Table ({rows.length})</Typography>
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          Administrator view of every tracked weekly Action Item, queued task, and stuck.
        </Typography>
      </Box>
      <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ mb: 2 }}>
        {tabs.map((label) => <Tab key={label} label={label} />)}
      </Tabs>
      <TextField
        aria-label="Search operating data"
        fullWidth
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search actions, owners, status, or alignment"
        size="small"
        value={search}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchOutlinedIcon /></InputAdornment> }}
        sx={{ mb: 2, maxWidth: 560 }}
      />
      <Box sx={{ overflowX: 'auto', bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {['Type', 'Action / Task', 'Owner', 'Status', 'Due / Created', 'Source / Alignment', 'Strategic Pillar'].map((head) => <TableCell key={head}>{head}</TableCell>)}
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleRows.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell><Chip label={row.type} size="small" variant="outlined" /></TableCell>
                <TableCell sx={{ minWidth: 280 }}><Typography color="text.primary" fontWeight={700}>{row.title}</Typography></TableCell>
                <TableCell>{row.owner || 'Unassigned'}</TableCell>
                <TableCell><Chip label={row.status} size="small" /></TableCell>
                <TableCell>{row.due || 'Not set'}</TableCell>
                <TableCell sx={{ minWidth: 220 }}>{row.alignment}</TableCell>
                <TableCell>{row.pillar || 'Not linked'}</TableCell>
              </TableRow>
            ))}
            {!visibleRows.length && (
              <TableRow>
                <TableCell colSpan={7}>
                  <Typography variant="body2">No tracked work matches this view yet.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Box>
    </PageWrapper>
  );
};

export default DataTablePage;
