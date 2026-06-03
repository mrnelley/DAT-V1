import CloseIcon from '@mui/icons-material/Close';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { Area, AreaChart, CartesianGrid, Line, ReferenceLine, ResponsiveContainer, Tooltip as ChartTooltip, XAxis, YAxis } from 'recharts';
import { Box, Button, Chip, Dialog, DialogContent, IconButton, Stack, Switch, Tab, Tabs, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { useActionFeedback } from '../../context/ActionFeedbackContext';
import UserAvatar from './UserAvatar';

const periods = ['Weekly', 'Monthly', 'Quarterly', 'Annual', 'Period'];

const KpiDetailModal = ({ metric, open, onClose }) => {
  const { unavailable } = useActionFeedback();
  if (!metric) return null;
  const data = metric.history.map((value, index) => ({ date: `W${index + 1}`, value, target: metric.target }));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogContent
        component={motion.div}
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h2">{metric.title}</Typography>
            <Stack direction="row" alignItems="center" gap={1} sx={{ mt: 0.5 }}>
              <UserAvatar user={metric.owner} size="sm" />
              <Typography variant="body2">{metric.owner.name}</Typography>
            </Stack>
          </Box>
          <IconButton aria-label="Close KPI details" onClick={onClose}><CloseIcon /></IconButton>
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' }, gap: 3 }}>
          <Box>
            <Typography variant="caption">VALUE SOURCE</Typography>
            <Stack direction="row" alignItems="center" gap={1} sx={{ mt: 1, mb: 2 }}>
              <EditOutlinedIcon color="primary" fontSize="small" />
              <Typography variant="body1">{metric.source}</Typography>
            </Stack>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, mb: 2 }}>
              {[
                ['Start', metric.start],
                ['Current', metric.current],
                ['Target', metric.target],
              ].map(([label, value]) => (
                <Box key={label} sx={{ bgcolor: 'background.default', p: 1, borderRadius: 1 }}>
                  <Typography variant="caption">{label}</Typography>
                  <Typography variant="h4">{value}</Typography>
                </Box>
              ))}
            </Box>
            <Stack direction="row" gap={1} sx={{ mb: 2 }}>
              <Chip label={`Needs Attention ${metric.yellow}`} color="warning" size="small" />
              <Chip label={`On Track ${metric.green}`} color="success" size="small" />
            </Stack>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="body2">Show Target on Graph</Typography>
              <Switch defaultChecked color="secondary" />
            </Stack>
            <Button variant="outlined" color="secondary" sx={{ mt: 2 }} onClick={() => unavailable('manual KPI history entry is not connected yet.')}>Add Past Update</Button>
          </Box>
          <Box>
            <Typography component={motion.div} initial={{ opacity: 0 }} animate={{ opacity: 1 }} variant="h1">
              {metric.current}
            </Typography>
            <Tabs value={0} sx={{ mb: 2 }}>{periods.map((period) => <Tab key={period} label={period} />)}</Tabs>
            <Box sx={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="metricFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#5eb8a8" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#5eb8a8" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#e0e4ea" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <ChartTooltip />
                  <ReferenceLine y={metric.target} stroke="#006e5c" strokeDasharray="4 4" />
                  <Area dataKey="value" fill="url(#metricFill)" stroke="#072c5e" strokeWidth={2} />
                  <Line dataKey="target" stroke="#006e5c" strokeDasharray="4 4" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
            <Stack direction="row" gap={1} justifyContent="center">
              <Chip label="Current" color="primary" />
              <Chip label="Future" variant="outlined" color="warning" />
            </Stack>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default KpiDetailModal;
