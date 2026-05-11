import { useEffect, useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Select, Stack, TextField } from '@mui/material';
import { compassStatuses, toDateInputValue, waypointRepresentations } from '../../utils/waypoints';

const emptyForm = (date) => ({
  title: '',
  date,
  endDate: '',
  representation: 'Waypoint',
  compassStatus: 'on_course',
  department: '',
  property: '',
  whyItMatters: '',
  whoItImpacts: '',
  supportNeeded: '',
  outcomeExpected: '',
});

const WaypointFormDialog = ({ defaultDate, onClose, onCreate, open }) => {
  const [form, setForm] = useState(emptyForm(defaultDate || toDateInputValue(new Date())));

  useEffect(() => {
    if (open) {
      setForm(emptyForm(defaultDate || toDateInputValue(new Date())));
    }
  }, [defaultDate, open]);

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleCreate = () => {
    if (!form.title.trim()) {
      return;
    }

    onCreate({ ...form, title: form.title.trim() });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Stack gap={2} sx={{ mt: 1 }}>
          <TextField label="Title" value={form.title} onChange={update('title')} required fullWidth />
          <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
            <TextField label="Date" type="date" value={form.date} onChange={update('date')} InputLabelProps={{ shrink: true }} fullWidth />
            <FormControl fullWidth>
              <InputLabel>Representation</InputLabel>
              <Select label="Representation" value={form.representation} onChange={update('representation')}>
                {waypointRepresentations.map((representation) => (
                  <MenuItem key={representation} value={representation}>{representation}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
          <FormControl>
            <InputLabel>Status</InputLabel>
            <Select label="Status" value={form.compassStatus} onChange={update('compassStatus')}>
              {Object.entries(compassStatuses).map(([value, status]) => (
                <MenuItem key={value} value={value}>{status.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
            <TextField label="Property" value={form.property} onChange={update('property')} fullWidth />
            <TextField label="Department" value={form.department} onChange={update('department')} fullWidth />
          </Stack>
          <TextField label="Why It Matters" value={form.whyItMatters} onChange={update('whyItMatters')} multiline minRows={2} />
          <TextField label="Who It Impacts" value={form.whoItImpacts} onChange={update('whoItImpacts')} />
          <TextField label="Support Needed" value={form.supportNeeded} onChange={update('supportNeeded')} multiline minRows={2} />
          <TextField label="Outcome Expected" value={form.outcomeExpected} onChange={update('outcomeExpected')} multiline minRows={2} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleCreate}>Add</Button>
      </DialogActions>
    </Dialog>
  );
};

export default WaypointFormDialog;
