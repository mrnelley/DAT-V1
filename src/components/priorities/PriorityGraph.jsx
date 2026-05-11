import { Box } from '@mui/material';
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const PriorityGraph = ({ priority }) => {
  const steps = [priority.start, Math.round(priority.current * 0.35), Math.round(priority.current * 0.6), priority.current];
  const data = steps.map((value, index) => ({ week: `W${index + 1}`, value }));
  return (
    <Box sx={{ height: 220 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid stroke="#e0e4ea" />
          <XAxis dataKey="week" />
          <YAxis />
          <Tooltip />
          <ReferenceLine y={priority.target} stroke="#006e5c" strokeDasharray="4 4" />
          <Area dataKey="value" stroke="#5eb8a8" fill="rgba(94,184,168,0.2)" strokeWidth={3} />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default PriorityGraph;
