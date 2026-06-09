import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import MoreHorizOutlinedIcon from '@mui/icons-material/MoreHorizOutlined';
import CloudQueueIcon from '@mui/icons-material/CloudQueue';
import { Box, Card, CardContent, Chip, IconButton, LinearProgress, Tooltip, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { motion } from 'framer-motion';
import { getGaugeStatus, statusColorMap, statusLabels } from '../../utils/statusColors';
import { formatCompact } from '../../utils/formatters';
import { useActionFeedback } from '../../context/ActionFeedbackContext';
import UserAvatar from './UserAvatar';

const statusChipColor = {
  at_risk: 'warning',
  off_track: 'error',
  on_track: 'success',
};

const rhythmPaths = [
  {
    d: 'M4 56 C36 56 45 82 76 78 C110 72 102 28 130 24 C160 20 144 102 178 92 C214 82 206 36 240 44 C272 52 280 56 316 56',
    opacity: 0.95,
    width: 4.5,
  },
  {
    d: 'M4 56 C36 34 68 80 104 56 C138 34 164 36 198 70 C232 104 264 24 316 56',
    opacity: 0.55,
    width: 1.8,
  },
  {
    d: 'M4 56 C48 76 74 30 112 48 C150 66 164 82 198 42 C234 0 260 70 316 56',
    opacity: 0.42,
    width: 1.4,
  },
  {
    d: 'M4 56 C44 46 76 44 106 58 C138 72 164 72 196 58 C236 40 274 48 316 56',
    opacity: 0.36,
    width: 1.2,
  },
];

const resolveThemeToken = (theme, token) => (
  token.split('.').reduce((value, key) => value?.[key], theme.palette) || theme.palette.primary.main
);

const MetricRhythmWave = ({ color, dense, metric, percent }) => {
  const glowId = `metric-wave-glow-${metric.id}`;

  return (
    <Box
      sx={{
        position: 'relative',
        height: dense ? 86 : 108,
        mt: 1.5,
        border: '1px solid',
        borderColor: alpha(color, 0.32),
        borderRadius: 1,
        overflow: 'hidden',
        bgcolor: '#041e42',
        boxShadow: `inset 0 0 26px ${alpha(color, 0.16)}`,
      }}
    >
      <Box
        component="svg"
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 320 112"
        preserveAspectRatio="none"
        sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      >
        <defs>
          <filter id={glowId} x="-20%" y="-50%" width="140%" height="200%">
            <feGaussianBlur stdDeviation="2.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <motion.g
          animate={{ x: [-8, 8, -8] }}
          transition={{ duration: 6.5, ease: 'easeInOut', repeat: Infinity }}
        >
          {rhythmPaths.map((path, index) => (
            <motion.path
              key={path.d}
              d={path.d}
              fill="none"
              filter={index === 0 ? `url(#${glowId})` : undefined}
              initial={{ opacity: 0, pathLength: 0 }}
              animate={{ opacity: path.opacity, pathLength: 1 }}
              transition={{ duration: 1.15, delay: index * 0.12, ease: 'easeOut' }}
              stroke={color}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={path.width}
            />
          ))}
        </motion.g>
      </Box>
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          p: 1.25,
          background: `linear-gradient(90deg, rgba(4, 30, 66, 0.82), rgba(4, 30, 66, 0.2) 46%, rgba(4, 30, 66, 0.72))`,
        }}
      >
        <Box>
          <Typography variant="caption" sx={{ color: alpha('#ffffff', 0.72), fontWeight: 800, textTransform: 'uppercase' }}>Current</Typography>
          <Typography variant={dense ? 'h3' : 'h2'} sx={{ color: '#ffffff' }}>
            {formatCompact(metric.current)}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="caption" sx={{ color: alpha('#ffffff', 0.72), fontWeight: 800, textTransform: 'uppercase' }}>To Goal</Typography>
          <Typography variant="h4" sx={{ color }}>{percent}%</Typography>
        </Box>
      </Box>
    </Box>
  );
};

const KpiGaugeCard = ({ metric, onClick, dense = false }) => {
  const { unavailable } = useActionFeedback();
  const theme = useTheme();
  const status = getGaugeStatus(metric.current, metric.yellow, metric.green);
  const percent = Math.min(100, Math.round((metric.current / metric.target) * 100));
  const positive = metric.delta >= 0;
  const SourceIcon = metric.source === 'Salesforce' ? CloudQueueIcon : EditOutlinedIcon;
  const statusColor = resolveThemeToken(theme, statusColorMap[status]);

  return (
    <Card
      component={motion.div}
      whileHover={{ y: -4, boxShadow: '0px 8px 24px rgba(7,44,94,0.15)' }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick?.();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Open details for ${metric.title}. Current value ${formatCompact(metric.current)} of target ${formatCompact(metric.target)}.`}
      title={`Open details for ${metric.title}`}
      sx={{ minWidth: dense ? 180 : 220, cursor: 'pointer' }}
    >
      <CardContent sx={{ p: dense ? 2 : 2.25 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h4" title={metric.title} noWrap>{metric.title}</Typography>
            <Typography variant="caption" title={metric.subtitle} noWrap display="block">{metric.subtitle}</Typography>
          </Box>
          <Chip label={statusLabels[status]} color={statusChipColor[status]} size="small" />
          <IconButton size="small" title={`More options for ${metric.title}`} aria-label={`More options for ${metric.title}`} onClick={(event) => { event.stopPropagation(); unavailable('metric options are not connected to persistence yet.'); }}>
            <MoreHorizOutlinedIcon fontSize="small" />
          </IconButton>
        </Box>

        <MetricRhythmWave color={statusColor} dense={dense} metric={metric} percent={percent} />

        <LinearProgress
          variant="determinate"
          value={percent}
          sx={{ my: 1.25, bgcolor: 'divider', '& .MuiLinearProgress-bar': { bgcolor: statusColorMap[status] } }}
        />
        <Box sx={{ display: 'flex', alignItems: 'center', color: positive ? 'success.main' : 'error.main', gap: 0.25 }}>
          {positive ? <ArrowUpwardIcon fontSize="inherit" /> : <ArrowDownwardIcon fontSize="inherit" />}
          <Typography variant="caption" color="inherit">
            {formatCompact(Math.abs(metric.delta))} | {Math.abs(metric.deltaPercent)}%
          </Typography>
        </Box>
        <Typography variant="caption">Updated: {metric.updated}</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1.25, gap: 1 }}>
          <UserAvatar user={metric.owner} size="sm" />
          <Typography variant="caption" title={metric.owner.name} sx={{ flex: 1 }} noWrap>{metric.owner.name}</Typography>
          <Tooltip title={metric.source}>
            <SourceIcon fontSize="small" color="primary" />
          </Tooltip>
        </Box>
      </CardContent>
    </Card>
  );
};

export default KpiGaugeCard;
