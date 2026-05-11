import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import MoreHorizOutlinedIcon from '@mui/icons-material/MoreHorizOutlined';
import { Box, Card, Chip, IconButton, LinearProgress, Stack, Tab, Tabs, Typography } from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { statusColorMap } from '../../utils/statusColors';
import UserAvatar from '../shared/UserAvatar';
import PriorityGraph from './PriorityGraph';
import PriorityHeatmap from './PriorityHeatmap';

const PriorityRow = ({ priority, depth = 0, expandedAll = false }) => {
  const [expanded, setExpanded] = useState(expandedAll);
  const [tab, setTab] = useState(0);
  const toggleExpanded = () => setExpanded((value) => !value);

  return (
    <Box sx={{ ml: depth ? 3 : 0, mb: 0.5 }}>
      <Card sx={{ overflow: 'hidden' }}>
        <Box
          onClick={toggleExpanded}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              toggleExpanded();
            }
          }}
          role="button"
          tabIndex={0}
          aria-expanded={expanded}
          aria-label={`${expanded ? 'Collapse' : 'Expand'} priority ${priority.name}`}
          sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '32px 40px minmax(220px, 1fr) 110px minmax(180px, 260px) 64px 44px' }, gap: 1, alignItems: 'center', p: 1.5, cursor: 'pointer' }}
        >
          <DragIndicatorIcon color="disabled" />
          <UserAvatar user={priority.owner} size="md" />
          <Box>
            <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
              <Typography variant="body1" fontWeight={700}>{priority.name}</Typography>
              {priority.company && <Chip label="COMPANY PRIORITY" size="small" sx={{ bgcolor: 'rgba(7,44,94,0.12)', color: 'primary.main' }} />}
              {priority.mine && <Chip label="MY PRIORITY" size="small" sx={{ bgcolor: 'rgba(94,184,168,0.15)', color: 'secondary.dark' }} />}
            </Stack>
          </Box>
          <Chip label={priority.type} size="small" variant="outlined" color={priority.type === 'TASK' ? 'secondary' : priority.type === 'ROLLUP' ? 'warning' : 'primary'} />
          <Box>
            <LinearProgress variant="determinate" value={priority.percent} sx={{ '& .MuiLinearProgress-bar': { bgcolor: statusColorMap[priority.status] } }} />
            <Typography variant="caption">{priority.start} · {priority.current} · {priority.target}</Typography>
          </Box>
          <Typography variant="h4" color={statusColorMap[priority.status]}>{priority.percent}%</Typography>
          <IconButton aria-label={`More options for priority ${priority.name}`} onClick={(event) => event.stopPropagation()}><MoreHorizOutlinedIcon /></IconButton>
        </Box>
        <AnimatePresence>
          {expanded && (
            <Box component={motion.div} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ type: 'spring', stiffness: 240, damping: 22 }} sx={{ overflow: 'hidden' }}>
              <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ bgcolor: 'background.default', p: 1.5, borderRadius: 1, mb: 1.5 }}>
                  <Typography variant="body2">{priority.description}</Typography>
                </Box>
                <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ mb: 1 }}>
                  <Tab label="GRAPH" />
                  <Tab label="HEATMAP" />
                </Tabs>
                {tab === 0 ? <PriorityGraph priority={priority} /> : <PriorityHeatmap values={priority.heatmap} />}
                {priority.children?.map((child) => <PriorityRow key={child.id} priority={child} depth={depth + 1} />)}
              </Box>
            </Box>
          )}
        </AnimatePresence>
      </Card>
    </Box>
  );
};

export default PriorityRow;
