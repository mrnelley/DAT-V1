import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import { Autocomplete, Box, Button, Checkbox, FormControl, InputLabel, MenuItem, Select, TextField } from '@mui/material';
import { motion } from 'framer-motion';
import { users } from '../../data/mockData';

const FilterPanel = ({ open }) => {
  if (!open) return null;
  return (
    <Box component={motion.div} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} sx={{ overflow: 'hidden', mb: 2 }}>
      <Box sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 2, boxShadow: 1 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
          <Autocomplete multiple options={users} getOptionLabel={(option) => option.name} renderInput={(params) => <TextField {...params} label="Filter People" />} />
          <Autocomplete options={['Lease-Up', 'Maintenance', 'Compliance']} renderInput={(params) => <TextField {...params} label="Filter Priorities" />} />
          <FormControl>
            <InputLabel>Filter Teams</InputLabel>
            <Select label="Filter Teams" defaultValue="All Hands on Deck">
              {['All Hands on Deck', 'Leadership', 'Operations', 'Resident Services'].map((team) => <MenuItem key={team} value={team}>{team}</MenuItem>)}
            </Select>
          </FormControl>
          <Autocomplete multiple freeSolo options={['Q2', 'Company', 'Compliance']} renderInput={(params) => <TextField {...params} label="Filter Tags" />} />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
          <Checkbox />
          <Box sx={{ flex: 1 }}>Company Priority</Box>
          <Button startIcon={<CloseOutlinedIcon />}>Clear Filter</Button>
        </Box>
      </Box>
    </Box>
  );
};

export default FilterPanel;
