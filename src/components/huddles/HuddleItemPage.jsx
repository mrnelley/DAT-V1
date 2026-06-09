import { Box, Button, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useOperatingData } from '../../context/OperatingDataContext';
import PageWrapper from '../layout/PageWrapper';

const HuddleItemPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addHuddleItem, getHuddle } = useOperatingData();
  const huddle = getHuddle(id);
  const [form, setForm] = useState({ detail: '', title: '', type: 'discussion' });
  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  if (!huddle) return null;

  const save = () => {
    if (!form.title.trim()) return;
    addHuddleItem(huddle.id, { ...form, id: `huddle-item-${Date.now()}` });
    navigate(`/huddles/${huddle.id}`);
  };

  return (
    <PageWrapper>
      <Box sx={{ maxWidth: 720 }}>
        <Typography variant="h1">Add Huddle Item</Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>{huddle.name}</Typography>
        <Stack gap={2}>
          <TextField label="Item title" value={form.title} onChange={update('title')} required />
          <TextField select label="Item type" value={form.type} onChange={update('type')}>
            <MenuItem value="discussion">Discussion</MenuItem>
            <MenuItem value="decision">Decision</MenuItem>
            <MenuItem value="stuck">Stuck</MenuItem>
            <MenuItem value="follow_up">Follow-up</MenuItem>
          </TextField>
          <TextField label="Detail" value={form.detail} onChange={update('detail')} multiline minRows={4} />
          <Stack direction="row" gap={1}>
            <Button onClick={() => navigate(`/huddles/${huddle.id}`)}>Cancel</Button>
            <Button variant="contained" onClick={save} disabled={!form.title.trim()}>Add Item</Button>
          </Stack>
        </Stack>
      </Box>
    </PageWrapper>
  );
};

export default HuddleItemPage;
