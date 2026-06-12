import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import RadioButtonUncheckedOutlinedIcon from '@mui/icons-material/RadioButtonUncheckedOutlined';
import TrackChangesOutlinedIcon from '@mui/icons-material/TrackChangesOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, IconButton, InputLabel, LinearProgress, MenuItem, Select, Stack, TextField, Tooltip, Typography } from '@mui/material';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { q2Roadmap } from '../../data/mockData';
import { getQuarterTransitionState } from '../../data/quarterlyRoadmap';
import { useOperatingData } from '../../context/OperatingDataContext';
import { useAuth } from '../../hooks/useAuth';
import CalendarPanel from '../calendar/CalendarPanel';
import UserAvatar from '../shared/UserAvatar';

const statusMeta = {
  Alert: { border: '#b03a34', color: 'error', icon: ErrorOutlineOutlinedIcon, label: 'Off Track', order: 0, soft: 'rgba(176, 58, 52, 0.08)', tone: 'error.main' },
  Complete: { border: '#006e5c', color: 'success', icon: CheckCircleOutlinedIcon, label: 'Complete', order: 2, soft: 'rgba(0, 110, 92, 0.08)', tone: 'success.main' },
  Completed: { border: '#006e5c', color: 'success', icon: CheckCircleOutlinedIcon, label: 'Complete', order: 2, soft: 'rgba(0, 110, 92, 0.08)', tone: 'success.main' },
  'Needs Attention': { border: '#f1ac49', color: 'warning', icon: WarningAmberOutlinedIcon, label: 'Needs Attention', order: 1, soft: 'rgba(241, 172, 73, 0.14)', tone: 'warning.main' },
  'No Data': { border: '#5a6475', color: 'default', icon: RadioButtonUncheckedOutlinedIcon, label: 'No Data', order: 3, soft: 'rgba(90, 100, 117, 0.08)', tone: 'text.secondary' },
  'Off Course': { border: '#b03a34', color: 'error', icon: ErrorOutlineOutlinedIcon, label: 'Off Track', order: 0, soft: 'rgba(176, 58, 52, 0.08)', tone: 'error.main' },
  'On Course': { border: '#006e5c', color: 'success', icon: CheckCircleOutlinedIcon, label: 'On Track', order: 2, soft: 'rgba(0, 110, 92, 0.08)', tone: 'success.main' },
  Steady: { border: '#006e5c', color: 'success', icon: CheckCircleOutlinedIcon, label: 'On Track', order: 2, soft: 'rgba(0, 110, 92, 0.08)', tone: 'success.main' },
  Watch: { border: '#f1ac49', color: 'warning', icon: WarningAmberOutlinedIcon, label: 'Needs Attention', order: 1, soft: 'rgba(241, 172, 73, 0.14)', tone: 'warning.main' },
};

const statusGroups = [
  { helper: 'Needs executive intervention', key: 'offTrack', metaStatus: 'Alert', statuses: ['Alert', 'Off Course'], title: 'Off Track' },
  { helper: 'Needs focused follow-through', key: 'needsAttention', metaStatus: 'Watch', statuses: ['Watch', 'Needs Attention'], title: 'Needs Attention' },
  { helper: 'On track or complete', key: 'onTrack', metaStatus: 'Steady', statuses: ['Steady', 'On Course', 'Complete', 'Completed'], title: 'On Track' },
];

const clampProgress = (value) => Math.min(100, Math.max(0, Math.round(Number(value) || 0)));

const getPriorityStatus = (priority) => {
  const objectiveStatuses = (priority.keyObjectives || []).map((objective) => objective.status);
  if (!objectiveStatuses.length) return 'No Data';
  if (objectiveStatuses.some((status) => ['Alert', 'Off Course'].includes(status))) return 'Alert';
  if (objectiveStatuses.some((status) => ['Watch', 'Needs Attention'].includes(status))) return 'Watch';
  if (objectiveStatuses.every((status) => ['Complete', 'Completed'].includes(status))) return 'Complete';
  return 'Steady';
};

const getStatusMeta = (status) => statusMeta[status] || statusMeta['No Data'];

const getPriorityProgress = (priority) => {
  const kpis = (priority.keyObjectives || []).flatMap((objective) => objective.kpis || []);
  if (!kpis.length) return clampProgress(priority.percent);
  return clampProgress(kpis.reduce((total, kpi) => total + Number(kpi.progress || 0), 0) / kpis.length);
};

const getTeamOptions = (companyPriorities) => {
  const options = new Set(['All Teams']);
  companyPriorities.forEach((priority) => {
    (priority.keyObjectives || []).forEach((objective) => {
      if (objective.department) options.add(objective.department);
      if (objective.workplanAccess) options.add(objective.workplanAccess);
      if (objective.owner?.department) options.add(objective.owner.department);
      objective.owner?.teams?.forEach((team) => options.add(team));
    });
  });
  return Array.from(options);
};

const priorityMatchesTeam = (priority, team) => {
  if (team === 'All Teams') return true;
  const objectiveMatches = (priority.keyObjectives || []).some((objective) => (
    objective.department === team
    || objective.workplanAccess === team
    || objective.owner?.department === team
    || objective.owner?.teams?.includes(team)
  ));
  return objectiveMatches;
};

const averageProgress = (items, getProgress) => {
  if (!items.length) return 0;
  return clampProgress(items.reduce((total, item) => total + getProgress(item), 0) / items.length);
};

const SignalSummaryTile = ({ count, helper, metaStatus, title }) => {
  const meta = getStatusMeta(metaStatus);
  const Icon = meta.icon;

  return (
    <Box sx={{ bgcolor: meta.soft, border: '1px solid', borderColor: meta.border, borderRadius: 1, p: 1.25, minHeight: 112 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
        <Box>
          <Typography variant="caption" sx={{ color: meta.tone, fontWeight: 800, textTransform: 'uppercase' }}>{title}</Typography>
          <Typography variant="h1" color={meta.tone} sx={{ mt: 0.25 }}>{count}</Typography>
        </Box>
        <Icon sx={{ color: meta.tone }} />
      </Stack>
      <Typography variant="body2" sx={{ mt: 0.25 }}>{helper}</Typography>
    </Box>
  );
};

const ExecutiveSignalHeader = ({ averagePriorityProgress, prioritiesShown, quarterState, statusCounts, team, teamOptions, totalPriorities, onTeamChange }) => (
  <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
    <Box sx={{ borderLeft: '8px solid', borderColor: 'primary.main', p: { xs: 1.75, md: 2.5 } }}>
      <Stack direction={{ xs: 'column', lg: 'row' }} justifyContent="space-between" alignItems={{ lg: 'flex-start' }} gap={2}>
        <Box sx={{ maxWidth: 820 }}>
          <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap" sx={{ mb: 1 }}>
            <Chip label={q2Roadmap.quarter} color="primary" />
            <Chip label={q2Roadmap.theme} color="secondary" variant="outlined" />
            <Chip label={`${prioritiesShown}/${totalPriorities} ${q2Roadmap.quarter} Enterprise Priorities`} variant="outlined" />
            <Chip label={quarterState.label} color={quarterState.mode === 'closing' ? 'warning' : quarterState.mode === 'setting' ? 'secondary' : 'default'} variant="outlined" />
          </Stack>
          <Typography variant="overline" color="primary">Executive Quarter Pulse</Typography>
          <Typography variant="h2" sx={{ mt: 0.35 }}>Quarterly Enterprise Priority health</Typography>
          <Typography variant="body1" sx={{ mt: 0.75, color: 'text.primary', maxWidth: 720 }}>
            A concise ELT view of the quarter&apos;s Enterprise Priorities, accountable owners, and KPI evidence.
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary', maxWidth: 720 }}>
            {quarterState.guidance}
          </Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 280 } }}>
          <InputLabel id="company-dashboard-team-filter-label">Team Filter</InputLabel>
          <Select
            label="Team Filter"
            labelId="company-dashboard-team-filter-label"
            value={team}
            onChange={(event) => onTeamChange(event.target.value)}
          >
            {teamOptions.map((option) => (
              <MenuItem key={option} value={option}>{option}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr 1.15fr' }, gap: 1.25, mt: 2 }}>
        {statusCounts.map((group) => (
          <SignalSummaryTile key={group.key} count={group.count} helper={group.helper} metaStatus={group.metaStatus} title={group.title} />
        ))}
        <Box sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', borderRadius: 1, p: 1.25, minHeight: 112 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
            <Box>
              <Typography variant="caption" sx={{ color: 'primary.contrastText', fontWeight: 800, textTransform: 'uppercase', opacity: 0.82 }}>
                Percent to Goal
              </Typography>
              <Typography variant="h1" sx={{ mt: 0.25, color: 'primary.contrastText' }}>{averagePriorityProgress}%</Typography>
            </Box>
            <TrendingUpOutlinedIcon />
          </Stack>
          <Typography variant="body2" sx={{ mt: 0.25, color: 'primary.contrastText', opacity: 0.82 }}>
            Average across {prioritiesShown} {q2Roadmap.quarter} Enterprise Priorities
          </Typography>
        </Box>
      </Box>
    </Box>
  </Box>
);

const PriorityWeeklyHeatMap = ({ priority }) => {
  const history = priority.weeklySignalHistory || priority.statusHistory || [];

  if (!history.length) {
    return <Typography variant="caption" color="text.secondary">Weekly history begins after the first snapshot</Typography>;
  }

  return (
    <Stack
      aria-label={`Week-over-week signal history for ${priority.name}`}
      direction="row"
      gap={0.4}
      role="img"
      title={`Week-over-week signal history for ${priority.name}`}
    >
      {history.slice(-8).map((entry, index) => {
        const status = typeof entry === 'string' ? entry : entry.status;
        const week = typeof entry === 'string' ? `Week ${index + 1}` : entry.week || entry.weekStart || `Week ${index + 1}`;
        const meta = getStatusMeta(status);
        return (
          <Tooltip key={`${week}-${index}`} title={`${week}: ${meta.label}`}>
            <Box sx={{ bgcolor: meta.border, borderRadius: 0.5, height: 18, width: 18 }} />
          </Tooltip>
        );
      })}
    </Stack>
  );
};

const EnterprisePriorityRegister = ({ priorities: priorityRows, onOpen }) => (
  <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: { xs: 1.5, md: 2 } }}>
    <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={1.5} sx={{ mb: 1.5 }}>
      <Box>
        <Typography variant="overline" color="primary">Quarterly Commitments</Typography>
        <Typography variant="h2">Enterprise Priorities and KPIs</Typography>
      </Box>
      <Chip icon={<TrackChangesOutlinedIcon />} label={`${priorityRows.length} Enterprise Priorities`} color="primary" variant="outlined" />
    </Stack>

    <Stack gap={0.85}>
      {priorityRows.length ? priorityRows.map((priority) => {
        const meta = getStatusMeta(getPriorityStatus(priority));
        const Icon = meta.icon;
        const progress = getPriorityProgress(priority);
        const kpis = (priority.keyObjectives || []).flatMap((objective) => objective.kpis || []);
        const objectiveOwners = Array.from(new Map((priority.keyObjectives || []).map((objective) => [objective.owner?.id, objective.owner])).values()).filter(Boolean);

        return (
          <Box
            aria-label={`Open Enterprise Priority ${priority.name}`}
            key={priority.id}
            onClick={() => onOpen(priority)}
            onKeyDown={(event) => {
              if (!['Enter', ' '].includes(event.key)) return;
              event.preventDefault();
              event.currentTarget.click();
            }}
            role="button"
            tabIndex={0}
            title={`Open Enterprise Priority ${priority.name}`}
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.3fr) minmax(180px, 0.6fr) minmax(220px, 0.9fr) 120px' },
              gap: 1.25,
              alignItems: 'center',
              border: '1px solid',
              borderColor: 'divider',
              borderLeft: '5px solid',
              borderLeftColor: meta.border,
              borderRadius: 1,
              cursor: 'pointer',
              p: 1.15,
              transition: 'border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease',
              '&:focus-visible': { outline: '3px solid', outlineColor: 'secondary.main', outlineOffset: 2 },
              '&:hover': { borderColor: 'secondary.main', boxShadow: '0 8px 18px rgba(31, 79, 86, 0.13)', transform: 'translateY(-1px)' },
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Stack direction="row" gap={0.75} alignItems="center" flexWrap="wrap" sx={{ mb: 0.35 }}>
                <Icon sx={{ color: meta.tone, fontSize: 18 }} />
                <Chip label={meta.label} color={meta.color} size="small" />
                <Chip label={priority.strategicPillar || 'Strategic pillar not set'} size="small" variant="outlined" />
              </Stack>
              <Typography variant="body1" color="text.primary" fontWeight={800}>{priority.name}</Typography>
              <Typography variant="body2">{priority.description}</Typography>
            </Box>

            <Stack direction="row" gap={0.5} alignItems="center" flexWrap="wrap">
              {objectiveOwners.slice(0, 3).map((owner) => <UserAvatar key={owner.id} user={owner} size="sm" />)}
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" color="text.primary" fontWeight={700}>{objectiveOwners.length} objective owner{objectiveOwners.length === 1 ? '' : 's'}</Typography>
                <Typography variant="caption">{priority.keyObjectives?.length || 0} Key Objectives</Typography>
              </Box>
            </Stack>

            <Box sx={{ minWidth: 0 }}>
              <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase' }}>KPI - End of {q2Roadmap.quarter}</Typography>
              {kpis.length ? kpis.slice(0, 3).map((kpi) => (
                <Typography key={kpi.id || kpi.target} variant="body2" color="text.primary">{kpi.target || kpi.title}</Typography>
              )) : <Typography variant="body2" color="text.secondary">No KPI attached yet</Typography>}
            </Box>

            <Box>
              <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 800, textTransform: 'uppercase' }}>Weekly signal</Typography>
              <PriorityWeeklyHeatMap priority={priority} />
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                <Typography variant="caption">Progress</Typography>
                <Typography variant="caption" color={meta.tone} fontWeight={800}>{progress}%</Typography>
              </Stack>
              <LinearProgress value={progress} variant="determinate" sx={{ bgcolor: 'divider', '& .MuiLinearProgress-bar': { bgcolor: meta.tone } }} />
            </Box>
          </Box>
        );
      }) : (
        <Typography variant="body2" color="text.secondary">
          No quarterly Enterprise Priorities have been defined yet.
        </Typography>
      )}
    </Stack>
  </Box>
);

const getPulsePath = (amplitude) => {
  const center = 36;
  if (!amplitude) return `M 0 ${center} L 300 ${center}`;
  const height = 25 * amplitude;
  return [
    `M 0 ${center}`,
    `C 24 ${center}, 30 ${center - height * 0.35}, 50 ${center - height * 0.35}`,
    `S 78 ${center + height * 0.45}, 102 ${center + height * 0.45}`,
    `S 126 ${center - height}, 150 ${center - height}`,
    `S 174 ${center + height}, 198 ${center + height}`,
    `S 228 ${center - height * 0.45}, 250 ${center - height * 0.45}`,
    `S 276 ${center}, 300 ${center}`,
  ].join(' ');
};

const PillarPulseFlow = ({ amplitude, count, pillarName, status }) => {
  const meta = getStatusMeta(status);
  const path = getPulsePath(amplitude);

  return (
    <Box
      aria-label={`${pillarName}: ${count} aligned Enterprise ${count === 1 ? 'Priority' : 'Priorities'}, ${meta.label}`}
      role="img"
      sx={{ mt: 1, overflow: 'hidden' }}
    >
      <Box component="svg" viewBox="0 0 300 72" preserveAspectRatio="none" sx={{ display: 'block', height: 72, width: '100%' }}>
        <path d={`M 0 36 L 300 36`} fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth="1" />
        <path d={path} fill="none" stroke={meta.border} strokeLinecap="round" strokeOpacity="0.2" strokeWidth={amplitude ? 9 : 2} />
        <path
          d={path}
          fill="none"
          pathLength="1"
          stroke={meta.border}
          strokeLinecap="round"
          strokeWidth={amplitude ? 2.5 + amplitude * 1.75 : 1.5}
          sx={{
            animation: amplitude ? 'pillarPulseFlow 3.8s linear infinite' : 'none',
            strokeDasharray: amplitude ? '0.16 0.035' : 'none',
            '@keyframes pillarPulseFlow': {
              from: { strokeDashoffset: 0 },
              to: { strokeDashoffset: -0.195 },
            },
            '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
          }}
        />
      </Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
        <Typography variant="caption" color="primary" fontWeight={800}>
          {count} aligned priorit{count === 1 ? 'y' : 'ies'}
        </Typography>
        <Typography variant="caption" color={meta.tone} fontWeight={800}>{count ? meta.label : 'No current signal'}</Typography>
      </Stack>
    </Box>
  );
};

const blankSuccessMetric = () => ({ id: `metric-${Date.now()}-${Math.random()}`, label: '', target: '' });

const PillarEditorDialog = ({ editor, onClose, onSave }) => {
  const [form, setForm] = useState(() => {
    if (!editor.pillar) return { description: '', name: '', successMetrics: [blankSuccessMetric()] };
    return {
      ...editor.pillar,
      successMetrics: editor.pillar.successMetrics.map((metric, index) => ({
        ...metric,
        id: metric.id || `metric-${editor.pillar.id}-${index}`,
      })),
    };
  });
  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  const updateMetric = (metricId, field) => (event) => setForm((current) => ({
    ...current,
    successMetrics: current.successMetrics.map((metric) => (
      metric.id === metricId ? { ...metric, [field]: event.target.value } : metric
    )),
  }));
  const removeMetric = (metricId) => setForm((current) => ({
    ...current,
    successMetrics: current.successMetrics.filter((metric) => metric.id !== metricId),
  }));
  const validMetrics = form.successMetrics.filter((metric) => metric.label.trim() && metric.target.trim());

  return (
    <Dialog aria-labelledby="pillar-editor-title" open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle id="pillar-editor-title">{form.id ? 'Edit Strategic Pillar' : 'Add Strategic Pillar'}</DialogTitle>
      <DialogContent>
        <Stack gap={1.5} sx={{ pt: 1 }}>
          <TextField label="Pillar Name" value={form.name} onChange={update('name')} required fullWidth />
          <TextField label="Reference Description" value={form.description} onChange={update('description')} multiline minRows={2} fullWidth />
          <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
            <Box>
              <Typography variant="h3">Success metrics</Typography>
              <Typography variant="body2">Long-range measurements preserved with this pillar.</Typography>
            </Box>
            <Button
              startIcon={<AddIcon />}
              onClick={() => setForm((current) => ({ ...current, successMetrics: [...current.successMetrics, blankSuccessMetric()] }))}
            >
              Add Metric
            </Button>
          </Stack>
          {form.successMetrics.map((metric, index) => (
            <Stack key={metric.id || `${metric.label}-${index}`} direction={{ xs: 'column', sm: 'row' }} gap={1} alignItems={{ sm: 'center' }}>
              <TextField label="Success Metric" value={metric.label} onChange={updateMetric(metric.id, 'label')} fullWidth />
              <TextField label="Target" value={metric.target} onChange={updateMetric(metric.id, 'target')} fullWidth />
              <Tooltip title={`Remove success metric ${index + 1}`}>
                <IconButton aria-label={`Remove success metric ${index + 1}`} onClick={() => removeMetric(metric.id)}>
                  <DeleteOutlineIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          disabled={!form.name.trim() || !validMetrics.length}
          onClick={() => onSave({ ...form, successMetrics: validMetrics })}
          variant="contained"
        >
          Save Pillar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const PillarCoverage = ({ canManage, companyPriorities, onDeletePillar, onEditPillar, onOpenPillar, strategicPlan }) => (
  <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: { xs: 1.5, md: 2 } }}>
    <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={1.5} sx={{ mb: 1.5 }}>
      <Box>
        <Typography variant="overline" color="primary">Long-Term Strategic Context</Typography>
        <Typography variant="h2">Strategic plan alignment</Typography>
        <Typography variant="body2" sx={{ mt: 0.35 }}>How this quarter&apos;s Enterprise Priorities support the four-year strategic plan.</Typography>
      </Box>
      <Stack direction="row" gap={1} alignItems="center">
        <Chip icon={<AccountTreeOutlinedIcon />} label={strategicPlan.name} color="primary" variant="outlined" />
        {canManage && <Button startIcon={<AddIcon />} onClick={() => onEditPillar(null)} variant="outlined">Add Pillar</Button>}
      </Stack>
    </Stack>

    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(5, minmax(0, 1fr))' }, gap: 1 }}>
      {strategicPlan.pillars.map((pillar) => {
        const pillarPriorities = companyPriorities.filter((priority) => priority.strategicPillarId === pillar.id);
        const progress = averageProgress(pillarPriorities, getPriorityProgress);
        const maxAlignedPriorities = Math.max(
          1,
          ...strategicPlan.pillars.map((candidate) => companyPriorities.filter((priority) => priority.strategicPillarId === candidate.id).length),
        );
        const amplitude = pillarPriorities.length / maxAlignedPriorities;
        const pulseStatus = [...pillarPriorities]
          .map((priority) => getPriorityStatus(priority))
          .sort((a, b) => getStatusMeta(a).order - getStatusMeta(b).order)[0] || 'No Data';

        return (
          <Box
            aria-label={`Open pillar detail for ${pillar.name}`}
            key={pillar.id}
            onClick={() => onOpenPillar({ pillar, priorities: pillarPriorities, progress })}
            onKeyDown={(event) => {
              if (!['Enter', ' '].includes(event.key)) return;
              event.preventDefault();
              event.currentTarget.click();
            }}
            role="button"
            tabIndex={0}
            title={`Open pillar detail for ${pillar.name}`}
            sx={{
              bgcolor: 'background.default',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              cursor: 'pointer',
              p: 1.15,
              minHeight: 152,
              transition: 'border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease',
              '&:focus-visible': { outline: '3px solid', outlineColor: 'secondary.main', outlineOffset: 2 },
              '&:hover': { borderColor: 'secondary.main', boxShadow: '0 8px 18px rgba(31, 79, 86, 0.13)', transform: 'translateY(-1px)' },
            }}
          >
            <Stack direction="row" justifyContent="space-between" gap={1} alignItems="flex-start">
              <Chip label={`Pillar ${pillar.order}`} size="small" color="primary" />
              {canManage ? (
                <Stack direction="row" gap={0.25}>
                  <Tooltip title={`Edit ${pillar.name}`}>
                    <IconButton
                      aria-label={`Edit strategic pillar ${pillar.name}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        onEditPillar(pillar);
                      }}
                      size="small"
                    >
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={`Delete ${pillar.name}`}>
                    <IconButton
                      aria-label={`Delete strategic pillar ${pillar.name}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        onDeletePillar(pillar.id);
                      }}
                      size="small"
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              ) : <AccountTreeOutlinedIcon color="primary" fontSize="small" />}
            </Stack>
            <Typography variant="body1" color="text.primary" fontWeight={800} sx={{ mt: 1 }}>{pillar.name}</Typography>
            <PillarPulseFlow
              amplitude={amplitude}
              count={pillarPriorities.length}
              pillarName={pillar.name}
              status={pulseStatus}
            />
          </Box>
        );
      })}
    </Box>
  </Box>
);

const PillarDetailDialog = ({ detail, onClose }) => {
  const open = Boolean(detail);
  const pillar = detail?.pillar;
  const pillarPriorities = detail?.priorities || [];

  return (
    <Dialog
      aria-describedby="pillar-detail-description"
      aria-labelledby="pillar-detail-title"
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{ sx: { borderRadius: 1 } }}
    >
      <DialogTitle id="pillar-detail-title">
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1}>
          <Box>
            <Typography variant="caption" color="primary">Strategic Pillar {pillar?.order}</Typography>
            <Typography variant="h2">{pillar?.name}</Typography>
          </Box>
          <Chip label={`${pillarPriorities.length} current Enterprise Priorit${pillarPriorities.length === 1 ? 'y' : 'ies'}`} color="primary" variant="outlined" />
        </Stack>
      </DialogTitle>
      <DialogContent>
        {pillar && (
          <Stack gap={2} sx={{ py: 1 }}>
            <Typography id="pillar-detail-description" variant="body1" color="text.primary">{pillar.description}</Typography>

            <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
              <Typography variant="h3" sx={{ mb: 1 }}>Success metrics</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 1 }}>
                {pillar.successMetrics.map((metric) => (
                  <Box key={`${metric.label}-${metric.target}`} sx={{ bgcolor: 'background.default', borderRadius: 1, p: 1 }}>
                    <Typography variant="body2" color="text.primary" fontWeight={800}>{metric.label}</Typography>
                    <Typography variant="h3" color="primary" sx={{ mt: 0.35 }}>{metric.target}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1} sx={{ mb: 1 }}>
                <Box>
                  <Typography variant="h3">Aligned Enterprise Priorities</Typography>
                  <Typography variant="body2">{q2Roadmap.quarter} Enterprise Priorities and their KPI evidence tied to this long-term pillar.</Typography>
                </Box>
                <Chip label={`${pillarPriorities.length} priorit${pillarPriorities.length === 1 ? 'y' : 'ies'}`} color="primary" variant="outlined" />
              </Stack>
              <Stack gap={1}>
                {pillarPriorities.length ? pillarPriorities.map((priority) => {
                  const meta = getStatusMeta(getPriorityStatus(priority));
                  const Icon = meta.icon;
                  const kpis = (priority.keyObjectives || []).flatMap((objective) => objective.kpis || []);
                  return (
                    <Box key={priority.id} sx={{ border: '1px solid', borderColor: 'divider', borderLeft: '5px solid', borderLeftColor: meta.border, borderRadius: 1, p: 1 }}>
                      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={1}>
                        <Box sx={{ minWidth: 0 }}>
                          <Stack direction="row" gap={0.75} alignItems="center" flexWrap="wrap">
                            <Icon sx={{ color: meta.tone, fontSize: 18 }} />
                            <Chip label={meta.label} color={meta.color} size="small" />
                          </Stack>
                          <Typography variant="body1" color="text.primary" fontWeight={800} sx={{ mt: 0.75 }}>{priority.name}</Typography>
                          <Typography variant="body2">{priority.description}</Typography>
                        </Box>
                        <Box sx={{ minWidth: { md: 260 } }}>
                          <Typography variant="caption" fontWeight={800}>KPI - End of {q2Roadmap.quarter}</Typography>
                          {kpis.length ? kpis.slice(0, 3).map((kpi) => (
                            <Typography key={kpi.id || kpi.target} variant="body2">{kpi.target || kpi.title}</Typography>
                          )) : <Typography variant="body2" color="text.secondary">No KPI attached yet</Typography>}
                        </Box>
                      </Stack>
                    </Box>
                  );
                }) : (
                  <Typography variant="body2" color="text.secondary">No current Enterprise Priorities are aligned to this pillar yet.</Typography>
                )}
              </Stack>
            </Box>
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

const CompanyDashboardOverview = ({ calendarEvents, calendarProps, isAdmin }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    deleteStrategicPillar,
    enterprisePriorities,
    saveStrategicPillar,
    strategicPlan,
  } = useOperatingData();
  const canManagePillars = user.workingGroup === 'ELT';
  const [pillarDetail, setPillarDetail] = useState(null);
  const [pillarEditor, setPillarEditor] = useState(null);
  const [team, setTeam] = useState('All Teams');
  const companyPriorities = useMemo(
    () => enterprisePriorities.filter((priority) => priority.company),
    [enterprisePriorities],
  );
  const teamOptions = useMemo(() => getTeamOptions(companyPriorities), [companyPriorities]);
  const visiblePriorities = useMemo(
    () => companyPriorities.filter((priority) => priorityMatchesTeam(priority, team)),
    [companyPriorities, team],
  );
  const sortedPriorities = useMemo(() => [...visiblePriorities].sort((a, b) => {
    const aMeta = getStatusMeta(getPriorityStatus(a));
    const bMeta = getStatusMeta(getPriorityStatus(b));
    return aMeta.order - bMeta.order || getPriorityProgress(a) - getPriorityProgress(b) || a.name.localeCompare(b.name);
  }), [visiblePriorities]);
  const statusCounts = statusGroups.map((group) => ({
    ...group,
    count: sortedPriorities.filter((priority) => group.statuses.includes(getPriorityStatus(priority))).length,
  }));
  const averagePriorityProgress = averageProgress(sortedPriorities, getPriorityProgress);
  const quarterState = useMemo(() => getQuarterTransitionState(), []);

  return (
    <Stack gap={2}>
      <ExecutiveSignalHeader
        averagePriorityProgress={averagePriorityProgress}
        prioritiesShown={sortedPriorities.length}
        quarterState={quarterState}
        statusCounts={statusCounts}
        team={team}
        teamOptions={teamOptions}
        totalPriorities={companyPriorities.length}
        onTeamChange={setTeam}
      />

      <EnterprisePriorityRegister
        priorities={sortedPriorities}
        onOpen={(priority) => navigate(`/dashboard/company/priorities/${priority.id}`)}
      />
      <PillarCoverage
        canManage={canManagePillars}
        companyPriorities={companyPriorities}
        onDeletePillar={(pillarId) => {
          deleteStrategicPillar(pillarId);
          setPillarDetail(null);
        }}
        onEditPillar={(pillar) => setPillarEditor({ pillar })}
        onOpenPillar={setPillarDetail}
        strategicPlan={strategicPlan}
      />

      <Box sx={{ minWidth: 0 }}>
        <CalendarPanel
          {...calendarProps}
          events={calendarEvents}
          isAdmin={isAdmin}
          scope="organization"
        />
      </Box>

      <PillarDetailDialog
        detail={pillarDetail}
        onClose={() => setPillarDetail(null)}
      />
      {pillarEditor && (
        <PillarEditorDialog
          editor={pillarEditor}
          onClose={() => setPillarEditor(null)}
          onSave={(pillar) => {
            saveStrategicPillar(pillar);
            setPillarEditor(null);
          }}
        />
      )}
    </Stack>
  );
};

export default CompanyDashboardOverview;
