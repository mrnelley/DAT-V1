import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { Autocomplete, Box, Button, Drawer, FormControl, IconButton, InputLabel, MenuItem, Select, Stack, TextField, Tooltip, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { q2Roadmap, users } from '../../data/mockData';

const blankObjective = () => ({
  id: `objective-${Date.now()}-${Math.random()}`,
  kpi: '',
  owner: null,
  status: 'Steady',
  target: '',
  title: '',
});

const EditPriorityPanel = ({ open, onClose, onSave, strategicPlan }) => {
  const [name, setName] = useState('');
  const [pillarId, setPillarId] = useState(strategicPlan.pillars[0]?.id || '');
  const [objectives, setObjectives] = useState([blankObjective()]);

  const updateObjective = (id, field, value) => setObjectives((current) => current.map((objective) => (
    objective.id === id ? { ...objective, [field]: value } : objective
  )));
  const addObjective = () => setObjectives((current) => [...current, blankObjective()]);
  const removeObjective = (id) => setObjectives((current) => current.filter((objective) => objective.id !== id));
  const ready = name.trim()
    && pillarId
    && objectives.length > 0
    && objectives.every((objective) => objective.title.trim() && objective.owner && objective.kpi.trim() && objective.target.trim());
  const reset = () => {
    setName('');
    setObjectives([blankObjective()]);
  };
  const save = (addAnother = false) => {
    if (!ready) return;

    const pillar = strategicPlan.pillars.find((candidate) => candidate.id === pillarId);
    const keyObjectives = objectives.map((objective, index) => ({
      department: objective.owner.department,
      id: objective.id,
      kpis: [{
        currentLabel: '',
        id: `kpi-${Date.now()}-${index}`,
        progress: 0,
        status: objective.status,
        target: objective.target.trim(),
        title: objective.kpi.trim(),
      }],
      notes: '',
      owner: objective.owner,
      ownerIds: [objective.owner.id],
      status: objective.status,
      title: objective.title.trim(),
      workplanAccess: objective.owner.department,
      workplanSummary: '',
      workplanTitle: '',
    }));

    onSave({
      children: [],
      company: true,
      description: `${q2Roadmap.quarter} Enterprise Priority aligned to ${pillar?.name || 'the strategic plan'}.`,
      id: `q2-priority-${Date.now()}`,
      keyObjectives,
      name: name.trim(),
      period: q2Roadmap.quarter,
      roadmapStatus: keyObjectives.some((objective) => ['Alert', 'Off Course'].includes(objective.status))
        ? 'Alert'
        : keyObjectives.some((objective) => ['Watch', 'Needs Attention'].includes(objective.status))
          ? 'Watch'
          : 'Steady',
      strategicPillar: pillar?.name || '',
      strategicPillarId: pillarId,
      strategicPlan: strategicPlan.name,
      type: 'ROLLUP',
    });
    reset();
    if (!addAnother) onClose();
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ 'aria-label': 'Edit Enterprise Priority panel', sx: { width: { xs: '100%', sm: 560 }, bgcolor: 'background.paper' } }}>
      <Box component={motion.div} initial={{ x: 560 }} animate={{ x: 0 }} transition={{ type: 'spring', stiffness: 280, damping: 26 }} sx={{ p: 2.5 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h3">Edit Enterprise Priority</Typography>
            <Typography variant="body2">The priority rolls up its Key Objectives; each objective owns its KPI and status.</Typography>
          </Box>
          <IconButton title="Close Enterprise Priority panel" aria-label="Close Enterprise Priority panel" onClick={onClose}><CloseIcon /></IconButton>
        </Stack>
        <Stack gap={2}>
          <TextField label="Enterprise Priority Name" value={name} onChange={(event) => setName(event.target.value)} required fullWidth />
          <Stack direction={{ xs: 'column', sm: 'row' }} gap={1}>
            <TextField label="Quarter" value={q2Roadmap.quarter} fullWidth InputProps={{ readOnly: true }} />
            <FormControl fullWidth>
              <InputLabel>Strategic Pillar</InputLabel>
              <Select label="Strategic Pillar" value={pillarId} onChange={(event) => setPillarId(event.target.value)}>
                {strategicPlan.pillars.map((pillar) => (
                  <MenuItem key={pillar.id} value={pillar.id}>{pillar.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <Stack gap={1.25}>
            {objectives.map((objective, index) => (
              <Box key={objective.id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.25 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1} sx={{ mb: 1 }}>
                  <Typography variant="h4">Key Objective {index + 1}</Typography>
                  {objectives.length > 1 && (
                    <Tooltip title={`Remove Key Objective ${index + 1}`}>
                      <IconButton aria-label={`Remove Key Objective ${index + 1}`} onClick={() => removeObjective(objective.id)} size="small"><DeleteOutlineIcon /></IconButton>
                    </Tooltip>
                  )}
                </Stack>
                <Stack gap={1.25}>
                  <TextField label="Key Objective" value={objective.title} onChange={(event) => updateObjective(objective.id, 'title', event.target.value)} required fullWidth />
                  <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.25}>
                    <Autocomplete
                      options={users}
                      getOptionLabel={(option) => option.name}
                      value={objective.owner}
                      onChange={(_, value) => updateObjective(objective.id, 'owner', value)}
                      renderInput={(params) => <TextField {...params} label="Objective Owner" required />}
                      fullWidth
                    />
                    <TextField select label="Objective Status" value={objective.status} onChange={(event) => updateObjective(objective.id, 'status', event.target.value)} fullWidth>
                      {q2Roadmap.statusOptions.map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
                    </TextField>
                  </Stack>
                  <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.25}>
                    <TextField label={`KPI - End of ${q2Roadmap.quarter}`} value={objective.kpi} onChange={(event) => updateObjective(objective.id, 'kpi', event.target.value)} required fullWidth />
                    <TextField label="KPI Target" value={objective.target} onChange={(event) => updateObjective(objective.id, 'target', event.target.value)} required fullWidth />
                  </Stack>
                </Stack>
              </Box>
            ))}
            <Button startIcon={<AddCircleOutlineIcon />} variant="outlined" onClick={addObjective}>Add Key Objective</Button>
          </Stack>

          <Typography variant="body2">
            The Enterprise Priority signal is calculated from its objective statuses. It does not have a separate owner, KPI, or manually entered health signal.
          </Typography>
          <Button variant="contained" color="success" disabled={!ready} onClick={() => save(false)}>Save</Button>
          <Button variant="outlined" disabled={!ready} onClick={() => save(true)}>Save and Add Another</Button>
          <Button onClick={onClose}>Cancel</Button>
        </Stack>
      </Box>
    </Drawer>
  );
};

export default EditPriorityPanel;
