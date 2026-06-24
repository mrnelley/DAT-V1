import { Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField } from '@mui/material';
import { useEffect, useState } from 'react';
import { users } from '../../data/mockData';

const buildForm = (user, initialTask) => ({
  description: '',
  helpFromId: '',
  sourceId: initialTask?.id || '',
  personStuckId: user.id,
});

const AddStuckModal = ({ initialTask = null, onClose, onSave, open, tasks, user }) => {
  const [form, setForm] = useState(() => buildForm(user, initialTask));

  useEffect(() => {
    if (open) setForm(buildForm(user, initialTask));
  }, [initialTask, open, user]);

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const save = () => {
    const sourceTask = tasks.find((task) => task.id === form.sourceId);
    const helpFrom = users.find((candidate) => candidate.id === form.helpFromId);
    if (!sourceTask || !helpFrom || !form.description.trim()) return;

    onSave({
      description: form.description.trim(),
      helpFrom,
      id: `stuck-${Date.now()}`,
      personStuck: user,
      personStuckId: user.id,
      since: new Date().toISOString(),
      sourceId: sourceTask.id,
      sourceLabel: sourceTask.description || sourceTask.title,
      sourceType: sourceTask.sourceType || 'queued_task',
      status: 'active',
    });
  };

  return (
    <Dialog aria-labelledby="issue-stuck-dialog-title" open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle id="issue-stuck-dialog-title">Issue a Stuck</DialogTitle>
      <DialogContent>
        <Stack gap={2} sx={{ pt: 1 }}>
          <TextField select label="Task I am stuck on" value={form.sourceId} onChange={update('sourceId')} fullWidth required>
            {tasks.map((task) => (
              <MenuItem key={task.id} value={task.id}>
                {task.description || task.title} - {task.sourceType === 'weekly_action_item' ? 'Weekly Action Item' : 'Day-to-Day Tasks'}
              </MenuItem>
            ))}
          </TextField>
          <TextField label="Stuck Description" value={form.description} onChange={update('description')} multiline minRows={3} required />
          <TextField select label="Need Help From" value={form.helpFromId} onChange={update('helpFromId')} fullWidth required>
            {users.filter((candidate) => candidate.id !== user.id).map((candidate) => (
              <MenuItem key={candidate.id} value={candidate.id}>{candidate.name} - {candidate.department}</MenuItem>
            ))}
          </TextField>
          <TextField label="Person Stuck" value={`${user.name} - ${user.department}`} InputProps={{ readOnly: true }} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={save}
          disabled={!form.description.trim() || !form.helpFromId || !form.sourceId}
        >
          Issue Stuck
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddStuckModal;
