import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FilterListOutlinedIcon from '@mui/icons-material/FilterListOutlined';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { Box, Button, IconButton, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useActionFeedback } from '../../context/ActionFeedbackContext';
import { useOperatingData } from '../../context/OperatingDataContext';
import { useReportingPeriod } from '../../context/ReportingPeriodContext';
import { recordMatchesReportingPeriod } from '../../data/reportingPeriods';
import { useAuth } from '../../hooks/useAuth';
import PageWrapper from '../layout/PageWrapper';
import EditPriorityPanel from './EditPriorityPanel';
import FilterPanel from './FilterPanel';
import PriorityRow from './PriorityRow';
import ReportingPeriodSelect from '../shared/ReportingPeriodSelect';

const PrioritiesPage = () => {
  const { user } = useAuth();
  const { unavailable } = useActionFeedback();
  const { enterprisePriorities, saveEnterprisePriority, strategicPlan } = useOperatingData();
  const { selectedPeriod, selectedPeriodId } = useReportingPeriod();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [expandedAll, setExpandedAll] = useState(false);
  const visiblePriorities = enterprisePriorities.filter((priority) => (
    recordMatchesReportingPeriod(priority, selectedPeriodId)
  ));

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
        <Stack data-tour-id="priorities-header" direction="row" alignItems="center" gap={1}>
          <Typography variant="h1">Enterprise Priorities</Typography>
          <IconButton title="Open priorities help" aria-label="Open priorities help" onClick={() => unavailable('priority help content has not been authored yet.')}><HelpOutlineIcon /></IconButton>
        </Stack>
        <Stack direction="row" gap={1} flexWrap="wrap">
          <Button data-tour-id="priorities-add-button" variant="contained" onClick={() => setPanelOpen(true)}>Add Enterprise Priority</Button>
          <Button variant="outlined" onClick={() => unavailable('bulk priority value updates need a connected metric source.')}>Update Priority Values</Button>
          <Button startIcon={<FilterListOutlinedIcon />} onClick={() => setFiltersOpen((value) => !value)}>Filter</Button>
          <Button startIcon={<ExpandMoreIcon />} onClick={() => setExpandedAll((value) => !value)}>Expand All</Button>
          <Button startIcon={<ContentCopyIcon />} onClick={() => unavailable('previous-quarter Enterprise Priority import is not connected yet.')}>Copy Previous Priorities</Button>
        </Stack>
      </Stack>
      <Stack direction="row" justifyContent="center" sx={{ mb: 2 }}>
        <ReportingPeriodSelect />
      </Stack>
      <FilterPanel open={filtersOpen} />
      <Box>
        {visiblePriorities.length
          ? visiblePriorities.map((priority) => <PriorityRow key={`${priority.id}-${expandedAll}`} currentUser={user} priority={priority} expandedAll={expandedAll} />)
          : <Typography variant="body2" color="text.secondary">No Enterprise Priorities have been created for {selectedPeriod.label}.</Typography>}
      </Box>
      <EditPriorityPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        onSave={saveEnterprisePriority}
        strategicPlan={strategicPlan}
      />
    </PageWrapper>
  );
};

export default PrioritiesPage;
