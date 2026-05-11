import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { Box, IconButton, List, ListItem, ListItemIcon, ListItemText, Tab, Tabs, TextField, Typography } from '@mui/material';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import KpiDetailModal from '../shared/KpiDetailModal';
import PageWrapper from '../layout/PageWrapper';
import HuddleHeader from './HuddleHeader';
import MembersPanel from './MembersPanel';
import MonthlyTargets from './MonthlyTargets';

const HuddlesPage = () => {
  const { id = 'daily-ops' } = useParams();
  const [tab, setTab] = useState(0);
  const [metric, setMetric] = useState(null);

  return (
    <PageWrapper>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '3fr 1fr' }, gap: 3 }}>
        <Box>
          <HuddleHeader name={id.split('-').map((part) => part[0].toUpperCase() + part.slice(1)).join(' ')} />
          <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ mb: 2 }}>
            <Tab label="Agenda" />
            <Tab label="Description" />
          </Tabs>
          {tab === 0 ? (
            <List>
              {['Review monthly targets', 'Discuss stucks and owner follow-up', 'Confirm top action items'].map((item) => (
                <ListItem key={item}>
                  <ListItemIcon><FiberManualRecordIcon color="secondary" fontSize="small" /></ListItemIcon>
                  <ListItemText primary={item} />
                </ListItem>
              ))}
            </List>
          ) : <Typography variant="body2">Weekly operating rhythm for surfacing progress, blockers, and commitments.</Typography>}
          <MonthlyTargets onMetricClick={setMetric} />
          <Typography variant="h4" sx={{ mb: 1 }}>Private Notes</Typography>
          <TextField multiline minRows={5} fullWidth placeholder="Click or Tap to enter something..." sx={{ mb: 3 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="h4" sx={{ flex: 1 }}>Documents</Typography>
            <IconButton><AddOutlinedIcon /></IconButton>
          </Box>
          <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary', bgcolor: 'background.paper', borderRadius: 2 }}>
            <DescriptionOutlinedIcon />
            <Typography variant="body2">No documents yet</Typography>
          </Box>
        </Box>
        <MembersPanel />
      </Box>
      <KpiDetailModal metric={metric} open={Boolean(metric)} onClose={() => setMetric(null)} />
    </PageWrapper>
  );
};

export default HuddlesPage;
