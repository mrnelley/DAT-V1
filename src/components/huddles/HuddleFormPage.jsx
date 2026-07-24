import { Box, Button, Checkbox, FormControlLabel, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useOperatingData } from '../../context/OperatingDataContext';
import { useAuth } from '../../hooks/useAuth';
import PageWrapper from '../layout/PageWrapper';

const today = () => new Date().toISOString().slice(0, 10);

const buildForm = (user, huddle) => ({
  date: huddle?.date || today(),
  description: huddle?.description || '',
  memberIds: huddle?.memberIds || [user.id],
  name: huddle?.name || '',
  recurrence: huddle?.recurrence || 'Weekly',
  teamsLink: huddle?.teamsLink || '',
  weeklyTrackerPromptEnabled: Boolean(huddle?.weeklyTrackerPrompt),
  weeklyTrackerPromptRecipient: huddle?.weeklyTrackerPrompt?.recipientEmail || '',
});

const HuddleFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addHuddle, getHuddle, updateHuddle, users } = useOperatingData();
  const existing = id ? getHuddle(id) : null;
  const [form, setForm] = useState(() => buildForm(user, existing));

  useEffect(() => setForm(buildForm(user, existing)), [existing, user]);

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const save = () => {
    if (!form.name.trim() || !form.memberIds.length) return;
    const huddleValues = {
      date: form.date,
      description: form.description,
      memberIds: form.memberIds,
      name: form.name,
      recurrence: form.recurrence,
      teamsLink: form.teamsLink,
      teamsCardDispatches: existing?.teamsCardDispatches || [],
      weeklyTrackerPrompt: form.weeklyTrackerPromptEnabled
        ? {
          cardEndpoint: '/api/teams/weekly-tracker-goals-card',
          recipientEmail: form.weeklyTrackerPromptRecipient.trim(),
        }
        : null,
    };

    if (existing) {
      updateHuddle(existing.id, huddleValues);
      navigate(`/huddles/${existing.id}`);
      return;
    }

    const huddleId = `huddle-${Date.now()}`;
    addHuddle({
      ...huddleValues,
      agenda: [],
      id: huddleId,
      items: [],
      ownerId: user.id,
      when: form.date === today() ? 'today' : 'future',
    });
    navigate(`/huddles/${huddleId}`);
  };

  return (
    <PageWrapper>
      <Box sx={{ maxWidth: 760 }}>
        <Typography variant="h1">{existing ? 'Huddle Settings' : 'Schedule Huddle'}</Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>Set the operating rhythm and choose the people who should be in the room.</Typography>
        <Stack gap={2}>
          <TextField label="Huddle name" value={form.name} onChange={update('name')} required />
          <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
            <TextField label="Date" type="date" value={form.date} onChange={update('date')} InputLabelProps={{ shrink: true }} fullWidth />
            <TextField label="Recurrence" value={form.recurrence} onChange={update('recurrence')} fullWidth />
          </Stack>
          <TextField
            select
            label="Members"
            value={form.memberIds}
            onChange={update('memberIds')}
            SelectProps={{ multiple: true }}
            fullWidth
          >
            {users.map((candidate) => <MenuItem key={candidate.id} value={candidate.id}>{candidate.name} - {candidate.department}</MenuItem>)}
          </TextField>
          <TextField label="Description" value={form.description} onChange={update('description')} multiline minRows={3} />
          <TextField label="Teams meeting link (optional)" value={form.teamsLink} onChange={update('teamsLink')} />
          <FormControlLabel
            control={(
              <Checkbox
                checked={form.weeklyTrackerPromptEnabled}
                onChange={(event) => setForm((current) => ({ ...current, weeklyTrackerPromptEnabled: event.target.checked }))}
              />
            )}
            label="Enable Weekly Tracker Teams prompt"
          />
          {form.weeklyTrackerPromptEnabled && (
            <TextField
              label="Prompt recipient"
              value={form.weeklyTrackerPromptRecipient}
              onChange={update('weeklyTrackerPromptRecipient')}
            />
          )}
          <Stack direction="row" gap={1}>
            <Button onClick={() => navigate(existing ? `/huddles/${existing.id}` : '/huddles')}>Cancel</Button>
            <Button
              variant="contained"
              onClick={save}
              disabled={
                !form.name.trim()
                || !form.memberIds.length
                || (form.weeklyTrackerPromptEnabled && !form.weeklyTrackerPromptRecipient.trim())
              }
            >
              Save Huddle
            </Button>
          </Stack>
        </Stack>
      </Box>
    </PageWrapper>
  );
};

export default HuddleFormPage;
