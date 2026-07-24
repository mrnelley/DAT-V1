import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import { Autocomplete, Box, Button, Checkbox, FormControl, InputLabel, MenuItem, Select, TextField } from '@mui/material';
import { motion } from 'framer-motion';
import { useActionFeedback } from '../../context/ActionFeedbackContext';
import { useOperatingData } from '../../context/OperatingDataContext';

const FilterPanel = ({ open }) => {
  const { unavailable } = useActionFeedback();
  const { departments, enterprisePriorities, users } = useOperatingData();
  const tags = [...new Set(enterprisePriorities.flatMap((priority) => priority.tags || []))];
  if (!open) return null;
  return (
    <Box component={motion.div} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} sx={{ overflow: 'hidden', mb: 2 }}>
      <Box sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 2, boxShadow: 1 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
          <Autocomplete multiple options={users} getOptionLabel={(option) => option.name} renderInput={(params) => <TextField {...params} label="Filter People" />} />
          <Autocomplete options={enterprisePriorities} getOptionLabel={(option) => option.name} renderInput={(params) => <TextField {...params} label="Filter Priorities" />} />
          <FormControl>
            <InputLabel>Filter Teams</InputLabel>
            <Select label="Filter Teams" defaultValue="">
              <MenuItem value="">All departments</MenuItem>
              {departments.map((department) => <MenuItem key={department} value={department}>{department}</MenuItem>)}
            </Select>
          </FormControl>
          <Autocomplete multiple freeSolo options={tags} renderInput={(params) => <TextField {...params} label="Filter Tags" />} />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
          <Checkbox />
          <Box sx={{ flex: 1 }}>Enterprise Priority</Box>
          <Button startIcon={<CloseOutlinedIcon />} onClick={() => unavailable('filter state is not persisted outside this prototype panel.')}>Clear Filter</Button>
        </Box>
      </Box>
    </Box>
  );
};

export default FilterPanel;
