import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FilterListOutlinedIcon from '@mui/icons-material/FilterListOutlined';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { Box, Button, Chip, IconButton, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useActionFeedback } from '../../context/ActionFeedbackContext';
import { priorities } from '../../data/mockData';
import { useAuth } from '../../hooks/useAuth';
import PageWrapper from '../layout/PageWrapper';
import EditPriorityPanel from './EditPriorityPanel';
import FilterPanel from './FilterPanel';
import PriorityRow from './PriorityRow';

const PrioritiesPage = () => {
  const { user } = useAuth();
  const { unavailable } = useActionFeedback();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [expandedAll, setExpandedAll] = useState(false);

  useEffect(() => {
    if (searchParams.get('new') !== '1') return;

    setPanelOpen(true);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('new');
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams]);

  return (
    <PageWrapper>
      <Stack direction={{ xs: 'column', lg: 'row' }} alignItems={{ lg: 'center' }} justifyContent="space-between" gap={2} sx={{ mb: 2 }}>
        <Stack direction="row" alignItems="center" gap={1}>
          <Typography variant="h1">Organizational Priorities</Typography>
          <IconButton title="Open priorities help" aria-label="Open priorities help" onClick={() => unavailable('priority help content has not been authored yet.')}><HelpOutlineIcon /></IconButton>
        </Stack>
        <Stack direction="row" gap={1} flexWrap="wrap">
          <Button variant="contained" onClick={() => setPanelOpen(true)}>Add Organizational Priority</Button>
          <Button variant="outlined" onClick={() => unavailable('bulk priority value updates need a connected metric source.')}>Update Priority Values</Button>
          <Button startIcon={<FilterListOutlinedIcon />} onClick={() => setFiltersOpen((value) => !value)}>Filter</Button>
          <Button startIcon={<ExpandMoreIcon />} onClick={() => setExpandedAll((value) => !value)}>Expand All</Button>
          <Button startIcon={<ContentCopyIcon />} onClick={() => unavailable('previous-quarter organizational priority import is not connected yet.')}>Copy Previous Priorities</Button>
        </Stack>
      </Stack>
      <Stack direction="row" justifyContent="center" sx={{ mb: 2 }}>
        <Chip label="1/24/2026 -> 4/24/2026" color="primary" variant="outlined" />
      </Stack>
      <FilterPanel open={filtersOpen} />
      <Box>{priorities.map((priority) => <PriorityRow key={`${priority.id}-${expandedAll}`} currentUser={user} priority={priority} expandedAll={expandedAll} />)}</Box>
      <EditPriorityPanel open={panelOpen} onClose={() => setPanelOpen(false)} />
    </PageWrapper>
  );
};

export default PrioritiesPage;
