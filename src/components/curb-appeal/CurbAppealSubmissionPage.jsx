import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { curbAppealStatusColors, curbAppealStatusLabels } from '../../data/curbAppeal';
import { useCurbAppeal } from '../../context/CurbAppealContext';
import PageWrapper from '../layout/PageWrapper';
import UserAvatar from '../shared/UserAvatar';

const valueLabels = {
  good: 'Good',
  needs_correction: 'Needs Correction',
  na: 'N/A',
};

const getResponse = (responses, itemId) => (
  responses.find((response) => response.itemId === itemId) || { itemId, value: '', comments: '', correctionDate: '' }
);

const CurbAppealSubmissionPage = () => {
  const navigate = useNavigate();
  const { submissionId } = useParams();
  const { checklistTemplate, getSubmissionById, submitChecklist } = useCurbAppeal();
  const submission = getSubmissionById(submissionId);
  const [responses, setResponses] = useState([]);

  useEffect(() => {
    if (submission) setResponses(submission.responses);
  }, [submission]);

  if (!submission) {
    return (
      <PageWrapper>
        <Typography variant="h1">Checklist Not Found</Typography>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/dashboard/me')} sx={{ mt: 2 }}>Back to Dashboard</Button>
      </PageWrapper>
    );
  }

  const updateResponse = (itemId, patch) => {
    setResponses((current) => {
      const existing = getResponse(current, itemId);
      const next = { ...existing, ...patch };
      return current.some((response) => response.itemId === itemId)
        ? current.map((response) => (response.itemId === itemId ? next : response))
        : [...current, next];
    });
  };

  const answeredCount = responses.filter((response) => response.value).length;
  const totalCount = checklistTemplate.sections.reduce((sum, section) => sum + section.items.length, 0);
  const needsCorrection = responses.filter((response) => response.value === 'needs_correction').length;

  const submit = () => {
    submitChecklist(submission.id, responses);
    navigate('/dashboard/me');
  };

  return (
    <PageWrapper>
      <Stack direction={{ xs: 'column', lg: 'row' }} justifyContent="space-between" gap={2} sx={{ mb: 2 }}>
        <Box>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/dashboard/me')} sx={{ mb: 1 }}>Back</Button>
          <Typography variant="h1">{checklistTemplate.title}</Typography>
          <Typography variant="body2">{submission.propertyName} - {submission.quarter} submission due {submission.dueDate}</Typography>
        </Box>
        <Stack direction="row" alignItems="center" gap={1}>
          <UserAvatar user={submission.propertyManager} size="md" />
          <Box>
            <Typography variant="body1" fontWeight={700}>{submission.propertyManager.name}</Typography>
            <Typography variant="caption">{submission.propertyManager.role}</Typography>
          </Box>
        </Stack>
      </Stack>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '0.8fr 1.2fr' }, gap: 2 }}>
        <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5, alignSelf: 'start' }}>
          <Typography variant="h3">Teams Prompt</Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>This is the lightweight quarterly card a property manager would open from Teams.</Typography>
          <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5, mt: 1.5, bgcolor: 'background.default' }}>
            <Typography variant="caption">Pulse quarterly reminder</Typography>
            <Typography variant="h4" sx={{ mt: 0.5 }}>{submission.propertyName}</Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>{checklistTemplate.dueLabel} - {checklistTemplate.cadence}</Typography>
            <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mt: 1 }}>
              <Chip label={curbAppealStatusLabels[submission.status]} color={curbAppealStatusColors[submission.status]} size="small" />
              <Chip label={`${answeredCount}/${totalCount} answered`} size="small" variant="outlined" />
              <Chip label={`${needsCorrection} corrections`} size="small" variant="outlined" />
            </Stack>
          </Box>
          <Typography variant="h4" sx={{ mt: 2, mb: 0.75 }}>After Submit</Typography>
          <Typography variant="body2">
            Pulse records this as pending review and sends Jaime her own approval card. The checklist does not credit her priority until she approves it.
          </Typography>
        </Box>

        <Stack gap={1}>
          {checklistTemplate.sections.map((section, sectionIndex) => (
            <Accordion key={section.id} defaultExpanded={sectionIndex < 2} disableGutters>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h3">{section.title}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack gap={1.25}>
                  {section.items.map((item) => {
                    const response = getResponse(responses, item.id);
                    return (
                      <Box key={item.id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.25 }}>
                        <Typography variant="body1" color="text.primary" fontWeight={600}>{item.label}</Typography>
                        <Stack direction={{ xs: 'column', md: 'row' }} gap={1} sx={{ mt: 1 }} alignItems={{ md: 'center' }}>
                          <ToggleButtonGroup
                            exclusive
                            size="small"
                            value={response.value}
                            onChange={(_, value) => value && updateResponse(item.id, { value })}
                            aria-label={`Status for ${item.label}`}
                          >
                            {Object.entries(valueLabels).map(([value, label]) => (
                              <ToggleButton key={value} value={value}>{label}</ToggleButton>
                            ))}
                          </ToggleButtonGroup>
                          <TextField
                            label="Comments"
                            size="small"
                            value={response.comments}
                            onChange={(event) => updateResponse(item.id, { comments: event.target.value })}
                            fullWidth
                          />
                          <TextField
                            label="Correction Date"
                            size="small"
                            type="date"
                            value={response.correctionDate}
                            onChange={(event) => updateResponse(item.id, { correctionDate: event.target.value })}
                            InputLabelProps={{ shrink: true }}
                            sx={{ minWidth: 165 }}
                          />
                        </Stack>
                      </Box>
                    );
                  })}
                </Stack>
              </AccordionDetails>
            </Accordion>
          ))}
          <Stack direction="row" justifyContent="flex-end" sx={{ mt: 1 }}>
            <Button
              variant="contained"
              startIcon={<SendOutlinedIcon />}
              onClick={submit}
              disabled={answeredCount < totalCount}
            >
              Submit to Jaime for Review
            </Button>
          </Stack>
        </Stack>
      </Box>
    </PageWrapper>
  );
};

export default CurbAppealSubmissionPage;
