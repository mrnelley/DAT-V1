import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FilterListOutlinedIcon from '@mui/icons-material/FilterListOutlined';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { Box, Button, Chip, IconButton, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { priorities } from '../../data/mockData';
import PageWrapper from '../layout/PageWrapper';
import EditPriorityPanel from './EditPriorityPanel';
import FilterPanel from './FilterPanel';
import PriorityRow from './PriorityRow';

const PrioritiesPage = () => {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [expandedAll, setExpandedAll] = useState(false);

  return (
    <PageWrapper>
      <Stack direction={{ xs: 'column', lg: 'row' }} alignItems={{ lg: 'center' }} justifyContent="space-between" gap={2} sx={{ mb: 2 }}>
        <Stack direction="row" alignItems="center" gap={1}>
          <Typography variant="h1">Manage Priorities</Typography>
          <IconButton aria-label="Open priorities help"><HelpOutlineIcon /></IconButton>
        </Stack>
        <Stack direction="row" gap={1} flexWrap="wrap">
          <Button variant="contained" onClick={() => setPanelOpen(true)}>Add Priority</Button>
          <Button variant="outlined">Update Priority Values</Button>
          <Button startIcon={<FilterListOutlinedIcon />} onClick={() => setFiltersOpen((value) => !value)}>Filter</Button>
          <Button startIcon={<ExpandMoreIcon />} onClick={() => setExpandedAll((value) => !value)}>Expand All</Button>
          <Button startIcon={<ContentCopyIcon />}>Copy Previous Priorities</Button>
        </Stack>
      </Stack>
      <Stack direction="row" justifyContent="center" sx={{ mb: 2 }}>
        <Chip label="1/24/2026 -> 4/24/2026" color="primary" variant="outlined" />
      </Stack>
      <FilterPanel open={filtersOpen} />
      <Box>{priorities.map((priority) => <PriorityRow key={`${priority.id}-${expandedAll}`} priority={priority} expandedAll={expandedAll} />)}</Box>
      <EditPriorityPanel open={panelOpen} onClose={() => setPanelOpen(false)} />
    </PageWrapper>
  );
};

export default PrioritiesPage;
