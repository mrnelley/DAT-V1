import { Autocomplete, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import { motion } from 'framer-motion';
import { users } from '../../data/mockData';
import { formatDateTime } from '../../utils/formatters';

const AddStuckModal = ({ open, onClose, onSave }) => (
  <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
    <DialogTitle>Add New Stuck</DialogTitle>
    <DialogContent component={motion.div} initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} sx={{ display: 'grid', gap: 2, pt: 1 }}>
      <TextField label="Stuck Description" multiline minRows={4} required />
      <Autocomplete options={users} getOptionLabel={(option) => option.name} renderInput={(params) => <TextField {...params} label="Need Help From" required />} />
      <TextField label="Stuck Since" value={formatDateTime(new Date())} InputProps={{ readOnly: true }} />
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Cancel</Button>
      <Button variant="contained" onClick={onSave}>Save</Button>
    </DialogActions>
  </Dialog>
);

export default AddStuckModal;
