import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import { Avatar, Box, FormControl, InputAdornment, InputLabel, MenuItem, Select, Tab, Table, TableBody, TableCell, TableHead, TableRow, Tabs, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { metrics } from '../../data/mockData';
import PageWrapper from '../layout/PageWrapper';

const periods = ['Weekly', 'Monthly', 'Quarterly', 'Period', 'Annual'];

const DataTablePage = () => {
  const [tab, setTab] = useState(0);
  return (
    <PageWrapper>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', mb: 2 }}>
        <Typography variant="h1" sx={{ flex: 1 }}>My Data Table ({metrics.length})</Typography>
        <FormControl size="small" sx={{ minWidth: 220 }}><InputLabel>Configuration</InputLabel><Select label="Configuration" defaultValue="Default"><MenuItem value="Default">Default</MenuItem></Select></FormControl>
      </Box>
      <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ mb: 2 }}>{periods.map((period) => <Tab key={period} label={period} />)}</Tabs>
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 180 }}><InputLabel>Date Range</InputLabel><Select label="Date Range" defaultValue="Last 13 Weeks"><MenuItem value="Last 13 Weeks">Last 13 Weeks</MenuItem></Select></FormControl>
        <TextField size="small" placeholder="Search metrics" InputProps={{ startAdornment: <InputAdornment position="start"><SearchOutlinedIcon /></InputAdornment> }} />
      </Box>
      <Box sx={{ overflowX: 'auto', bgcolor: 'background.paper', borderRadius: 2 }}>
        <Table stickyHeader>
          <TableHead><TableRow>{['Metric Name', 'Current', 'Target', 'Average', 'Week of Mar 14', 'Week of Mar 7', 'Week of Feb 28'].map((head) => <TableCell key={head}>{head}</TableCell>)}</TableRow></TableHead>
          <TableBody>
            <TableRow><TableCell colSpan={7} sx={{ bgcolor: 'background.default', fontWeight: 700 }}>MY KPIs</TableCell></TableRow>
            {metrics.map((metric) => (
              <TableRow key={metric.id} hover>
                <TableCell sx={{ minWidth: 260 }}><Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}><Avatar sx={{ width: 24, height: 24 }}>{metric.owner.initials}</Avatar><Box><Typography color="primary" fontWeight={700}>{metric.title}</Typography><Typography variant="caption">{metric.subtitle}</Typography></Box></Box></TableCell>
                <TableCell>{metric.current}</TableCell><TableCell>{metric.target}</TableCell><TableCell>{Math.round(metric.history.reduce((a, b) => a + b, 0) / metric.history.length)}</TableCell>
                {metric.history.slice(-3).map((value, index) => <TableCell key={index} align="right" sx={{ fontFamily: 'monospace' }}>{value}</TableCell>)}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </PageWrapper>
  );
};

export default DataTablePage;
