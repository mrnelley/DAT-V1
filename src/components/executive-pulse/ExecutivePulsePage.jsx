import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import TrackChangesOutlinedIcon from '@mui/icons-material/TrackChangesOutlined';
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, LinearProgress, MenuItem, Select, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useReportingPeriod } from '../../context/ReportingPeriodContext';
import { executivePulseSeed, scorecardStatusOptions } from '../../data/executivePulseSeed';
import {
  getPreviousReportingPeriod,
  getReportingPeriod,
  getReportingPeriodMonths,
  normalizeReportingPeriodId,
} from '../../data/reportingPeriods';
import PageWrapper from '../layout/PageWrapper';
import ReportingPeriodSelect from '../shared/ReportingPeriodSelect';

const storageKey = 'hdc_compass_executive_pulse_scorecards_v3';
const legacyStorageKey = 'hdc_compass_executive_pulse_scorecard_v2';

const statusMeta = {
  'On Track': { color: 'success', fill: '#006e5c', soft: 'rgba(0, 110, 92, 0.09)', tone: 'success.main' },
  'Needs Attention': { color: 'warning', fill: '#f1ac49', soft: 'rgba(241, 172, 73, 0.16)', tone: 'warning.main' },
  'Off Track': { color: 'error', fill: '#b03a34', soft: 'rgba(176, 58, 52, 0.1)', tone: 'error.main' },
  'No Data': { color: 'default', fill: '#5a6475', soft: 'rgba(90, 100, 117, 0.09)', tone: 'text.secondary' },
};

const getEditableMetricFields = (reportingPeriod) => {
  const months = getReportingPeriodMonths(reportingPeriod);
  const previousPeriod = getPreviousReportingPeriod(reportingPeriod);

  return [
    ['kpi', 'KPI'],
    ['dept', 'Dept'],
    ['target', 'Target'],
    ['priorPeriodResult', previousPeriod?.label || 'Prior Period'],
    ['month1', months[0]],
    ['month2', months[1]],
    ['month3', months[2]],
    ['periodResult', reportingPeriod.label],
    ['progress', '% Progress'],
    ['currentStatus', 'Current Status'],
  ];
};

const cloneSeed = (reportingPeriodId) => ({
  ...JSON.parse(JSON.stringify(executivePulseSeed)),
  reportingPeriodId,
});

const normalizeMetric = (metric) => {
  const normalized = {
    ...metric,
    month1: metric.month1 ?? metric.april ?? '',
    month2: metric.month2 ?? metric.may ?? '',
    month3: metric.month3 ?? metric.june ?? '',
    periodResult: metric.periodResult ?? metric.q2 ?? '',
    priorPeriodResult: metric.priorPeriodResult ?? metric.q1 ?? '',
  };
  ['april', 'may', 'june', 'q1', 'q2'].forEach((field) => delete normalized[field]);
  return normalized;
};

const normalizeScorecard = (scorecard, reportingPeriodId) => {
  const normalized = {
    ...scorecard,
    reportingPeriodId,
    scorecards: scorecard.scorecards.map((card) => ({
      ...card,
      metrics: card.metrics.map(normalizeMetric),
    })),
  };
  delete normalized.period;
  delete normalized.quarter;
  return normalized;
};

const readScorecardsByPeriod = () => {
  if (typeof window === 'undefined') return {};

  try {
    const stored = JSON.parse(window.localStorage.getItem(storageKey));
    if (stored && typeof stored === 'object') {
      return Object.fromEntries(Object.entries(stored).map(([reportingPeriodId, scorecard]) => [
        normalizeReportingPeriodId(reportingPeriodId),
        normalizeScorecard(scorecard, normalizeReportingPeriodId(reportingPeriodId)),
      ]));
    }

    const legacy = JSON.parse(window.localStorage.getItem(legacyStorageKey));
    if (!legacy?.scorecards) return {};

    const reportingPeriodId = normalizeReportingPeriodId(legacy);
    const migrated = normalizeScorecard(legacy, reportingPeriodId);
    window.localStorage.removeItem(legacyStorageKey);
    return { [reportingPeriodId]: migrated };
  } catch {
    return {};
  }
};

const saveScorecardsByPeriod = (scorecardsByPeriod) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(storageKey, JSON.stringify(scorecardsByPeriod));
  }
};

const parseProgress = (value) => {
  const parsed = Number(String(value || '').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? Math.max(0, Math.min(100, parsed)) : null;
};

const metricScore = (metric) => {
  const progress = parseProgress(metric.progress);
  if (progress !== null) return progress;
  if (metric.status === 'On Track') return 100;
  if (metric.status === 'Needs Attention') return 55;
  if (metric.status === 'Off Track') return 20;
  return 0;
};

const cardProgress = (card) => {
  if (!card.metrics.length) return 0;
  return Math.round(card.metrics.reduce((total, metric) => total + metricScore(metric), 0) / card.metrics.length);
};

const statusDistribution = (card) => scorecardStatusOptions.map((status) => ({
  fill: statusMeta[status].fill,
  name: status.replace('Needs Attention', 'Watch').replace('Off Track', 'Off'),
  value: card.metrics.filter((metric) => metric.status === status).length,
}));

const metricValue = (value) => (value === undefined || value === null || value === '' ? '-' : value);

const csvEscape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;

const downloadCsv = (filename, rows) => {
  if (!rows.length || typeof document === 'undefined') return;

  const headers = Object.keys(rows[0]);
  const csv = [
    headers.map(csvEscape).join(','),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(',')),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const flattenScorecardRows = (scorecard) => scorecard.scorecards.flatMap((card) => (
  card.metrics.map((metric) => ({
    card: card.title,
    currentStatus: metric.currentStatus,
    dept: metric.dept,
    kpi: metric.kpi,
    month1: metric.month1,
    month2: metric.month2,
    month3: metric.month3,
    orgPriority: card.orgPriority,
    reportingPeriod: getReportingPeriod(scorecard.reportingPeriodId).label,
    reportingPeriodId: scorecard.reportingPeriodId,
    preparedFor: scorecard.preparedFor,
    progress: metric.progress,
    periodResult: metric.periodResult,
    priorPeriodResult: metric.priorPeriodResult,
    signal: metric.status,
    strategicGoal: card.strategicGoal,
    target: metric.target,
  }))
));

const StatusDistributionChart = ({ card }) => {
  const data = statusDistribution(card);
  const total = Math.max(1, data.reduce((sum, item) => sum + item.value, 0));

  return (
    <Box sx={{ display: 'grid', gap: 0.75 }}>
      <Box sx={{ display: 'flex', height: 14, overflow: 'hidden', borderRadius: 999, bgcolor: 'background.default' }}>
        {data.map((item) => (
          <Box
            aria-hidden="true"
            key={item.name}
            sx={{ bgcolor: item.fill, minWidth: item.value ? 8 : 0, width: `${(item.value / total) * 100}%` }}
          />
        ))}
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 0.5 }}>
        {data.map((item) => (
          <Box key={item.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.45, minWidth: 0 }}>
            <Box aria-hidden="true" sx={{ bgcolor: item.fill, borderRadius: 999, flex: '0 0 8px', height: 8 }} />
            <Typography variant="caption" noWrap>{item.name} {item.value}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

const ExecutiveScorecardCard = ({ card, onOpen, reportingPeriod }) => {
  const meta = statusMeta[card.status] || statusMeta['No Data'];
  const progress = cardProgress(card);
  const attentionCount = card.metrics.filter((metric) => ['Needs Attention', 'Off Track'].includes(metric.status)).length;
  const monthLabels = getReportingPeriodMonths(reportingPeriod);
  const previousPeriod = getPreviousReportingPeriod(reportingPeriod);

  return (
    <Box
      data-tour-id="executive-pulse-scorecard-card"
      aria-label={`Open Executive Pulse scorecard for ${card.title}`}
      component="button"
      onClick={onOpen}
      type="button"
      sx={{
        appearance: 'none',
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderLeft: '7px solid',
        borderLeftColor: card.accent,
        borderRadius: 1,
        boxShadow: '0 3px 12px rgba(7, 44, 94, 0.08)',
        color: 'text.primary',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 360,
        p: 0,
        textAlign: 'left',
        transition: 'border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease',
        '&:focus-visible': { outline: '3px solid', outlineColor: 'secondary.main', outlineOffset: 2 },
        '&:hover': { borderColor: card.accent, boxShadow: '0 10px 24px rgba(7, 44, 94, 0.15)', transform: 'translateY(-2px)' },
      }}
    >
      <Box sx={{ p: 1.5, pb: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, textTransform: 'uppercase' }}>{card.strategicGoal}</Typography>
            <Typography variant="h3" sx={{ mt: 0.4 }}>{card.title}</Typography>
            <Typography variant="body2" sx={{ mt: 0.35 }}>{card.orgPriority}</Typography>
          </Box>
          <Chip label={card.status} color={meta.color} size="small" />
        </Stack>

        <Box sx={{ bgcolor: meta.soft, borderRadius: 1, mt: 1.25, p: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
            <Typography variant="caption" fontWeight={800}>Scorecard signal</Typography>
            <Typography variant="caption" fontWeight={800} color={meta.tone}>{progress}%</Typography>
          </Stack>
          <LinearProgress color={meta.color === 'default' ? 'primary' : meta.color} variant="determinate" value={progress} sx={{ mt: 0.75 }} />
          <Typography variant="caption" display="block" sx={{ mt: 0.75 }}>
            {attentionCount} of {card.metrics.length} KPI rows need attention or are off track.
          </Typography>
        </Box>
      </Box>

      <Box sx={{ px: 1.5, pb: 1, flex: 1 }}>
        <Stack gap={0.8}>
          {card.metrics.slice(0, 4).map((metric) => {
            const metricMeta = statusMeta[metric.status] || statusMeta['No Data'];
            return (
              <Box key={metric.id} sx={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 1, alignItems: 'start', borderBottom: '1px solid', borderColor: 'divider', pb: 0.85 }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" noWrap title={metric.kpi}>{metric.kpi}</Typography>
                  <Typography variant="caption">{metric.dept} | Target {metric.target}</Typography>
                  <Typography variant="caption" display="block" sx={{ mt: 0.45, color: 'text.primary', fontWeight: 700 }}>
                    {previousPeriod?.label || 'Prior period'}: {metricValue(metric.priorPeriodResult)}
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ color: 'text.secondary' }}>
                    {reportingPeriod.label}: {monthLabels[0]} {metricValue(metric.month1)} | {monthLabels[1]} {metricValue(metric.month2)} | {monthLabels[2]} {metricValue(metric.month3)} | Total {metricValue(metric.periodResult)}
                  </Typography>
                </Box>
                <Box sx={{ bgcolor: metricMeta.soft, borderRadius: 1, minWidth: 74, px: 0.8, py: 0.65, textAlign: 'right' }}>
                  <Typography variant="caption" display="block" sx={{ color: metricMeta.tone, fontWeight: 800 }}>Progress</Typography>
                  <Typography variant="body2" fontWeight={800} color={metricMeta.tone}>{metricValue(metric.progress)}</Typography>
                </Box>
              </Box>
            );
          })}
        </Stack>
      </Box>

      <Box sx={{ borderTop: '1px solid', borderColor: 'divider', px: 1.5, py: 1 }}>
        <StatusDistributionChart card={card} />
      </Box>
    </Box>
  );
};

const ExecutivePulsePage = () => {
  const { selectedPeriod, selectedPeriodId } = useReportingPeriod();
  const [scorecardsByPeriod, setScorecardsByPeriod] = useState(readScorecardsByPeriod);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const scorecard = scorecardsByPeriod[selectedPeriodId] || cloneSeed(selectedPeriodId);
  const selectedCard = scorecard.scorecards.find((card) => card.id === selectedCardId);
  const editableMetricFields = useMemo(() => getEditableMetricFields(selectedPeriod), [selectedPeriod]);

  useEffect(() => {
    setSelectedCardId(null);
  }, [selectedPeriodId]);
  const scorecardSummary = useMemo(() => {
    const metrics = scorecard.scorecards.flatMap((card) => card.metrics);
    return {
      attention: metrics.filter((metric) => metric.status === 'Needs Attention').length,
      offTrack: metrics.filter((metric) => metric.status === 'Off Track').length,
      onTrack: metrics.filter((metric) => metric.status === 'On Track').length,
      total: metrics.length,
    };
  }, [scorecard]);

  const updateScorecard = (updater) => {
    setScorecardsByPeriod((current) => {
      const currentScorecard = current[selectedPeriodId] || cloneSeed(selectedPeriodId);
      const nextScorecard = { ...updater(currentScorecard), reportingPeriodId: selectedPeriodId };
      delete nextScorecard.period;
      delete nextScorecard.quarter;
      const nextScorecardsByPeriod = { ...current, [selectedPeriodId]: nextScorecard };
      saveScorecardsByPeriod(nextScorecardsByPeriod);
      return nextScorecardsByPeriod;
    });
  };

  const updateRootField = (field, value) => updateScorecard((current) => ({ ...current, [field]: value }));

  const updateDiscussionQuestion = (questionId, field, value) => updateScorecard((current) => ({
    ...current,
    discussionQuestions: current.discussionQuestions.map((question) => (
      question.id === questionId ? { ...question, [field]: value } : question
    )),
  }));

  const updateSelectedCard = (field, value) => updateScorecard((current) => ({
    ...current,
    scorecards: current.scorecards.map((card) => (
      card.id === selectedCardId ? { ...card, [field]: value } : card
    )),
  }));

  const updateMetric = (metricId, field, value) => updateScorecard((current) => ({
    ...current,
    scorecards: current.scorecards.map((card) => {
      if (card.id !== selectedCardId) return card;
      return {
        ...card,
        metrics: card.metrics.map((metric) => (
          metric.id === metricId ? { ...metric, [field]: value } : metric
        )),
      };
    }),
  }));

  const addMetric = () => updateScorecard((current) => ({
    ...current,
    scorecards: current.scorecards.map((card) => {
      if (card.id !== selectedCardId) return card;
      return {
        ...card,
        metrics: [
          ...card.metrics,
          {
            currentStatus: '',
            dept: '',
            id: `${card.id}-metric-${Date.now()}`,
            kpi: '',
            month1: '',
            month2: '',
            month3: '',
            periodResult: '',
            priorPeriodResult: '',
            progress: '',
            status: 'No Data',
            target: '',
          },
        ],
      };
    }),
  }));

  const exportScorecard = () => downloadCsv(`executive-pulse-${selectedPeriodId}.csv`, flattenScorecardRows(scorecard));

  return (
    <PageWrapper>
      <Stack
        gap={2}
        sx={{
          '@media print': {
            '.executive-pulse-actions': { display: 'none' },
            '.MuiDialog-root': { display: 'none' },
            bgcolor: '#ffffff',
            color: '#000000',
          },
        }}
      >
        <Box data-tour-id="executive-pulse-header" sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
          <Box sx={{ borderLeft: '8px solid', borderColor: 'primary.main', p: { xs: 1.5, md: 2.25 } }}>
            <Stack direction={{ xs: 'column', lg: 'row' }} justifyContent="space-between" alignItems={{ lg: 'flex-start' }} gap={2}>
              <Box sx={{ maxWidth: 840 }}>
                <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap" sx={{ mb: 1 }}>
                  <Chip icon={<InsightsOutlinedIcon />} label="Executive Pulse" color="primary" />
                  <Chip label="Board report" color="secondary" variant="outlined" />
                  <Chip label={`${scorecardSummary.onTrack} on track`} color="success" variant="outlined" />
                  <Chip label={`${scorecardSummary.attention} watch`} color="warning" variant="outlined" />
                  <Chip label={`${scorecardSummary.offTrack} off track`} color="error" variant="outlined" />
                </Stack>
                <Typography variant="h1">Executive Pulse</Typography>
              </Box>
              <Stack data-tour-id="executive-pulse-report-context" gap={1} className="executive-pulse-actions" sx={{ minWidth: { lg: 460 } }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} gap={1}>
                  <ReportingPeriodSelect fullWidth />
                  <TextField label="Prepared for" value={scorecard.preparedFor} onChange={(event) => updateRootField('preparedFor', event.target.value)} fullWidth size="small" />
                </Stack>
                <Stack data-tour-id="executive-pulse-export-actions" direction={{ xs: 'column', sm: 'row' }} gap={1} justifyContent="flex-end">
                  <Button startIcon={<PrintOutlinedIcon />} variant="outlined" onClick={() => window.print()}>Print / Save PDF</Button>
                  <Button startIcon={<DownloadOutlinedIcon />} variant="contained" onClick={exportScorecard}>Export CSV</Button>
                </Stack>
              </Stack>
            </Stack>
            <TextField
              label="Mission"
              value={scorecard.mission}
              onChange={(event) => updateRootField('mission', event.target.value)}
              fullWidth
              multiline
              minRows={2}
              sx={{ mt: 1.5 }}
            />
          </Box>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, minmax(0, 1fr))' }, gap: 1.5 }}>
          {scorecard.scorecards.map((card) => (
            <ExecutiveScorecardCard key={card.id} card={card} onOpen={() => setSelectedCardId(card.id)} reportingPeriod={selectedPeriod} />
          ))}
        </Box>

        <Box data-tour-id="executive-pulse-board-questions" sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
          <Stack direction="row" gap={1} alignItems="center" sx={{ mb: 1 }}>
            <AssessmentOutlinedIcon color="primary" />
            <Box>
              <Typography variant="h3">Board Discussion Questions</Typography>
              <Typography variant="body2">Editable prompts and responses for the board-level pulse conversation.</Typography>
            </Box>
          </Stack>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 1 }}>
            {scorecard.discussionQuestions.map((question) => (
              <Box key={question.id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1 }}>
                <TextField label="Question" value={question.prompt} onChange={(event) => updateDiscussionQuestion(question.id, 'prompt', event.target.value)} fullWidth size="small" />
                <TextField label="Response" value={question.response} onChange={(event) => updateDiscussionQuestion(question.id, 'response', event.target.value)} fullWidth multiline minRows={2} sx={{ mt: 1 }} />
              </Box>
            ))}
          </Box>
        </Box>
      </Stack>

      <Dialog fullWidth maxWidth="xl" open={Boolean(selectedCard)} onClose={() => setSelectedCardId(null)}>
        {selectedCard && (
          <>
            <DialogTitle>
              <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="space-between" gap={1}>
                <Box>
                  <Stack direction="row" alignItems="center" gap={1}>
                    <TrackChangesOutlinedIcon color="primary" />
                    <Typography variant="h2">Edit {selectedCard.title}</Typography>
                  </Stack>
                  <Typography variant="body2">Add KPI rows, status notes, quarterly values, and board-ready context.</Typography>
                </Box>
                <Button startIcon={<AddOutlinedIcon />} variant="contained" onClick={addMetric}>Add KPI Row</Button>
              </Stack>
            </DialogTitle>
            <DialogContent dividers>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr auto' }, gap: 1, mb: 1.5 }}>
                <TextField label="Strategic Goal" value={selectedCard.strategicGoal} onChange={(event) => updateSelectedCard('strategicGoal', event.target.value)} />
                <TextField label="Org Priority" value={selectedCard.orgPriority} onChange={(event) => updateSelectedCard('orgPriority', event.target.value)} />
                <TextField label="Dashboard Card Name" value={selectedCard.title} onChange={(event) => updateSelectedCard('title', event.target.value)} />
                <FormControl sx={{ minWidth: 190 }}>
                  <InputLabel>Card Status</InputLabel>
                  <Select label="Card Status" value={selectedCard.status} onChange={(event) => updateSelectedCard('status', event.target.value)}>
                    {scorecardStatusOptions.map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
                  </Select>
                </FormControl>
              </Box>
              <Stack gap={1.25}>
                {selectedCard.metrics.map((metric) => (
                  <Box key={metric.id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1 }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 0.7fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr' }, gap: 1 }}>
                      {editableMetricFields.slice(0, -1).map(([field, label]) => (
                        <TextField
                          key={field}
                          label={label}
                          value={metric[field] || ''}
                          onChange={(event) => updateMetric(metric.id, field, event.target.value)}
                          size="small"
                        />
                      ))}
                      <FormControl size="small">
                        <InputLabel>Signal</InputLabel>
                        <Select label="Signal" value={metric.status} onChange={(event) => updateMetric(metric.id, 'status', event.target.value)}>
                          {scorecardStatusOptions.map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
                        </Select>
                      </FormControl>
                    </Box>
                    <TextField
                      label="Current Status"
                      value={metric.currentStatus || ''}
                      onChange={(event) => updateMetric(metric.id, 'currentStatus', event.target.value)}
                      fullWidth
                      multiline
                      minRows={2}
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  </Box>
                ))}
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button startIcon={<EditOutlinedIcon />} onClick={() => setSelectedCardId(null)}>Done</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </PageWrapper>
  );
};

export default ExecutivePulsePage;
