import { Box, Button, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { useActionFeedback } from '../../context/ActionFeedbackContext';
import { initiatives, priorities } from '../../data/mockData';
import { useAuth } from '../../hooks/useAuth';
import PageWrapper from '../layout/PageWrapper';
import PermissionGate from '../shared/PermissionGate';
import PriorityRow from '../priorities/PriorityRow';
import InitiativeCard from './InitiativeCard';

const InitiativesPage = () => {
  const { user } = useAuth();
  const { unavailable } = useActionFeedback();
  const [selected, setSelected] = useState(null);
  return (
    <PageWrapper>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Typography variant="h1">Annual Initiatives</Typography>
        <PermissionGate roles={['ELT']}><Button variant="contained" onClick={() => unavailable('initiative creation is not connected to persistence yet.')}>Add Initiative</Button></PermissionGate>
      </Stack>
      {selected ? (
        <Box sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 2 }}>
          <Button onClick={() => setSelected(null)} sx={{ mb: 1 }}>Back to Initiatives</Button>
          <Typography variant="h2">{selected.title}</Typography>
          <Typography variant="body2" sx={{ my: 1 }}>{selected.description}</Typography>
          <Typography variant="h4" sx={{ mt: 2, mb: 1 }}>Quarterly Milestones</Typography>
          <Typography variant="body2">Q1 baseline, Q2 execution, Q3 adoption, Q4 sustainment.</Typography>
          <Typography variant="h4" sx={{ mt: 2, mb: 1 }}>Connected Priorities</Typography>
          {priorities.map((priority) => <PriorityRow key={priority.id} currentUser={user} priority={priority} />)}
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 2 }}>
          {initiatives.map((initiative) => <InitiativeCard key={initiative.id} initiative={initiative} onClick={() => setSelected(initiative)} onUnavailable={unavailable} />)}
        </Box>
      )}
    </PageWrapper>
  );
};

export default InitiativesPage;
