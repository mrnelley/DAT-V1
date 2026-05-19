import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import MoreHorizOutlinedIcon from '@mui/icons-material/MoreHorizOutlined';
import CloudQueueIcon from '@mui/icons-material/CloudQueue';
import { Box, Card, CardContent, IconButton, LinearProgress, Tooltip, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { getGaugeStatus, statusColorMap } from '../../utils/statusColors';
import { formatCompact } from '../../utils/formatters';
import { useActionFeedback } from '../../context/ActionFeedbackContext';
import UserAvatar from './UserAvatar';

const KpiGaugeCard = ({ metric, onClick, dense = false }) => {
  const { unavailable } = useActionFeedback();
  const status = getGaugeStatus(metric.current, metric.yellow, metric.green);
  const percent = Math.min(100, Math.round((metric.current / metric.target) * 100));
  const positive = metric.delta >= 0;
  const SourceIcon = metric.source === 'Salesforce' ? CloudQueueIcon : EditOutlinedIcon;

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
      sx={{ minWidth: dense ? 180 : 220, cursor: 'pointer' }}
    >
      <CardContent sx={{ p: dense ? 2 : 2.25 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h4" title={metric.title} noWrap>{metric.title}</Typography>
            <Typography variant="caption" title={metric.subtitle} noWrap display="block">{metric.subtitle}</Typography>
          </Box>
          <IconButton size="small" aria-label={`More options for ${metric.title}`} onClick={(event) => { event.stopPropagation(); unavailable('metric options are not connected to persistence yet.'); }}>
            <MoreHorizOutlinedIcon fontSize="small" />
          </IconButton>
        </Box>

        <Box sx={{ position: 'relative', height: dense ? 70 : 86, mt: 1.5 }}>
          <Box
            component={motion.div}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: percent / 100 }}
            transition={{ type: 'spring', stiffness: 60, damping: 20, delay: 0.3 }}
            sx={{
              transformOrigin: 'left',
              position: 'absolute',
              left: 6,
              right: 6,
              bottom: 6,
              height: dense ? 58 : 72,
              borderRadius: '90px 90px 0 0',
              background: (theme) => theme.palette[statusColorMap[status].split('.')[0]].main,
              clipPath: 'polygon(0 100%, 50% 0, 100% 100%)',
              opacity: 0.18,
            }}
          />
          <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'end center' }}>
            <Typography variant={dense ? 'h3' : 'h2'} color={statusColorMap[status]}>
              {formatCompact(metric.current)}
            </Typography>
          </Box>
        </Box>

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
