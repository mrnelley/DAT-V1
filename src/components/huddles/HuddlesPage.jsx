import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { Box, Button, Chip, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Stack, Tab, Tabs, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useOperatingData } from '../../context/OperatingDataContext';
import KpiDetailModal from '../shared/KpiDetailModal';
import PageWrapper from '../layout/PageWrapper';
import HuddleHeader from './HuddleHeader';
import MembersPanel from './MembersPanel';
import MonthlyTargets from './MonthlyTargets';

const HuddleDirectory = ({ huddles }) => {
  const navigate = useNavigate();

  return (
    <PageWrapper>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h1">Huddles</Typography>
          <Typography variant="body2">Schedule operating conversations, choose members, and prepare the items the group needs to work.</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddOutlinedIcon />} onClick={() => navigate('/huddles/new')}>Schedule Huddle</Button>
      </Stack>
      <List sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
        {huddles.map((huddle) => (
          <ListItemButton key={huddle.id} divider onClick={() => navigate(`/huddles/${huddle.id}`)}>
            <ListItemText primary={huddle.name} secondary={`${huddle.date} - ${huddle.recurrence} - ${huddle.memberIds.length} members`} />
            <Chip label={huddle.when === 'today' ? 'Today' : 'Upcoming'} color={huddle.when === 'today' ? 'primary' : 'default'} size="small" />
          </ListItemButton>
        ))}
      </List>
    </PageWrapper>
  );
};

const HuddlesPage = () => {
  const { id } = useParams();
  const { getHuddle, huddles, updateHuddle } = useOperatingData();
  const [tab, setTab] = useState(0);
  const [metric, setMetric] = useState(null);

  if (!id) return <HuddleDirectory huddles={huddles} />;

  const huddle = getHuddle(id);
  if (!huddle) return <HuddleDirectory huddles={huddles} />;
  const agendaItems = [...(huddle.agenda || []), ...(huddle.items || []).map((item) => item.title)];

  return (
    <PageWrapper>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '3fr 1fr' }, gap: 3 }}>
        <Box>
          <HuddleHeader huddle={huddle} />
          <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ mb: 2 }}>
            <Tab label="Agenda" />
            <Tab label="Description" />
          </Tabs>
          {tab === 0 ? (
            <List>
              {agendaItems.map((item) => (
                <ListItem key={item}>
                  <ListItemIcon><FiberManualRecordIcon color="secondary" fontSize="small" /></ListItemIcon>
                  <ListItemText primary={item} />
                </ListItem>
              ))}
            </List>
          ) : <Typography variant="body2">{huddle.description}</Typography>}
          <MonthlyTargets onMetricClick={setMetric} />
          <Typography variant="h4" sx={{ mb: 1 }}>Private Notes</Typography>
          <TextField
            multiline
            minRows={5}
            fullWidth
            defaultValue={huddle.privateNotes || ''}
            placeholder="Click or tap to enter something..."
            onBlur={(event) => updateHuddle(huddle.id, { privateNotes: event.target.value })}
            sx={{ mb: 3 }}
          />
        </Box>
        <MembersPanel memberIds={huddle.memberIds} />
      </Box>
      <KpiDetailModal metric={metric} open={Boolean(metric)} onClose={() => setMetric(null)} />
    </PageWrapper>
  );
};

export default HuddlesPage;
