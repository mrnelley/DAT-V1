import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import RadioButtonUncheckedOutlinedIcon from '@mui/icons-material/RadioButtonUncheckedOutlined';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import TrackChangesOutlinedIcon from '@mui/icons-material/TrackChangesOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, LinearProgress, MenuItem, Select, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationsContext';
import { priorities, q2Roadmap, strategicPlan2030, users } from '../../data/mockData';
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

const getPriorityStatus = (priority) => priority.roadmapStatus || priority.status || 'No Data';

const getStatusMeta = (status) => statusMeta[status] || statusMeta['No Data'];

const getObjectiveProgress = (objective) => {
  const kpis = objective.kpis || [];
  if (!kpis.length) return 0;
  return clampProgress(kpis.reduce((total, kpi) => total + Number(kpi.progress || 0), 0) / kpis.length);
};

const getPriorityProgress = (priority) => {
  const kpis = (priority.keyObjectives || []).flatMap((objective) => objective.kpis || []);
  if (!kpis.length) return clampProgress(priority.percent);
  return clampProgress(kpis.reduce((total, kpi) => total + Number(kpi.progress || 0), 0) / kpis.length);
};

const getPriorityGoal = (priority) => {
  const kpis = (priority.keyObjectives || []).flatMap((objective) => objective.kpis || []);
  const lowestProgressKpi = [...kpis].sort((a, b) => Number(a.progress || 0) - Number(b.progress || 0))[0];
  return lowestProgressKpi?.target || priority.description;
};

const getObjectiveGoal = (objective) => {
  const kpis = objective.kpis || [];
  const lowestProgressKpi = [...kpis].sort((a, b) => Number(a.progress || 0) - Number(b.progress || 0))[0];
  return lowestProgressKpi?.target || objective.workplanSummary || 'Goal not yet defined';
};

const getTeamOptions = (companyPriorities) => {
  const options = new Set(['All Teams']);
  companyPriorities.forEach((priority) => {
    if (priority.owner?.department) options.add(priority.owner.department);
    priority.owner?.teams?.forEach((team) => options.add(team));
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
  const ownerMatches = priority.owner?.department === team || priority.owner?.teams?.includes(team);
  const objectiveMatches = (priority.keyObjectives || []).some((objective) => (
    objective.department === team
    || objective.workplanAccess === team
    || objective.owner?.department === team
    || objective.owner?.teams?.includes(team)
  ));
  return ownerMatches || objectiveMatches;
};

const objectiveMatchesTeam = (objective, team) => (
  team === 'All Teams'
  || objective.department === team
  || objective.workplanAccess === team
  || objective.owner?.department === team
  || objective.owner?.teams?.includes(team)
);

const averageProgress = (items, getProgress) => {
  if (!items.length) return 0;
  return clampProgress(items.reduce((total, item) => total + getProgress(item), 0) / items.length);
};

const uniqueUsers = (items) => Array.from(new Map(
  items.filter(Boolean).map((user) => [user.id, user]),
).values());

const getPriorityTeammates = (priority) => uniqueUsers([
  priority.owner,
  ...(priority.ownerIds || []).map((id) => users.find((user) => user.id === id)),
  ...(priority.keyObjectives || []).flatMap((objective) => [
    objective.owner,
    ...(objective.ownerIds || []).map((id) => users.find((user) => user.id === id)),
  ]),
]);

const StatusDot = ({ status }) => {
  const meta = getStatusMeta(status);
  return <Box aria-hidden sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: meta.tone, flexShrink: 0 }} />;
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

const ExecutiveSignalHeader = ({ averageObjectiveProgress, objectiveCount, prioritiesShown, statusCounts, team, teamOptions, totalPriorities, onTeamChange }) => (
  <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
    <Box sx={{ borderLeft: '8px solid', borderColor: 'primary.main', p: { xs: 1.75, md: 2.5 } }}>
      <Stack direction={{ xs: 'column', lg: 'row' }} justifyContent="space-between" alignItems={{ lg: 'flex-start' }} gap={2}>
        <Box sx={{ maxWidth: 820 }}>
          <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap" sx={{ mb: 1 }}>
            <Chip label={q2Roadmap.quarter} color="primary" />
            <Chip label={q2Roadmap.theme} color="secondary" variant="outlined" />
            <Chip label={`${prioritiesShown}/${totalPriorities} Q2 objectives`} variant="outlined" />
          </Stack>
          <Typography variant="overline" color="primary">Pinned Priority Signal</Typography>
          <Typography variant="h2" sx={{ mt: 0.35 }}>Operational priority health</Typography>
          <Typography variant="body1" sx={{ mt: 0.75, color: 'text.primary', maxWidth: 720 }}>
            Q2 objectives with operational health and progress toward goal for the executive read.
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
              <Typography variant="h1" sx={{ mt: 0.25, color: 'primary.contrastText' }}>{averageObjectiveProgress}%</Typography>
            </Box>
            <TrendingUpOutlinedIcon />
          </Stack>
          <Typography variant="body2" sx={{ mt: 0.25, color: 'primary.contrastText', opacity: 0.82 }}>
            Average across {objectiveCount} Q2 objectives
          </Typography>
        </Box>
      </Box>
    </Box>
  </Box>
);

const ObjectiveCard = ({ onOpen, priority }) => {
  const status = getPriorityStatus(priority);
  const meta = getStatusMeta(status);
  const Icon = meta.icon;
  const progress = getPriorityProgress(priority);
  const objectives = priority.keyObjectives || [];

  return (
    <Box
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Open operational priority detail for ${priority.name}`}
      sx={{
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderTop: '6px solid',
        borderTopColor: meta.border,
        borderRadius: 1,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 332,
        p: 1.5,
        transition: 'border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease',
        '&:focus-visible': { outline: '3px solid', outlineColor: 'secondary.main', outlineOffset: 3 },
        '&:hover': { borderColor: 'primary.light', boxShadow: 3, transform: 'translateY(-2px)' },
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1.5}>
        <Box sx={{ minWidth: 0 }}>
          <Stack direction="row" gap={0.75} alignItems="center" flexWrap="wrap">
            <Chip icon={<Icon />} label={meta.label} color={meta.color} size="small" />
            <Chip label={priority.period} size="small" variant="outlined" />
          </Stack>
          <Typography variant="h3" sx={{ mt: 1 }}>{priority.name}</Typography>
          <Typography variant="body2" sx={{ mt: 0.35 }}>{priority.strategicPillar}</Typography>
        </Box>
        <UserAvatar user={priority.owner} size="md" />
      </Stack>

      <Box sx={{ mt: 1.5 }}>
        <Stack direction="row" alignItems="baseline" justifyContent="space-between" gap={1}>
          <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase' }}>Percent to goal</Typography>
          <Typography variant="h2" color={meta.tone}>{progress}%</Typography>
        </Stack>
        <LinearProgress value={progress} variant="determinate" sx={{ mt: 0.75, bgcolor: 'divider', '& .MuiLinearProgress-bar': { bgcolor: meta.tone } }} />
      </Box>

      <Stack direction="row" gap={1} alignItems="flex-start" sx={{ mt: 1.25, bgcolor: 'background.default', borderRadius: 1, p: 1 }}>
        <FlagOutlinedIcon color="primary" fontSize="small" />
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase' }}>Q2 goal</Typography>
          <Typography variant="body2" color="text.primary" sx={{ display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden' }}>
            {getPriorityGoal(priority)}
          </Typography>
        </Box>
      </Stack>

      <Stack gap={0.75} sx={{ mt: 1.25 }}>
        {objectives.slice(0, 3).map((objective) => {
          const objectiveMeta = getStatusMeta(objective.status);
          const objectiveProgress = getObjectiveProgress(objective);
          return (
            <Box key={objective.id} sx={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', alignItems: 'center', gap: 1, borderTop: '1px solid', borderColor: 'divider', pt: 0.75 }}>
              <Stack direction="row" gap={0.75} alignItems="center" sx={{ minWidth: 0 }}>
                <StatusDot status={objective.status} />
                <Typography variant="body2" color="text.primary" fontWeight={700} sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {objective.title}
                </Typography>
              </Stack>
              <Typography variant="caption" color={objectiveMeta.tone} fontWeight={800}>{objectiveProgress}%</Typography>
            </Box>
          );
        })}
      </Stack>

      <Stack direction="row" gap={0.75} flexWrap="wrap" sx={{ mt: 'auto', pt: 1.25 }}>
        <Chip label={`${objectives.length} objective${objectives.length === 1 ? '' : 's'}`} size="small" variant="outlined" />
        <Chip label={priority.owner.name} size="small" variant="outlined" />
        <Chip icon={<ArrowForwardOutlinedIcon />} label="View Detail" color="primary" size="small" sx={{ ml: 'auto' }} />
      </Stack>
    </Box>
  );
};

const ObjectiveTracker = ({ objectiveRows, onEngage }) => (
  <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: { xs: 1.5, md: 2 } }}>
    <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={1.5} sx={{ mb: 1.5 }}>
      <Box>
        <Typography variant="overline" color="primary">Objective Tracker</Typography>
        <Typography variant="h2">Risk-first objective detail</Typography>
      </Box>
      <Chip icon={<TrackChangesOutlinedIcon />} label={`${objectiveRows.length} workplan objectives`} color="primary" variant="outlined" />
    </Stack>

    <Stack gap={0.85}>
      {objectiveRows.map(({ goal, objective, priority, progress }) => {
        const meta = getStatusMeta(objective.status);
        const Icon = meta.icon;

        return (
          <Box
            aria-label={`Engage teammates about objective ${objective.title}`}
            key={`${priority.id}-${objective.id}`}
            onClick={() => onEngage({
              actionPath: `/dashboard/company/priorities/${priority.id}`,
              goal,
              id: objective.id,
              progress,
              status: objective.status,
              subtitle: priority.name,
              teammates: uniqueUsers([
                objective.owner,
                priority.owner,
                ...(objective.ownerIds || []).map((id) => users.find((user) => user.id === id)),
                ...(priority.ownerIds || []).map((id) => users.find((user) => user.id === id)),
              ]),
              title: objective.title,
              type: 'objective',
            })}
            onKeyDown={(event) => {
              if (!['Enter', ' '].includes(event.key)) return;
              event.preventDefault();
              event.currentTarget.click();
            }}
            role="button"
            tabIndex={0}
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
                <Chip label={priority.name} size="small" variant="outlined" />
              </Stack>
              <Typography variant="body1" color="text.primary" fontWeight={800}>{objective.title}</Typography>
              <Typography variant="body2">{objective.workplanTitle}</Typography>
            </Box>

            <Stack direction="row" gap={1} alignItems="center">
              <UserAvatar user={objective.owner} size="sm" />
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" color="text.primary" fontWeight={700}>{objective.owner.name}</Typography>
                <Typography variant="caption">{objective.department}</Typography>
              </Box>
            </Stack>

            <Box sx={{ minWidth: 0 }}>
              <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase' }}>Goal</Typography>
              <Typography variant="body2" color="text.primary">{goal}</Typography>
            </Box>

            <Box>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                <Typography variant="caption">Progress</Typography>
                <Typography variant="caption" color={meta.tone} fontWeight={800}>{progress}%</Typography>
              </Stack>
              <LinearProgress value={progress} variant="determinate" sx={{ bgcolor: 'divider', '& .MuiLinearProgress-bar': { bgcolor: meta.tone } }} />
            </Box>
          </Box>
        );
      })}
    </Stack>
  </Box>
);

const PillarCoverage = ({ companyPriorities, onEngage }) => (
  <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: { xs: 1.5, md: 2 } }}>
    <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={1.5} sx={{ mb: 1.5 }}>
      <Box>
        <Typography variant="overline" color="primary">Strategic Plan Connection</Typography>
        <Typography variant="h2">Pillar coverage</Typography>
      </Box>
      <Chip icon={<AccountTreeOutlinedIcon />} label={strategicPlan2030.name} color="primary" variant="outlined" />
    </Stack>

    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(5, minmax(0, 1fr))' }, gap: 1 }}>
      {strategicPlan2030.pillars.map((pillar) => {
        const pillarPriorities = companyPriorities.filter((priority) => priority.strategicPillarId === pillar.id);
        const worstMeta = [...pillarPriorities]
          .map((priority) => getStatusMeta(getPriorityStatus(priority)))
          .sort((a, b) => a.order - b.order)[0] || statusMeta['No Data'];
        const progress = averageProgress(pillarPriorities, getPriorityProgress);
        const objectiveCount = pillarPriorities.reduce((total, priority) => total + (priority.keyObjectives?.length || 0), 0);

        return (
          <Box
            aria-label={`Engage teammates about pillar ${pillar.name}`}
            key={pillar.id}
            onClick={() => onEngage({
              actionPath: '/dashboard/company',
              goal: `${pillarPriorities.length} Q2 objectives with ${objectiveCount} workplan objectives connected to this pillar.`,
              id: pillar.id,
              progress,
              status: worstMeta.label,
              subtitle: `Pillar ${pillar.order}`,
              teammates: uniqueUsers(pillarPriorities.flatMap(getPriorityTeammates)),
              title: pillar.name,
              type: 'pillar',
            })}
            onKeyDown={(event) => {
              if (!['Enter', ' '].includes(event.key)) return;
              event.preventDefault();
              event.currentTarget.click();
            }}
            role="button"
            tabIndex={0}
            sx={{
              bgcolor: worstMeta.soft,
              border: '1px solid',
              borderColor: worstMeta.border,
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
              <StatusDot status={pillarPriorities[0] ? getPriorityStatus(pillarPriorities[0]) : 'No Data'} />
            </Stack>
            <Typography variant="body1" color="text.primary" fontWeight={800} sx={{ mt: 1 }}>{pillar.name}</Typography>
            <Typography variant="h3" color={worstMeta.tone} sx={{ mt: 0.75 }}>{progress}%</Typography>
            <Typography variant="caption">{pillarPriorities.length} Q2 objective{pillarPriorities.length === 1 ? '' : 's'} / {objectiveCount} workplan objective{objectiveCount === 1 ? '' : 's'}</Typography>
          </Box>
        );
      })}
    </Box>
  </Box>
);

const TeammateEngagementDialog = ({ engagement, onClose, onSend, open }) => {
  const [message, setMessage] = useState('');
  const [recipientId, setRecipientId] = useState('');

  useEffect(() => {
    if (!open) return;
    setMessage('');
    setRecipientId(engagement?.teammates?.[0]?.id || '');
  }, [engagement, open]);

  const recipient = engagement?.teammates?.find((teammate) => teammate.id === recipientId);
  const meta = getStatusMeta(engagement?.status);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{ sx: { borderRadius: 1, overflow: 'hidden' } }}
    >
      <Box sx={{ bgcolor: meta.soft, borderTop: '6px solid', borderColor: meta.border }}>
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" gap={1} alignItems="center">
            <GroupsOutlinedIcon color="primary" />
            Connect with a teammate
          </Stack>
        </DialogTitle>
        <DialogContent>
          {engagement && (
            <Stack gap={2}>
              <Box>
                <Stack direction="row" gap={0.75} flexWrap="wrap" sx={{ mb: 0.75 }}>
                  <Chip label={engagement.subtitle} size="small" variant="outlined" />
                  <Chip label={meta.label} size="small" color={meta.color} />
                  <Chip label={`${engagement.progress}% progress`} size="small" variant="outlined" />
                </Stack>
                <Typography variant="h3">{engagement.title}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>{engagement.goal}</Typography>
              </Box>

              <TextField select label="Connect with" value={recipientId} onChange={(event) => setRecipientId(event.target.value)} fullWidth>
                {engagement.teammates.map((teammate) => (
                  <MenuItem key={teammate.id} value={teammate.id}>
                    <Stack direction="row" gap={1} alignItems="center">
                      <UserAvatar user={teammate} size="sm" />
                      <Box>
                        <Typography variant="body2" fontWeight={700}>{teammate.name}</Typography>
                        <Typography variant="caption">{teammate.department}</Typography>
                      </Box>
                    </Stack>
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                autoFocus
                label="Note"
                multiline
                minRows={3}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="What do you want to coordinate, clarify, or offer?"
                value={message}
              />
            </Stack>
          )}
        </DialogContent>
      </Box>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          disabled={!recipient || !message.trim()}
          endIcon={<SendOutlinedIcon />}
          onClick={() => onSend(recipient, message.trim())}
          variant="contained"
        >
          Send Note
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const CompanyDashboardOverview = ({ calendarEvents, calendarProps, isAdmin }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [engagement, setEngagement] = useState(null);
  const [team, setTeam] = useState('All Teams');
  const companyPriorities = useMemo(() => priorities.filter((priority) => priority.company), []);
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
  const objectiveRows = useMemo(() => sortedPriorities.flatMap((priority) => (
    (priority.keyObjectives || [])
      .filter((objective) => objectiveMatchesTeam(objective, team))
      .map((objective) => ({
        goal: getObjectiveGoal(objective),
        objective,
        priority,
        progress: getObjectiveProgress(objective),
      }))
  )).sort((a, b) => {
    const aMeta = getStatusMeta(a.objective.status);
    const bMeta = getStatusMeta(b.objective.status);
    return aMeta.order - bMeta.order || a.progress - b.progress || a.objective.title.localeCompare(b.objective.title);
  }), [sortedPriorities, team]);

  const statusCounts = statusGroups.map((group) => ({
    ...group,
    count: sortedPriorities.filter((priority) => group.statuses.includes(getPriorityStatus(priority))).length,
  }));
  const averageObjectiveProgress = averageProgress(sortedPriorities, getPriorityProgress);
  const sendEngagementNote = (recipient, message) => {
    addNotification({
      actionPath: engagement.actionPath,
      actor: user,
      body: message,
      channel: 'in_app',
      notificationType: 'teammate_note',
      recipient,
      sourceId: engagement.id,
      sourceType: engagement.type,
      title: `${user.name} connected with you about ${engagement.title}`,
    });
    setEngagement(null);
  };

  return (
    <Stack gap={2}>
      <ExecutiveSignalHeader
        averageObjectiveProgress={averageObjectiveProgress}
        objectiveCount={sortedPriorities.length}
        prioritiesShown={sortedPriorities.length}
        statusCounts={statusCounts}
        team={team}
        teamOptions={teamOptions}
        totalPriorities={companyPriorities.length}
        onTeamChange={setTeam}
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(3, minmax(0, 1fr))' }, gap: 1.35 }}>
        {sortedPriorities.map((priority) => (
          <ObjectiveCard
            key={priority.id}
            priority={priority}
            onOpen={() => navigate(`/dashboard/company/priorities/${priority.id}`)}
          />
        ))}
      </Box>

      <ObjectiveTracker objectiveRows={objectiveRows} onEngage={setEngagement} />
      <PillarCoverage companyPriorities={companyPriorities} onEngage={setEngagement} />

      <Box sx={{ minWidth: 0 }}>
        <CalendarPanel
          {...calendarProps}
          events={calendarEvents}
          isAdmin={isAdmin}
          scope="organization"
        />
      </Box>

      <TeammateEngagementDialog
        engagement={engagement}
        onClose={() => setEngagement(null)}
        onSend={sendEngagementNote}
        open={Boolean(engagement)}
      />
    </Stack>
  );
};

export default CompanyDashboardOverview;
