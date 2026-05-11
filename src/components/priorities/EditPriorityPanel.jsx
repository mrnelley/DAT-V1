import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Autocomplete, Box, Button, Checkbox, Divider, Drawer, FormControl, FormControlLabel, IconButton, InputLabel, MenuItem, Radio, RadioGroup, Select, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { users } from '../../data/mockData';

const EditPriorityPanel = ({ open, onClose }) => {
  const [measurement, setMeasurement] = useState('Number');
  const [advanced, setAdvanced] = useState(false);

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', sm: 420 }, bgcolor: 'background.paper' } }}>
      <Box component={motion.div} initial={{ x: 420 }} animate={{ x: 0 }} transition={{ type: 'spring', stiffness: 280, damping: 26 }} sx={{ p: 2.5 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography variant="h3">Edit Priority</Typography>
          <IconButton aria-label="Close priority panel" onClick={onClose}><CloseIcon /></IconButton>
        </Stack>
        <Stack gap={2}>
          <TextField label="Priority Name" required fullWidth />
          <Autocomplete options={users} getOptionLabel={(option) => option.name} renderInput={(params) => <TextField {...params} label="Owner" required />} />
          <Box>
            <Typography variant="h4" sx={{ mb: 1 }}>Success Measurement</Typography>
            <ToggleButtonGroup exclusive value={measurement} onChange={(_, value) => value && setMeasurement(value)} fullWidth>
              {['Number', 'Task', 'Rollup'].map((item) => <ToggleButton key={item} value={item}>{item}</ToggleButton>)}
            </ToggleButtonGroup>
          </Box>
          {measurement === 'Number' && (
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
              <TextField label="Start Value" />
              <TextField label="Current Value" />
              <TextField label="Target" />
              <FormControl>
                <InputLabel>Current Value Source</InputLabel>
                <Select label="Current Value Source" defaultValue="Manual Entry">
                  <MenuItem value="Manual Entry">Manual Entry</MenuItem>
                  <MenuItem value="Connect a Metric">Connect a Metric</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
          {measurement === 'Task' && <TextField label="Task Count" helperText="Completion is based on open versus completed tasks." />}
          {measurement === 'Rollup' && <Autocomplete multiple options={['Lease-Up Velocity', 'Work Orders Closed']} renderInput={(params) => <TextField {...params} label="Dependent Priorities" />} />}
          <Box>
            <Typography variant="h4">Color Status</Typography>
            <RadioGroup defaultValue="Calculated">
              <FormControlLabel value="Calculated" control={<Radio />} label="Calculated" />
              <FormControlLabel value="User Driven" control={<Radio />} label="User Driven" />
            </RadioGroup>
          </Box>
          <Divider><Button endIcon={<ExpandMoreIcon />} onClick={() => setAdvanced((value) => !value)}>ADVANCED</Button></Divider>
          {advanced && (
            <Stack gap={2}>
              <FormControl>
                <InputLabel>Visibility</InputLabel>
                <Select label="Visibility" defaultValue="Everyone">
                  {['Everyone', 'Selected Users', 'Selected Teams'].map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControlLabel control={<Checkbox />} label="Company Priority" />
              <Autocomplete options={['Operational Excellence', 'Resident Experience']} renderInput={(params) => <TextField {...params} label="Annual Initiatives" />} />
              <Autocomplete multiple freeSolo options={['Q2', 'Company']} renderInput={(params) => <TextField {...params} label="Tags" />} />
              <Button startIcon={<AddCircleOutlineIcon />} variant="outlined">Add Task</Button>
            </Stack>
          )}
          <Button variant="contained" color="success">Save</Button>
          <Button variant="outlined">Save and Add Another</Button>
          <Button onClick={onClose}>Cancel</Button>
        </Stack>
      </Box>
    </Drawer>
  );
};

export default EditPriorityPanel;
